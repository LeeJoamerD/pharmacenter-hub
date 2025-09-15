import { useState, useEffect, useCallback } from 'react';
import { ForecastAnalysisService, ForecastProduct, ForecastStats, ForecastRecommendation } from '@/services/ForecastAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseForecastAnalysisReturn {
  // Data
  products: ForecastProduct[];
  stats: ForecastStats;
  recommendations: ForecastRecommendation[];
  families: Array<{ id: string; libelle_famille: string }>;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Filters
  selectedHorizon: string;
  selectedCategory: string;
  selectedRecommendation: string;
  
  // Actions
  setSelectedHorizon: (horizon: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedRecommendation: (recommendation: string) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'pdf' | 'excel') => Promise<void>;
  runCalculation: () => Promise<void>;
}

export const useForecastAnalysis = (): UseForecastAnalysisReturn => {
  // Data state
  const [products, setProducts] = useState<ForecastProduct[]>([]);
  const [stats, setStats] = useState<ForecastStats>({
    totalProduits: 0,
    fiabiliteMoyenne: 0,
    valeurPrevisionnelle: 0,
    alertesStock: 0
  });
  const [recommendations, setRecommendations] = useState<ForecastRecommendation[]>([]);
  const [families, setFamilies] = useState<Array<{ id: string; libelle_famille: string }>>([]);
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [selectedHorizon, setSelectedHorizon] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRecommendation, setSelectedRecommendation] = useState('all');

  // Get current tenant ID
  const getCurrentTenantId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();

      return personnel?.tenant_id || null;
    } catch (error) {
      console.error('Error getting tenant ID:', error);
      return null;
    }
  }, []);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID non trouvé');
      }

      // Load forecast data with current filters
      const filters = {
        horizon: selectedHorizon,
        category: selectedCategory,
        recommendation: selectedRecommendation
      };

      const [forecastData, familiesData] = await Promise.all([
        ForecastAnalysisService.getForecastData(tenantId, filters),
        ForecastAnalysisService.getProductFamilies(tenantId)
      ]);

      setProducts(forecastData.products);
      setStats(forecastData.stats);
      setRecommendations(forecastData.recommendations);
      setFamilies(familiesData);
    } catch (err) {
      console.error('Error loading forecast data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des prévisions');
    } finally {
      setLoading(false);
    }
  }, [getCurrentTenantId, selectedHorizon, selectedCategory, selectedRecommendation]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await loadData();
    toast.success('Données actualisées');
  }, [loadData]);

  // Export data function
  const exportData = useCallback(async (format: 'pdf' | 'excel') => {
    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        toast.error('Impossible d\'exporter: utilisateur non authentifié');
        return;
      }

      toast.loading('Génération de l\'export en cours...');

      const filters = {
        horizon: selectedHorizon,
        category: selectedCategory,
        recommendation: selectedRecommendation
      };

      const result = await ForecastAnalysisService.exportForecastData(tenantId, filters, format);
      
      if (result.success) {
        toast.success(result.message);
        // In a real implementation, you would download the file
        if (result.url) {
          // window.open(result.url, '_blank');
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  }, [getCurrentTenantId, selectedHorizon, selectedCategory, selectedRecommendation]);

  // Run forecast calculation
  const runCalculation = useCallback(async () => {
    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        toast.error('Impossible de lancer le calcul: utilisateur non authentifié');
        return;
      }

      toast.loading('Calcul des prévisions en cours...');

      const result = await ForecastAnalysisService.runForecastCalculation(tenantId);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh data after calculation
        await refreshData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Erreur lors du calcul des prévisions');
    }
  }, [getCurrentTenantId, refreshData]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [selectedHorizon, selectedCategory, selectedRecommendation]);

  return {
    // Data
    products,
    stats,
    recommendations,
    families,
    
    // State
    loading,
    error,
    
    // Filters
    selectedHorizon,
    selectedCategory,
    selectedRecommendation,
    
    // Actions
    setSelectedHorizon,
    setSelectedCategory,
    setSelectedRecommendation,
    refreshData,
    exportData,
    runCalculation
  };
};