-- Créer la table security_reports pour persister les rapports générés
CREATE TABLE IF NOT EXISTS public.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_by UUID NULL, -- personnel_id
  type TEXT NOT NULL CHECK (type IN ('quotidien', 'hebdomadaire', 'conformite')),
  params JSONB NULL DEFAULT '{}', -- snapshot des paramètres à la génération
  content JSONB NULL DEFAULT '{}', -- agrégats des métriques et alertes au moment de la génération
  status TEXT NOT NULL DEFAULT 'genere' CHECK (status IN ('genere', 'exporte', 'erreur')),
  file_url TEXT NULL, -- pour export futur
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mise à jour automatique de updated_at pour security_reports
CREATE OR REPLACE TRIGGER update_security_reports_updated_at
  BEFORE UPDATE ON public.security_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Corriger tenant_id NOT NULL pour security_alerts si nécessaire
ALTER TABLE public.security_alerts 
ALTER COLUMN tenant_id SET NOT NULL;

-- Corriger tenant_id NOT NULL pour audit_logs si nécessaire  
ALTER TABLE public.audit_logs
ALTER COLUMN tenant_id SET NOT NULL;

-- Activer RLS sur security_reports
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour security_reports
CREATE POLICY "Users can view security reports from their tenant"
  ON public.security_reports FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert security reports in their tenant"
  ON public.security_reports FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can update security reports from their tenant"
  ON public.security_reports FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id() AND 
         EXISTS (SELECT 1 FROM public.personnel 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('Admin', 'Pharmacien')));

CREATE POLICY "Admins can delete security reports from their tenant"
  ON public.security_reports FOR DELETE
  USING (tenant_id = get_current_user_tenant_id() AND 
         EXISTS (SELECT 1 FROM public.personnel 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('Admin', 'Pharmacien')));

-- Vérifier et corriger les politiques RLS pour security_alerts si nécessaire
DROP POLICY IF EXISTS "Users can view security alerts from their tenant" ON public.security_alerts;
CREATE POLICY "Users can view security alerts from their tenant"
  ON public.security_alerts FOR SELECT
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can insert security alerts in their tenant" ON public.security_alerts;
CREATE POLICY "Users can insert security alerts in their tenant"  
  ON public.security_alerts FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Admins can update security alerts from their tenant" ON public.security_alerts;
CREATE POLICY "Admins can update security alerts from their tenant"
  ON public.security_alerts FOR UPDATE
  USING (tenant_id = get_current_user_tenant_id() AND 
         EXISTS (SELECT 1 FROM public.personnel 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('Admin', 'Pharmacien')));

-- Index de performance pour security_reports
CREATE INDEX IF NOT EXISTS idx_security_reports_tenant_created 
  ON public.security_reports(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_security_reports_type_status 
  ON public.security_reports(tenant_id, type, status);

-- Index de performance complet pour security_alerts (tenant_id, created_at)
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant_created 
  ON public.security_alerts(tenant_id, created_at);

-- Index de performance complet pour audit_logs (tenant_id, created_at) 
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON public.audit_logs(tenant_id, created_at);

-- Ajouter security_alerts à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;

-- Ajouter security_reports à la publication Realtime pour les mises à jour de statut
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_reports;

-- Configurer REPLICA IDENTITY pour les tables Realtime
ALTER TABLE public.security_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.security_reports REPLICA IDENTITY FULL;