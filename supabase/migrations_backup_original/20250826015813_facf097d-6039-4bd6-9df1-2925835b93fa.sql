
-- Supprime la contrainte unique dupliquée pour éviter l'ambiguïté sur on_conflict
ALTER TABLE public.parametres_systeme
  DROP CONSTRAINT IF EXISTS unique_parametre_per_tenant;
