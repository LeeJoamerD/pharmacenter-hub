-- Hotfix: repair search_lots_paginated (400 Bad Request)
-- - Replace non-existent lots.prix_vente_unitaire with lots.prix_vente_ttc
-- - Add produit_detail array for UI compatibility
-- - Add sorting support for numero_lot

DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id uuid,
  p_search text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_entree',
  p_sort_order text DEFAULT 'desc',
  p_page_size integer DEFAULT 20,
  p_page integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset int;
  v_total_count int;
  v_result json;
  v_status text;
BEGIN
  v_offset := GREATEST((COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 20), 0);

  -- Map French status filters to internal values
  v_status := CASE lower(COALESCE(p_status_filter, 'all'))
    WHEN 'actif' THEN 'active'
    WHEN 'expire' THEN 'expired'
    WHEN 'epuise' THEN 'empty'
    WHEN 'expiration_proche' THEN 'expiring30'
    WHEN 'active' THEN 'active'
    WHEN 'expired' THEN 'expired'
    WHEN 'empty' THEN 'empty'
    WHEN 'expiring30' THEN 'expiring30'
    WHEN 'expiring60' THEN 'expiring60'
    ELSE 'all'
  END;

  -- Total count
  SELECT COUNT(*)
    INTO v_total_count
  FROM lots l
  INNER JOIN produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search IS NULL
      OR p_search = ''
      OR l.numero_lot ILIKE '%' || p_search || '%'
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
    )
    AND (
      v_status = 'all'
      OR (v_status = 'active' AND l.quantite_restante > 0 AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE))
      OR (v_status = 'expired' AND l.date_peremption IS NOT NULL AND l.date_peremption <= CURRENT_DATE)
      OR (v_status = 'empty' AND l.quantite_restante <= 0)
      OR (v_status = 'expiring30' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= (CURRENT_DATE + 30))
      OR (v_status = 'expiring60' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= (CURRENT_DATE + 60))
    );

  -- Paginated results + dynamic sorting
  SELECT json_build_object(
    'lots', COALESCE(
      json_agg(lot_row ORDER BY
        CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'desc' THEN COALESCE(lot_row.date_reception, lot_row.created_at) END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'asc' THEN COALESCE(lot_row.date_reception, lot_row.created_at) END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'desc' THEN lot_row.date_peremption END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'asc' THEN lot_row.date_peremption END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'desc' THEN lot_row.quantite_restante END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'asc' THEN lot_row.quantite_restante END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'desc' THEN lot_row.produit_libelle END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'asc' THEN lot_row.produit_libelle END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'numero_lot' AND lower(p_sort_order) = 'desc' THEN lot_row.numero_lot END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'numero_lot' AND lower(p_sort_order) = 'asc' THEN lot_row.numero_lot END ASC NULLS LAST
      ),
      '[]'::json
    ),
    'count', v_total_count
  )
  INTO v_result
  FROM (
    SELECT
      l.id,
      l.numero_lot,
      l.date_peremption,
      l.date_reception,
      l.created_at,
      l.quantite_initiale,
      l.quantite_restante,
      l.quantite_restante AS quantite,
      l.prix_achat_unitaire,
      l.prix_vente_ttc,
      l.prix_vente_ttc AS prix_vente_unitaire,
      l.emplacement,
      l.tenant_id,
      l.produit_id,
      l.fournisseur_id,
      p.libelle_produit AS produit_libelle,
      json_build_object(
        'id', p.id,
        'libelle_produit', p.libelle_produit,
        'code_cip', p.code_cip,
        'niveau_detail', p.niveau_detail,
        'id_produit_source', p.id_produit_source,
        'quantite_unites_details_source', p.quantite_unites_details_source
      ) AS produit,
      COALESCE(
        CASE
          WHEN p.id_produit_source IS NOT NULL THEN (
            SELECT json_build_array(
              json_build_object(
                'id', ps.id,
                'libelle_produit', ps.libelle_produit,
                'code_cip', ps.code_cip,
                'quantite_unites_details_source', p.quantite_unites_details_source
              )
            )
            FROM produits ps
            WHERE ps.id = p.id_produit_source
            LIMIT 1
          )
          ELSE '[]'::json
        END,
        '[]'::json
      ) AS produit_detail,
      CASE
        WHEN f.id IS NOT NULL THEN json_build_object(
          'id', f.id,
          'nom', f.nom,
          'telephone', f.telephone
        )
        ELSE NULL
      END AS fournisseur
    FROM lots l
    INNER JOIN produits p ON l.produit_id = p.id
    LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search IS NULL
        OR p_search = ''
        OR l.numero_lot ILIKE '%' || p_search || '%'
        OR p.libelle_produit ILIKE '%' || p_search || '%'
        OR p.code_cip ILIKE '%' || p_search || '%'
      )
      AND (
        v_status = 'all'
        OR (v_status = 'active' AND l.quantite_restante > 0 AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE))
        OR (v_status = 'expired' AND l.date_peremption IS NOT NULL AND l.date_peremption <= CURRENT_DATE)
        OR (v_status = 'empty' AND l.quantite_restante <= 0)
        OR (v_status = 'expiring30' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= (CURRENT_DATE + 30))
        OR (v_status = 'expiring60' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= (CURRENT_DATE + 60))
      )
    LIMIT COALESCE(p_page_size, 20)
    OFFSET v_offset
  ) lot_row;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon, authenticated, service_role;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
