import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

// Interface pour définir la structure de retour de la requête
interface ProductsForOrdersResult {
  data: any[];
  count: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

export const useProductsForOrders = (
  searchTerm: string = '',
  pageSize: number = 50
) => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);

  const query = useQuery<ProductsForOrdersResult>({
    queryKey: ['products-for-orders', tenantId, currentPage, pageSize, searchTerm],
    queryFn: async (): Promise<ProductsForOrdersResult> => {
      if (!tenantId) return { data: [], count: 0, totalPages: 1, currentPage: 1, hasMore: false };

      let queryBuilder = supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, famille_id, rayon_id, forme_id, 
          laboratoires_id, dci_id, classe_therapeutique_id, categorie_tarification_id, 
          prix_achat, prix_vente_ht, prix_vente_ttc, tva, taux_tva, 
          centime_additionnel, taux_centime_additionnel, stock_limite, stock_alerte, 
          is_active, created_at, id_produit_source, quantite_unites_details_source, 
          niveau_detail
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Recherche serveur optimisée pour les commandes
      if (searchTerm && searchTerm.trim().length > 0) {
        queryBuilder = queryBuilder.or(
          `libelle_produit.ilike.%${searchTerm.trim()}%,code_cip.ilike.%${searchTerm.trim()}%`
        );
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await queryBuilder
        .order('libelle_produit', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasMore = currentPage < totalPages;

      return {
        data: data || [],
        count: totalCount,
        totalPages,
        currentPage,
        hasMore,
      };
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Utiliser placeholderData au lieu de keepPreviousData pour la nouvelle version de React Query
    placeholderData: (previousData) => previousData,
  });

  // Fonction pour charger plus de produits (pagination infinie)
  const loadMore = () => {
    if (query.data?.hasMore && !query.isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Fonction pour réinitialiser la recherche
  const resetSearch = () => {
    setCurrentPage(1);
  };

  return {
    ...query,
    currentPage,
    setCurrentPage,
    loadMore,
    resetSearch,
    hasMore: query.data?.hasMore || false,
    totalCount: query.data?.count || 0,
    products: query.data?.data || [],
  };
};