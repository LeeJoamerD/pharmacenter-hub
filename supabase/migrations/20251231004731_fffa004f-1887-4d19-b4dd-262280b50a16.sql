-- Hotfix: Replace l.quantite with l.quantite_restante in search_lots_paginated
-- The column "quantite" does not exist in public.lots, only quantite_initiale and quantite_restante

CREATE OR REPLACE FUNCTION public.search_lots_paginated(
  p_tenant_id uuid,
  p_search text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_entree',
  p_sort_order text DEFAULT 'desc',
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
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Map status filter
  v_mapped_status := CASE 
    WHEN p_status_filter IS NULL OR p_status_filter = '' THEN 'all'
    ELSE lower(p_status_filter)
  END;

  -- Get total count with filters
  SELECT COUNT(*)
  INTO v_total_count
  FROM public.lots l
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search IS NULL 
      OR p_search = '' 
      OR l.numero_lot ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM public.produits p 
        WHERE p.id = l.produit_id 
        AND p.libelle_produit ILIKE '%' || p_search || '%'
      )
    )
    AND (
      v_mapped_status = 'all'
      OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (v_mapped_status = 'empty' AND l.quantite_restante <= 0)
      OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
      OR (v_mapped_status = 'expiring60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0)
    );

  -- Get paginated lots with sorting
  SELECT jsonb_agg(lot_row)
  INTO v_lots
  FROM (
    SELECT jsonb_build_object(
      'id', l.id,
      'numero_lot', l.numero_lot,
      'produit_id', l.produit_id,
      'produit', jsonb_build_object(
        'id', p.id,
        'libelle_produit', p.libelle_produit,
        'code_barre', p.code_barre
      ),
      'fournisseur_id', l.fournisseur_id,
      'fournisseur', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object(
        'id', f.id,
        'nom', f.nom
      ) ELSE NULL END,
      'date_fabrication', l.date_fabrication,
      'date_peremption', l.date_peremption,
      'date_reception', l.date_reception,
      'date_entree', COALESCE(l.date_reception, l.created_at),
      'quantite_initiale', l.quantite_initiale,
      'quantite_restante', l.quantite_restante,
      'quantite', l.quantite_restante,
      'prix_achat_unitaire', l.prix_achat_unitaire,
      'prix_vente_unitaire', l.prix_vente_unitaire,
      'emplacement', l.emplacement,
      'statut', l.statut,
      'tenant_id', l.tenant_id,
      'created_at', l.created_at,
      'updated_at', l.updated_at
    ) AS lot_row
    FROM public.lots l
    LEFT JOIN public.produits p ON p.id = l.produit_id
    LEFT JOIN public.fournisseurs f ON f.id = l.fournisseur_id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search IS NULL 
        OR p_search = '' 
        OR l.numero_lot ILIKE '%' || p_search || '%'
        OR p.libelle_produit ILIKE '%' || p_search || '%'
      )
      AND (
        v_mapped_status = 'all'
        OR (v_mapped_status = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
        OR (v_mapped_status = 'expired' AND l.date_peremption <= CURRENT_DATE)
        OR (v_mapped_status = 'empty' AND l.quantite_restante <= 0)
        OR (v_mapped_status = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
        OR (v_mapped_status = 'expiring60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0)
      )
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN
        CASE p_sort_by
          WHEN 'date_entree' THEN COALESCE(l.date_reception, l.created_at)::text
          WHEN 'date_peremption' THEN l.date_peremption::text
          WHEN 'numero_lot' THEN l.numero_lot
          WHEN 'produit' THEN p.libelle_produit
          WHEN 'stock' THEN lpad(l.quantite_restante::text, 10, '0')
          ELSE COALESCE(l.date_reception, l.created_at)::text
        END
      END ASC NULLS LAST,
      CASE WHEN p_sort_order = 'desc' OR p_sort_order IS NULL THEN
        CASE p_sort_by
          WHEN 'date_entree' THEN COALESCE(l.date_reception, l.created_at)::text
          WHEN 'date_peremption' THEN l.date_peremption::text
          WHEN 'numero_lot' THEN l.numero_lot
          WHEN 'produit' THEN p.libelle_produit
          WHEN 'stock' THEN lpad(l.quantite_restante::text, 10, '0')
          ELSE COALESCE(l.date_reception, l.created_at)::text
        END
      END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  -- Return result
  RETURN jsonb_build_object(
    'lots', COALESCE(v_lots, '[]'::jsonb),
    'count', v_total_count
  );
END;
$$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';