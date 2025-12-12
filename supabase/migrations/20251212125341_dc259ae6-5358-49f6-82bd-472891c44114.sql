-- Fix AI dashboard and product relations issues

-- 1. Add accuracy column to ai_models if missing
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,2);

-- 2. Add conditions_conservation column to produits if missing (for compatibility)
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS conditions_conservation TEXT;

-- 3. Drop and recreate get_ai_dashboard_metrics function
DROP FUNCTION IF EXISTS public.get_ai_dashboard_metrics(UUID);

CREATE FUNCTION public.get_ai_dashboard_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_models_count INTEGER;
  v_active_models INTEGER;
  v_avg_accuracy NUMERIC;
  v_consultations_count INTEGER;
  v_insights_count INTEGER;
  v_anomalies_count INTEGER;
BEGIN
  -- Count AI models
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE status = 'active'),
         COALESCE(AVG(accuracy), 0)
  INTO v_models_count, v_active_models, v_avg_accuracy
  FROM ai_models
  WHERE tenant_id = p_tenant_id;

  -- Count consultations today
  SELECT COUNT(*)
  INTO v_consultations_count
  FROM ai_pharma_consultations
  WHERE tenant_id = p_tenant_id
    AND created_at >= CURRENT_DATE;

  -- Count recent insights
  SELECT COUNT(*)
  INTO v_insights_count
  FROM ai_insights
  WHERE tenant_id = p_tenant_id
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';

  -- Count active anomalies
  SELECT COUNT(*)
  INTO v_anomalies_count
  FROM ai_anomalies
  WHERE tenant_id = p_tenant_id
    AND status = 'open';

  v_result := jsonb_build_object(
    'modelsCount', v_models_count,
    'activeModels', v_active_models,
    'avgAccuracy', ROUND(COALESCE(v_avg_accuracy, 0), 2),
    'consultationsToday', v_consultations_count,
    'recentInsights', v_insights_count,
    'activeAnomalies', v_anomalies_count
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ai_dashboard_metrics(UUID) TO authenticated;