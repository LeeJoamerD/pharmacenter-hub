-- Stabilisation de search_lots_paginated + reload PostgREST
-- Drop toutes les signatures existantes
DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_lots_paginated(uuid, text, text, text, text, int, int);

-- Recréer la fonction avec la bonne signature
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
  v_result json;
  v_order_column text;
  v_order_dir text;
BEGIN
  -- Calcul offset
  v_offset := (p_current_page - 1) * p_page_size;
  
  -- Mapping des colonnes de tri
  v_order_column := CASE p_sort_by
    WHEN 'produit' THEN 'p.libelle_produit'
    WHEN 'numero_lot' THEN 'l.numero_lot'
    WHEN 'date_peremption' THEN 'l.date_peremption'
    WHEN 'date_entree' THEN 'l.created_at'
    WHEN 'quantite' THEN 'l.quantite_restante'
    WHEN 'valeur' THEN '(l.quantite_restante * COALESCE(l.prix_achat_unitaire, 0))'
    WHEN 'emplacement' THEN 'l.emplacement'
    ELSE 'l.date_peremption'
  END;
  
  v_order_dir := CASE WHEN LOWER(p_sort_order) = 'desc' THEN 'DESC' ELSE 'ASC' END;

  -- Compter le total
  SELECT COUNT(*) INTO v_total_count
  FROM lots l
  JOIN produits p ON p.id = l.produit_id
  WHERE l.tenant_id = p_tenant_id
    AND (
      p_status_filter = 'all'
      OR (p_status_filter = 'active' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
      OR (p_status_filter = 'expired' AND l.date_peremption <= CURRENT_DATE)
      OR (p_status_filter = 'empty' AND l.quantite_restante <= 0)
      OR (p_status_filter = 'expiring30' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '30 days' AND l.quantite_restante > 0)
      OR (p_status_filter = 'expiring60' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL '60 days' AND l.quantite_restante > 0)
    )
    AND (
      p_search_term IS NULL
      OR p_search_term = ''
      OR p.libelle_produit ILIKE '%' || p_search_term || '%'
      OR p.code_cip ILIKE '%' || p_search_term || '%'
      OR l.numero_lot ILIKE '%' || p_search_term || '%'
      OR l.emplacement ILIKE '%' || p_search_term || '%'
    );

  -- Si aucun résultat, retourner structure vide
  IF v_total_count = 0 THEN
    RETURN json_build_object('lots', '[]'::json, 'count', 0);
  END IF;

  -- Construire le résultat avec tri dynamique
  EXECUTE format('
    SELECT json_build_object(
      ''lots'', COALESCE(json_agg(row_to_json(t)), ''[]''::json),
      ''count'', %s
    )
    FROM (
      SELECT 
        l.id,
        l.numero_lot,
        l.date_peremption,
        l.quantite_initiale,
        l.quantite_restante,
        l.prix_achat_unitaire,
        l.emplacement,
        l.created_at,
        l.updated_at,
        l.tenant_id,
        l.produit_id,
        l.fournisseur_id,
        json_build_object(
          ''id'', p.id,
          ''libelle_produit'', p.libelle_produit,
          ''code_cip'', p.code_cip,
          ''categorie'', p.categorie
        ) as produit,
        CASE WHEN f.id IS NOT NULL THEN
          json_build_object(
            ''id'', f.id,
            ''nom'', f.nom
          )
        ELSE NULL END as fournisseur
      FROM lots l
      JOIN produits p ON p.id = l.produit_id
      LEFT JOIN fournisseurs f ON f.id = l.fournisseur_id
      WHERE l.tenant_id = $1
        AND (
          $2 = ''all''
          OR ($2 = ''active'' AND l.date_peremption > CURRENT_DATE AND l.quantite_restante > 0)
          OR ($2 = ''expired'' AND l.date_peremption <= CURRENT_DATE)
          OR ($2 = ''empty'' AND l.quantite_restante <= 0)
          OR ($2 = ''expiring30'' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL ''30 days'' AND l.quantite_restante > 0)
          OR ($2 = ''expiring60'' AND l.date_peremption > CURRENT_DATE AND l.date_peremption <= CURRENT_DATE + INTERVAL ''60 days'' AND l.quantite_restante > 0)
        )
        AND (
          $3 IS NULL
          OR $3 = ''''
          OR p.libelle_produit ILIKE ''%%'' || $3 || ''%%''
          OR p.code_cip ILIKE ''%%'' || $3 || ''%%''
          OR l.numero_lot ILIKE ''%%'' || $3 || ''%%''
          OR l.emplacement ILIKE ''%%'' || $3 || ''%%''
        )
      ORDER BY %s %s NULLS LAST
      LIMIT $4 OFFSET $5
    ) t
  ', v_total_count, v_order_column, v_order_dir)
  INTO v_result
  USING p_tenant_id, p_status_filter, p_search_term, p_page_size, v_offset;

  RETURN v_result;
END;
$$;

-- Grants explicites
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_lots_paginated(uuid, text, text, text, text, integer, integer) TO service_role;

-- Forcer le reload du cache PostgREST
NOTIFY pgrst, 'reload schema';