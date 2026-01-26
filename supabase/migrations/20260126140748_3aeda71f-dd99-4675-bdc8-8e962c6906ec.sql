-- CORRECTION : La colonne code_ean n'existe pas, on la retire des requêtes

-- 1) Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.get_pos_products(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);

-- 2) Recréer get_pos_products SANS code_ean
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
  v_offset integer;
  v_total_count integer;
  v_total_pages integer;
  v_products json;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT COUNT(DISTINCT p.id) INTO v_total_count
  FROM produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (
      p_search = '' 
      OR p.libelle_produit ILIKE '%' || p_search || '%'
      OR p.code_cip ILIKE '%' || p_search || '%'
      OR p.dci_nom ILIKE '%' || p_search || '%'
    );

  v_total_pages := CEIL(v_total_count::numeric / p_page_size);

  SELECT json_agg(product_row) INTO v_products
  FROM (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.dci_nom,
      p.code_cip,
      p.forme_pharmaceutique,
      p.dosage,
      p.conditionnement,
      p.description,
      p.prescription_requise,
      COALESCE(p.prix_vente_ht, 0) AS prix_vente_ht,
      COALESCE(p.prix_vente_ttc, 0) AS prix_vente_ttc,
      COALESCE(p.taux_tva, 0) AS taux_tva,
      COALESCE(p.tva_montant, 0) AS tva_montant,
      COALESCE(p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
      COALESCE(p.centime_additionnel_montant, 0) AS centime_additionnel_montant,
      COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
      COALESCE(
        (SELECT SUM(l.quantite_restante) 
         FROM lots l 
         WHERE l.produit_id = p.id 
           AND l.quantite_restante > 0
           AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
        ), 0
      ) AS stock_disponible,
      (SELECT MIN(l.date_peremption) 
       FROM lots l 
       WHERE l.produit_id = p.id 
         AND l.quantite_restante > 0
         AND l.date_peremption IS NOT NULL
         AND l.date_peremption > CURRENT_DATE
      ) AS earliest_expiration_date,
      EXISTS(
        SELECT 1 FROM lots l 
        WHERE l.produit_id = p.id 
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      ) AS has_valid_stock,
      NOT EXISTS(
        SELECT 1 FROM lots l 
        WHERE l.produit_id = p.id 
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      ) AS all_lots_expired
    FROM produits p
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        p_search = '' 
        OR p.libelle_produit ILIKE '%' || p_search || '%'
        OR p.code_cip ILIKE '%' || p_search || '%'
        OR p.dci_nom ILIKE '%' || p_search || '%'
      )
    ORDER BY p.libelle_produit
    LIMIT p_page_size
    OFFSET v_offset
  ) AS product_row;

  RETURN json_build_object(
    'products', COALESCE(v_products, '[]'::json),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', v_total_pages
  );
END;
$$;

-- 3) Recréer search_product_by_barcode SANS code_ean
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
  v_result json;
BEGIN
  SELECT json_build_object(
    'product', row_to_json(product_data)
  ) INTO v_result
  FROM (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.dci_nom,
      p.code_cip,
      p.forme_pharmaceutique,
      p.dosage,
      p.conditionnement,
      p.description,
      p.prescription_requise,
      COALESCE(p.prix_vente_ht, 0) AS prix_vente_ht,
      COALESCE(p.prix_vente_ttc, 0) AS prix_vente_ttc,
      COALESCE(p.taux_tva, 0) AS taux_tva,
      COALESCE(p.tva_montant, 0) AS tva_montant,
      COALESCE(p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
      COALESCE(p.centime_additionnel_montant, 0) AS centime_additionnel_montant,
      COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
      COALESCE(
        (SELECT SUM(l.quantite_restante) 
         FROM lots l 
         WHERE l.produit_id = p.id 
           AND l.quantite_restante > 0
           AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
        ), 0
      ) AS stock_disponible,
      (SELECT MIN(l.date_peremption) 
       FROM lots l 
       WHERE l.produit_id = p.id 
         AND l.quantite_restante > 0
         AND l.date_peremption IS NOT NULL
         AND l.date_peremption > CURRENT_DATE
      ) AS earliest_expiration_date,
      EXISTS(
        SELECT 1 FROM lots l 
        WHERE l.produit_id = p.id 
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      ) AS has_valid_stock,
      NOT EXISTS(
        SELECT 1 FROM lots l 
        WHERE l.produit_id = p.id 
          AND l.quantite_restante > 0
          AND (l.date_peremption IS NULL OR l.date_peremption > CURRENT_DATE)
      ) AS all_lots_expired
    FROM produits p
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND p.code_cip = p_barcode
    LIMIT 1
  ) AS product_data;

  RETURN COALESCE(v_result, json_build_object('product', null));
END;
$$;

-- 4) Permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pos_products(uuid, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO anon;

-- 5) Recharger PostgREST
NOTIFY pgrst, 'reload schema';