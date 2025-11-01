-- Créer une fonction RPC pour récupérer les paramètres d'alertes du tenant courant
-- Cela évite l'erreur 406 causée par l'utilisation de .single() sans filtre explicite

CREATE OR REPLACE FUNCTION get_current_tenant_alert_settings()
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  low_stock_enabled boolean,
  low_stock_threshold integer,
  critical_stock_threshold integer,
  maximum_stock_threshold integer,
  expiration_alert_days integer,
  near_expiration_days integer,
  overdue_inventory_days integer,
  slow_moving_days integer,
  email_notifications boolean,
  sms_notifications boolean,
  dashboard_notifications boolean,
  alert_frequency text,
  business_days_only boolean,
  alert_start_time time,
  alert_end_time time,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.tenant_id,
    a.low_stock_enabled,
    a.low_stock_threshold,
    a.critical_stock_threshold,
    a.maximum_stock_threshold,
    a.expiration_alert_days,
    a.near_expiration_days,
    a.overdue_inventory_days,
    a.slow_moving_days,
    a.email_notifications,
    a.sms_notifications,
    a.dashboard_notifications,
    a.alert_frequency,
    a.business_days_only,
    a.alert_start_time,
    a.alert_end_time,
    a.created_at,
    a.updated_at
  FROM alert_settings a
  WHERE a.tenant_id = get_current_user_tenant_id()
  LIMIT 1;
END;
$$;