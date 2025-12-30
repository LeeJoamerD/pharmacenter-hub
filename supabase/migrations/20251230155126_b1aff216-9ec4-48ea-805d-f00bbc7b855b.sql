-- Modifier la RPC search_lots_paginated pour ajouter le tri par date d'entrée
CREATE OR REPLACE FUNCTION search_lots_paginated(
  p_tenant_id uuid,
  p_search_term text DEFAULT '',
  p_page_size int DEFAULT 100,
  p_current_page int DEFAULT 1,
  p_status_filter text DEFAULT 'all',
  p_sort_by text DEFAULT 'date_peremption',
  p_sort_order text DEFAULT 'asc'
)
RETURNS TABLE (
  id uuid,
  numero_lot text,
  date_peremption date,
  date_reception date,
  quantite_initiale int,
  quantite_restante int,
  prix_achat numeric,
  emplacement text,
  statut text,
  created_at timestamptz,
  produit_id uuid,
  produit_libelle text,
  produit_code_cip text,
  niveau_detail int,
  produit_detail jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_total_count bigint;
BEGIN
  -- Calculate offset
  v_offset := (p_current_page - 1) * p_page_size;
  
  -- Get total count first
  SELECT COUNT(*)
  INTO v_total_count
  FROM lots l
  LEFT JOIN produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_term = '' 
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR p.libelle_produit ILIKE '%' || p_search_term || '%'
      OR p.code_cip ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_status_filter = 'all'
      OR (p_status_filter = 'actif' AND l.statut = 'Actif')
      OR (p_status_filter = 'expire' AND l.statut = 'Expiré')
      OR (p_status_filter = 'epuise' AND l.statut = 'Épuisé')
      OR (p_status_filter = 'expiration_proche' AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.date_peremption > CURRENT_DATE)
    );
  
  -- Return paginated results with sorting
  RETURN QUERY
  SELECT 
    l.id,
    l.numero_lot,
    l.date_peremption,
    l.date_reception,
    l.quantite_initiale,
    l.quantite_restante,
    l.prix_achat,
    l.emplacement,
    l.statut,
    l.created_at,
    p.id as produit_id,
    p.libelle_produit as produit_libelle,
    p.code_cip as produit_code_cip,
    p.niveau_detail,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', pd.id,
        'quantite_unites_details_source', pd.quantite_unites_details_source
      ))
      FROM produit_detail pd
      WHERE pd.produit_source_id = p.id
    ) as produit_detail,
    v_total_count as total_count
  FROM lots l
  LEFT JOIN produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_term = '' 
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR p.libelle_produit ILIKE '%' || p_search_term || '%'
      OR p.code_cip ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_status_filter = 'all'
      OR (p_status_filter = 'actif' AND l.statut = 'Actif')
      OR (p_status_filter = 'expire' AND l.statut = 'Expiré')
      OR (p_status_filter = 'epuise' AND l.statut = 'Épuisé')
      OR (p_status_filter = 'expiration_proche' AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.date_peremption > CURRENT_DATE)
    )
  ORDER BY
    -- Tri par date d'entrée (utilise date_reception si disponible, sinon created_at)
    CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'asc' 
         THEN COALESCE(l.date_reception, l.created_at::date) END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'desc' 
         THEN COALESCE(l.date_reception, l.created_at::date) END DESC NULLS LAST,
    -- Tri par date de péremption
    CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'asc' 
         THEN l.date_peremption END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'desc' 
         THEN l.date_peremption END DESC NULLS LAST,
    -- Tri par numéro de lot
    CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'asc' 
         THEN l.numero_lot END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'desc' 
         THEN l.numero_lot END DESC NULLS LAST,
    -- Tri par produit
    CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'asc' 
         THEN p.libelle_produit END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'desc' 
         THEN p.libelle_produit END DESC NULLS LAST,
    -- Tri par stock
    CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' 
         THEN l.quantite_restante END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' 
         THEN l.quantite_restante END DESC NULLS LAST
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;