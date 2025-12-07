import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenantContext } from '@/contexts/TenantContext';

// Types
export interface AIProviderConnection {
  id: string;
  tenant_id: string;
  provider_name: string;
  provider_type: string;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  model_name: string | null;
  is_active: boolean;
  is_default: boolean;
  last_connection_at: string | null;
  status: string;
  error_message: string | null;
  config: Record<string, any>;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  avg_latency_ms: number;
  max_tokens: number;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export interface AIDataSource {
  id: string;
  tenant_id: string;
  source_name: string;
  source_type: string;
  description: string | null;
  source_config: Record<string, any>;
  sync_frequency: string;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_status: string;
  sync_error_message: string | null;
  records_count: number;
  data_size_mb: number;
  is_active: boolean;
  is_encrypted: boolean;
  retention_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIWebhookEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  source: string;
  source_id: string | null;
  direction: string;
  payload: Record<string, any>;
  response: Record<string, any> | null;
  status: string;
  status_code: number | null;
  latency_ms: number | null;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface AIIntegrationMetrics {
  active_providers: number;
  total_providers: number;
  active_sources: number;
  total_sources: number;
  api_calls_24h: number;
  success_calls_24h: number;
  success_rate: number;
  avg_latency_ms: number;
  total_records: number;
  pending_syncs: number;
  errors_24h: number;
  calculated_at: string;
}

export interface AIIntegrationConfig {
  auto_sync_enabled: boolean;
  default_provider_id: string | null;
  max_retries: number;
  timeout_ms: number;
  log_retention_days: number;
  enable_webhooks: boolean;
}

export function useAIIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantContext();
  const [config, setConfig] = useState<AIIntegrationConfig>({
    auto_sync_enabled: true,
    default_provider_id: null,
    max_retries: 3,
    timeout_ms: 30000,
    log_retention_days: 30,
    enable_webhooks: true,
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['ai-integration-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.rpc('get_ai_integration_metrics', { p_tenant_id: tenantId });
      if (error) throw error;
      return data as AIIntegrationMetrics;
    },
    enabled: !!tenantId,
  });

  // Fetch providers
  const { data: providers = [], isLoading: providersLoading, refetch: refetchProviders } = useQuery({
    queryKey: ['ai-providers', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_provider_connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AIProviderConnection[];
    },
    enabled: !!tenantId,
  });

  // Fetch data sources
  const { data: dataSources = [], isLoading: dataSourcesLoading, refetch: refetchDataSources } = useQuery({
    queryKey: ['ai-data-sources', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_data_sources')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AIDataSource[];
    },
    enabled: !!tenantId,
  });

  // Fetch webhook events
  const { data: webhookEvents = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['ai-webhook-events', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_webhook_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AIWebhookEvent[];
    },
    enabled: !!tenantId,
  });

  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: async (provider: Partial<AIProviderConnection>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase
        .from('ai_provider_connections')
        .insert({ ...provider, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Fournisseur créé', description: 'Le fournisseur IA a été ajouté avec succès.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIProviderConnection> }) => {
      const { data, error } = await supabase
        .from('ai_provider_connections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Fournisseur mis à jour', description: 'Les modifications ont été enregistrées.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_provider_connections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Fournisseur supprimé', description: 'Le fournisseur a été supprimé.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Test provider connection
  const testProviderConnection = useCallback(async (provider: AIProviderConnection) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-integration-test', {
        body: {
          provider_type: provider.provider_type,
          api_endpoint: provider.api_endpoint,
          api_key: provider.api_key_encrypted,
          model_name: provider.model_name,
        },
      });

      if (error) throw error;

      // Update provider status based on test result
      const newStatus = data.success ? 'connected' : 'error';
      const updates: Partial<AIProviderConnection> = {
        status: newStatus,
        last_connection_at: new Date().toISOString(),
        avg_latency_ms: data.latency_ms,
        error_message: data.success ? null : data.message,
      };

      if (data.success) {
        updates.success_calls = (provider.success_calls || 0) + 1;
      } else {
        updates.failed_calls = (provider.failed_calls || 0) + 1;
      }

      await updateProviderMutation.mutateAsync({ id: provider.id, updates });

      // Log the event
      await supabase.from('ai_webhook_events').insert({
        tenant_id: tenantId,
        event_type: 'provider_call',
        source: provider.provider_name,
        source_id: provider.id,
        direction: 'outbound',
        payload: { action: 'connection_test' },
        response: data,
        status: data.success ? 'success' : 'error',
        latency_ms: data.latency_ms,
        error_message: data.success ? null : data.message,
        processed_at: new Date().toISOString(),
      });

      refetchEvents();

      toast({
        title: data.success ? 'Connexion réussie' : 'Échec de connexion',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });

      return data;
    } catch (error: any) {
      toast({ title: 'Erreur de test', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [tenantId, updateProviderMutation, refetchEvents, toast]);

  // Create data source mutation
  const createDataSourceMutation = useMutation({
    mutationFn: async (source: Partial<AIDataSource>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase
        .from('ai_data_sources')
        .insert({ ...source, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Source créée', description: 'La source de données a été ajoutée.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Update data source mutation
  const updateDataSourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIDataSource> }) => {
      const { data, error } = await supabase
        .from('ai_data_sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Source mise à jour', description: 'Les modifications ont été enregistrées.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Delete data source mutation
  const deleteDataSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_data_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['ai-integration-metrics'] });
      toast({ title: 'Source supprimée', description: 'La source de données a été supprimée.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Sync data source
  const syncDataSource = useCallback(async (source: AIDataSource) => {
    try {
      const { data, error } = await supabase.rpc('sync_ai_data_source', {
        p_tenant_id: tenantId,
        p_source_id: source.id,
      });

      if (error) throw error;

      refetchDataSources();
      refetchEvents();
      refetchMetrics();

      toast({
        title: data.success ? 'Synchronisation réussie' : 'Échec de synchronisation',
        description: data.success 
          ? `${data.records_count} enregistrements synchronisés` 
          : data.error,
        variant: data.success ? 'default' : 'destructive',
      });

      return data;
    } catch (error: any) {
      toast({ title: 'Erreur de synchronisation', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [tenantId, refetchDataSources, refetchEvents, refetchMetrics, toast]);

  // Delete webhook event
  const deleteWebhookEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_webhook_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-webhook-events'] });
      toast({ title: 'Événement supprimé' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  // Clear old events
  const clearOldEvents = useCallback(async (daysOld: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('ai_webhook_events')
        .delete()
        .eq('tenant_id', tenantId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      refetchEvents();
      toast({ title: 'Logs nettoyés', description: `Événements de plus de ${daysOld} jours supprimés.` });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  }, [tenantId, refetchEvents, toast]);

  // Update config
  const updateConfig = useCallback((updates: Partial<AIIntegrationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    toast({ title: 'Configuration mise à jour' });
  }, [toast]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    refetchMetrics();
    refetchProviders();
    refetchDataSources();
    refetchEvents();
  }, [refetchMetrics, refetchProviders, refetchDataSources, refetchEvents]);

  return {
    // Data
    metrics,
    providers,
    dataSources,
    webhookEvents,
    config,

    // Loading states
    isLoading: metricsLoading || providersLoading || dataSourcesLoading || eventsLoading,
    metricsLoading,
    providersLoading,
    dataSourcesLoading,
    eventsLoading,

    // Provider actions
    createProvider: createProviderMutation.mutate,
    updateProvider: (id: string, updates: Partial<AIProviderConnection>) => 
      updateProviderMutation.mutate({ id, updates }),
    deleteProvider: deleteProviderMutation.mutate,
    testProviderConnection,

    // Data source actions
    createDataSource: createDataSourceMutation.mutate,
    updateDataSource: (id: string, updates: Partial<AIDataSource>) => 
      updateDataSourceMutation.mutate({ id, updates }),
    deleteDataSource: deleteDataSourceMutation.mutate,
    syncDataSource,

    // Event actions
    deleteWebhookEvent: deleteWebhookEventMutation.mutate,
    clearOldEvents,

    // Config actions
    updateConfig,

    // Refresh
    refreshAll,
    refetchMetrics,
    refetchProviders,
    refetchDataSources,
    refetchEvents,
  };
}
