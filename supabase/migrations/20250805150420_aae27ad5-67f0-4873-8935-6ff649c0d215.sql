-- Supprimer la contrainte existante et en créer une nouvelle qui inclut 'workflow'
ALTER TABLE public.workflow_settings 
DROP CONSTRAINT IF EXISTS workflow_settings_setting_type_check;

-- Ajouter la nouvelle contrainte avec 'workflow' inclus
ALTER TABLE public.workflow_settings 
ADD CONSTRAINT workflow_settings_setting_type_check 
CHECK (setting_type IN ('general', 'security', 'notification', 'automation', 'workflow'));