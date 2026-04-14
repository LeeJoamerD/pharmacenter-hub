CREATE OR REPLACE FUNCTION public.search_product_by_barcode(p_tenant_id UUID, p_barcode TEXT)
RETURNS TABLE(
  id uuid, tenant_id uuid, name text, libelle_produit text, dci text, code_cip text,
  price numeric, price_ht numeric, taux_tva numeric, tva_montant numeric,
  taux_centime_additionnel numeric, centime_additionnel_montant numeric,
  stock numeric, category text, requires_prescription boolean,
  lot_id uuid, numero_lot text, date_peremption timestamptz, prix_achat_unitaire numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_barcode TEXT;
  v_produit_id UUID;
  v_lot_record RECORD;
  v_found_via_lot BOOLEAN := FALSE;
BEGIN
  v_barcode := REPLACE(p_barcode, '°', '-');

  -- ÉTAPE 1a: Correspondance exacte sur code_barre de lot
  SELECT 
    l.id AS lot_id, l.produit_id, l.numero_lot, l.code_barre, l.date_peremption, l.prix_achat_unitaire,
    COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
    COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
    COALESCE(l.taux_tva, 0) AS lot_taux_tva,
    COALESCE(l.montant_tva, 0) AS lot_montant_tva,
    COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
    COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
  INTO v_lot_record
  FROM lots l
  WHERE l.tenant_id = p_tenant_id AND l.code_barre = v_barcode AND l.quantite_restante > 0
  LIMIT 1;

  IF v_lot_record.lot_id IS NOT NULL THEN
    v_produit_id := v_lot_record.produit_id;
    v_found_via_lot := TRUE;
  END IF;

  -- ÉTAPE 1b: Correspondance exacte sur numero_lot
  IF NOT v_found_via_lot THEN
    SELECT 
      l.id AS lot_id, l.produit_id, l.numero_lot, l.code_barre, l.date_peremption, l.prix_achat_unitaire,
      COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
      COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
      COALESCE(l.taux_tva, 0) AS lot_taux_tva,
      COALESCE(l.montant_tva, 0) AS lot_montant_tva,
      COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
      COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
    INTO v_lot_record
    FROM lots l
    WHERE l.tenant_id = p_tenant_id AND l.numero_lot = v_barcode AND l.quantite_restante > 0
    LIMIT 1;

    IF v_lot_record.lot_id IS NOT NULL THEN
      v_produit_id := v_lot_record.produit_id;
      v_found_via_lot := TRUE;
    END IF;
  END IF;

  -- ÉTAPE 1c: Correspondance par préfixe
  IF NOT v_found_via_lot THEN
    SELECT 
      l.id AS lot_id, l.produit_id, l.numero_lot, l.code_barre, l.date_peremption, l.prix_achat_unitaire,
      COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
      COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
      COALESCE(l.taux_tva, 0) AS lot_taux_tva,
      COALESCE(l.montant_tva, 0) AS lot_montant_tva,
      COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
      COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
    INTO v_lot_record
    FROM lots l
    WHERE l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
      AND (
        l.code_barre LIKE v_barcode || '%'
        OR v_barcode LIKE l.code_barre || '%'
        OR l.numero_lot LIKE v_barcode || '%'
        OR v_barcode LIKE l.numero_lot || '%'
      )
    ORDER BY 
      GREATEST(
        CASE WHEN l.code_barre LIKE v_barcode || '%' THEN length(v_barcode) ELSE 0 END,
        CASE WHEN v_barcode LIKE l.code_barre || '%' THEN length(l.code_barre) ELSE 0 END,
        CASE WHEN l.numero_lot LIKE v_barcode || '%' THEN length(v_barcode) ELSE 0 END,
        CASE WHEN v_barcode LIKE l.numero_lot || '%' THEN length(l.numero_lot) ELSE 0 END
      ) DESC,
      l.date_reception ASC,
      l.date_peremption ASC NULLS LAST
    LIMIT 1;

    IF v_lot_record.lot_id IS NOT NULL THEN
      v_produit_id := v_lot_record.produit_id;
      v_found_via_lot := TRUE;
    END IF;
  END IF;

  -- ÉTAPE 2: Recherche par code produit
  IF NOT v_found_via_lot THEN
    SELECT p.id INTO v_produit_id
    FROM produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
      AND (
        p.code_cip = v_barcode
        OR p.code_barre_externe = v_barcode
        OR p.ancien_code_cip = v_barcode
      )
    LIMIT 1;
    
    IF v_produit_id IS NULL THEN
      RETURN;
    END IF;
  END IF;

  -- ÉTAPE 3: Retourner le produit (FIXED: famille_produit + libelle_famille)
  RETURN QUERY
  SELECT
    p.id, p.tenant_id,
    p.libelle_produit AS name, p.libelle_produit,
    d.nom AS dci, p.code_cip,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_prix_vente_ttc ELSE 0 END, p.prix_vente_ttc, 0) AS price,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_prix_vente_ht ELSE 0 END, p.prix_vente_ht, 0) AS price_ht,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_taux_tva ELSE 0 END, p.taux_tva, 0) AS taux_tva,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_montant_tva ELSE 0 END, p.tva_montant, 0) AS tva_montant,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_taux_centime ELSE 0 END, p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
    COALESCE(CASE WHEN v_found_via_lot THEN v_lot_record.lot_montant_centime ELSE 0 END, p.centime_additionnel_montant, 0) AS centime_additionnel_montant,
    COALESCE((SELECT SUM(sl.quantite_restante) FROM lots sl WHERE sl.produit_id = p.id AND sl.tenant_id = p_tenant_id AND sl.quantite_restante > 0), 0) AS stock,
    COALESCE(f.libelle_famille, 'Non catégorisé') AS category,
    p.prescription_requise AS requires_prescription,
    CASE WHEN v_found_via_lot THEN v_lot_record.lot_id ELSE NULL END AS lot_id,
    CASE WHEN v_found_via_lot THEN v_lot_record.numero_lot ELSE NULL END AS numero_lot,
    CASE WHEN v_found_via_lot THEN v_lot_record.date_peremption ELSE NULL END AS date_peremption,
    CASE WHEN v_found_via_lot THEN v_lot_record.prix_achat_unitaire ELSE NULL END AS prix_achat_unitaire
  FROM produits p
  LEFT JOIN dci d ON p.dci_id = d.id
  LEFT JOIN famille_produit f ON p.famille_id = f.id
  WHERE p.id = v_produit_id AND p.tenant_id = p_tenant_id;
END;
$function$;