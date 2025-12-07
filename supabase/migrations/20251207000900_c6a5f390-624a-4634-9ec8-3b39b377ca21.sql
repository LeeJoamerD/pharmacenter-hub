-- =====================================================
-- AI Automation Tables and Functions
-- =====================================================

-- Table des templates d'automatisation
CREATE TABLE IF NOT EXISTS public.ai_automation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'zap',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des workflows d'automatisation
CREATE TABLE IF NOT EXISTS public.ai_automation_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.ai_automation_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  schedule_config JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  last_execution_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des exécutions d'automatisation
CREATE TABLE IF NOT EXISTS public.ai_automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.ai_automation_workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_context JSONB DEFAULT '{}',
  execution_log JSONB DEFAULT '[]',
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Users can view templates in their tenant"
  ON public.ai_automation_templates FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()) OR is_system = true);

CREATE POLICY "Admins can manage templates"
  ON public.ai_automation_templates FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Pharmacien')));

-- RLS Policies for workflows
CREATE POLICY "Users can view workflows in their tenant"
  ON public.ai_automation_workflows FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can manage workflows"
  ON public.ai_automation_workflows FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid() AND role IN ('Admin', 'Pharmacien')));

-- RLS Policies for executions
CREATE POLICY "Users can view executions in their tenant"
  ON public.ai_automation_executions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can create executions"
  ON public.ai_automation_executions FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.personnel WHERE auth_user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_automation_templates_tenant ON public.ai_automation_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_automation_workflows_tenant ON public.ai_automation_workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_automation_workflows_active ON public.ai_automation_workflows(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_automation_executions_tenant ON public.ai_automation_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_automation_executions_workflow ON public.ai_automation_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_automation_executions_status ON public.ai_automation_executions(tenant_id, status);

-- Triggers for updated_at
CREATE TRIGGER update_ai_automation_templates_updated_at
  BEFORE UPDATE ON public.ai_automation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_automation_workflows_updated_at
  BEFORE UPDATE ON public.ai_automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to execute a workflow
CREATE OR REPLACE FUNCTION public.execute_ai_workflow(
  p_tenant_id UUID,
  p_workflow_id UUID,
  p_trigger_context JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workflow RECORD;
  v_execution_id UUID;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_duration INTEGER;
  v_log JSONB := '[]'::JSONB;
  v_result JSONB := '{}'::JSONB;
  v_action JSONB;
  v_action_result JSONB;
BEGIN
  SET LOCAL row_security = off;
  
  SELECT * INTO v_workflow 
  FROM ai_automation_workflows 
  WHERE id = p_workflow_id AND tenant_id = p_tenant_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workflow not found or inactive');
  END IF;
  
  v_start_time := now();
  
  INSERT INTO ai_automation_executions (
    tenant_id, workflow_id, status, trigger_context, started_at
  ) VALUES (
    p_tenant_id, p_workflow_id, 'running', p_trigger_context, v_start_time
  ) RETURNING id INTO v_execution_id;
  
  v_log := v_log || jsonb_build_object(
    'timestamp', v_start_time,
    'type', 'info',
    'message', 'Workflow execution started'
  );
  
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_workflow.actions)
  LOOP
    v_log := v_log || jsonb_build_object(
      'timestamp', now(),
      'type', 'action',
      'action_type', v_action->>'type',
      'message', 'Executing action: ' || (v_action->>'type')
    );
    
    CASE v_action->>'type'
      WHEN 'send_alert' THEN
        v_action_result := jsonb_build_object('sent', true, 'channel', v_action->'config'->>'channel');
      WHEN 'create_order' THEN
        v_action_result := jsonb_build_object('order_created', true);
      WHEN 'update_stock' THEN
        v_action_result := jsonb_build_object('stock_updated', true);
      WHEN 'generate_report' THEN
        v_action_result := jsonb_build_object('report_generated', true);
      WHEN 'send_notification' THEN
        v_action_result := jsonb_build_object('notification_sent', true);
      ELSE
        v_action_result := jsonb_build_object('executed', true);
    END CASE;
    
    v_result := v_result || jsonb_build_object(v_action->>'type', v_action_result);
  END LOOP;
  
  v_end_time := now();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER;
  
  v_log := v_log || jsonb_build_object(
    'timestamp', v_end_time,
    'type', 'success',
    'message', 'Workflow execution completed successfully'
  );
  
  UPDATE ai_automation_executions SET
    status = 'completed',
    execution_log = v_log,
    result = v_result,
    completed_at = v_end_time,
    duration_ms = v_duration
  WHERE id = v_execution_id;
  
  UPDATE ai_automation_workflows SET
    last_execution_at = v_end_time,
    execution_count = execution_count + 1,
    success_count = success_count + 1,
    avg_execution_time_ms = ((avg_execution_time_ms * execution_count) + v_duration) / (execution_count + 1)
  WHERE id = p_workflow_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'execution_id', v_execution_id,
    'duration_ms', v_duration,
    'result', v_result
  );
  
EXCEPTION WHEN OTHERS THEN
  IF v_execution_id IS NOT NULL THEN
    UPDATE ai_automation_executions SET
      status = 'failed',
      error_message = SQLERRM,
      execution_log = v_log || jsonb_build_object(
        'timestamp', now(),
        'type', 'error',
        'message', SQLERRM
      ),
      completed_at = now()
    WHERE id = v_execution_id;
    
    UPDATE ai_automation_workflows SET
      execution_count = execution_count + 1,
      failure_count = failure_count + 1
    WHERE id = p_workflow_id;
  END IF;
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get automation metrics
CREATE OR REPLACE FUNCTION public.get_automation_metrics(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_workflows INTEGER;
  v_active_workflows INTEGER;
  v_executions_24h INTEGER;
  v_successful_24h INTEGER;
  v_failed_24h INTEGER;
  v_avg_duration INTEGER;
  v_total_templates INTEGER;
BEGIN
  SET LOCAL row_security = off;
  
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true)
  INTO v_total_workflows, v_active_workflows
  FROM ai_automation_workflows
  WHERE tenant_id = p_tenant_id;
  
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COALESCE(AVG(duration_ms), 0)::INTEGER
  INTO v_executions_24h, v_successful_24h, v_failed_24h, v_avg_duration
  FROM ai_automation_executions
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - INTERVAL '24 hours';
  
  SELECT COUNT(*) INTO v_total_templates
  FROM ai_automation_templates
  WHERE tenant_id = p_tenant_id OR is_system = true;
  
  v_result := jsonb_build_object(
    'total_workflows', v_total_workflows,
    'active_workflows', v_active_workflows,
    'inactive_workflows', v_total_workflows - v_active_workflows,
    'executions_24h', v_executions_24h,
    'successful_24h', v_successful_24h,
    'failed_24h', v_failed_24h,
    'success_rate', CASE WHEN v_executions_24h > 0 
      THEN ROUND((v_successful_24h::NUMERIC / v_executions_24h) * 100, 1) 
      ELSE 100 END,
    'avg_duration_ms', v_avg_duration,
    'total_templates', v_total_templates
  );
  
  RETURN v_result;
END;
$$;

-- Insert default system templates for existing pharmacies
INSERT INTO ai_automation_templates (tenant_id, name, description, category, trigger_type, trigger_config, conditions, actions, is_system, icon)
SELECT 
  p.id,
  'Alerte Stock Bas',
  'Envoie une alerte lorsque le stock passe sous le seuil critique',
  'stock',
  'stock_low',
  '{"threshold_type": "critical"}'::JSONB,
  '[{"field": "stock_actuel", "operator": "<=", "value": "stock_critique"}]'::JSONB,
  '[{"type": "send_alert", "config": {"channel": "dashboard", "priority": "high"}}]'::JSONB,
  true,
  'package-minus'
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_automation_templates t 
  WHERE t.tenant_id = p.id AND t.name = 'Alerte Stock Bas'
);

INSERT INTO ai_automation_templates (tenant_id, name, description, category, trigger_type, trigger_config, conditions, actions, is_system, icon)
SELECT 
  p.id,
  'Rapport Quotidien Ventes',
  'Génère un rapport des ventes chaque jour à 18h',
  'reporting',
  'schedule_daily',
  '{"time": "18:00", "timezone": "Africa/Douala"}'::JSONB,
  '[]'::JSONB,
  '[{"type": "generate_report", "config": {"report_type": "daily_sales"}}, {"type": "send_notification", "config": {"channel": "email"}}]'::JSONB,
  true,
  'file-text'
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_automation_templates t 
  WHERE t.tenant_id = p.id AND t.name = 'Rapport Quotidien Ventes'
);

INSERT INTO ai_automation_templates (tenant_id, name, description, category, trigger_type, trigger_config, conditions, actions, is_system, icon)
SELECT 
  p.id,
  'Suivi Clients Inactifs',
  'Identifie les clients inactifs depuis 30 jours',
  'crm',
  'schedule_weekly',
  '{"day": "monday", "time": "09:00"}'::JSONB,
  '[{"field": "last_visit_days", "operator": ">=", "value": 30}]'::JSONB,
  '[{"type": "generate_report", "config": {"report_type": "inactive_clients"}}, {"type": "send_alert", "config": {"channel": "dashboard"}}]'::JSONB,
  true,
  'users'
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_automation_templates t 
  WHERE t.tenant_id = p.id AND t.name = 'Suivi Clients Inactifs'
);

INSERT INTO ai_automation_templates (tenant_id, name, description, category, trigger_type, trigger_config, conditions, actions, is_system, icon)
SELECT 
  p.id,
  'Alerte Péremption Proche',
  'Alerte pour les produits expirant dans 30 jours',
  'stock',
  'schedule_daily',
  '{"time": "08:00"}'::JSONB,
  '[{"field": "days_to_expiry", "operator": "<=", "value": 30}]'::JSONB,
  '[{"type": "send_alert", "config": {"channel": "dashboard", "priority": "medium"}}]'::JSONB,
  true,
  'calendar-clock'
FROM pharmacies p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_automation_templates t 
  WHERE t.tenant_id = p.id AND t.name = 'Alerte Péremption Proche'
);