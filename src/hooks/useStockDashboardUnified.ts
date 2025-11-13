import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface StockMetricsUnified {
  // Métriques globales
  totalProduits: number;
  disponibles: number;
  critiques: number;
  ruptures: number;
  faibles: number;
  surstock: number;
  expirationProche: number;
  commandesEnCours: number;
  mouvementsRecents: number;
  valeurStock: number;
  
  // Distribution des statuts
  statusDistribution?: {
    rupture: number;
    critique: number;
    faible: number;
    normal: number;
    surstock: number;
    total: number;
  };
}

export interface CriticalProduct {
  produit_id: string;
  libelle_produit: string;
  code_cip: string;
  stock_actuel: number;
  stock_limite: number;
  statut_stock: string;
  famille_libelle: string;
  valeur_stock: number;
  rotation: string;
}

export interface FastMovingProduct {
  produit_id: string;
  libelle_produit: string;
  code_cip: string;
  quantite_vendue: number;
  stock_actuel: number;
  rotation_jours: number;
  valeur_vendue: number;
}

export interface StockAlert {
  alert_id: string;
  alert_type: string;
  alert_level: 'error' | 'warning' | 'info';
  produit_id: string;
  produit_nom: string;
  message: string;
  stock_actuel: number;
  created_at: string;
}

export interface FamilyValorization {
  famille: string;
  valeur: number;
  quantite: number;
  pourcentage: number;
  nb_produits: number;
}

export interface MovementData {
  date: string;
  entrees: number;
  sorties: number;
  solde: number;
}

export interface RotationByFamilyData {
  categorie: string;
  tauxRotation: number;
  dureeEcoulement: number;
  valeurStock: number;
  statut: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique';
}

/**
 * Hook central unifié pour le dashboard Stock
 * Agrège toutes les données nécessaires avec cache partagé
 */
export const useStockDashboardUnified = (
  dateFilter?: { start: Date; end: Date }
) => {
  const { tenantId } = useTenant();

  // Par défaut, 30 derniers jours
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const filterStart = dateFilter?.start || defaultStart;
  const filterEnd = dateFilter?.end || defaultEnd;

  // 1. MÉTRIQUES GLOBALES (via RPC optimisée existante)
  const metricsQuery = useQuery({
    queryKey: ['stock-dashboard-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      // Utiliser la RPC get_dashboard_stock_metrics existante
      const { data: baseMetrics, error: metricsError } = await supabase
        .rpc('get_dashboard_stock_metrics', { tenant_filter: tenantId });

      if (metricsError) throw metricsError;

      // Cast explicite du type
      const metricsData = baseMetrics as any;

      // Enrichir avec données complémentaires en parallèle
      const [expiringResult, ordersResult, movementsResult] = await Promise.all([
        // Produits expirant < 30j
        supabase
          .from('lots')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0)
          .gte('date_peremption', new Date().toISOString())
          .lte('date_peremption', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),

        // Commandes en cours
        supabase
          .from('commandes_fournisseurs')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .in('statut', ['En cours', 'Confirmé']),

        // Mouvements dernières 24h
        supabase
          .from('stock_mouvements')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('date_mouvement', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1000) // Pagination sécurisée
      ]);

      const metrics: StockMetricsUnified = {
        totalProduits: metricsData?.totalProducts || 0,
        disponibles: metricsData?.availableProducts || 0,
        critiques: metricsData?.criticalStockProducts || 0,
        ruptures: metricsData?.outOfStockProducts || 0,
        faibles: metricsData?.lowStockProducts || 0,
        surstock: metricsData?.overstockProducts || 0,
        expirationProche: expiringResult.count || 0,
        commandesEnCours: ordersResult.count || 0,
        mouvementsRecents: movementsResult.count || 0,
        valeurStock: metricsData?.totalValue || 0
      };

      return metrics;
    },
    staleTime: 2 * 60 * 1000, // Cache 2min
    enabled: !!tenantId
  });

  // 2. DISTRIBUTION DES STATUTS (via nouvelle RPC)
  const statusDistributionQuery = useQuery({
    queryKey: ['stock-status-distribution', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .rpc('get_stock_status_distribution', { p_tenant_id: tenantId });

      if (error) throw error;
      return data as StockMetricsUnified['statusDistribution'];
    },
    staleTime: 3 * 60 * 1000, // Cache 3min
    enabled: !!tenantId
  });

  // 3. PRODUITS CRITIQUES (Top 10 via nouvelle RPC)
  const criticalProductsQuery = useQuery({
    queryKey: ['stock-critical-products', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .rpc('get_top_critical_products', { 
          p_tenant_id: tenantId,
          p_limit: 10 
        });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!tenantId
  });

  // 4. PRODUITS EN RUPTURE (Direct query limitée)
  const ruptureProductsQuery = useQuery({
    queryKey: ['stock-rupture-products', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .from('produits_with_stock')
        .select(`
          id,
          libelle_produit,
          code_cip,
          stock_actuel,
          prix_achat,
          famille_produit!fk_produits_famille_id(libelle_famille)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('stock_actuel', 0)
        .order('libelle_produit')
        .limit(10);

      if (error) throw error;
      
      return (data || []).map(p => ({
        produit_id: p.id,
        libelle_produit: p.libelle_produit,
        code_cip: p.code_cip || '',
        stock_actuel: 0,
        stock_limite: 0,
        statut_stock: 'rupture',
        famille_libelle: (p.famille_produit as any)?.libelle_famille || 'Non classé',
        valeur_stock: 0
      }));
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!tenantId
  });

  // 5. PRODUITS À ROTATION RAPIDE (via nouvelle RPC)
  const fastMovingQuery = useQuery({
    queryKey: ['stock-fast-moving', tenantId, filterStart, filterEnd],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const daysDiff = Math.ceil((filterEnd.getTime() - filterStart.getTime()) / (1000 * 60 * 60 * 24));

      const { data, error } = await supabase
        .rpc('get_fast_moving_products', { 
          p_tenant_id: tenantId,
          p_days: daysDiff,
          p_limit: 10 
        });

      if (error) throw error;
      return (data as FastMovingProduct[]) || [];
    },
    staleTime: 5 * 60 * 1000, // Cache 5min (moins critique)
    enabled: !!tenantId
  });

  // 6. ALERTES ACTIVES (Top 5 via nouvelle RPC)
  const activeAlertsQuery = useQuery({
    queryKey: ['stock-active-alerts', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .rpc('get_active_stock_alerts', { 
          p_tenant_id: tenantId,
          p_limit: 5 
        });

      if (error) throw error;
      return (data as StockAlert[]) || [];
    },
    staleTime: 1 * 60 * 1000, // Cache 1min (données temps réel)
    enabled: !!tenantId
  });

  // 7. VALORISATION PAR FAMILLE
  const valorisationByFamilyQuery = useQuery({
    queryKey: ['stock-valorisation-by-family', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .rpc('calculate_valuation_by_family', { p_tenant_id: tenantId });

      if (error) throw error;
      
      // Le résultat est un JSONB array, on le parse
      const result = (data as any) || [];
      return result.slice(0, 10) as FamilyValorization[]; // Top 10 familles
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId
  });

  // 8. ÉVOLUTION DES MOUVEMENTS (selon filtre de date)
  const movementsEvolutionQuery = useQuery({
    queryKey: ['stock-movements-evolution', tenantId, filterStart, filterEnd],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      const { data, error } = await supabase
        .from('stock_mouvements')
        .select('date_mouvement, type_mouvement, quantite')
        .eq('tenant_id', tenantId)
        .gte('date_mouvement', filterStart.toISOString())
        .lte('date_mouvement', filterEnd.toISOString())
        .order('date_mouvement');

      if (error) throw error;

      // Agréger par jour
      const movementsByDay = new Map<string, { entrees: number; sorties: number }>();
      
      (data || []).forEach(movement => {
        const date = movement.date_mouvement.split('T')[0];
        const current = movementsByDay.get(date) || { entrees: 0, sorties: 0 };
        
        if (movement.type_mouvement === 'ENTREE') {
          current.entrees += movement.quantite;
        } else if (movement.type_mouvement === 'SORTIE') {
          current.sorties += movement.quantite;
        }
        
        movementsByDay.set(date, current);
      });

      // Convertir en tableau et calculer le solde cumulé
      const result: MovementData[] = [];
      let solde = 0;
      
      Array.from(movementsByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, movements]) => {
          solde += movements.entrees - movements.sorties;
          result.push({
            date,
            entrees: movements.entrees,
            sorties: movements.sorties,
            solde
          });
        });

      return result;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId
  });

  // 9. ROTATION DES STOCKS PAR FAMILLE
  const rotationByFamilyQuery = useQuery({
    queryKey: ['stock-rotation-by-family', tenantId, filterStart, filterEnd],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID requis');

      // Récupérer produits avec stock et ventes
      const [productsResult, salesResult] = await Promise.all([
        supabase
          .from('produits_with_stock')
          .select(`
            id,
            libelle_produit,
            famille_id,
            famille_produit!fk_produits_famille_id(libelle_famille),
            stock_actuel,
            prix_achat
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        
        supabase
          .from('lignes_ventes')
          .select('produit_id, quantite')
          .eq('tenant_id', tenantId)
          .gte('created_at', filterStart.toISOString())
          .lte('created_at', filterEnd.toISOString())
      ]);

      if (productsResult.error) throw productsResult.error;
      if (salesResult.error) throw salesResult.error;

      // Import dynamic pour éviter les cycles de dépendances
      const { StockRotationService } = await import('@/services/StockRotationService');

      // Calculer rotation par famille
      const rotationData = StockRotationService.calculateByFamily(
        productsResult.data || [],
        salesResult.data || [],
        { start: filterStart, end: filterEnd }
      );

      return rotationData;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId
  });

  // État de chargement global
  const isLoading = 
    metricsQuery.isLoading || 
    statusDistributionQuery.isLoading ||
    criticalProductsQuery.isLoading ||
    ruptureProductsQuery.isLoading ||
    fastMovingQuery.isLoading ||
    activeAlertsQuery.isLoading ||
    valorisationByFamilyQuery.isLoading ||
    movementsEvolutionQuery.isLoading ||
    rotationByFamilyQuery.isLoading;

  // Première erreur rencontrée
  const error = 
    metricsQuery.error || 
    statusDistributionQuery.error ||
    criticalProductsQuery.error ||
    ruptureProductsQuery.error ||
    fastMovingQuery.error ||
    activeAlertsQuery.error ||
    valorisationByFamilyQuery.error ||
    movementsEvolutionQuery.error ||
    rotationByFamilyQuery.error;

  // Fonction de rafraîchissement global
  const refetchAll = async () => {
    await Promise.all([
      metricsQuery.refetch(),
      statusDistributionQuery.refetch(),
      criticalProductsQuery.refetch(),
      ruptureProductsQuery.refetch(),
      fastMovingQuery.refetch(),
      activeAlertsQuery.refetch(),
      valorisationByFamilyQuery.refetch(),
      movementsEvolutionQuery.refetch(),
      rotationByFamilyQuery.refetch()
    ]);
  };

  return {
    // Données
    metrics: {
      ...metricsQuery.data,
      statusDistribution: statusDistributionQuery.data
    },
    criticalProducts: criticalProductsQuery.data || [],
    ruptureProducts: ruptureProductsQuery.data || [],
    fastMovingProducts: fastMovingQuery.data || [],
    activeAlerts: activeAlertsQuery.data || [],
    valorisationByFamily: valorisationByFamilyQuery.data || [],
    movementsEvolution: movementsEvolutionQuery.data || [],
    rotationByFamily: rotationByFamilyQuery.data || [],
    
    // États
    isLoading,
    error: error as Error | null,
    
    // Actions
    refetchAll
  };
};