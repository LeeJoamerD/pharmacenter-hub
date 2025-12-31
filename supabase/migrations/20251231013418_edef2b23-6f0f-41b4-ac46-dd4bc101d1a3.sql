-- Fix search_lots_paginated: replace f.telephone with f.telephone_appel/telephone_whatsapp
-- The fournisseurs table has telephone_appel and telephone_whatsapp, NOT telephone

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
  v_offset integer;
  v_total_count integer;
  v_lots json;
  v_status_condition text;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Map French status filters to internal values
  v_status_condition := CASE p_status_filter
    WHEN 'all' THEN 'all'
    WHEN 'actif' THEN 'active'
    WHEN 'active' THEN 'active'
    WHEN 'expire' THEN 'expired'
    WHEN 'expired' THEN 'expired'
    WHEN 'epuise' THEN 'empty'
    WHEN 'empty' THEN 'empty'
    WHEN 'expiring_30' THEN 'expiring_30'
    WHEN 'expiring_60' THEN 'expiring_60'
    ELSE 'all'
  END;

  -- Get total count
  SELECT COUNT(*)
  INTO v_total_count
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND (p_search IS NULL OR p_search = '' OR 
         l.numero_lot ILIKE '%' || p_search || '%' OR
         EXISTS (
           SELECT 1 FROM produits p 
           WHERE p.id = l.produit_id 
           AND (p.nom ILIKE '%' || p_search || '%' OR p.code_barre ILIKE '%' || p_search || '%')
         ))
    AND (v_status_condition = 'all' OR
         (v_status_condition = 'active' AND l.quantite_restante > 0 AND l.date_peremption > CURRENT_DATE) OR
         (v_status_condition = 'expired' AND l.date_peremption <= CURRENT_DATE) OR
         (v_status_condition = 'empty' AND l.quantite_restante = 0) OR
         (v_status_condition = 'expiring_30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0) OR
         (v_status_condition = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0));

  -- Get paginated lots with all related data
  SELECT json_agg(lot_data ORDER BY 
    CASE WHEN p_sort_order = 'asc' THEN
      CASE p_sort_by
        WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM lot_data.date_peremption)
        WHEN 'date_entree' THEN EXTRACT(EPOCH FROM lot_data.date_entree)
        WHEN 'quantite_restante' THEN lot_data.quantite_restante
        WHEN 'numero_lot' THEN NULL
        ELSE EXTRACT(EPOCH FROM lot_data.date_entree)
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_order = 'asc' AND p_sort_by = 'numero_lot' THEN lot_data.numero_lot END ASC NULLS LAST,
    CASE WHEN p_sort_order = 'desc' OR p_sort_order IS NULL THEN
      CASE p_sort_by
        WHEN 'date_peremption' THEN EXTRACT(EPOCH FROM lot_data.date_peremption)
        WHEN 'date_entree' THEN EXTRACT(EPOCH FROM lot_data.date_entree)
        WHEN 'quantite_restante' THEN lot_data.quantite_restante
        WHEN 'numero_lot' THEN NULL
        ELSE EXTRACT(EPOCH FROM lot_data.date_entree)
      END
    END DESC NULLS LAST,
    CASE WHEN (p_sort_order = 'desc' OR p_sort_order IS NULL) AND p_sort_by = 'numero_lot' THEN lot_data.numero_lot END DESC NULLS LAST
  )
  INTO v_lots
  FROM (
    SELECT 
      l.id,
      l.numero_lot,
      l.date_peremption,
      l.date_entree,
      l.quantite_initiale,
      l.quantite_restante,
      l.prix_achat_unitaire,
      l.prix_vente_ttc as prix_vente_unitaire,
      l.emplacement,
      l.produit_id,
      l.fournisseur_id,
      l.created_at,
      l.updated_at,
      json_build_object(
        'id', p.id,
        'nom', p.nom,
        'code_barre', p.code_barre,
        'forme', p.forme,
        'dosage', p.dosage,
        'categorie', p.categorie,
        'produit_detail', p.produit_detail
      ) as produit,
      CASE WHEN f.id IS NOT NULL THEN
        json_build_object(
          'id', f.id,
          'nom', f.nom,
          'telephone_appel', f.telephone_appel,
          'telephone_whatsapp', f.telephone_whatsapp,
          'email', f.email
        )
      ELSE NULL END as fournisseur
    FROM lots l
    LEFT JOIN produits p ON p.id = l.produit_id
    LEFT JOIN fournisseurs f ON f.id = l.fournisseur_id
    WHERE l.tenant_id = p_tenant_id
      AND (p_search IS NULL OR p_search = '' OR 
           l.numero_lot ILIKE '%' || p_search || '%' OR
           p.nom ILIKE '%' || p_search || '%' OR 
           p.code_barre ILIKE '%' || p_search || '%')
      AND (v_status_condition = 'all' OR
           (v_status_condition = 'active' AND l.quantite_restante > 0 AND l.date_peremption > CURRENT_DATE) OR
           (v_status_condition = 'expired' AND l.date_peremption <= CURRENT_DATE) OR
           (v_status_condition = 'empty' AND l.quantite_restante = 0) OR
           (v_status_condition = 'expiring_30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0) OR
           (v_status_condition = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0))
    ORDER BY l.date_entree DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) as lot_data;

  -- Return result
  RETURN json_build_object(
    'lots', COALESCE(v_lots, '[]'::json),
    'count', v_total_count
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon, authenticated, service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';