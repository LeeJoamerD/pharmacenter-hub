-- Ajouter la colonne is_system manquante à workflow_settings
ALTER TABLE public.workflow_settings 
ADD COLUMN is_system boolean NOT NULL DEFAULT false;