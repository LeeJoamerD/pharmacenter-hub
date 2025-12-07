import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface AutomationWorkflow {
  id: string;
  tenant_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  conditions: { field: string; operator: string; value: unknown }[];
  actions: { type: string; config: Record<string, unknown> }[];
  schedule_config: Record<string, unknown> | null;
  is_active: boolean;
  priority: number;
  last_execution_at: string | null;
  next_execution_at: string | null;
  execution_count: number;
  success_count: number;
  failure_count: number;
  avg_execution_time_ms: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  tenant_id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_context: Record<string, unknown>;
  execution_log: { timestamp: string; type: string; message: string }[];
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
  workflow?: AutomationWorkflow;
}

export interface AutomationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  conditions: unknown[];
  actions: unknown[];
  is_system: boolean;
  is_active: boolean;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationMetrics {
  total_workflows: number;
  active_workflows: number;
  inactive_workflows: number;
  executions_24h: number;
  successful_24h: number;
  failed_24h: number;
  success_rate: number;
  avg_duration_ms: number;
  total_templates: number;
}

export interface WorkflowFormData {
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  conditions: { field: string; operator: string; value: unknown }[];
  actions: { type: string; config: Record<string, unknown> }[];
  schedule_config?: Record<string, unknown>;
  priority: number;
  is_active: boolean;
}

const TRIGGER_TYPES = [
  { value: 'stock_low', label: 'Stock bas', icon: 'package-minus' },
  { value: 'stock_critical', label: 'Stock critique', icon: 'alert-triangle' },
  { value: 'expiration_near', label: 'Péremption proche', icon: 'calendar-clock' },
  { value: 'sale_completed', label: 'Vente effectuée', icon: 'shopping-cart' },
  { value: 'order_received', label: 'Commande reçue', icon: 'truck' },
  { value: 'schedule_daily', label: 'Quotidien', icon: 'clock' },
  { value: 'schedule_weekly', label: 'Hebdomadaire', icon: 'calendar' },
  { value: 'schedule_monthly', label: 'Mensuel', icon: 'calendar-days' },
  { value: 'manual', label: 'Manuel', icon: 'hand' },
];

const ACTION_TYPES = [
  { value: 'send_alert', label: 'Envoyer une alerte', icon: 'bell' },
  { value: 'send_notification', label: 'Envoyer une notification', icon: 'mail' },
  { value: 'generate_report', label: 'Générer un rapport', icon: 'file-text' },
  { value: 'create_order', label: 'Créer une commande', icon: 'shopping-bag' },
  { value: 'update_stock', label: 'Mettre à jour le stock', icon: 'package' },
  { value: 'send_email', label: 'Envoyer un email', icon: 'send' },
];

const CATEGORIES = ['stock', 'reporting', 'crm', 'orders', 'alerts', 'general'];

export function useAIAutomation() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetrics>({
    total_workflows: 0,
    active_workflows: 0,
    inactive_workflows: 0,
    executions_24h: 0,
    successful_24h: 0,
    failed_24h: 0,
    success_rate: 100,
    avg_duration_ms: 0,
    total_templates: 0
  });
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  });

  // Load workflows
  const loadWorkflows = useCallback(async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('ai_automation_workflows')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true });
      
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const transformedData: AutomationWorkflow[] = (data || []).map(item => ({
        ...item,
        trigger_config: typeof item.trigger_config === 'object' ? item.trigger_config as Record<string, unknown> : {},
        conditions: Array.isArray(item.conditions) ? item.conditions as { field: string; operator: string; value: unknown }[] : [],
        actions: Array.isArray(item.actions) ? item.actions as { type: string; config: Record<string, unknown> }[] : [],
        schedule_config: item.schedule_config ? item.schedule_config as Record<string, unknown> : null
      }));
      
      setWorkflows(transformedData);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Erreur lors du chargement des workflows');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  // Load executions
  const loadExecutions = useCallback(async (limit = 50) => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_automation_executions')
        .select('*, workflow:ai_automation_workflows(*)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      const transformedData: AutomationExecution[] = (data || []).map(item => ({
        id: item.id,
        tenant_id: item.tenant_id,
        workflow_id: item.workflow_id,
        status: item.status as AutomationExecution['status'],
        trigger_context: (typeof item.trigger_context === 'object' && !Array.isArray(item.trigger_context) ? item.trigger_context : {}) as Record<string, unknown>,
        execution_log: Array.isArray(item.execution_log) ? item.execution_log as AutomationExecution['execution_log'] : [],
        result: (item.result && typeof item.result === 'object' && !Array.isArray(item.result) ? item.result : null) as Record<string, unknown> | null,
        error_message: item.error_message,
        started_at: item.started_at,
        completed_at: item.completed_at,
        duration_ms: item.duration_ms,
        created_at: item.created_at,
        workflow: item.workflow ? {
          id: item.workflow.id,
          tenant_id: item.workflow.tenant_id,
          template_id: item.workflow.template_id,
          name: item.workflow.name,
          description: item.workflow.description,
          category: item.workflow.category,
          trigger_type: item.workflow.trigger_type,
          trigger_config: (typeof item.workflow.trigger_config === 'object' && !Array.isArray(item.workflow.trigger_config) ? item.workflow.trigger_config : {}) as Record<string, unknown>,
          conditions: Array.isArray(item.workflow.conditions) ? item.workflow.conditions as { field: string; operator: string; value: unknown }[] : [],
          actions: Array.isArray(item.workflow.actions) ? item.workflow.actions as { type: string; config: Record<string, unknown> }[] : [],
          schedule_config: (item.workflow.schedule_config && typeof item.workflow.schedule_config === 'object' && !Array.isArray(item.workflow.schedule_config) ? item.workflow.schedule_config : null) as Record<string, unknown> | null,
          is_active: item.workflow.is_active,
          priority: item.workflow.priority,
          last_execution_at: item.workflow.last_execution_at,
          next_execution_at: item.workflow.next_execution_at,
          execution_count: item.workflow.execution_count,
          success_count: item.workflow.success_count,
          failure_count: item.workflow.failure_count,
          avg_execution_time_ms: item.workflow.avg_execution_time_ms,
          created_by: item.workflow.created_by,
          created_at: item.workflow.created_at,
          updated_at: item.workflow.updated_at
        } as AutomationWorkflow : undefined
      }));
      
      setExecutions(transformedData);
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  }, [tenantId]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_automation_templates')
        .select('*')
        .or(`tenant_id.eq.${tenantId},is_system.eq.true`)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      const transformedData: AutomationTemplate[] = (data || []).map(item => ({
        ...item,
        trigger_config: typeof item.trigger_config === 'object' ? item.trigger_config as Record<string, unknown> : {},
        conditions: Array.isArray(item.conditions) ? item.conditions : [],
        actions: Array.isArray(item.actions) ? item.actions : []
      }));
      
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, [tenantId]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_automation_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      
      if (data && typeof data === 'object') {
        setMetrics(data as unknown as AutomationMetrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [tenantId]);

  // Create workflow
  const createWorkflow = useCallback(async (formData: WorkflowFormData): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      const { error } = await supabase
        .from('ai_automation_workflows')
        .insert({
          tenant_id: tenantId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          trigger_type: formData.trigger_type,
          trigger_config: formData.trigger_config as unknown as Record<string, never>,
          conditions: formData.conditions as unknown as Record<string, never>[],
          actions: formData.actions as unknown as Record<string, never>[],
          priority: formData.priority,
          is_active: formData.is_active
        });
      
      if (error) throw error;
      
      toast.success('Workflow créé avec succès');
      await Promise.all([loadWorkflows(), loadMetrics()]);
      return true;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Erreur lors de la création du workflow');
      return false;
    }
  }, [tenantId, loadWorkflows, loadMetrics]);

  // Update workflow
  const updateWorkflow = useCallback(async (id: string, formData: Partial<WorkflowFormData>): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      const updateData: Record<string, unknown> = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.category !== undefined) updateData.category = formData.category;
      if (formData.trigger_type !== undefined) updateData.trigger_type = formData.trigger_type;
      if (formData.trigger_config !== undefined) updateData.trigger_config = formData.trigger_config;
      if (formData.conditions !== undefined) updateData.conditions = formData.conditions;
      if (formData.actions !== undefined) updateData.actions = formData.actions;
      if (formData.priority !== undefined) updateData.priority = formData.priority;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
      
      const { error } = await supabase
        .from('ai_automation_workflows')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Workflow mis à jour');
      await Promise.all([loadWorkflows(), loadMetrics()]);
      return true;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [tenantId, loadWorkflows, loadMetrics]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      const { error } = await supabase
        .from('ai_automation_workflows')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success('Workflow supprimé');
      await Promise.all([loadWorkflows(), loadMetrics()]);
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [tenantId, loadWorkflows, loadMetrics]);

  // Toggle workflow status
  const toggleWorkflowStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      const { error } = await supabase
        .from('ai_automation_workflows')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      toast.success(isActive ? 'Workflow activé' : 'Workflow désactivé');
      await Promise.all([loadWorkflows(), loadMetrics()]);
      return true;
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Erreur lors de la modification');
      return false;
    }
  }, [tenantId, loadWorkflows, loadMetrics]);

  // Execute workflow
  const executeWorkflow = useCallback(async (workflowId: string, context: Record<string, unknown> = {}): Promise<boolean> => {
    if (!tenantId) return false;
    
    setExecuting(true);
    try {
      const { data, error } = await supabase.rpc('execute_ai_workflow', {
        p_tenant_id: tenantId,
        p_workflow_id: workflowId,
        p_trigger_context: context
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      
      if (result?.success) {
        toast.success('Workflow exécuté avec succès');
        await Promise.all([loadWorkflows(), loadExecutions(), loadMetrics()]);
        return true;
      } else {
        toast.error(result?.error || 'Erreur lors de l\'exécution');
        return false;
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast.error('Erreur lors de l\'exécution');
      return false;
    } finally {
      setExecuting(false);
    }
  }, [tenantId, loadWorkflows, loadExecutions, loadMetrics]);

  // Create workflow from template
  const createFromTemplate = useCallback(async (templateId: string, name: string): Promise<boolean> => {
    if (!tenantId) return false;
    
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        toast.error('Template non trouvé');
        return false;
      }
      
      const { error } = await supabase
        .from('ai_automation_workflows')
        .insert({
          tenant_id: tenantId,
          template_id: templateId,
          name: name || template.name,
          description: template.description,
          category: template.category,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config as unknown as Record<string, never>,
          conditions: template.conditions as unknown as Record<string, never>[],
          actions: template.actions as unknown as Record<string, never>[],
          is_active: true,
          priority: 5
        });
      
      if (error) throw error;
      
      toast.success('Workflow créé à partir du template');
      await Promise.all([loadWorkflows(), loadMetrics()]);
      return true;
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  }, [tenantId, templates, loadWorkflows, loadMetrics]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadWorkflows(),
      loadExecutions(),
      loadTemplates(),
      loadMetrics()
    ]);
  }, [loadWorkflows, loadExecutions, loadTemplates, loadMetrics]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      refreshData();
    }
  }, [tenantId, refreshData]);

  // Reload when filters change
  useEffect(() => {
    if (tenantId) {
      loadWorkflows();
    }
  }, [filters, tenantId, loadWorkflows]);

  return {
    // States
    loading,
    executing,
    
    // Data
    workflows,
    executions,
    templates,
    metrics,
    
    // Constants
    triggerTypes: TRIGGER_TYPES,
    actionTypes: ACTION_TYPES,
    categories: CATEGORIES,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    loadWorkflows,
    loadExecutions,
    loadTemplates,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    executeWorkflow,
    createFromTemplate,
    refreshData
  };
}
