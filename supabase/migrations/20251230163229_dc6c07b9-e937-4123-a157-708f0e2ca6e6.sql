-- Fix search_lots_paginated: correct column name and add nested produit object

DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, int, int, text, text, text);
DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, int, int);

CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id UUID,
  p_search_term TEXT DEFAULT NULL,
  p_status_filter TEXT DEFAULT 'all',
  p_sort_by TEXT DEFAULT 'date_peremption',
  p_sort_order TEXT DEFAULT 'asc',
  p_page_size INT DEFAULT 100,
  p_current_page INT DEFAULT 1
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
BEGIN
  v_offset := (p_current_page - 1) * p_page_size;

  -- Total count with status filter mapping (accepts both FR and EN values)
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.lots l
  LEFT JOIN public.produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_term IS NULL
      OR p_search_term = ''
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR p.libelle_produit ILIKE '%' || p_search_term || '%'
      OR p.code_cip ILIKE '%' || p_search_term || '%'
      OR p.code_barre_externe ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_status_filter = 'all'
      OR (p_status_filter IN ('active', 'actif') AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (p_status_filter IN ('expired', 'expire') AND l.date_peremption <= CURRENT_DATE)
      OR (p_status_filter IN ('expiring_30', 'expiration_proche') AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
      OR (p_status_filter = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
      OR (p_status_filter IN ('empty', 'epuise') AND l.quantite_restante = 0)
    );

  -- Paginated rows with nested produit object
  SELECT json_build_object(
    'lots', COALESCE(json_agg(lot_row ORDER BY lot_row.sort_key), '[]'::json),
    'count', v_total_count
  )
  INTO v_result
  FROM (
    SELECT
      json_build_object(
        'id', l.id,
        'numero_lot', l.numero_lot,
        'date_peremption', l.date_peremption,
        'date_reception', l.date_reception,
        'quantite_initiale', l.quantite_initiale,
        'quantite_restante', l.quantite_restante,
        'prix_achat_unitaire', l.prix_achat_unitaire,
        'emplacement', l.emplacement,
        'created_at', l.created_at,
        'updated_at', l.updated_at,
        'produit_id', l.produit_id,
        'fournisseur_id', l.fournisseur_id,
        'produit', json_build_object(
          'id', p.id,
          'libelle_produit', p.libelle_produit,
          'code_cip', p.code_cip,
          'code_barre_externe', p.code_barre_externe,
          'niveau_detail', p.niveau_detail,
          'quantite_unites_details_source', p.quantite_unites_details_source
        ),
        'fournisseur', CASE 
          WHEN f.id IS NOT NULL THEN json_build_object('id', f.id, 'nom', f.nom)
          ELSE NULL
        END
      ) AS lot_row,
      -- Sort key for ordering
      CASE 
        WHEN p_sort_by IN ('date_peremption', 'peremption') THEN 
          CASE WHEN p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM l.date_peremption) ELSE EXTRACT(EPOCH FROM l.date_peremption) END
        WHEN p_sort_by IN ('date_entree', 'entree', 'created_at') THEN 
          CASE WHEN p_sort_order = 'desc' THEN -EXTRACT(EPOCH FROM COALESCE(l.date_reception, l.created_at::date)) ELSE EXTRACT(EPOCH FROM COALESCE(l.date_reception, l.created_at::date)) END
        WHEN p_sort_by IN ('quantite', 'stock') THEN 
          CASE WHEN p_sort_order = 'desc' THEN -l.quantite_restante ELSE l.quantite_restante END
        WHEN p_sort_by = 'produit' THEN 0 -- Will use secondary sort
        ELSE -EXTRACT(EPOCH FROM l.created_at)
      END AS sort_key
    FROM public.lots l
    LEFT JOIN public.produits p ON l.produit_id = p.id
    LEFT JOIN public.fournisseurs f ON l.fournisseur_id = f.id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search_term IS NULL
        OR p_search_term = ''
        OR l.numero_lot ILIKE '%' || p_search_term || '%'
        OR p.libelle_produit ILIKE '%' || p_search_term || '%'
        OR p.code_cip ILIKE '%' || p_search_term || '%'
        OR p.code_barre_externe ILIKE '%' || p_search_term || '%'
      )
      AND (
        p_status_filter = 'all'
        OR (p_status_filter IN ('active', 'actif') AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
        OR (p_status_filter IN ('expired', 'expire') AND l.date_peremption <= CURRENT_DATE)
        OR (p_status_filter IN ('expiring_30', 'expiration_proche') AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
        OR (p_status_filter = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
        OR (p_status_filter IN ('empty', 'epuise') AND l.quantite_restante = 0)
      )
    ORDER BY
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'asc' THEN p.libelle_produit END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'desc' THEN p.libelle_produit END DESC NULLS LAST,
      sort_key ASC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  -- Ensure we always return valid JSON
  IF v_result IS NULL THEN
    v_result := json_build_object('lots', '[]'::json, 'count', 0);
  END IF;

  RETURN v_result;
END;
$$;