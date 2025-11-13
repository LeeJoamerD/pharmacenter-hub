-- Force drop ALL versions of calculate_stock_valuation_paginated to ensure clean state
DROP FUNCTION IF EXISTS calculate_stock_valuation_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_stock_valuation_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS calculate_stock_valuation_paginated(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_stock_valuation_paginated CASCADE;

-- Recreate the correct version with proper alert_settings threshold handling
CREATE OR REPLACE FUNCTION calculate_stock_valuation_paginated(
  p_tenant_id UUID,
  p_page_size INTEGER DEFAULT 50,
  p_page_offset INTEGER DEFAULT 0,
  p_status_filter TEXT DEFAULT 'all',
  p_rotation_filter TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'value_desc',
  p_famille_id UUID DEFAULT NULL,
  p_rayon_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_evolution_period TEXT DEFAULT '30'
)
RETURNS TABLE (
  id UUID,
  code_produit TEXT,
  nom_produit TEXT,
  famille_nom TEXT,
  rayon_nom TEXT,
  stock_actuel NUMERIC,
  prix_achat_moyen NUMERIC,
  prix_vente_ht NUMERIC,
  valeur_stock NUMERIC,
  taux_rotation NUMERIC,
  evolution_prix NUMERIC,
  statut_stock TEXT,
  total_count BIGINT
) AS $$
DECLARE
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_max_threshold INTEGER;
BEGIN
  -- Load thresholds directly from alert_settings integer columns with fallback defaults
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5),
    COALESCE(maximum_stock_threshold, 10)
  INTO v_critical_threshold, v_low_threshold, v_max_threshold
  FROM alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;
  
  -- If no settings found, use hardcoded defaults
  IF v_critical_threshold IS NULL THEN
    v_critical_threshold := 2;
    v_low_threshold := 5;
    v_max_threshold := 10;
  END IF;

  RETURN QUERY
  WITH base_products AS (
    SELECT 
      p.id,
      p.code_produit,
      p.nom_produit,
      f.nom_famille as famille_nom,
      r.nom_rayon as rayon_nom,
      COALESCE(p.stock_actuel, 0) as stock_actuel,
      COALESCE(p.prix_achat_moyen, 0) as prix_achat_moyen,
      COALESCE(p.prix_vente_ht, 0) as prix_vente_ht,
      COALESCE(p.stock_actuel, 0) * COALESCE(p.prix_achat_moyen, 0) as valeur_stock,
      COALESCE(p.taux_rotation, 0) as taux_rotation,
      COALESCE(p.evolution_prix, 0) as evolution_prix,
      CASE
        WHEN COALESCE(p.stock_actuel, 0) = 0 THEN 'rupture'
        WHEN COALESCE(p.stock_actuel, 0) <= v_critical_threshold THEN 'critique'
        WHEN COALESCE(p.stock_actuel, 0) <= v_low_threshold THEN 'faible'
        WHEN COALESCE(p.stock_actuel, 0) >= v_max_threshold THEN 'surstock'
        ELSE 'normal'
      END as statut_stock
    FROM produits p
    LEFT JOIN familles f ON p.famille_id = f.id
    LEFT JOIN rayons r ON p.rayon_id = r.id
    WHERE p.tenant_id = p_tenant_id
      AND p.statut_actif = true
      AND (p_famille_id IS NULL OR p.famille_id = p_famille_id)
      AND (p_rayon_id IS NULL OR p.rayon_id = p_rayon_id)
      AND (p_search IS NULL OR 
           p.nom_produit ILIKE '%' || p_search || '%' OR 
           p.code_produit ILIKE '%' || p_search || '%')
  ),
  filtered_products AS (
    SELECT *
    FROM base_products
    WHERE (p_status_filter = 'all' OR statut_stock = p_status_filter)
      AND (p_rotation_filter = 'all' OR
           (p_rotation_filter = 'fast' AND taux_rotation > 10) OR
           (p_rotation_filter = 'medium' AND taux_rotation BETWEEN 5 AND 10) OR
           (p_rotation_filter = 'slow' AND taux_rotation < 5))
  ),
  sorted_products AS (
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM filtered_products
    ORDER BY
      CASE WHEN p_sort_by = 'value_desc' THEN valeur_stock END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'value_asc' THEN valeur_stock END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'stock_desc' THEN stock_actuel END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'stock_asc' THEN stock_actuel END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'rotation_desc' THEN taux_rotation END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'rotation_asc' THEN taux_rotation END ASC NULLS LAST,
      nom_produit ASC
    LIMIT p_page_size
    OFFSET p_page_offset
  )
  SELECT 
    sp.id,
    sp.code_produit,
    sp.nom_produit,
    sp.famille_nom,
    sp.rayon_nom,
    sp.stock_actuel,
    sp.prix_achat_moyen,
    sp.prix_vente_ht,
    sp.valeur_stock,
    sp.taux_rotation,
    sp.evolution_prix,
    sp.statut_stock,
    sp.total_count
  FROM sorted_products sp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;