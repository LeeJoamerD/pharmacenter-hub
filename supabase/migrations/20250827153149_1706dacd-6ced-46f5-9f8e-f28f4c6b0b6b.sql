
-- 1) Ajouter la colonne backup_job_id si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'network_backup_runs'
      AND column_name  = 'backup_job_id'
  ) THEN
    ALTER TABLE public.network_backup_runs
      ADD COLUMN backup_job_id uuid;
  END IF;
END$$;

-- 2) Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'network_backup_runs'
      AND c.conname = 'network_backup_runs_backup_job_id_fkey'
  ) THEN
    ALTER TABLE public.network_backup_runs
      ADD CONSTRAINT network_backup_runs_backup_job_id_fkey
      FOREIGN KEY (backup_job_id)
      REFERENCES public.network_backup_jobs(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Index pour accélérer les jointures
CREATE INDEX IF NOT EXISTS idx_network_backup_runs_job_id
  ON public.network_backup_runs(backup_job_id);
