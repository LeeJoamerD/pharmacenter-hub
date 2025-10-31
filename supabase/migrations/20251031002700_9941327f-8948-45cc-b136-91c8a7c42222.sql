-- ============================================
-- Ajouter les colonnes manquantes à workflows
-- ============================================

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS actual_duration INTEGER;

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS completion_rate NUMERIC(5,2) DEFAULT 0.00;

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- ============================================
-- Ajouter la colonne manquante à workflow_templates
-- ============================================

ALTER TABLE public.workflow_templates 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================
-- Créer les index pour les performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workflows_assigned_to 
ON public.workflows(assigned_to);

CREATE INDEX IF NOT EXISTS idx_workflows_deadline 
ON public.workflows(deadline);

CREATE INDEX IF NOT EXISTS idx_workflows_completion_rate 
ON public.workflows(completion_rate);