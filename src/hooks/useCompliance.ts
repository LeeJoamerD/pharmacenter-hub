import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService, type ComplianceItem, type ComplianceMetricsData } from '@/services/ComplianceService';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const complianceKeys = {
  all: ['compliance'] as const,
  items: () => [...complianceKeys.all, 'items'] as const,
  metrics: () => [...complianceKeys.all, 'metrics'] as const,
  categories: () => [...complianceKeys.all, 'categories'] as const,
  requirements: () => [...complianceKeys.all, 'requirements'] as const,
  controls: () => [...complianceKeys.all, 'controls'] as const,
};

// Main hook for compliance data
export const useCompliance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch compliance items
  const {
    data: complianceItems = [],
    isLoading: isLoadingItems,
    error: itemsError,
    refetch: refetchItems
  } = useQuery({
    queryKey: complianceKeys.items(),
    queryFn: () => complianceService.getComplianceItems(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch compliance metrics
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: complianceKeys.metrics(),
    queryFn: () => complianceService.getComplianceMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch categories
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    error: categoriesError
  } = useQuery({
    queryKey: complianceKeys.categories(),
    queryFn: () => complianceService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create compliance requirement mutation
  const createRequirementMutation = useMutation({
    mutationFn: complianceService.createComplianceRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      toast({
        title: "Succès",
        description: "Exigence de conformité créée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'exigence",
        variant: "destructive",
      });
    },
  });

  // Create compliance control mutation
  const createControlMutation = useMutation({
    mutationFn: complianceService.createComplianceControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      toast({
        title: "Succès",
        description: "Contrôle de conformité créé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du contrôle",
        variant: "destructive",
      });
    },
  });

  // Update compliance control mutation
  const updateControlMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      complianceService.updateComplianceControl(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      toast({
        title: "Succès",
        description: "Contrôle mis à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  // Create corrective action mutation
  const createActionMutation = useMutation({
    mutationFn: complianceService.createComplianceAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      toast({
        title: "Succès",
        description: "Action corrective créée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'action",
        variant: "destructive",
      });
    },
  });

  // Export functions
  const exportComplianceReport = async (filters?: {
    category?: string;
    status?: string;
    urgency?: string;
    dateFrom?: Date;
  }) => {
    try {
      await complianceService.exportComplianceReport(filters);
      toast({
        title: "Succès",
        description: "Rapport de conformité exporté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export du rapport",
        variant: "destructive",
      });
    }
  };

  const generateAuditReport = async () => {
    try {
      await complianceService.generateAuditReport();
      toast({
        title: "Succès",
        description: "Rapport d'audit généré avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport d'audit",
        variant: "destructive",
      });
    }
  };

  // Refresh all data
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: complianceKeys.all });
  };

  return {
    // Data
    complianceItems,
    metrics: metrics || { conformite: 0, nonConformite: 0, enCours: 0, expire: 0, scoreGlobal: 0 },
    categories,

    // Loading states
    isLoading: isLoadingItems || isLoadingMetrics,
    isLoadingItems,
    isLoadingMetrics,
    isLoadingCategories,

    // Errors
    error: itemsError || metricsError || categoriesError,
    itemsError,
    metricsError,
    categoriesError,

    // Mutations
    createRequirement: createRequirementMutation.mutate,
    createControl: createControlMutation.mutate,
    updateControl: updateControlMutation.mutate,
    createAction: createActionMutation.mutate,

    // Mutation states
    isCreatingRequirement: createRequirementMutation.isPending,
    isCreatingControl: createControlMutation.isPending,
    isUpdatingControl: updateControlMutation.isPending,
    isCreatingAction: createActionMutation.isPending,

    // Actions
    exportComplianceReport,
    generateAuditReport,
    refreshAll,
    refetchItems,
    refetchMetrics,
  };
};

// Specialized hook for filtering
export const useComplianceFilters = (
  items: ComplianceItem[],
  filters: {
    category?: string;
    status?: string;
    urgency?: string;
    dateFrom?: Date;
  }
) => {
  const filteredItems = items.filter(item => {
    const matchesCategory = !filters.category || filters.category === 'toutes' || item.categorie === filters.category;
    const matchesStatus = !filters.status || filters.status === 'tous' || item.statut === filters.status;
    const matchesUrgency = !filters.urgency || filters.urgency === 'toutes' || item.urgence === filters.urgency;
    const matchesDate = !filters.dateFrom || item.dernierControle >= filters.dateFrom;
    
    return matchesCategory && matchesStatus && matchesUrgency && matchesDate;
  });

  return {
    filteredItems,
    totalItems: items.length,
    filteredCount: filteredItems.length,
  };
};

// Hook for compliance statistics
export const useComplianceStats = (items: ComplianceItem[]) => {
  const stats = {
    byCategory: items.reduce((acc, item) => {
      acc[item.categorie] = (acc[item.categorie] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    byStatus: items.reduce((acc, item) => {
      acc[item.statut] = (acc[item.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    byUrgency: items.reduce((acc, item) => {
      acc[item.urgence] = (acc[item.urgence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    averageScore: items.length > 0 
      ? items.reduce((sum, item) => sum + item.scoreConformite, 0) / items.length 
      : 0,
    
    upcomingControls: items.filter(item => {
      const daysDiff = Math.ceil((item.prochainControle.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return daysDiff <= 7 && daysDiff >= 0;
    }).length,
    
    overduedControls: items.filter(item => item.prochainControle < new Date()).length,
  };

  return stats;
};