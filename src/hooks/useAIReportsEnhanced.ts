import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { AIReportsService, AIModelDisplay, AIPredictionDisplay, MLMetricDisplay, RealTimeAnalysisDisplay, AIInsightDisplay, DataQualityMetric, AIReportsConfig } from '@/services/AIReportsService';

export function useAIReportsEnhanced() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modèles IA
  const aiModelsQuery = useQuery({
    queryKey: ['ai-models-enhanced', tenantId],
    queryFn: async (): Promise<AIModelDisplay[]> => {
      if (!tenantId) return [];
      return AIReportsService.getAIModels(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prédictions IA
  const predictionsQuery = useQuery({
    queryKey: ['ai-predictions-enhanced', tenantId],
    queryFn: async (): Promise<AIPredictionDisplay[]> => {
      if (!tenantId) return [];
      return AIReportsService.getPredictions(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Métriques ML
  const mlMetricsQuery = useQuery({
    queryKey: ['ai-ml-metrics-enhanced', tenantId],
    queryFn: async (): Promise<MLMetricDisplay[]> => {
      if (!tenantId) return [];
      return AIReportsService.getMLMetrics(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  // Analyses temps réel
  const realTimeAnalysesQuery = useQuery({
    queryKey: ['ai-realtime-enhanced', tenantId],
    queryFn: async (): Promise<RealTimeAnalysisDisplay[]> => {
      if (!tenantId) return [];
      return AIReportsService.getRealTimeAnalyses(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 1 * 60 * 1000, // 1 minute pour temps réel
    refetchInterval: 5 * 60 * 1000, // Auto-refresh toutes les 5 minutes
  });

  // Insights
  const insightsQuery = useQuery({
    queryKey: ['ai-insights-enhanced', tenantId],
    queryFn: async (): Promise<AIInsightDisplay[]> => {
      if (!tenantId) return [];
      return AIReportsService.getInsights(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  // Qualité des données
  const dataQualityQuery = useQuery({
    queryKey: ['ai-data-quality', tenantId],
    queryFn: async (): Promise<DataQualityMetric[]> => {
      if (!tenantId) return [];
      return AIReportsService.getDataQualityMetrics(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Configuration AI
  const configQuery = useQuery({
    queryKey: ['ai-config', tenantId],
    queryFn: async (): Promise<AIReportsConfig> => {
      if (!tenantId) return { autoTrainingEnabled: true, trainingFrequency: 'weekly', minAccuracyThreshold: 85, maxEpochs: 100, dataRetentionDays: 365, notificationEnabled: true };
      return AIReportsService.getAIConfig(tenantId);
    },
    enabled: !!tenantId,
  });

  // Mutation: Toggle statut modèle
  const toggleModelStatusMutation = useMutation({
    mutationFn: async ({ modelId, source }: { modelId: string; source: 'forecast' | 'learning' }) => {
      return AIReportsService.toggleModelStatus(modelId, source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models-enhanced'] });
      toast({ title: 'Statut modifié', description: 'Le statut du modèle a été mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    }
  });

  // Mutation: Démarrer entraînement
  const startTrainingMutation = useMutation({
    mutationFn: async ({ modelId, epochs }: { modelId: string; epochs?: number }) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      return AIReportsService.startModelTraining(tenantId, modelId, epochs);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['ai-models-enhanced'] });
      if (result.success) {
        toast({ title: 'Entraînement démarré', description: 'Le modèle est en cours d\'entraînement' });
      } else {
        toast({ title: 'Erreur', description: 'Impossible de démarrer l\'entraînement', variant: 'destructive' });
      }
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    }
  });

  // Mutation: Mettre à jour config
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<AIReportsConfig>) => {
      if (!tenantId) throw new Error('Tenant non trouvé');
      return AIReportsService.updateAIConfig(tenantId, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
      toast({ title: 'Configuration sauvegardée', description: 'Les paramètres IA ont été mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    }
  });

  // Mutation: Appliquer prédiction
  const applyPredictionMutation = useMutation({
    mutationFn: async ({ predictionId, source }: { predictionId: string; source: string }) => {
      return AIReportsService.applyPrediction(predictionId, source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-predictions-enhanced'] });
      toast({ title: 'Prédiction appliquée', description: 'La recommandation a été marquée comme appliquée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    }
  });

  // Mutation: Ignorer prédiction
  const dismissPredictionMutation = useMutation({
    mutationFn: async ({ predictionId, source }: { predictionId: string; source: string }) => {
      return AIReportsService.dismissPrediction(predictionId, source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-predictions-enhanced'] });
      toast({ title: 'Prédiction ignorée', description: 'La prédiction a été marquée comme ignorée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as Error).message, variant: 'destructive' });
    }
  });

  // Rafraîchir toutes les données
  const refetchAll = () => {
    aiModelsQuery.refetch();
    predictionsQuery.refetch();
    mlMetricsQuery.refetch();
    realTimeAnalysesQuery.refetch();
    insightsQuery.refetch();
    dataQualityQuery.refetch();
  };

  const isLoading = 
    aiModelsQuery.isLoading || 
    predictionsQuery.isLoading || 
    mlMetricsQuery.isLoading || 
    realTimeAnalysesQuery.isLoading || 
    insightsQuery.isLoading;

  return {
    // Données
    aiModels: aiModelsQuery.data || [],
    predictions: predictionsQuery.data || [],
    mlMetrics: mlMetricsQuery.data || [],
    realTimeAnalyses: realTimeAnalysesQuery.data || [],
    insights: insightsQuery.data || [],
    dataQuality: dataQualityQuery.data || [],
    config: configQuery.data,

    // États
    isLoading,
    isModelsLoading: aiModelsQuery.isLoading,
    isPredictionsLoading: predictionsQuery.isLoading,
    isMetricsLoading: mlMetricsQuery.isLoading,
    isRealTimeLoading: realTimeAnalysesQuery.isLoading,
    isInsightsLoading: insightsQuery.isLoading,
    isDataQualityLoading: dataQualityQuery.isLoading,

    // Mutations
    toggleModelStatus: toggleModelStatusMutation.mutate,
    startTraining: startTrainingMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
    applyPrediction: applyPredictionMutation.mutate,
    dismissPrediction: dismissPredictionMutation.mutate,

    // Actions
    refetchAll,
    refetchModels: aiModelsQuery.refetch,
    refetchPredictions: predictionsQuery.refetch,
  };
}
