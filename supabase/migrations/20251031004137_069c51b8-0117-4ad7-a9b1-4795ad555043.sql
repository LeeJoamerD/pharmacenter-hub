-- Corriger la contrainte trigger_type pour accepter les valeurs françaises

-- Étape 1 : Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.workflows 
DROP CONSTRAINT IF EXISTS workflows_trigger_type_check;

-- Étape 2 : Mettre à jour les valeurs existantes (anglais vers français)
UPDATE public.workflows 
SET trigger_type = CASE 
  WHEN trigger_type = 'manual' THEN 'Manuel'
  WHEN trigger_type = 'scheduled' THEN 'Planifié'
  WHEN trigger_type = 'event' THEN 'Événement'
  WHEN trigger_type = 'conditional' THEN 'Automatique'
  ELSE trigger_type
END;

-- Étape 3 : Créer la nouvelle contrainte CHECK conforme à la migration originale
ALTER TABLE public.workflows 
ADD CONSTRAINT workflows_trigger_type_check 
CHECK (trigger_type IN ('Manuel', 'Automatique', 'Planifié', 'Événement'));

-- Étape 4 : Mettre à jour le DEFAULT
ALTER TABLE public.workflows 
ALTER COLUMN trigger_type SET DEFAULT 'Manuel';