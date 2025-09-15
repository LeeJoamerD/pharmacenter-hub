import { useState, useEffect, useCallback } from 'react';
import { RotationAnalysisService, RotationProductData, RotationStats, RotationMetrics } from '@/services/RotationAnalysisService';
import { useTenantQuery } from './useTenantQuery';
import { useToast } from '@/components/ui/use-toast';

export interface UseRotationAnalysisReturn {
  products: RotationProductData[];
  filteredProducts: RotationProductData[];
  metrics: RotationMetrics;
  stats: RotationStats;
  families: Array<{ id: string; libelle_famille: string }>;
  loading: boolean;
  error: string | null;
  
  // Filtres
  selectedPeriod: string;
  selectedCategory: string;
  selectedStatus: string;
  setSelectedPeriod: (period: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
  
  // Actions
  refreshData: () => void;
  exportData: (format?: 'csv' | 'excel') => Promise<void>;
  getRecommendations: () => Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    products: string[];
  }>;
}

export const useRotationAnalysis = (): UseRotationAnalysisReturn => {
  const [products, setProducts] = useState<RotationProductData[]>([]);
  const [metrics, setMetrics] = useState<RotationMetrics>({
    rotationMoyenne: 0,
    produitsAnalyses: 0,
    valeurAnalysee: 0,
    alertesRotation: 0
  });
  const [stats, setStats] = useState<RotationStats>({
    excellent: 0,
    bon: 0,
    moyen: 0,
    faible: 0,
    critique: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [selectedPeriod, setSelectedPeriod] = useState('annuel');
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [selectedStatus, setSelectedStatus] = useState('tous');
  
  const { useTenantQueryWithCache, tenantId } = useTenantQuery();
  const { toast } = useToast();

  // Récupérer les familles de produits
  const { 
    data: families = [], 
    isLoading: familiesLoading 
  } = useTenantQueryWithCache(
    ['rotation-families'],
    'famille_produit',
    'id, libelle_famille'
  );

  // Fonction pour charger les données d'analyse
  const loadRotationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        throw new Error('Tenant ID non disponible');
      }

      const result = await RotationAnalysisService.getRotationAnalysis(
        tenantId,
        selectedPeriod as 'mensuel' | 'trimestriel' | 'annuel',
        selectedCategory !== 'toutes' ? selectedCategory : undefined,
        selectedStatus !== 'tous' ? selectedStatus : undefined
      );

      setProducts(result.products);
      setMetrics(result.metrics);
      setStats(result.stats);

    } catch (err) {
      console.error('Erreur lors du chargement des données de rotation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'analyse de rotation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedPeriod, selectedCategory, selectedStatus, toast]);

  // Charger les données au montage et lors des changements de filtres
  useEffect(() => {
    if (!familiesLoading) {
      loadRotationData();
    }
  }, [loadRotationData, familiesLoading]);

  // Fonction pour filtrer les produits côté client
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'toutes' || product.categorie === selectedCategory;
    const matchesStatus = selectedStatus === 'tous' || product.statut === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  // Fonction de rafraîchissement
  const refreshData = useCallback(() => {
    loadRotationData();
  }, [loadRotationData]);

  // Fonction d'export
  const exportData = useCallback(async (format: 'csv' | 'excel' = 'csv') => {
    try {
      await RotationAnalysisService.exportRotationData(filteredProducts, format);
      toast({
        title: "Export réussi",
        description: `Données exportées au format ${format.toUpperCase()}`,
      });
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  }, [filteredProducts, toast]);

  // Fonction pour obtenir les recommandations
  const getRecommendations = useCallback(() => {
    return RotationAnalysisService.generateRecommendations(products).recommendations;
  }, [products]);

  return {
    products,
    filteredProducts,
    metrics,
    stats,
    families: families || [],
    loading,
    error,
    
    selectedPeriod,
    selectedCategory,
    selectedStatus,
    setSelectedPeriod,
    setSelectedCategory,
    setSelectedStatus,
    
    refreshData,
    exportData,
    getRecommendations
  };
};