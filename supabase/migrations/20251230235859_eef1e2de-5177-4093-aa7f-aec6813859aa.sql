-- Fix: Remove comparison of integer column niveau_detail to string 'detail'
-- This was causing ERROR 22P02: invalid input syntax for type integer

-- Drop existing function
DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);

-- Recreate with corrected logic
CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id uuid,
  p_search text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_peremption',
  p_sort_order text DEFAULT 'asc',
  p_page_size integer DEFAULT 20,
  p_page integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total_count integer;
  v_lots jsonb;
  v_mapped_status text;
  v_mapped_sort text;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;

  -- Map frontend status filter to backend values
  v_mapped_status := CASE p_status_filter
    WHEN 'actif' THEN 'active'
    WHEN 'expire' THEN 'expired'
    WHEN 'epuise' THEN 'empty'
    WHEN 'expiration_proche' THEN 'expiring30'
    ELSE p_status_filter
  END;

  -- Map frontend sort to backend column
  v_mapped_sort := CASE p_sort_by
    WHEN 'stock' THEN 'quantite'
    ELSE p_sort_by
  END;

  -- Get total count with filters
  SELECT COUNT(*)
  INTO v_total_count
  FROM lots l
  JOIN produits p ON l.produit_id = p.id
  LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search IS NULL 
      OR p_search = '' 
      OR l.numero_lot ILIKE '%' || p_search || '%'
      OR p.libelle ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
    )
    AND (
      v_mapped_status = 'all'
      OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (v_mapped_status = 'empty' AND l.quantite_restante <= 0)
      OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
    );

  -- Get paginated lots with sorting
  SELECT jsonb_agg(lot_data ORDER BY 
    CASE WHEN p_sort_order = 'asc' THEN
      CASE v_mapped_sort
        WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM l.date_peremption)
        WHEN 'quantite' THEN l.quantite_restante
        WHEN 'date_entree' THEN EXTRACT(EPOCH FROM COALESCE(l.date_reception::timestamp, l.created_at))
        ELSE EXTRACT(EPOCH FROM l.created_at)
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_order = 'desc' THEN
      CASE v_mapped_sort
        WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM l.date_peremption)
        WHEN 'quantite' THEN l.quantite_restante
        WHEN 'date_entree' THEN EXTRACT(EPOCH FROM COALESCE(l.date_reception::timestamp, l.created_at))
        ELSE EXTRACT(EPOCH FROM l.created_at)
      END
    END DESC NULLS LAST
  )
  INTO v_lots
  FROM (
    SELECT 
      l.id,
      l.numero_lot,
      l.date_peremption,
      l.quantite_initiale,
      l.quantite_restante,
      l.prix_achat_unitaire,
      l.prix_vente_unitaire,
      l.emplacement,
      l.created_at,
      l.date_reception,
      l.produit_id,
      l.fournisseur_id,
      l.tenant_id,
      jsonb_build_object(
        'id', p.id,
        'libelle', p.libelle,
        'code_cip', p.code_cip,
        'niveau_detail', p.niveau_detail,
        'quantite_unites_details_source', p.quantite_unites_details_source,
        'produit_detail', CASE 
          WHEN p.id_produit_source IS NOT NULL THEN (
            SELECT jsonb_build_object(
              'id', pd.id,
              'libelle', pd.libelle,
              'code_cip', pd.code_cip
            )
            FROM produits pd
            WHERE pd.id = p.id_produit_source
          )
          ELSE NULL
        END
      ) as produit,
      CASE WHEN f.id IS NOT NULL THEN
        jsonb_build_object(
          'id', f.id,
          'nom', f.nom
        )
      ELSE NULL END as fournisseur
    FROM lots l
    JOIN produits p ON l.produit_id = p.id
    LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search IS NULL 
        OR p_search = '' 
        OR l.numero_lot ILIKE '%' || p_search || '%'
        OR p.libelle ILIKE '%' || p_search || '%'
        OR p.code_cip ILIKE '%' || p_search || '%'
      )
      AND (
        v_mapped_status = 'all'
        OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
        OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
        OR (v_mapped_status = 'empty' AND l.quantite_restante <= 0)
        OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
      )
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN
        CASE v_mapped_sort
          WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM l.date_peremption)
          WHEN 'quantite' THEN l.quantite_restante
          WHEN 'date_entree' THEN EXTRACT(EPOCH FROM COALESCE(l.date_reception::timestamp, l.created_at))
          ELSE EXTRACT(EPOCH FROM l.created_at)
        END
      END ASC NULLS LAST,
      CASE WHEN p_sort_order = 'desc' THEN
        CASE v_mapped_sort
          WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM l.date_peremption)
          WHEN 'quantite' THEN l.quantite_restante
          WHEN 'date_entree' THEN EXTRACT(EPOCH FROM COALESCE(l.date_reception::timestamp, l.created_at))
          ELSE EXTRACT(EPOCH FROM l.created_at)
        END
      END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) sub
  JOIN lots l ON sub.id = l.id
  JOIN produits p ON l.produit_id = p.id
  LEFT JOIN fournisseurs f ON l.fournisseur_id = f.id;

  -- Return result
  RETURN jsonb_build_object(
    'data', COALESCE(v_lots, '[]'::jsonb),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total_count::float / p_page_size)
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO service_role;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';