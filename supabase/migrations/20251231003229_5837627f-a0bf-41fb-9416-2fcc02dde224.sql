-- Hotfix: Corriger search_lots_paginated (colonne libelle_produit + format retour lots/count)

DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);

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
  -- Calcul offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Mapping des filtres de statut
  v_mapped_status := CASE 
    WHEN p_status_filter = 'actif' THEN 'active'
    WHEN p_status_filter = 'expire' THEN 'expired'
    WHEN p_status_filter = 'epuise' THEN 'empty'
    WHEN p_status_filter = 'expiration_proche' THEN 'expiring30'
    ELSE p_status_filter
  END;
  
  -- Mapping du tri
  v_mapped_sort := CASE 
    WHEN p_sort_by = 'stock' THEN 'quantite'
    ELSE p_sort_by
  END;

  -- Compter le total
  SELECT COUNT(*) INTO v_total_count
  FROM lots l
  LEFT JOIN produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search IS NULL 
      OR p_search = ''
      OR l.numero_lot ILIKE '%' || p_search || '%'
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
    )
    AND (
      v_mapped_status = 'all'
      OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite > 0)
      OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (v_mapped_status = 'empty' AND l.quantite <= 0)
      OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite > 0)
    );

  -- Récupérer les lots paginés avec tri dynamique
  SELECT COALESCE(jsonb_agg(lot_row ORDER BY 
    CASE WHEN v_mapped_sort = 'date_peremption' AND p_sort_order = 'asc' THEN lot_row->>'date_peremption' END ASC,
    CASE WHEN v_mapped_sort = 'date_peremption' AND p_sort_order = 'desc' THEN lot_row->>'date_peremption' END DESC,
    CASE WHEN v_mapped_sort = 'date_entree' AND p_sort_order = 'asc' THEN lot_row->>'date_entree' END ASC,
    CASE WHEN v_mapped_sort = 'date_entree' AND p_sort_order = 'desc' THEN lot_row->>'date_entree' END DESC,
    CASE WHEN v_mapped_sort = 'numero_lot' AND p_sort_order = 'asc' THEN lot_row->>'numero_lot' END ASC,
    CASE WHEN v_mapped_sort = 'numero_lot' AND p_sort_order = 'desc' THEN lot_row->>'numero_lot' END DESC
  ), '[]'::jsonb) INTO v_lots
  FROM (
    SELECT jsonb_build_object(
      'id', l.id,
      'numero_lot', l.numero_lot,
      'date_peremption', l.date_peremption,
      'date_entree', COALESCE(l.date_reception, l.created_at),
      'quantite', l.quantite,
      'prix_achat_unitaire', l.prix_achat_unitaire,
      'prix_vente_unitaire', l.prix_vente_unitaire,
      'emplacement', l.emplacement,
      'tenant_id', l.tenant_id,
      'created_at', l.created_at,
      'updated_at', l.updated_at,
      'produit', jsonb_build_object(
        'id', p.id,
        'libelle_produit', p.libelle_produit,
        'code_cip', p.code_cip
      ),
      'fournisseur', CASE 
        WHEN f.id IS NOT NULL THEN jsonb_build_object('id', f.id, 'nom', f.nom)
        ELSE NULL
      END
    ) as lot_row
    FROM lots l
    LEFT JOIN produits p ON l.produit_id = p.id
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
        v_mapped_status = 'all'
        OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite > 0)
        OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
        OR (v_mapped_status = 'empty' AND l.quantite <= 0)
        OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite > 0)
      )
    ORDER BY 
      CASE WHEN v_mapped_sort = 'date_peremption' AND p_sort_order = 'asc' THEN l.date_peremption END ASC,
      CASE WHEN v_mapped_sort = 'date_peremption' AND p_sort_order = 'desc' THEN l.date_peremption END DESC,
      CASE WHEN v_mapped_sort = 'date_entree' AND p_sort_order = 'asc' THEN COALESCE(l.date_reception, l.created_at) END ASC,
      CASE WHEN v_mapped_sort = 'date_entree' AND p_sort_order = 'desc' THEN COALESCE(l.date_reception, l.created_at) END DESC,
      CASE WHEN v_mapped_sort = 'numero_lot' AND p_sort_order = 'asc' THEN l.numero_lot END ASC,
      CASE WHEN v_mapped_sort = 'numero_lot' AND p_sort_order = 'desc' THEN l.numero_lot END DESC,
      CASE WHEN v_mapped_sort = 'quantite' AND p_sort_order = 'asc' THEN l.quantite END ASC,
      CASE WHEN v_mapped_sort = 'quantite' AND p_sort_order = 'desc' THEN l.quantite END DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  -- Retourner au format attendu par le frontend
  RETURN jsonb_build_object(
    'lots', v_lots,
    'count', v_total_count
  );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO service_role;

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';