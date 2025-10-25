-- Table pour les configurations de notification (Email, SMS, WhatsApp)
CREATE TABLE public.notification_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Configuration Email
  email_enabled BOOLEAN DEFAULT false,
  email_smtp_host TEXT,
  email_smtp_port INTEGER DEFAULT 587,
  email_smtp_user TEXT,
  email_smtp_password TEXT,
  email_from_name TEXT DEFAULT 'Pharmacie Alert System',
  email_from_address TEXT,
  email_use_tls BOOLEAN DEFAULT true,
  email_template TEXT,
  
  -- Configuration SMS  
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider TEXT, -- 'orange', 'tigo', 'expresso', 'other'
  sms_api_url TEXT,
  sms_api_key TEXT,
  sms_sender_name TEXT,
  sms_template TEXT,
  
  -- Configuration WhatsApp
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_business_account_id TEXT,
  whatsapp_access_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_webhook_verify_token TEXT,
  whatsapp_templates JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les règles d'alerte personnalisées
CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Informations de base
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'stock_faible', 'peremption', 'rupture', 'stock_excessif', etc.
  
  -- Conditions
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stocke les conditions de déclenchement
  threshold_value INTEGER,
  threshold_operator TEXT DEFAULT 'less_than', -- 'less_than', 'greater_than', 'equals'
  
  -- Configuration des notifications
  notification_channels TEXT[] DEFAULT ARRAY['dashboard'], -- 'email', 'sms', 'whatsapp', 'dashboard'
  recipients JSONB DEFAULT '[]'::jsonb, -- Liste des destinataires par canal
  
  -- Statut et priorité
  is_active BOOLEAN DEFAULT true,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les paramètres généraux du système d'alerte
CREATE TABLE public.global_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Configuration générale
  system_enabled BOOLEAN DEFAULT true,
  check_frequency_minutes INTEGER DEFAULT 60, -- Fréquence de vérification en minutes
  
  -- Horaires de fonctionnement
  business_hours_only BOOLEAN DEFAULT true,
  business_start_time TIME DEFAULT '08:00',
  business_end_time TIME DEFAULT '18:00',
  business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Lundi, 7=Dimanche
  
  -- Rétention des données
  alert_retention_days INTEGER DEFAULT 90,
  auto_cleanup_enabled BOOLEAN DEFAULT true,
  
  -- Escalade des alertes
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_delay_minutes INTEGER DEFAULT 60,
  max_escalation_level INTEGER DEFAULT 3,
  
  -- Limites et seuils globaux
  max_alerts_per_hour INTEGER DEFAULT 100,
  duplicate_alert_cooldown_minutes INTEGER DEFAULT 30,
  
  -- Templates par défaut
  default_email_template TEXT,
  default_sms_template TEXT,
  default_whatsapp_template TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_configurations
CREATE POLICY "Users can view notification configs from their tenant" 
ON public.notification_configurations FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert notification configs in their tenant" 
ON public.notification_configurations FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update notification configs from their tenant" 
ON public.notification_configurations FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete notification configs from their tenant" 
ON public.notification_configurations FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for alert_rules
CREATE POLICY "Users can view alert rules from their tenant" 
ON public.alert_rules FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert alert rules in their tenant" 
ON public.alert_rules FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update alert rules from their tenant" 
ON public.alert_rules FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete alert rules from their tenant" 
ON public.alert_rules FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for global_alert_settings
CREATE POLICY "Users can view global alert settings from their tenant" 
ON public.global_alert_settings FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert global alert settings in their tenant" 
ON public.global_alert_settings FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update global alert settings from their tenant" 
ON public.global_alert_settings FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete global alert settings from their tenant" 
ON public.global_alert_settings FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Indexes pour les performances
CREATE INDEX idx_notification_configurations_tenant_id ON public.notification_configurations(tenant_id);
CREATE INDEX idx_alert_rules_tenant_id ON public.alert_rules(tenant_id);
CREATE INDEX idx_alert_rules_active ON public.alert_rules(tenant_id, is_active);
CREATE INDEX idx_global_alert_settings_tenant_id ON public.global_alert_settings(tenant_id);

-- Triggers pour updated_at
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