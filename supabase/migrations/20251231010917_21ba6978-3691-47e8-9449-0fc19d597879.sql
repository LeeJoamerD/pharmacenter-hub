-- Drop existing function first due to return type change, then recreate
DROP FUNCTION IF EXISTS public.search_lots_paginated(UUID, TEXT, TEXT, TEXT, TEXT, INT, INT);

-- Recreate with proper schema alignment
CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id UUID,
  p_search TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'date_entree',
  p_sort_order TEXT DEFAULT 'desc',
  p_page_size INT DEFAULT 20,
  p_page INT DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total_count INT;
  v_result JSON;
  v_status TEXT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
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

  -- Get total count
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
      OR (v_status = 'expiring30' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
      OR (v_status = 'expiring60' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
    );

  -- Get paginated results with dynamic sorting
  SELECT json_build_object(
    'lots', COALESCE(json_agg(lot_row ORDER BY 
      CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'desc' THEN COALESCE(lot_row.date_reception, lot_row.created_at) END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'asc' THEN COALESCE(lot_row.date_reception, lot_row.created_at) END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'desc' THEN lot_row.date_peremption END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'asc' THEN lot_row.date_peremption END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'desc' THEN lot_row.quantite_restante END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'asc' THEN lot_row.quantite_restante END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'desc' THEN lot_row.produit_libelle END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'asc' THEN lot_row.produit_libelle END ASC NULLS LAST
    ), '[]'::json),
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
      l.prix_vente_unitaire,
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
        OR (v_status = 'expiring30' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
        OR (v_status = 'expiring60' AND l.quantite_restante > 0 AND l.date_peremption IS NOT NULL AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
      )
    ORDER BY 
      CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'desc' THEN COALESCE(l.date_reception, l.created_at) END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'date_entree' AND lower(p_sort_order) = 'asc' THEN COALESCE(l.date_reception, l.created_at) END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'desc' THEN l.date_peremption END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND lower(p_sort_order) = 'asc' THEN l.date_peremption END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'desc' THEN l.quantite_restante END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'stock' AND lower(p_sort_order) = 'asc' THEN l.quantite_restante END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'desc' THEN p.libelle_produit END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND lower(p_sort_order) = 'asc' THEN p.libelle_produit END ASC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) AS lot_row;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(UUID, TEXT, TEXT, TEXT, TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(UUID, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(UUID, TEXT, TEXT, TEXT, TEXT, INT, INT) TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';