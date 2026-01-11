-- Corriger get_pos_products : mauvais nom de table/colonne (categories → categorie_tarification)
DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_pos_products(
  p_tenant_id uuid,
  p_search text DEFAULT '',
  p_page_size integer DEFAULT 50,
  p_page integer DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search_pattern text;
  v_offset integer;
  v_total_count integer;
  v_total_pages integer;
  v_result json;
BEGIN
  v_search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';
  v_offset := (p_page - 1) * p_page_size;

  -- Compter le total
  SELECT COUNT(DISTINCT p.id) INTO v_total_count
  FROM produits p
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p_search = ''
      OR LOWER(p.libelle_produit) LIKE v_search_pattern
      OR LOWER(COALESCE(d.nom_dci, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(p.code_cip, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(p.code_barre_externe, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(p.ancien_code_cip, '')) LIKE v_search_pattern
    );

  v_total_pages := CEIL(v_total_count::float / p_page_size);

  -- Récupérer les produits avec categorie_tarification
  SELECT json_build_object(
    'products', COALESCE(json_agg(product_row), '[]'::json),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', v_total_pages
  ) INTO v_result
  FROM (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      d.nom_dci AS dci_nom,
      p.code_cip,
      p.code_barre_externe,
      p.ancien_code_cip,
      p.prix_vente_ht,
      p.prix_vente_ttc,
      p.taux_tva,
      COALESCE(p.prix_vente_ht * p.taux_tva / 100, 0) AS tva_montant,
      COALESCE(p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
      COALESCE(p.prix_vente_ht * COALESCE(p.taux_centime_additionnel, 0) / 100, 0) AS centime_additionnel_montant,
      p.prescription_requise,
      COALESCE(ct.libelle_categorie, 'Non catégorisé') AS category,
      COALESCE((
        SELECT SUM(l.quantite_restante)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ), 0) AS stock_disponible,
      (
        SELECT MIN(l.date_peremption)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ) AS earliest_expiration_date,
      EXISTS(
        SELECT 1 FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
          AND l.date_peremption > CURRENT_DATE
      ) AS has_valid_stock,
      (
        COALESCE((
          SELECT SUM(l.quantite_restante)
          FROM lots l
          WHERE l.produit_id = p.id 
            AND l.tenant_id = p_tenant_id
            AND l.quantite_restante > 0
        ), 0) > 0
        AND NOT EXISTS(
          SELECT 1 FROM lots l
          WHERE l.produit_id = p.id 
            AND l.tenant_id = p_tenant_id
            AND l.quantite_restante > 0
            AND l.date_peremption > CURRENT_DATE
        )
      ) AS all_lots_expired
    FROM produits p
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN categorie_tarification ct ON ct.id = p.categorie_tarification_id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        p_search = ''
        OR LOWER(p.libelle_produit) LIKE v_search_pattern
        OR LOWER(COALESCE(d.nom_dci, '')) LIKE v_search_pattern
        OR LOWER(COALESCE(p.code_cip, '')) LIKE v_search_pattern
        OR LOWER(COALESCE(p.code_barre_externe, '')) LIKE v_search_pattern
        OR LOWER(COALESCE(p.ancien_code_cip, '')) LIKE v_search_pattern
      )
    ORDER BY p.libelle_produit
    LIMIT p_page_size
    OFFSET v_offset
  ) AS product_row;

  RETURN v_result;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO anon;

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';