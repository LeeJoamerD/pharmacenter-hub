-- RPCs pour la comptabilité analytique

-- 1. RPC de calcul de rentabilité avec filtres
CREATE OR REPLACE FUNCTION get_profitability_data(
  p_tenant_id UUID,
  p_date_debut DATE DEFAULT NULL,
  p_date_fin DATE DEFAULT NULL,
  p_famille_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  produit_id UUID,
  produit_nom TEXT,
  code_produit TEXT,
  famille TEXT,
  chiffre_affaires NUMERIC,
  quantite_vendue BIGINT,
  cout_achat NUMERIC,
  marge_brute NUMERIC,
  taux_marge NUMERIC,
  derniere_vente TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS produit_id,
    p.libelle_produit::TEXT AS produit_nom,
    COALESCE(p.code_cip, p.code_barre, '')::TEXT AS code_produit,
    COALESCE(f.libelle_famille, 'Sans famille')::TEXT AS famille,
    COALESCE(SUM(lv.montant_ligne_ttc), 0)::NUMERIC AS chiffre_affaires,
    COALESCE(SUM(lv.quantite), 0)::BIGINT AS quantite_vendue,
    COALESCE(SUM(lv.quantite * p.prix_achat), 0)::NUMERIC AS cout_achat,
    (COALESCE(SUM(lv.montant_ligne_ttc), 0) - COALESCE(SUM(lv.quantite * p.prix_achat), 0))::NUMERIC AS marge_brute,
    CASE WHEN COALESCE(SUM(lv.montant_ligne_ttc), 0) > 0 
      THEN ROUND(((COALESCE(SUM(lv.montant_ligne_ttc), 0) - COALESCE(SUM(lv.quantite * p.prix_achat), 0)) / 
            COALESCE(SUM(lv.montant_ligne_ttc), 0)) * 100, 2)
      ELSE 0
    END::NUMERIC AS taux_marge,
    MAX(v.date_vente)::TIMESTAMPTZ AS derniere_vente
  FROM produits p
  LEFT JOIN famille_produit f ON p.famille_produit_id = f.id
  LEFT JOIN lignes_ventes lv ON lv.produit_id = p.id
  LEFT JOIN ventes v ON lv.vente_id = v.id
  WHERE p.tenant_id = p_tenant_id
    AND (p_date_debut IS NULL OR v.date_vente >= p_date_debut)
    AND (p_date_fin IS NULL OR v.date_vente <= p_date_fin)
    AND (p_famille_id IS NULL OR p.famille_produit_id = p_famille_id)
  GROUP BY p.id, p.libelle_produit, p.code_cip, p.code_barre, f.libelle_famille
  HAVING COALESCE(SUM(lv.montant_ligne_ttc), 0) > 0
  ORDER BY COALESCE(SUM(lv.montant_ligne_ttc), 0) DESC
  LIMIT p_limit;
END;
$$;

-- 2. RPC de performance des centres de coûts
CREATE OR REPLACE FUNCTION get_center_performance_data(
  p_tenant_id UUID,
  p_annee INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  nom TEXT,
  type_centre TEXT,
  responsable_nom TEXT,
  budget_total NUMERIC,
  realise_total NUMERIC,
  ecart_montant NUMERIC,
  ecart_pourcentage NUMERIC,
  nombre_budgets BIGINT,
  budgets_depassement BIGINT,
  est_actif BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.code::TEXT,
    cc.nom::TEXT,
    cc.type_centre::TEXT,
    COALESCE(pe.prenoms || ' ' || pe.noms, 'Non assigné')::TEXT AS responsable_nom,
    COALESCE(SUM(b.montant_prevu), 0)::NUMERIC AS budget_total,
    COALESCE(SUM(b.montant_realise), 0)::NUMERIC AS realise_total,
    (COALESCE(SUM(b.montant_realise), 0) - COALESCE(SUM(b.montant_prevu), 0))::NUMERIC AS ecart_montant,
    CASE WHEN COALESCE(SUM(b.montant_prevu), 0) > 0 
      THEN ROUND(((COALESCE(SUM(b.montant_realise), 0) - COALESCE(SUM(b.montant_prevu), 0)) / 
            COALESCE(SUM(b.montant_prevu), 0)) * 100, 2)
      ELSE 0
    END::NUMERIC AS ecart_pourcentage,
    COUNT(b.id)::BIGINT AS nombre_budgets,
    COUNT(CASE WHEN b.ecart_pourcentage > 5 THEN 1 END)::BIGINT AS budgets_depassement,
    cc.est_actif
  FROM centres_couts cc
  LEFT JOIN personnel pe ON cc.responsable_id = pe.id
  LEFT JOIN budgets b ON b.centre_cout_id = cc.id
  WHERE cc.tenant_id = p_tenant_id
    AND (p_annee IS NULL OR b.annee = p_annee)
  GROUP BY cc.id, cc.code, cc.nom, cc.type_centre, pe.prenoms, pe.noms, cc.est_actif
  ORDER BY cc.code;
END;
$$;

-- 3. RPC de génération de numéro de répartition
CREATE OR REPLACE FUNCTION generate_allocation_number(
  p_tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_count INT;
  v_numero TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM repartitions_charges
  WHERE tenant_id = p_tenant_id
    AND numero_repartition LIKE 'REP-' || v_year || v_month || '-%';
  
  v_numero := 'REP-' || v_year || v_month || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_numero;
END;
$$;

-- 4. RPC de données budgétaires pour graphiques
CREATE OR REPLACE FUNCTION get_budget_chart_data(
  p_tenant_id UUID,
  p_annee INT DEFAULT NULL,
  p_centre_id UUID DEFAULT NULL
)
RETURNS TABLE (
  periode TEXT,
  mois INT,
  budget NUMERIC,
  realise NUMERIC,
  ecart NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_annee INT;
BEGIN
  v_annee := COALESCE(p_annee, EXTRACT(YEAR FROM NOW())::INT);
  
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE(v_annee || '-' || LPAD(b.mois::TEXT, 2, '0') || '-01'), 'Mon')::TEXT AS periode,
    b.mois::INT,
    COALESCE(SUM(b.montant_prevu), 0)::NUMERIC AS budget,
    COALESCE(SUM(b.montant_realise), 0)::NUMERIC AS realise,
    COALESCE(SUM(b.ecart_montant), 0)::NUMERIC AS ecart
  FROM budgets b
  WHERE b.tenant_id = p_tenant_id
    AND b.annee = v_annee
    AND b.type_periode = 'mensuel'
    AND (p_centre_id IS NULL OR b.centre_cout_id = p_centre_id)
  GROUP BY b.mois
  ORDER BY b.mois;
END;
$$;

-- 5. RPC d'agrégation analytique globale
CREATE OR REPLACE FUNCTION get_analytical_summary(
  p_tenant_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_centres_actifs INT;
  v_budget_total NUMERIC;
  v_realise_total NUMERIC;
  v_ecart_moyen NUMERIC;
  v_marge_globale NUMERIC;
  v_centres_depassement INT;
  v_centres_sous_budget INT;
  v_repartitions_en_cours INT;
BEGIN
  -- Centres actifs
  SELECT COUNT(*) INTO v_centres_actifs
  FROM centres_couts
  WHERE tenant_id = p_tenant_id AND est_actif = TRUE;
  
  -- Totaux budgétaires
  SELECT 
    COALESCE(SUM(montant_prevu), 0),
    COALESCE(SUM(montant_realise), 0),
    COALESCE(AVG(ecart_pourcentage), 0)
  INTO v_budget_total, v_realise_total, v_ecart_moyen
  FROM budgets
  WHERE tenant_id = p_tenant_id;
  
  -- Centres en dépassement vs sous budget
  SELECT 
    COUNT(CASE WHEN ecart_pourcentage > 5 THEN 1 END),
    COUNT(CASE WHEN ecart_pourcentage < -5 THEN 1 END)
  INTO v_centres_depassement, v_centres_sous_budget
  FROM budgets
  WHERE tenant_id = p_tenant_id;
  
  -- Marge globale moyenne
  SELECT COALESCE(AVG(taux_marge), 0) INTO v_marge_globale
  FROM v_rentabilite_produits
  WHERE tenant_id = p_tenant_id;
  
  -- Répartitions en cours
  SELECT COUNT(*) INTO v_repartitions_en_cours
  FROM repartitions_charges
  WHERE tenant_id = p_tenant_id AND statut = 'en_cours';
  
  v_result := json_build_object(
    'centresActifs', v_centres_actifs,
    'budgetTotal', v_budget_total,
    'realiseTotal', v_realise_total,
    'ecartMoyen', ROUND(v_ecart_moyen, 2),
    'margeGlobale', ROUND(v_marge_globale, 2),
    'centresDepassement', v_centres_depassement,
    'centresSousBudget', v_centres_sous_budget,
    'repartitionsEnCours', v_repartitions_en_cours
  );
  
  RETURN v_result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_profitability_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_center_performance_data TO authenticated;
GRANT EXECUTE ON FUNCTION generate_allocation_number TO authenticated;
GRANT EXECUTE ON FUNCTION get_budget_chart_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytical_summary TO authenticated;