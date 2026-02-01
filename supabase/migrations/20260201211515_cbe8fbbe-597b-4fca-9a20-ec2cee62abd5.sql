-- Supprimer l'ancienne fonction pour pouvoir modifier le type de retour
DROP FUNCTION IF EXISTS public.search_product_by_barcode(UUID, TEXT);

-- ============================================
-- Recréer la RPC search_product_by_barcode avec priorité lot
-- ============================================
CREATE OR REPLACE FUNCTION public.search_product_by_barcode(
  p_tenant_id UUID,
  p_barcode TEXT
)
RETURNS TABLE(
  id UUID,
  tenant_id UUID,
  name TEXT,
  libelle_produit TEXT,
  dci TEXT,
  code_cip TEXT,
  price NUMERIC,
  price_ht NUMERIC,
  taux_tva NUMERIC,
  tva_montant NUMERIC,
  taux_centime_additionnel NUMERIC,
  centime_additionnel_montant NUMERIC,
  stock BIGINT,
  category TEXT,
  requires_prescription BOOLEAN,
  lot_id UUID,
  numero_lot TEXT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC,
  code_barre_lot TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_produit_id UUID;
  v_lot_record RECORD;
  v_found_via_lot BOOLEAN := FALSE;
BEGIN
  -- ============================================
  -- ÉTAPE 1: Recherche PRIORITAIRE par code-barres LOT
  -- ============================================
  SELECT 
    l.id AS lot_id,
    l.produit_id,
    l.numero_lot,
    l.code_barre,
    l.date_peremption,
    l.prix_achat_unitaire,
    COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
    COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
    COALESCE(l.taux_tva, 0) AS lot_taux_tva,
    COALESCE(l.montant_tva, 0) AS lot_montant_tva,
    COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
    COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
  INTO v_lot_record
  FROM lots l
  WHERE l.tenant_id = p_tenant_id
    AND l.code_barre = p_barcode
    AND l.quantite_restante > 0
  LIMIT 1;
  
  IF v_lot_record.lot_id IS NOT NULL THEN
    -- Lot trouvé directement par son code-barres
    v_produit_id := v_lot_record.produit_id;
    v_found_via_lot := TRUE;
  ELSE
    -- ============================================
    -- ÉTAPE 2: Recherche classique par code produit
    -- ============================================
    SELECT p.id INTO v_produit_id
    FROM produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
      AND (
        p.code_cip = p_barcode
        OR p.code_ean = p_barcode
        OR p.code_interne = p_barcode
        OR p.code_barre_externe = p_barcode
      )
    LIMIT 1;
    
    IF v_produit_id IS NULL THEN
      RETURN;
    END IF;
    
    -- Récupérer le lot FIFO avec stock
    SELECT 
      l.id AS lot_id,
      l.numero_lot,
      l.code_barre,
      l.date_peremption,
      l.prix_achat_unitaire,
      COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
      COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
      COALESCE(l.taux_tva, 0) AS lot_taux_tva,
      COALESCE(l.montant_tva, 0) AS lot_montant_tva,
      COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
      COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
    INTO v_lot_record
    FROM lots l
    WHERE l.produit_id = v_produit_id
      AND l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_achat_unitaire > 0
    ORDER BY l.date_reception ASC, l.date_peremption ASC NULLS LAST
    LIMIT 1;
  END IF;

  -- ============================================
  -- ÉTAPE 3: Retourner les données enrichies
  -- ============================================
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    d.nom_dci AS dci,
    p.code_cip,
    CASE 
      WHEN v_lot_record.lot_prix_vente_ttc > 0 THEN v_lot_record.lot_prix_vente_ttc
      ELSE COALESCE(p.prix_vente_ttc, 0)
    END AS price,
    CASE 
      WHEN v_lot_record.lot_prix_vente_ht > 0 THEN v_lot_record.lot_prix_vente_ht
      ELSE COALESCE(p.prix_vente_ht, 0)
    END AS price_ht,
    CASE 
      WHEN v_lot_record.lot_taux_tva > 0 THEN v_lot_record.lot_taux_tva
      ELSE COALESCE(p.taux_tva, 0)
    END AS taux_tva,
    CASE 
      WHEN v_lot_record.lot_montant_tva > 0 THEN v_lot_record.lot_montant_tva
      ELSE COALESCE(p.tva, 0)
    END AS tva_montant,
    CASE 
      WHEN v_lot_record.lot_taux_centime > 0 THEN v_lot_record.lot_taux_centime
      ELSE COALESCE(p.taux_centime_additionnel, 0)
    END AS taux_centime_additionnel,
    CASE 
      WHEN v_lot_record.lot_montant_centime > 0 THEN v_lot_record.lot_montant_centime
      ELSE COALESCE(p.centime_additionnel, 0)
    END AS centime_additionnel_montant,
    COALESCE((
      SELECT SUM(l.quantite_restante)::BIGINT 
      FROM lots l 
      WHERE l.produit_id = p.id 
      AND l.tenant_id = p.tenant_id 
      AND l.quantite_restante > 0
    ), 0) AS stock,
    f.libelle_famille AS category,
    COALESCE(p.prescription_requise, FALSE) AS requires_prescription,
    v_lot_record.lot_id,
    v_lot_record.numero_lot,
    v_lot_record.date_peremption,
    v_lot_record.prix_achat_unitaire,
    v_lot_record.code_barre AS code_barre_lot
  FROM produits p
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.id = v_produit_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(UUID, TEXT) TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';