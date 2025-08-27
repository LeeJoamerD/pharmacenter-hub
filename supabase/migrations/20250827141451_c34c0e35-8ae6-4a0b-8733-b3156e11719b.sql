-- Étape 3: Créer les tables backup_runs et system_stats
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