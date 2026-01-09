-- Fix remaining SQL functions to use NULLIF(value, 0) for stock threshold cascade

-- 1. Fix get_low_stock_products function
CREATE OR REPLACE FUNCTION public.get_low_stock_products(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  nom TEXT,
  code_barre TEXT,
  stock_actuel INTEGER,
  stock_faible INTEGER,
  stock_critique INTEGER,
  stock_limite INTEGER,
  categorie_nom TEXT,
  prix_vente NUMERIC,
  statut_stock TEXT,
  urgence TEXT
) AS $$
DECLARE
  v_low_threshold INTEGER;
  v_critical_threshold INTEGER;
  v_max_threshold INTEGER;
BEGIN
  -- Get tenant default thresholds
  SELECT 
    COALESCE(low_stock_threshold, 5),
    COALESCE(critical_stock_threshold, 2),
    COALESCE(maximum_stock_threshold, 10)
  INTO v_low_threshold, v_critical_threshold, v_max_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- Fallback if no settings
  v_low_threshold := COALESCE(v_low_threshold, 5);
  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_max_threshold := COALESCE(v_max_threshold, 10);

  RETURN QUERY
  WITH product_stock AS (
    SELECT 
      p.id,
      p.nom,
      p.code_barre,
      COALESCE(SUM(l.quantite_restante), 0)::INTEGER as stock_actuel,
      -- CASCADE with NULLIF to ignore 0 values
      COALESCE(NULLIF(p.stock_faible, 0), v_low_threshold) as seuil_faible,
      COALESCE(NULLIF(p.stock_critique, 0), v_critical_threshold) as seuil_critique,
      COALESCE(NULLIF(p.stock_limite, 0), v_max_threshold) as seuil_max,
      c.nom as cat_nom,
      p.prix_vente
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    LEFT JOIN public.categories c ON c.id = p.categorie_id
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
    GROUP BY p.id, p.nom, p.code_barre, p.stock_faible, p.stock_critique, p.stock_limite, c.nom, p.prix_vente
  )
  SELECT 
    ps.id,
    ps.nom,
    ps.code_barre,
    ps.stock_actuel,
    ps.seuil_faible,
    ps.seuil_critique,
    ps.seuil_max,
    ps.cat_nom,
    ps.prix_vente,
    CASE 
      WHEN ps.stock_actuel = 0 THEN 'rupture'
      WHEN ps.stock_actuel <= ps.seuil_critique THEN 'critique'
      WHEN ps.stock_actuel <= ps.seuil_faible THEN 'faible'
      WHEN ps.stock_actuel > ps.seuil_max THEN 'surstock'
      ELSE 'normal'
    END as statut_stock,
    CASE 
      WHEN ps.stock_actuel = 0 THEN 'critical'
      WHEN ps.stock_actuel <= ps.seuil_critique THEN 'danger'
      WHEN ps.stock_actuel <= ps.seuil_faible THEN 'warning'
      ELSE 'info'
    END as urgence
  FROM product_stock ps
  WHERE ps.stock_actuel <= ps.seuil_faible
  ORDER BY 
    CASE 
      WHEN ps.stock_actuel = 0 THEN 1
      WHEN ps.stock_actuel <= ps.seuil_critique THEN 2
      ELSE 3
    END,
    ps.stock_actuel ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix calculate_stock_valuation_paginated function
CREATE OR REPLACE FUNCTION public.calculate_stock_valuation_paginated(
  p_tenant_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50,
  p_search TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'valeur_stock',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_offset INTEGER;
  v_total_count INTEGER;
  v_total_pages INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  WITH stock_data AS (
    SELECT 
      p.id,
      p.nom,
      p.code_barre,
      p.prix_achat,
      p.prix_vente,
      c.nom as categorie_nom,
      COALESCE(SUM(l.quantite_restante), 0)::INTEGER as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- CASCADE corrigée avec NULLIF pour ignorer les 0
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_maximum
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    LEFT JOIN public.categories c ON c.id = p.categorie_id
    WHERE p.tenant_id = p_tenant_id 
      AND p.is_active = true
      AND (p_search IS NULL OR p.nom ILIKE '%' || p_search || '%' OR p.code_barre ILIKE '%' || p_search || '%')
      AND (p_category_id IS NULL OR p.categorie_id = p_category_id)
    GROUP BY p.id, p.nom, p.code_barre, p.prix_achat, p.prix_vente, p.stock_critique, p.stock_faible, p.stock_limite, c.nom
  ),
  filtered_data AS (
    SELECT 
      sd.*,
      CASE 
        WHEN sd.stock_actuel = 0 THEN 'rupture'
        WHEN sd.stock_actuel <= sd.seuil_critique THEN 'critique'
        WHEN sd.stock_actuel <= sd.seuil_faible THEN 'faible'
        WHEN sd.stock_actuel > sd.seuil_maximum THEN 'surstock'
        ELSE 'normal'
      END as statut_stock
    FROM stock_data sd
  ),
  status_filtered AS (
    SELECT * FROM filtered_data
    WHERE p_status IS NULL OR statut_stock = p_status
  ),
  counted AS (
    SELECT COUNT(*)::INTEGER as cnt FROM status_filtered
  ),
  sorted_data AS (
    SELECT * FROM status_filtered
    ORDER BY 
      CASE WHEN p_sort_by = 'valeur_stock' AND p_sort_order = 'desc' THEN valeur_stock END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'valeur_stock' AND p_sort_order = 'asc' THEN valeur_stock END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'stock_actuel' AND p_sort_order = 'desc' THEN stock_actuel END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'stock_actuel' AND p_sort_order = 'asc' THEN stock_actuel END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'nom' AND p_sort_order = 'desc' THEN nom END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'nom' AND p_sort_order = 'asc' THEN nom END ASC NULLS LAST,
      nom ASC
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT json_build_object(
    'products', COALESCE((SELECT json_agg(row_to_json(sorted_data)) FROM sorted_data), '[]'::json),
    'totalCount', (SELECT cnt FROM counted),
    'totalPages', CEIL((SELECT cnt FROM counted)::DECIMAL / p_page_size)::INTEGER,
    'currentPage', p_page
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;