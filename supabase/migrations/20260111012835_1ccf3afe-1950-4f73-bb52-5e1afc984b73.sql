-- Corriger search_product_by_barcode : categories → categorie_tarification
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
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(uuid, text) TO anon;

-- Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';