-- Corriger la fonction RPC calculate_stock_metrics pour utiliser la logique de cascade
CREATE OR REPLACE FUNCTION calculate_stock_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_low_threshold INT;
  v_critical_threshold INT;
  v_maximum_threshold INT;
BEGIN
  -- Récupérer les seuils depuis alert_settings
  SELECT 
    COALESCE(low_stock_threshold, 10),
    COALESCE(critical_stock_threshold, 5),
    COALESCE(maximum_stock_threshold, 100)
  INTO v_low_threshold, v_critical_threshold, v_maximum_threshold
  FROM alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- Si pas de configuration, utiliser les valeurs par défaut
  v_low_threshold := COALESCE(v_low_threshold, 10);
  v_critical_threshold := COALESCE(v_critical_threshold, 5);
  v_maximum_threshold := COALESCE(v_maximum_threshold, 100);

  WITH stock_data AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.stock_alerte,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- Logique de cascade pour les seuils
      COALESCE(NULLIF(p.stock_limite, 0), v_maximum_threshold) as seuil_maximum,
      COALESCE(NULLIF(p.stock_alerte, 0), v_low_threshold) as seuil_faible
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.stock_alerte, p.prix_achat
  )
  SELECT json_build_object(
    'totalProducts', COUNT(*)::int,
    'availableProducts', COUNT(*) FILTER (WHERE stock_actuel > 0)::int,
    'lowStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel > v_critical_threshold AND stock_actuel <= seuil_faible)::int,
    'outOfStockProducts', COUNT(*) FILTER (WHERE stock_actuel = 0)::int,
    'criticalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= v_critical_threshold)::int,
    'overstockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_maximum)::int,
    'normalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible AND stock_actuel <= seuil_maximum)::int,
    'fastMovingProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_faible)::int,
    'totalValue', COALESCE(SUM(valeur_stock), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$$;