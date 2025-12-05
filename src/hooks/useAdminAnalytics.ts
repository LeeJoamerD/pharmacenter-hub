import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAlertSettings } from '@/hooks/useAlertSettings';
import { getStockThresholds, calculateStockStatus } from '@/utils/stockThresholds';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export type AdminAnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface AdminKPI {
  chiffreAffaires: number;
  chiffreAffairesVariation: number;
  nombreVentes: number;
  nombreVentesVariation: number;
  produitsEnStock: number;
  produitsEnStockVariation: number;
  clientsActifs: number;
  clientsActifsVariation: number;
}

export interface SalesEvolutionData {
  label: string;
  ventes: number;
  couts: number;
  profit: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface KeyIndicator {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  margin: number;
}

export interface StockCategoryLevel {
  category: string;
  stock: number;
  alerte: number;
}

export interface StockAlert {
  name: string;
  level: number;
  status: 'critique' | 'bas' | 'moyen';
  productId: string;
}

export interface ProfitTrendData {
  label: string;
  profit: number;
  objectif?: number;
}

const CATEGORY_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a78bfa', '#f472b6', '#34d399'];

/**
 * Hook principal pour les analytics d'administration
 * Connecté à la base de données Supabase avec support multi-tenant
 */
export const useAdminAnalytics = (period: AdminAnalyticsPeriod = 'month') => {
  const { tenantId, currentTenant } = useTenant();
  const { settings } = useAlertSettings();

  // Calcul des plages de dates selon la période
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
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
      case 'quarter':
        const quarterStart = startOfMonth(subMonths(now, 2));
        return {
          current: { start: quarterStart, end: endOfMonth(now) },
          previous: { start: startOfMonth(subMonths(quarterStart, 3)), end: endOfMonth(subMonths(quarterStart, 1)) }
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

  // ========== KPIs Principaux ==========
  const kpisQuery = useQuery({
    queryKey: ['admin-analytics-kpis', tenantId, period],
    queryFn: async (): Promise<AdminKPI> => {
      // Ventes période courante
      const { data: currentSales, count: currentCount } = await supabase
        .from('ventes')
        .select('montant_total_ttc, client_id', { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('date_vente', dateRange.current.start.toISOString())
        .lte('date_vente', dateRange.current.end.toISOString());

      // Ventes période précédente
      const { data: previousSales, count: previousCount } = await supabase
        .from('ventes')
        .select('montant_total_ttc, client_id', { count: 'exact' })
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('date_vente', dateRange.previous.start.toISOString())
        .lte('date_vente', dateRange.previous.end.toISOString());

      // Produits en stock
      const { count: currentProductCount } = await supabase
        .from('produits')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId!)
        .eq('is_active', true);

      // Estimation produits période précédente (approximation)
      const previousProductCount = currentProductCount || 0;

      // Calculs
      const caTotal = currentSales?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const caPrevious = previousSales?.reduce((sum, v) => sum + (v.montant_total_ttc || 0), 0) || 0;
      const caVariation = caPrevious > 0 ? ((caTotal - caPrevious) / caPrevious) * 100 : 0;

      const nombreVentes = currentCount || 0;
      const nombreVentesPrevious = previousCount || 0;
      const nombreVentesVariation = nombreVentesPrevious > 0 ? ((nombreVentes - nombreVentesPrevious) / nombreVentesPrevious) * 100 : 0;

      const clientsActifs = new Set(currentSales?.filter(v => v.client_id).map(v => v.client_id)).size;
      const clientsActifsPrevious = new Set(previousSales?.filter(v => v.client_id).map(v => v.client_id)).size;
      const clientsActifsVariation = clientsActifsPrevious > 0 ? ((clientsActifs - clientsActifsPrevious) / clientsActifsPrevious) * 100 : 0;

      // Produits en stock avec quantité > 0
      const { count: produitsEnStock } = await supabase
        .from('produits_with_stock')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId!)
        .eq('is_active', true)
        .gt('stock_actuel', 0);

      return {
        chiffreAffaires: caTotal,
        chiffreAffairesVariation: caVariation,
        nombreVentes,
        nombreVentesVariation,
        produitsEnStock: produitsEnStock || 0,
        produitsEnStockVariation: 0, // Difficile à calculer sans historique
        clientsActifs,
        clientsActifsVariation,
      };
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Évolution des Ventes ==========
  const salesEvolutionQuery = useQuery({
    queryKey: ['admin-analytics-sales-evolution', tenantId, period],
    queryFn: async (): Promise<SalesEvolutionData[]> => {
      const { data: ventes } = await supabase
        .from('ventes')
        .select('date_vente, montant_total_ttc')
        .eq('tenant_id', tenantId!)
        .eq('statut', 'Validée')
        .gte('date_vente', dateRange.current.start.toISOString())
        .lte('date_vente', dateRange.current.end.toISOString())
        .order('date_vente', { ascending: true });

      // Récupérer les lignes de ventes pour calculer les coûts
      const { data: lignesVentes } = await supabase
        .from('lignes_ventes')
        .select(`
          montant_ligne_ttc,
          quantite,
          prix_unitaire_ht,
          ventes!vente_id(date_vente, statut, tenant_id)
        `)
        .eq('tenant_id', tenantId!);

      // Grouper par période
      const grouped = new Map<string, { ventes: number; couts: number }>();
      
      // Générer les labels selon la période
      let dateLabels: string[] = [];
      if (period === 'week') {
        dateLabels = eachDayOfInterval({ start: dateRange.current.start, end: dateRange.current.end })
          .map(d => format(d, 'EEE', { locale: fr }));
      } else if (period === 'month') {
        dateLabels = eachDayOfInterval({ start: dateRange.current.start, end: dateRange.current.end })
          .filter((_, i) => i % 3 === 0) // Tous les 3 jours
          .map(d => format(d, 'dd/MM', { locale: fr }));
      } else if (period === 'quarter') {
        dateLabels = eachWeekOfInterval({ start: dateRange.current.start, end: dateRange.current.end })
          .map(d => format(d, "'S'w", { locale: fr }));
      } else {
        dateLabels = eachMonthOfInterval({ start: dateRange.current.start, end: dateRange.current.end })
          .map(d => format(d, 'MMM', { locale: fr }));
      }

      // Initialiser
      dateLabels.forEach(label => grouped.set(label, { ventes: 0, couts: 0 }));

      // Agréger les ventes
      ventes?.forEach(vente => {
        const date = new Date(vente.date_vente);
        let label: string;
        if (period === 'week') {
          label = format(date, 'EEE', { locale: fr });
        } else if (period === 'month') {
          label = format(date, 'dd/MM', { locale: fr });
        } else if (period === 'quarter') {
          label = format(date, "'S'w", { locale: fr });
        } else {
          label = format(date, 'MMM', { locale: fr });
        }
        
        const existing = grouped.get(label);
        if (existing) {
          existing.ventes += vente.montant_total_ttc || 0;
        }
      });

      // Estimer les coûts (environ 60% du CA pour une pharmacie)
      return Array.from(grouped.entries()).map(([label, data]) => ({
        label,
        ventes: Math.round(data.ventes),
        couts: Math.round(data.ventes * 0.6),
        profit: Math.round(data.ventes * 0.4),
      }));
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Répartition par Catégorie ==========
  const categoryDistributionQuery = useQuery({
    queryKey: ['admin-analytics-category-distribution', tenantId, period],
    queryFn: async (): Promise<CategoryDistribution[]> => {
      const { data: lignes } = await supabase
        .from('lignes_ventes')
        .select(`
          montant_ligne_ttc,
          produits!produit_id(
            categorie_tarification:categorie_tarification_id(libelle_categorie)
          ),
          ventes!vente_id(date_vente, statut, tenant_id)
        `)
        .eq('tenant_id', tenantId!);

      const categories = new Map<string, { value: number; count: number }>();

      lignes?.forEach((ligne: any) => {
        if (!ligne.ventes || ligne.ventes.statut !== 'Validée') return;
        const dateVente = new Date(ligne.ventes.date_vente);
        if (dateVente < dateRange.current.start || dateVente > dateRange.current.end) return;

        const categoryName = ligne.produits?.categorie_tarification?.libelle_categorie || 'Autre';
        const existing = categories.get(categoryName);
        
        if (existing) {
          existing.value += ligne.montant_ligne_ttc || 0;
          existing.count += 1;
        } else {
          categories.set(categoryName, { value: ligne.montant_ligne_ttc || 0, count: 1 });
        }
      });

      return Array.from(categories.entries())
        .map(([name, data], index) => ({
          name,
          value: Math.round((data.value / Array.from(categories.values()).reduce((sum, d) => sum + d.value, 0)) * 100) || 0,
          count: data.count,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Indicateurs Clés ==========
  const keyIndicatorsQuery = useQuery({
    queryKey: ['admin-analytics-key-indicators', tenantId, period],
    queryFn: async (): Promise<KeyIndicator[]> => {
      // Taux de rotation stock
      const { data: mouvements } = await supabase
        .from('stock_mouvements')
        .select('id')
        .eq('tenant_id', tenantId!)
        .eq('type_mouvement', 'sortie')
        .gte('created_at', dateRange.current.start.toISOString())
        .lte('created_at', dateRange.current.end.toISOString());

      const { count: totalProducts } = await supabase
        .from('produits')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId!)
        .eq('is_active', true);

      const rotationStock = totalProducts && totalProducts > 0 
        ? Math.min(((mouvements?.length || 0) / totalProducts) * 12, 15) 
        : 0;

      // Marge brute moyenne
      const { data: lignesVentes } = await supabase
        .from('lignes_ventes')
        .select('montant_ligne_ttc, prix_unitaire_ht, quantite')
        .eq('tenant_id', tenantId!);

      let totalVentes = 0;
      let totalCouts = 0;
      lignesVentes?.forEach(ligne => {
        totalVentes += ligne.montant_ligne_ttc || 0;
        totalCouts += (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
      });

      const margeBrute = totalVentes > 0 ? ((totalVentes - totalCouts) / totalVentes) * 100 : 0;

      // Satisfaction client (basé sur retours)
      // Satisfaction client estimée (basé sur taux de retour standard)
      const tauxSatisfaction = 95; // Valeur par défaut - peut être calculée avec table retours si disponible

      return [
        {
          label: 'Taux de rotation stock',
          value: rotationStock,
          percentage: Math.min((rotationStock / 12) * 100, 100),
          color: 'bg-primary',
        },
        {
          label: 'Marge brute moyenne',
          value: margeBrute,
          percentage: Math.min(margeBrute, 100),
          color: 'bg-green-500',
        },
        {
          label: 'Satisfaction client',
          value: tauxSatisfaction,
          percentage: tauxSatisfaction,
          color: 'bg-blue-500',
        },
      ];
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Top Produits ==========
  const topProductsQuery = useQuery({
    queryKey: ['admin-analytics-top-products', tenantId, period],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data: lignes } = await supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          montant_ligne_ttc,
          prix_unitaire_ht,
          produits!produit_id(libelle_produit, prix_achat),
          ventes!vente_id(date_vente, statut, tenant_id)
        `)
        .eq('tenant_id', tenantId!);

      const products = new Map<string, { name: string; sales: number; revenue: number; cost: number }>();

      lignes?.forEach((ligne: any) => {
        if (!ligne.ventes || ligne.ventes.statut !== 'Validée') return;
        const dateVente = new Date(ligne.ventes.date_vente);
        if (dateVente < dateRange.current.start || dateVente > dateRange.current.end) return;

        const productName = ligne.produits?.libelle_produit || 'Inconnu';
        const existing = products.get(ligne.produit_id);
        const cost = (ligne.produits?.prix_achat || ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);

        if (existing) {
          existing.sales += ligne.quantite || 0;
          existing.revenue += ligne.montant_ligne_ttc || 0;
          existing.cost += cost;
        } else {
          products.set(ligne.produit_id, {
            name: productName,
            sales: ligne.quantite || 0,
            revenue: ligne.montant_ligne_ttc || 0,
            cost,
          });
        }
      });

      return Array.from(products.values())
        .map(p => ({
          name: p.name,
          sales: p.sales,
          revenue: Math.round(p.revenue),
          margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Tendance des Profits ==========
  const profitTrendQuery = useQuery({
    queryKey: ['admin-analytics-profit-trend', tenantId, period],
    queryFn: async (): Promise<ProfitTrendData[]> => {
      // Réutiliser les données de salesEvolution et calculer le profit
      const evolution = salesEvolutionQuery.data || [];
      return evolution.map(e => ({
        label: e.label,
        profit: e.profit,
        objectif: e.ventes > 0 ? Math.round(e.ventes * 0.45) : undefined, // Objectif = 45% de marge
      }));
    },
    enabled: !!tenantId && !!salesEvolutionQuery.data,
    staleTime: 60000,
  });

  // ========== Niveaux de Stock par Catégorie ==========
  const stockLevelsQuery = useQuery({
    queryKey: ['admin-analytics-stock-levels', tenantId, settings],
    queryFn: async (): Promise<StockCategoryLevel[]> => {
      // Charger les produits avec pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits_with_stock')
          .select(`
            id, stock_actuel, stock_limite,
            famille_produit:famille_id(libelle_famille)
          `)
          .eq('tenant_id', tenantId!)
          .eq('is_active', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Grouper par famille/catégorie
      const categories = new Map<string, { stock: number; limite: number; count: number }>();

      allProducts.forEach((product: any) => {
        const categoryName = product.famille_produit?.libelle_famille || 'Autre';
        const existing = categories.get(categoryName);
        const stockActuel = product.stock_actuel || 0;
        const stockLimite = product.stock_limite || settings?.maximum_stock_threshold || 10;

        if (existing) {
          existing.stock += stockActuel;
          existing.limite += stockLimite;
          existing.count += 1;
        } else {
          categories.set(categoryName, { stock: stockActuel, limite: stockLimite, count: 1 });
        }
      });

      return Array.from(categories.entries())
        .map(([category, data]) => ({
          category,
          stock: data.count > 0 ? Math.round((data.stock / data.count)) : 0,
          alerte: data.count > 0 ? Math.round((data.limite / data.count)) : 10,
        }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 8);
    },
    enabled: !!tenantId,
    staleTime: 60000,
  });

  // ========== Alertes Stock ==========
  const stockAlertsQuery = useQuery({
    queryKey: ['admin-analytics-stock-alerts', tenantId, settings],
    queryFn: async (): Promise<StockAlert[]> => {
      // Charger les produits avec pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: products, error } = await supabase
          .from('produits_with_stock')
          .select('id, libelle_produit, stock_actuel, stock_critique, stock_faible, stock_limite')
          .eq('tenant_id', tenantId!)
          .eq('is_active', true)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (products && products.length > 0) {
          allProducts = [...allProducts, ...products];
          hasMore = products.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      const alerts: StockAlert[] = [];

      allProducts.forEach(product => {
        const stock = product.stock_actuel || 0;
        const thresholds = getStockThresholds(
          {
            stock_critique: product.stock_critique,
            stock_faible: product.stock_faible,
            stock_limite: product.stock_limite,
          },
          settings
        );

        const status = calculateStockStatus(stock, thresholds);

        if (status === 'critique' || status === 'rupture') {
          alerts.push({
            name: product.libelle_produit,
            level: stock,
            status: 'critique',
            productId: product.id,
          });
        } else if (status === 'faible') {
          alerts.push({
            name: product.libelle_produit,
            level: stock,
            status: 'bas',
            productId: product.id,
          });
        }
      });

      return alerts
        .sort((a, b) => {
          if (a.status === 'critique' && b.status !== 'critique') return -1;
          if (a.status !== 'critique' && b.status === 'critique') return 1;
          return a.level - b.level;
        })
        .slice(0, 10);
    },
    enabled: !!tenantId && !!settings,
    staleTime: 60000,
  });

  const isLoading = kpisQuery.isLoading || salesEvolutionQuery.isLoading || categoryDistributionQuery.isLoading;

  return {
    // KPIs
    kpis: kpisQuery.data,
    kpisLoading: kpisQuery.isLoading,

    // Vue d'ensemble
    salesEvolution: salesEvolutionQuery.data || [],
    salesEvolutionLoading: salesEvolutionQuery.isLoading,
    
    categoryDistribution: categoryDistributionQuery.data || [],
    categoryDistributionLoading: categoryDistributionQuery.isLoading,
    
    keyIndicators: keyIndicatorsQuery.data || [],
    keyIndicatorsLoading: keyIndicatorsQuery.isLoading,

    // Ventes
    topProducts: topProductsQuery.data || [],
    topProductsLoading: topProductsQuery.isLoading,
    
    profitTrend: profitTrendQuery.data || [],
    profitTrendLoading: profitTrendQuery.isLoading,

    // Inventaire
    stockLevels: stockLevelsQuery.data || [],
    stockLevelsLoading: stockLevelsQuery.isLoading,
    
    stockAlerts: stockAlertsQuery.data || [],
    stockAlertsLoading: stockAlertsQuery.isLoading,

    // État global
    isLoading,
    tenantName: currentTenant?.name || 'Pharmacie',
    dateRange,

    // Refetch functions
    refetchAll: () => {
      kpisQuery.refetch();
      salesEvolutionQuery.refetch();
      categoryDistributionQuery.refetch();
      keyIndicatorsQuery.refetch();
      topProductsQuery.refetch();
      stockLevelsQuery.refetch();
      stockAlertsQuery.refetch();
    },
  };
};
