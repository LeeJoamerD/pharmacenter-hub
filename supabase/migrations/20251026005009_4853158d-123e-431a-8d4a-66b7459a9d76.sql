-- Migration: Restauration complète du module Paramètres\Sécurité
-- Référence: supabase/migrations_backup_original/20250823233615_847a818e-3ff1-4795-803c-9c911ee71d8f.sql

-- =====================================================================
-- ÉTAPE 1: Ajouter contrainte unique sur password_policies.tenant_id
-- =====================================================================
ALTER TABLE public.password_policies 
ADD CONSTRAINT password_policies_tenant_unique 
UNIQUE (tenant_id);

-- =====================================================================
-- ÉTAPE 2: Créer la table tenant_security_config
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.tenant_security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  allow_cross_tenant_read BOOLEAN NOT NULL DEFAULT false,
  allowed_source_tenants TEXT[] DEFAULT '{}',
  security_level TEXT NOT NULL DEFAULT 'standard',
  auto_block_violations BOOLEAN NOT NULL DEFAULT true,
  max_violations_per_hour INTEGER NOT NULL DEFAULT 5,
  notification_webhook TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_security_config_tenant ON public.tenant_security_config(tenant_id);

COMMENT ON TABLE public.tenant_security_config IS 'Configuration de sécurité avancée multi-tenant';
COMMENT ON COLUMN public.tenant_security_config.security_level IS 'Niveau de sécurité: basic, standard, enhanced, maximum';
COMMENT ON COLUMN public.tenant_security_config.allowed_source_tenants IS 'Liste des tenant_id autorisés pour lecture cross-tenant';

-- =====================================================================
-- ÉTAPE 3: Activer RLS sur tenant_security_config
-- =====================================================================
ALTER TABLE public.tenant_security_config ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- ÉTAPE 4: Créer les RLS policies pour tenant_security_config
-- =====================================================================

-- Policy SELECT: Les utilisateurs peuvent voir leur configuration
CREATE POLICY "Users can view security config from their tenant"
ON public.tenant_security_config
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Policy INSERT: Les admins peuvent créer la configuration
CREATE POLICY "Admins can create security config for their tenant"
ON public.tenant_security_config
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- Policy UPDATE: Les admins peuvent modifier leur configuration
CREATE POLICY "Admins can update security config from their tenant"
ON public.tenant_security_config
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
)
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- Policy DELETE: Les admins peuvent supprimer leur configuration
CREATE POLICY "Admins can delete security config from their tenant"
ON public.tenant_security_config
FOR DELETE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- =====================================================================
-- ÉTAPE 5: Créer le trigger updated_at pour tenant_security_config
-- =====================================================================
CREATE TRIGGER update_tenant_security_config_updated_at
  BEFORE UPDATE ON public.tenant_security_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- ÉTAPE 6: Mettre à jour les RLS policies de password_policies
-- =====================================================================

-- Supprimer l'ancienne policy trop large
DROP POLICY IF EXISTS "tenant_access_password_policies" ON public.password_policies;

-- Policy SELECT: Tous les utilisateurs authentifiés peuvent voir
CREATE POLICY "Users can view password policies from their tenant"
ON public.password_policies
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id());

-- Policy INSERT: Admins peuvent créer
CREATE POLICY "Admins can create password policies for their tenant"
ON public.password_policies
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- Policy UPDATE: Admins peuvent modifier
CREATE POLICY "Admins can update password policies from their tenant"
ON public.password_policies
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
)
WITH CHECK (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- Policy DELETE: Admins peuvent supprimer
CREATE POLICY "Admins can delete password policies from their tenant"
ON public.password_policies
FOR DELETE
TO authenticated
USING (
  tenant_id = get_current_user_tenant_id()
  AND is_system_admin()
);

-- =====================================================================
-- ÉTAPE 7: Initialiser configuration par défaut pour chaque tenant
-- =====================================================================

-- Créer une configuration de sécurité par défaut pour les tenants existants
INSERT INTO public.tenant_security_config (
  tenant_id,
  allow_cross_tenant_read,
  security_level,
  auto_block_violations,
  max_violations_per_hour
)
SELECT 
  id,
  false,
  'standard',
  true,
  5
FROM public.pharmacies
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.tenant_security_config tsc 
  WHERE tsc.tenant_id = pharmacies.id
);

-- =====================================================================
-- VÉRIFICATION FINALE
-- =====================================================================
-- ✓ password_policies : UNIQUE(tenant_id) + RLS policies granulaires
-- ✓ tenant_security_config : table créée + RLS + trigger + données par défaut
-- ✓ Module Sécurité : toutes dépendances satisfaites