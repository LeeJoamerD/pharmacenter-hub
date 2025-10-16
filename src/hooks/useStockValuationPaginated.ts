import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useDebouncedValue } from '@/hooks/use-debounce';

export interface StockValuationItem {
  id: string;
  tenant_id: string;
  code_cip: string;
  libelle_produit: string;
  famille_id?: string;
  famille_libelle?: string;
  rayon_id?: string;
  rayon_libelle?: string;
  prix_achat: number;
  prix_vente_ttc: number;
  stock_actuel: number;
  stock_limite: number;
  stock_alerte: number;
  valeur_stock: number;
  statut_stock: 'disponible' | 'faible' | 'rupture';
  rotation: 'rapide' | 'normale' | 'lente';
  date_derniere_entree?: string;
  date_derniere_sortie?: string;
}

export interface ValuationByCategory {
  id: string;
  name: string;
  value: number;
  quantity: number;
  percentage: number;
  productCount: number;
}

export interface StockValuationMetrics {
  totalStockValue: number;
  availableStockValue: number;
  lowStockValue: number;
  averageValuePerProduct: number;
  totalProducts: number;
  availableProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export type ValuationSortField = 
  | 'libelle_produit' 
  | 'code_cip' 
  | 'stock_actuel' 
  | 'prix_achat' 
  | 'valeur_stock' 
  | 'statut_stock'
  | 'rotation';

export type ValuationSortDirection = 'asc' | 'desc';

interface UseStockValuationPaginatedParams {
  searchTerm: string;
  statusFilter: string;
  rotationFilter: string;
  sortField: ValuationSortField;
  sortDirection: ValuationSortDirection;
  currentPage: number;
  itemsPerPage: number;
}

interface UseStockValuationPaginatedReturn {
  valuationItems: StockValuationItem[];
  allItemsCount: number;
  totalPages: number;
  metrics: StockValuationMetrics;
  valuationByFamily: ValuationByCategory[];
  valuationByRayon: ValuationByCategory[];
  topValueProducts: StockValuationItem[];
  isLoading: boolean;
  error: string | null;
}

export const useStockValuationPaginated = ({
  searchTerm,
  statusFilter,
  rotationFilter,
  sortField,
  sortDirection,
  currentPage,
  itemsPerPage
}: UseStockValuationPaginatedParams): UseStockValuationPaginatedReturn => {
  const { tenantId } = useTenant();
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'stock-valuation-paginated-v2',
      tenantId,
      debouncedSearchTerm,
      statusFilter,
      rotationFilter,
      sortField,
      sortDirection,
      currentPage,
      itemsPerPage
    ],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      // 1. Récupérer les métriques globales via RPC
      const { data: metricsData } = await supabase
        .rpc('calculate_valuation_metrics', { p_tenant_id: tenantId });

      const metricsJson = metricsData as any;
      const metrics: StockValuationMetrics = metricsJson ? {
        totalStockValue: parseFloat(metricsJson.totalStockValue?.toString() || '0'),
        availableStockValue: parseFloat(metricsJson.availableStockValue?.toString() || '0'),
        lowStockValue: parseFloat(metricsJson.lowStockValue?.toString() || '0'),
        averageValuePerProduct: parseFloat(metricsJson.averageValuePerProduct?.toString() || '0'),
        totalProducts: parseInt(metricsJson.totalProducts?.toString() || '0'),
        availableProducts: parseInt(metricsJson.availableProducts?.toString() || '0'),
        lowStockProducts: parseInt(metricsJson.lowStockProducts?.toString() || '0'),
        outOfStockProducts: parseInt(metricsJson.outOfStockProducts?.toString() || '0')
      } : {
        totalStockValue: 0,
        availableStockValue: 0,
        lowStockValue: 0,
        averageValuePerProduct: 0,
        totalProducts: 0,
        availableProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      };

      // 2. Récupérer la valorisation par famille
      const { data: familyData } = await supabase
        .rpc('calculate_valuation_by_family', { p_tenant_id: tenantId });
      const valuationByFamily: ValuationByCategory[] = (Array.isArray(familyData) ? familyData : []) as unknown as ValuationByCategory[];

      // 3. Récupérer la valorisation par rayon
      const { data: rayonData } = await supabase
        .rpc('calculate_valuation_by_rayon', { p_tenant_id: tenantId });
      const valuationByRayon: ValuationByCategory[] = (Array.isArray(rayonData) ? rayonData : []) as unknown as ValuationByCategory[];

      // 4. Récupérer les produits avec pagination serveur
      let query = supabase
        .from('produits')
        .select(`
          id, tenant_id, code_cip, libelle_produit,
          famille_id, rayon_id, prix_achat, prix_vente_ttc,
          stock_limite, stock_alerte,
          famille_produit:famille_id(libelle_famille),
          rayons_produits:rayon_id(libelle_rayon),
          lots(quantite_restante, prix_achat_unitaire)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Recherche
      if (debouncedSearchTerm) {
        query = query.or(`libelle_produit.ilike.%${debouncedSearchTerm}%,code_cip.ilike.%${debouncedSearchTerm}%`);
      }

      const { data: allProducts, error: productsError, count } = await query;

      if (productsError) throw productsError;

      // Traiter les produits
      const processedItems: StockValuationItem[] = (allProducts || []).map((product: any) => {
        const lots = product.lots || [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0);
        const valeur_stock = lots.reduce((sum: number, lot: any) => 
          sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0)), 0
        );

        const statut: 'disponible' | 'faible' | 'rupture' = 
          stock_actuel === 0 ? 'rupture' :
          stock_actuel <= (product.stock_alerte || 0) ? 'faible' : 'disponible';

        const rotation: 'rapide' | 'normale' | 'lente' = 
          stock_actuel < (product.stock_limite || 0) * 0.5 ? 'rapide' :
          stock_actuel < (product.stock_limite || 0) ? 'normale' : 'lente';

        return {
          id: product.id,
          tenant_id: product.tenant_id,
          code_cip: product.code_cip || '',
          libelle_produit: product.libelle_produit,
          famille_id: product.famille_id,
          famille_libelle: product.famille_produit?.libelle_famille,
          rayon_id: product.rayon_id,
          rayon_libelle: product.rayons_produits?.libelle_rayon,
          prix_achat: product.prix_achat || 0,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          stock_actuel,
          stock_limite: product.stock_limite || 0,
          stock_alerte: product.stock_alerte || 0,
          valeur_stock,
          statut_stock: statut,
          rotation
        };
      });

      // Filtrer
      let filteredItems = processedItems.filter(item => {
        if (statusFilter && statusFilter !== 'all' && item.statut_stock !== statusFilter) return false;
        if (rotationFilter && rotationFilter !== 'all' && item.rotation !== rotationFilter) return false;
        return true;
      });

      // Trier
      filteredItems.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'libelle_produit': comparison = a.libelle_produit.localeCompare(b.libelle_produit); break;
          case 'code_cip': comparison = a.code_cip.localeCompare(b.code_cip); break;
          case 'stock_actuel': comparison = a.stock_actuel - b.stock_actuel; break;
          case 'prix_achat': comparison = a.prix_achat - b.prix_achat; break;
          case 'valeur_stock': comparison = a.valeur_stock - b.valeur_stock; break;
          case 'statut_stock':
            const statusOrder = { 'rupture': 0, 'faible': 1, 'disponible': 2 };
            comparison = statusOrder[a.statut_stock] - statusOrder[b.statut_stock];
            break;
          case 'rotation':
            const rotationOrder = { 'rapide': 0, 'normale': 1, 'lente': 2 };
            comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      // Top 20 produits
      const topValueProducts = filteredItems
        .slice()
        .sort((a, b) => b.valeur_stock - a.valeur_stock)
        .slice(0, 20);

      // Pagination
      const allItemsCount = filteredItems.length;
      const totalPages = Math.ceil(allItemsCount / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

      return {
        valuationItems: paginatedItems,
        allItemsCount,
        totalPages,
        metrics,
        valuationByFamily,
        valuationByRayon,
        topValueProducts
      };
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 secondes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  return {
    valuationItems: data?.valuationItems || [],
    allItemsCount: data?.allItemsCount || 0,
    totalPages: data?.totalPages || 0,
    metrics: data?.metrics || {
      totalStockValue: 0,
      availableStockValue: 0,
      lowStockValue: 0,
      averageValuePerProduct: 0,
      totalProducts: 0,
      availableProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    },
    valuationByFamily: data?.valuationByFamily || [],
    valuationByRayon: data?.valuationByRayon || [],
    topValueProducts: data?.topValueProducts || [],
    isLoading,
    error: error?.message || null
  };
};