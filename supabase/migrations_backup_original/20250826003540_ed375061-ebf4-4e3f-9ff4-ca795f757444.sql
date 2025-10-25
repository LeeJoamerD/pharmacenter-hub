-- Create the network_backup_runs table for backup execution tracking
CREATE TABLE public.network_backup_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'canceled')),
  type TEXT NOT NULL DEFAULT 'database' CHECK (type IN ('database', 'files', 'full', 'incremental')),
  size_mb NUMERIC NULL,
  storage_target TEXT NULL,
  triggered_by UUID NULL,
  configuration JSONB NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_network_backup_runs_tenant_started ON public.network_backup_runs (tenant_id, started_at DESC);
CREATE INDEX idx_network_backup_runs_tenant_status ON public.network_backup_runs (tenant_id, status);

-- Enable RLS
ALTER TABLE public.network_backup_runs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view backup runs from their tenant"
ON public.network_backup_runs
FOR SELECT
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert backup runs in their tenant"
ON public.network_backup_runs
FOR INSERT
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can update backup runs from their tenant"
ON public.network_backup_runs
FOR UPDATE
USING (
  tenant_id = get_current_user_tenant_id() 
  AND EXISTS (
    SELECT 1 FROM personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_network_backup_runs_updated_at
  BEFORE UPDATE ON public.network_backup_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default backup parameters in parametres_systeme for existing tenants
-- This will ensure all tenants have the default backup configuration
INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_auto_enabled' as cle_parametre,
  'true' as valeur_parametre,
  'boolean' as type_parametre,
  'backup' as categorie,
  'Activation de la sauvegarde automatique' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_frequency' as cle_parametre,
  'daily' as valeur_parametre,
  'text' as type_parametre,
  'backup' as categorie,
  'Fréquence de sauvegarde automatique' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_time' as cle_parametre,
  '02:00' as valeur_parametre,
  'text' as type_parametre,
  'backup' as categorie,
  'Heure de sauvegarde automatique' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_retention_days' as cle_parametre,
  '30' as valeur_parametre,
  'number' as type_parametre,
  'backup' as categorie,
  'Durée de rétention des sauvegardes en jours' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_compression_enabled' as cle_parametre,
  'true' as valeur_parametre,
  'boolean' as type_parametre,
  'backup' as categorie,
  'Activation de la compression des sauvegardes' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_encryption_enabled' as cle_parametre,
  'true' as valeur_parametre,
  'boolean' as type_parametre,
  'backup' as categorie,
  'Activation du chiffrement des sauvegardes' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_cloud_enabled' as cle_parametre,
  'false' as valeur_parametre,
  'boolean' as type_parametre,
  'backup' as categorie,
  'Activation de la sauvegarde cloud' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;

INSERT INTO public.parametres_systeme (tenant_id, cle_parametre, valeur_parametre, type_parametre, categorie, description)
SELECT 
  id as tenant_id,
  'backup_local_path' as cle_parametre,
  '/backups/pharmasoft' as valeur_parametre,
  'text' as type_parametre,
  'backup' as categorie,
  'Chemin local pour les sauvegardes' as description
FROM public.pharmacies
ON CONFLICT (tenant_id, cle_parametre) DO NOTHING;