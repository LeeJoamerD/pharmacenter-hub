-- ============================================
-- AJOUT DU TAUX DE MARQUE DANS LA COMPTABILITÉ ANALYTIQUE
-- Taux de Marge = (CA - Coût) / Coût × 100 (gain sur coût d'achat)
-- Taux de Marque = (CA - Coût) / CA × 100 (part de marge dans le CA)
-- ============================================

-- 1. Supprimer la fonction existante
DROP FUNCTION IF EXISTS get_profitability_data(UUID, DATE, DATE, UUID, INT);

-- 2. Recréer la RPC avec le nouveau champ taux_marque
CREATE OR REPLACE FUNCTION get_profitability_data(
  p_tenant_id UUID,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL,
  p_famille_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 10000
)
RETURNS TABLE (
  produit_id UUID,
  tenant_id UUID,
  produit_nom TEXT,
  code_produit TEXT,
  famille TEXT,
  chiffre_affaires NUMERIC,
  quantite_vendue BIGINT,
  cout_achat NUMERIC,
  marge_brute NUMERIC,
  taux_marge NUMERIC,      -- (CA - Coût) / Coût × 100
  taux_marque NUMERIC,     -- (CA - Coût) / CA × 100 (NOUVEAU)
  derniere_vente DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS produit_id,
    p.tenant_id,
    p.libelle_produit AS produit_nom,
    COALESCE(p.code_cip, p.code_barre_externe, '')::TEXT AS code_produit,
    COALESCE(f.libelle_famille, 'Sans famille')::TEXT AS famille,
    COALESCE(SUM(lv.montant_ligne_ttc), 0)::NUMERIC AS chiffre_affaires,
    COALESCE(SUM(lv.quantite), 0)::BIGINT AS quantite_vendue,
    COALESCE(SUM(lv.quantite * p.prix_achat), 0)::NUMERIC AS cout_achat,
    (COALESCE(SUM(lv.montant_ligne_ttc), 0) - COALESCE(SUM(lv.quantite * p.prix_achat), 0))::NUMERIC AS marge_brute,
    -- Taux de Marge: (CA - Coût) / Coût × 100
    CASE WHEN COALESCE(SUM(lv.quantite * p.prix_achat), 0) > 0 
      THEN ROUND(((SUM(lv.montant_ligne_ttc) - SUM(lv.quantite * p.prix_achat)) / SUM(lv.quantite * p.prix_achat)) * 100, 2)
      ELSE 0
    END::NUMERIC AS taux_marge,
    -- Taux de Marque: (CA - Coût) / CA × 100
    CASE WHEN COALESCE(SUM(lv.montant_ligne_ttc), 0) > 0 
      THEN ROUND(((SUM(lv.montant_ligne_ttc) - SUM(lv.quantite * p.prix_achat)) / SUM(lv.montant_ligne_ttc)) * 100, 2)
      ELSE 0
    END::NUMERIC AS taux_marque,
    MAX(v.date_vente)::DATE AS derniere_vente
  FROM produits p
  LEFT JOIN famille_produit f ON p.famille_id = f.id
  LEFT JOIN lignes_ventes lv ON lv.produit_id = p.id
  LEFT JOIN ventes v ON lv.vente_id = v.id AND v.tenant_id = p_tenant_id
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND (p_famille_id IS NULL OR p.famille_id = p_famille_id)
    AND (p_date_debut IS NULL OR v.date_vente >= p_date_debut)
    AND (p_date_fin IS NULL OR v.date_vente <= p_date_fin)
  GROUP BY p.id, p.tenant_id, p.libelle_produit, p.code_cip, p.code_barre_externe, f.libelle_famille
  ORDER BY COALESCE(SUM(lv.montant_ligne_ttc), 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Mettre à jour calculate_profitability_metrics pour inclure les deux taux moyens
CREATE OR REPLACE FUNCTION calculate_profitability_metrics(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_ca_total NUMERIC;
  v_cout_total NUMERIC;
  v_marge_totale NUMERIC;
  v_taux_marge_global NUMERIC;
  v_taux_marque_global NUMERIC;
  v_nb_produits_vendus INT;
  v_nb_produits_total INT;
BEGIN
  -- Calcul des métriques globales sur TOUTES les lignes de ventes
  SELECT 
    COALESCE(SUM(lv.montant_ligne_ttc), 0),
    COALESCE(SUM(lv.quantite * p.prix_achat), 0),
    COALESCE(SUM(lv.montant_ligne_ttc) - SUM(lv.quantite * p.prix_achat), 0),
    -- Taux de Marge Global: (CA - Coût) / Coût × 100
    CASE WHEN COALESCE(SUM(lv.quantite * p.prix_achat), 0) > 0 
      THEN ROUND((SUM(lv.montant_ligne_ttc) - SUM(lv.quantite * p.prix_achat)) / SUM(lv.quantite * p.prix_achat) * 100, 2)
      ELSE 0 END,
    -- Taux de Marque Global: (CA - Coût) / CA × 100
    CASE WHEN COALESCE(SUM(lv.montant_ligne_ttc), 0) > 0 
      THEN ROUND((SUM(lv.montant_ligne_ttc) - SUM(lv.quantite * p.prix_achat)) / SUM(lv.montant_ligne_ttc) * 100, 2)
      ELSE 0 END,
    COUNT(DISTINCT lv.produit_id)
  INTO v_ca_total, v_cout_total, v_marge_totale, v_taux_marge_global, v_taux_marque_global, v_nb_produits_vendus
  FROM lignes_ventes lv
  JOIN ventes v ON lv.vente_id = v.id
  JOIN produits p ON lv.produit_id = p.id
  WHERE p.tenant_id = p_tenant_id;

  -- Nombre total de produits actifs
  SELECT COUNT(*) INTO v_nb_produits_total 
  FROM produits WHERE tenant_id = p_tenant_id AND is_active = true;
  
  v_result := json_build_object(
    'caTotal', v_ca_total,
    'coutTotal', v_cout_total,
    'margeTotale', v_marge_totale,
    'tauxMargeGlobal', v_taux_marge_global,
    'tauxMarqueGlobal', v_taux_marque_global,
    'nbProduitsVendus', v_nb_produits_vendus,
    'nbProduitsTotal', v_nb_produits_total
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_profitability_data(UUID, DATE, DATE, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profitability_metrics(UUID) TO authenticated;