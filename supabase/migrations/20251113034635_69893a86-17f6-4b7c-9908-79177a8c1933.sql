-- Fix "disponible" filter to include all products with stock > 0
-- Add family and rayon aggregations to include rupture products
-- Add dynamic sorting capability

CREATE OR REPLACE FUNCTION public.calculate_stock_valuation_paginated(
  p_tenant_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_status_filter TEXT DEFAULT NULL,
  p_rotation_filter TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_famille_filter UUID DEFAULT NULL,
  p_rayon_filter UUID DEFAULT NULL,
  p_sort_field TEXT DEFAULT 'valeur_stock',
  p_sort_direction TEXT DEFAULT 'desc'
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
BEGIN
  -- Calculate offset for pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Get default thresholds from alert_settings
  SELECT 
    COALESCE((setting_value->>'critical_threshold')::INTEGER, 2),
    COALESCE((setting_value->>'low_threshold')::INTEGER, 5),
    COALESCE((setting_value->>'max_threshold')::INTEGER, 10)
  INTO v_seuil_critique, v_seuil_faible, v_seuil_maximum
  FROM network_admin_settings
  WHERE tenant_id = p_tenant_id 
    AND setting_category = 'stock_alerts' 
    AND setting_key = 'thresholds'
  LIMIT 1;
  
  -- Fallback to hardcoded defaults if not found
  v_seuil_critique := COALESCE(v_seuil_critique, 2);
  v_seuil_faible := COALESCE(v_seuil_faible, 5);
  v_seuil_maximum := COALESCE(v_seuil_maximum, 10);

  RETURN (
    WITH stock_base AS (
      SELECT 
        p.id,
        p.tenant_id,
        p.code_cip,
        p.libelle_produit,
        p.famille_id,
        p.rayon_id,
        p.prix_achat,
        p.prix_vente_ttc,
        p.stock_limite,
        p.stock_faible,
        p.stock_critique,
        COALESCE(SUM(l.quantite_restante), 0)::INTEGER as stock_actuel,
        COALESCE(
          SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat)),
          0
        )::NUMERIC as valeur_stock,
        -- Cascade logic for effective thresholds (3 levels)
        COALESCE(p.stock_critique, v_seuil_critique) as seuil_critique_effectif,
        COALESCE(p.stock_faible, v_seuil_faible) as seuil_faible_effectif,
        COALESCE(p.stock_limite, v_seuil_maximum) as seuil_maximum_effectif,
        -- Calculate rotation score
        COALESCE(
          (
            SELECT COUNT(DISTINCT DATE(ml.date_mouvement))
            FROM mouvements_lots ml
            WHERE ml.produit_id = p.id 
              AND ml.tenant_id = p.tenant_id
              AND ml.type_mouvement = 'sortie'
              AND ml.date_mouvement >= NOW() - INTERVAL '30 days'
          ),
          0
        )::NUMERIC as rotation,
        -- Get last movement dates
        (
          SELECT MAX(date_mouvement)
          FROM mouvements_lots
          WHERE produit_id = p.id 
            AND tenant_id = p.tenant_id
            AND type_mouvement = 'entree'
        ) as date_derniere_entree,
        (
          SELECT MAX(date_mouvement)
          FROM mouvements_lots
          WHERE produit_id = p.id 
            AND tenant_id = p.tenant_id
            AND type_mouvement = 'sortie'
        ) as date_derniere_sortie
      FROM produits p
      LEFT JOIN lots l ON l.produit_id = p.id 
        AND l.tenant_id = p.tenant_id 
        AND l.quantite_restante > 0
      WHERE p.tenant_id = p_tenant_id
        AND p.is_active = true
        AND (p_search_term IS NULL OR 
             p.libelle_produit ILIKE '%' || p_search_term || '%' OR 
             p.code_cip ILIKE '%' || p_search_term || '%')
        AND (p_famille_filter IS NULL OR p.famille_id = p_famille_filter)
        AND (p_rayon_filter IS NULL OR p.rayon_id = p_rayon_filter)
      GROUP BY p.id, p.tenant_id, p.code_cip, p.libelle_produit, 
               p.famille_id, p.rayon_id, p.prix_achat, p.prix_vente_ttc,
               p.stock_limite, p.stock_faible, p.stock_critique
    ),
    stock_with_status AS (
      SELECT 
        *,
        -- Determine stock status using cascade thresholds
        CASE 
          WHEN stock_actuel = 0 THEN 'rupture'
          WHEN stock_actuel <= seuil_critique_effectif THEN 'critique'
          WHEN stock_actuel <= seuil_faible_effectif THEN 'faible'
          WHEN stock_actuel > seuil_maximum_effectif THEN 'surstock'
          ELSE 'normal'
        END as statut_stock
      FROM stock_base
    ),
    filtered_stock AS (
      SELECT *
      FROM stock_with_status
      WHERE 
        -- FIX: Handle "disponible" filter specially (stock > 0)
        (p_status_filter IS NULL 
         OR (p_status_filter = 'disponible' AND stock_actuel > 0)
         OR (p_status_filter != 'disponible' AND statut_stock = p_status_filter)
        )
        AND (p_rotation_filter IS NULL OR
          (p_rotation_filter = 'high' AND rotation >= 10) OR
          (p_rotation_filter = 'medium' AND rotation >= 3 AND rotation < 10) OR
          (p_rotation_filter = 'low' AND rotation > 0 AND rotation < 3) OR
          (p_rotation_filter = 'none' AND rotation = 0)
        )
    ),
    -- NEW: Calculate family aggregations on ALL filtered items (includes rupture)
    family_aggregations AS (
      SELECT 
        p.famille_id,
        f.libelle_famille as famille_libelle,
        COUNT(*)::INTEGER as product_count,
        SUM(fs.stock_actuel)::INTEGER as total_quantity,
        SUM(fs.valeur_stock)::NUMERIC as total_value
      FROM filtered_stock fs
      JOIN produits p ON p.id = fs.id
      LEFT JOIN famille_produit f ON f.id = p.famille_id
      WHERE p.famille_id IS NOT NULL AND p.tenant_id = p_tenant_id
      GROUP BY p.famille_id, f.libelle_famille
    ),
    -- NEW: Calculate rayon aggregations on ALL filtered items (includes rupture)
    rayon_aggregations AS (
      SELECT 
        p.rayon_id,
        r.libelle_rayon as rayon_libelle,
        COUNT(*)::INTEGER as product_count,
        SUM(fs.stock_actuel)::INTEGER as total_quantity,
        SUM(fs.valeur_stock)::NUMERIC as total_value
      FROM filtered_stock fs
      JOIN produits p ON p.id = fs.id
      LEFT JOIN rayons_produits r ON r.id = p.rayon_id
      WHERE p.rayon_id IS NOT NULL AND p.tenant_id = p_tenant_id
      GROUP BY p.rayon_id, r.libelle_rayon
    ),
    total_metrics AS (
      SELECT 
        COUNT(*)::INTEGER as total_count,
        COALESCE(SUM(valeur_stock), 0)::NUMERIC as total_value
      FROM filtered_stock
    ),
    paginated_items AS (
      SELECT 
        row_to_json(filtered_stock.*) as item_json
      FROM filtered_stock
      -- FIX: Dynamic sorting
      ORDER BY 
        CASE 
          WHEN p_sort_field = 'valeur_stock' AND p_sort_direction = 'desc' THEN valeur_stock
          WHEN p_sort_field = 'stock_actuel' AND p_sort_direction = 'desc' THEN stock_actuel::NUMERIC
          WHEN p_sort_field = 'rotation' AND p_sort_direction = 'desc' THEN rotation
          WHEN p_sort_field = 'prix_achat' AND p_sort_direction = 'desc' THEN prix_achat
        END DESC NULLS LAST,
        CASE 
          WHEN p_sort_field = 'valeur_stock' AND p_sort_direction = 'asc' THEN valeur_stock
          WHEN p_sort_field = 'stock_actuel' AND p_sort_direction = 'asc' THEN stock_actuel::NUMERIC
          WHEN p_sort_field = 'rotation' AND p_sort_direction = 'asc' THEN rotation
          WHEN p_sort_field = 'prix_achat' AND p_sort_direction = 'asc' THEN prix_achat
        END ASC NULLS LAST,
        CASE 
          WHEN p_sort_field = 'libelle_produit' AND p_sort_direction = 'asc' THEN libelle_produit
          WHEN p_sort_field = 'code_cip' AND p_sort_direction = 'asc' THEN code_cip
        END ASC NULLS LAST,
        CASE 
          WHEN p_sort_field = 'libelle_produit' AND p_sort_direction = 'desc' THEN libelle_produit
          WHEN p_sort_field = 'code_cip' AND p_sort_direction = 'desc' THEN code_cip
        END DESC NULLS LAST,
        -- Default fallback sort
        valeur_stock DESC
      LIMIT p_page_size
      OFFSET v_offset
    )
    SELECT jsonb_build_object(
      'items', (SELECT jsonb_agg(item_json) FROM paginated_items),
      'totalCount', (SELECT total_count FROM total_metrics),
      'totalValue', (SELECT total_value FROM total_metrics),
      'familyAggregations', (SELECT jsonb_agg(row_to_json(family_aggregations.*)) FROM family_aggregations),
      'rayonAggregations', (SELECT jsonb_agg(row_to_json(rayon_aggregations.*)) FROM rayon_aggregations),
      'page', p_page,
      'pageSize', p_page_size
    )
  );
END;
$$;