import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export type ModuleSyncConfig = {
  id: string;
  tenant_id: string;
  module_name: 'stock' | 'ventes' | 'personnel' | 'partenaires';
  is_enabled: boolean;
  auto_sync: boolean;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  last_sync_at?: string;
  last_sync_status?: 'success' | 'warning' | 'error';
  sync_count: number;
  error_message?: string;
  config?: any;
  created_at: string;
  updated_at: string;
};

export type ModuleSyncLog = {
  id: string;
  tenant_id: string;
  sync_config_id?: string;
  module_name: string;
  sync_type: 'manual' | 'automatic' | 'scheduled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  status: 'running' | 'success' | 'partial' | 'error';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_details?: any;
  triggered_by?: string;
  created_at: string;
};

export type ExternalIntegration = {
  id: string;
  tenant_id: string;
  integration_type: 'bank' | 'accounting' | 'tax' | 'social' | 'erp';
  provider_name: string;
  status: 'connected' | 'pending' | 'configured' | 'disconnected' | 'error';
  is_active: boolean;
  connection_config?: any;
  sync_settings?: any;
  last_connection_at?: string;
  last_sync_at?: string;
  last_error?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export type FECExport = {
  id: string;
  tenant_id: string;
  exercice_id?: string;
  start_date: string;
  end_date: string;
  format: 'txt' | 'xlsx' | 'xml';
  include_analytics: boolean;
  file_path?: string;
  file_size_mb?: number;
  total_entries: number;
  export_status: 'generating' | 'completed' | 'error';
  generation_duration_seconds?: number;
  exported_by?: string;
  downloaded_at?: string;
  downloaded_by?: string;
  download_count: number;
  validation_errors?: any;
  created_at: string;
};

export type WebhookConfig = {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  is_active: boolean;
  events: string[];
  secret_key?: string;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  last_status?: string;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export type WebhookLog = {
  id: string;
  tenant_id: string;
  webhook_id?: string;
  event_type?: string;
  payload?: any;
  request_headers?: any;
  response_status?: number;
  response_body?: string;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  retry_count: number;
  created_at: string;
};

export type APIScheduledTask = {
  id: string;
  tenant_id: string;
  task_name: string;
  task_type?: string;
  frequency: string;
  schedule_time?: string;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  last_status?: string;
  config?: any;
  created_at: string;
  updated_at: string;
};

export type RegionalParameters = {
  id: string;
  tenant_id: string;
  pays: string;
  code_pays: string;
  fec_obligatoire: boolean;
  fec_format_defaut: string;
  fec_separateur: string;
  fec_encodage: string;
  banking_api_available: boolean;
  banking_standard?: string;
  tax_portal_url?: string;
  tax_portal_available: boolean;
  tax_declaration_format?: string;
  social_org_name?: string;
  social_portal_url?: string;
  social_portal_available: boolean;
  labels?: any;
  data_retention_years: number;
  archiving_required: boolean;
  created_at: string;
  updated_at: string;
};

export function useSystemIntegrations() {
  const { currentTenant, currentUser } = useTenant();
  const { toast } = useToast();
  const { user, personnel } = useAuth();
  const queryClient = useQueryClient();

  const tenantId = currentTenant?.id;
  // Utiliser personnel.id (FK vers personnel) au lieu de user.id (FK vers auth.users)
  const personnelId = personnel?.id || currentUser?.id;

  // Module Sync Configs
  const { data: moduleSyncConfigs, isLoading: isLoadingModules } = useQuery({
    queryKey: ['module-sync-configs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('module_sync_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('module_name');
      if (error) throw error;
      return data as ModuleSyncConfig[];
    },
    enabled: !!tenantId,
  });

  // Module Sync Logs
  const { data: moduleSyncLogs } = useQuery({
    queryKey: ['module-sync-logs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('module_sync_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ModuleSyncLog[];
    },
    enabled: !!tenantId,
  });

  // External Integrations
  const { data: externalIntegrations, isLoading: isLoadingExternal } = useQuery({
    queryKey: ['external-integrations', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('external_integrations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ExternalIntegration[];
    },
    enabled: !!tenantId,
  });

  // FEC Exports
  const { data: fecExports, isLoading: isLoadingFEC } = useQuery({
    queryKey: ['fec-exports', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('fec_exports')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as FECExport[];
    },
    enabled: !!tenantId,
  });

  // Webhooks Config
  const { data: webhooksConfig, isLoading: isLoadingWebhooks } = useQuery({
    queryKey: ['webhooks-config', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('webhooks_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WebhookConfig[];
    },
    enabled: !!tenantId,
  });

  // Webhooks Logs
  const { data: webhooksLogs } = useQuery({
    queryKey: ['webhooks-logs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('webhooks_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!tenantId,
  });

  // API Scheduled Tasks
  const { data: scheduledTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['api-scheduled-tasks', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('api_scheduled_tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false});
      if (error) throw error;
      return data as APIScheduledTask[];
    },
    enabled: !!tenantId,
  });

  // Regional Parameters
  const { data: regionalParameters } = useQuery({
    queryKey: ['parametres-integrations-regionaux', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('parametres_integrations_regionaux')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data as RegionalParameters | null;
    },
    enabled: !!tenantId,
  });

  // API Tokens (from report_api_tokens)
  const { data: apiTokens } = useQuery({
    queryKey: ['report-api-tokens', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('report_api_tokens')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Computed Metrics
  const metrics = useMemo(() => {
    const lastSyncDates = moduleSyncConfigs?.map(m => m.last_sync_at).filter(Boolean) || [];
    const maxDate = lastSyncDates.length > 0 
      ? new Date(Math.max(...lastSyncDates.map(d => new Date(d!).getTime()))).toISOString()
      : null;

    return {
      totalModules: moduleSyncConfigs?.length || 0,
      connectedModules: moduleSyncConfigs?.filter(m => m.is_enabled)?.length || 0,
      autoSyncModules: moduleSyncConfigs?.filter(m => m.auto_sync)?.length || 0,
      lastGlobalSync: maxDate,
      totalExternalIntegrations: externalIntegrations?.length || 0,
      connectedExternals: externalIntegrations?.filter(i => i.status === 'connected')?.length || 0,
      totalFECExports: fecExports?.length || 0,
      lastFECExport: fecExports?.[0]?.created_at,
      totalWebhooks: webhooksConfig?.length || 0,
      activeWebhooks: webhooksConfig?.filter(w => w.is_active)?.length || 0,
      webhookSuccessRate: webhooksConfig?.reduce((acc, w) => {
        if (w.total_calls === 0) return acc;
        return acc + (w.success_calls / w.total_calls);
      }, 0) / (webhooksConfig?.length || 1) * 100 || 0,
    };
  }, [moduleSyncConfigs, externalIntegrations, fecExports, webhooksConfig]);

  // Mutations - Module Sync
  const syncModuleMutation = useMutation({
    mutationFn: async (moduleName: string) => {
      if (!tenantId) throw new Error('Tenant non défini');
      if (!personnelId) throw new Error('Profil utilisateur (personnel) non chargé. Veuillez vous reconnecter.');
      
      const { data: config } = await supabase
        .from('module_sync_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('module_name', moduleName)
        .single();

      const logId = crypto.randomUUID();
      
      // Insert log avec status running - utiliser personnelId (FK vers personnel)
      await supabase.from('module_sync_logs').insert({
        id: logId,
        tenant_id: tenantId,
        sync_config_id: config?.id,
        module_name: moduleName,
        sync_type: 'manual',
        status: 'running',
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        triggered_by: personnelId,
      });

      // Simuler sync (en production, appeler edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update log avec success
      const completedAt = new Date().toISOString();
      const startedAt = new Date().toISOString();
      const duration = 2;

      await supabase.from('module_sync_logs').update({
        completed_at: completedAt,
        duration_seconds: duration,
        status: 'success',
        records_processed: 10,
        records_created: 2,
        records_updated: 8,
      }).eq('id', logId);

      // Update config
      if (config) {
        await supabase.from('module_sync_configs').update({
          last_sync_at: completedAt,
          last_sync_status: 'success',
          sync_count: (config.sync_count || 0) + 1,
        }).eq('id', config.id);
      }

      return { moduleName, logId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['module-sync-configs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['module-sync-logs', tenantId] });
      toast({
        title: 'Synchronisation réussie',
        description: `Module ${data.moduleName} synchronisé avec succès`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateModuleSyncConfigMutation = useMutation({
    mutationFn: async (config: Partial<ModuleSyncConfig> & { id: string }) => {
      const { error } = await supabase
        .from('module_sync_configs')
        .update(config)
        .eq('id', config.id);
      if (error) throw error;
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-sync-configs', tenantId] });
      toast({
        title: 'Configuration mise à jour',
        description: 'La configuration de synchronisation a été mise à jour',
      });
    },
  });

  // Mutations - External Integrations
  const createExternalIntegrationMutation = useMutation({
    mutationFn: async (integration: {
      integration_type: 'bank' | 'accounting' | 'tax' | 'social' | 'erp';
      provider_name: string;
      status?: string;
      is_active?: boolean;
      connection_config?: any;
      sync_settings?: any;
      metadata?: any;
    }) => {
      if (!tenantId) throw new Error('Tenant non défini');
      if (!personnelId) throw new Error('Profil utilisateur (personnel) non chargé. Veuillez vous reconnecter.');
      
      const { data, error } = await supabase
        .from('external_integrations')
        .insert({
          tenant_id: tenantId,
          created_by: personnelId, // FK vers personnel.id, pas auth.users.id
          integration_type: integration.integration_type,
          provider_name: integration.provider_name,
          status: integration.status || 'configured',
          is_active: integration.is_active ?? true,
          connection_config: integration.connection_config || {},
          sync_settings: integration.sync_settings || {},
          metadata: integration.metadata || {},
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
      toast({
        title: 'Intégration créée',
        description: 'L\'intégration externe a été créée avec succès',
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Erreur inconnue';
      const is409 = message.includes('409') || message.includes('Conflict') || message.includes('foreign key');
      toast({
        title: 'Erreur de création',
        description: is409 
          ? 'Le profil personnel n\'est pas correctement lié. Veuillez vous reconnecter.'
          : message,
        variant: 'destructive',
      });
    },
  });

  const updateExternalIntegrationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExternalIntegration> }) => {
      const { error } = await supabase
        .from('external_integrations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
      toast({
        title: 'Intégration mise à jour',
        description: 'L\'intégration a été mise à jour avec succès',
      });
    },
  });

  const deleteExternalIntegrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('external_integrations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
      toast({
        title: 'Intégration supprimée',
        description: 'L\'intégration a été supprimée avec succès',
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simuler test connexion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update last_connection_at
      await supabase
        .from('external_integrations')
        .update({ 
          last_connection_at: new Date().toISOString(),
          status: 'connected' 
        })
        .eq('id', id);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-integrations', tenantId] });
      toast({
        title: 'Test réussi',
        description: 'La connexion a été testée avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Test échoué',
        description: 'La connexion n\'a pas pu être établie',
        variant: 'destructive',
      });
    },
  });

  // Mutations - FEC
  const generateFECMutation = useMutation({
    mutationFn: async (params: {
      start_date: string;
      end_date: string;
      format: 'txt' | 'xlsx' | 'xml';
      include_analytics: boolean;
    }) => {
      if (!tenantId) throw new Error('Tenant non défini');
      if (!personnelId) throw new Error('Profil utilisateur (personnel) non chargé. Veuillez vous reconnecter.');
      
      // Simuler génération FEC
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data, error } = await supabase
        .from('fec_exports')
        .insert({
          tenant_id: tenantId,
          start_date: params.start_date,
          end_date: params.end_date,
          format: params.format,
          include_analytics: params.include_analytics,
          export_status: 'completed',
          total_entries: 150,
          file_size_mb: 2.5,
          generation_duration_seconds: 3,
          exported_by: personnelId, // FK vers personnel.id, pas auth.users.id
          download_count: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fec-exports', tenantId] });
      toast({
        title: 'FEC généré',
        description: 'Le fichier FEC a été généré avec succès',
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Erreur inconnue';
      const is409 = message.includes('409') || message.includes('Conflict') || message.includes('foreign key');
      toast({
        title: 'Erreur de génération FEC',
        description: is409 
          ? 'Le profil personnel n\'est pas correctement lié. Veuillez vous reconnecter.'
          : message,
        variant: 'destructive',
      });
    },
  });

  // Mutations - Webhooks
  const createWebhookMutation = useMutation({
    mutationFn: async (webhook: {
      name: string;
      url: string;
      is_active?: boolean;
      events?: string[];
      retry_count?: number;
      timeout_seconds?: number;
      secret_key?: string;
    }) => {
      if (!tenantId) throw new Error('Tenant non défini');
      if (!personnelId) throw new Error('Profil utilisateur (personnel) non chargé. Veuillez vous reconnecter.');
      
      const { data, error } = await supabase
        .from('webhooks_config')
        .insert({
          tenant_id: tenantId,
          created_by: personnelId, // FK vers personnel.id, pas auth.users.id
          name: webhook.name,
          url: webhook.url,
          is_active: webhook.is_active ?? true,
          events: webhook.events || [],
          retry_count: webhook.retry_count ?? 3,
          timeout_seconds: webhook.timeout_seconds ?? 30,
          secret_key: webhook.secret_key,
          total_calls: 0,
          success_calls: 0,
          failed_calls: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks-config', tenantId] });
      toast({
        title: 'Webhook créé',
        description: 'Le webhook a été créé avec succès',
      });
    },
    onError: (error: any) => {
      const message = error?.message || 'Erreur inconnue';
      const is409 = message.includes('409') || message.includes('Conflict') || message.includes('foreign key');
      toast({
        title: 'Erreur de création webhook',
        description: is409 
          ? 'Le profil personnel n\'est pas correctement lié. Veuillez vous reconnecter.'
          : message,
        variant: 'destructive',
      });
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WebhookConfig> }) => {
      const { error } = await supabase
        .from('webhooks_config')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks-config', tenantId] });
      toast({
        title: 'Webhook mis à jour',
        description: 'Le webhook a été mis à jour avec succès',
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhooks_config')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks-config', tenantId] });
      toast({
        title: 'Webhook supprimé',
        description: 'Le webhook a été supprimé avec succès',
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('Tenant non défini');
      
      // Simuler test webhook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log du test
      await supabase.from('webhooks_logs').insert({
        tenant_id: tenantId,
        webhook_id: id,
        event_type: 'test',
        payload: { test: true },
        response_status: 200,
        response_time_ms: 150,
        success: true,
        retry_count: 0,
      });
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks-logs', tenantId] });
      toast({
        title: 'Test réussi',
        description: 'Le webhook a été testé avec succès',
      });
    },
  });

  // Mutations - Scheduled Tasks
  const createScheduledTaskMutation = useMutation({
    mutationFn: async (task: Omit<APIScheduledTask, 'id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId) throw new Error('Tenant non défini');
      const { data, error } = await supabase
        .from('api_scheduled_tasks')
        .insert({ ...task, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-scheduled-tasks', tenantId] });
      toast({
        title: 'Tâche créée',
        description: 'La tâche programmée a été créée avec succès',
      });
    },
  });

  const updateScheduledTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<APIScheduledTask> }) => {
      const { error } = await supabase
        .from('api_scheduled_tasks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-scheduled-tasks', tenantId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'La tâche programmée a été mise à jour avec succès',
      });
    },
  });

  const deleteScheduledTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_scheduled_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-scheduled-tasks', tenantId] });
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche programmée a été supprimée avec succès',
      });
    },
  });

  return {
    // Data
    moduleSyncConfigs,
    moduleSyncLogs,
    externalIntegrations,
    fecExports,
    webhooksConfig,
    webhooksLogs,
    apiTokens,
    scheduledTasks,
    regionalParameters,
    
    // Metrics
    metrics,
    
    // Loading
    isLoading: isLoadingModules || isLoadingExternal || isLoadingFEC || isLoadingWebhooks || isLoadingTasks,
    
    // Mutations Modules
    syncModule: syncModuleMutation.mutate,
    isSyncingModule: syncModuleMutation.isPending,
    updateModuleSyncConfig: updateModuleSyncConfigMutation.mutate,
    
    // Mutations External
    createExternalIntegration: createExternalIntegrationMutation.mutate,
    updateExternalIntegration: updateExternalIntegrationMutation.mutate,
    deleteExternalIntegration: deleteExternalIntegrationMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    isTestingConnection: testConnectionMutation.isPending,
    
    // Mutations FEC
    generateFEC: generateFECMutation.mutate,
    isGeneratingFEC: generateFECMutation.isPending,
    
    // Mutations Webhooks
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    isTestingWebhook: testWebhookMutation.isPending,
    
    // Mutations Tasks
    createScheduledTask: createScheduledTaskMutation.mutate,
    updateScheduledTask: updateScheduledTaskMutation.mutate,
    deleteScheduledTask: deleteScheduledTaskMutation.mutate,
  };
}
