-- RPC optimisée pour la recherche paginée des lots avec recherche sur produit
CREATE OR REPLACE FUNCTION search_lots_paginated(
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
  v_offset INT := (p_current_page - 1) * p_page_size;
  v_result JSON;
  v_today DATE := CURRENT_DATE;
  v_in_60_days DATE := CURRENT_DATE + INTERVAL '60 days';
BEGIN
  WITH filtered_lots AS (
    SELECT 
      l.id,
      l.tenant_id,
      l.produit_id,
      l.numero_lot,
      l.date_peremption,
      l.quantite_initiale,
      l.quantite_restante,
      l.prix_achat_unitaire,
      l.emplacement,
      l.fournisseur_id,
      l.reception_id,
      l.notes,
      l.created_at,
      l.updated_at,
      p.libelle_produit,
      p.code_cip,
      p.niveau_detail,
      p.quantite_unites_details_source
    FROM lots l
    LEFT JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = p_tenant_id
      -- Recherche combinée sur lot + produit
      AND (
        p_search_term IS NULL 
        OR p_search_term = ''
        OR l.numero_lot ILIKE '%' || p_search_term || '%'
        OR p.libelle_produit ILIKE '%' || p_search_term || '%'
        OR p.code_cip ILIKE '%' || p_search_term || '%'
      )
      -- Filtres de statut
      AND (
        p_status_filter = 'all'
        OR (p_status_filter = 'actif' AND l.quantite_restante > 0 AND (l.date_peremption IS NULL OR l.date_peremption > v_today))
        OR (p_status_filter = 'expire' AND l.date_peremption IS NOT NULL AND l.date_peremption <= v_today)
        OR (p_status_filter = 'epuise' AND l.quantite_restante <= 0)
        OR (p_status_filter = 'expiration_proche' AND l.date_peremption IS NOT NULL AND l.date_peremption > v_today AND l.date_peremption <= v_in_60_days)
      )
  ),
  total_count AS (
    SELECT COUNT(*) as cnt FROM filtered_lots
  ),
  sorted_lots AS (
    SELECT *
    FROM filtered_lots
    ORDER BY
      CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'asc' THEN date_peremption END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'desc' THEN date_peremption END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'asc' THEN numero_lot END ASC,
      CASE WHEN p_sort_by = 'numero_lot' AND p_sort_order = 'desc' THEN numero_lot END DESC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' THEN quantite_restante END ASC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' THEN quantite_restante END DESC,
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'asc' THEN libelle_produit END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'desc' THEN libelle_produit END DESC NULLS LAST,
      date_peremption ASC NULLS LAST
    LIMIT p_page_size OFFSET v_offset
  )
  SELECT json_build_object(
    'lots', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', sl.id,
          'tenant_id', sl.tenant_id,
          'produit_id', sl.produit_id,
          'numero_lot', sl.numero_lot,
          'date_peremption', sl.date_peremption,
          'quantite_initiale', sl.quantite_initiale,
          'quantite_restante', sl.quantite_restante,
          'prix_achat_unitaire', sl.prix_achat_unitaire,
          'emplacement', sl.emplacement,
          'fournisseur_id', sl.fournisseur_id,
          'reception_id', sl.reception_id,
          'notes', sl.notes,
          'created_at', sl.created_at,
          'updated_at', sl.updated_at,
          'produit', json_build_object(
            'id', sl.produit_id,
            'libelle_produit', sl.libelle_produit,
            'code_cip', sl.code_cip,
            'niveau_detail', sl.niveau_detail,
            'quantite_unites_details_source', sl.quantite_unites_details_source
          )
        )
      ) FROM sorted_lots sl
    ), '[]'::json),
    'count', (SELECT cnt FROM total_count)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;