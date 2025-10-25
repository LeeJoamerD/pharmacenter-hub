-- Étape 1: Créer les tables principales
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