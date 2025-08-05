-- Créer les tables pour le système de workflows

-- Table des workflows principaux
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Brouillon' CHECK (status IN ('Brouillon', 'Actif', 'Inactif', 'Archivé')),
  priority TEXT NOT NULL DEFAULT 'Normale' CHECK (priority IN ('Haute', 'Normale', 'Basse')),
  trigger_type TEXT NOT NULL DEFAULT 'Manuel' CHECK (trigger_type IN ('Manuel', 'Automatique', 'Planifié', 'Événement')),
  trigger_config JSONB DEFAULT '{}',
  created_by UUID,
  assigned_to UUID,
  category TEXT DEFAULT 'Général',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  deadline TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- en minutes
  actual_duration INTEGER, -- en minutes
  completion_rate NUMERIC(5,2) DEFAULT 0.00,
  last_executed TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des modèles de workflows
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Général',
  template_data JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des exécutions de workflows (historique)
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  executor_id UUID,
  status TEXT NOT NULL DEFAULT 'En cours' CHECK (status IN ('En cours', 'Terminé', 'Échec', 'Annulé', 'En pause')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  progress_percentage NUMERIC(5,2) DEFAULT 0.00,
  logs JSONB DEFAULT '[]',
  error_message TEXT,
  result_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des paramètres de workflows
CREATE TABLE public.workflow_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  setting_type TEXT NOT NULL DEFAULT 'general' CHECK (setting_type IN ('general', 'notification', 'execution', 'security')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, setting_key)
);

-- Table des déclencheurs de workflows
CREATE TABLE public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'event', 'condition', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des actions de workflows
CREATE TABLE public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  action_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'email', 'task', 'api_call', 'data_update')),
  action_config JSONB NOT NULL DEFAULT '{}',
  execution_order INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour workflows
CREATE POLICY "Users can view workflows from their tenant" ON public.workflows
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflows in their tenant" ON public.workflows
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflows from their tenant" ON public.workflows
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflows from their tenant" ON public.workflows
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour workflow_templates
CREATE POLICY "Users can view workflow templates from their tenant" ON public.workflow_templates
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow templates in their tenant" ON public.workflow_templates
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow templates from their tenant" ON public.workflow_templates
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow templates from their tenant" ON public.workflow_templates
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour workflow_executions
CREATE POLICY "Users can view workflow executions from their tenant" ON public.workflow_executions
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow executions in their tenant" ON public.workflow_executions
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow executions from their tenant" ON public.workflow_executions
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow executions from their tenant" ON public.workflow_executions
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour workflow_settings
CREATE POLICY "Users can view workflow settings from their tenant" ON public.workflow_settings
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage workflow settings in their tenant" ON public.workflow_settings
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM personnel 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('Admin', 'Pharmacien')
    )
  );

-- Politiques RLS pour workflow_triggers
CREATE POLICY "Users can view workflow triggers from their tenant" ON public.workflow_triggers
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow triggers in their tenant" ON public.workflow_triggers
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow triggers from their tenant" ON public.workflow_triggers
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow triggers from their tenant" ON public.workflow_triggers
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Politiques RLS pour workflow_actions
CREATE POLICY "Users can view workflow actions from their tenant" ON public.workflow_actions
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow actions in their tenant" ON public.workflow_actions
  FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow actions from their tenant" ON public.workflow_actions
  FOR UPDATE USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow actions from their tenant" ON public.workflow_actions
  FOR DELETE USING (tenant_id = get_current_user_tenant_id());

-- Créer des index pour les performances
CREATE INDEX idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflows_created_by ON public.workflows(created_by);
CREATE INDEX idx_workflow_templates_tenant_id ON public.workflow_templates(tenant_id);
CREATE INDEX idx_workflow_executions_tenant_id ON public.workflow_executions(tenant_id);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_settings_tenant_id ON public.workflow_settings(tenant_id);
CREATE INDEX idx_workflow_triggers_tenant_id ON public.workflow_triggers(tenant_id);
CREATE INDEX idx_workflow_triggers_workflow_id ON public.workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_actions_tenant_id ON public.workflow_actions(tenant_id);
CREATE INDEX idx_workflow_actions_workflow_id ON public.workflow_actions(workflow_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_settings_updated_at
  BEFORE UPDATE ON public.workflow_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_triggers_updated_at
  BEFORE UPDATE ON public.workflow_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_actions_updated_at
  BEFORE UPDATE ON public.workflow_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer quelques paramètres par défaut
INSERT INTO public.workflow_settings (tenant_id, setting_key, setting_value, setting_type, description) VALUES
  ('00000000-0000-0000-0000-000000000000', 'max_concurrent_executions', '10', 'execution', 'Nombre maximum d''exécutions simultanées'),
  ('00000000-0000-0000-0000-000000000000', 'default_timeout_minutes', '60', 'execution', 'Timeout par défaut en minutes'),
  ('00000000-0000-0000-0000-000000000000', 'enable_notifications', 'true', 'notification', 'Activer les notifications'),
  ('00000000-0000-0000-0000-000000000000', 'retention_days', '90', 'general', 'Durée de rétention des exécutions en jours');