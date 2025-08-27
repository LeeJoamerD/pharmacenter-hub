-- Étape 2: Créer les tables restantes
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