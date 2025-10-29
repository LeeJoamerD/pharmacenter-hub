-- =====================================================
-- PHASE 1: RESTRUCTURATION DES TABLES
-- =====================================================

-- =====================================================
-- 1.1: Correction de report_permissions
-- =====================================================

-- Ajouter les nouvelles colonnes
ALTER TABLE public.report_permissions
  ADD COLUMN IF NOT EXISTS subject_type TEXT,
  ADD COLUMN IF NOT EXISTS subject_id UUID,
  ADD COLUMN IF NOT EXISTS report_key TEXT;

-- Migrer les données existantes si la colonne subject existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_permissions' AND column_name = 'subject'
  ) THEN
    -- Essayer de parser "subject" si format "type:id"
    UPDATE public.report_permissions 
    SET 
      subject_type = CASE 
        WHEN subject LIKE 'role:%' THEN 'role'
        WHEN subject LIKE 'user:%' THEN 'user'
        ELSE 'user'
      END,
      subject_id = CASE 
        WHEN subject ~ '^(role|user):' THEN 
          CASE 
            WHEN split_part(subject, ':', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN split_part(subject, ':', 2)::UUID
            ELSE gen_random_uuid()
          END
        ELSE gen_random_uuid()
      END
    WHERE subject_type IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_permissions' AND column_name = 'report_type'
  ) THEN
    UPDATE public.report_permissions 
    SET report_key = report_type
    WHERE report_key IS NULL;
  END IF;
END $$;

-- Renommer can_edit en can_modify si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_permissions' AND column_name = 'can_edit'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_permissions' AND column_name = 'can_modify'
  ) THEN
    ALTER TABLE public.report_permissions 
      RENAME COLUMN can_edit TO can_modify;
  END IF;
END $$;

-- Ajouter contraintes sur les nouvelles colonnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_permissions_subject_type_check'
  ) THEN
    ALTER TABLE public.report_permissions 
      ADD CONSTRAINT report_permissions_subject_type_check 
      CHECK (subject_type IN ('role', 'user'));
  END IF;
END $$;

ALTER TABLE public.report_permissions 
  ALTER COLUMN subject_type SET NOT NULL,
  ALTER COLUMN subject_id SET NOT NULL,
  ALTER COLUMN report_key SET NOT NULL;

-- =====================================================
-- 1.2: Correction de report_schedules
-- =====================================================

-- Ajouter les nouvelles colonnes
ALTER TABLE public.report_schedules
  ADD COLUMN IF NOT EXISTS schedule_type TEXT,
  ADD COLUMN IF NOT EXISTS cron_expr TEXT,
  ADD COLUMN IF NOT EXISTS time_of_day TIME,
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER,
  ADD COLUMN IF NOT EXISTS day_of_month INTEGER,
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS report_key TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}'::jsonb;

-- Migrer les données existantes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'frequency'
  ) THEN
    UPDATE public.report_schedules
    SET 
      schedule_type = CASE 
        WHEN frequency ILIKE '%daily%' THEN 'daily'
        WHEN frequency ILIKE '%weekly%' THEN 'weekly'
        WHEN frequency ILIKE '%monthly%' THEN 'monthly'
        WHEN frequency ~ '^[0-9*\s]+$' THEN 'cron'
        ELSE 'daily'
      END,
      cron_expr = CASE WHEN frequency ~ '^[0-9*\s]+$' THEN frequency ELSE NULL END
    WHERE schedule_type IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'report_type'
  ) THEN
    UPDATE public.report_schedules
    SET report_key = report_type
    WHERE report_key IS NULL;
  END IF;

  -- Définir le format par défaut
  UPDATE public.report_schedules
  SET format = 'pdf'
  WHERE format IS NULL;
END $$;

-- Renommer les colonnes si elles existent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.report_schedules
      RENAME COLUMN is_active TO active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'last_run'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'last_run_at'
  ) THEN
    ALTER TABLE public.report_schedules
      RENAME COLUMN last_run TO last_run_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'next_run'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_schedules' AND column_name = 'next_run_at'
  ) THEN
    ALTER TABLE public.report_schedules
      RENAME COLUMN next_run TO next_run_at;
  END IF;
END $$;

-- Ajouter contraintes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_schedules_schedule_type_check'
  ) THEN
    ALTER TABLE public.report_schedules
      ADD CONSTRAINT report_schedules_schedule_type_check 
      CHECK (schedule_type IN ('cron', 'daily', 'weekly', 'monthly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_schedules_day_of_week_check'
  ) THEN
    ALTER TABLE public.report_schedules
      ADD CONSTRAINT report_schedules_day_of_week_check 
      CHECK (day_of_week BETWEEN 0 AND 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_schedules_day_of_month_check'
  ) THEN
    ALTER TABLE public.report_schedules
      ADD CONSTRAINT report_schedules_day_of_month_check 
      CHECK (day_of_month BETWEEN 1 AND 31);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_report_schedules_template'
  ) THEN
    ALTER TABLE public.report_schedules
      ADD CONSTRAINT fk_report_schedules_template
      FOREIGN KEY (template_id) REFERENCES public.report_templates(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.report_schedules
  ALTER COLUMN schedule_type SET NOT NULL,
  ALTER COLUMN format SET NOT NULL;

-- =====================================================
-- 1.3: Correction de report_connectors
-- =====================================================

-- Renommer les colonnes si elles existent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'connector_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'provider'
  ) THEN
    ALTER TABLE public.report_connectors
      RENAME COLUMN connector_type TO provider;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'connection_config'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'config'
  ) THEN
    ALTER TABLE public.report_connectors
      RENAME COLUMN connection_config TO config;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_connectors' AND column_name = 'is_enabled'
  ) THEN
    ALTER TABLE public.report_connectors
      RENAME COLUMN is_active TO is_enabled;
  END IF;
END $$;

-- Ajouter contrainte ENUM sur provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_connectors_provider_check'
  ) THEN
    ALTER TABLE public.report_connectors
      ADD CONSTRAINT report_connectors_provider_check 
      CHECK (provider IN ('powerbi', 'tableau', 'qlik'));
  END IF;
END $$;

-- =====================================================
-- 1.4: Correction de report_api_tokens
-- =====================================================

-- Renommer token_name en name si la colonne existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_api_tokens' AND column_name = 'token_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_api_tokens' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.report_api_tokens
      RENAME COLUMN token_name TO name;
  END IF;
END $$;

-- Créer nouvelle colonne scopes si elle n'existe pas
ALTER TABLE public.report_api_tokens
  ADD COLUMN IF NOT EXISTS scopes TEXT[];

-- Migrer permissions (JSONB) vers scopes (TEXT[]) si permissions existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_api_tokens' AND column_name = 'permissions'
  ) THEN
    UPDATE public.report_api_tokens
    SET scopes = ARRAY(
      SELECT jsonb_array_elements_text(permissions)
    )
    WHERE scopes IS NULL AND permissions IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 1.5: Correction de report_templates
-- =====================================================

-- Ajouter version et is_default si elles n'existent pas
ALTER TABLE public.report_templates
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Garantir qu'un seul template par catégorie soit défini par défaut
DROP INDEX IF EXISTS idx_report_templates_default_per_category;
CREATE UNIQUE INDEX idx_report_templates_default_per_category
  ON public.report_templates(tenant_id, category)
  WHERE is_default = true;

-- =====================================================
-- PHASE 2: CRÉATION DE LA FONCTION RPC MANQUANTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.reports_upsert_template(
  template JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_template_id UUID;
  v_current_version INTEGER;
BEGIN
  -- Récupérer le tenant de l'utilisateur actuel
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;

  -- Extraction de l'ID du template (si update)
  v_template_id := (template->>'id')::UUID;

  IF v_template_id IS NOT NULL THEN
    -- UPDATE: Incrémenter la version
    SELECT version INTO v_current_version
    FROM public.report_templates
    WHERE id = v_template_id AND tenant_id = v_tenant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Template non trouvé ou accès refusé';
    END IF;

    -- Sauvegarder la version actuelle dans report_template_versions
    INSERT INTO public.report_template_versions (tenant_id, template_id, version_number, content)
    SELECT tenant_id, id, version, content
    FROM public.report_templates
    WHERE id = v_template_id;

    -- Mettre à jour le template
    UPDATE public.report_templates
    SET
      name = COALESCE((template->>'name')::TEXT, name),
      description = (template->>'description')::TEXT,
      category = COALESCE((template->>'category')::TEXT, category),
      content = COALESCE((template->'content')::JSONB, content),
      version = version + 1,
      is_default = COALESCE((template->>'is_default')::BOOLEAN, is_default),
      updated_at = now()
    WHERE id = v_template_id;

    RETURN v_template_id;
  ELSE
    -- INSERT: Nouveau template
    INSERT INTO public.report_templates (
      tenant_id, name, description, category, template_type, content, version, is_default
    )
    VALUES (
      v_tenant_id,
      (template->>'name')::TEXT,
      (template->>'description')::TEXT,
      (template->>'category')::TEXT,
      COALESCE((template->>'template_type')::TEXT, 'custom'),
      (template->'content')::JSONB,
      1,
      COALESCE((template->>'is_default')::BOOLEAN, false)
    )
    RETURNING id INTO v_template_id;

    RETURN v_template_id;
  END IF;
END;
$$;

-- Grant EXECUTE à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.reports_upsert_template(JSONB) TO authenticated;

COMMENT ON FUNCTION public.reports_upsert_template(JSONB) IS 
'Permet de créer ou modifier un template de rapport avec gestion de version automatique';

-- =====================================================
-- CRÉATION DES INDEX POUR PERFORMANCES
-- =====================================================

-- Index pour report_permissions
CREATE INDEX IF NOT EXISTS idx_report_permissions_subject 
  ON public.report_permissions(tenant_id, subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_report_permissions_report_key 
  ON public.report_permissions(tenant_id, report_key);

-- Index pour report_schedules
CREATE INDEX IF NOT EXISTS idx_report_schedules_template 
  ON public.report_schedules(tenant_id, template_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_active 
  ON public.report_schedules(tenant_id, active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run 
  ON public.report_schedules(tenant_id, next_run_at) WHERE active = true;

-- Index pour report_connectors
CREATE INDEX IF NOT EXISTS idx_report_connectors_provider 
  ON public.report_connectors(tenant_id, provider);

CREATE INDEX IF NOT EXISTS idx_report_connectors_enabled 
  ON public.report_connectors(tenant_id, is_enabled) WHERE is_enabled = true;

-- Index pour report_api_tokens
CREATE INDEX IF NOT EXISTS idx_report_api_tokens_active 
  ON public.report_api_tokens(tenant_id, is_active) WHERE is_active = true;

-- Index pour report_templates
CREATE INDEX IF NOT EXISTS idx_report_templates_category 
  ON public.report_templates(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_report_templates_version 
  ON public.report_templates(tenant_id, version DESC);