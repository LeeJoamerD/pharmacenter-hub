import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Types explicites pour éviter les erreurs TypeScript
type SalesMetrics = {
  todayTotal: number;
  variation: number;
  transactionsCount: number;
  monthlyTotal: number;
  averageBasket: number;
};

type SalesTrendData = {
  date: string;
  ventes: number;
  transactions: number;
};

type TopProduct = {
  produit_id: string;
  libelle: string;
  code_cip: string;
  quantite: number;
  ca: number;
};

type StockMetrics = {
  totalValue: number;
  availableProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

type ActiveSession = {
  id: string;
  solde_ouverture: number;
  currentAmount: number;
  salesCount: number;
  created_at: string;
  personnel?: any;
};

type CreditMetrics = {
  totalCredit: number;
  activeAccounts: number;
  overdueAmount: number;
  utilizationRate: number;
};

type PromotionMetrics = {
  activeCount: number;
  totalUsages: number;
  savingsToday: number;
};

type PaymentMethodData = {
  name: string;
  value: number;
  count: number;
};


export const useDashboardData = () => {
  const { tenantId } = useTenant();

  // 1. Métriques Ventes du Jour
  const salesMetricsQuery = useQuery<SalesMetrics | null>({
    queryKey: ['dashboard-sales-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const today = new Date();
      const yesterday = subDays(today, 1);

      // Ventes aujourd'hui
      const { data: todaySales, error: todayError } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString());

      if (todayError) throw todayError;

      // Ventes hier
      const { data: yesterdaySales } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(yesterday).toISOString())
        .lte('created_at', endOfDay(yesterday).toISOString());

      // CA mensuel
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: monthlySales } = await supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .gte('created_at', firstDayOfMonth.toISOString());

      const todayTotal = todaySales?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const yesterdayTotal = yesterdaySales?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const monthlyTotal = monthlySales?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
      const variation = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

      return {
        todayTotal,
        variation,
        transactionsCount: todaySales?.length || 0,
        monthlyTotal,
        averageBasket: todaySales?.length ? todayTotal / todaySales.length : 0,
      };
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
  });

  // 2. Évolution Ventes 7 Jours
  const salesTrendQuery = useQuery<SalesTrendData[]>({
    queryKey: ['dashboard-sales-trend', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const { data, error } = await supabase
        .from('ventes')
        .select('created_at, montant_net')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(subDays(new Date(), 6)).toISOString());

      if (error) throw error;

      return last7Days.map(dateStr => {
        const dayData = data?.filter(v => v.created_at?.startsWith(dateStr)) || [];
        return {
          date: dateStr,
          ventes: dayData.reduce((sum, v) => sum + (v.montant_net || 0), 0),
          transactions: dayData.length,
        };
      });
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
    staleTime: 180000,
  });

  // 3. Top 5 Produits Vendus
  const topProductsQuery = useQuery<TopProduct[]>({
    queryKey: ['dashboard-top-products', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const today = new Date();
      const { data, error } = await supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          prix_unitaire_ttc,
          produits(libelle_produit, code_cip)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString());

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, line: any) => {
        const id = line.produit_id;
        if (!acc[id]) {
          acc[id] = {
            produit_id: id,
            libelle: line.produits?.libelle_produit || 'Produit inconnu',
            code_cip: line.produits?.code_cip || '',
            quantite: 0,
            ca: 0,
          };
        }
        acc[id].quantite += line.quantite || 0;
        acc[id].ca += (line.quantite || 0) * (line.prix_unitaire_ttc || 0);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped)
        .sort((a: any, b: any) => b.ca - a.ca)
        .slice(0, 5) as any[];
    },
    enabled: !!tenantId,
    refetchInterval: 180000, // 3 minutes
    staleTime: 120000,
  });

  // 4. Métriques Stock
  const stockMetricsQuery = useQuery({
    queryKey: ['dashboard-stock-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data: products, error } = await supabase
        .from('produits')
        .select(`
          id,
          stock_actuel,
          prix_achat,
          lots(quantite_restante, prix_achat_unitaire)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error) throw error;

      let totalValue = 0;
      let available = 0;
      let lowStock = 0;
      let outOfStock = 0;

      (products || []).forEach((product: any) => {
        const stock = product.stock_actuel || 0;
        const lots = product.lots || [];
        const value = lots.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0), 0
        );
        
        totalValue += value;

        if (stock === 0) outOfStock++;
        else if (stock <= 10) lowStock++;
        else available++;
      });

      return {
        totalValue,
        availableProducts: available,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
      };
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
    staleTime: 180000,
  });

  // 5. Alertes Expiration Critiques (simplifiée)
  const expirationAlertsQuery = useQuery({
    queryKey: ['dashboard-expiration-alerts', tenantId],
    queryFn: async (): Promise<any[]> => {
      if (!tenantId) return [];

      try {
        const { data, error } = await supabase
          .from('alertes_peremption')
          .select('*')
          .eq('tenant_id', tenantId)
          .in('statut', ['active', 'en_cours'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching expiration alerts:', error);
          return [];
        }

        return data || [];
      } catch (e) {
        console.error('Exception fetching expiration alerts:', e);
        return [];
      }
    },
    enabled: !!tenantId,
    refetchInterval: 600000, // 10 minutes
    staleTime: 300000,
  });

  // 6. Sessions Caisse Actives
  const activeSessionsQuery = useQuery({
    queryKey: ['dashboard-active-sessions', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: sessions, error } = await supabase
        .from('sessions_caisse')
        .select(`
          id,
          solde_ouverture,
          statut,
          created_at,
          personnel(noms, prenoms)
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'ouverte');

      if (error) throw error;

      // Calculer montant actuel pour chaque session
      const sessionsWithAmount = await Promise.all(
        (sessions || []).map(async (session: any) => {
          const { data: ventes } = await supabase
            .from('ventes')
            .select('montant_net')
            .eq('session_caisse_id', session.id)
            .eq('tenant_id', tenantId);

          const ventesTotal = ventes?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
          
          return {
            ...session,
            currentAmount: (session.solde_ouverture || 0) + ventesTotal,
            salesCount: ventes?.length || 0,
          };
        })
      );

      return sessionsWithAmount;
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
  });

  // 7. Métriques Crédit
  const creditMetricsQuery = useQuery({
    queryKey: ['dashboard-credit-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data: clients, error } = await supabase
        .from('clients')
        .select('id')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const totalCredit = 0;
      const activeAccounts = clients?.length || 0;
      const totalLimit = 0;
      const utilizationRate = 0;
      const overdueAmount = 0;

      return {
        totalCredit,
        activeAccounts,
        overdueAmount,
        utilizationRate,
      };
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
    staleTime: 180000,
  });

  // 8. Promotions Actives
  const activePromotionsQuery = useQuery({
    queryKey: ['dashboard-active-promotions', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data: promotions, error } = await supabase
        .from('promotions')
        .select('id, nombre_utilisations')
        .eq('tenant_id', tenantId)
        .eq('est_actif', true)
        .lte('date_debut', today)
        .gte('date_fin', today);

      if (error) throw error;

      const { data: usagesToday } = await supabase
        .from('utilisations_promotion')
        .select('montant_remise')
        .eq('tenant_id', tenantId)
        .gte('date_utilisation', startOfDay(new Date()).toISOString());

      const savingsToday = usagesToday?.reduce((sum, u) => sum + (u.montant_remise || 0), 0) || 0;

      return {
        activeCount: promotions?.length || 0,
        totalUsages: promotions?.reduce((sum, p) => sum + (p.nombre_utilisations || 0), 0) || 0,
        savingsToday,
      };
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
    staleTime: 180000,
  });

  // 9. Modes de Paiement
  const paymentMethodsQuery = useQuery({
    queryKey: ['dashboard-payment-methods', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const today = new Date();
      const { data, error } = await supabase
        .from('ventes')
        .select('mode_paiement, montant_net')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString());

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, vente: any) => {
        const mode = vente.mode_paiement || 'Espèces';
        if (!acc[mode]) {
          acc[mode] = { name: mode, value: 0, count: 0 };
        }
        acc[mode].value += vente.montant_net || 0;
        acc[mode].count += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped) as any[];
    },
    enabled: !!tenantId,
    refetchInterval: 300000, // 5 minutes
    staleTime: 180000,
  });

  // 10. Activités Récentes
  const recentActivitiesQuery = useQuery({
    queryKey: ['dashboard-recent-activities', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, personnel(noms, prenoms)')
        .eq('tenant_id', tenantId)
        .in('action', ['INSERT', 'UPDATE', 'DELETE'])
        .in('table_name', ['ventes', 'receptions_fournisseurs', 'inventaires', 'sessions_caisse'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000,
  });

  // Refresh All
  const refreshAll = () => {
    salesMetricsQuery.refetch();
    salesTrendQuery.refetch();
    topProductsQuery.refetch();
    stockMetricsQuery.refetch();
    expirationAlertsQuery.refetch();
    activeSessionsQuery.refetch();
    creditMetricsQuery.refetch();
    activePromotionsQuery.refetch();
    paymentMethodsQuery.refetch();
    recentActivitiesQuery.refetch();
  };

  return {
    salesMetrics: salesMetricsQuery.data || null,
    salesTrend: (salesTrendQuery.data || []) as any[],
    topProducts: (topProductsQuery.data || []) as any[],
    stockMetrics: stockMetricsQuery.data || null,
    expirationAlerts: (expirationAlertsQuery.data || []) as any[],
    activeSessions: (activeSessionsQuery.data || []) as any[],
    creditMetrics: creditMetricsQuery.data || null,
    activePromotions: activePromotionsQuery.data || null,
    paymentMethods: (paymentMethodsQuery.data || []) as any[],
    recentActivities: (recentActivitiesQuery.data || []) as any[],
    isLoading: 
      salesMetricsQuery.isLoading ||
      salesTrendQuery.isLoading ||
      topProductsQuery.isLoading ||
      stockMetricsQuery.isLoading,
    refreshAll,
  };
};
