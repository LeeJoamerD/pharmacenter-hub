-- PHASE 1: Correction de la fonction get_current_tenant_alert_settings
-- Cette fonction doit utiliser la table alert_settings (et non stock_settings)
-- avec les bonnes colonnes disponibles dans la base de données

CREATE OR REPLACE FUNCTION public.get_current_tenant_alert_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  current_tenant_id UUID;
BEGIN
  -- Récupérer le tenant_id de l'utilisateur connecté
  current_tenant_id := public.get_current_user_tenant_id();
  
  IF current_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;
  
  -- ✅ CORRECTION: Utiliser alert_settings avec les colonnes existantes
  SELECT jsonb_build_object(
    'id', a.id,
    'tenant_id', a.tenant_id,
    'low_stock_enabled', COALESCE(a.low_stock_enabled, true),
    'low_stock_threshold', COALESCE(a.low_stock_threshold, 10),
    'critical_stock_threshold', COALESCE(a.critical_stock_threshold, 5),
    'maximum_stock_threshold', COALESCE(a.maximum_stock_threshold, 100),
    'expiration_alert_days', COALESCE(a.expiration_alert_days, 30),
    'near_expiration_days', COALESCE(a.near_expiration_days, 7),
    'overdue_inventory_days', COALESCE(a.overdue_inventory_days, 365),
    'slow_moving_days', COALESCE(a.slow_moving_days, 90),
    'email_notifications', COALESCE(a.email_notifications, true),
    'sms_notifications', COALESCE(a.sms_notifications, false),
    'dashboard_notifications', COALESCE(a.dashboard_notifications, true),
    'alert_frequency', COALESCE(a.alert_frequency, 'daily'),
    'business_days_only', COALESCE(a.business_days_only, true),
    'alert_start_time', COALESCE(a.alert_start_time, '08:00'),
    'alert_end_time', COALESCE(a.alert_end_time, '18:00'),
    'created_at', a.created_at,
    'updated_at', a.updated_at
  )
  INTO result
  FROM public.alert_settings a
  WHERE a.tenant_id = current_tenant_id
  LIMIT 1;
  
  -- Si aucune configuration n'existe, retourner des valeurs par défaut
  IF result IS NULL THEN
    result := jsonb_build_object(
      'tenant_id', current_tenant_id,
      'low_stock_enabled', true,
      'low_stock_threshold', 10,
      'critical_stock_threshold', 5,
      'maximum_stock_threshold', 100,
      'expiration_alert_days', 30,
      'near_expiration_days', 7,
      'overdue_inventory_days', 365,
      'slow_moving_days', 90,
      'email_notifications', true,
      'sms_notifications', false,
      'dashboard_notifications', true,
      'alert_frequency', 'daily',
      'business_days_only', true,
      'alert_start_time', '08:00',
      'alert_end_time', '18:00'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_alert_settings() TO authenticated;