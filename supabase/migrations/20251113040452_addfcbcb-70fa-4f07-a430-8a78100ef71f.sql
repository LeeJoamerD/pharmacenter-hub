-- Fix calculate_stock_valuation_paginated to read thresholds from alert_settings
CREATE OR REPLACE FUNCTION calculate_stock_valuation_paginated(
  p_tenant_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 50,
  p_status_filter TEXT DEFAULT 'all',
  p_rotation_filter TEXT DEFAULT 'all',
  p_search_query TEXT DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'nom_produit',
  p_sort_direction TEXT DEFAULT 'asc'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_seuil_critique INTEGER;
  v_seuil_faible INTEGER;
  v_seuil_maximum INTEGER;
  v_result JSONB;
  v_total_count INTEGER;
  v_items JSONB := '[]'::JSONB;
  v_metrics JSONB;
  v_aggregations JSONB;
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;

  -- Get thresholds from alert_settings (level 2 of cascade)
  SELECT 
    critical_stock_threshold,
    low_stock_threshold,
    maximum_stock_threshold
  INTO v_seuil_critique, v_seuil_faible, v_seuil_maximum
  FROM alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- Fallback to hardcoded defaults if not found (level 3 of cascade)
  v_seuil_critique := COALESCE(v_seuil_critique, 2);
  v_seuil_faible := COALESCE(v_seuil_faible, 5);
  v_seuil_maximum := COALESCE(v_seuil_maximum, 10);

  -- Build aggregated data with cascade logic
  WITH stock_data AS (
    SELECT 
      p.id,
      p.nom_produit,
      p.code_interne,
      p.dci,
      p.famille_id,
      f.nom_famille,
      p.rayon_id,
      r.nom_rayon,
      COALESCE(SUM(l.quantite_disponible), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_disponible * l.prix_achat_unitaire), 0) as valeur_stock,
      COALESCE(p.stock_critique, v_seuil_critique) as seuil_critique,
      COALESCE(p.stock_faible, v_seuil_faible) as seuil_faible,
      COALESCE(p.stock_maximum, v_seuil_maximum) as seuil_maximum,
      CASE 
        WHEN COALESCE(SUM(l.quantite_disponible), 0) = 0 THEN 'rupture'
        WHEN COALESCE(SUM(l.quantite_disponible), 0) <= COALESCE(p.stock_critique, v_seuil_critique) THEN 'critique'
        WHEN COALESCE(SUM(l.quantite_disponible), 0) <= COALESCE(p.stock_faible, v_seuil_faible) THEN 'faible'
        WHEN COALESCE(SUM(l.quantite_disponible), 0) >= COALESCE(p.stock_maximum, v_seuil_maximum) THEN 'surstock'
        ELSE 'normal'
      END as statut_stock
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id
    LEFT JOIN familles_produits f ON f.id = p.famille_id AND f.tenant_id = p.tenant_id
    LEFT JOIN rayons r ON r.id = p.rayon_id AND r.tenant_id = p.tenant_id
    WHERE p.tenant_id = p_tenant_id
      AND p.statut_produit = 'actif'
    GROUP BY p.id, p.nom_produit, p.code_interne, p.dci, p.famille_id, f.nom_famille, 
             p.rayon_id, r.nom_rayon, p.stock_critique, p.stock_faible, p.stock_maximum
  ),
  filtered_data AS (
    SELECT *
    FROM stock_data
    WHERE 
      -- Status filter
      (p_status_filter = 'all' OR 
       (p_status_filter = 'disponible' AND stock_actuel > 0) OR
       (p_status_filter = 'rupture' AND statut_stock = 'rupture') OR
       (p_status_filter = 'critique' AND statut_stock = 'critique') OR
       (p_status_filter = 'faible' AND statut_stock = 'faible') OR
       (p_status_filter = 'surstock' AND statut_stock = 'surstock'))
      -- Search filter
      AND (p_search_query IS NULL OR 
           nom_produit ILIKE '%' || p_search_query || '%' OR
           code_interne ILIKE '%' || p_search_query || '%' OR
           dci ILIKE '%' || p_search_query || '%')
  ),
  aggregations_data AS (
    SELECT 
      jsonb_build_object(
        'by_family', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'famille_id', famille_id,
              'nom_famille', COALESCE(nom_famille, 'Sans famille'),
              'valeur_totale', SUM(valeur_stock),
              'nombre_produits', COUNT(*),
              'stock_total', SUM(stock_actuel)
            )
          )
          FROM (
            SELECT famille_id, nom_famille, valeur_stock, stock_actuel
            FROM stock_data
            GROUP BY famille_id, nom_famille, valeur_stock, stock_actuel
          ) fam
          GROUP BY famille_id, nom_famille
        ),
        'by_rayon', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'rayon_id', rayon_id,
              'nom_rayon', COALESCE(nom_rayon, 'Sans rayon'),
              'valeur_totale', SUM(valeur_stock),
              'nombre_produits', COUNT(*),
              'stock_total', SUM(stock_actuel)
            )
          )
          FROM (
            SELECT rayon_id, nom_rayon, valeur_stock, stock_actuel
            FROM stock_data
            GROUP BY rayon_id, nom_rayon, valeur_stock, stock_actuel
          ) ray
          GROUP BY rayon_id, nom_rayon
        )
      ) as agg
  )
  SELECT agg INTO v_aggregations FROM aggregations_data;

  -- Get total count
  SELECT COUNT(*) INTO v_total_count FROM filtered_data;

  -- Build items with dynamic sorting
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nom_produit', nom_produit,
      'code_interne', code_interne,
      'dci', dci,
      'famille_id', famille_id,
      'nom_famille', nom_famille,
      'rayon_id', rayon_id,
      'nom_rayon', nom_rayon,
      'stock_actuel', stock_actuel,
      'valeur_stock', valeur_stock,
      'seuil_critique', seuil_critique,
      'seuil_faible', seuil_faible,
      'seuil_maximum', seuil_maximum,
      'statut_stock', statut_stock
    )
  ) INTO v_items
  FROM (
    SELECT *
    FROM filtered_data
    ORDER BY 
      CASE WHEN p_sort_field = 'nom_produit' AND p_sort_direction = 'asc' THEN nom_produit END ASC,
      CASE WHEN p_sort_field = 'nom_produit' AND p_sort_direction = 'desc' THEN nom_produit END DESC,
      CASE WHEN p_sort_field = 'stock_actuel' AND p_sort_direction = 'asc' THEN stock_actuel END ASC,
      CASE WHEN p_sort_field = 'stock_actuel' AND p_sort_direction = 'desc' THEN stock_actuel END DESC,
      CASE WHEN p_sort_field = 'valeur_stock' AND p_sort_direction = 'asc' THEN valeur_stock END ASC,
      CASE WHEN p_sort_field = 'valeur_stock' AND p_sort_direction = 'desc' THEN valeur_stock END DESC,
      CASE WHEN p_sort_field = 'statut_stock' AND p_sort_direction = 'asc' THEN statut_stock END ASC,
      CASE WHEN p_sort_field = 'statut_stock' AND p_sort_direction = 'desc' THEN statut_stock END DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sorted_data;

  -- Build metrics
  SELECT jsonb_build_object(
    'valeur_totale', COALESCE(SUM(valeur_stock), 0),
    'nombre_produits', COUNT(*),
    'stock_disponible', COALESCE(SUM(CASE WHEN stock_actuel > 0 THEN 1 ELSE 0 END), 0),
    'stock_rupture', COALESCE(SUM(CASE WHEN statut_stock = 'rupture' THEN 1 ELSE 0 END), 0),
    'stock_critique', COALESCE(SUM(CASE WHEN statut_stock = 'critique' THEN 1 ELSE 0 END), 0),
    'stock_faible', COALESCE(SUM(CASE WHEN statut_stock = 'faible' THEN 1 ELSE 0 END), 0),
    'stock_surstock', COALESCE(SUM(CASE WHEN statut_stock = 'surstock' THEN 1 ELSE 0 END), 0)
  ) INTO v_metrics
  FROM stock_data;

  -- Build final result
  v_result := jsonb_build_object(
    'items', COALESCE(v_items, '[]'::JSONB),
    'total', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total_count::NUMERIC / p_page_size),
    'metrics', v_metrics,
    'aggregations', v_aggregations
  );

  RETURN v_result;
END;
$$;