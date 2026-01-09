-- Fix stock threshold cascade logic to ignore 0 values
-- NULLIF(value, 0) converts 0 to NULL, allowing COALESCE to fall back to tenant settings

-- 1. Fix get_stock_threshold_cascade function
CREATE OR REPLACE FUNCTION public.get_stock_threshold_cascade(
  p_threshold_type TEXT,
  p_product_critical INTEGER,
  p_product_low INTEGER,
  p_product_max INTEGER,
  p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_settings_critical INTEGER;
  v_settings_low INTEGER;
  v_settings_max INTEGER;
BEGIN
  -- Récupérer les seuils du tenant depuis alert_settings
  SELECT 
    critical_stock_threshold,
    low_stock_threshold,
    maximum_stock_threshold
  INTO 
    v_settings_critical,
    v_settings_low,
    v_settings_max
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;
  
  -- CASCADE avec exclusion des valeurs 0 ou négatives
  -- NULLIF(valeur, 0) convertit 0 en NULL pour permettre le fallback
  RETURN CASE p_threshold_type
    WHEN 'critical' THEN COALESCE(NULLIF(p_product_critical, 0), v_settings_critical, 2)
    WHEN 'low' THEN COALESCE(NULLIF(p_product_low, 0), v_settings_low, 5)
    WHEN 'maximum' THEN COALESCE(NULLIF(p_product_max, 0), v_settings_max, 10)
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Recreate calculate_stock_metrics to use the corrected cascade function
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
      -- CASCADE corrigée via la fonction mise à jour (ignore les 0)
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
    'optimalValue', COALESCE(SUM(seuil_maximum * COALESCE(prix_achat, 0)), 0)::numeric
  ) INTO v_result
  FROM stock_data;
  
  RETURN v_result;
END;
$function$;