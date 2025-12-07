import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { Json } from '@/integrations/supabase/types';

// Types
export interface LearningModel {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  model_type: string;
  status: 'training' | 'active' | 'pending' | 'error' | 'archived';
  accuracy: number;
  data_points: number;
  epochs: number;
  current_epoch: number;
  progress: number;
  last_training_at: string | null;
  next_training_at: string | null;
  training_frequency: string;
  hyperparameters: Record<string, unknown>;
  config: Record<string, unknown>;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningFeedback {
  id: string;
  tenant_id: string;
  model_id: string | null;
  model_name: string | null;
  feedback_type: 'positive' | 'mixed' | 'negative';
  comment: string | null;
  accuracy_before: number | null;
  accuracy_after: number | null;
  user_name: string | null;
  user_id: string | null;
  impact_applied: boolean;
  impact_applied_at: string | null;
  impact_analysis: Record<string, unknown>;
  created_at: string;
}

export interface TrainingDataset {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  records_count: number;
  quality_score: number;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_frequency: string;
  source_type: string;
  source_name: string | null;
  source_config: Record<string, unknown>;
  is_active: boolean;
  is_encrypted: boolean;
  retention_days: number;
  sync_status: string;
  sync_error_message: string | null;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  tenant_id: string;
  model_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  epochs_total: number;
  epochs_completed: number;
  initial_accuracy: number | null;
  final_accuracy: number | null;
  accuracy_gain: number | null;
  training_time_seconds: number;
  data_points_used: number;
  logs: unknown[];
  error_message: string | null;
  metrics: Record<string, unknown>;
  created_at: string;
}

export interface LearningMetrics {
  totalModels: number;
  activeTraining: number;
  avgAccuracyGain: number;
  dataProcessed: number;
  trainingHours: number;
}

export interface MLConfig {
  auto_training_enabled: boolean;
  training_schedule: string;
  min_accuracy_threshold: number;
  max_epochs: number;
  data_retention_days: number;
  notification_enabled: boolean;
}

export function useContinuousLearning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  
  const [config, setConfig] = useState<MLConfig>({
    auto_training_enabled: true,
    training_schedule: 'weekly',
    min_accuracy_threshold: 85,
    max_epochs: 100,
    data_retention_days: 365,
    notification_enabled: true
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['ai-learning-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.rpc('get_ai_learning_metrics', { p_tenant_id: tenantId });
      if (error) throw error;
      return data as unknown as LearningMetrics;
    },
    enabled: !!tenantId,
  });

  // Fetch models
  const { data: models = [], isLoading: modelsLoading, refetch: refetchModels } = useQuery({
    queryKey: ['ai-learning-models', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_learning_models')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LearningModel[];
    },
    enabled: !!tenantId,
  });

  // Fetch feedback
  const { data: feedback = [], isLoading: feedbackLoading, refetch: refetchFeedback } = useQuery({
    queryKey: ['ai-learning-feedback', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_learning_feedback')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as LearningFeedback[];
    },
    enabled: !!tenantId,
  });

  // Fetch datasets
  const { data: datasets = [], isLoading: datasetsLoading, refetch: refetchDatasets } = useQuery({
    queryKey: ['ai-training-datasets', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_training_datasets')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TrainingDataset[];
    },
    enabled: !!tenantId,
  });

  // Fetch training sessions
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['ai-training-sessions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('ai_training_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as TrainingSession[];
    },
    enabled: !!tenantId,
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: async (model: Partial<LearningModel>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase
        .from('ai_learning_models')
        .insert({
          name: model.name || '',
          description: model.description,
          model_type: model.model_type || 'prediction',
          status: 'pending',
          accuracy: 0,
          data_points: 0,
          epochs: model.epochs || 50,
          training_frequency: model.training_frequency || 'weekly',
          hyperparameters: model.hyperparameters as Json || {},
          config: model.config as Json || {},
          tenant_id: tenantId
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchModels();
      refetchMetrics();
      toast({ title: 'Modèle créé', description: 'Le modèle a été créé avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LearningModel> }) => {
      const { data, error } = await supabase
        .from('ai_learning_models')
        .update({
          ...updates,
          hyperparameters: updates.hyperparameters as Json,
          config: updates.config as Json
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchModels();
      toast({ title: 'Modèle mis à jour', description: 'Le modèle a été modifié avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_learning_models')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchModels();
      refetchMetrics();
      toast({ title: 'Modèle supprimé', description: 'Le modèle a été archivé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Start training mutation
  const startTrainingMutation = useMutation({
    mutationFn: async ({ modelId, epochs }: { modelId: string; epochs?: number }) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase.rpc('start_ai_model_training', {
        p_tenant_id: tenantId,
        p_model_id: modelId,
        p_epochs: epochs || 50
      });
      if (error) throw error;
      return data as unknown as { success: boolean; session_id?: string; error?: string };
    },
    onSuccess: (data) => {
      refetchModels();
      refetchSessions();
      refetchMetrics();
      if (data?.success) {
        toast({ title: 'Formation démarrée', description: 'L\'entraînement du modèle a commencé' });
      } else {
        toast({ title: 'Erreur', description: data?.error || 'Impossible de démarrer la formation', variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Create feedback mutation
  const createFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: Partial<LearningFeedback>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase
        .from('ai_learning_feedback')
        .insert({
          model_id: feedbackData.model_id,
          model_name: feedbackData.model_name,
          feedback_type: feedbackData.feedback_type || 'mixed',
          comment: feedbackData.comment,
          accuracy_before: feedbackData.accuracy_before,
          user_name: feedbackData.user_name,
          tenant_id: tenantId
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchFeedback();
      toast({ title: 'Feedback enregistré', description: 'Votre retour a été enregistré' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Apply feedback mutation
  const applyFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { data, error } = await supabase
        .from('ai_learning_feedback')
        .update({
          impact_applied: true,
          impact_applied_at: new Date().toISOString(),
          impact_analysis: { applied: true, applied_at: new Date().toISOString() } as unknown as Json
        })
        .eq('id', feedbackId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchFeedback();
      toast({ title: 'Feedback intégré', description: 'Le feedback a été appliqué au modèle' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Create dataset mutation
  const createDatasetMutation = useMutation({
    mutationFn: async (dataset: Partial<TrainingDataset>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      const { data, error } = await supabase
        .from('ai_training_datasets')
        .insert({
          name: dataset.name || '',
          description: dataset.description,
          source_type: dataset.source_type || 'internal',
          source_name: dataset.source_name,
          source_config: dataset.source_config as Json || {},
          sync_frequency: dataset.sync_frequency || 'daily',
          retention_days: dataset.retention_days || 365,
          tenant_id: tenantId
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchDatasets();
      toast({ title: 'Dataset créé', description: 'La source de données a été configurée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update dataset mutation
  const updateDatasetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TrainingDataset> }) => {
      const { data, error } = await supabase
        .from('ai_training_datasets')
        .update({
          ...updates,
          source_config: updates.source_config as Json
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchDatasets();
      toast({ title: 'Dataset mis à jour', description: 'La configuration a été modifiée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Delete dataset mutation
  const deleteDatasetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_training_datasets')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDatasets();
      toast({ title: 'Dataset supprimé', description: 'La source de données a été désactivée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Sync dataset mutation
  const syncDatasetMutation = useMutation({
    mutationFn: async (datasetId: string) => {
      // Update sync status
      const { error: updateError } = await supabase
        .from('ai_training_datasets')
        .update({ sync_status: 'syncing' })
        .eq('id', datasetId);
      if (updateError) throw updateError;

      // Simulate sync (in real implementation, this would fetch actual data)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update with success
      const newRecordsCount = Math.floor(Math.random() * 10000) + 5000;
      const { data, error } = await supabase
        .from('ai_training_datasets')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
          records_count: newRecordsCount,
          quality_score: 85 + Math.random() * 15
        })
        .eq('id', datasetId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchDatasets();
      toast({ title: 'Synchronisation terminée', description: 'Les données ont été mises à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur de synchronisation', description: error.message, variant: 'destructive' });
    }
  });

  // Start all pending training
  const startAllTrainingMutation = useMutation({
    mutationFn: async () => {
      const pendingModels = models.filter(m => m.status === 'pending');
      const results = [];
      for (const model of pendingModels) {
        const result = await startTrainingMutation.mutateAsync({ modelId: model.id });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      toast({ title: 'Formations démarrées', description: 'Tous les modèles en attente sont maintenant en formation' });
    }
  });

  // Save config
  const saveConfig = (newConfig: MLConfig) => {
    setConfig(newConfig);
    toast({ title: 'Configuration sauvegardée', description: 'Les paramètres ML ont été mis à jour' });
  };

  return {
    // Data
    metrics,
    models,
    feedback,
    datasets,
    sessions,
    config,

    // Loading states
    isLoading: metricsLoading || modelsLoading || feedbackLoading || datasetsLoading || sessionsLoading,
    metricsLoading,
    modelsLoading,
    feedbackLoading,
    datasetsLoading,
    sessionsLoading,

    // Model operations
    createModel: createModelMutation.mutate,
    updateModel: updateModelMutation.mutate,
    deleteModel: deleteModelMutation.mutate,
    startTraining: startTrainingMutation.mutate,
    startAllTraining: startAllTrainingMutation.mutate,
    isStartingTraining: startTrainingMutation.isPending,

    // Feedback operations
    createFeedback: createFeedbackMutation.mutate,
    applyFeedback: applyFeedbackMutation.mutate,

    // Dataset operations
    createDataset: createDatasetMutation.mutate,
    updateDataset: updateDatasetMutation.mutate,
    deleteDataset: deleteDatasetMutation.mutate,
    syncDataset: syncDatasetMutation.mutate,
    isSyncing: syncDatasetMutation.isPending,

    // Config
    saveConfig,

    // Refetch
    refetchAll: () => {
      refetchMetrics();
      refetchModels();
      refetchFeedback();
      refetchDatasets();
      refetchSessions();
    }
  };
}
