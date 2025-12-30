-- Supprimer les versions conflictuelles de la fonction
DROP FUNCTION IF EXISTS search_lots_paginated(uuid, text, int, int, text, text, text);
DROP FUNCTION IF EXISTS search_lots_paginated(uuid, text, text, text, text, int, int);

-- Recréer la fonction avec RETURNS JSON et tri par date_entree
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
  v_offset INT;
  v_total_count INT;
  v_result JSON;
BEGIN
  v_offset := (p_current_page - 1) * p_page_size;

  -- Get total count
  SELECT COUNT(*)
  INTO v_total_count
  FROM lots l
  LEFT JOIN produits p ON l.produit_id = p.id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_search_term IS NULL 
      OR p_search_term = ''
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR p.nom ILIKE '%' || p_search_term || '%'
      OR p.code_barre ILIKE '%' || p_search_term || '%'
    )
    AND (
      p_status_filter = 'all'
      OR (p_status_filter = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (p_status_filter = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (p_status_filter = 'expiring_30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
      OR (p_status_filter = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
      OR (p_status_filter = 'empty' AND l.quantite_restante = 0)
    );

  -- Get paginated lots with sorting
  SELECT json_build_object(
    'lots', COALESCE(json_agg(lot_data), '[]'::json),
    'count', v_total_count
  )
  INTO v_result
  FROM (
    SELECT 
      l.id,
      l.numero_lot,
      l.date_peremption,
      l.date_reception,
      l.quantite_initiale,
      l.quantite_restante,
      l.prix_achat,
      l.emplacement,
      l.created_at,
      l.produit_id,
      p.nom as produit_nom,
      p.code_barre as produit_code_barre,
      p.categorie as produit_categorie
    FROM lots l
    LEFT JOIN produits p ON l.produit_id = p.id
    WHERE l.tenant_id = p_tenant_id
      AND (
        p_search_term IS NULL 
        OR p_search_term = ''
        OR l.numero_lot ILIKE '%' || p_search_term || '%'
        OR p.nom ILIKE '%' || p_search_term || '%'
        OR p.code_barre ILIKE '%' || p_search_term || '%'
      )
      AND (
        p_status_filter = 'all'
        OR (p_status_filter = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
        OR (p_status_filter = 'expired' AND l.date_peremption <= CURRENT_DATE)
        OR (p_status_filter = 'expiring_30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days')
        OR (p_status_filter = 'expiring_60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days')
        OR (p_status_filter = 'empty' AND l.quantite_restante = 0)
      )
    ORDER BY
      CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'asc' THEN l.date_peremption END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'date_peremption' AND p_sort_order = 'desc' THEN l.date_peremption END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'asc' THEN COALESCE(l.date_reception, l.created_at::date) END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'date_entree' AND p_sort_order = 'desc' THEN COALESCE(l.date_reception, l.created_at::date) END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'quantite' AND p_sort_order = 'asc' THEN l.quantite_restante END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'quantite' AND p_sort_order = 'desc' THEN l.quantite_restante END DESC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'asc' THEN p.nom END ASC NULLS LAST,
      CASE WHEN p_sort_by = 'produit' AND p_sort_order = 'desc' THEN p.nom END DESC NULLS LAST,
      l.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) lot_data;

  RETURN v_result;
END;
$$;