-- =====================================================
-- FONCTIONS RPC POUR OPTIMISATION DASHBOARD PRINCIPAL
-- Corriger les problèmes de pagination (6522 produits)
-- =====================================================

-- 1. Fonction RPC : Métriques stock complètes (Dashboard Principal)
CREATE OR REPLACE FUNCTION get_dashboard_stock_metrics(tenant_filter UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_value NUMERIC;
  available_count INT;
  low_stock_count INT;
  out_of_stock_count INT;
BEGIN
  -- Calcul valeur totale du stock via lots
  SELECT COALESCE(SUM(
    CASE 
      WHEN l.quantite_restante > 0 
      THEN l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)
      ELSE 0 
    END
  ), 0)
  INTO total_value
  FROM produits p
  LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p.tenant_id AND l.quantite_restante > 0
  WHERE p.tenant_id = tenant_filter AND p.is_active = true;

  -- Comptages des produits par catégorie de stock
  SELECT 
    COUNT(*) FILTER (WHERE stock_actuel > 10),
    COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= 10),
    COUNT(*) FILTER (WHERE stock_actuel = 0)
  INTO available_count, low_stock_count, out_of_stock_count
  FROM produits
  WHERE tenant_id = tenant_filter AND is_active = true;

  -- Construction du résultat JSON
  result := json_build_object(
    'totalValue', total_value,
    'availableProducts', available_count,
    'lowStockProducts', low_stock_count,
    'outOfStockProducts', out_of_stock_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction RPC : Valeur totale du stock (utilisée en fallback)
CREATE OR REPLACE FUNCTION calculate_total_stock_value(tenant_filter UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0))
     FROM lots l
     JOIN produits p ON p.id = l.produit_id
     WHERE l.tenant_id = tenant_filter AND l.quantite_restante > 0),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Index pour améliorer les performances des requêtes du dashboard
CREATE INDEX IF NOT EXISTS idx_ventes_tenant_created_at 
  ON ventes(tenant_id, created_at DESC)
  WHERE statut = 'Validée';

CREATE INDEX IF NOT EXISTS idx_lignes_ventes_tenant_created 
  ON lignes_ventes(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_produits_tenant_stock_active
  ON produits(tenant_id, stock_actuel) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_lots_tenant_quantite
  ON lots(tenant_id, produit_id, quantite_restante)
  WHERE quantite_restante > 0;

CREATE INDEX IF NOT EXISTS idx_sessions_caisse_tenant_statut 
  ON sessions_caisse(tenant_id, statut)
  WHERE statut = 'ouverte';

CREATE INDEX IF NOT EXISTS idx_promotions_tenant_actif
  ON promotions(tenant_id, est_actif, date_debut, date_fin)
  WHERE est_actif = true;

CREATE INDEX IF NOT EXISTS idx_utilisations_promotion_tenant_date
  ON utilisations_promotion(tenant_id, date_utilisation DESC);

-- 4. Permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stock_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_stock_value TO authenticated;

-- 5. Commentaires de documentation
COMMENT ON FUNCTION get_dashboard_stock_metrics IS 
  'Calcule les métriques de stock pour le dashboard principal. Optimisé pour gérer plus de 6000 produits sans problèmes de pagination.';

COMMENT ON FUNCTION calculate_total_stock_value IS 
  'Calcule la valeur totale du stock en utilisant les prix d''achat des lots. Utilisé en fallback si get_dashboard_stock_metrics échoue.';
