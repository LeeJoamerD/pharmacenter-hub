import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { getStockThreshold } from '@/lib/utils';
import { useAlertSettings } from '@/hooks/useAlertSettings';

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
  stock_faible: number;
  stock_critique: number;
  valeur_stock: number;
  statut_stock: 'disponible' | 'faible' | 'critique' | 'rupture';
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
  refetch: () => void;
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
  const { settings: alertSettings } = useAlertSettings();

  // Fonction pour calculer la rotation par batch (évite les requêtes individuelles)
  const calculateProductRotationsBatch = async (productIds: string[]): Promise<Map<string, 'rapide' | 'normale' | 'lente'>> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const rotationMap = new Map<string, 'rapide' | 'normale' | 'lente'>();
    
    // Charger les mouvements par batch de 100 produits pour éviter les URLs trop longues
    const batchSize = 100;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      try {
        const { data: movements } = await supabase
          .from('mouvements_lots')
          .select('produit_id, quantite_mouvement')
          .eq('tenant_id', tenantId)
          .in('produit_id', batch)
          .eq('type_mouvement', 'sortie')
          .gte('date_mouvement', thirtyDaysAgo.toISOString());
        
        // Calculer la rotation pour chaque produit
        const salesByProduct = new Map<string, number>();
        (movements || []).forEach(m => {
          const current = salesByProduct.get(m.produit_id) || 0;
          salesByProduct.set(m.produit_id, current + Math.abs(m.quantite_mouvement));
        });
        
        batch.forEach(productId => {
          const totalSales = salesByProduct.get(productId) || 0;
          if (totalSales >= 100) {
            rotationMap.set(productId, 'rapide');
          } else if (totalSales >= 30) {
            rotationMap.set(productId, 'normale');
          } else {
            rotationMap.set(productId, 'lente');
          }
        });
      } catch (error) {
        console.warn('Erreur lors du calcul de rotation pour le batch:', error);
        // En cas d'erreur, assigner une rotation par défaut
        batch.forEach(productId => {
          rotationMap.set(productId, 'normale');
        });
      }
    }
    
    return rotationMap;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'stock-valuation-paginated-v3',
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

      // 1. Récupérer les métriques globales via RPC avec gestion d'erreur
      let globalMetrics = {
        totalProducts: 0,
        totalValue: 0,
        availableProducts: 0,
        lowStockProducts: 0,
      };

      // Initialiser les métriques complètes
      let metrics: StockValuationMetrics = {
        totalStockValue: 0,
        availableStockValue: 0,
        lowStockValue: 0,
        averageValuePerProduct: 0,
        totalProducts: 0,
        availableProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
      };

      try {
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('calculate_stock_metrics', { p_tenant_id: tenantId });

        if (metricsError) {
          console.warn('Erreur RPC calculate_stock_metrics:', metricsError);
        } else if (metricsData && typeof metricsData === 'object' && metricsData !== null) {
          const data = metricsData as any;
          globalMetrics = {
            totalProducts: data.totalProducts || 0,
            totalValue: parseFloat(data.totalValue?.toString() || '0') || 0,
            availableProducts: data.availableProducts || 0,
            lowStockProducts: data.lowStockProducts || 0,
          };
          
          // Mettre à jour les métriques complètes
          metrics = {
            totalStockValue: parseFloat(data.totalValue?.toString() || '0') || 0,
            availableStockValue: parseFloat(data.availableStockValue?.toString() || '0') || 0,
            lowStockValue: parseFloat(data.lowStockValue?.toString() || '0') || 0,
            averageValuePerProduct: parseFloat(data.averageValuePerProduct?.toString() || '0') || 0,
            totalProducts: data.totalProducts || 0,
            availableProducts: data.availableProducts || 0,
            lowStockProducts: data.lowStockProducts || 0,
            outOfStockProducts: data.outOfStockProducts || 0,
          };
        }
      } catch (error) {
        console.warn('Erreur lors du calcul des métriques:', error);
      }

      // 2. Calculer la valorisation par famille côté client (après traitement des produits)
      let valuationByFamily: ValuationByCategory[] = [];
      let valuationByRayon: ValuationByCategory[] = [];

      // 4. Charger les produits avec recherche côté serveur et optimisation
      let productsQuery = supabase
        .from('produits')
        .select(`
          id, tenant_id, code_cip, libelle_produit,
          famille_id, rayon_id, prix_achat, prix_vente_ttc,
          stock_critique, stock_faible, stock_limite,
          famille_produit!fk_produits_famille_id(libelle_famille),
          rayons_produits!rayon_id(libelle_rayon),
          lots(quantite_restante, prix_achat_unitaire)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // ✅ Ajouter la recherche AVANT le limit (côté serveur)
      if (debouncedSearchTerm) {
        productsQuery = productsQuery.or(
          `libelle_produit.ilike.%${debouncedSearchTerm}%,code_cip.ilike.%${debouncedSearchTerm}%`
        );
      }

      // ✅ Appliquer le tri côté serveur pour les champs non calculés AVANT limit
      if (sortField === 'libelle_produit') {
        productsQuery = productsQuery.order('libelle_produit', { ascending: sortDirection === 'asc' });
      } else if (sortField === 'code_cip') {
        productsQuery = productsQuery.order('code_cip', { ascending: sortDirection === 'asc' });
      } else {
        // Pour stock_actuel et valeur_stock (calculés dynamiquement), tri par défaut puis tri client
        productsQuery = productsQuery.order('libelle_produit', { ascending: true });
      }

      // Charger SEULEMENT 500 produits pour analyse et Top 20
      const { data: allProducts, error: productsError, count: totalProductsCount } = await productsQuery
        .limit(500);

      if (productsError) {
        console.warn('Erreur lors du chargement des produits:', productsError);
        throw productsError;
      }

      console.log('[useStockValuationPaginated] Products loaded:', {
        total: allProducts?.length || 0,
        statusFilter,
        sortField,
        sortDirection
      });

      // 6. Calculer la rotation pour tous les produits (avec limite)
      const productIds = allProducts.slice(0, 1000).map(p => p.id); // Limite à 1000 pour la rotation
      const rotationMap = await calculateProductRotationsBatch(productIds);

      // 7. Traiter les produits avec rotation dynamique
      const processedItems: StockValuationItem[] = allProducts.map((product: any) => {
        const lots = Array.isArray(product.lots) ? product.lots : [];
        const stock_actuel = lots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0);
        const valeur_stock = lots.reduce((sum: number, lot: any) => 
          sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0)), 0
        );

        // Utiliser la logique en cascade pour les seuils
        const criticalThreshold = getStockThreshold('critical', product.stock_critique, alertSettings?.critical_stock_threshold);
        const lowThreshold = getStockThreshold('low', product.stock_faible, alertSettings?.low_stock_threshold);
        const maximumThreshold = getStockThreshold('maximum', product.stock_limite, alertSettings?.maximum_stock_threshold);

        const statut: 'disponible' | 'faible' | 'critique' | 'rupture' = 
          stock_actuel === 0 ? 'rupture' :
          stock_actuel <= criticalThreshold ? 'critique' :
          stock_actuel <= lowThreshold ? 'faible' : 'disponible';

        const rotation = rotationMap.get(product.id) || 'normale';

        return {
          id: product.id,
          tenant_id: product.tenant_id,
          code_cip: product.code_cip || '',
          libelle_produit: product.libelle_produit || '',
          famille_id: product.famille_id,
          famille_libelle: product.famille_produit?.libelle_famille,
          rayon_id: product.rayon_id,
          rayon_libelle: product.rayons_produits?.libelle_rayon,
          prix_achat: product.prix_achat || 0,
          prix_vente_ttc: product.prix_vente_ttc || 0,
          stock_actuel,
          stock_critique: product.stock_critique || 0,
          stock_faible: product.stock_faible || 0,
          stock_limite: product.stock_limite || 0,
          valeur_stock,
          statut_stock: statut,
          rotation
        };
      });

      console.log('[useStockValuationPaginated] Processed items:', {
        total: processedItems.length,
        with_stock: processedItems.filter(p => p.stock_actuel > 0).length,
        rupture: processedItems.filter(p => p.stock_actuel === 0).length,
        disponible: processedItems.filter(p => p.statut_stock === 'disponible').length,
        faible: processedItems.filter(p => p.statut_stock === 'faible').length,
        critique: processedItems.filter(p => p.statut_stock === 'critique').length,
      });

      // 8. Filtrer par statut et rotation
      let filteredItems = processedItems.filter(item => {
        // ✅ Filtre spécial pour "disponible" : tous les produits avec stock > 0
        if (statusFilter === 'disponible') {
          if (item.stock_actuel === 0) return false;
        } 
        // ✅ Filtre pour les autres statuts : correspondance exacte
        else if (statusFilter && statusFilter !== 'all' && item.statut_stock !== statusFilter) {
          return false;
        }
        
        if (rotationFilter && rotationFilter !== 'all' && item.rotation !== rotationFilter) return false;
        return true;
      });

      console.log('[useStockValuationPaginated] Filtered items:', {
        total: filteredItems.length,
        statusFilter,
        rotationFilter
      });

      // 9. Trier côté client pour les champs calculés
      filteredItems.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'libelle_produit': comparison = a.libelle_produit.localeCompare(b.libelle_produit); break;
          case 'code_cip': comparison = a.code_cip.localeCompare(b.code_cip); break;
          case 'stock_actuel': comparison = a.stock_actuel - b.stock_actuel; break;
          case 'prix_achat': comparison = a.prix_achat - b.prix_achat; break;
          case 'valeur_stock': comparison = a.valeur_stock - b.valeur_stock; break;
          case 'statut_stock':
            const statusOrder = { 'rupture': 0, 'critique': 1, 'faible': 2, 'disponible': 3 };
            comparison = statusOrder[a.statut_stock] - statusOrder[b.statut_stock];
            break;
          case 'rotation':
            const rotationOrder = { 'rapide': 0, 'normale': 1, 'lente': 2 };
            comparison = rotationOrder[a.rotation] - rotationOrder[b.rotation];
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      // 10. Recalculer les métriques si les RPC ont échoué
      if (metrics.totalStockValue === 0 && processedItems.length > 0) {
        metrics.totalStockValue = processedItems.reduce((sum, item) => sum + item.valeur_stock, 0);
        metrics.availableStockValue = processedItems
          .filter(item => item.statut_stock === 'disponible')
          .reduce((sum, item) => sum + item.valeur_stock, 0);
        metrics.lowStockValue = processedItems
          .filter(item => item.statut_stock === 'faible' || item.statut_stock === 'critique')
          .reduce((sum, item) => sum + item.valeur_stock, 0);
        metrics.totalProducts = processedItems.length;
        metrics.availableProducts = processedItems.filter(item => item.statut_stock === 'disponible').length;
        metrics.lowStockProducts = processedItems.filter(item => item.statut_stock === 'faible' || item.statut_stock === 'critique').length;
        metrics.outOfStockProducts = processedItems.filter(item => item.statut_stock === 'rupture').length;
        metrics.averageValuePerProduct = metrics.totalProducts > 0 ? metrics.totalStockValue / metrics.totalProducts : 0;
      }

      // 11. Calculer la valorisation par famille côté client (depuis filteredItems)
      const familyMap = new Map<string, { name: string; value: number; quantity: number; productCount: number }>();
      filteredItems.forEach(product => {
        if (product.famille_libelle) {
          const key = product.famille_id || 'unknown';
          const existing = familyMap.get(key) || { 
            name: product.famille_libelle, 
            value: 0, 
            quantity: 0, 
            productCount: 0 
          };
          existing.value += product.valeur_stock;
          existing.quantity += product.stock_actuel;
          existing.productCount += 1;
          familyMap.set(key, existing);
        }
      });

      const totalValue = filteredItems.reduce((sum, p) => sum + p.valeur_stock, 0);
      valuationByFamily = Array.from(familyMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        value: data.value,
        quantity: data.quantity,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        productCount: data.productCount
      })).sort((a, b) => b.value - a.value);

      // 12. Calculer la valorisation par rayon côté client (depuis filteredItems)
      const rayonMap = new Map<string, { name: string; value: number; quantity: number; productCount: number }>();
      filteredItems.forEach(product => {
        if (product.rayon_libelle) {
          const key = product.rayon_id || 'unknown';
          const existing = rayonMap.get(key) || { 
            name: product.rayon_libelle, 
            value: 0, 
            quantity: 0, 
            productCount: 0 
          };
          existing.value += product.valeur_stock;
          existing.quantity += product.stock_actuel;
          existing.productCount += 1;
          rayonMap.set(key, existing);
        }
      });

      valuationByRayon = Array.from(rayonMap.entries()).map(([id, data]) => ({
        id,
        name: data.name,
        value: data.value,
        quantity: data.quantity,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        productCount: data.productCount
      })).sort((a, b) => b.value - a.value);

      // 13. Top 20 produits par valorisation (depuis filteredItems, uniquement produits avec stock)
      const topValueProducts = filteredItems
        .filter(p => p.stock_actuel > 0)  // ✅ Exclure les ruptures
        .slice()
        .sort((a, b) => b.valeur_stock - a.valeur_stock)
        .slice(0, 20);

      // 14. Pagination client-side
      const allItemsCount = filteredItems.length;
      const totalPages = Math.ceil(allItemsCount / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

      return {
        valuationItems: paginatedItems,
        allItemsCount,
        totalPages,
        metrics: {
          totalStockValue: globalMetrics.totalValue,
          availableStockValue: globalMetrics.totalValue,
          lowStockValue: filteredItems
             .filter(p => p.statut_stock === 'faible')
             .reduce((sum, p) => sum + (p.valeur_stock || 0), 0),
          averageValuePerProduct: globalMetrics.totalProducts > 0 
            ? globalMetrics.totalValue / globalMetrics.totalProducts 
            : 0,
          totalProducts: globalMetrics.totalProducts,
          availableProducts: globalMetrics.availableProducts,
          lowStockProducts: globalMetrics.lowStockProducts,
          outOfStockProducts: globalMetrics.totalProducts - globalMetrics.availableProducts,
        },
        valuationByFamily,
        valuationByRayon,
        topValueProducts
      };
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000, // 1 minute au lieu de 30 secondes
    refetchOnMount: 'always',
    refetchOnWindowFocus: false, // Désactivé pour améliorer les performances
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
    error: error?.message || null,
    refetch
  };
};