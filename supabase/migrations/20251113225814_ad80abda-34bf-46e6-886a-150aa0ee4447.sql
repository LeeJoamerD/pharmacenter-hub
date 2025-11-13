-- ============================================
-- CORRECTION FINALE: get_stock_alerts_with_products
-- Problème: Utilise des colonnes inexistantes (stock_actuel, seuil_alerte, stock_min, stock_max)
-- Solution: Calcul stock depuis lots + seuils en cascade + métriques globales
-- ============================================

DROP FUNCTION IF EXISTS public.get_stock_alerts_with_products(uuid,text,text,text,text,text,integer,integer);

CREATE OR REPLACE FUNCTION public.get_stock_alerts_with_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'stock_status',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_products JSONB;
  v_total_count BIGINT;
  v_total_alerts INT := 0;
  v_ruptures INT := 0;
  v_critiques INT := 0;
  v_faibles INT := 0;
  v_surstocks INT := 0;
  v_total_value NUMERIC := 0;
BEGIN
  -- Vérification d'autorisation
  IF NOT (public.is_system_admin() OR p_tenant_id = public.get_current_user_tenant_id()) THEN
    RAISE EXCEPTION 'Accès non autorisé à cette officine';
  END IF;

  -- CTE pour calculer le stock réel et les seuils depuis les lots
  WITH stock_calculs AS (
    SELECT 
      p.id,
      p.code_produit,
      p.nom,
      COALESCE(d.nom_dci, '') as dci,
      p.categorie,
      p.unite,
      p.prix_vente_ttc,
      p.famille_id,
      p.rayon_id,
      -- Calcul du stock réel depuis les lots
      COALESCE(SUM(l.quantite_restante), 0)::INTEGER AS stock_reel,
      -- Calcul de la valeur du stock
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) AS valeur_stock,
      -- Dernier mouvement
      MAX(l.date_reception) as dernier_mouvement,
      -- Application de la cascade pour les seuils
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id)::INTEGER AS seuil_maximum
    FROM public.produits p
    LEFT JOIN public.dci d ON d.id = p.dci_id AND d.tenant_id = p.tenant_id
    LEFT JOIN public.lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.code_produit, p.nom, d.nom_dci, p.categorie, p.unite, p.prix_vente_ttc, 
             p.famille_id, p.rayon_id, p.stock_critique, p.stock_faible, p.stock_limite, p.prix_achat
  ),
  -- CTE avec statut et rotation calculés
  stock_with_status AS (
    SELECT 
      *,
      -- Calcul du statut
      CASE 
        WHEN stock_reel = 0 THEN 'rupture'
        WHEN stock_reel > 0 AND stock_reel <= seuil_critique THEN 'critique'
        WHEN stock_reel > seuil_critique AND stock_reel <= seuil_faible THEN 'faible'
        WHEN seuil_maximum IS NOT NULL AND stock_reel > seuil_maximum THEN 'surstock'
        ELSE 'normal'
      END AS stock_status,
      -- Calcul de la rotation
      CASE 
        WHEN stock_reel <= seuil_faible THEN 'rapide'
        WHEN stock_reel <= seuil_maximum THEN 'normale'
        ELSE 'lente'
      END AS rotation,
      -- Jours sans mouvement
      CASE 
        WHEN dernier_mouvement IS NULL THEN 999
        ELSE EXTRACT(DAY FROM (NOW() - dernier_mouvement))::INTEGER
      END AS jours_sans_mouvement
    FROM stock_calculs
  ),
  -- CTE pour filtrer selon les critères
  filtered_stock AS (
    SELECT *
    FROM stock_with_status
    WHERE 
      (p_search IS NULL OR p_search = '' OR 
       nom ILIKE '%' || p_search || '%' OR 
       code_produit ILIKE '%' || p_search || '%' OR 
       dci ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR p_category = '' OR categorie = p_category)
      AND (p_status IS NULL OR p_status = '' OR stock_status = p_status)
  )
  -- Compter le total et calculer les métriques globales
  SELECT 
    COUNT(*)::BIGINT,
    -- Métriques globales sur TOUTES les données filtrées
    COUNT(*) FILTER (WHERE stock_status IN ('rupture', 'critique', 'faible', 'surstock'))::INT,
    COUNT(*) FILTER (WHERE stock_status = 'rupture')::INT,
    COUNT(*) FILTER (WHERE stock_status = 'critique')::INT,
    COUNT(*) FILTER (WHERE stock_status = 'faible')::INT,
    COUNT(*) FILTER (WHERE stock_status = 'surstock')::INT,
    COALESCE(SUM(valeur_stock), 0)::NUMERIC
  INTO 
    v_total_count,
    v_total_alerts,
    v_ruptures,
    v_critiques,
    v_faibles,
    v_surstocks,
    v_total_value
  FROM filtered_stock;

  -- Récupérer les produits paginés avec tri
  WITH sorted_data AS (
    SELECT *
    FROM filtered_stock
    ORDER BY 
      CASE WHEN p_sort_by = 'product_name' AND p_sort_order = 'asc' THEN nom END ASC,
      CASE WHEN p_sort_by = 'product_name' AND p_sort_order = 'desc' THEN nom END DESC,
      CASE WHEN p_sort_by = 'stock_level' AND p_sort_order = 'asc' THEN stock_reel END ASC,
      CASE WHEN p_sort_by = 'stock_level' AND p_sort_order = 'desc' THEN stock_reel END DESC,
      CASE WHEN p_sort_by = 'category' AND p_sort_order = 'asc' THEN categorie END ASC,
      CASE WHEN p_sort_by = 'category' AND p_sort_order = 'desc' THEN categorie END DESC,
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_order = 'desc' THEN 
        CASE stock_status
          WHEN 'rupture' THEN 1
          WHEN 'critique' THEN 2
          WHEN 'faible' THEN 3
          WHEN 'surstock' THEN 4
          ELSE 5
        END 
      END ASC,
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_order = 'asc' THEN 
        CASE stock_status
          WHEN 'rupture' THEN 1
          WHEN 'critique' THEN 2
          WHEN 'faible' THEN 3
          WHEN 'surstock' THEN 4
          ELSE 5
        END 
      END DESC,
      nom ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', id,
        'tenant_id', p_tenant_id,
        'code_produit', code_produit,
        'nom_produit', nom,
        'dci', dci,
        'stock_actuel', stock_reel,
        'seuil_critique', seuil_critique,
        'seuil_faible', seuil_faible,
        'seuil_limite', seuil_maximum,
        'unite', COALESCE(unite, 'unité'),
        'categorie', categorie,
        'famille_id', famille_id,
        'rayon_id', rayon_id,
        'prix_unitaire', prix_vente_ttc,
        'valeur_stock', valeur_stock,
        'dernier_mouvement', dernier_mouvement,
        'stock_status', stock_status,
        'rotation', rotation,
        'jours_sans_mouvement', jours_sans_mouvement
      )
    ),
    '[]'::json
  )
  INTO v_products
  FROM sorted_data;

  -- Construire la réponse finale avec données + métriques
  v_result := json_build_object(
    'data', v_products,
    'total', v_total_count,
    'metrics', json_build_object(
      'total_alerts', v_total_alerts,
      'ruptures', v_ruptures,
      'critiques', v_critiques,
      'faibles', v_faibles,
      'surstocks', v_surstocks,
      'total_value', v_total_value
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur dans get_stock_alerts_with_products: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.get_stock_alerts_with_products IS 
'Retourne les alertes de stock avec calcul depuis les lots, seuils en cascade et métriques globales. Stock réel = SUM(lots.quantite_restante). Valeur = SUM(quantite * prix_achat_unitaire).';