import { useState, useEffect } from 'react';
import { 
  SupplyAnalyticsService, 
  SupplierPerformance, 
  DeliveryAnalytics, 
  QualityMetrics, 
  SupplyKPIs 
} from '@/services/supplyAnalyticsService';
import { toast } from '@/hooks/use-toast';

export const useSupplyAnalytics = () => {
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [deliveryAnalytics, setDeliveryAnalytics] = useState<DeliveryAnalytics[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    taux_acceptation_global: 0,
    taux_refus_par_fournisseur: [],
    evolution_qualite: [],
    alertes_qualite: []
  });
  const [supplyKPIs, setSupplyKPIs] = useState<SupplyKPIs>({
    cout_moyen_commande: 0,
    nombre_fournisseurs_actifs: 0,
    taux_disponibilite_stock: 0,
    rotation_stock_moyenne: 0,
    economies_realisees: 0,
    objectifs: {
      delai_livraison_cible: 7,
      taux_conformite_cible: 95,
      cout_cible: 2000000
    },
    performance_vs_objectifs: {
      delais: 0,
      qualite: 0,
      cout: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les performances des fournisseurs
  const loadSupplierPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const performance = await SupplyAnalyticsService.getSupplierPerformance();
      setSupplierPerformance(performance);
    } catch (err) {
      console.error('Erreur lors du chargement des performances fournisseurs:', err);
      setError('Impossible de charger les performances des fournisseurs');
      toast({
        title: "Erreur",
        description: "Impossible de charger les performances des fournisseurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les analyses des délais de livraison
  const loadDeliveryAnalytics = async (months: number = 6) => {
    try {
      setLoading(true);
      setError(null);
      const analytics = await SupplyAnalyticsService.getDeliveryAnalytics(months);
      setDeliveryAnalytics(analytics);
    } catch (err) {
      console.error('Erreur lors du chargement des analyses de délais:', err);
      setError('Impossible de charger les analyses de délais');
      toast({
        title: "Erreur",
        description: "Impossible de charger les analyses de délais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les métriques de qualité
  const loadQualityMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await SupplyAnalyticsService.getQualityMetrics();
      setQualityMetrics(metrics);
    } catch (err) {
      console.error('Erreur lors du chargement des métriques qualité:', err);
      setError('Impossible de charger les métriques de qualité');
      toast({
        title: "Erreur",
        description: "Impossible de charger les métriques de qualité",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les KPIs d'approvisionnement
  const loadSupplyKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const kpis = await SupplyAnalyticsService.getSupplyKPIs();
      setSupplyKPIs(kpis);
    } catch (err) {
      console.error('Erreur lors du chargement des KPIs:', err);
      setError('Impossible de charger les indicateurs de performance');
      toast({
        title: "Erreur",
        description: "Impossible de charger les indicateurs de performance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger toutes les données
  const loadAllAnalytics = async (deliveryMonths: number = 6) => {
    try {
      setLoading(true);
      await Promise.all([
        loadSupplierPerformance(),
        loadDeliveryAnalytics(deliveryMonths),
        loadQualityMetrics(),
        loadSupplyKPIs()
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement global des analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le top des fournisseurs
  const getTopSuppliers = (limit: number = 5): SupplierPerformance[] => {
    return supplierPerformance
      .filter(supplier => supplier.note_moyenne > 0)
      .sort((a, b) => b.note_moyenne - a.note_moyenne)
      .slice(0, limit);
  };

  // Obtenir les fournisseurs à problèmes
  const getProblematicSuppliers = (): SupplierPerformance[] => {
    return supplierPerformance.filter(supplier => 
      supplier.note_moyenne < 3 || 
      supplier.delai_moyen_livraison > 14 || 
      supplier.taux_conformite < 80
    );
  };

  // Calculer la tendance globale des délais
  const getDeliveryTrend = (): 'improving' | 'stable' | 'worsening' => {
    if (deliveryAnalytics.length < 2) return 'stable';
    
    const lastMonth = deliveryAnalytics[deliveryAnalytics.length - 1];
    const previousMonth = deliveryAnalytics[deliveryAnalytics.length - 2];
    
    if (lastMonth.delai_moyen < previousMonth.delai_moyen) return 'improving';
    if (lastMonth.delai_moyen > previousMonth.delai_moyen * 1.1) return 'worsening';
    return 'stable';
  };

  // Obtenir le score global de performance
  const getOverallPerformanceScore = (): number => {
    const { performance_vs_objectifs } = supplyKPIs;
    const scores = [
      performance_vs_objectifs.delais,
      performance_vs_objectifs.qualite,
      Math.min(100, performance_vs_objectifs.cout) // Limiter le score coût à 100
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Charger les données au montage
  useEffect(() => {
    loadAllAnalytics();
  }, []);

  return {
    // Données
    supplierPerformance,
    deliveryAnalytics,
    qualityMetrics,
    supplyKPIs,
    loading,
    error,
    
    // Actions
    loadSupplierPerformance,
    loadDeliveryAnalytics,
    loadQualityMetrics,
    loadSupplyKPIs,
    loadAllAnalytics,
    
    // Utilitaires d'analyse
    getTopSuppliers,
    getProblematicSuppliers,
    getDeliveryTrend,
    getOverallPerformanceScore,
    
    // Refresh global
    refresh: () => loadAllAnalytics()
  };
};