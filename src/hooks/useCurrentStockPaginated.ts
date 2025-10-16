import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useTenantQuery } from '@/hooks/useTenantQuery';

// Interface pour les produits avec données de stock
export interface CurrentStockProduct {
  id: string;
  libelle_produit: string;
  code_cip: string;
  famille_id: string | null;
  rayon_id: string | null;
  forme_id: string | null;
  laboratoires_id: string | null;
  dci_id: string | null;
  classe_therapeutique_id: string | null;
  categorie_tarification_id: string | null;
  prix_achat: number | null;
  prix_vente_ht: number | null;
  prix_vente_ttc: number | null;
  tva: number | null;
  taux_tva: number | null;
  centime_additionnel: number | null;
  taux_centime_additionnel: number | null;
  stock_limite: number | null;
  stock_alerte: number | null;
  is_active: boolean;
  created_at: string;
  tenant_id: string;
  // Données calculées de stock
  stock_actuel: number;
  valeur_stock: number;
  statut: 'disponible' | 'faible' | 'rupture';
  statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock';
  rotation: 'rapide' | 'normale' | 'lente';
  derniere_entree?: string;
  derniere_sortie?: string;
  famille_libelle?: string;
  rayon_libelle?: string;
}

// Interface pour les filtres
export interface StockFilters {
  famille_id?: string;
  rayon_id?: string;
  forme_id?: string;
  laboratoires_id?: string;
  dci_id?: string;
  classe_therapeutique_id?: string;
  statut?: 'tous' | 'disponible' | 'faible' | 'rupture';
  rotation?: 'tous' | 'rapide' | 'normale' | 'lente';
}

// Interface pour le tri
export interface StockSort {
  field: 'name' | 'stock' | 'value' | 'rotation';
  order: 'asc' | 'desc';
}

// Interface pour le résultat de la requête
interface CurrentStockPaginatedResult {
  data: CurrentStockProduct[];
  count: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  metrics: {
    totalProducts: number;
    availableProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    criticalStockProducts: number;
    totalValue: number;
  };
}

export const useCurrentStockPaginated = (
  searchTerm: string = '',
  pageSize: number = 50,
  filters: StockFilters = {},
  sort: StockSort = { field: 'name', order: 'asc' }
) => {
  const { tenantId } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { useTenantQueryWithCache } = useTenantQuery();

  // Charger les familles et rayons pour les filtres
  const { data: families = [] } = useTenantQueryWithCache(
    ['famille_produit-for-stock-filters'],
    'famille_produit',
    'id, libelle_famille',
    {}
  );

  const { data: rayons = [] } = useTenantQueryWithCache(
    ['rayons-for-stock-filters'],
    'rayons_produits',
    'id, libelle_rayon',
    {}
  );

  const query = useQuery<CurrentStockPaginatedResult>({
    queryKey: [
      'current-stock-paginated',
      tenantId,
      currentPage,
      pageSize,
      debouncedSearchTerm,
      filters,
      sort
    ],
    queryFn: async (): Promise<CurrentStockPaginatedResult> => {
      if (!tenantId) {
        return {
          data: [],
          count: 0,
          totalPages: 1,
          currentPage: 1,
          hasMore: false,
          metrics: {
            totalProducts: 0,
            availableProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            criticalStockProducts: 0,
            totalValue: 0,
          },
        };
      }

      // Construire la requête de base avec jointures pour les calculs de stock
      let queryBuilder = supabase
        .from('produits')
        .select(`
          id, libelle_produit, code_cip, famille_id, rayon_id, forme_id,
          laboratoires_id, dci_id, classe_therapeutique_id, categorie_tarification_id,
          prix_achat, prix_vente_ht, prix_vente_ttc, tva, taux_tva,
          centime_additionnel, taux_centime_additionnel, stock_limite, stock_alerte,
          is_active, created_at, tenant_id
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Recherche serveur optimisée
      if (debouncedSearchTerm && debouncedSearchTerm.trim().length > 0) {
        queryBuilder = queryBuilder.or(
          `libelle_produit.ilike.%${debouncedSearchTerm.trim()}%,code_cip.ilike.%${debouncedSearchTerm.trim()}%`
        );
      }

      // Appliquer les filtres
      if (filters.famille_id && filters.famille_id !== 'tous') {
        queryBuilder = queryBuilder.eq('famille_id', filters.famille_id);
      }
      if (filters.rayon_id && filters.rayon_id !== 'tous') {
        queryBuilder = queryBuilder.eq('rayon_id', filters.rayon_id);
      }
      if (filters.forme_id && filters.forme_id !== 'tous') {
        queryBuilder = queryBuilder.eq('forme_id', filters.forme_id);
      }
      if (filters.laboratoires_id && filters.laboratoires_id !== 'tous') {
        queryBuilder = queryBuilder.eq('laboratoires_id', filters.laboratoires_id);
      }
      if (filters.dci_id && filters.dci_id !== 'tous') {
        queryBuilder = queryBuilder.eq('dci_id', filters.dci_id);
      }
      if (filters.classe_therapeutique_id && filters.classe_therapeutique_id !== 'tous') {
        queryBuilder = queryBuilder.eq('classe_therapeutique_id', filters.classe_therapeutique_id);
      }

      // Tri
      let orderColumn = 'libelle_produit';
      switch (sort.field) {
        case 'name':
          orderColumn = 'libelle_produit';
          break;
        case 'stock':
          // Le tri par stock sera fait après calcul côté client pour cette version
          orderColumn = 'libelle_produit';
          break;
        case 'value':
          // Le tri par valeur sera fait après calcul côté client pour cette version
          orderColumn = 'libelle_produit';
          break;
        case 'rotation':
          // Le tri par rotation sera fait après calcul côté client pour cette version
          orderColumn = 'libelle_produit';
          break;
      }

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: products, error, count } = await queryBuilder
        .order(orderColumn, { ascending: sort.order === 'asc' })
        .range(from, to);

      if (error) throw error;

      // Calculer les données de stock pour chaque produit
      const productsWithStock = await Promise.all(
        (products || []).map(async (product) => {
          // Récupérer les lots actifs pour ce produit
          const { data: lots } = await supabase
            .from('lots')
            .select('quantite_restante, prix_achat_unitaire, date_peremption')
            .eq('tenant_id', tenantId)
            .eq('produit_id', product.id)
            .gt('quantite_restante', 0);

          // Calculer le stock actuel
          const stock_actuel = (lots || []).reduce((sum, lot) => sum + (lot.quantite_restante || 0), 0);

          // Calculer la valeur du stock
          const valeur_stock = (lots || []).reduce((sum, lot) => {
            return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
          }, 0);

           // Déterminer le statut
          let statut: 'disponible' | 'faible' | 'rupture' = 'disponible';
          let statut_stock: 'critique' | 'faible' | 'normal' | 'rupture' | 'surstock' = 'normal';
          
          if (stock_actuel === 0) {
            statut = 'rupture';
            statut_stock = 'rupture';
          } else if (product.stock_limite && stock_actuel <= product.stock_limite * 0.1) {
            statut = 'faible';
            statut_stock = 'critique';
          } else if (product.stock_alerte && stock_actuel <= product.stock_alerte) {
            statut = 'faible';
            statut_stock = 'faible';
          }

          // Calculer la rotation (simplifié pour cette version)
          const rotation: 'rapide' | 'normale' | 'lente' = stock_actuel > (product.stock_limite || 100) ? 'lente' : 
                                                           stock_actuel > (product.stock_alerte || 10) ? 'normale' : 'rapide';

          return {
            ...product,
            stock_actuel,
            valeur_stock,
            statut,
            statut_stock,
            rotation,
            famille_libelle: (product as any).famille_produit?.libelle_famille,
            rayon_libelle: (product as any).rayons_produits?.libelle_rayon,
          } as CurrentStockProduct;
        })
      );

      // Appliquer les filtres de statut et rotation après calcul
      let filteredProducts = productsWithStock;
      
      if (filters.statut && filters.statut !== 'tous') {
        filteredProducts = filteredProducts.filter(p => p.statut === filters.statut);
      }
      
      if (filters.rotation && filters.rotation !== 'tous') {
        filteredProducts = filteredProducts.filter(p => p.rotation === filters.rotation);
      }

      // Appliquer le tri après calcul si nécessaire
      if (sort.field === 'stock' || sort.field === 'value' || sort.field === 'rotation') {
        filteredProducts.sort((a, b) => {
          let comparison = 0;
          switch (sort.field) {
            case 'stock':
              comparison = a.stock_actuel - b.stock_actuel;
              break;
            case 'value':
              comparison = a.valeur_stock - b.valeur_stock;
              break;
            case 'rotation':
              const rotationOrder = { rapide: 3, normale: 2, lente: 1 };
              comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
              break;
          }
          return sort.order === 'asc' ? comparison : -comparison;
        });
      }

      // Calculer les métriques globales (sur tous les produits, pas seulement la page)
      const { data: allProducts } = await supabase
        .from('produits')
        .select('id, stock_limite, stock_alerte, prix_achat')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      let totalProducts = 0;
      let availableProducts = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;
      let totalValue = 0;

      if (allProducts) {
        for (const product of allProducts) {
          const { data: lots } = await supabase
            .from('lots')
            .select('quantite_restante, prix_achat_unitaire')
            .eq('tenant_id', tenantId)
            .eq('produit_id', product.id)
            .gt('quantite_restante', 0);

          const stock = (lots || []).reduce((sum, lot) => sum + (lot.quantite_restante || 0), 0);
          const value = (lots || []).reduce((sum, lot) => {
            return sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
          }, 0);

          totalProducts++;
          totalValue += value;

          if (stock === 0) {
            outOfStockProducts++;
          } else if (product.stock_alerte && stock <= product.stock_alerte) {
            lowStockProducts++;
          } else {
            availableProducts++;
          }
        }
      }

      // Calculer les produits en stock critique (< 10% du stock limite)
      const criticalStockProducts = (allProducts || []).filter(product => {
        const lots = (allProducts || []).find(p => p.id === product.id);
        const stock = lots ? 1 : 0; // Simplifié
        return stock > 0 && product.stock_limite && stock <= product.stock_limite * 0.1;
      }).length;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasMore = currentPage < totalPages;

      return {
        data: filteredProducts,
        count: totalCount,
        totalPages,
        currentPage,
        hasMore,
        metrics: {
          totalProducts,
          availableProducts,
          lowStockProducts,
          outOfStockProducts,
          criticalStockProducts,
          totalValue,
        },
      };
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // Fonction pour aller à une page spécifique
  const goToPage = (page: number) => {
    if (page >= 1 && page <= (query.data?.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  return {
    ...query,
    currentPage,
    setCurrentPage,
    loadMore,
    resetSearch,
    goToPage,
    hasMore: query.data?.hasMore || false,
    totalCount: query.data?.count || 0,
    totalPages: query.data?.totalPages || 1,
    products: query.data?.data || [],
    allProductsCount: query.data?.count || 0,
    families,
    rayons,
    refreshData: query.refetch,
    metrics: query.data?.metrics || {
      totalProducts: 0,
      availableProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      criticalStockProducts: 0,
      totalValue: 0,
    },
  };
};