-- Fix alertes_peremption table structure to match backup

-- Step 1: Drop date_peremption column (should not exist)
ALTER TABLE public.alertes_peremption 
  DROP COLUMN IF EXISTS date_peremption;

-- Step 2: Rename traitee_par to traite_par_id
ALTER TABLE public.alertes_peremption 
  RENAME COLUMN traitee_par TO traite_par_id;

-- Step 3: Change quantite_concernee from NUMERIC to INTEGER
ALTER TABLE public.alertes_peremption 
  ALTER COLUMN quantite_concernee TYPE INTEGER USING quantite_concernee::INTEGER;

-- Step 4: Add default values
ALTER TABLE public.alertes_peremption 
  ALTER COLUMN niveau_urgence SET DEFAULT 'moyen';

ALTER TABLE public.alertes_peremption 
  ALTER COLUMN statut SET DEFAULT 'active';

-- Step 5: Add foreign key constraint for traite_par_id
ALTER TABLE public.alertes_peremption 
  DROP CONSTRAINT IF EXISTS alertes_peremption_traite_par_id_fkey;

ALTER TABLE public.alertes_peremption 
  ADD CONSTRAINT alertes_peremption_traite_par_id_fkey 
  FOREIGN KEY (traite_par_id) REFERENCES public.personnel(id);

-- Step 6: Ensure CHECK constraints match backup
ALTER TABLE public.alertes_peremption 
  DROP CONSTRAINT IF EXISTS alertes_peremption_type_alerte_check;

ALTER TABLE public.alertes_peremption 
  ADD CONSTRAINT alertes_peremption_type_alerte_check 
  CHECK (type_alerte IN ('peremption_proche', 'expire', 'critique'));

ALTER TABLE public.alertes_peremption 
  DROP CONSTRAINT IF EXISTS alertes_peremption_niveau_urgence_check;

ALTER TABLE public.alertes_peremption 
  ADD CONSTRAINT alertes_peremption_niveau_urgence_check 
  CHECK (niveau_urgence IN ('faible', 'moyen', 'eleve', 'critique'));

ALTER TABLE public.alertes_peremption 
  DROP CONSTRAINT IF EXISTS alertes_peremption_statut_check;

ALTER TABLE public.alertes_peremption 
  ADD CONSTRAINT alertes_peremption_statut_check 
  CHECK (statut IN ('active', 'traitee', 'ignoree'));