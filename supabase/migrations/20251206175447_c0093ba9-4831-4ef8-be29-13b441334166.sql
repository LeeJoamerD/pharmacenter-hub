
-- =====================================================
-- SÉCURITÉ RÉSEAU: Tables pour la gestion de la sécurité
-- =====================================================

-- 1. Configuration chiffrement par ressource
CREATE TABLE IF NOT EXISTS public.encryption_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  encryption_type TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_rotation_days INTEGER DEFAULT 30,
  auto_rotation_enabled BOOLEAN DEFAULT true,
  metadata_encryption BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  last_rotation_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  active_keys_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Rapports de conformité générés
CREATE TABLE IF NOT EXISTS public.network_compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  compliance_score NUMERIC(5,2),
  file_url TEXT,
  file_size_mb NUMERIC(10,2),
  generated_by UUID REFERENCES public.personnel(id),
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. Règles d'accès avancées
CREATE TABLE IF NOT EXISTS public.security_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  target_resource TEXT,
  conditions JSONB DEFAULT '{}'::jsonb,
  permissions TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Méthodes d'authentification autorisées
CREATE TABLE IF NOT EXISTS public.security_auth_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_required_for_2fa BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}'::jsonb,
  users_enrolled_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, method_type)
);

-- 5. Historique des rotations de clés
CREATE TABLE IF NOT EXISTS public.security_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  encryption_config_id UUID REFERENCES public.encryption_configs(id) ON DELETE CASCADE,
  rotation_type TEXT NOT NULL,
  old_key_id TEXT,
  new_key_id TEXT,
  status TEXT DEFAULT 'completed',
  initiated_by UUID REFERENCES public.personnel(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES pour performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_encryption_configs_tenant ON public.encryption_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_encryption_configs_status ON public.encryption_configs(status);

CREATE INDEX IF NOT EXISTS idx_network_compliance_reports_tenant ON public.network_compliance_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_compliance_reports_status ON public.network_compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_network_compliance_reports_type ON public.network_compliance_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_security_access_rules_tenant ON public.security_access_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_access_rules_active ON public.security_access_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_security_access_rules_type ON public.security_access_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_security_auth_methods_tenant ON public.security_auth_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_auth_methods_enabled ON public.security_auth_methods(is_enabled);

CREATE INDEX IF NOT EXISTS idx_security_key_rotations_tenant ON public.security_key_rotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_key_rotations_config ON public.security_key_rotations(encryption_config_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- encryption_configs
ALTER TABLE public.encryption_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view encryption configs from their tenant"
ON public.encryption_configs FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert encryption configs in their tenant"
ON public.encryption_configs FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update encryption configs from their tenant"
ON public.encryption_configs FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete encryption configs from their tenant"
ON public.encryption_configs FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- network_compliance_reports
ALTER TABLE public.network_compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance reports from their tenant"
ON public.network_compliance_reports FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert compliance reports in their tenant"
ON public.network_compliance_reports FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update compliance reports from their tenant"
ON public.network_compliance_reports FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete compliance reports from their tenant"
ON public.network_compliance_reports FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- security_access_rules
ALTER TABLE public.security_access_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view access rules from their tenant"
ON public.security_access_rules FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert access rules in their tenant"
ON public.security_access_rules FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update access rules from their tenant"
ON public.security_access_rules FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete access rules from their tenant"
ON public.security_access_rules FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- security_auth_methods
ALTER TABLE public.security_auth_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view auth methods from their tenant"
ON public.security_auth_methods FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert auth methods in their tenant"
ON public.security_auth_methods FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update auth methods from their tenant"
ON public.security_auth_methods FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete auth methods from their tenant"
ON public.security_auth_methods FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- security_key_rotations
ALTER TABLE public.security_key_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view key rotations from their tenant"
ON public.security_key_rotations FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert key rotations in their tenant"
ON public.security_key_rotations FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update key rotations from their tenant"
ON public.security_key_rotations FOR UPDATE
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete key rotations from their tenant"
ON public.security_key_rotations FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_security_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_encryption_configs_updated_at
BEFORE UPDATE ON public.encryption_configs
FOR EACH ROW EXECUTE FUNCTION update_security_tables_updated_at();

CREATE TRIGGER update_security_access_rules_updated_at
BEFORE UPDATE ON public.security_access_rules
FOR EACH ROW EXECUTE FUNCTION update_security_tables_updated_at();

CREATE TRIGGER update_security_auth_methods_updated_at
BEFORE UPDATE ON public.security_auth_methods
FOR EACH ROW EXECUTE FUNCTION update_security_tables_updated_at();
