-- ============================================
-- RESTAURATION MODULE SURVEILLANCE
-- Création de security_reports, correction RLS, index performance
-- ============================================

-- Étape 1: Créer la table security_reports
CREATE TABLE IF NOT EXISTS public.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  created_by UUID NULL REFERENCES public.personnel(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('quotidien', 'hebdomadaire', 'conformite')),
  params JSONB NULL DEFAULT '{}',
  content JSONB NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'genere' CHECK (status IN ('genere', 'exporte', 'erreur')),
  file_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.security_reports IS 'Rapports de sécurité générés (quotidiens, hebdomadaires, conformité)';
COMMENT ON COLUMN public.security_reports.params IS 'Snapshot des paramètres au moment de la génération';
COMMENT ON COLUMN public.security_reports.content IS 'Agrégats des métriques et alertes';

-- Étape 2: Créer le trigger updated_at pour security_reports
DROP TRIGGER IF EXISTS update_security_reports_updated_at ON public.security_reports;
CREATE TRIGGER update_security_reports_updated_at
  BEFORE UPDATE ON public.security_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Étape 3: Activer RLS sur security_reports
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view security reports from their tenant" ON public.security_reports;
DROP POLICY IF EXISTS "Users can insert security reports in their tenant" ON public.security_reports;
DROP POLICY IF EXISTS "Admins can update security reports from their tenant" ON public.security_reports;
DROP POLICY IF EXISTS "Admins can delete security reports from their tenant" ON public.security_reports;

-- Policy SELECT: Tous les utilisateurs authentifiés peuvent voir les rapports de leur tenant
CREATE POLICY "Users can view security reports from their tenant"
  ON public.security_reports FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

-- Policy INSERT: Tous les utilisateurs authentifiés peuvent créer des rapports
CREATE POLICY "Users can insert security reports in their tenant"
  ON public.security_reports FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy UPDATE: Admins et Pharmaciens peuvent modifier les rapports
CREATE POLICY "Admins can update security reports from their tenant"
  ON public.security_reports FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

-- Policy DELETE: Admins et Pharmaciens peuvent supprimer les rapports
CREATE POLICY "Admins can delete security reports from their tenant"
  ON public.security_reports FOR DELETE
  TO authenticated
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

-- Étape 4: Corriger les RLS policies pour security_alerts
-- Supprimer les anciennes policies trop restrictives
DROP POLICY IF EXISTS "Admins view alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Admins update alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "System insert alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Users can view security alerts from their tenant" ON public.security_alerts;
DROP POLICY IF EXISTS "Users can insert security alerts in their tenant" ON public.security_alerts;
DROP POLICY IF EXISTS "Admins can update security alerts from their tenant" ON public.security_alerts;

-- Policy SELECT: Tous les utilisateurs authentifiés peuvent voir les alertes de leur tenant
CREATE POLICY "Users can view security alerts from their tenant"
  ON public.security_alerts FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

-- Policy INSERT: Tous les utilisateurs authentifiés peuvent insérer des alertes
CREATE POLICY "Users can insert security alerts in their tenant"  
  ON public.security_alerts FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Policy UPDATE: Admins et Pharmaciens peuvent modifier/résoudre les alertes
CREATE POLICY "Admins can update security alerts from their tenant"
  ON public.security_alerts FOR UPDATE
  TO authenticated
  USING (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  )
  WITH CHECK (
    tenant_id = get_current_user_tenant_id() 
    AND is_system_admin()
  );

-- Étape 5: Créer les index de performance
-- Index pour security_reports
CREATE INDEX IF NOT EXISTS idx_security_reports_tenant_created 
  ON public.security_reports(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_reports_type_status 
  ON public.security_reports(tenant_id, type, status);

-- Index pour security_alerts (optimise les requêtes par date)
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant_created 
  ON public.security_alerts(tenant_id, created_at DESC);

-- Index pour audit_logs (optimise les requêtes de métriques)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON public.audit_logs(tenant_id, created_at DESC);

-- Étape 6: Configurer la publication Realtime
DO $$ 
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'security_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.security_reports;
  END IF;
END $$;

-- Configurer REPLICA IDENTITY FULL pour le Realtime
ALTER TABLE public.security_reports REPLICA IDENTITY FULL;

-- S'assurer que security_alerts a aussi REPLICA IDENTITY FULL
ALTER TABLE public.security_alerts REPLICA IDENTITY FULL;

-- Étape 7: Vérifier la contrainte tenant_id NOT NULL sur audit_logs
DO $$ 
BEGIN
  -- Supprimer les audit_logs orphelins si nécessaire
  DELETE FROM public.audit_logs WHERE tenant_id IS NULL;
  
  -- Appliquer la contrainte NOT NULL si elle n'existe pas déjà
  BEGIN
    ALTER TABLE public.audit_logs 
    ALTER COLUMN tenant_id SET NOT NULL;
  EXCEPTION
    WHEN others THEN
      -- Ignorer si la contrainte existe déjà
      NULL;
  END;
END $$;