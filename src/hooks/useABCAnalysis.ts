import { useState, useCallback, useEffect } from 'react';
import { ABCAnalysisService, ABCAnalysisResult, ABCAnalysisFilters, ABCProduct } from '@/services/ABCAnalysisService';
import { ExportService } from '@/services/ExportService';
import { toast } from 'sonner';

export interface UseABCAnalysisReturn {
  // Données
  analysis: ABCAnalysisResult | null;
  products: ABCProduct[];
  filteredProducts: ABCProduct[];
  
  // État
  loading: boolean;
  error: string | null;
  
  // Filtres
  filters: ABCAnalysisFilters;
  availableFamilies: Array<{id: string, libelle: string}>;
  availableCategories: Array<{id: string, libelle: string}>;
  
  // Actions
  updateFilters: (newFilters: Partial<ABCAnalysisFilters>) => void;
  refetchData: () => Promise<void>;
  recalculateClasses: () => Promise<void>;
  exportData: (format: 'pdf' | 'excel' | 'csv') => Promise<void>;
  
  // Métriques calculées
  classeStats: {
    A: { count: number; ca: number; percentage: number };
    B: { count: number; ca: number; percentage: number };
    C: { count: number; ca: number; percentage: number };
  };
  totalCA: number;
  rotationMoyenne: number;
  respectePareto: boolean;
}

const defaultFilters: ABCAnalysisFilters = {
  periode: 'trimestre',
  classe: 'toutes',
  seulement_actifs: true
};

export const useABCAnalysis = (): UseABCAnalysisReturn => {
  const [analysis, setAnalysis] = useState<ABCAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ABCAnalysisFilters>(defaultFilters);
  const [availableFamilies, setAvailableFamilies] = useState<Array<{id: string, libelle: string}>>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, libelle: string}>>([]);

  // Charger les données de référence
  const loadReferenceData = useCallback(async () => {
    try {
      const [families, categories] = await Promise.all([
        ABCAnalysisService.getAvailableFamilies(),
        ABCAnalysisService.getAvailableCategories()
      ]);
      
      setAvailableFamilies(families);
      setAvailableCategories(categories);
    } catch (err) {
      console.error('Erreur lors du chargement des données de référence:', err);
    }
  }, []);

  // Charger les données d'analyse
  const loadAnalysisData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ABCAnalysisService.performABCAnalysis(filters);
      setAnalysis(result);
    } catch (err) {
      let message = 'Erreur lors du chargement de l\'analyse ABC';
      
      if (err instanceof Error) {
        if (err.message === 'NO_SALES_DATA') {
          message = 'NO_SALES_DATA';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      
      // Ne pas afficher de toast pour l'absence de données de vente
      if (message !== 'NO_SALES_DATA') {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<ABCAnalysisFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Recharger les données
  const refetchData = useCallback(async () => {
    await loadAnalysisData();
  }, [loadAnalysisData]);

  // Recalculer les classes
  const recalculateClasses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ABCAnalysisService.recalculateABCClasses(filters);
      setAnalysis(result);
      toast.success('Classification ABC recalculée avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du recalcul';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Exporter les données
  const exportData = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    if (!analysis) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      // Adapter les données pour l'export
      const exportItems = analysis.products.map(product => ({
        id: product.id,
        nom: product.nom,
        categorie: product.categorie,
        classe: product.classe,
        chiffreAffaires: product.chiffreAffaires,
        pourcentageCA: product.pourcentageCA,
        pourcentageCumule: product.pourcentageCumule,
        quantiteVendue: product.quantiteVendue,
        rotation: product.rotation,
        stockActuel: product.stockActuel
      }));

      const exportOptions = {
        format,
        includeMetrics: true,
        includeCharts: format === 'pdf',
        dateRange: {
          start: analysis.periodeAnalyse.debut,
          end: analysis.periodeAnalyse.fin
        },
        filters: {
          categories: filters.famille_id ? [availableFamilies.find(f => f.id === filters.famille_id)?.libelle || ''] : [],
          statuses: [],
          urgencyLevels: []
        }
      };

      // Utiliser le service d'export ABC
      const result = await ExportService.exportABCAnalysisData(exportItems, exportOptions);

      if (result.success && result.downloadUrl) {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename || `analyse-abc-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Export ${format.toUpperCase()} généré avec succès`);
      } else {
        toast.error(result.error || 'Erreur lors de l\'export');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      toast.error(message);
    }
  }, [analysis, filters, availableFamilies]);

  // Produits filtrés selon les critères
  const filteredProducts = analysis?.products.filter(product => {
    if (filters.classe !== 'toutes' && product.classe !== filters.classe) {
      return false;
    }
    if (filters.recherche) {
      const searchTerm = filters.recherche.toLowerCase();
      return product.nom.toLowerCase().includes(searchTerm) ||
             product.categorie.toLowerCase().includes(searchTerm);
    }
    return true;
  }) || [];

  // Effet pour charger les données initiales
  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  return {
    // Données
    analysis,
    products: analysis?.products || [],
    filteredProducts,
    
    // État
    loading,
    error,
    
    // Filtres
    filters,
    availableFamilies,
    availableCategories,
    
    // Actions
    updateFilters,
    refetchData,
    recalculateClasses,
    exportData,
    
    // Métriques calculées
    classeStats: analysis?.classeStats || {
      A: { count: 0, ca: 0, percentage: 0 },
      B: { count: 0, ca: 0, percentage: 0 },
      C: { count: 0, ca: 0, percentage: 0 }
    },
    totalCA: analysis?.totalCA || 0,
    rotationMoyenne: analysis?.rotationMoyenne || 0,
    respectePareto: analysis?.respectePareto || false
  };
};