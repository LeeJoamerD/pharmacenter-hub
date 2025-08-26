
-- 1) Assurer l'unicité logique des réglages (évite les 409 et doublons)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_network_admin_setting_per_tenant
  ON public.network_admin_settings (tenant_id, setting_category, setting_key);

-- 2) Historique des tâches de maintenance
CREATE TABLE IF NOT EXISTS public.network_maintenance_task_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_name text NOT NULL, -- ex: 'log_cleanup', 'db_optimization', 'cache_cleanup', 'session_cleanup', 'disk_cleanup', 'auto_backup'
  status text NOT NULL CHECK (status IN ('running','completed','failed','pending')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  duration_seconds integer NULL,
  message text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  triggered_by uuid NULL, -- personnel.id éventuel
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optionnel: index pour tri récent
CREATE INDEX IF NOT EXISTS idx_maint_runs_tenant_started_desc
  ON public.network_maintenance_task_runs (tenant_id, started_at DESC);

-- RLS
ALTER TABLE public.network_maintenance_task_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_maintenance_task_runs'
      AND policyname = 'Users can view maintenance runs from their tenant'
  ) THEN
    CREATE POLICY "Users can view maintenance runs from their tenant"
      ON public.network_maintenance_task_runs
      FOR SELECT
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_maintenance_task_runs'
      AND policyname = 'Users can insert maintenance runs in their tenant'
  ) THEN
    CREATE POLICY "Users can insert maintenance runs in their tenant"
      ON public.network_maintenance_task_runs
      FOR INSERT
      WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_maintenance_task_runs'
      AND policyname = 'Users can update maintenance runs from their tenant'
  ) THEN
    CREATE POLICY "Users can update maintenance runs from their tenant"
      ON public.network_maintenance_task_runs
      FOR UPDATE
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_maintenance_task_runs'
      AND policyname = 'Users can delete maintenance runs from their tenant'
  ) THEN
    CREATE POLICY "Users can delete maintenance runs from their tenant"
      ON public.network_maintenance_task_runs
      FOR DELETE
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

-- Trigger updated_at sur updates
DROP TRIGGER IF EXISTS set_timestamp_network_maintenance_task_runs ON public.network_maintenance_task_runs;
CREATE TRIGGER set_timestamp_network_maintenance_task_runs
  BEFORE UPDATE ON public.network_maintenance_task_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Table pour persister les métriques système affichées dans l'UI
CREATE TABLE IF NOT EXISTS public.network_system_stats (
  tenant_id uuid PRIMARY KEY, -- 1 row par tenant
  disk_usage smallint CHECK (disk_usage >= 0 AND disk_usage <= 100),
  memory_usage smallint CHECK (memory_usage >= 0 AND memory_usage <= 100),
  cpu_usage smallint CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  database_size_mb integer,
  log_size_mb integer,
  temp_files_mb integer,
  uptime_seconds bigint,
  last_maintenance_at timestamptz,
  next_maintenance_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.network_system_stats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_system_stats'
      AND policyname = 'Users can view system stats from their tenant'
  ) THEN
    CREATE POLICY "Users can view system stats from their tenant"
      ON public.network_system_stats
      FOR SELECT
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_system_stats'
      AND policyname = 'Users can insert system stats in their tenant'
  ) THEN
    CREATE POLICY "Users can insert system stats in their tenant"
      ON public.network_system_stats
      FOR INSERT
      WITH CHECK (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_system_stats'
      AND policyname = 'Users can update system stats from their tenant'
  ) THEN
    CREATE POLICY "Users can update system stats from their tenant"
      ON public.network_system_stats
      FOR UPDATE
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'network_system_stats'
      AND policyname = 'Users can delete system stats from their tenant'
  ) THEN
    CREATE POLICY "Users can delete system stats from their tenant"
      ON public.network_system_stats
      FOR DELETE
      USING (tenant_id = public.get_current_user_tenant_id());
  END IF;
END $$;

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_timestamp_network_system_stats ON public.network_system_stats;
CREATE TRIGGER set_timestamp_network_system_stats
  BEFORE UPDATE ON public.network_system_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
