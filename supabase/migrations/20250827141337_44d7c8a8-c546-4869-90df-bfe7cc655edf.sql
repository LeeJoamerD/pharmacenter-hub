-- Création des tables manquantes pour l'Administration Réseau Avancée

-- Table pour les composants système du réseau
CREATE TABLE IF NOT EXISTS public.network_system_components (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('server', 'database', 'chat', 'cdn', 'router', 'firewall')),
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'warning', 'maintenance')),
    uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    cpu_load NUMERIC NOT NULL DEFAULT 0 CHECK (cpu_load >= 0 AND cpu_load <= 100),
    memory_usage NUMERIC NOT NULL DEFAULT 0 CHECK (memory_usage >= 0 AND memory_usage <= 100),
    storage_usage NUMERIC NOT NULL DEFAULT 0 CHECK (storage_usage >= 0 AND storage_usage <= 100),
    ip_address TEXT,
    port INTEGER,
    description TEXT,
    configuration JSONB DEFAULT '{}',
    last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres d'administration réseau
CREATE TABLE IF NOT EXISTS public.network_admin_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    setting_category TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, setting_category, setting_key)
);

-- Table pour les actifs de sécurité réseau
CREATE TABLE IF NOT EXISTS public.network_security_assets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('firewall', 'antivirus', 'encryption', 'certificate', 'key')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'warning')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    configuration JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les tâches de sauvegarde réseau
CREATE TABLE IF NOT EXISTS public.network_backup_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'full' CHECK (job_type IN ('full', 'incremental', 'differential', 'database', 'files')),
    schedule_type TEXT NOT NULL DEFAULT 'manual' CHECK (schedule_type IN ('manual', 'hourly', 'daily', 'weekly', 'monthly')),
    schedule_time TEXT,
    schedule_days INTEGER[],
    target_path TEXT,
    retention_days INTEGER NOT NULL DEFAULT 30 CHECK (retention_days > 0),
    compression_enabled BOOLEAN NOT NULL DEFAULT true,
    encryption_enabled BOOLEAN NOT NULL DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    last_status TEXT CHECK (last_status IN ('success', 'failed', 'running', 'pending')),
    last_size_mb NUMERIC,
    next_run TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les exécutions de sauvegarde
CREATE TABLE IF NOT EXISTS public.network_backup_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    backup_job_id UUID REFERENCES public.network_backup_jobs(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    size_mb NUMERIC,
    error_message TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les statistiques système réseau
CREATE TABLE IF NOT EXISTS public.network_system_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    database_size_mb NUMERIC NOT NULL DEFAULT 0,
    log_size_mb NUMERIC NOT NULL DEFAULT 0,
    temp_files_mb NUMERIC NOT NULL DEFAULT 0,
    disk_usage NUMERIC NOT NULL DEFAULT 0 CHECK (disk_usage >= 0 AND disk_usage <= 100),
    memory_usage NUMERIC NOT NULL DEFAULT 0 CHECK (memory_usage >= 0 AND memory_usage <= 100),
    cpu_usage NUMERIC NOT NULL DEFAULT 0 CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
    uptime_seconds BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.network_system_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_security_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_backup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_system_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour network_system_components
CREATE POLICY "Users can view system components from their tenant"
ON public.network_system_components FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage system components in their tenant"
ON public.network_system_components FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS pour network_admin_settings
CREATE POLICY "Users can view admin settings from their tenant"
ON public.network_admin_settings FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage admin settings in their tenant"
ON public.network_admin_settings FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS pour network_security_assets
CREATE POLICY "Users can view security assets from their tenant"
ON public.network_security_assets FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage security assets in their tenant"
ON public.network_security_assets FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS pour network_backup_jobs
CREATE POLICY "Users can view backup jobs from their tenant"
ON public.network_backup_jobs FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage backup jobs in their tenant"
ON public.network_backup_jobs FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS pour network_backup_runs
CREATE POLICY "Users can view backup runs from their tenant"
ON public.network_backup_runs FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage backup runs in their tenant"
ON public.network_backup_runs FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Politiques RLS pour network_system_stats
CREATE POLICY "Users can view system stats from their tenant"
ON public.network_system_stats FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage system stats in their tenant"
ON public.network_system_stats FOR ALL
USING (
    tenant_id = get_current_user_tenant_id() AND 
    EXISTS (
        SELECT 1 FROM public.personnel 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('Admin', 'Pharmacien')
    )
);

-- Ajouter des triggers updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_network_system_components_updated_at
    BEFORE UPDATE ON public.network_system_components
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_admin_settings_updated_at
    BEFORE UPDATE ON public.network_admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_security_assets_updated_at
    BEFORE UPDATE ON public.network_security_assets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_backup_jobs_updated_at
    BEFORE UPDATE ON public.network_backup_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_system_stats_updated_at
    BEFORE UPDATE ON public.network_system_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_network_system_components_tenant_id ON public.network_system_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_admin_settings_tenant_id ON public.network_admin_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_admin_settings_category_key ON public.network_admin_settings(tenant_id, setting_category, setting_key);
CREATE INDEX IF NOT EXISTS idx_network_security_assets_tenant_id ON public.network_security_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_backup_jobs_tenant_id ON public.network_backup_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_backup_runs_tenant_id ON public.network_backup_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_backup_runs_job_id ON public.network_backup_runs(backup_job_id);
CREATE INDEX IF NOT EXISTS idx_network_system_stats_tenant_id ON public.network_system_stats(tenant_id);