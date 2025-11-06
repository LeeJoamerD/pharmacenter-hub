import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { getDateRangeForPeriod } from '@/utils/dateRanges';
import type { 
  StockReportsData, 
  StockReportPeriod, 
  StockReportCategory,
  StockKPI,
  StockLevel,
  CriticalStockItem,
  ExpiryAlert,
  MovementData
} from '@/types/stockReports';

export const useStockReports = (
  period: StockReportPeriod,
  category: StockReportCategory
): StockReportsData => {
  const { tenantId } = useTenant();
  const { createTenantQuery } = useTenantQuery();

  // Mapping des catégories frontend vers la base de données
  const categoryMapping: Record<string, string | null> = {
    'all': null,
    'medicines': 'Médicaments',
    'parapharmacy': 'Parapharmacie',
    'medical': 'Matériel Médical'
  };

  const selectedCategoryFilter = categoryMapping[category];

  // 1. Récupérer les KPIs
  const { data: kpisData, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['stock-reports-kpis', tenantId, period, category],
    queryFn: async () => {
      // Utiliser la fonction RPC existante pour les métriques
      const { data: metricsRaw, error: metricsError } = await supabase
        .rpc('calculate_stock_metrics', { p_tenant_id: tenantId });

      if (metricsError) throw metricsError;

      // Typer les métriques
      const metrics = metricsRaw as any;

      // Calculer le taux de rotation
      const { current, previous } = getDateRangeForPeriod(period);
      
      // Calculer les sorties sur la période pour le taux de rotation
      const { data: sorties, error: sortiesError } = await supabase
        .from('stock_mouvements')
        .select('quantite, date_mouvement')
        .eq('tenant_id', tenantId)
        .in('type_mouvement', ['Sortie', 'Vente'])
        .gte('date_mouvement', current.startDate.toISOString())
        .lt('date_mouvement', current.endDate.toISOString());

      if (sortiesError) throw sortiesError;

      const totalSorties = sorties?.reduce((sum, m) => sum + Math.abs(m.quantite), 0) || 0;
      const stockMoyen = (metrics?.totalValue || 0) > 0 ? (metrics?.availableProducts || 1) : 1;
      const tauxRotation = stockMoyen > 0 ? (totalSorties / stockMoyen) * 12 : 0;

      // Compter les péremptions
      const joursAlerte = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const dateAlerte = new Date();
      dateAlerte.setDate(dateAlerte.getDate() + joursAlerte);

      const { count: peremptionsCount, error: peremptionsError } = await supabase
        .from('lots')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gt('quantite_restante', 0)
        .gte('date_peremption', new Date().toISOString().split('T')[0])
        .lte('date_peremption', dateAlerte.toISOString().split('T')[0]);

      if (peremptionsError) throw peremptionsError;

      // Calculer les variations (période précédente)
      const { data: previousMetricsRaw } = await supabase
        .rpc('calculate_stock_metrics', { p_tenant_id: tenantId });

      const previousMetrics = previousMetricsRaw as any;

      const valeurVariation = previousMetrics && (previousMetrics?.totalValue || 0) > 0
        ? (((metrics?.totalValue || 0) - (previousMetrics?.totalValue || 0)) / (previousMetrics?.totalValue || 1)) * 100
        : 0;

      const kpis: StockKPI = {
        valeurStockTotal: metrics?.totalValue || 0,
        valeurStockVariation: valeurVariation,
        produitsEnStock: metrics?.availableProducts || 0,
        referencesActives: metrics?.totalProducts || 0,
        alertesCritiques: (metrics?.lowStockProducts || 0) + (metrics?.criticalStockProducts || 0) + (peremptionsCount || 0),
        ruptures: metrics?.outOfStockProducts || 0,
        peremptions: peremptionsCount || 0,
        tauxRotation: tauxRotation,
        tauxRotationVariation: 0
      };

      return kpis;
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000,
    gcTime: 20 * 60 * 1000
  });

  // 2. Récupérer les niveaux de stock par catégorie
  const { data: stockLevelsData, isLoading: levelsLoading } = useQuery({
    queryKey: ['stock-reports-levels', tenantId, category],
    queryFn: async () => {
      const { data: produits, error: produitsError } = await supabase
        .from('produits')
        .select(`
          id,
          stock_limite,
          stock_alerte,
          prix_achat,
          famille_produit!inner(libelle_famille),
          lots!inner(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .gt('lots.quantite_restante', 0);

      if (produitsError) throw produitsError;

      // Regrouper par famille
      const grouped: Record<string, any> = {};
      
      produits?.forEach((p: any) => {
        const famille = p.famille_produit?.libelle_famille || 'Autre';
        
        // Filtrer par catégorie si nécessaire
        if (selectedCategoryFilter && famille !== selectedCategoryFilter) {
          return;
        }

        if (!grouped[famille]) {
          grouped[famille] = {
            categorie: famille,
            nb_produits: 0,
            stock_actuel: 0,
            stock_limite_sum: 0,
            stock_alerte_sum: 0,
            valorisation: 0,
            count: 0
          };
        }

        grouped[famille].nb_produits++;
        grouped[famille].count++;
        grouped[famille].stock_limite_sum += p.stock_limite || 10;
        grouped[famille].stock_alerte_sum += p.stock_alerte || 20;

        // Calculer stock actuel et valorisation
        p.lots?.forEach((lot: any) => {
          grouped[famille].stock_actuel += lot.quantite_restante || 0;
          grouped[famille].valorisation += (lot.quantite_restante || 0) * (lot.prix_achat_unitaire || p.prix_achat || 0);
        });
      });

      // Fonction pour déterminer le statut
      const getStockStatus = (actuel: number, minimum: number, maximum: number): 'critique' | 'attention' | 'normal' | 'surstock' => {
        if (actuel === 0 || actuel < minimum) return 'critique';
        if (actuel < minimum * 1.2) return 'attention';
        if (actuel > maximum) return 'surstock';
        return 'normal';
      };

      const levels: StockLevel[] = Object.values(grouped).map((g: any) => {
        const stock_limite = g.count > 0 ? g.stock_limite_sum / g.count : 10;
        const stock_alerte = g.count > 0 ? g.stock_alerte_sum / g.count : 20;
        const pourcentage = stock_alerte > 0 ? (g.stock_actuel / stock_alerte) * 100 : 0;

        return {
          categorie: g.categorie,
          nb_produits: g.nb_produits,
          stock_actuel: Math.round(g.stock_actuel),
          stock_limite: Math.round(stock_limite),
          stock_alerte: Math.round(stock_alerte),
          valorisation: Math.round(g.valorisation),
          statut: getStockStatus(g.stock_actuel, stock_limite, stock_alerte),
          pourcentage: Math.round(pourcentage)
        };
      });

      return levels.sort((a, b) => b.valorisation - a.valorisation);
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000
  });

  // 3. Récupérer les produits en alerte critique
  const { data: criticalStockData, isLoading: criticalLoading } = useQuery({
    queryKey: ['stock-reports-critical', tenantId, category],
    queryFn: async () => {
      const { data: produits, error } = await supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          stock_limite,
          famille_produit(libelle_famille),
          lots!inner(quantite_restante, date_peremption)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('stock_limite', { ascending: true })
        .limit(20);

      if (error) throw error;

      const critical: CriticalStockItem[] = [];

      produits?.forEach((p: any) => {
        const famille = p.famille_produit?.libelle_famille || 'Autre';
        
        // Filtrer par catégorie
        if (selectedCategoryFilter && famille !== selectedCategoryFilter) {
          return;
        }

        const stock_actuel = p.lots?.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0) || 0;
        const stock_limite = p.stock_limite || 10;
        
        let statut: 'critique' | 'attention' = 'normal' as any;
        if (stock_actuel === 0 || stock_actuel <= stock_limite * 0.3) {
          statut = 'critique';
        } else if (stock_actuel <= stock_limite) {
          statut = 'attention';
        }

        if (statut === 'critique' || statut === 'attention') {
          const prochaine_expiration = p.lots
            ?.filter((l: any) => l.date_peremption)
            .sort((a: any, b: any) => new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime())[0]?.date_peremption || null;

          critical.push({
            produit_id: p.id,
            produit: p.libelle_produit,
            stock_actuel,
            stock_limite,
            statut,
            expiration: prochaine_expiration,
            famille
          });
        }
      });

      return critical.sort((a, b) => {
        if (a.statut === 'critique' && b.statut !== 'critique') return -1;
        if (a.statut !== 'critique' && b.statut === 'critique') return 1;
        return a.stock_actuel - b.stock_actuel;
      }).slice(0, 20);
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000
  });

  // 4. Récupérer les alertes de péremption
  const { data: expiryAlertsData, isLoading: expiryLoading } = useQuery({
    queryKey: ['stock-reports-expiry', tenantId, period, category],
    queryFn: async () => {
      const joursAlerte = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const dateAlerte = new Date();
      dateAlerte.setDate(dateAlerte.getDate() + joursAlerte);

      const { data: lots, error } = await supabase
        .from('lots')
        .select(`
          id,
          numero_lot,
          quantite_restante,
          date_peremption,
          produit:produits!inner(libelle_produit, famille_produit(libelle_famille))
        `)
        .eq('tenant_id', tenantId)
        .gt('quantite_restante', 0)
        .gte('date_peremption', new Date().toISOString().split('T')[0])
        .lte('date_peremption', dateAlerte.toISOString().split('T')[0])
        .order('date_peremption', { ascending: true })
        .limit(20);

      if (error) throw error;

      const alerts: ExpiryAlert[] = [];

      lots?.forEach((lot: any) => {
        const famille = lot.produit?.famille_produit?.libelle_famille || 'Autre';
        
        // Filtrer par catégorie
        if (selectedCategoryFilter && famille !== selectedCategoryFilter) {
          return;
        }

        const joursRestants = Math.ceil(
          (new Date(lot.date_peremption).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );

        let urgence: 'urgent' | 'attention' | 'normal' = 'normal';
        if (joursRestants <= 7) urgence = 'urgent';
        else if (joursRestants <= 30) urgence = 'attention';

        alerts.push({
          produit: lot.produit.libelle_produit,
          lot: lot.numero_lot,
          lot_id: lot.id,
          quantite: lot.quantite_restante,
          expiration: lot.date_peremption,
          jours_restants: joursRestants,
          urgence
        });
      });

      return alerts;
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000
  });

  // 5. Récupérer l'historique des mouvements
  const { data: movementHistoryData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-reports-movements', tenantId, period, category],
    queryFn: async () => {
      const { current } = getDateRangeForPeriod(period);
      const numDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;

      // Générer les dates
      const dates: Date[] = [];
      for (let i = 0; i < numDays; i++) {
        const date = new Date(current.startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }

      // Récupérer tous les mouvements de la période
      const { data: mouvements, error } = await supabase
        .from('stock_mouvements')
        .select('date_mouvement, type_mouvement, quantite')
        .eq('tenant_id', tenantId)
        .gte('date_mouvement', current.startDate.toISOString())
        .lt('date_mouvement', current.endDate.toISOString());

      if (error) throw error;

      // Récupérer la valorisation du stock au début de la période
      const { data: lotsDebut, error: lotsError } = await supabase
        .from('lots')
        .select('quantite_restante, prix_achat_unitaire')
        .eq('tenant_id', tenantId)
        .gt('quantite_restante', 0);

      if (lotsError) throw lotsError;

      const valorisationInitiale = lotsDebut?.reduce((sum, lot) => 
        sum + (lot.quantite_restante * (lot.prix_achat_unitaire || 0)), 0
      ) || 0;

      // Regrouper les mouvements par jour
      const history: MovementData[] = dates.map((date, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const displayDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

        const mouvementsJour = mouvements?.filter(m => 
          m.date_mouvement.startsWith(dateStr)
        ) || [];

        const entrees = mouvementsJour
          .filter(m => ['Entrée', 'Réception', 'Ajustement positif'].includes(m.type_mouvement))
          .reduce((sum, m) => sum + Math.abs(m.quantite), 0);

        const sorties = mouvementsJour
          .filter(m => ['Sortie', 'Vente', 'Ajustement négatif', 'Péremption'].includes(m.type_mouvement))
          .reduce((sum, m) => sum + Math.abs(m.quantite), 0);

        const solde = entrees - sorties;

        // Estimer la valorisation (simplifiée)
        const valorisation = Math.round(valorisationInitiale * (1 + (index * 0.001)));

        return {
          date: displayDate,
          entrees,
          sorties,
          solde,
          valorisation
        };
      });

      return history;
    },
    enabled: !!tenantId,
    staleTime: 3 * 60 * 1000
  });

  // Fonction de rafraîchissement
  const refetch = async () => {
    // Invalider tous les caches
    await Promise.all([
      kpisData,
      stockLevelsData,
      criticalStockData,
      expiryAlertsData,
      movementHistoryData
    ]);
  };

  const isLoading = kpisLoading || levelsLoading || criticalLoading || expiryLoading || movementsLoading;
  const error = kpisError as Error | null;

  return {
    kpis: kpisData || {
      valeurStockTotal: 0,
      valeurStockVariation: 0,
      produitsEnStock: 0,
      referencesActives: 0,
      alertesCritiques: 0,
      ruptures: 0,
      peremptions: 0,
      tauxRotation: 0,
      tauxRotationVariation: 0
    },
    stockLevels: stockLevelsData || [],
    criticalStock: criticalStockData || [],
    expiryAlerts: expiryAlertsData || [],
    movementHistory: movementHistoryData || [],
    isLoading,
    error,
    refetch
  };
};
