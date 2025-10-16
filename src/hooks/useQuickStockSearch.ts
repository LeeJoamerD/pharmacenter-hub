import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useDebounce } from '@/utils/supplyChainOptimizations';

export interface QuickSearchProduct {
  id: string;
  libelle_produit: string;
  code_cip: string;
  stock_actuel: number;
  stock_limite: number;
  prix_vente_ttc: number;
  statut_stock: string;
  famille_libelle?: string;
  rayon_libelle?: string;
  rotation: string;
}

export interface QuickSearchResult {
  products: QuickSearchProduct[];
  totalCount: number;
  hasMore: boolean;
}

export const useQuickStockSearch = (searchTerm: string = '', pageSize: number = 10) => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounce search term to avoid excessive queries
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);

  const query = useQuery({
    queryKey: ['quick-stock-search', tenantId, debouncedSearchTerm, currentPage, pageSize],
    queryFn: async (): Promise<QuickSearchResult> => {
      if (!tenantId) throw new Error('Tenant ID is required');
      if (!debouncedSearchTerm) {
        return { products: [], totalCount: 0, hasMore: false };
      }

      let queryBuilder = supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          code_cip,
          stock_limite,
          prix_vente_ttc,
          famille_id,
          rayon_id,
          famille_produit!inner(libelle_famille),
          rayons_produits!inner(libelle_rayon)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Search in product name, code, or family
      const searchLower = debouncedSearchTerm.toLowerCase();
      queryBuilder = queryBuilder.or(`
        libelle_produit.ilike.%${searchLower}%,
        code_cip.ilike.%${searchLower}%
      `);

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await queryBuilder
        .order('libelle_produit', { ascending: true })
        .range(from, to);

      if (error) throw error;

      // Calculer le stock actuel pour chaque produit à partir des lots
      const productsWithStock = await Promise.all(
        (data || []).map(async (item) => {
          // Récupérer les lots actifs pour ce produit
          const { data: lots } = await supabase
            .from('lots')
            .select('quantite_restante')
            .eq('tenant_id', tenantId)
            .eq('produit_id', item.id)
            .gt('quantite_restante', 0);

          // Calculer le stock actuel
          const stock_actuel = (lots || []).reduce((sum, lot) => sum + (lot.quantite_restante || 0), 0);

          // Déterminer le statut du stock
          let statut_stock = 'normal';
          if (stock_actuel === 0) {
            statut_stock = 'rupture';
          } else if (item.stock_limite && stock_actuel <= item.stock_limite * 0.2) {
            statut_stock = 'faible';
          }

          // Déterminer la rotation
          const rotation = stock_actuel > (item.stock_limite || 0) ? 'lente' : 
                          stock_actuel > (item.stock_limite || 0) * 0.5 ? 'normale' : 'rapide';

          return {
            id: item.id,
            libelle_produit: item.libelle_produit,
            code_cip: item.code_cip,
            stock_actuel,
            stock_limite: item.stock_limite || 0,
            prix_vente_ttc: item.prix_vente_ttc || 0,
            statut_stock,
            famille_libelle: item.famille_produit?.libelle_famille,
            rayon_libelle: item.rayons_produits?.libelle_rayon,
            rotation
          };
        })
      );

      return {
        products: productsWithStock,
        totalCount: count || 0,
        hasMore: (count || 0) > currentPage * pageSize
      };
    },
    enabled: !!tenantId && !!debouncedSearchTerm,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset page when search term changes
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const loadMore = () => {
    if (query.data?.hasMore && !query.isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const resetSearch = () => {
    setCurrentPage(1);
  };

  // Combine results from all pages for infinite scroll effect
  const allProducts = useMemo(() => {
    if (!query.data) return [];
    return query.data.products;
  }, [query.data]);

  return {
    products: allProducts,
    totalCount: query.data?.totalCount || 0,
    hasMore: query.data?.hasMore || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    loadMore,
    resetSearch,
    currentPage,
    searchTerm: debouncedSearchTerm,
    refetch: query.refetch
  };
};