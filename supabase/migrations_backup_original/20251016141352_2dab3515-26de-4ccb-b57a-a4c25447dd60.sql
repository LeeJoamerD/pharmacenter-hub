-- Fonction RPC pour calculer les métriques de stock de manière optimisée
CREATE OR REPLACE FUNCTION calculate_stock_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH stock_data AS (
    SELECT 
      p.id,
      p.stock_limite,
      p.stock_alerte,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id AND l.tenant_id = p_tenant_id AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_limite, p.stock_alerte, p.prix_achat
  )
  SELECT json_build_object(
    'totalProducts', COUNT(*)::int,
    'availableProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND (stock_alerte IS NULL OR stock_actuel > stock_alerte))::int,
    'lowStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_alerte IS NOT NULL AND stock_actuel <= stock_alerte)::int,
    'outOfStockProducts', COUNT(*) FILTER (WHERE stock_actuel = 0)::int,
    'criticalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_limite IS NOT NULL AND stock_actuel <= stock_limite * 0.1)::int,
    'totalValue', COALESCE(SUM(valeur_stock), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$$;