-- Ajouter la nouvelle contrainte avec toutes les valeurs existantes et 'workflow'
ALTER TABLE public.workflow_settings 
ADD CONSTRAINT workflow_settings_setting_type_check 
CHECK (setting_type IN ('general', 'security', 'notification', 'automation', 'workflow', 'execution'));