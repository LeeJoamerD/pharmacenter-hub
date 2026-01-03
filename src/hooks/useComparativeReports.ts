import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrencyFormatting } from '@/hooks/useCurrencyFormatting';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface ComparisonMetric {
  title: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface TemporalComparison {
  period: string;
  currentValue: number;
  previousValue: number;
  variance: number;
  variancePercent: number;
}

export interface CategoryComparison {
  category: string;
  currentSales: number;
  previousSales: number;
  growth: number;
  contribution: number;
}

export interface AgentComparison {
  agentId: string;
  agentName: string;
  currentSales: number;
  previousSales: number;
  growth: number;
  transactions: number;
  avgBasket: number;
}

export interface VarianceAnalysis {
  metric: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
}

type ComparisonPeriod = 'month' | 'quarter' | 'year';

export const useComparativeReports = (period: ComparisonPeriod = 'month') => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;
  const { formatAmount, formatNumber } = useCurrencyFormatting();

  const today = new Date();

  const getDateRanges = (periodType: ComparisonPeriod) => {
    switch (periodType) {
      case 'month':
        return {
          current: { start: startOfMonth(today), end: today },
          previous: { start: startOfMonth(subMonths(today, 1)), end: endOfMonth(subMonths(today, 1)) }
        };
      case 'quarter':
        return {
          current: { start: subDays(today, 90), end: today },
          previous: { start: subDays(today, 180), end: subDays(today, 91) }
        };
      case 'year':
        return {
          current: { start: startOfYear(today), end: today },
          previous: { start: startOfYear(subYears(today, 1)), end: endOfYear(subYears(today, 1)) }
        };
    }
  };

  const dateRanges = getDateRanges(period);

  // Métriques de comparaison principales
  const metricsQuery = useQuery({
    queryKey: ['comparative-metrics', tenantId, period],
    queryFn: async (): Promise<ComparisonMetric[]> => {
      if (!tenantId) return [];

      // Ventes période courante
      const { data: currentSales } = await (supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(dateRanges.current.start, 'yyyy-MM-dd'))
        .lte('date_vente', format(dateRanges.current.end, 'yyyy-MM-dd')) as any);

      // Ventes période précédente
      const { data: previousSales } = await (supabase
        .from('ventes')
        .select('montant_net')
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(dateRanges.previous.start, 'yyyy-MM-dd'))
        .lte('date_vente', format(dateRanges.previous.end, 'yyyy-MM-dd')) as any);

      const currentCA = (currentSales as any[])?.reduce((sum: number, v: any) => sum + (v.montant_net || 0), 0) || 0;
      const previousCA = (previousSales as any[])?.reduce((sum: number, v: any) => sum + (v.montant_net || 0), 0) || 0;
      const caChange = currentCA - previousCA;
      const caChangePercent = previousCA > 0 ? (caChange / previousCA * 100) : 0;

      const currentTransactions = (currentSales as any[])?.length || 0;
      const previousTransactions = (previousSales as any[])?.length || 0;
      const transChange = currentTransactions - previousTransactions;
      const transChangePercent = previousTransactions > 0 ? (transChange / previousTransactions * 100) : 0;

      const currentAvgBasket = currentTransactions > 0 ? currentCA / currentTransactions : 0;
      const previousAvgBasket = previousTransactions > 0 ? previousCA / previousTransactions : 0;
      const basketChange = currentAvgBasket - previousAvgBasket;
      const basketChangePercent = previousAvgBasket > 0 ? (basketChange / previousAvgBasket * 100) : 0;

      // Clients uniques
      const currentClients = new Set((currentSales as any[])?.map((v: any) => v.montant_net).filter(Boolean)).size;
      const previousClients = new Set((previousSales as any[])?.map((v: any) => v.montant_net).filter(Boolean)).size;

      return [
        {
          title: "Chiffre d'Affaires",
          current: currentCA,
          previous: previousCA,
          change: caChange,
          changePercent: caChangePercent,
          trend: caChange >= 0 ? 'up' : 'down',
          period: period === 'month' ? 'Ce mois vs mois précédent' : 
                  period === 'quarter' ? 'Ce trimestre vs trimestre précédent' : 
                  'Cette année vs année précédente'
        },
        {
          title: 'Nombre de Transactions',
          current: currentTransactions,
          previous: previousTransactions,
          change: transChange,
          changePercent: transChangePercent,
          trend: transChange >= 0 ? 'up' : 'down',
          period: period === 'month' ? 'Ce mois vs mois précédent' : 
                  period === 'quarter' ? 'Ce trimestre vs trimestre précédent' : 
                  'Cette année vs année précédente'
        },
        {
          title: 'Panier Moyen',
          current: currentAvgBasket,
          previous: previousAvgBasket,
          change: basketChange,
          changePercent: basketChangePercent,
          trend: basketChange >= 0 ? 'up' : 'down',
          period: period === 'month' ? 'Ce mois vs mois précédent' : 
                  period === 'quarter' ? 'Ce trimestre vs trimestre précédent' : 
                  'Cette année vs année précédente'
        }
      ];
    },
    enabled: !!tenantId
  });

  // Comparaison temporelle détaillée
  const temporalQuery = useQuery({
    queryKey: ['comparative-temporal', tenantId, period],
    queryFn: async (): Promise<TemporalComparison[]> => {
      if (!tenantId) return [];

      const comparisons: TemporalComparison[] = [];
      const periods = period === 'month' ? 6 : period === 'quarter' ? 4 : 3;

      for (let i = 0; i < periods; i++) {
        const currentStart = subMonths(startOfMonth(today), i);
        const currentEnd = endOfMonth(currentStart);
        const previousStart = subMonths(currentStart, 1);
        const previousEnd = endOfMonth(previousStart);

        const [currentData, previousData] = await Promise.all([
          supabase
            .from('ventes')
            .select('montant_net')
            .eq('tenant_id', tenantId)
            .eq('statut', 'Validée')
            .gte('date_vente', format(currentStart, 'yyyy-MM-dd'))
            .lte('date_vente', format(currentEnd, 'yyyy-MM-dd')),
          supabase
            .from('ventes')
            .select('montant_net')
            .eq('tenant_id', tenantId)
            .eq('statut', 'Validée')
            .gte('date_vente', format(previousStart, 'yyyy-MM-dd'))
            .lte('date_vente', format(previousEnd, 'yyyy-MM-dd'))
        ]);

        const currentValue = currentData.data?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
        const previousValue = previousData.data?.reduce((sum, v) => sum + (v.montant_net || 0), 0) || 0;
        const variance = currentValue - previousValue;
        const variancePercent = previousValue > 0 ? (variance / previousValue * 100) : 0;

        comparisons.push({
          period: format(currentStart, 'MMM yyyy'),
          currentValue,
          previousValue,
          variance,
          variancePercent
        });
      }

      return comparisons.reverse();
    },
    enabled: !!tenantId
  });

  // Comparaison par catégorie
  const categoryQuery = useQuery({
    queryKey: ['comparative-categories', tenantId, period],
    queryFn: async (): Promise<CategoryComparison[]> => {
      if (!tenantId) return [];

      // Récupérer les ventes avec familles de produits
      const { data: currentSales } = await supabase
        .from('lignes_ventes')
        .select(`
          montant_ligne,
          produits(famille_produit_id, famille_produit(libelle_famille)),
          ventes!inner(tenant_id, statut, date_vente)
        `)
        .eq('ventes.tenant_id', tenantId)
        .eq('ventes.statut', 'Validée')
        .gte('ventes.date_vente', format(dateRanges.current.start, 'yyyy-MM-dd'))
        .lte('ventes.date_vente', format(dateRanges.current.end, 'yyyy-MM-dd'));

      const { data: previousSales } = await supabase
        .from('lignes_ventes')
        .select(`
          montant_ligne,
          produits(famille_produit_id, famille_produit(libelle_famille)),
          ventes!inner(tenant_id, statut, date_vente)
        `)
        .eq('ventes.tenant_id', tenantId)
        .eq('ventes.statut', 'Validée')
        .gte('ventes.date_vente', format(dateRanges.previous.start, 'yyyy-MM-dd'))
        .lte('ventes.date_vente', format(dateRanges.previous.end, 'yyyy-MM-dd'));

      // Grouper par catégorie
      const currentByCategory = new Map<string, number>();
      const previousByCategory = new Map<string, number>();

      (currentSales as any[])?.forEach(ligne => {
        const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
        currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + (ligne.montant_ligne || 0));
      });

      (previousSales as any[])?.forEach(ligne => {
        const cat = ligne.produits?.famille_produit?.libelle_famille || 'Autre';
        previousByCategory.set(cat, (previousByCategory.get(cat) || 0) + (ligne.montant_ligne || 0));
      });

      const totalCurrent = Array.from(currentByCategory.values()).reduce((a, b) => a + b, 0) || 1;

      const allCategories = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);
      
      return Array.from(allCategories).map(category => {
        const current = currentByCategory.get(category) || 0;
        const previous = previousByCategory.get(category) || 0;
        const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;
        
        return {
          category,
          currentSales: current,
          previousSales: previous,
          growth,
          contribution: (current / totalCurrent * 100)
        };
      }).sort((a, b) => b.currentSales - a.currentSales);
    },
    enabled: !!tenantId
  });

  // Comparaison par agent/vendeur
  const agentQuery = useQuery({
    queryKey: ['comparative-agents', tenantId, period],
    queryFn: async (): Promise<AgentComparison[]> => {
      if (!tenantId) return [];

      const { data: currentSales } = await supabase
        .from('ventes')
        .select(`
          id,
          montant_net,
          agent_id,
          personnel!ventes_agent_id_fkey(id, noms, prenoms)
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(dateRanges.current.start, 'yyyy-MM-dd'))
        .lte('date_vente', format(dateRanges.current.end, 'yyyy-MM-dd'));

      const { data: previousSales } = await supabase
        .from('ventes')
        .select(`
          montant_net,
          agent_id
        `)
        .eq('tenant_id', tenantId)
        .eq('statut', 'Validée')
        .gte('date_vente', format(dateRanges.previous.start, 'yyyy-MM-dd'))
        .lte('date_vente', format(dateRanges.previous.end, 'yyyy-MM-dd'));

      // Grouper par agent
      const currentByAgent = new Map<string, { sales: number; transactions: number; name: string }>();
      const previousByAgent = new Map<string, number>();

      (currentSales as any[])?.forEach(v => {
        const agentId = v.agent_id || 'unknown';
        const existing = currentByAgent.get(agentId) || { sales: 0, transactions: 0, name: '' };
        existing.sales += v.montant_net || 0;
        existing.transactions++;
        if (v.personnel) {
          existing.name = `${v.personnel.prenoms || ''} ${v.personnel.noms || ''}`.trim() || 'Agent';
        }
        currentByAgent.set(agentId, existing);
      });

      previousSales?.forEach(v => {
        const agentId = v.agent_id || 'unknown';
        previousByAgent.set(agentId, (previousByAgent.get(agentId) || 0) + (v.montant_net || 0));
      });

      return Array.from(currentByAgent.entries()).map(([agentId, data]) => {
        const previous = previousByAgent.get(agentId) || 0;
        const growth = previous > 0 ? ((data.sales - previous) / previous * 100) : 0;
        
        return {
          agentId,
          agentName: data.name || 'Agent',
          currentSales: data.sales,
          previousSales: previous,
          growth,
          transactions: data.transactions,
          avgBasket: data.transactions > 0 ? data.sales / data.transactions : 0
        };
      }).sort((a, b) => b.currentSales - a.currentSales);
    },
    enabled: !!tenantId
  });

  // Analyse de variance
  const varianceQuery = useQuery({
    queryKey: ['comparative-variance', tenantId, period],
    queryFn: async (): Promise<VarianceAnalysis[]> => {
      if (!tenantId) return [];

      const metrics = metricsQuery.data;
      if (!metrics) return [];

      return metrics.map(m => {
        // Budget estimé = valeur précédente + 5% de croissance attendue
        const budgeted = m.previous * 1.05;
        const variance = m.current - budgeted;
        const variancePercent = budgeted > 0 ? (variance / budgeted * 100) : 0;
        
        return {
          metric: m.title,
          budgeted,
          actual: m.current,
          variance,
          variancePercent,
          status: variance >= 0 ? 'favorable' as const : 'unfavorable' as const
        };
      });
    },
    enabled: !!tenantId && !metricsQuery.isLoading
  });

  const isLoading = metricsQuery.isLoading || temporalQuery.isLoading;

  return {
    metrics: metricsQuery.data || [],
    temporal: temporalQuery.data || [],
    categories: categoryQuery.data || [],
    agents: agentQuery.data || [],
    variance: varianceQuery.data || [],
    isLoading,
    error: metricsQuery.error as Error | null,
    refetch: () => {
      metricsQuery.refetch();
      temporalQuery.refetch();
      categoryQuery.refetch();
      agentQuery.refetch();
      varianceQuery.refetch();
    }
  };
};
