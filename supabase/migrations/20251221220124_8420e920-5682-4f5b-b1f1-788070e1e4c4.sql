-- Migration: Modifier les RPC POS pour utiliser les prix des LOTS (FIFO) au lieu des produits
-- Source de vérité: le lot le plus ancien avec stock disponible

-- 1. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.get_pos_products(UUID, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.search_product_by_barcode(UUID, TEXT);

-- 2. Recréer get_pos_products avec prix depuis les LOTS (FIFO)
CREATE FUNCTION public.get_pos_products(
  p_tenant_id UUID,
  p_search TEXT DEFAULT '',
  p_page_size INT DEFAULT 50,
  p_page INT DEFAULT 1
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
  total_count BIGINT,
  -- Nouvelles colonnes pour info lot
  lot_id UUID,
  numero_lot TEXT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_offset INT;
  v_search_pattern TEXT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search_pattern := '%' || LOWER(COALESCE(p_search, '')) || '%';
  
  RETURN QUERY
  WITH lots_fifo AS (
    -- Récupérer le lot le plus ancien avec stock pour chaque produit (FIFO)
    SELECT DISTINCT ON (l.produit_id)
      l.produit_id,
      l.id AS lot_id,
      l.numero_lot,
      l.date_peremption,
      l.prix_achat_unitaire,
      l.quantite_restante,
      -- Prix depuis le lot s'ils existent, sinon depuis le produit
      COALESCE(l.prix_vente_ht, 0) AS lot_prix_vente_ht,
      COALESCE(l.prix_vente_ttc, 0) AS lot_prix_vente_ttc,
      COALESCE(l.taux_tva, 0) AS lot_taux_tva,
      COALESCE(l.montant_tva, 0) AS lot_montant_tva,
      COALESCE(l.taux_centime_additionnel, 0) AS lot_taux_centime,
      COALESCE(l.montant_centime_additionnel, 0) AS lot_montant_centime
    FROM lots l
    WHERE l.tenant_id = p_tenant_id
      AND l.quantite_restante > 0
      AND l.prix_achat_unitaire > 0  -- Lot doit avoir un prix d'achat valide
    ORDER BY l.produit_id, l.date_reception ASC, l.date_peremption ASC NULLS LAST
  ),
  produits_avec_stock AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      -- Utiliser les prix du lot FIFO s'ils existent, sinon fallback produit
      CASE 
        WHEN lf.lot_prix_vente_ttc > 0 THEN lf.lot_prix_vente_ttc
        ELSE COALESCE(p.prix_vente_ttc, 0)
      END AS prix_vente_ttc,
      CASE 
        WHEN lf.lot_prix_vente_ht > 0 THEN lf.lot_prix_vente_ht
        ELSE COALESCE(p.prix_vente_ht, 0)
      END AS prix_vente_ht,
      CASE 
        WHEN lf.lot_taux_tva > 0 THEN lf.lot_taux_tva
        ELSE COALESCE(p.taux_tva, 0)
      END AS taux_tva_val,
      CASE 
        WHEN lf.lot_montant_tva > 0 THEN lf.lot_montant_tva
        ELSE COALESCE(p.tva, 0)
      END AS tva_montant_val,
      CASE 
        WHEN lf.lot_taux_centime > 0 THEN lf.lot_taux_centime
        ELSE COALESCE(p.taux_centime_additionnel, 0)
      END AS taux_centime_val,
      CASE 
        WHEN lf.lot_montant_centime > 0 THEN lf.lot_montant_centime
        ELSE COALESCE(p.centime_additionnel, 0)
      END AS centime_montant_val,
      f.libelle_famille AS famille_libelle,
      d.nom_dci AS dci_nom,
      COALESCE(p.prescription_requise, FALSE) AS requires_prescription,
      lf.lot_id,
      lf.numero_lot,
      lf.date_peremption,
      lf.prix_achat_unitaire,
      -- Stock total du produit (somme de tous les lots)
      (SELECT COALESCE(SUM(l2.quantite_restante), 0)::BIGINT 
       FROM lots l2 
       WHERE l2.produit_id = p.id 
       AND l2.tenant_id = p.tenant_id 
       AND l2.quantite_restante > 0) AS stock_disponible
    FROM produits p
    INNER JOIN lots_fifo lf ON lf.produit_id = p.id
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    LEFT JOIN dci d ON d.id = p.dci_id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
  ),
  filtered AS (
    SELECT *
    FROM produits_avec_stock pas
    WHERE (
      p_search = '' 
      OR LOWER(pas.libelle_produit) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.dci_nom, '')) LIKE v_search_pattern
      OR LOWER(COALESCE(pas.code_cip, '')) LIKE v_search_pattern
    )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM filtered
  )
  SELECT 
    filtered.id,
    filtered.tenant_id,
    filtered.libelle_produit AS name,
    filtered.libelle_produit,
    filtered.dci_nom AS dci,
    filtered.code_cip,
    filtered.prix_vente_ttc AS price,
    filtered.prix_vente_ht AS price_ht,
    filtered.taux_tva_val AS taux_tva,
    filtered.tva_montant_val AS tva_montant,
    filtered.taux_centime_val AS taux_centime_additionnel,
    filtered.centime_montant_val AS centime_additionnel_montant,
    filtered.stock_disponible AS stock,
    filtered.famille_libelle AS category,
    filtered.requires_prescription,
    counted.total AS total_count,
    filtered.lot_id,
    filtered.numero_lot,
    filtered.date_peremption,
    filtered.prix_achat_unitaire
  FROM filtered
  CROSS JOIN counted
  ORDER BY filtered.libelle_produit
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- 3. Recréer search_product_by_barcode avec prix depuis les LOTS (FIFO)
CREATE FUNCTION public.search_product_by_barcode(
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
  -- Nouvelles colonnes pour info lot
  lot_id UUID,
  numero_lot TEXT,
  date_peremption DATE,
  prix_achat_unitaire NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_produit_id UUID;
  v_lot_record RECORD;
BEGIN
  -- Trouver le produit par code-barres
  SELECT p.id INTO v_produit_id
  FROM produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = TRUE
    AND (
      p.code_cip = p_barcode
      OR p.code_ean = p_barcode
      OR p.code_interne = p_barcode
    )
  LIMIT 1;

  IF v_produit_id IS NULL THEN
    RETURN;
  END IF;

  -- Récupérer le lot FIFO avec stock
  SELECT 
    l.id AS lot_id,
    l.numero_lot,
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

  -- Retourner les données produit avec prix du lot
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    d.nom_dci AS dci,
    p.code_cip,
    -- Prix depuis lot FIFO ou fallback produit
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
    v_lot_record.prix_achat_unitaire
  FROM produits p
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.id = v_produit_id;
END;
$$;

-- 4. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(UUID, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(UUID, TEXT) TO authenticated;

-- 5. Commentaires pour documentation
COMMENT ON FUNCTION public.get_pos_products IS 'Recherche POS avec prix depuis lots FIFO. Retourne le lot le plus ancien avec stock et prix d''achat valide.';
COMMENT ON FUNCTION public.search_product_by_barcode IS 'Recherche par code-barres avec prix depuis lot FIFO. Source de vérité: lot le plus ancien avec stock disponible.';