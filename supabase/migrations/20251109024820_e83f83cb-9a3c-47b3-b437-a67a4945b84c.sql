-- Migration: Ajouter valide_par_id pour tracer la validation des commandes et réceptions

-- Ajouter valide_par_id à commandes_fournisseurs
ALTER TABLE public.commandes_fournisseurs 
ADD COLUMN IF NOT EXISTS valide_par_id uuid REFERENCES public.personnel(id);

-- Ajouter valide_par_id à receptions_fournisseurs
ALTER TABLE public.receptions_fournisseurs 
ADD COLUMN IF NOT EXISTS valide_par_id uuid REFERENCES public.personnel(id);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseurs_valide_par 
ON public.commandes_fournisseurs(valide_par_id);

CREATE INDEX IF NOT EXISTS idx_receptions_fournisseurs_valide_par 
ON public.receptions_fournisseurs(valide_par_id);

-- Commentaires pour documentation
COMMENT ON COLUMN public.commandes_fournisseurs.valide_par_id 
IS 'ID du personnel ayant validé la commande';

COMMENT ON COLUMN public.receptions_fournisseurs.valide_par_id 
IS 'ID du personnel ayant validé la réception';