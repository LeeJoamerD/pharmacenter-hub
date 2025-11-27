-- ============================================================
-- AJOUT: optimalValue dans calculate_stock_metrics
-- Stock Optimal = seuil_maximum × prix_achat (niveau de stock normal cible)
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_stock_metrics(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSON;
BEGIN
  WITH stock_data AS (
    SELECT 
      p.id,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) as stock_actuel,
      COALESCE(SUM(l.quantite_restante * COALESCE(l.prix_achat_unitaire, p.prix_achat, 0)), 0) as valeur_stock,
      -- CASCADE à 3 niveaux via la fonction dédiée
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, p_tenant_id) as seuil_maximum
    FROM produits p
    LEFT JOIN lots l ON l.produit_id = p.id 
      AND l.tenant_id = p_tenant_id 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = p_tenant_id AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite, p.prix_achat
  )
  SELECT json_build_object(
    'totalProducts', COUNT(*)::int,
    'availableProducts', COUNT(*) FILTER (WHERE stock_actuel > 0)::int,
    'lowStockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_critique AND stock_actuel <= seuil_faible)::int,
    'outOfStockProducts', COUNT(*) FILTER (WHERE stock_actuel = 0)::int,
    'criticalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_critique)::int,
    'overstockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_maximum)::int,
    'normalStockProducts', COUNT(*) FILTER (WHERE stock_actuel > seuil_faible AND stock_actuel <= seuil_maximum)::int,
    'fastMovingProducts', COUNT(*) FILTER (WHERE stock_actuel > 0 AND stock_actuel <= seuil_faible)::int,
    'totalValue', COALESCE(SUM(valeur_stock), 0)::numeric,
    -- ✅ NOUVEAU: Stock Optimal = seuil_maximum × prix_achat pour tous les produits actifs
    'optimalValue', COALESCE(SUM(seuil_maximum * COALESCE(prix_achat, 0)), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$function$;

-- Documentation mise à jour
COMMENT ON FUNCTION public.calculate_stock_metrics(uuid) IS 
  'Calcule les métriques de stock pour CurrentStockTab et StockValuation.
   IMPORTANT: 
   - availableProducts inclut TOUS les produits avec stock > 0 (critique, faible, normal, surstock)
   - totalValue: valeur actuelle du stock (stock_actuel × prix_achat)
   - optimalValue: valeur du stock optimal (seuil_maximum × prix_achat) - stock cible au niveau normal';