
-- =============================================================================
-- Tables pour l'Administration du Réseau Chat-PharmaSoft
-- Inter-tenants, Partenaires, Audit et Permissions
-- =============================================================================

-- 1. Table pour les comptes partenaires dans le chat (fournisseurs, laboratoires, etc.)
CREATE TABLE IF NOT EXISTS public.network_partner_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('fournisseur', 'laboratoire', 'societe', 'assureur')),
  partner_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  chat_enabled BOOLEAN DEFAULT true,
  can_initiate_conversation BOOLEAN DEFAULT true,
  can_create_channels BOOLEAN DEFAULT false,
  allowed_channels UUID[] DEFAULT '{}',
  max_daily_messages INTEGER DEFAULT 100,
  last_active_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  invited_by UUID REFERENCES public.personnel(id),
  invitation_sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table pour les permissions inter-tenants de chat
CREATE TABLE IF NOT EXISTS public.network_chat_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  target_tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  target_partner_id UUID REFERENCES public.network_partner_accounts(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('chat', 'channel_invite', 'file_share', 'video_call', 'screen_share', 'voice_call')),
  is_granted BOOLEAN DEFAULT true,
  is_bidirectional BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  granted_by UUID REFERENCES public.personnel(id),
  revoked_by UUID REFERENCES public.personnel(id),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_target CHECK (target_tenant_id IS NOT NULL OR target_partner_id IS NOT NULL)
);

-- 3. Table pour les invitations aux canaux (inter-tenants et partenaires)
CREATE TABLE IF NOT EXISTS public.network_channel_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.network_channels(id) ON DELETE CASCADE,
  inviter_tenant_id UUID NOT NULL REFERENCES public.pharmacies(id),
  inviter_user_id UUID REFERENCES public.personnel(id),
  invitee_tenant_id UUID REFERENCES public.pharmacies(id),
  invitee_partner_id UUID REFERENCES public.network_partner_accounts(id),
  invitee_type TEXT NOT NULL CHECK (invitee_type IN ('pharmacy', 'partner', 'user')),
  invitee_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  message TEXT,
  role_in_channel TEXT DEFAULT 'member' CHECK (role_in_channel IN ('admin', 'moderator', 'member', 'viewer')),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_invitee CHECK (invitee_tenant_id IS NOT NULL OR invitee_partner_id IS NOT NULL OR invitee_email IS NOT NULL)
);

-- 4. Table pour les logs d'audit réseau détaillés
CREATE TABLE IF NOT EXISTS public.network_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  partner_account_id UUID REFERENCES public.network_partner_accounts(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN ('authentication', 'authorization', 'data_access', 'configuration', 'channel_management', 'message', 'file_transfer', 'security', 'system')),
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  source_tenant_id UUID REFERENCES public.pharmacies(id),
  target_tenant_id UUID REFERENCES public.pharmacies(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  session_id TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  is_sensitive BOOLEAN DEFAULT false,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.personnel(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table pour la configuration globale du chat réseau
CREATE TABLE IF NOT EXISTS public.network_chat_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value TEXT,
  config_type TEXT DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json', 'array')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'security', 'messaging', 'files', 'notifications', 'integrations', 'privacy')),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  can_override BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, config_key)
);

-- 6. Table pour les statistiques d'activité réseau
CREATE TABLE IF NOT EXISTS public.network_activity_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stat_hour INTEGER CHECK (stat_hour >= 0 AND stat_hour <= 23),
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  files_shared INTEGER DEFAULT 0,
  files_size_mb NUMERIC(10,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  active_channels INTEGER DEFAULT 0,
  inter_tenant_messages INTEGER DEFAULT 0,
  partner_messages INTEGER DEFAULT 0,
  peak_concurrent_users INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, stat_date, stat_hour)
);

-- =============================================================================
-- Enable Row Level Security
-- =============================================================================

ALTER TABLE public.network_partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_chat_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_channel_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_chat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_activity_stats ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies - Network Partner Accounts
-- =============================================================================

CREATE POLICY "Users can view partner accounts of their tenant"
ON public.network_partner_accounts FOR SELECT
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Admins can manage partner accounts"
ON public.network_partner_accounts FOR ALL
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- =============================================================================
-- RLS Policies - Network Chat Permissions (Inter-tenant access)
-- =============================================================================

CREATE POLICY "Users can view permissions involving their tenant"
ON public.network_chat_permissions FOR SELECT
USING (
  source_tenant_id = public.get_current_user_tenant_id()
  OR target_tenant_id = public.get_current_user_tenant_id()
);

CREATE POLICY "Admins can manage permissions from their tenant"
ON public.network_chat_permissions FOR ALL
USING (
  source_tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- =============================================================================
-- RLS Policies - Channel Invitations
-- =============================================================================

CREATE POLICY "Users can view invitations for their tenant"
ON public.network_channel_invitations FOR SELECT
USING (
  inviter_tenant_id = public.get_current_user_tenant_id()
  OR invitee_tenant_id = public.get_current_user_tenant_id()
  OR tenant_id = public.get_current_user_tenant_id()
);

CREATE POLICY "Admins can manage invitations from their tenant"
ON public.network_channel_invitations FOR ALL
USING (
  inviter_tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien', 'Manager')
  )
);

-- =============================================================================
-- RLS Policies - Audit Logs
-- =============================================================================

CREATE POLICY "Admins can view audit logs of their tenant"
ON public.network_audit_logs FOR SELECT
USING (
  (tenant_id = public.get_current_user_tenant_id() OR tenant_id IS NULL)
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

CREATE POLICY "System can insert audit logs"
ON public.network_audit_logs FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- RLS Policies - Chat Config
-- =============================================================================

CREATE POLICY "Users can view chat config of their tenant"
ON public.network_chat_config FOR SELECT
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Admins can manage chat config"
ON public.network_chat_config FOR ALL
USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- =============================================================================
-- RLS Policies - Activity Stats
-- =============================================================================

CREATE POLICY "Users can view activity stats of their tenant"
ON public.network_activity_stats FOR SELECT
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "System can manage activity stats"
ON public.network_activity_stats FOR ALL
USING (tenant_id = public.get_current_user_tenant_id());

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_network_partner_accounts_tenant ON public.network_partner_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_partner_accounts_partner ON public.network_partner_accounts(partner_type, partner_id);
CREATE INDEX IF NOT EXISTS idx_network_partner_accounts_status ON public.network_partner_accounts(status);

CREATE INDEX IF NOT EXISTS idx_network_chat_permissions_source ON public.network_chat_permissions(source_tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_chat_permissions_target ON public.network_chat_permissions(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_chat_permissions_type ON public.network_chat_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_network_channel_invitations_channel ON public.network_channel_invitations(channel_id);
CREATE INDEX IF NOT EXISTS idx_network_channel_invitations_status ON public.network_channel_invitations(status);
CREATE INDEX IF NOT EXISTS idx_network_channel_invitations_invitee ON public.network_channel_invitations(invitee_tenant_id);

CREATE INDEX IF NOT EXISTS idx_network_audit_logs_tenant ON public.network_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_audit_logs_action ON public.network_audit_logs(action_type, action_category);
CREATE INDEX IF NOT EXISTS idx_network_audit_logs_severity ON public.network_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_network_audit_logs_created ON public.network_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_chat_config_tenant ON public.network_chat_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_network_chat_config_category ON public.network_chat_config(category);

CREATE INDEX IF NOT EXISTS idx_network_activity_stats_tenant_date ON public.network_activity_stats(tenant_id, stat_date);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

CREATE TRIGGER update_network_partner_accounts_updated_at
  BEFORE UPDATE ON public.network_partner_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_chat_permissions_updated_at
  BEFORE UPDATE ON public.network_chat_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_channel_invitations_updated_at
  BEFORE UPDATE ON public.network_channel_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_chat_config_updated_at
  BEFORE UPDATE ON public.network_chat_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_activity_stats_updated_at
  BEFORE UPDATE ON public.network_activity_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
