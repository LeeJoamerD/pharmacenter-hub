-- Phase 1: Création des tables pour Intégrations Système

-- 1.1 Table module_sync_configs - Configuration synchronisation modules internes
CREATE TABLE IF NOT EXISTS public.module_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT false,
  sync_frequency TEXT DEFAULT 'manual',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  sync_count INTEGER DEFAULT 0,
  error_message TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, module_name)
);

-- 1.2 Table module_sync_logs - Historique synchronisations
CREATE TABLE IF NOT EXISTS public.module_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  sync_config_id UUID REFERENCES public.module_sync_configs(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  sync_type TEXT DEFAULT 'manual',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'running',
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Table external_integrations - Intégrations services externes
CREATE TABLE IF NOT EXISTS public.external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  is_active BOOLEAN DEFAULT true,
  connection_config JSONB DEFAULT '{}'::jsonb,
  sync_settings JSONB DEFAULT '{}'::jsonb,
  last_connection_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.personnel(id)
);

-- 1.4 Table fec_exports - Historique exports FEC
CREATE TABLE IF NOT EXISTS public.fec_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  exercice_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  format TEXT DEFAULT 'txt',
  include_analytics BOOLEAN DEFAULT false,
  file_path TEXT,
  file_size_mb NUMERIC(10,2),
  total_entries INTEGER DEFAULT 0,
  export_status TEXT DEFAULT 'generating',
  generation_duration_seconds INTEGER,
  exported_by UUID REFERENCES public.personnel(id),
  downloaded_at TIMESTAMPTZ,
  downloaded_by UUID REFERENCES public.personnel(id),
  download_count INTEGER DEFAULT 0,
  validation_errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Table webhooks_config - Configuration webhooks
CREATE TABLE IF NOT EXISTS public.webhooks_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  events TEXT[] DEFAULT ARRAY[]::TEXT[],
  secret_key TEXT,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  last_status TEXT,
  total_calls INTEGER DEFAULT 0,
  success_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.personnel(id)
);

-- 1.6 Table webhooks_logs - Logs appels webhooks
CREATE TABLE IF NOT EXISTS public.webhooks_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES public.webhooks_config(id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  request_headers JSONB DEFAULT '{}'::jsonb,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Table api_scheduled_tasks - Tâches programmées
CREATE TABLE IF NOT EXISTS public.api_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT,
  frequency TEXT DEFAULT 'daily',
  schedule_time TIME,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 Table parametres_integrations_regionaux - Paramètres multi-pays
CREATE TABLE IF NOT EXISTS public.parametres_integrations_regionaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  pays TEXT NOT NULL,
  code_pays TEXT NOT NULL,
  fec_obligatoire BOOLEAN DEFAULT true,
  fec_format_defaut TEXT DEFAULT 'txt',
  fec_separateur TEXT DEFAULT '|',
  fec_encodage TEXT DEFAULT 'UTF-8',
  banking_api_available BOOLEAN DEFAULT false,
  banking_standard TEXT,
  tax_portal_url TEXT,
  tax_portal_available BOOLEAN DEFAULT false,
  tax_declaration_format TEXT,
  social_org_name TEXT,
  social_portal_url TEXT,
  social_portal_available BOOLEAN DEFAULT false,
  labels JSONB DEFAULT '{}'::jsonb,
  data_retention_years INTEGER DEFAULT 10,
  archiving_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- RLS Policies
ALTER TABLE public.module_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fec_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_integrations_regionaux ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_module_sync_configs" ON public.module_sync_configs
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_module_sync_logs" ON public.module_sync_logs
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_external_integrations" ON public.external_integrations
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_fec_exports" ON public.fec_exports
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_webhooks_config" ON public.webhooks_config
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_webhooks_logs" ON public.webhooks_logs
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_api_scheduled_tasks" ON public.api_scheduled_tasks
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "tenant_isolation_parametres_integrations_regionaux" ON public.parametres_integrations_regionaux
  FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Indexes de performance
CREATE INDEX IF NOT EXISTS idx_module_sync_configs_tenant ON public.module_sync_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_module_sync_logs_tenant_module ON public.module_sync_logs(tenant_id, module_name);
CREATE INDEX IF NOT EXISTS idx_external_integrations_tenant_type ON public.external_integrations(tenant_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_fec_exports_tenant_date ON public.fec_exports(tenant_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_webhooks_logs_webhook_created ON public.webhooks_logs(webhook_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_scheduled_tasks_tenant_active ON public.api_scheduled_tasks(tenant_id, is_active);

-- Triggers updated_at
CREATE TRIGGER update_module_sync_configs_updated_at 
  BEFORE UPDATE ON public.module_sync_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_integrations_updated_at 
  BEFORE UPDATE ON public.external_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_config_updated_at 
  BEFORE UPDATE ON public.webhooks_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_scheduled_tasks_updated_at 
  BEFORE UPDATE ON public.api_scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_integrations_regionaux_updated_at 
  BEFORE UPDATE ON public.parametres_integrations_regionaux
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();