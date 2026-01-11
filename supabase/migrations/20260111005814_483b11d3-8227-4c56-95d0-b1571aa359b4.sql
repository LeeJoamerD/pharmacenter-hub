-- =============================================
-- FIX: get_pos_products et search_product_by_barcode
-- Supprime référence à produit_alias_search (inexistante)
-- Ajoute recherche directe dans code_barre_externe, ancien_code_cip
-- Retourne info expiration pour affichage rouge + blocage panier
-- =============================================

-- 1. Corriger get_pos_products
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
  -- Préparer le pattern de recherche
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

  -- Calculer total pages
  v_total_pages := CEIL(v_total_count::float / p_page_size);

  -- Récupérer les produits avec info stock et expiration
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
      COALESCE(c.libelle_categorie, 'Non catégorisé') AS category,
      -- Stock total (tous lots confondus)
      COALESCE((
        SELECT SUM(l.quantite_restante)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ), 0) AS stock_disponible,
      -- Date expiration la plus proche (lot avec stock)
      (
        SELECT MIN(l.date_peremption)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ) AS earliest_expiration_date,
      -- Y a-t-il au moins un lot valide (non expiré, avec stock)?
      EXISTS(
        SELECT 1 FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
          AND l.date_peremption > CURRENT_DATE
      ) AS has_valid_stock,
      -- Tous les lots sont-ils expirés?
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
    LEFT JOIN categories c ON c.id = p.categorie_id
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

-- 2. Corriger search_product_by_barcode
DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);

CREATE OR REPLACE FUNCTION public.search_product_by_barcode(
  p_tenant_id uuid,
  p_barcode text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barcode text;
  v_result json;
BEGIN
  v_barcode := LOWER(TRIM(COALESCE(p_barcode, '')));
  
  IF v_barcode = '' THEN
    RETURN json_build_object('product', NULL);
  END IF;

  SELECT json_build_object('product', row_to_json(product_row)) INTO v_result
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
      COALESCE(c.libelle_categorie, 'Non catégorisé') AS category,
      -- Stock total
      COALESCE((
        SELECT SUM(l.quantite_restante)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ), 0) AS stock_disponible,
      -- Date expiration la plus proche
      (
        SELECT MIN(l.date_peremption)
        FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
      ) AS earliest_expiration_date,
      -- Au moins un lot valide?
      EXISTS(
        SELECT 1 FROM lots l
        WHERE l.produit_id = p.id 
          AND l.tenant_id = p_tenant_id
          AND l.quantite_restante > 0
          AND l.date_peremption > CURRENT_DATE
      ) AS has_valid_stock,
      -- Tous lots expirés?
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
    LEFT JOIN categories c ON c.id = p.categorie_id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        LOWER(p.code_cip) = v_barcode
        OR LOWER(COALESCE(p.code_barre_externe, '')) = v_barcode
        OR LOWER(COALESCE(p.ancien_code_cip, '')) = v_barcode
      )
    LIMIT 1
  ) AS product_row;

  RETURN COALESCE(v_result, json_build_object('product', NULL));
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO authenticated;

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';