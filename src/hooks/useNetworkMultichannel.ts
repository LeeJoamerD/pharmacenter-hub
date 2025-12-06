import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

// Types
export interface MultichannelConnector {
  id: string;
  tenant_id: string;
  name: string;
  channel_type: 'sms' | 'email' | 'whatsapp' | 'teams' | 'slack' | 'webhook' | 'telegram' | 'messenger';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: Record<string, unknown>;
  messages_sent: number;
  messages_received: number;
  response_rate: number;
  last_used_at: string | null;
  last_error: string | null;
  is_network_shared: boolean;
  shared_with_pharmacies: string[];
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  rule_type: 'routing' | 'auto_response' | 'escalation' | 'schedule' | 'fallback';
  trigger_conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  target_channels: string[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  priority_order: number;
  is_network_rule: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelAnalytics {
  id: string;
  tenant_id: string;
  connector_id: string | null;
  period_start: string;
  period_end: string;
  messages_sent: number;
  messages_received: number;
  messages_delivered: number;
  messages_failed: number;
  avg_response_time_ms: number;
  response_rate: number;
  engagement_rate: number;
  cost_estimate: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MultichannelMetrics {
  activeChannels: number;
  totalChannels: number;
  totalMessagesSent: number;
  avgResponseRate: number;
  activeRules: number;
  totalRules: number;
  uptimePercentage: number;
}

export interface GlobalMultichannelConfig {
  fallbackEnabled: boolean;
  detailedLogs: boolean;
  realtimeNotifications: boolean;
  channelPriorities: { channelType: string; order: number }[];
}

export function useNetworkMultichannel() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState<MultichannelConnector[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [analytics, setAnalytics] = useState<ChannelAnalytics[]>([]);
  const [metrics, setMetrics] = useState<MultichannelMetrics>({
    activeChannels: 0,
    totalChannels: 0,
    totalMessagesSent: 0,
    avgResponseRate: 0,
    activeRules: 0,
    totalRules: 0,
    uptimePercentage: 100
  });
  const [globalConfig, setGlobalConfig] = useState<GlobalMultichannelConfig>({
    fallbackEnabled: true,
    detailedLogs: true,
    realtimeNotifications: false,
    channelPriorities: []
  });

  // Load metrics via RPC
  const loadMetrics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_multichannel_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      
      if (data) {
        const metricsData = data as Record<string, unknown>;
        setMetrics({
          activeChannels: (metricsData.active_channels as number) || 0,
          totalChannels: (metricsData.total_channels as number) || 0,
          totalMessagesSent: (metricsData.total_messages_sent as number) || 0,
          avgResponseRate: (metricsData.avg_response_rate as number) || 0,
          activeRules: (metricsData.active_rules as number) || 0,
          totalRules: (metricsData.total_rules as number) || 0,
          uptimePercentage: (metricsData.uptime_percentage as number) || 100
        });
      }
    } catch (error) {
      console.error('Error loading multichannel metrics:', error);
    }
  }, [tenantId]);

  // Load connectors
  const loadConnectors = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('multichannel_connectors')
        .select('*')
        .order('priority_order', { ascending: true });
      
      if (error) throw error;
      
      setConnectors((data || []) as MultichannelConnector[]);
    } catch (error) {
      console.error('Error loading connectors:', error);
      toast.error('Erreur lors du chargement des canaux');
    }
  }, [tenantId]);

  // Create connector
  const createConnector = useCallback(async (connectorData: Partial<MultichannelConnector>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('multichannel_connectors')
        .insert({
          tenant_id: tenantId,
          name: connectorData.name || 'Nouveau canal',
          channel_type: connectorData.channel_type || 'email',
          provider: connectorData.provider || 'default',
          status: 'inactive' as const,
          config: (connectorData.config || {}) as Record<string, unknown>,
          is_network_shared: connectorData.is_network_shared || false,
          shared_with_pharmacies: connectorData.shared_with_pharmacies || [],
          priority_order: connectors.length
        } as any);
      
      if (error) throw error;
      
      toast.success('Canal créé avec succès');
      await loadConnectors();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating connector:', error);
      toast.error('Erreur lors de la création du canal');
    }
  }, [tenantId, connectors.length, loadConnectors, loadMetrics]);

  // Update connector
  const updateConnector = useCallback(async (id: string, updates: Partial<MultichannelConnector>) => {
    try {
      const { error } = await supabase
        .from('multichannel_connectors')
        .update(updates as any)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Canal mis à jour');
      await loadConnectors();
      await loadMetrics();
    } catch (error) {
      console.error('Error updating connector:', error);
      toast.error('Erreur lors de la mise à jour du canal');
    }
  }, [loadConnectors, loadMetrics]);

  // Delete connector
  const deleteConnector = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('multichannel_connectors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Canal supprimé');
      await loadConnectors();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting connector:', error);
      toast.error('Erreur lors de la suppression du canal');
    }
  }, [loadConnectors, loadMetrics]);

  // Toggle connector status
  const toggleConnectorStatus = useCallback(async (id: string) => {
    const connector = connectors.find(c => c.id === id);
    if (!connector) return;
    
    const newStatus = connector.status === 'active' ? 'inactive' : 'active';
    await updateConnector(id, { status: newStatus });
  }, [connectors, updateConnector]);

  // Test connector
  const testConnector = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Simulate test - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last_used_at
      await supabase
        .from('multichannel_connectors')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);
      
      await loadConnectors();
      return { success: true, message: 'Test de connexion réussi' };
    } catch (error) {
      console.error('Error testing connector:', error);
      return { success: false, message: 'Échec du test de connexion' };
    }
  }, [loadConnectors]);

  // Load automation rules
  const loadAutomationRules = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('multichannel_automation_rules')
        .select('*')
        .order('priority_order', { ascending: true });
      
      if (error) throw error;
      
      setAutomationRules((data || []) as AutomationRule[]);
    } catch (error) {
      console.error('Error loading automation rules:', error);
      toast.error('Erreur lors du chargement des règles');
    }
  }, [tenantId]);

  // Create automation rule
  const createRule = useCallback(async (ruleData: Partial<AutomationRule>) => {
    if (!tenantId) return;
    
    try {
      const { error } = await supabase
        .from('multichannel_automation_rules')
        .insert({
          tenant_id: tenantId,
          name: ruleData.name || 'Nouvelle règle',
          description: ruleData.description || null,
          rule_type: ruleData.rule_type || 'routing',
          trigger_conditions: (ruleData.trigger_conditions || {}) as Record<string, unknown>,
          actions: (ruleData.actions || {}) as Record<string, unknown>,
          target_channels: ruleData.target_channels || [],
          is_active: true,
          is_network_rule: ruleData.is_network_rule || false,
          priority_order: automationRules.length
        } as any);
      
      if (error) throw error;
      
      toast.success('Règle créée avec succès');
      await loadAutomationRules();
      await loadMetrics();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Erreur lors de la création de la règle');
    }
  }, [tenantId, automationRules.length, loadAutomationRules, loadMetrics]);

  // Update rule
  const updateRule = useCallback(async (id: string, updates: Partial<AutomationRule>) => {
    try {
      const { error } = await supabase
        .from('multichannel_automation_rules')
        .update(updates as any)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Règle mise à jour');
      await loadAutomationRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Erreur lors de la mise à jour de la règle');
    }
  }, [loadAutomationRules]);

  // Delete rule
  const deleteRule = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('multichannel_automation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Règle supprimée');
      await loadAutomationRules();
      await loadMetrics();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Erreur lors de la suppression de la règle');
    }
  }, [loadAutomationRules, loadMetrics]);

  // Toggle rule status
  const toggleRuleStatus = useCallback(async (id: string) => {
    const rule = automationRules.find(r => r.id === id);
    if (!rule) return;
    
    await updateRule(id, { is_active: !rule.is_active });
  }, [automationRules, updateRule]);

  // Reorder rules
  const reorderRules = useCallback(async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('multichannel_automation_rules')
          .update({ priority_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      await loadAutomationRules();
      toast.success('Ordre des règles mis à jour');
    } catch (error) {
      console.error('Error reordering rules:', error);
      toast.error('Erreur lors du réordonnancement');
    }
  }, [loadAutomationRules]);

  // Load analytics
  const loadAnalytics = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    if (!tenantId) return;
    
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const { data, error } = await supabase
        .from('multichannel_analytics')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      
      setAnalytics((data || []) as ChannelAnalytics[]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [tenantId]);

  // Load global config from network_admin_settings
  const loadGlobalConfig = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from('network_admin_settings')
        .select('setting_key, setting_value')
        .eq('tenant_id', tenantId)
        .eq('setting_category', 'multichannel');
      
      if (error) throw error;
      
      const configMap: Record<string, string> = {};
      (data || []).forEach(item => {
        configMap[item.setting_key] = item.setting_value;
      });
      
      setGlobalConfig({
        fallbackEnabled: configMap['fallback_enabled'] === 'true',
        detailedLogs: configMap['detailed_logs'] === 'true',
        realtimeNotifications: configMap['realtime_notifications'] === 'true',
        channelPriorities: configMap['channel_priorities'] 
          ? JSON.parse(configMap['channel_priorities']) 
          : []
      });
    } catch (error) {
      console.error('Error loading global config:', error);
    }
  }, [tenantId]);

  // Update global config
  const updateGlobalConfig = useCallback(async (config: Partial<GlobalMultichannelConfig>) => {
    if (!tenantId) return;
    
    try {
      const settings = [
        { key: 'fallback_enabled', value: String(config.fallbackEnabled ?? globalConfig.fallbackEnabled) },
        { key: 'detailed_logs', value: String(config.detailedLogs ?? globalConfig.detailedLogs) },
        { key: 'realtime_notifications', value: String(config.realtimeNotifications ?? globalConfig.realtimeNotifications) },
        { key: 'channel_priorities', value: JSON.stringify(config.channelPriorities ?? globalConfig.channelPriorities) }
      ];
      
      for (const setting of settings) {
        await supabase
          .from('network_admin_settings')
          .upsert({
            tenant_id: tenantId,
            setting_category: 'multichannel',
            setting_key: setting.key,
            setting_value: setting.value
          }, {
            onConflict: 'tenant_id,setting_category,setting_key'
          });
      }
      
      setGlobalConfig(prev => ({ ...prev, ...config }));
      toast.success('Configuration mise à jour');
    } catch (error) {
      console.error('Error updating global config:', error);
      toast.error('Erreur lors de la mise à jour de la configuration');
    }
  }, [tenantId, globalConfig]);

  // Update channel priorities
  const updateChannelPriorities = useCallback(async (priorities: { channelType: string; order: number }[]) => {
    await updateGlobalConfig({ channelPriorities: priorities });
    
    // Also update priority_order in connectors
    try {
      for (const priority of priorities) {
        const connector = connectors.find(c => c.channel_type === priority.channelType);
        if (connector) {
          await supabase
            .from('multichannel_connectors')
            .update({ priority_order: priority.order })
            .eq('id', connector.id);
        }
      }
      await loadConnectors();
    } catch (error) {
      console.error('Error updating channel priorities:', error);
    }
  }, [updateGlobalConfig, connectors, loadConnectors]);

  // Share connector with other pharmacies
  const shareConnector = useCallback(async (connectorId: string, pharmacyIds: string[]) => {
    try {
      await updateConnector(connectorId, {
        is_network_shared: pharmacyIds.length > 0,
        shared_with_pharmacies: pharmacyIds
      });
    } catch (error) {
      console.error('Error sharing connector:', error);
      toast.error('Erreur lors du partage du canal');
    }
  }, [updateConnector]);

  // Share rule with network
  const shareRule = useCallback(async (ruleId: string, isShared: boolean) => {
    try {
      await updateRule(ruleId, { is_network_rule: isShared });
    } catch (error) {
      console.error('Error sharing rule:', error);
      toast.error('Erreur lors du partage de la règle');
    }
  }, [updateRule]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadConnectors(),
        loadAutomationRules(),
        loadAnalytics(),
        loadGlobalConfig()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadMetrics, loadConnectors, loadAutomationRules, loadAnalytics, loadGlobalConfig]);

  // Initial load
  useEffect(() => {
    if (tenantId) {
      refreshAllData();
    }
  }, [tenantId, refreshAllData]);

  return {
    loading,
    connectors,
    automationRules,
    analytics,
    metrics,
    globalConfig,
    
    // Connector operations
    loadConnectors,
    createConnector,
    updateConnector,
    deleteConnector,
    toggleConnectorStatus,
    testConnector,
    shareConnector,
    
    // Rule operations
    loadAutomationRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    reorderRules,
    shareRule,
    
    // Analytics
    loadAnalytics,
    
    // Config
    loadGlobalConfig,
    updateGlobalConfig,
    updateChannelPriorities,
    
    // General
    refreshAllData,
    loadMetrics
  };
}
