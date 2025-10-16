import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'stock-valuation-paginated',
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

      // Récupérer tous les produits avec leurs lots pour calculer la valorisation
      let query = supabase
        .from('produits')
        .select(`
          id,
          tenant_id,
          code_cip,
          libelle_produit,
          famille_id,
          rayon_id,
          prix_achat,
          prix_vente_ttc,
          stock_limite,
          stock_alerte,
          date_creation,
          famille_produit:famille_id(libelle_famille),
          rayon_produit:rayon_id(libelle_rayon),
          lots(
            id,
            quantite_actuelle,
            prix_achat_unitaire,
            date_entree,
            date_sortie
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('actif', true);

      // Appliquer la recherche si nécessaire
      if (debouncedSearchTerm) {
        query = query.or(`libelle_produit.ilike.%${debouncedSearchTerm}%,code_cip.ilike.%${debouncedSearchTerm}%`);
      }

      const { data: products, error } = await query;

      if (error) throw error;
      if (!products) return { valuationItems: [], allItemsCount: 0, totalPages: 0, metrics: {} as StockValuationMetrics, valuationByFamily: [], valuationByRayon: [], topValueProducts: [] };

      // Traitement des données pour calculer la valorisation
      const processedItems: StockValuationItem[] = [];
      let totalStockValue = 0;
      let availableStockValue = 0;
      let lowStockValue = 0;
      let totalProducts = 0;
      let availableProducts = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      // Récupérer les familles et rayons pour les calculs par catégorie
      const { data: families } = await supabase
        .from('famille_produit')
        .select('id, libelle_famille')
        .eq('tenant_id', tenantId);

      const { data: rayons } = await supabase
        .from('rayon_produit')
        .select('id, libelle_rayon')
        .eq('tenant_id', tenantId);

      for (const product of products) {
        const lots = product.lots || [];
        
        // Calculer le stock actuel
        const stock_actuel = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_actuelle || 0), 0);
        
        // Calculer la valeur du stock
        const valeur_stock = lots.reduce((sum: number, lot: any) => {
          return sum + ((lot.quantite_actuelle || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0));
        }, 0);

        // Déterminer le statut
        let statut: 'disponible' | 'faible' | 'rupture' = 'disponible';
        if (stock_actuel === 0) {
          statut = 'rupture';
          outOfStockProducts++;
        } else if (product.stock_alerte && stock_actuel <= product.stock_alerte) {
          statut = 'faible';
          lowStockProducts++;
          lowStockValue += valeur_stock;
        } else {
          availableProducts++;
          availableStockValue += valeur_stock;
        }

        // Calculer la rotation (logique simplifiée)
        const rotation: 'rapide' | 'normale' | 'lente' = 
          stock_actuel < (product.stock_limite || 0) * 0.5 ? 'rapide' :
          stock_actuel < (product.stock_limite || 0) ? 'normale' : 'lente';

        // Dates de dernière entrée/sortie
        const date_derniere_entree = lots
          .filter((lot: any) => lot.date_entree)
          .sort((a: any, b: any) => new Date(b.date_entree).getTime() - new Date(a.date_entree).getTime())[0]?.date_entree;

        const date_derniere_sortie = lots
          .filter((lot: any) => lot.date_sortie)
          .sort((a: any, b: any) => new Date(b.date_sortie).getTime() - new Date(a.date_sortie).getTime())[0]?.date_sortie;

        const item: StockValuationItem = {
          id: product.id,
          tenant_id: product.tenant_id,
          code_cip: product.code_cip || '',
          libelle_produit: product.libelle_produit,
          famille_id: product.famille_id,
          famille_libelle: product.famille_produit?.libelle_famille,
          rayon_id: product.rayon_id,
          rayon_libelle: product.rayon_produit?.libelle_rayon,
          prix_achat: product.prix_achat || 0,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          stock_actuel,
          stock_limite: product.stock_limite || 0,
          stock_alerte: product.stock_alerte || 0,
          valeur_stock,
          statut_stock: statut,
          rotation,
          date_derniere_entree,
          date_derniere_sortie
        };

        processedItems.push(item);
        totalStockValue += valeur_stock;
        totalProducts++;
      }

      // Appliquer les filtres
      let filteredItems = processedItems;

      if (statusFilter && statusFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.statut_stock === statusFilter);
      }

      if (rotationFilter && rotationFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.rotation === rotationFilter);
      }

      // Appliquer le tri
      filteredItems.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'libelle_produit':
            comparison = a.libelle_produit.localeCompare(b.libelle_produit);
            break;
          case 'code_cip':
            comparison = a.code_cip.localeCompare(b.code_cip);
            break;
          case 'stock_actuel':
            comparison = a.stock_actuel - b.stock_actuel;
            break;
          case 'prix_achat':
            comparison = a.prix_achat - b.prix_achat;
            break;
          case 'valeur_stock':
            comparison = a.valeur_stock - b.valeur_stock;
            break;
          case 'statut_stock':
            const statusOrder = { 'rupture': 0, 'faible': 1, 'disponible': 2 };
            comparison = statusOrder[a.statut_stock] - statusOrder[b.statut_stock];
            break;
          case 'rotation':
            const rotationOrder = { 'rapide': 0, 'normale': 1, 'lente': 2 };
            comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
            break;
          default:
            comparison = 0;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      // Pagination
      const allItemsCount = filteredItems.length;
      const totalPages = Math.ceil(allItemsCount / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

      // Calculs par famille
      const valuationByFamily: ValuationByCategory[] = (families || []).map((family: any) => {
        const familyProducts = processedItems.filter(p => p.famille_id === family.id);
        const value = familyProducts.reduce((sum, p) => sum + p.valeur_stock, 0);
        const quantity = familyProducts.reduce((sum, p) => sum + p.stock_actuel, 0);
        const percentage = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
        
        return {
          id: family.id,
          name: family.libelle_famille,
          value,
          quantity,
          percentage,
          productCount: familyProducts.length
        };
      }).filter(f => f.value > 0).sort((a, b) => b.value - a.value);

      // Calculs par rayon
      const valuationByRayon: ValuationByCategory[] = (rayons || []).map((rayon: any) => {
        const rayonProducts = processedItems.filter(p => p.rayon_id === rayon.id);
        const value = rayonProducts.reduce((sum, p) => sum + p.valeur_stock, 0);
        const quantity = rayonProducts.reduce((sum, p) => sum + p.stock_actuel, 0);
        const percentage = totalStockValue > 0 ? (value / totalStockValue) * 100 : 0;
        
        return {
          id: rayon.id,
          name: rayon.libelle_rayon,
          value,
          quantity,
          percentage,
          productCount: rayonProducts.length
        };
      }).filter(r => r.value > 0).sort((a, b) => b.value - a.value);

      // Top 20 produits par valorisation
      const topValueProducts = processedItems
        .filter(p => p.valeur_stock > 0)
        .sort((a, b) => b.valeur_stock - a.valeur_stock)
        .slice(0, 20);

      const metrics: StockValuationMetrics = {
        totalStockValue,
        availableStockValue,
        lowStockValue,
        averageValuePerProduct: totalProducts > 0 ? totalStockValue / totalProducts : 0,
        totalProducts,
        availableProducts,
        lowStockProducts,
        outOfStockProducts
      };

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
    staleTime: 2 * 60 * 1000, // 2 minutes
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