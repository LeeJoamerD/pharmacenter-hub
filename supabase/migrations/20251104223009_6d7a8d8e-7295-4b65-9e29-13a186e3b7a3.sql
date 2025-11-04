-- ============================================================================
-- PHASE 1: MIGRATION AUDIT & SÉCURITÉ - TABLES COMPLÉMENTAIRES
-- ============================================================================

-- Table: security_controls
-- Gestion des contrôles de sécurité avec scoring
CREATE TABLE IF NOT EXISTS public.security_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  control_name TEXT NOT NULL,
  control_type TEXT NOT NULL, -- 'authentication', 'encryption', 'backup', 'access_control', 'intrusion_detection', 'audit'
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  compliance_score NUMERIC(5,2) DEFAULT 0.00,
  last_check_date TIMESTAMP WITH TIME ZONE,
  next_check_date TIMESTAMP WITH TIME ZONE,
  check_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'compliant', 'non_compliant', 'partial'
  risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: compliance_checks
-- Suivi des exigences réglementaires par pays
CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requirement_name TEXT NOT NULL,
  requirement_code TEXT NOT NULL, -- 'OHADA_ART_25', 'RGPD_ART_32', etc.
  category TEXT NOT NULL, -- 'data_retention', 'audit_trail', 'separation_of_duties', 'encryption', 'access_control'
  country_code TEXT NOT NULL DEFAULT 'CG', -- 'CG', 'CM', 'SN', 'CI', 'FR', 'BE'
  regulatory_body TEXT, -- 'OHADA', 'SYSCOHADA', 'ANC', 'CNC', 'RGPD'
  description TEXT,
  compliance_status TEXT NOT NULL DEFAULT 'pending', -- 'compliant', 'non_compliant', 'partial', 'pending', 'in_progress'
  compliance_score NUMERIC(5,2) DEFAULT 0.00,
  last_evaluation_date TIMESTAMP WITH TIME ZONE,
  next_evaluation_date TIMESTAMP WITH TIME ZONE,
  evaluation_frequency TEXT DEFAULT 'quarterly', -- 'monthly', 'quarterly', 'annually'
  evidence_documents JSONB DEFAULT '[]'::jsonb, -- Array of document URLs/references
  corrective_actions JSONB DEFAULT '[]'::jsonb, -- Array of actions with status
  assigned_to UUID, -- personnel_id
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: backup_logs
-- Historique des sauvegardes système
CREATE TABLE IF NOT EXISTS public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  backup_type TEXT NOT NULL, -- 'manual', 'automatic', 'scheduled'
  backup_scope TEXT NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'differential'
  backup_location TEXT, -- Storage path or URL
  backup_size_mb NUMERIC(12,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  is_encrypted BOOLEAN NOT NULL DEFAULT true,
  encryption_algorithm TEXT DEFAULT 'AES-256',
  initiated_by UUID, -- personnel_id
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: audit_reports
-- Gestion des rapports d'audit générés
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL, -- 'audit_complet', 'connexions', 'conformite', 'risques'
  report_name TEXT NOT NULL,
  report_format TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_by UUID, -- personnel_id
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_url TEXT,
  file_size_kb INTEGER,
  status TEXT NOT NULL DEFAULT 'generated', -- 'generating', 'generated', 'sent', 'failed'
  recipients JSONB DEFAULT '[]'::jsonb, -- Array of email addresses
  scheduled BOOLEAN NOT NULL DEFAULT false,
  schedule_frequency TEXT, -- 'monthly', 'quarterly', 'annually'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: parametres_audit_regionaux
-- Multi-localisation labels et règles (6 pays)
CREATE TABLE IF NOT EXISTS public.parametres_audit_regionaux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pays TEXT NOT NULL UNIQUE, -- 'CG', 'CM', 'SN', 'CI', 'FR', 'BE'
  libelle_pays TEXT NOT NULL,
  code_devise TEXT NOT NULL,
  referentiel_comptable TEXT NOT NULL, -- 'OHADA', 'SYSCOHADA', 'PCG', 'PCMN'
  organisme_normalisation TEXT NOT NULL, -- 'OHADA', 'CEMAC', 'UEMOA', 'ANC', 'CNC'
  duree_conservation_ans INTEGER NOT NULL DEFAULT 10,
  exigences_obligatoires JSONB NOT NULL DEFAULT '[]'::jsonb,
  labels_interface JSONB NOT NULL DEFAULT '{}'::jsonb,
  format_date TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  format_heure TEXT NOT NULL DEFAULT 'HH:mm',
  timezone TEXT NOT NULL DEFAULT 'Africa/Brazzaville',
  exige_rgpd BOOLEAN NOT NULL DEFAULT false,
  exige_signature_electronique BOOLEAN NOT NULL DEFAULT false,
  mentions_legales TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_audit_regionaux ENABLE ROW LEVEL SECURITY;

-- Policies: security_controls
CREATE POLICY "Users can view security controls from their tenant"
ON public.security_controls FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage security controls in their tenant"
ON public.security_controls FOR ALL
USING (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Policies: compliance_checks
CREATE POLICY "Users can view compliance checks from their tenant"
ON public.compliance_checks FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage compliance checks in their tenant"
ON public.compliance_checks FOR ALL
USING (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
);

-- Policies: backup_logs
CREATE POLICY "Users can view backup logs from their tenant"
ON public.backup_logs FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage backup logs in their tenant"
ON public.backup_logs FOR ALL
USING (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Policies: audit_reports
CREATE POLICY "Users can view audit reports from their tenant"
ON public.audit_reports FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can create audit reports in their tenant"
ON public.audit_reports FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage audit reports in their tenant"
ON public.audit_reports FOR ALL
USING (
  tenant_id = get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.personnel
    WHERE auth_user_id = auth.uid()
    AND role IN ('Admin', 'Pharmacien', 'Comptable')
  )
);

-- Policies: parametres_audit_regionaux (public read)
CREATE POLICY "Everyone can view regional audit parameters"
ON public.parametres_audit_regionaux FOR SELECT
USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_security_controls_tenant ON public.security_controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_controls_status ON public.security_controls(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_security_controls_type ON public.security_controls(tenant_id, control_type);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_tenant ON public.compliance_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON public.compliance_checks(tenant_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_country ON public.compliance_checks(country_code);

CREATE INDEX IF NOT EXISTS idx_backup_logs_tenant ON public.backup_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON public.backup_logs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_date ON public.backup_logs(tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_reports_tenant ON public.audit_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON public.audit_reports(tenant_id, report_type);
CREATE INDEX IF NOT EXISTS idx_audit_reports_date ON public.audit_reports(tenant_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_parametres_audit_pays ON public.parametres_audit_regionaux(pays);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_audit_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_controls_updated_at
BEFORE UPDATE ON public.security_controls
FOR EACH ROW EXECUTE FUNCTION public.update_audit_tables_updated_at();

CREATE TRIGGER update_compliance_checks_updated_at
BEFORE UPDATE ON public.compliance_checks
FOR EACH ROW EXECUTE FUNCTION public.update_audit_tables_updated_at();

CREATE TRIGGER update_backup_logs_updated_at
BEFORE UPDATE ON public.backup_logs
FOR EACH ROW EXECUTE FUNCTION public.update_audit_tables_updated_at();

CREATE TRIGGER update_audit_reports_updated_at
BEFORE UPDATE ON public.audit_reports
FOR EACH ROW EXECUTE FUNCTION public.update_audit_tables_updated_at();

-- ============================================================================
-- INITIALISATION DONNÉES PAR DÉFAUT (6 PAYS)
-- ============================================================================

INSERT INTO public.parametres_audit_regionaux (
  pays, libelle_pays, code_devise, referentiel_comptable, organisme_normalisation,
  duree_conservation_ans, exigences_obligatoires, labels_interface,
  format_date, format_heure, timezone, exige_rgpd, exige_signature_electronique, mentions_legales
) VALUES
-- Congo-Brazzaville (par défaut)
('CG', 'Congo-Brazzaville', 'XAF', 'OHADA', 'OHADA',
 10,
 '["Conservation 10 ans", "Traçabilité modifications", "Séparation des tâches", "Contrôle périodique", "Signature responsable"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Africa/Brazzaville', false, false,
 'Documents conservés conformément à l''Acte uniforme OHADA relatif au droit comptable et à l''information financière (10 ans minimum).'),

-- Cameroun
('CM', 'Cameroun', 'XAF', 'SYSCOHADA', 'CEMAC',
 10,
 '["Conservation 10 ans", "Traçabilité SYSCOHADA", "Séparation des tâches", "Contrôle périodique", "Conformité CEMAC"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Africa/Douala', false, false,
 'Documents conservés conformément au SYSCOHADA et aux directives CEMAC (10 ans minimum).'),

-- Sénégal
('SN', 'Sénégal', 'XOF', 'SYSCOHADA', 'UEMOA',
 10,
 '["Conservation 10 ans", "Traçabilité SYSCOHADA", "Séparation des tâches", "Conformité UEMOA", "Déclaration fiscale BCEAO"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Africa/Dakar', false, false,
 'Documents conservés conformément au SYSCOHADA et aux directives UEMOA (10 ans minimum).'),

-- Côte d''Ivoire
('CI', 'Côte d''Ivoire', 'XOF', 'SYSCOHADA', 'UEMOA',
 10,
 '["Conservation 10 ans", "Traçabilité SYSCOHADA", "Séparation des tâches", "Conformité UEMOA", "Certification expert-comptable"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Africa/Abidjan', false, false,
 'Documents conservés conformément au SYSCOHADA et aux directives UEMOA (10 ans minimum).'),

-- France
('FR', 'France', 'EUR', 'PCG', 'ANC',
 10,
 '["Conservation 10 ans", "Traçabilité modifications", "Conformité RGPD", "Chiffrement données", "Droit à l''oubli", "FEC annuel"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Europe/Paris', true, true,
 'Documents conservés conformément au Code de commerce (Art. L123-22 : 10 ans) et au RGPD (Art. 32).'),

-- Belgique
('BE', 'Belgique', 'EUR', 'PCMN', 'CNC',
 7,
 '["Conservation 7 ans", "Traçabilité modifications", "Conformité RGPD", "Chiffrement données", "Droit à l''oubli", "Contrôle fiduciaire"]'::jsonb,
 '{"audit_trail": "Pistes d''Audit", "security": "Sécurité", "permissions": "Permissions", "compliance": "Conformité", "backup": "Sauvegarde", "reports": "Rapports", "active_sessions": "Sessions Actives", "security_controls": "Contrôles de Sécurité", "regulatory_requirements": "Exigences Réglementaires"}'::jsonb,
 'DD/MM/YYYY', 'HH:mm', 'Europe/Brussels', true, true,
 'Documents conservés conformément au Code des sociétés (Art. 2:11 : 7 ans) et au RGPD (Art. 32).')
ON CONFLICT (pays) DO NOTHING;