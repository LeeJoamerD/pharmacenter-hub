-- PHASE 1: Ajouter la colonne is_active à la table assureurs
-- Cette colonne est nécessaire pour filtrer les assureurs actifs dans le module POS

ALTER TABLE public.assureurs 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Mettre à jour les enregistrements existants pour qu'ils soient actifs par défaut
UPDATE public.assureurs 
SET is_active = true 
WHERE is_active IS NULL;

-- Créer un index pour optimiser les requêtes de filtrage par tenant et statut actif
CREATE INDEX IF NOT EXISTS idx_assureurs_tenant_active 
ON public.assureurs(tenant_id, is_active) 
WHERE is_active = true;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.assureurs.is_active IS 'Indique si l''assureur est actuellement actif et disponible pour utilisation';