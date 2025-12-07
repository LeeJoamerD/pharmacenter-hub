-- RPC function to get AI Dashboard metrics
CREATE OR REPLACE FUNCTION public.get_ai_dashboard_metrics(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_models_active INTEGER;
  v_models_training INTEGER;
  v_models_inactive INTEGER;
  v_predictions_today INTEGER;
  v_predictions_week INTEGER;
  v_recommendations_total INTEGER;
  v_recommendations_implemented INTEGER;
  v_avg_accuracy NUMERIC;
  v_diagnostics_run INTEGER;
  v_anomalies_active INTEGER;
  v_insights_unread INTEGER;
  v_last_diagnostic_at TIMESTAMPTZ;
  v_last_forecast_at TIMESTAMPTZ;
  v_conversations_active INTEGER;
  v_avg_confidence NUMERIC;
BEGIN
  -- Count models by status
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'training'),
    COUNT(*) FILTER (WHERE status NOT IN ('active', 'training'))
  INTO v_models_active, v_models_training, v_models_inactive
  FROM ai_models
  WHERE tenant_id = p_tenant_id;
  
  -- Count predictions
  SELECT 
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')
  INTO v_predictions_today, v_predictions_week
  FROM ai_forecasts
  WHERE tenant_id = p_tenant_id;
  
  -- Count recommendations
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'implemented')
  INTO v_recommendations_total, v_recommendations_implemented
  FROM ai_strategic_recommendations
  WHERE tenant_id = p_tenant_id;
  
  -- Calculate average accuracy
  SELECT COALESCE(AVG(accuracy), 0)
  INTO v_avg_accuracy
  FROM ai_models
  WHERE tenant_id = p_tenant_id AND status = 'active' AND accuracy IS NOT NULL;
  
  -- Count diagnostics
  SELECT COUNT(*)
  INTO v_diagnostics_run
  FROM ai_diagnostic_sessions
  WHERE tenant_id = p_tenant_id;
  
  -- Count active anomalies
  SELECT COUNT(*)
  INTO v_anomalies_active
  FROM ai_anomalies
  WHERE tenant_id = p_tenant_id AND status NOT IN ('resolved', 'dismissed');
  
  -- Count unread insights
  SELECT COUNT(*)
  INTO v_insights_unread
  FROM ai_insights
  WHERE tenant_id = p_tenant_id AND is_read = false;
  
  -- Get last diagnostic and forecast timestamps
  SELECT MAX(created_at)
  INTO v_last_diagnostic_at
  FROM ai_diagnostic_sessions
  WHERE tenant_id = p_tenant_id;
  
  SELECT MAX(created_at)
  INTO v_last_forecast_at
  FROM ai_forecasts
  WHERE tenant_id = p_tenant_id;
  
  -- Count active conversations
  SELECT COUNT(*)
  INTO v_conversations_active
  FROM ai_conversations
  WHERE tenant_id = p_tenant_id AND status = 'active';
  
  -- Calculate average confidence from insights
  SELECT COALESCE(AVG(confidence), 0)
  INTO v_avg_confidence
  FROM ai_insights
  WHERE tenant_id = p_tenant_id AND confidence IS NOT NULL;
  
  -- Build result JSON
  result := json_build_object(
    'modelsActive', COALESCE(v_models_active, 0),
    'modelsTraining', COALESCE(v_models_training, 0),
    'modelsInactive', COALESCE(v_models_inactive, 0),
    'predictionsToday', COALESCE(v_predictions_today, 0),
    'predictionsWeek', COALESCE(v_predictions_week, 0),
    'recommendationsTotal', COALESCE(v_recommendations_total, 0),
    'recommendationsImplemented', COALESCE(v_recommendations_implemented, 0),
    'avgAccuracy', ROUND(COALESCE(v_avg_accuracy, 0)::numeric, 1),
    'avgProcessingTime', 1.2, -- Placeholder for now
    'diagnosticsRun', COALESCE(v_diagnostics_run, 0),
    'anomaliesActive', COALESCE(v_anomalies_active, 0),
    'insightsUnread', COALESCE(v_insights_unread, 0),
    'lastDiagnosticAt', v_last_diagnostic_at,
    'lastForecastAt', v_last_forecast_at,
    'conversationsActive', COALESCE(v_conversations_active, 0),
    'avgConfidence', ROUND(COALESCE(v_avg_confidence, 0)::numeric, 1)
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ai_dashboard_metrics(UUID) TO authenticated;