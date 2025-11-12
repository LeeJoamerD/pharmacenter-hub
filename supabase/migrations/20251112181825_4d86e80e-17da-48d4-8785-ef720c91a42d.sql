-- ============================================
-- CORRECTION: get_dashboard_stock_metrics
-- Calcul séparé des produits critiques, faibles et surstock
-- Utilise la logique de cascade à 3 niveaux
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_stock_metrics(tenant_filter UUID)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_value NUMERIC := 0;
  available_count INTEGER := 0;
  critical_stock_count INTEGER := 0;
  low_stock_count INTEGER := 0;
  out_of_stock_count INTEGER := 0;
  overstock_count INTEGER := 0;
  total_products_count INTEGER := 0;
BEGIN
  -- Calcul avec CTE pour appliquer les seuils de cascade
  WITH stock_calculs AS (
    SELECT 
      p.id,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) AS stock_reel,
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, tenant_filter)::NUMERIC AS seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, tenant_filter)::NUMERIC AS seuil_faible,
      public.get_stock_threshold_cascade('maximum', p.stock_critique, p.stock_faible, p.stock_limite, tenant_filter)::NUMERIC AS seuil_maximum
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = tenant_filter 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = tenant_filter AND p.is_active = true
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite, p.prix_achat
  )
  SELECT 
    -- Valeur totale du stock
    COALESCE(SUM(stock_reel * COALESCE(prix_achat, 0)), 0),
    -- Disponibles (stock > seuil_faible, excluant surstock)
    COUNT(*) FILTER (WHERE stock_reel > seuil_faible AND (seuil_maximum IS NULL OR stock_reel <= seuil_maximum)),
    -- Critiques (0 < stock <= seuil_critique)
    COUNT(*) FILTER (WHERE stock_reel > 0 AND stock_reel <= seuil_critique),
    -- Faibles (seuil_critique < stock <= seuil_faible)
    COUNT(*) FILTER (WHERE stock_reel > seuil_critique AND stock_reel <= seuil_faible),
    -- Ruptures (stock = 0)
    COUNT(*) FILTER (WHERE stock_reel = 0),
    -- Surstock (stock > seuil_maximum)
    COUNT(*) FILTER (WHERE seuil_maximum IS NOT NULL AND stock_reel > seuil_maximum),
    -- Total produits
    COUNT(*)
  INTO 
    total_value, 
    available_count, 
    critical_stock_count, 
    low_stock_count, 
    out_of_stock_count, 
    overstock_count,
    total_products_count
  FROM stock_calculs;

  -- Retourner le résultat JSON
  RETURN json_build_object(
    'totalValue', COALESCE(total_value, 0),
    'availableProducts', COALESCE(available_count, 0),
    'criticalStockProducts', COALESCE(critical_stock_count, 0),
    'lowStockProducts', COALESCE(low_stock_count, 0),
    'outOfStockProducts', COALESCE(out_of_stock_count, 0),
    'overstockProducts', COALESCE(overstock_count, 0),
    'totalProducts', COALESCE(total_products_count, 0)
  );
END;
$$;

COMMENT ON FUNCTION get_dashboard_stock_metrics IS 
'Calcule les métriques de stock pour le dashboard principal avec distinction critique/faible/surstock selon logique de cascade à 3 niveaux';