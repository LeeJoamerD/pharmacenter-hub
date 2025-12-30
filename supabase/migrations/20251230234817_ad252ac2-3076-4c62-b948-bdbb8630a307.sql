-- Drop existing function signatures to avoid conflicts
DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);

-- Recreate the function with correct schema (no p.categorie, proper mapping)
CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id uuid,
  p_search_term text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_peremption',
  p_sort_order text DEFAULT 'asc',
  p_page_size integer DEFAULT 20,
  p_current_page integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total_count integer;
  v_lots json;
  v_status_mapped text;
  v_sort_mapped text;
BEGIN
  -- Calculate offset
  v_offset := (p_current_page - 1) * p_page_size;
  
  -- Map frontend status values to internal values
  v_status_mapped := CASE p_status_filter
    WHEN 'actif' THEN 'active'
    WHEN 'expire' THEN 'expired'
    WHEN 'epuise' THEN 'empty'
    WHEN 'expiration_proche' THEN 'expiring30'
    ELSE p_status_filter
  END;
  
  -- Map frontend sort values to internal values
  v_sort_mapped := CASE p_sort_by
    WHEN 'stock' THEN 'quantite'
    ELSE p_sort_by
  END;

  -- Get total count with filters
  SELECT COUNT(*) INTO v_total_count
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_term IS NULL 
      OR p_search_term = ''
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR EXISTS (
        SELECT 1 FROM produits p 
        WHERE p.id = l.produit_id 
        AND (p.libelle_produit ILIKE '%' || p_search_term || '%' OR p.code_cip ILIKE '%' || p_search_term || '%')
      )
    )
    AND (
      v_status_mapped = 'all'
      OR (v_status_mapped = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (v_status_mapped = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (v_status_mapped = 'empty' AND l.quantite_restante = 0)
      OR (v_status_mapped = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
      OR (v_status_mapped = 'expiring60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0)
    );

  -- Get paginated lots with all related data
  SELECT json_agg(lot_row)
  INTO v_lots
  FROM (
    SELECT 
      l.id,
      l.numero_lot,
      l.date_peremption,
      l.quantite_initiale,
      l.quantite_restante,
      l.prix_achat_unitaire,
      l.emplacement,
      l.statut,
      l.tenant_id,
      l.produit_id,
      l.fournisseur_id,
      l.created_at,
      l.updated_at,
      l.date_reception,
      -- Produit as nested JSON object (without categorie which doesn't exist)
      json_build_object(
        'id', p.id,
        'libelle_produit', p.libelle_produit,
        'code_cip', p.code_cip,
        'niveau_detail', p.niveau_detail,
        'quantite_unites_details_source', p.quantite_unites_details_source
      ) as produit,
      -- Fournisseur as nested JSON object
      json_build_object(
        'id', f.id,
        'nom', f.nom
      ) as fournisseur,
      -- Produit detail (for source products)
      CASE 
        WHEN p.niveau_detail = 'detail' AND p.id_produit_source IS NOT NULL THEN (
          SELECT json_build_object(
            'id', ps.id,
            'libelle_produit', ps.libelle_produit,
            'code_cip', ps.code_cip
          )
          FROM produits ps 
          WHERE ps.id = p.id_produit_source
        )
        ELSE NULL
      END as produit_detail
    FROM lots l
    LEFT JOIN produits p ON p.id = l.produit_id
    LEFT JOIN fournisseurs f ON f.id = l.fournisseur_id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search_term IS NULL 
        OR p_search_term = ''
        OR l.numero_lot ILIKE '%' || p_search_term || '%'
        OR p.libelle_produit ILIKE '%' || p_search_term || '%'
        OR p.code_cip ILIKE '%' || p_search_term || '%'
      )
      AND (
        v_status_mapped = 'all'
        OR (v_status_mapped = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
        OR (v_status_mapped = 'expired' AND l.date_peremption <= CURRENT_DATE)
        OR (v_status_mapped = 'empty' AND l.quantite_restante = 0)
        OR (v_status_mapped = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
        OR (v_status_mapped = 'expiring60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0)
      )
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN
        CASE v_sort_mapped
          WHEN 'date_peremption' THEN l.date_peremption::text
          WHEN 'numero_lot' THEN l.numero_lot
          WHEN 'produit' THEN p.libelle_produit
          WHEN 'quantite' THEN lpad(l.quantite_restante::text, 20, '0')
          WHEN 'date_entree' THEN COALESCE(l.date_reception::text, l.created_at::text)
          ELSE l.date_peremption::text
        END
      END ASC NULLS LAST,
      CASE WHEN p_sort_order = 'desc' THEN
        CASE v_sort_mapped
          WHEN 'date_peremption' THEN l.date_peremption::text
          WHEN 'numero_lot' THEN l.numero_lot
          WHEN 'produit' THEN p.libelle_produit
          WHEN 'quantite' THEN lpad(l.quantite_restante::text, 20, '0')
          WHEN 'date_entree' THEN COALESCE(l.date_reception::text, l.created_at::text)
          ELSE l.date_peremption::text
        END
      END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) lot_row;

  -- Return result as JSON
  RETURN json_build_object(
    'lots', COALESCE(v_lots, '[]'::json),
    'count', v_total_count
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO service_role;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';