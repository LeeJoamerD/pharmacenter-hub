
-- Fix critical sorting bug: ORDER BY was missing in subquery before LIMIT/OFFSET
-- This caused random rows to be selected, then sorted only within that random subset
-- Also fixes: stock sort was alphabetical (text) instead of numeric

DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id uuid,
  p_search text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_entree',
  p_sort_order text DEFAULT 'desc',
  p_limit integer DEFAULT 20,
  p_page integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset integer;
  v_total_count integer;
  v_result json;
  v_status_condition text;
  v_mapped_status text;
  v_order_clause text;
BEGIN
  v_offset := (p_page - 1) * p_limit;
  
  -- Map French status values to English database values
  v_mapped_status := CASE 
    WHEN lower(p_status_filter) = 'actif' THEN 'active'
    WHEN lower(p_status_filter) = 'expiré' THEN 'expired'
    WHEN lower(p_status_filter) = 'épuisé' THEN 'exhausted'
    WHEN lower(p_status_filter) = 'bientôt expiré' THEN 'expiring_soon'
    WHEN lower(p_status_filter) = 'all' THEN 'all'
    WHEN lower(p_status_filter) = 'tous' THEN 'all'
    ELSE p_status_filter
  END;
  
  -- Build status condition
  v_status_condition := CASE 
    WHEN v_mapped_status = 'all' THEN 'TRUE'
    WHEN v_mapped_status = 'active' THEN 'l.quantite_restante > 0 AND l.date_peremption > CURRENT_DATE'
    WHEN v_mapped_status = 'expired' THEN 'l.date_peremption <= CURRENT_DATE'
    WHEN v_mapped_status = 'exhausted' THEN 'l.quantite_restante <= 0'
    WHEN v_mapped_status = 'expiring_soon' THEN 'l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL ''90 days'' AND l.quantite_restante > 0'
    ELSE 'TRUE'
  END;

  -- Build ORDER BY clause with native types (not text cast)
  v_order_clause := CASE 
    WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'asc' THEN 'COALESCE(l.date_reception, l.created_at) ASC'
    WHEN p_sort_by = 'date_entree' THEN 'COALESCE(l.date_reception, l.created_at) DESC'
    WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'asc' THEN 'l.date_peremption ASC NULLS LAST'
    WHEN p_sort_by = 'date_peremption' THEN 'l.date_peremption DESC NULLS LAST'
    WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'asc' THEN 'l.quantite_restante ASC'
    WHEN p_sort_by = 'stock' THEN 'l.quantite_restante DESC'
    WHEN p_sort_by = 'numero_lot' AND lower(p_sort_order) = 'asc' THEN 'l.numero_lot ASC'
    WHEN p_sort_by = 'numero_lot' THEN 'l.numero_lot DESC'
    ELSE 'COALESCE(l.date_reception, l.created_at) DESC'
  END;

  -- Get total count
  EXECUTE format('
    SELECT COUNT(*)
    FROM lots l
    JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = $1
      AND (%s)
      AND (
        $2 IS NULL 
        OR p.libelle_produit ILIKE ''%%'' || $2 || ''%%''
        OR p.code_cip ILIKE ''%%'' || $2 || ''%%''
        OR COALESCE(p.code_barre_externe, '''') ILIKE ''%%'' || $2 || ''%%''
        OR l.numero_lot ILIKE ''%%'' || $2 || ''%%''
      )
  ', v_status_condition)
  INTO v_total_count
  USING p_tenant_id, p_search;

  -- Get paginated results with ORDER BY INSIDE the subquery (critical fix)
  EXECUTE format('
    SELECT json_build_object(
      ''lots'', COALESCE(json_agg(lot_data ORDER BY rn), ''[]''::json),
      ''count'', $4
    )
    FROM (
      SELECT 
        json_build_object(
          ''id'', l.id,
          ''tenant_id'', l.tenant_id,
          ''produit_id'', l.produit_id,
          ''numero_lot'', l.numero_lot,
          ''date_peremption'', l.date_peremption,
          ''date_reception'', l.date_reception,
          ''date_entree'', COALESCE(l.date_reception, l.created_at),
          ''quantite_initiale'', l.quantite_initiale,
          ''quantite_restante'', l.quantite_restante,
          ''prix_achat_unitaire'', l.prix_achat_unitaire,
          ''prix_vente_unitaire'', l.prix_vente_ttc,
          ''emplacement'', l.emplacement,
          ''notes'', l.notes,
          ''created_at'', l.created_at,
          ''updated_at'', l.updated_at,
          ''fournisseur_id'', l.fournisseur_id,
          ''produit'', json_build_object(
            ''id'', p.id,
            ''libelle_produit'', p.libelle_produit,
            ''code_cip'', p.code_cip,
            ''code_barre_externe'', p.code_barre_externe,
            ''niveau_detail'', p.niveau_detail,
            ''quantite_unites_details_source'', p.quantite_unites_details_source,
            ''produit_detail'', (
              SELECT COALESCE(json_agg(json_build_object(
                ''id'', pd.id,
                ''quantite_unites_details_source'', pd.quantite_unites_details_source
              )), ''[]''::json)
              FROM produits pd
              WHERE pd.id_produit_source = p.id
            )
          ),
          ''fournisseur'', CASE 
            WHEN f.id IS NOT NULL THEN json_build_object(
              ''id'', f.id,
              ''nom'', f.nom,
              ''telephone_appel'', f.telephone_appel,
              ''telephone_whatsapp'', f.telephone_whatsapp
            )
            ELSE NULL
          END
        ) AS lot_data,
        row_number() OVER () AS rn
      FROM lots l
      JOIN produits p ON l.produit_id = p.id
      LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id
      WHERE l.tenant_id = $1
        AND (%s)
        AND (
          $2 IS NULL 
          OR p.libelle_produit ILIKE ''%%%%%%%%'' || $2 || ''%%%%%%%%''
          OR p.code_cip ILIKE ''%%%%%%%%'' || $2 || ''%%%%%%%%''
          OR COALESCE(p.code_barre_externe, '''') ILIKE ''%%%%%%%%'' || $2 || ''%%%%%%%%''
          OR l.numero_lot ILIKE ''%%%%%%%%'' || $2 || ''%%%%%%%%''
        )
      ORDER BY %s
      LIMIT $3 OFFSET $5
    ) sub
  ', 
    v_status_condition,
    v_order_clause
  )
  INTO v_result
  USING p_tenant_id, p_search, p_limit, v_total_count, v_offset;

  RETURN COALESCE(v_result, json_build_object('lots', '[]'::json, 'count', 0));
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
