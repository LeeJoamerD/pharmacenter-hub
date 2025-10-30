-- =====================================================
-- MIGRATION COMPLÈTE: MODULE WORKFLOWS
-- Restauration de toutes les tables, RLS, indexes et triggers
-- avec corrections des problèmes identifiés
-- =====================================================

-- =====================================================
-- ÉTAPE 1: CRÉATION DES TABLES
-- =====================================================

-- Table workflows
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'event', 'conditional')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_executed_at TIMESTAMP WITH TIME ZONE
);

-- Table workflow_templates
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table workflow_executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table workflow_settings (AVEC CORRECTIONS)
CREATE TABLE IF NOT EXISTS public.workflow_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',  -- ✅ CORRECTION: TEXT au lieu de JSONB
  setting_type TEXT NOT NULL DEFAULT 'general' 
    CHECK (setting_type IN ('general', 'security', 'notification', 'automation', 'workflow', 'execution')),  -- ✅ CORRECTION: Valeurs complètes
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,  -- ✅ AJOUT: Colonne is_system
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, setting_key)
);

-- Table workflow_triggers
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'webhook', 'manual')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table workflow_actions
CREATE TABLE IF NOT EXISTS public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'email', 'api_call', 'data_update', 'script')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ÉTAPE 2: ACTIVATION RLS
-- =====================================================

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 3: CRÉATION DES RLS POLICIES
-- =====================================================

-- Policies pour workflows
CREATE POLICY "Users can view workflows from their tenant" 
ON public.workflows FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflows in their tenant" 
ON public.workflows FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflows from their tenant" 
ON public.workflows FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflows from their tenant" 
ON public.workflows FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Policies pour workflow_templates
CREATE POLICY "Users can view workflow templates from their tenant" 
ON public.workflow_templates FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow templates in their tenant" 
ON public.workflow_templates FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow templates from their tenant" 
ON public.workflow_templates FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow templates from their tenant" 
ON public.workflow_templates FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Policies pour workflow_executions
CREATE POLICY "Users can view workflow executions from their tenant" 
ON public.workflow_executions FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow executions in their tenant" 
ON public.workflow_executions FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow executions from their tenant" 
ON public.workflow_executions FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow executions from their tenant" 
ON public.workflow_executions FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Policies pour workflow_settings (AVEC RESTRICTIONS)
CREATE POLICY "Users can view workflow settings from their tenant" 
ON public.workflow_settings FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage workflow settings in their tenant" 
ON public.workflow_settings FOR ALL 
USING (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND tenant_id = get_current_user_tenant_id()
    AND role IN ('Admin', 'Pharmacien')
  )
);

-- Policies pour workflow_triggers
CREATE POLICY "Users can view workflow triggers from their tenant" 
ON public.workflow_triggers FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow triggers in their tenant" 
ON public.workflow_triggers FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow triggers from their tenant" 
ON public.workflow_triggers FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow triggers from their tenant" 
ON public.workflow_triggers FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- Policies pour workflow_actions
CREATE POLICY "Users can view workflow actions from their tenant" 
ON public.workflow_actions FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can insert workflow actions in their tenant" 
ON public.workflow_actions FOR INSERT 
WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update workflow actions from their tenant" 
ON public.workflow_actions FOR UPDATE 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can delete workflow actions from their tenant" 
ON public.workflow_actions FOR DELETE 
USING (tenant_id = get_current_user_tenant_id());

-- =====================================================
-- ÉTAPE 4: CRÉATION DES INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON public.workflows(created_by);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_tenant_id ON public.workflow_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_id ON public.workflow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_settings_tenant_id ON public.workflow_settings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_tenant_id ON public.workflow_triggers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow_id ON public.workflow_triggers(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_tenant_id ON public.workflow_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow_id ON public.workflow_actions(workflow_id);

-- =====================================================
-- ÉTAPE 5: CRÉATION DES TRIGGERS
-- =====================================================

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

-- =====================================================
-- ÉTAPE 6: INSERTION DES PARAMÈTRES PAR DÉFAUT
-- =====================================================

-- Paramètre: max_concurrent_executions
INSERT INTO public.workflow_settings (tenant_id, setting_key, setting_value, setting_type, description, is_system)
SELECT 
  DISTINCT tenant_id,
  'max_concurrent_executions',
  '10',
  'execution',
  'Nombre maximum d''exécutions simultanées',
  true
FROM public.personnel
WHERE tenant_id IS NOT NULL
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- Paramètre: default_timeout_minutes
INSERT INTO public.workflow_settings (tenant_id, setting_key, setting_value, setting_type, description, is_system)
SELECT 
  DISTINCT tenant_id,
  'default_timeout_minutes',
  '60',
  'execution',
  'Timeout par défaut en minutes',
  true
FROM public.personnel
WHERE tenant_id IS NOT NULL
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- Paramètre: enable_notifications
INSERT INTO public.workflow_settings (tenant_id, setting_key, setting_value, setting_type, description, is_system)
SELECT 
  DISTINCT tenant_id,
  'enable_notifications',
  'true',
  'notification',
  'Activer les notifications',
  true
FROM public.personnel
WHERE tenant_id IS NOT NULL
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- Paramètre: retention_days
INSERT INTO public.workflow_settings (tenant_id, setting_key, setting_value, setting_type, description, is_system)
SELECT 
  DISTINCT tenant_id,
  'retention_days',
  '90',
  'general',
  'Durée de rétention des exécutions en jours',
  true
FROM public.personnel
WHERE tenant_id IS NOT NULL
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Commentaires sur les tables pour documentation
COMMENT ON TABLE public.workflows IS 'Table principale des workflows - automatisations configurables';
COMMENT ON TABLE public.workflow_templates IS 'Modèles de workflows réutilisables';
COMMENT ON TABLE public.workflow_executions IS 'Historique des exécutions de workflows';
COMMENT ON TABLE public.workflow_settings IS 'Paramètres de configuration des workflows (setting_value en TEXT pour flexibilité)';
COMMENT ON TABLE public.workflow_triggers IS 'Déclencheurs des workflows (planifications, événements)';
COMMENT ON TABLE public.workflow_actions IS 'Actions à exécuter dans les workflows';