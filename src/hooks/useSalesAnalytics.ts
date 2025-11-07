import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

/**
 * ✅ SPRINT 3: Fonction utilitaire pour déterminer la limite adaptative
 * Évite la pagination Supabase par défaut à 1000 lignes
 */
export const getLimitForPeriod = (period: AnalyticsPeriod): number => {
  switch (period) {
    case 'day': 
      return 2000;   // ~200 ventes/heure max
    case 'week': 
      return 5000;   // ~700 ventes/jour max
    case 'month': 
      return 10000;  // ~300 ventes/jour max
    case 'year': 
      return 50000;  // ~150 ventes/jour max
    case 'custom': 
      return 20000;  // Valeur sécurisée pour périodes personnalisées
    default: 
      return 10000;
  }
};

export interface AnalyticsKPI {
  caTotal: number;
  caVariation: number;
  transactions: number;
  transactionsVariation: number;
  panierMoyen: number;
  panierMoyenVariation: number;
  clientsUniques: number;
  clientsUniquesVariation: number;
}

export interface RevenueEvolution {
  date: string;
  ventes: number;
  transactions: number;
  objectif?: number;
}

export interface TopProductAnalytics {
  produit_id: string;
  libelle: string;
  categorie: string;
  quantite: number;
  ca: number;
  marge: number;
  pourcentage_ca: number;
}

export interface PaymentMethodBreakdown {
  name: string;
  montant: number;
  pourcentage: number;
  transactions: number;
  color: string;
}

export interface StaffPerformanceData {
  agent_id: string;
  nom: string;
  ca: number;
  transactions: number;
  panier_moyen: number;
  performance: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AnalyticsFilters {
  categories?: string[];
  paymentMethods?: string[];
  agents?: string[];
  saleTypes?: string[];
}

/**
 * Hook principal pour les analytics de ventes
 * Connecté à la base de données Supabase
 */
export const useSalesAnalytics = (
  period: AnalyticsPeriod = 'month',
  customDateRange?: { start: Date; end: Date },
  filters?: AnalyticsFilters
) => {
  const { tenantId } = useTenant();

  // Calcul des plages de dates
  const getDateRange = () => {
    if (period === 'custom' && customDateRange) {
      return {
        current: { start: startOfDay(customDateRange.start), end: endOfDay(customDateRange.end) },
        previous: {
          start: subDays(startOfDay(customDateRange.start), (customDateRange.end.getTime() - customDateRange.start.getTime()) / (1000 * 60 * 60 * 24)),
          end: subDays(endOfDay(customDateRange.end), (customDateRange.end.getTime() - customDateRange.start.getTime()) / (1000 * 60 * 60 * 24))
        }
      };
    }

    const now = new Date();
    switch (period) {
      case 'day':
        return {
          current: { start: startOfDay(now), end: endOfDay(now) },
          previous: { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) }
        };
      case 'week':
        return {
          current: { start: startOfWeek(now, { locale: fr }), end: endOfWeek(now, { locale: fr }) },
          previous: { start: startOfWeek(subWeeks(now, 1), { locale: fr }), end: endOfWeek(subWeeks(now, 1), { locale: fr }) }
        };
      case 'month':
        return {
          current: { start: startOfMonth(now), end: endOfMonth(now) },
          previous: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
        };
      case 'year':
        return {
          current: { start: startOfYear(now), end: endOfYear(now) },
          previous: { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) }
        };
      default:
        return {
          current: { start: startOfMonth(now), end: endOfMonth(now) },
          previous: { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }
        };
    }
  };

  const dateRange = getDateRange();

  // Récupérer les KPIs principaux
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['sales-analytics-kpis', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<AnalyticsKPI> => {
      // ✅ SPRINT 3: Limite adaptative basée sur la période
      const limit = getLimitForPeriod(period);

      // Ventes période courante
      let currentQuery = supabase
        .from('ventes')
        .select('montant_total_ttc, client_id', { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('date_vente', dateRange.current.start.toISOString())
        .lte('date_vente', dateRange.current.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      // Appliquer les filtres
      if (filters?.agents && filters.agents.length > 0) {
        currentQuery = currentQuery.in('agent_id', filters.agents);
      }
      if (filters?.saleTypes && filters.saleTypes.length > 0) {
        currentQuery = currentQuery.in('type_vente', filters.saleTypes as Array<'Comptant' | 'Crédit' | 'Assurance'>);
      }

      const { data: currentSales, count: currentCount } = await currentQuery;

      // Ventes période précédente
      let previousQuery = supabase
        .from('ventes')
        .select('montant_total_ttc, client_id', { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('date_vente', dateRange.previous.start.toISOString())
        .lte('date_vente', dateRange.previous.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      if (filters?.agents && filters.agents.length > 0) {
        previousQuery = previousQuery.in('agent_id', filters.agents);
      }
      if (filters?.saleTypes && filters.saleTypes.length > 0) {
        previousQuery = previousQuery.in('type_vente', filters.saleTypes as Array<'Comptant' | 'Crédit' | 'Assurance'>);
      }

      const { data: previousSales, count: previousCount } = await previousQuery;

      // Calculs
      const caTotal = currentSales?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const caPrevious = previousSales?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const caVariation = caPrevious > 0 ? ((caTotal - caPrevious) / caPrevious) * 100 : 0;

      const transactions = currentCount || 0;
      const transactionsPrevious = previousCount || 0;
      const transactionsVariation = transactionsPrevious > 0 ? ((transactions - transactionsPrevious) / transactionsPrevious) * 100 : 0;

      const panierMoyen = transactions > 0 ? caTotal / transactions : 0;
      const panierMoyenPrevious = transactionsPrevious > 0 ? caPrevious / transactionsPrevious : 0;
      const panierMoyenVariation = panierMoyenPrevious > 0 ? ((panierMoyen - panierMoyenPrevious) / panierMoyenPrevious) * 100 : 0;

      const clientsUniques = new Set(currentSales?.filter(v => v.client_id).map(v => v.client_id)).size;
      const clientsUniquesPrevious = new Set(previousSales?.filter(v => v.client_id).map(v => v.client_id)).size;
      const clientsUniquesVariation = clientsUniquesPrevious > 0 ? ((clientsUniques - clientsUniquesPrevious) / clientsUniquesPrevious) * 100 : 0;

      return {
        caTotal,
        caVariation,
        transactions,
        transactionsVariation,
        panierMoyen,
        panierMoyenVariation,
        clientsUniques,
        clientsUniquesVariation,
      };
    },
    enabled: !!tenantId,
  });

  // Récupérer l'évolution du CA
  const { data: revenueEvolution, isLoading: revenueLoading } = useQuery({
    queryKey: ['sales-analytics-revenue-evolution', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<RevenueEvolution[]> => {
      // ✅ SPRINT 3: Limite adaptative basée sur la période
      const limit = getLimitForPeriod(period);

      let query = supabase
        .from('ventes')
        .select('created_at, montant_total_ttc')
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('created_at', dateRange.current.start.toISOString())
        .lte('created_at', dateRange.current.end.toISOString())
        .order('created_at', { ascending: true })
        .limit(limit); // ✅ AJOUTÉ

      if (filters?.agents && filters.agents.length > 0) {
        query = query.in('agent_id', filters.agents);
      }

      const { data } = await query;

      // Grouper par date
      const grouped = new Map<string, { ventes: number; transactions: number }>();
      
      data?.forEach(sale => {
        const dateKey = format(new Date(sale.created_at), period === 'day' ? 'HH:00' : 'dd/MM/yyyy', { locale: fr });
        const existing = grouped.get(dateKey);
        if (existing) {
          existing.ventes += sale.montant_total_ttc || 0;
          existing.transactions += 1;
        } else {
          grouped.set(dateKey, { ventes: sale.montant_total_ttc || 0, transactions: 1 });
        }
      });

      return Array.from(grouped.entries()).map(([date, data]) => ({
        date,
        ventes: data.ventes,
        transactions: data.transactions,
      }));
    },
    enabled: !!tenantId,
  });

  // Récupérer les top produits
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['sales-analytics-top-products', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<TopProductAnalytics[]> => {
      // ✅ SPRINT 3: Limite x2 pour lignes_ventes (plusieurs lignes par vente)
      const limit = getLimitForPeriod(period) * 2;

      let query = supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          montant_ligne_ttc,
          montant_ligne_ht,
          vente:vente_id(created_at, agent_id),
          produit:produit_id(libelle_produit, categorie)
        `)
        .eq('tenant_id', tenantId!)
        .gte('vente.created_at', dateRange.current.start.toISOString())
        .lte('vente.created_at', dateRange.current.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      const { data } = await query;

      // Agréger par produit
      const products = new Map<string, TopProductAnalytics>();
      let totalCA = 0;

      data?.forEach((ligne: any) => {
        if (!ligne.vente || !ligne.produit) return;

        totalCA += ligne.montant_ligne_ttc || 0;

        const existing = products.get(ligne.produit_id);
        const marge = ligne.montant_ligne_ht > 0 
          ? ((ligne.montant_ligne_ttc - ligne.montant_ligne_ht) / ligne.montant_ligne_ht) * 100 
          : 0;

        if (existing) {
          existing.quantite += ligne.quantite || 0;
          existing.ca += ligne.montant_ligne_ttc || 0;
          existing.marge = (existing.marge + marge) / 2;
        } else {
          products.set(ligne.produit_id, {
            produit_id: ligne.produit_id,
            libelle: ligne.produit?.libelle_produit || 'Inconnu',
            categorie: ligne.produit?.categorie || 'Autre',
            quantite: ligne.quantite || 0,
            ca: ligne.montant_ligne_ttc || 0,
            marge,
            pourcentage_ca: 0,
          });
        }
      });

      // Calculer pourcentages et trier
      const result = Array.from(products.values())
        .map(p => ({ ...p, pourcentage_ca: totalCA > 0 ? (p.ca / totalCA) * 100 : 0 }))
        .sort((a, b) => b.ca - a.ca)
        .slice(0, 10);

      return result;
    },
    enabled: !!tenantId,
  });

  // Récupérer la répartition des modes de paiement
  const { data: paymentMethods, isLoading: paymentsLoading } = useQuery({
    queryKey: ['sales-analytics-payment-methods', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<PaymentMethodBreakdown[]> => {
      // ✅ SPRINT 3: Limite adaptative basée sur la période
      const limit = getLimitForPeriod(period);

      let query = supabase
        .from('ventes')
        .select('mode_paiement, montant_total_ttc')
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('created_at', dateRange.current.start.toISOString())
        .lte('created_at', dateRange.current.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      if (filters?.agents && filters.agents.length > 0) {
        query = query.in('agent_id', filters.agents);
      }

      const { data } = await query;

      const methods = new Map<string, { montant: number; transactions: number }>();
      let total = 0;

      data?.forEach(sale => {
        const method = sale.mode_paiement || 'Espèces';
        const existing = methods.get(method);
        total += sale.montant_total_ttc || 0;

        if (existing) {
          existing.montant += sale.montant_total_ttc || 0;
          existing.transactions += 1;
        } else {
          methods.set(method, { montant: sale.montant_total_ttc || 0, transactions: 1 });
        }
      });

      const colors: Record<string, string> = {
        'Espèces': '#8884d8',
        'Carte': '#82ca9d',
        'Mobile Money': '#ffc658',
        'Assurance': '#ff7300',
      };

      return Array.from(methods.entries()).map(([name, data]) => ({
        name,
        montant: data.montant,
        pourcentage: total > 0 ? (data.montant / total) * 100 : 0,
        transactions: data.transactions,
        color: colors[name] || '#999999',
      }));
    },
    enabled: !!tenantId,
  });

  // Récupérer la performance du personnel
  const { data: staffPerformance, isLoading: staffLoading } = useQuery({
    queryKey: ['sales-analytics-staff-performance', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<StaffPerformanceData[]> => {
      // ✅ SPRINT 3: Limite adaptative basée sur la période
      const limit = getLimitForPeriod(period);

      let query = supabase
        .from('ventes')
        .select(`
          agent_id,
          montant_total_ttc,
          agent:agent_id(noms, prenoms)
        `)
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('created_at', dateRange.current.start.toISOString())
        .lte('created_at', dateRange.current.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      if (filters?.agents && filters.agents.length > 0) {
        query = query.in('agent_id', filters.agents);
      }

      const { data } = await query;

      const agents = new Map<string, StaffPerformanceData>();

      data?.forEach((sale: any) => {
        if (!sale.agent_id) return;

        const existing = agents.get(sale.agent_id);
        if (existing) {
          existing.ca += sale.montant_total_ttc || 0;
          existing.transactions += 1;
        } else {
          agents.set(sale.agent_id, {
            agent_id: sale.agent_id,
            nom: sale.agent ? `${sale.agent.noms} ${sale.agent.prenoms}` : 'Inconnu',
            ca: sale.montant_total_ttc || 0,
            transactions: 1,
            panier_moyen: 0,
            performance: 0,
          });
        }
      });

      // Calculer moyennes et performances
      const maxCA = Math.max(...Array.from(agents.values()).map(a => a.ca), 1);
      
      return Array.from(agents.values())
        .map(agent => ({
          ...agent,
          panier_moyen: agent.transactions > 0 ? agent.ca / agent.transactions : 0,
          performance: maxCA > 0 ? (agent.ca / maxCA) * 100 : 0,
        }))
        .sort((a, b) => b.ca - a.ca);
    },
    enabled: !!tenantId,
  });

  // Récupérer la répartition par catégorie
  const { data: categoryBreakdown, isLoading: categoriesLoading } = useQuery({
    queryKey: ['sales-analytics-categories', tenantId, period, customDateRange, filters],
    queryFn: async (): Promise<CategoryBreakdown[]> => {
      // ✅ SPRINT 3: Limite x2 pour lignes_ventes (plusieurs lignes par vente)
      const limit = getLimitForPeriod(period) * 2;

      let query = supabase
        .from('lignes_ventes')
        .select(`
          montant_ligne_ttc,
          produit:produit_id(categorie),
          vente:vente_id(created_at)
        `)
        .eq('tenant_id', tenantId!)
        .gte('vente.created_at', dateRange.current.start.toISOString())
        .lte('vente.created_at', dateRange.current.end.toISOString())
        .limit(limit); // ✅ AJOUTÉ

      const { data } = await query;

      const categories = new Map<string, number>();
      let total = 0;

      data?.forEach((ligne: any) => {
        if (!ligne.vente || !ligne.produit) return;

        const category = ligne.produit.categorie || 'Autre';
        const montant = ligne.montant_ligne_ttc || 0;
        
        categories.set(category, (categories.get(category) || 0) + montant);
        total += montant;
      });

      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a78bfa'];

      return Array.from(categories.entries())
        .map(([name, value], index) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!tenantId,
  });

  return {
    kpis,
    kpisLoading,
    revenueEvolution,
    revenueLoading,
    topProducts,
    productsLoading,
    paymentMethods,
    paymentsLoading,
    staffPerformance,
    staffLoading,
    categoryBreakdown,
    categoriesLoading,
    isLoading: kpisLoading || revenueLoading || productsLoading || paymentsLoading || staffLoading || categoriesLoading,
  };
};
