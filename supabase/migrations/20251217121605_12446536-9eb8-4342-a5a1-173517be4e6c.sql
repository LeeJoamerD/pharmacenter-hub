-- Fix conflicting check constraints on ecritures_comptables.statut

ALTER TABLE public.ecritures_comptables
  DROP CONSTRAINT IF EXISTS check_ecriture_statut;

ALTER TABLE public.ecritures_comptables
  DROP CONSTRAINT IF EXISTS ecritures_comptables_statut_check;

-- Recreate a single unified constraint
ALTER TABLE public.ecritures_comptables
  ADD CONSTRAINT ecritures_comptables_statut_check
  CHECK (statut IS NULL OR statut = ANY (ARRAY['Brouillon','Validé','Validée','Verrouillé','Lettrée']));
