-- Fix parametres_expiration table structure to match backup
-- This aligns the column names and structure with the functional backup

-- Step 1: Rename columns to match backup
ALTER TABLE public.parametres_expiration 
  RENAME COLUMN famille_produit_id TO famille_id;

ALTER TABLE public.parametres_expiration 
  RENAME COLUMN jours_alerte TO delai_alerte_jours;

ALTER TABLE public.parametres_expiration 
  RENAME COLUMN jours_critique TO delai_critique_jours;

ALTER TABLE public.parametres_expiration 
  RENAME COLUMN jours_blocage TO delai_bloquant_jours;

-- Step 2: Add missing columns with defaults
ALTER TABLE public.parametres_expiration 
  ADD COLUMN IF NOT EXISTS action_auto_alerte BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS action_auto_blocage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS type_parametre TEXT DEFAULT 'famille',
  ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_dashboard BOOLEAN DEFAULT true;

-- Add constraint on type_parametre
ALTER TABLE public.parametres_expiration 
  ADD CONSTRAINT check_type_parametre 
  CHECK (type_parametre IN ('famille', 'produit', 'global'));

-- Step 3: Drop obsolete columns
ALTER TABLE public.parametres_expiration 
  DROP COLUMN IF EXISTS action_automatique,
  DROP COLUMN IF EXISTS priorite;

-- Step 4: Recreate indexes with correct column names
DROP INDEX IF EXISTS idx_parametres_expiration_famille_produit_id;

CREATE INDEX IF NOT EXISTS idx_parametres_expiration_famille_id 
  ON public.parametres_expiration(famille_id);

CREATE INDEX IF NOT EXISTS idx_parametres_expiration_produit_id 
  ON public.parametres_expiration(produit_id);

CREATE INDEX IF NOT EXISTS idx_parametres_expiration_tenant_id 
  ON public.parametres_expiration(tenant_id);