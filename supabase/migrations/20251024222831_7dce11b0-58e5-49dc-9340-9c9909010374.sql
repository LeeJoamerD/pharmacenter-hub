-- Migration 14: Tables complètes pour le Module Administration
-- Création de toutes les tables manquantes identifiées dans les composants du module Administration

-- =============================================
-- ÉTAPE 1: TABLES DE SÉCURITÉ ET AUTHENTIFICATION
-- =============================================

-- Table: password_policies
CREATE TABLE IF NOT EXISTS public.password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  min_length INTEGER DEFAULT 8,
  require_uppercase BOOLEAN DEFAULT true,
  require_lowercase BOOLEAN DEFAULT true,
  require_numbers BOOLEAN DEFAULT true,
  require_special_chars BOOLEAN DEFAULT true,
  max_age_days INTEGER DEFAULT 90,
  prevent_reuse_count INTEGER DEFAULT 5,
  lockout_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  session_timeout_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  security_level TEXT DEFAULT 'basic',
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ÉTAPE 2: TABLES DE CONFIGURATION SYSTÈME
-- =============================================

-- Table: parametres_systeme
CREATE TABLE IF NOT EXISTS public.parametres_systeme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  categorie TEXT NOT NULL,
  cle_parametre TEXT NOT NULL,
  valeur_parametre TEXT,
  type_parametre TEXT DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_tenant_cle_parametre UNIQUE(tenant_id, cle_parametre)
);

-- =============================================
-- ÉTAPE 3: TABLES DE DOCUMENTS
-- =============================================

-- Table: document_categories
CREATE TABLE IF NOT EXISTS public.document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: ai_templates
CREATE TABLE IF NOT EXISTS public.ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  category TEXT,
  sender TEXT,
  recipient TEXT,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  content TEXT,
  file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ÉTAPE 4: TABLES D'ADMINISTRATION RÉSEAU
-- =============================================

-- Table: network_system_components
CREATE TABLE IF NOT EXISTS public.network_system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'online',
  uptime_start TIMESTAMPTZ DEFAULT now(),
  cpu_load NUMERIC(5,2) DEFAULT 0,
  memory_usage NUMERIC(5,2) DEFAULT 0,
  storage_usage NUMERIC(5,2) DEFAULT 0,
  ip_address INET,
  port INTEGER,
  description TEXT,
  configuration JSONB DEFAULT '{}'::jsonb,
  last_check TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: network_admin_settings
CREATE TABLE IF NOT EXISTS public.network_admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_tenant_setting UNIQUE(tenant_id, setting_category, setting_key)
);

-- Table: network_security_assets
CREATE TABLE IF NOT EXISTS public.network_security_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expiry_date TIMESTAMPTZ,
  configuration JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: network_system_stats
CREATE TABLE IF NOT EXISTS public.network_system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  disk_usage NUMERIC(5,2) DEFAULT 0,
  memory_usage NUMERIC(5,2) DEFAULT 0,
  cpu_usage NUMERIC(5,2) DEFAULT 0,
  database_size_mb NUMERIC(12,2) DEFAULT 0,
  log_size_mb NUMERIC(12,2) DEFAULT 0,
  temp_files_mb NUMERIC(12,2) DEFAULT 0,
  uptime_seconds INTEGER DEFAULT 0,
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ÉTAPE 5: TABLES DE SAUVEGARDE ET MAINTENANCE
-- =============================================

-- Table: network_backup_jobs
CREATE TABLE IF NOT EXISTS public.network_backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  schedule_type TEXT DEFAULT 'manual',
  schedule_time TIME,
  schedule_days INTEGER[],
  target_path TEXT,
  retention_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  last_status TEXT,
  last_size_mb NUMERIC(12,2),
  next_run TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: network_backup_runs
CREATE TABLE IF NOT EXISTS public.network_backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  backup_job_id UUID REFERENCES public.network_backup_jobs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'running',
  type TEXT NOT NULL,
  size_mb NUMERIC(12,2),
  storage_target TEXT,
  error_message TEXT,
  triggered_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: network_maintenance_task_runs
CREATE TABLE IF NOT EXISTS public.network_maintenance_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  triggered_by UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ÉTAPE 6: CORRECTION RELATION AUDIT_LOGS
-- =============================================

-- Ajouter colonne personnel_id dans audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL;

-- Créer un index sur personnel_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_personnel_id ON public.audit_logs(personnel_id);

-- =============================================
-- ÉTAPE 7: ACTIVATION ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_system_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_security_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_system_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_maintenance_task_runs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ÉTAPE 8: RLS POLICIES - ACCÈS TENANT
-- =============================================

-- Policies pour password_policies
CREATE POLICY "tenant_access_password_policies" ON public.password_policies
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour login_attempts
CREATE POLICY "tenant_view_login_attempts" ON public.login_attempts
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "system_insert_login_attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Policies pour user_sessions
CREATE POLICY "tenant_access_user_sessions" ON public.user_sessions
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour parametres_systeme
CREATE POLICY "tenant_access_parametres_systeme" ON public.parametres_systeme
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour document_categories
CREATE POLICY "tenant_access_document_categories" ON public.document_categories
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour ai_templates
CREATE POLICY "tenant_access_ai_templates" ON public.ai_templates
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour documents
CREATE POLICY "tenant_access_documents" ON public.documents
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_system_components
CREATE POLICY "tenant_access_network_system_components" ON public.network_system_components
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_admin_settings
CREATE POLICY "tenant_access_network_admin_settings" ON public.network_admin_settings
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_security_assets
CREATE POLICY "tenant_access_network_security_assets" ON public.network_security_assets
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_system_stats
CREATE POLICY "tenant_access_network_system_stats" ON public.network_system_stats
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_backup_jobs
CREATE POLICY "tenant_access_network_backup_jobs" ON public.network_backup_jobs
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_backup_runs
CREATE POLICY "tenant_access_network_backup_runs" ON public.network_backup_runs
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policies pour network_maintenance_task_runs
CREATE POLICY "tenant_access_network_maintenance_task_runs" ON public.network_maintenance_task_runs
  FOR ALL USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- =============================================
-- ÉTAPE 9: TRIGGERS UPDATED_AT
-- =============================================

CREATE TRIGGER update_password_policies_updated_at BEFORE UPDATE ON public.password_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_systeme_updated_at BEFORE UPDATE ON public.parametres_systeme
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON public.document_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_templates_updated_at BEFORE UPDATE ON public.ai_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_system_components_updated_at BEFORE UPDATE ON public.network_system_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_admin_settings_updated_at BEFORE UPDATE ON public.network_admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_security_assets_updated_at BEFORE UPDATE ON public.network_security_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_system_stats_updated_at BEFORE UPDATE ON public.network_system_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_backup_jobs_updated_at BEFORE UPDATE ON public.network_backup_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_backup_runs_updated_at BEFORE UPDATE ON public.network_backup_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_maintenance_task_runs_updated_at BEFORE UPDATE ON public.network_maintenance_task_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ÉTAPE 10: INDEXES POUR PERFORMANCE
-- =============================================

-- Indexes sur tenant_id
CREATE INDEX IF NOT EXISTS idx_password_policies_tenant_id ON public.password_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_tenant_id ON public.login_attempts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON public.user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_tenant_id ON public.parametres_systeme(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_tenant_id ON public.document_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates_tenant_id ON public.ai_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_system_components_tenant_id ON public.network_system_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_admin_settings_tenant_id ON public.network_admin_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_security_assets_tenant_id ON public.network_security_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_system_stats_tenant_id ON public.network_system_stats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_backup_jobs_tenant_id ON public.network_backup_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_backup_runs_tenant_id ON public.network_backup_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_maintenance_task_runs_tenant_id ON public.network_maintenance_task_runs(tenant_id);

-- Indexes spécifiques
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_personnel_id ON public.user_sessions(personnel_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_network_backup_jobs_is_active ON public.network_backup_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_network_backup_runs_status ON public.network_backup_runs(status);