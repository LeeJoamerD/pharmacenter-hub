import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface PaginationFilters {
  famille_id?: string;
  rayon_id?: string;
  forme_id?: string;
  dci_id?: string;
  classe_therapeutique_id?: string;
  laboratoire_id?: string;
}

export const useProductsPaginated = (
  pageSize: number = 50,
  searchTerm: string = '',
  filters: PaginationFilters = {}
) => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);

  // Réinitialiser à la page 1 quand les filtres ou la recherche changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.famille_id, filters.rayon_id, filters.forme_id, 
      filters.dci_id, filters.classe_therapeutique_id, filters.laboratoire_id]);

  const query = useQuery({
    queryKey: ['products-paginated', tenantId, currentPage, pageSize, searchTerm, filters],
    queryFn: async () => {
      if (!tenantId) return { data: [], count: 0, totalPages: 1, currentPage: 1 };

      let queryBuilder = supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, famille_id, rayon_id, forme_id, 
          laboratoires_id, dci_id, classe_therapeutique_id, categorie_tarification_id, 
          prix_achat, prix_vente_ht, prix_vente_ttc, tva, taux_tva, 
          centime_additionnel, taux_centime_additionnel, stock_critique, stock_faible, stock_limite, 
          is_active, created_at, id_produit_source, quantite_unites_details_source, 
          niveau_detail
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Recherche serveur (beaucoup plus rapide)
      if (searchTerm) {
        queryBuilder = queryBuilder.or(
          `libelle_produit.ilike.%${searchTerm}%,code_cip.ilike.%${searchTerm}%`
        );
      }

      // Filtres
      if (filters.famille_id && filters.famille_id !== 'all') {
        queryBuilder = queryBuilder.eq('famille_id', filters.famille_id);
      }
      if (filters.rayon_id && filters.rayon_id !== 'all') {
        queryBuilder = queryBuilder.eq('rayon_id', filters.rayon_id);
      }
      if (filters.forme_id && filters.forme_id !== 'all') {
        queryBuilder = queryBuilder.eq('forme_id', filters.forme_id);
      }
      if (filters.dci_id && filters.dci_id !== 'all') {
        queryBuilder = queryBuilder.eq('dci_id', filters.dci_id);
      }
      if (filters.classe_therapeutique_id && filters.classe_therapeutique_id !== 'all') {
        queryBuilder = queryBuilder.eq('classe_therapeutique_id', filters.classe_therapeutique_id);
      }
      if (filters.laboratoire_id && filters.laboratoire_id !== 'all') {
        queryBuilder = queryBuilder.eq('laboratoires_id', filters.laboratoire_id);
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await queryBuilder
        .order('libelle_produit', { ascending: true })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage,
      };
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    ...query,
    currentPage,
    setCurrentPage,
    goToPage: (page: number) => setCurrentPage(page),
    nextPage: () => setCurrentPage(prev => prev + 1),
    prevPage: () => setCurrentPage(prev => Math.max(1, prev - 1)),
  };
};
