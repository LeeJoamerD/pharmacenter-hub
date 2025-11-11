-- Correction de get_dashboard_stock_metrics pour utiliser la CASCADE COMPLÈTE à 3 niveaux
-- Problème: Utilise COALESCE simple au lieu de get_stock_threshold_cascade()
-- Solution: Remplacer par get_stock_threshold_cascade() pour cohérence totale

DROP FUNCTION IF EXISTS public.get_dashboard_stock_metrics(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_dashboard_stock_metrics(tenant_filter UUID)
RETURNS JSON AS $$
DECLARE
  total_value NUMERIC := 0;
  available_count INTEGER := 0;
  low_stock_count INTEGER := 0;
  out_of_stock_count INTEGER := 0;
  total_products_count INTEGER := 0;
BEGIN
  WITH stock_calculs AS (
    SELECT 
      p.id,
      p.prix_achat,
      COALESCE(SUM(l.quantite_restante), 0) AS stock_reel,
      -- ✅ CASCADE COMPLÈTE à 3 niveaux via get_stock_threshold_cascade
      public.get_stock_threshold_cascade('critical', p.stock_critique, p.stock_faible, p.stock_limite, tenant_filter) AS seuil_critique,
      public.get_stock_threshold_cascade('low', p.stock_critique, p.stock_faible, p.stock_limite, tenant_filter) AS seuil_faible
    FROM public.produits p
    LEFT JOIN public.lots l ON l.produit_id = p.id 
      AND l.tenant_id = tenant_filter 
      AND l.quantite_restante > 0
    WHERE p.tenant_id = tenant_filter AND p.is_active = true
    -- ✅ Ajouter stock_limite au GROUP BY car maintenant utilisé dans la cascade
    GROUP BY p.id, p.stock_critique, p.stock_faible, p.stock_limite, p.prix_achat
  )
  SELECT 
    COALESCE(SUM(stock_reel * COALESCE(prix_achat, 0)), 0),
    COUNT(*) FILTER (WHERE stock_reel > seuil_faible),
    COUNT(*) FILTER (WHERE stock_reel > 0 AND stock_reel <= seuil_faible),
    COUNT(*) FILTER (WHERE stock_reel = 0),
    COUNT(*)
  INTO total_value, available_count, low_stock_count, out_of_stock_count, total_products_count
  FROM stock_calculs;
  
  RETURN json_build_object(
    'totalValue', COALESCE(total_value, 0),
    'availableProducts', COALESCE(available_count, 0),
    'lowStockProducts', COALESCE(low_stock_count, 0),
    'outOfStockProducts', COALESCE(out_of_stock_count, 0),
    'totalProducts', COALESCE(total_products_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stock_metrics(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_dashboard_stock_metrics IS 
'Calcule les métriques de stock du dashboard avec CASCADE COMPLÈTE à 3 niveaux.
Utilise get_stock_threshold_cascade pour cohérence totale avec toutes les autres fonctions RPC.
Cascade: stock_critique/stock_faible (produit) → stock_limite (produit) → alert_settings (tenant) → défaut.';