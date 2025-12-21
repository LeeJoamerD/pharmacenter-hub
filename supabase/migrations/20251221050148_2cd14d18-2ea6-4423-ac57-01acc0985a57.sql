-- Migration: Recréer les RPC POS avec les colonnes de prix complètes
-- D'abord supprimer les anciennes fonctions puis les recréer

-- 1. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.get_pos_products(UUID, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.search_product_by_barcode(UUID, TEXT);

-- 2. Recréer get_pos_products avec toutes les colonnes de prix
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
  total_count BIGINT
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
  WITH produits_avec_stock AS (
    SELECT 
      p.id,
      p.tenant_id,
      p.libelle_produit,
      p.code_cip,
      p.prix_vente_ttc,
      p.prix_vente_ht,
      p.taux_tva AS p_taux_tva,
      p.tva AS p_tva_montant,
      p.taux_centime_additionnel AS p_taux_centime,
      p.centime_additionnel AS p_centime_montant,
      p.stock_limite,
      f.libelle_famille AS famille_libelle,
      d.nom_dci AS dci_nom,
      COALESCE(SUM(l.quantite_restante), 0)::BIGINT AS stock_disponible,
      COALESCE(p.prescription_requise, FALSE) AS requires_prescription
    FROM produits p
    LEFT JOIN famille_produit f ON f.id = p.famille_id
    LEFT JOIN dci d ON d.id = p.dci_id
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = TRUE
    GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, 
             p.prix_vente_ttc, p.prix_vente_ht, p.taux_tva, p.tva,
             p.taux_centime_additionnel, p.centime_additionnel,
             p.stock_limite, f.libelle_famille, d.nom_dci, p.prescription_requise
    HAVING COALESCE(SUM(l.quantite_restante), 0) > 0
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
    COALESCE(filtered.prix_vente_ttc, 0) AS price,
    COALESCE(filtered.prix_vente_ht, 0) AS price_ht,
    COALESCE(filtered.p_taux_tva, 0) AS taux_tva,
    COALESCE(filtered.p_tva_montant, 0) AS tva_montant,
    COALESCE(filtered.p_taux_centime, 0) AS taux_centime_additionnel,
    COALESCE(filtered.p_centime_montant, 0) AS centime_additionnel_montant,
    filtered.stock_disponible AS stock,
    filtered.famille_libelle AS category,
    filtered.requires_prescription,
    counted.total AS total_count
  FROM filtered
  CROSS JOIN counted
  ORDER BY filtered.libelle_produit
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- 3. Recréer search_product_by_barcode avec les mêmes colonnes
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
  requires_prescription BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.tenant_id,
    p.libelle_produit AS name,
    p.libelle_produit,
    d.nom_dci AS dci,
    p.code_cip,
    COALESCE(p.prix_vente_ttc, 0) AS price,
    COALESCE(p.prix_vente_ht, 0) AS price_ht,
    COALESCE(p.taux_tva, 0) AS taux_tva,
    COALESCE(p.tva, 0) AS tva_montant,
    COALESCE(p.taux_centime_additionnel, 0) AS taux_centime_additionnel,
    COALESCE(p.centime_additionnel, 0) AS centime_additionnel_montant,
    COALESCE((
      SELECT SUM(l.quantite_restante)::BIGINT 
      FROM lots l 
      WHERE l.produit_id = p.id 
      AND l.tenant_id = p.tenant_id 
      AND l.quantite_restante > 0
    ), 0) AS stock,
    f.libelle_famille AS category,
    COALESCE(p.prescription_requise, FALSE) AS requires_prescription
  FROM produits p
  LEFT JOIN famille_produit f ON f.id = p.famille_id
  LEFT JOIN dci d ON d.id = p.dci_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = TRUE
    AND (
      p.code_cip = p_barcode
      OR p.code_ean = p_barcode
      OR p.code_interne = p_barcode
    )
  LIMIT 1;
END;
$$;

-- 4. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_pos_products(UUID, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_by_barcode(UUID, TEXT) TO authenticated;