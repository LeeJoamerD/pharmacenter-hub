-- Fix alertes_peremption table structure to match original migrations
-- This corrects column names and types to align with the trigger expectations

-- Step 1: Add date_alerte column if it doesn't exist
ALTER TABLE public.alertes_peremption 
ADD COLUMN IF NOT EXISTS date_alerte TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Step 2: Update date_alerte with created_at for existing records
UPDATE public.alertes_peremption 
SET date_alerte = created_at 
WHERE date_alerte IS NULL;

-- Step 3: Rename date_expiration to date_peremption
ALTER TABLE public.alertes_peremption 
RENAME COLUMN date_expiration TO date_peremption;

-- Step 4: Create temporary column for actions_recommandees as array
ALTER TABLE public.alertes_peremption 
ADD COLUMN IF NOT EXISTS actions_recommandees TEXT[];

-- Step 5: Migrate data from action_recommandee to actions_recommandees
UPDATE public.alertes_peremption 
SET actions_recommandees = ARRAY[action_recommandee]
WHERE action_recommandee IS NOT NULL;

-- Step 6: Drop old action_recommandee column
ALTER TABLE public.alertes_peremption 
DROP COLUMN IF EXISTS action_recommandee;

-- Step 7: Update indexes - drop old ones
DROP INDEX IF EXISTS public.idx_alertes_peremption_date_expiration;
DROP INDEX IF EXISTS public.idx_alertes_peremption_tenant_date_expiration;

-- Step 8: Create new indexes with correct column name
CREATE INDEX IF NOT EXISTS idx_alertes_peremption_date_peremption 
ON public.alertes_peremption(date_peremption);

CREATE INDEX IF NOT EXISTS idx_alertes_peremption_tenant_date_peremption 
ON public.alertes_peremption(tenant_id, date_peremption);

CREATE INDEX IF NOT EXISTS idx_alertes_peremption_date_alerte 
ON public.alertes_peremption(date_alerte DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.alertes_peremption.date_peremption IS 
'Date de péremption du lot concerné par l''alerte';

COMMENT ON COLUMN public.alertes_peremption.date_alerte IS 
'Date de création de l''alerte';

COMMENT ON COLUMN public.alertes_peremption.actions_recommandees IS 
'Liste des actions recommandées pour traiter l''alerte';