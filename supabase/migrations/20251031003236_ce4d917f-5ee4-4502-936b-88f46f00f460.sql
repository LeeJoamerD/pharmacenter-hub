-- ============================================
-- CORRECTION TABLE WORKFLOWS
-- ============================================

-- 1. Renommer les colonnes
ALTER TABLE public.workflows 
RENAME COLUMN configuration TO trigger_config;

ALTER TABLE public.workflows 
RENAME COLUMN last_executed_at TO last_executed;

-- 2. Convertir priority de INTEGER vers TEXT
-- D'abord créer une nouvelle colonne temporaire
ALTER TABLE public.workflows 
ADD COLUMN priority_temp TEXT;

-- Mapper les valeurs INTEGER vers TEXT
UPDATE public.workflows 
SET priority_temp = CASE 
  WHEN priority = 0 THEN 'Basse'
  WHEN priority = 1 THEN 'Normale'
  WHEN priority = 2 THEN 'Haute'
  ELSE 'Normale'
END;

-- Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE public.workflows 
DROP COLUMN priority;

ALTER TABLE public.workflows 
RENAME COLUMN priority_temp TO priority;

-- Ajouter le DEFAULT et le CHECK constraint
ALTER TABLE public.workflows 
ALTER COLUMN priority SET DEFAULT 'Normale';

ALTER TABLE public.workflows 
ADD CONSTRAINT workflows_priority_check 
CHECK (priority IN ('Haute', 'Normale', 'Basse'));

-- 3. Corriger la colonne status
-- Supprimer l'ancien constraint
ALTER TABLE public.workflows 
DROP CONSTRAINT IF EXISTS workflows_status_check;

-- Mettre à jour les valeurs existantes
UPDATE public.workflows 
SET status = CASE 
  WHEN status = 'draft' THEN 'Brouillon'
  WHEN status = 'active' THEN 'Actif'
  WHEN status = 'inactive' THEN 'Inactif'
  WHEN status = 'archived' THEN 'Archivé'
  ELSE 'Brouillon'
END;

-- Ajouter le nouveau constraint et DEFAULT
ALTER TABLE public.workflows 
ALTER COLUMN status SET DEFAULT 'Brouillon';

ALTER TABLE public.workflows 
ADD CONSTRAINT workflows_status_check 
CHECK (status IN ('Brouillon', 'Actif', 'Inactif', 'Archivé'));

-- ============================================
-- CORRECTION TABLE WORKFLOW_TEMPLATES
-- ============================================

-- 1. Renommer la colonne configuration
ALTER TABLE public.workflow_templates 
RENAME COLUMN configuration TO template_data;

-- 2. Ajouter le DEFAULT à category
ALTER TABLE public.workflow_templates 
ALTER COLUMN category SET DEFAULT 'Général';