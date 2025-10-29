-- Add missing updated_at triggers for alert system tables

-- Trigger for cross_tenant_permissions (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_cross_tenant_permissions_updated_at'
  ) THEN
    CREATE TRIGGER update_cross_tenant_permissions_updated_at
      BEFORE UPDATE ON public.cross_tenant_permissions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger for notification_configurations (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_notification_configurations_updated_at'
  ) THEN
    CREATE TRIGGER update_notification_configurations_updated_at
      BEFORE UPDATE ON public.notification_configurations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger for alert_rules (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_alert_rules_updated_at'
  ) THEN
    CREATE TRIGGER update_alert_rules_updated_at
      BEFORE UPDATE ON public.alert_rules
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger for global_alert_settings (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_global_alert_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_global_alert_settings_updated_at
      BEFORE UPDATE ON public.global_alert_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger for audit logging on cross_tenant_permissions (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'audit_cross_tenant_permissions'
  ) THEN
    CREATE TRIGGER audit_cross_tenant_permissions
      AFTER INSERT OR UPDATE OR DELETE ON public.cross_tenant_permissions
      FOR EACH ROW
      EXECUTE FUNCTION public.log_cross_tenant_permission_change();
  END IF;
END $$;