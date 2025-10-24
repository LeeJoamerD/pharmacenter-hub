-- ===================================
-- Migration 03: Audit & Sécurité
-- ===================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, table_name TEXT NOT NULL, record_id UUID,
  old_values JSONB, new_values JSONB,
  ip_address INET, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_type TEXT CHECK (alert_type IN ('unauthorized_access', 'suspicious_activity', 'data_breach', 'policy_violation')) NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ, resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_security_alerts_tenant_id ON public.security_alerts(tenant_id);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);

CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_tenant_id UUID;
BEGIN
  current_tenant_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
  INSERT INTO public.audit_logs (tenant_id, user_id, action, table_name, record_id, old_values, new_values)
  VALUES (current_tenant_id, auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_cross_tenant_attempt()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO user_tenant_id FROM public.personnel WHERE auth_user_id = auth.uid();
  IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id != user_tenant_id THEN
    INSERT INTO public.security_alerts (tenant_id, user_id, alert_type, severity, description, metadata)
    VALUES (user_tenant_id, auth.uid(), 'unauthorized_access', 'high', 'Tentative cross-tenant sur ' || TG_TABLE_NAME, jsonb_build_object('table', TG_TABLE_NAME, 'attempted_tenant_id', NEW.tenant_id));
    RAISE EXCEPTION 'Accès interdit: tentative cross-tenant';
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View audit from tenant" ON public.audit_logs FOR SELECT USING (tenant_id = get_current_user_tenant_id());
CREATE POLICY "System insert audit" ON public.audit_logs FOR INSERT WITH CHECK (true);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view alerts" ON public.security_alerts FOR SELECT USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "Admins update alerts" ON public.security_alerts FOR UPDATE USING (tenant_id = get_current_user_tenant_id() AND EXISTS (SELECT 1 FROM public.personnel WHERE auth_user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "System insert alerts" ON public.security_alerts FOR INSERT WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.log_audit_trail() TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_cross_tenant_attempt() TO authenticated;