-- Corriger get_dashboard_stock_metrics pour utiliser la logique de cascade
-- (Les autres fonctions ont déjà été corrigées dans la migration 20251110202508)

CREATE OR REPLACE FUNCTION get_dashboard_stock_metrics(tenant_filter UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_value NUMERIC;
  available_count INT;
  low_stock_count INT;
  out_of_stock_count INT;
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
BEGIN
  -- Récupérer les seuils du tenant depuis alert_settings
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5)
  INTO v_critical_threshold, v_low_threshold
  FROM alert_settings
  WHERE tenant_id = tenant_filter
  LIMIT 1;

  -- Valeurs par défaut si aucun setting
  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);

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

  -- Comptages avec logique de cascade (produit > tenant > défaut)
  SELECT 
    COUNT(*) FILTER (WHERE stock_actuel > COALESCE(p.stock_faible, v_low_threshold)),
    COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)),
    COUNT(*) FILTER (WHERE stock_actuel = 0)
  INTO available_count, low_stock_count, out_of_stock_count
  FROM produits p
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

GRANT EXECUTE ON FUNCTION get_dashboard_stock_metrics TO authenticated;

COMMENT ON FUNCTION get_dashboard_stock_metrics IS 
  'Calcule les métriques de stock avec logique de cascade: valeurs produit > alert_settings tenant > défauts (2, 5)';