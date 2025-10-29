-- Phase 2: Restore complete alert system from backup migration
-- Based on supabase/migrations_backup_original/20250914202001_783fd63f-acc0-4b30-bf27-40312695f3ed.sql

-- Create notification_configurations table
CREATE TABLE IF NOT EXISTS public.notification_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Email configuration
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  email_smtp_host TEXT,
  email_smtp_port INTEGER,
  email_smtp_user TEXT,
  email_smtp_password TEXT,
  email_from_address TEXT,
  email_from_name TEXT,
  email_template_header TEXT,
  email_template_footer TEXT,
  
  -- SMS configuration
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_provider TEXT,
  sms_api_key TEXT,
  sms_api_secret TEXT,
  sms_sender_id TEXT,
  
  -- WhatsApp configuration
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_api_key TEXT,
  whatsapp_phone_number TEXT,
  whatsapp_business_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert_rules table
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  description TEXT,
  
  -- Alert conditions
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  threshold_value NUMERIC,
  comparison_operator TEXT,
  
  -- Notification preferences
  priority TEXT NOT NULL DEFAULT 'medium',
  notification_channels JSONB NOT NULL DEFAULT '["email"]'::jsonb,
  recipient_emails TEXT[],
  recipient_phones TEXT[],
  
  -- Scheduling
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_config JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT check_alert_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT check_alert_type CHECK (rule_type IN ('stock_low', 'stock_expiry', 'sale_volume', 'financial_threshold', 'security_breach', 'custom'))
);

-- Create global_alert_settings table
CREATE TABLE IF NOT EXISTS public.global_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- System-wide settings
  system_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_check_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- Business hours for alerts
  business_hours_start TIME,
  business_hours_end TIME,
  weekend_alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Alert retention
  alert_retention_days INTEGER NOT NULL DEFAULT 90,
  auto_archive_resolved BOOLEAN NOT NULL DEFAULT true,
  
  -- Escalation settings
  escalation_enabled BOOLEAN NOT NULL DEFAULT false,
  escalation_delay_minutes INTEGER,
  escalation_recipient_emails TEXT[],
  
  -- Default templates
  default_email_template TEXT,
  default_sms_template TEXT,
  default_whatsapp_template TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_global_settings_per_tenant UNIQUE (tenant_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_configurations
CREATE POLICY "Users can view notification configs from their tenant"
  ON public.notification_configurations
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert notification configs in their tenant"
  ON public.notification_configurations
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update notification configs from their tenant"
  ON public.notification_configurations
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete notification configs from their tenant"
  ON public.notification_configurations
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for alert_rules
CREATE POLICY "Users can view alert rules from their tenant"
  ON public.alert_rules
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert alert rules in their tenant"
  ON public.alert_rules
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update alert rules from their tenant"
  ON public.alert_rules
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete alert rules from their tenant"
  ON public.alert_rules
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for global_alert_settings
CREATE POLICY "Users can view global alert settings from their tenant"
  ON public.global_alert_settings
  FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert global alert settings in their tenant"
  ON public.global_alert_settings
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update global alert settings from their tenant"
  ON public.global_alert_settings
  FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete global alert settings from their tenant"
  ON public.global_alert_settings
  FOR DELETE
  USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_configurations_tenant 
  ON public.notification_configurations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant 
  ON public.alert_rules(tenant_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active 
  ON public.alert_rules(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_global_alert_settings_tenant 
  ON public.global_alert_settings(tenant_id);

-- Triggers for updated_at
CREATE TRIGGER update_notification_configurations_updated_at
  BEFORE UPDATE ON public.notification_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_alert_settings_updated_at
  BEFORE UPDATE ON public.global_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();