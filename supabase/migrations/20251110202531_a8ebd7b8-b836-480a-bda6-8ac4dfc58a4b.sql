-- Correction des fonctions RPC pour utiliser stock_critique et stock_faible au lieu de stock_alerte
-- D'abord supprimer les anciennes versions

DROP FUNCTION IF EXISTS public.get_active_stock_alerts(uuid);
DROP FUNCTION IF EXISTS public.get_stock_status_distribution(uuid);
DROP FUNCTION IF EXISTS public.get_top_critical_products(uuid, integer);
DROP FUNCTION IF EXISTS public.get_low_stock_products(uuid);
DROP FUNCTION IF EXISTS public.get_low_stock_metrics(uuid);

-- 1. Fonction get_active_stock_alerts
CREATE FUNCTION public.get_active_stock_alerts(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_maximum_threshold INTEGER;
BEGIN
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5),
    COALESCE(maximum_stock_threshold, 10)
  INTO v_critical_threshold, v_low_threshold, v_maximum_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);
  v_maximum_threshold := COALESCE(v_maximum_threshold, 10);

  SELECT jsonb_build_object(
    'critical', COUNT(*) FILTER (
      WHERE stock_actuel > 0 
      AND stock_actuel <= COALESCE(p.stock_critique, v_critical_threshold)
    ),
    'low', COUNT(*) FILTER (
      WHERE stock_actuel > COALESCE(p.stock_critique, v_critical_threshold)
      AND stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)
    ),
    'outOfStock', COUNT(*) FILTER (WHERE stock_actuel = 0),
    'overstock', COUNT(*) FILTER (
      WHERE p.stock_limite IS NOT NULL 
      AND stock_actuel > COALESCE(p.stock_limite, v_maximum_threshold)
    )
  ) INTO v_result
  FROM public.produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true;

  RETURN COALESCE(v_result, '{"critical":0,"low":0,"outOfStock":0,"overstock":0}'::jsonb);
END;
$function$;

-- 2. Fonction get_stock_status_distribution
CREATE FUNCTION public.get_stock_status_distribution(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_maximum_threshold INTEGER;
BEGIN
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5),
    COALESCE(maximum_stock_threshold, 10)
  INTO v_critical_threshold, v_low_threshold, v_maximum_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);
  v_maximum_threshold := COALESCE(v_maximum_threshold, 10);

  SELECT jsonb_build_object(
    'available', COUNT(*) FILTER (
      WHERE stock_actuel > COALESCE(p.stock_faible, v_low_threshold)
      AND (p.stock_limite IS NULL OR stock_actuel <= COALESCE(p.stock_limite, v_maximum_threshold))
    ),
    'low', COUNT(*) FILTER (
      WHERE stock_actuel > COALESCE(p.stock_critique, v_critical_threshold)
      AND stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)
    ),
    'critical', COUNT(*) FILTER (
      WHERE stock_actuel > 0 
      AND stock_actuel <= COALESCE(p.stock_critique, v_critical_threshold)
    ),
    'outOfStock', COUNT(*) FILTER (WHERE stock_actuel = 0),
    'overstock', COUNT(*) FILTER (
      WHERE p.stock_limite IS NOT NULL 
      AND stock_actuel > COALESCE(p.stock_limite, v_maximum_threshold)
    )
  ) INTO v_result
  FROM public.produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true;

  RETURN COALESCE(v_result, '{"available":0,"low":0,"critical":0,"outOfStock":0,"overstock":0}'::jsonb);
END;
$function$;

-- 3. Fonction get_top_critical_products
CREATE FUNCTION public.get_top_critical_products(p_tenant_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  produit_id uuid,
  libelle_produit text,
  stock_actuel numeric,
  stock_critique integer,
  stock_faible integer,
  stock_limite integer,
  days_until_out integer,
  priority_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
BEGIN
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5)
  INTO v_critical_threshold, v_low_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);

  RETURN QUERY
  SELECT 
    p.id,
    p.libelle_produit,
    p.stock_actuel,
    p.stock_critique,
    p.stock_faible,
    p.stock_limite,
    CASE 
      WHEN p.stock_actuel <= 0 THEN 0
      ELSE GREATEST(1, FLOOR(p.stock_actuel / NULLIF(
        (SELECT AVG(lv.quantite)::numeric 
         FROM public.lignes_ventes lv 
         WHERE lv.produit_id = p.id 
         AND lv.tenant_id = p_tenant_id
         AND lv.created_at > NOW() - INTERVAL '30 days'), 0
      )))::integer
    END as days_until_out,
    (100 - (p.stock_actuel * 100.0 / NULLIF(COALESCE(p.stock_faible, v_low_threshold), 0)))::numeric as priority_score
  FROM public.produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
    AND p.stock_actuel > 0
    AND p.stock_actuel <= COALESCE(p.stock_critique, v_critical_threshold)
  ORDER BY priority_score DESC, p.stock_actuel ASC
  LIMIT p_limit;
END;
$function$;

-- 4. Fonction get_low_stock_products
CREATE FUNCTION public.get_low_stock_products(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb := '[]'::jsonb;
  v_product record;
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_status text;
BEGIN
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5)
  INTO v_critical_threshold, v_low_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);

  FOR v_product IN
    SELECT 
      p.id,
      p.libelle_produit,
      p.stock_actuel,
      p.stock_critique,
      p.stock_faible,
      p.stock_limite,
      p.prix_achat,
      p.prix_vente_ttc
    FROM public.produits p
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (
        p.stock_actuel = 0 
        OR p.stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)
      )
    ORDER BY p.stock_actuel ASC, p.libelle_produit ASC
  LOOP
    IF v_product.stock_actuel = 0 THEN
      v_status := 'out_of_stock';
    ELSIF v_product.stock_actuel <= COALESCE(v_product.stock_critique, v_critical_threshold) THEN
      v_status := 'critical';
    ELSE
      v_status := 'low';
    END IF;

    v_result := v_result || jsonb_build_object(
      'id', v_product.id,
      'libelle_produit', v_product.libelle_produit,
      'stock_actuel', v_product.stock_actuel,
      'stock_critique', v_product.stock_critique,
      'stock_faible', v_product.stock_faible,
      'stock_limite', v_product.stock_limite,
      'prix_achat', v_product.prix_achat,
      'prix_vente_ttc', v_product.prix_vente_ttc,
      'status', v_status
    );
  END LOOP;

  RETURN v_result;
END;
$function$;

-- 5. Fonction get_low_stock_metrics
CREATE FUNCTION public.get_low_stock_metrics(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_critical_threshold INTEGER;
  v_low_threshold INTEGER;
  v_critical_count INTEGER;
  v_low_count INTEGER;
  v_out_count INTEGER;
  v_total_value NUMERIC;
BEGIN
  SELECT 
    COALESCE(critical_stock_threshold, 2),
    COALESCE(low_stock_threshold, 5)
  INTO v_critical_threshold, v_low_threshold
  FROM public.alert_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  v_critical_threshold := COALESCE(v_critical_threshold, 2);
  v_low_threshold := COALESCE(v_low_threshold, 5);

  SELECT 
    COUNT(*) FILTER (
      WHERE stock_actuel > 0 
      AND stock_actuel <= COALESCE(p.stock_critique, v_critical_threshold)
    ),
    COUNT(*) FILTER (
      WHERE stock_actuel > COALESCE(p.stock_critique, v_critical_threshold)
      AND stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)
    ),
    COUNT(*) FILTER (WHERE stock_actuel = 0),
    SUM(
      CASE 
        WHEN stock_actuel <= COALESCE(p.stock_faible, v_low_threshold)
        THEN stock_actuel * COALESCE(prix_achat, 0)
        ELSE 0
      END
    )
  INTO v_critical_count, v_low_count, v_out_count, v_total_value
  FROM public.produits p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true;

  v_result := jsonb_build_object(
    'criticalCount', COALESCE(v_critical_count, 0),
    'lowCount', COALESCE(v_low_count, 0),
    'outOfStockCount', COALESCE(v_out_count, 0),
    'totalValue', COALESCE(v_total_value, 0)
  );

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_active_stock_alerts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stock_status_distribution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_critical_products(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_metrics(uuid) TO authenticated;