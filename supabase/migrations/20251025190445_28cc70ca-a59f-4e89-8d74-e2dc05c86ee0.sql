-- ============================================
-- MIGRATION: Module Rapports Complet
-- Crée toutes les tables nécessaires au module de rapports
-- ============================================

-- 1. Table report_archiving_policies (CRITIQUE)
CREATE TABLE IF NOT EXISTS public.report_archiving_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  retention_days INTEGER NOT NULL DEFAULT 365,
  purge_enabled BOOLEAN NOT NULL DEFAULT false,
  storage_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT one_policy_per_tenant UNIQUE (tenant_id)
);

-- 2. Table report_templates
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_type TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 3. Table report_template_versions
CREATE TABLE IF NOT EXISTS public.report_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 4. Table report_permissions
CREATE TABLE IF NOT EXISTS public.report_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table report_schedules
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  schedule_name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  schedule_config JSONB DEFAULT '{}'::jsonb,
  recipients JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 6. Table report_connectors
CREATE TABLE IF NOT EXISTS public.report_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  connector_name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  connection_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 7. Table report_api_tokens
CREATE TABLE IF NOT EXISTS public.report_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  token_name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.report_archiving_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_api_tokens ENABLE ROW LEVEL SECURITY;

-- Politiques pour report_archiving_policies
DROP POLICY IF EXISTS "tenant_access_report_archiving_policies" ON public.report_archiving_policies;
CREATE POLICY "tenant_access_report_archiving_policies"
  ON public.report_archiving_policies
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_templates
DROP POLICY IF EXISTS "tenant_access_report_templates" ON public.report_templates;
CREATE POLICY "tenant_access_report_templates"
  ON public.report_templates
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_template_versions
DROP POLICY IF EXISTS "tenant_access_report_template_versions" ON public.report_template_versions;
CREATE POLICY "tenant_access_report_template_versions"
  ON public.report_template_versions
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_permissions
DROP POLICY IF EXISTS "tenant_access_report_permissions" ON public.report_permissions;
CREATE POLICY "tenant_access_report_permissions"
  ON public.report_permissions
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_schedules
DROP POLICY IF EXISTS "tenant_access_report_schedules" ON public.report_schedules;
CREATE POLICY "tenant_access_report_schedules"
  ON public.report_schedules
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_connectors
DROP POLICY IF EXISTS "tenant_access_report_connectors" ON public.report_connectors;
CREATE POLICY "tenant_access_report_connectors"
  ON public.report_connectors
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Politiques pour report_api_tokens
DROP POLICY IF EXISTS "tenant_access_report_api_tokens" ON public.report_api_tokens;
CREATE POLICY "tenant_access_report_api_tokens"
  ON public.report_api_tokens
  FOR ALL
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- ============================================
-- INDEX DE PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_report_archiving_policies_tenant ON public.report_archiving_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant ON public.report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON public.report_templates(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_report_template_versions_template ON public.report_template_versions(template_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_report_permissions_tenant ON public.report_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant ON public.report_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON public.report_schedules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_report_connectors_tenant ON public.report_connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_api_tokens_tenant ON public.report_api_tokens(tenant_id);

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_archiving_policies_updated_at ON public.report_archiving_policies;
CREATE TRIGGER update_report_archiving_policies_updated_at
  BEFORE UPDATE ON public.report_archiving_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_permissions_updated_at ON public.report_permissions;
CREATE TRIGGER update_report_permissions_updated_at
  BEFORE UPDATE ON public.report_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_schedules_updated_at ON public.report_schedules;
CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_connectors_updated_at ON public.report_connectors;
CREATE TRIGGER update_report_connectors_updated_at
  BEFORE UPDATE ON public.report_connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTION RPC pour appliquer la politique d'archivage
-- ============================================

CREATE OR REPLACE FUNCTION public.reports_apply_archiving_policy()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_policy RECORD;
  v_deleted_count INTEGER := 0;
BEGIN
  -- Récupérer le tenant de l'utilisateur actuel
  v_tenant_id := get_current_user_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant non trouvé pour l''utilisateur actuel';
  END IF;

  -- Récupérer la politique d'archivage
  SELECT * INTO v_policy
  FROM report_archiving_policies
  WHERE tenant_id = v_tenant_id
  LIMIT 1;

  IF NOT FOUND OR NOT v_policy.purge_enabled THEN
    RETURN 0;
  END IF;

  -- Supprimer les anciens rapports (si tables existent)
  -- Cette logique peut être étendue selon les besoins
  
  RETURN v_deleted_count;
END;
$$;