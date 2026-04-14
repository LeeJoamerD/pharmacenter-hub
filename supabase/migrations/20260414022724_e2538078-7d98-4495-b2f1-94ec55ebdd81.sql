
DROP FUNCTION IF EXISTS public.search_product_by_barcode(uuid, text);

CREATE FUNCTION public.search_product_by_barcode(p_tenant_id uuid, p_barcode text)
RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  name text,
  libelle_produit text,
  dci text,
  code_cip text,
  price numeric,
  price_ht numeric,
  taux_tva numeric,
  tva_montant numeric,
  taux_centime_additionnel numeric,
  centime_additionnel_montant numeric,
  stock numeric,
  category text,
  requires_prescription boolean,
  lot_id uuid,
  numero_lot text,
  date_peremption date,
  prix_achat_unitaire numeric,
  code_barre_lot text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_produit_id uuid;
  v_lot_id uuid;
BEGIN
  -- 1. Recherche par code_barre du lot (exact)
  SELECT l.produit_id, l.id INTO v_produit_id, v_lot_id
  FROM lots l
  WHERE l.code_barre = p_barcode
    AND l.tenant_id = p_tenant_id
    AND l.quantite_restante > 0
  ORDER BY l.date_peremption ASC NULLS LAST
  LIMIT 1;

  -- 2. Fallback: recherche par numero_lot
  IF v_produit_id IS NULL THEN
    SELECT l.produit_id, l.id INTO v_produit_id, v_lot_id
    FROM lots l
    WHERE l.numero_lot = p_barcode
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    ORDER BY l.date_peremption ASC NULLS LAST
    LIMIT 1;
  END IF;

  -- 3. Fallback: recherche par préfixe code_barre lot
  IF v_produit_id IS NULL AND length(p_barcode) > 6 THEN
    SELECT l.produit_id, l.id INTO v_produit_id, v_lot_id
    FROM lots l
    WHERE l.code_barre LIKE (p_barcode || '%')
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
    ORDER BY l.date_peremption ASC NULLS LAST
    LIMIT 1;
  END IF;

  -- 4. Fallback: recherche par code produit
  IF v_produit_id IS NULL THEN
    SELECT p.id INTO v_produit_id
    FROM produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (p.code_cip = p_barcode OR p.code_barre_externe = p_barcode OR p.ancien_code_cip = p_barcode)
    LIMIT 1;

    IF v_produit_id IS NOT NULL THEN
      SELECT l.id INTO v_lot_id
      FROM lots l
      WHERE l.produit_id = v_produit_id
        AND l.quantite_restante > 0
      ORDER BY l.date_peremption ASC NULLS LAST
      LIMIT 1;
    END IF;
  END IF;

  IF v_produit_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    COALESCE(d.nom_dci, '') AS dci,
    COALESCE(p.code_cip, '') AS code_cip,
    COALESCE(p.prix_vente_ttc, 0) AS price,
    COALESCE(p.prix_vente_ht, 0) AS price_ht,
    COALESCE(l.taux_tva, p.taux_tva, 0) AS taux_tva,
    COALESCE(l.montant_tva, p.tva, 0) AS tva_montant,
    COALESCE(l.taux_centime_additionnel, p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
    COALESCE(l.montant_centime_additionnel, p.centime_additionnel, 0) AS centime_additionnel_montant,
    COALESCE((SELECT SUM(l2.quantite_restante) FROM lots l2 WHERE l2.produit_id = p.id AND l2.quantite_restante > 0), 0)::numeric AS stock,
    COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
    COALESCE(p.prescription_requise, false) AS requires_prescription,
    l.id AS lot_id,
    l.numero_lot,
    l.date_peremption,
    l.prix_achat_unitaire,
    l.code_barre AS code_barre_lot
  FROM produits p
  LEFT JOIN dci d ON d.id = p.dci_id
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN lots l ON l.id = v_lot_id
  WHERE p.id = v_produit_id
    AND p.tenant_id = p_tenant_id;
END;
$$;
