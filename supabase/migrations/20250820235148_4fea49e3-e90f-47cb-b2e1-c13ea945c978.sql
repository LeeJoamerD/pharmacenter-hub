-- Network System Components for monitoring and management
CREATE TABLE public.network_system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('server', 'database', 'chat', 'cdn', 'router', 'firewall')),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'warning', 'maintenance')),
  uptime_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cpu_load NUMERIC(5,2) DEFAULT 0.00,
  memory_usage NUMERIC(5,2) DEFAULT 0.00,
  storage_usage NUMERIC(5,2) DEFAULT 0.00,
  ip_address INET,
  port INTEGER,
  description TEXT,
  configuration JSONB DEFAULT '{}',
  last_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Network administration settings
CREATE TABLE public.network_admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, setting_category, setting_key)
);

-- Network security assets and configurations
CREATE TABLE public.network_security_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('firewall', 'antivirus', 'encryption', 'certificate', 'key')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'warning')),
  expiry_date DATE,
  configuration JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Network backup jobs and scheduling
CREATE TABLE public.network_backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full', 'incremental', 'differential', 'database', 'files')),
  schedule_type TEXT NOT NULL DEFAULT 'manual' CHECK (schedule_type IN ('manual', 'hourly', 'daily', 'weekly', 'monthly')),
  schedule_time TIME,
  schedule_days INTEGER[], -- Array of weekdays (0=Sunday, 1=Monday, etc.)
  target_path TEXT,
  retention_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT CHECK (last_status IN ('success', 'failed', 'running', 'pending')),
  last_size_mb NUMERIC(12,2),
  next_run TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Network maintenance schedules
CREATE TABLE public.network_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('planned', 'emergency', 'routine', 'security')),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  affected_systems TEXT[] DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.network_system_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_security_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for network_system_components
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

-- RLS Policies for network_admin_settings
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

-- RLS Policies for network_security_assets
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

-- RLS Policies for network_backup_jobs
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

-- RLS Policies for network_maintenance_schedules
CREATE POLICY "Users can view maintenance schedules from their tenant"
ON public.network_maintenance_schedules FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage maintenance schedules in their tenant"
ON public.network_maintenance_schedules FOR ALL
USING (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Create triggers for updated_at
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

CREATE TRIGGER update_network_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.network_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default system components
INSERT INTO public.network_system_components (tenant_id, name, type, status, cpu_load, memory_usage, storage_usage, description) 
SELECT 
  p.id as tenant_id,
  'Serveur Principal' as name,
  'server' as type,
  'online' as status,
  45.0 as cpu_load,
  67.0 as memory_usage,
  23.0 as storage_usage,
  'Serveur principal de l''application' as description
FROM public.pharmacies p
WHERE p.status = 'active'
LIMIT 1;

-- Insert default admin settings
INSERT INTO public.network_admin_settings (tenant_id, setting_category, setting_key, setting_value, setting_type, description)
SELECT 
  p.id,
  'network',
  'max_connections',
  '1000',
  'number',
  'Limite de connexions simultanées'
FROM public.pharmacies p
WHERE p.status = 'active';

INSERT INTO public.network_admin_settings (tenant_id, setting_category, setting_key, setting_value, setting_type, description)
SELECT 
  p.id,
  'network',
  'session_timeout',
  '30',
  'number',
  'Timeout de session en minutes'
FROM public.pharmacies p
WHERE p.status = 'active';

INSERT INTO public.network_admin_settings (tenant_id, setting_category, setting_key, setting_value, setting_type, description)
SELECT 
  p.id,
  'security',
  'require_2fa',
  'true',
  'boolean',
  'Authentification 2FA obligatoire'
FROM public.pharmacies p
WHERE p.status = 'active';

INSERT INTO public.network_admin_settings (tenant_id, setting_category, setting_key, setting_value, setting_type, description)
SELECT 
  p.id,
  'backup',
  'auto_backup_enabled',
  'true',
  'boolean',
  'Sauvegarde automatique activée'
FROM public.pharmacies p
WHERE p.status = 'active';