-- =====================================================
-- MULTICHANNEL HUB - Tables et RPC pour Multi-Canaux Réseau
-- =====================================================

-- Table des connecteurs multi-canaux
CREATE TABLE public.multichannel_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('sms', 'email', 'whatsapp', 'teams', 'slack', 'webhook', 'telegram', 'messenger')),
  provider TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  config JSONB DEFAULT '{}',
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  is_network_shared BOOLEAN DEFAULT false,
  shared_with_pharmacies UUID[] DEFAULT '{}',
  priority_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des règles d'automatisation
CREATE TABLE public.multichannel_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('routing', 'auto_response', 'escalation', 'schedule', 'fallback')),
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  target_channels UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  priority_order INTEGER DEFAULT 0,
  is_network_rule BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des analytics multi-canaux
CREATE TABLE public.multichannel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.multichannel_connectors(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  cost_estimate NUMERIC(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX idx_multichannel_connectors_tenant ON public.multichannel_connectors(tenant_id);
CREATE INDEX idx_multichannel_connectors_type ON public.multichannel_connectors(channel_type);
CREATE INDEX idx_multichannel_connectors_status ON public.multichannel_connectors(status);
CREATE INDEX idx_multichannel_connectors_shared ON public.multichannel_connectors(is_network_shared) WHERE is_network_shared = true;

CREATE INDEX idx_multichannel_automation_rules_tenant ON public.multichannel_automation_rules(tenant_id);
CREATE INDEX idx_multichannel_automation_rules_type ON public.multichannel_automation_rules(rule_type);
CREATE INDEX idx_multichannel_automation_rules_active ON public.multichannel_automation_rules(is_active) WHERE is_active = true;

CREATE INDEX idx_multichannel_analytics_tenant ON public.multichannel_analytics(tenant_id);
CREATE INDEX idx_multichannel_analytics_connector ON public.multichannel_analytics(connector_id);
CREATE INDEX idx_multichannel_analytics_period ON public.multichannel_analytics(period_start, period_end);

-- Enable RLS
ALTER TABLE public.multichannel_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multichannel_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multichannel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multichannel_connectors (multi-tenant + inter-tenant)
CREATE POLICY "Users can view own and shared connectors"
ON public.multichannel_connectors FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR is_network_shared = true
  OR get_current_user_tenant_id() = ANY(shared_with_pharmacies)
);

CREATE POLICY "Users can insert connectors in their tenant"
ON public.multichannel_connectors FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own connectors"
ON public.multichannel_connectors FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own connectors"
ON public.multichannel_connectors FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for multichannel_automation_rules (multi-tenant + inter-tenant)
CREATE POLICY "Users can view own and network rules"
ON public.multichannel_automation_rules FOR SELECT
USING (
  tenant_id = get_current_user_tenant_id()
  OR is_network_rule = true
);

CREATE POLICY "Users can insert rules in their tenant"
ON public.multichannel_automation_rules FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update own rules"
ON public.multichannel_automation_rules FOR UPDATE
USING (tenant_id = get_current_user_tenant_id())
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete own rules"
ON public.multichannel_automation_rules FOR DELETE
USING (tenant_id = get_current_user_tenant_id());

-- RLS Policies for multichannel_analytics
CREATE POLICY "Users can view own analytics"
ON public.multichannel_analytics FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert analytics in their tenant"
ON public.multichannel_analytics FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Triggers for updated_at
CREATE TRIGGER update_multichannel_connectors_updated_at
  BEFORE UPDATE ON public.multichannel_connectors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multichannel_automation_rules_updated_at
  BEFORE UPDATE ON public.multichannel_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC Function: get_multichannel_metrics
CREATE OR REPLACE FUNCTION public.get_multichannel_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_active_channels INTEGER;
  v_total_channels INTEGER;
  v_total_messages INTEGER;
  v_avg_response_rate NUMERIC;
  v_active_rules INTEGER;
  v_total_rules INTEGER;
  v_uptime NUMERIC;
BEGIN
  -- Count connectors
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*)
  INTO v_active_channels, v_total_channels
  FROM multichannel_connectors
  WHERE tenant_id = p_tenant_id OR is_network_shared = true;
  
  -- Sum messages sent
  SELECT COALESCE(SUM(messages_sent), 0)
  INTO v_total_messages
  FROM multichannel_connectors
  WHERE tenant_id = p_tenant_id OR is_network_shared = true;
  
  -- Calculate average response rate
  SELECT COALESCE(AVG(response_rate), 0)
  INTO v_avg_response_rate
  FROM multichannel_connectors
  WHERE (tenant_id = p_tenant_id OR is_network_shared = true)
    AND status = 'active';
  
  -- Count automation rules
  SELECT 
    COUNT(*) FILTER (WHERE is_active = true),
    COUNT(*)
  INTO v_active_rules, v_total_rules
  FROM multichannel_automation_rules
  WHERE tenant_id = p_tenant_id OR is_network_rule = true;
  
  -- Calculate uptime (based on error status)
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status != 'error')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        1
      )
    END
  INTO v_uptime
  FROM multichannel_connectors
  WHERE tenant_id = p_tenant_id OR is_network_shared = true;
  
  -- Build result
  v_result := jsonb_build_object(
    'active_channels', COALESCE(v_active_channels, 0),
    'total_channels', COALESCE(v_total_channels, 0),
    'total_messages_sent', COALESCE(v_total_messages, 0),
    'avg_response_rate', ROUND(COALESCE(v_avg_response_rate, 0), 1),
    'active_rules', COALESCE(v_active_rules, 0),
    'total_rules', COALESCE(v_total_rules, 0),
    'uptime_percentage', COALESCE(v_uptime, 100),
    'calculated_at', now()
  );
  
  RETURN v_result;
END;
$$;