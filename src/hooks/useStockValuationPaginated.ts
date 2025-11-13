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
  statut_stock: 'normal' | 'faible' | 'critique' | 'rupture' | 'surstock';
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

// Interface pour le résultat de la RPC
interface RPCValuationResult {
  items: any[];
  totalCount: number;
  totalValue: number;
  familyAggregations?: Array<{
    famille_id: string;
    famille_libelle: string;
    product_count: number;
    total_quantity: number;
    total_value: number;
  }>;
  rayonAggregations?: Array<{
    rayon_id: string;
    rayon_libelle: string;
    product_count: number;
    total_quantity: number;
    total_value: number;
  }>;
  page: number;
  pageSize: number;
  error?: string;
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

      console.log('[useStockValuationPaginated] 🚀 Tentative d\'utilisation de la RPC optimisée...');

      // ========================================
      // PRIORITÉ 1: Essayer la RPC optimisée
      // ========================================
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'calculate_stock_valuation_paginated',
          {
            p_tenant_id: tenantId,
            p_page: currentPage,
            p_page_size: itemsPerPage,
            p_status_filter: statusFilter && statusFilter !== 'all' ? statusFilter : null,
            p_rotation_filter: rotationFilter && rotationFilter !== 'all' ? rotationFilter : null,
            p_search_term: debouncedSearchTerm || null,
            p_famille_filter: null,
            p_rayon_filter: null,
            p_sort_field: sortField,
            p_sort_direction: sortDirection,
          } as any
        );

        // Type assertion pour le résultat de la RPC
        const rpcResult = rpcData as unknown as RPCValuationResult | null;

        if (!rpcError && rpcResult && !rpcResult.error) {
          console.log('[useStockValuationPaginated] ✅ RPC réussie:', {
            itemsCount: rpcResult.items?.length || 0,
            totalCount: rpcResult.totalCount,
            totalValue: rpcResult.totalValue,
          });

          // Enrichir les items avec les libellés famille/rayon (optimisé avec requêtes groupées)
          const rpcFamilleIds = [...new Set(rpcResult.items.map((item: any) => item.famille_id).filter(Boolean))];
          const rpcRayonIds = [...new Set(rpcResult.items.map((item: any) => item.rayon_id).filter(Boolean))];

          // Charger tous les libellés en 2 requêtes au lieu de N requêtes
          const [rpcFamillesData, rpcRayonsData] = await Promise.all([
            rpcFamilleIds.length > 0
              ? supabase
                  .from('famille_produit')
                  .select('id, libelle_famille')
                  .in('id', rpcFamilleIds)
              : Promise.resolve({ data: [] }),
            rpcRayonIds.length > 0
              ? supabase
                  .from('rayons_produits')
                  .select('id, libelle_rayon')
                  .in('id', rpcRayonIds)
              : Promise.resolve({ data: [] }),
          ]);

          // Créer des maps pour lookup rapide
          const rpcFamilleMap = new Map(
            (rpcFamillesData.data || []).map((f: any) => [f.id, f.libelle_famille])
          );
          const rpcRayonMap = new Map(
            (rpcRayonsData.data || []).map((r: any) => [r.id, r.libelle_rayon])
          );

          // Enrichir les items
          const enrichedItems: StockValuationItem[] = rpcResult.items.map((item: any) => ({
            ...item,
            famille_libelle: item.famille_id ? rpcFamilleMap.get(item.famille_id) : undefined,
            rayon_libelle: item.rayon_id ? rpcRayonMap.get(item.rayon_id) : undefined,
            rotation: item.rotation > 5 ? 'rapide' : item.rotation > 1 ? 'normale' : 'lente',
          }));

          // Calculer les métriques complètes
          const metrics: StockValuationMetrics = {
            totalStockValue: parseFloat(rpcResult.totalValue?.toString() || '0') || 0,
            availableStockValue: enrichedItems
              .filter(p => p.statut_stock === 'normal')
              .reduce((sum, p) => sum + (p.valeur_stock || 0), 0),
            lowStockValue: enrichedItems
              .filter(p => p.statut_stock === 'faible' || p.statut_stock === 'critique')
              .reduce((sum, p) => sum + (p.valeur_stock || 0), 0),
            averageValuePerProduct: rpcResult.totalCount > 0
              ? parseFloat(rpcResult.totalValue?.toString() || '0') / rpcResult.totalCount
              : 0,
            totalProducts: rpcResult.totalCount || 0,
            availableProducts: enrichedItems.filter(p => p.stock_actuel > 0).length,
            lowStockProducts: enrichedItems.filter(p => p.statut_stock === 'faible' || p.statut_stock === 'critique').length,
            outOfStockProducts: enrichedItems.filter(p => p.statut_stock === 'rupture').length,
          };

          // ✅ Use aggregations from RPC (includes ALL filtered items, even rupture products)
          const totalValueForPercentage = parseFloat(rpcResult.totalValue?.toString() || '0') || 0;
          
          const valuationByFamily: ValuationByCategory[] = (rpcResult.familyAggregations || []).map(agg => ({
            id: agg.famille_id,
            name: agg.famille_libelle,
            value: parseFloat(agg.total_value?.toString() || '0'),
            quantity: agg.total_quantity,
            percentage: totalValueForPercentage > 0 
              ? (parseFloat(agg.total_value?.toString() || '0') / totalValueForPercentage) * 100 
              : 0,
            productCount: agg.product_count
          })).sort((a, b) => b.value - a.value);

          const valuationByRayon: ValuationByCategory[] = (rpcResult.rayonAggregations || []).map(agg => ({
            id: agg.rayon_id,
            name: agg.rayon_libelle,
            value: parseFloat(agg.total_value?.toString() || '0'),
            quantity: agg.total_quantity,
            percentage: totalValueForPercentage > 0 
              ? (parseFloat(agg.total_value?.toString() || '0') / totalValueForPercentage) * 100 
              : 0,
            productCount: agg.product_count
          })).sort((a, b) => b.value - a.value);

          // Top 20 produits par valorisation
          const topValueProducts = enrichedItems
            .filter(p => p.stock_actuel > 0)
            .slice()
            .sort((a, b) => b.valeur_stock - a.valeur_stock)
            .slice(0, 20);

          const totalPages = Math.ceil(rpcResult.totalCount / itemsPerPage);

          return {
            valuationItems: enrichedItems,
            allItemsCount: rpcResult.totalCount || 0,
            totalPages,
            metrics,
            valuationByFamily,
            valuationByRayon,
            topValueProducts,
          };
        } else {
          console.warn('[useStockValuationPaginated] ⚠️ RPC échouée, fallback vers calcul client:', rpcError || rpcResult?.error);
        }
      } catch (rpcError) {
        console.warn('[useStockValuationPaginated] ⚠️ Exception RPC, fallback vers calcul client:', rpcError);
      }

      // ========================================
      // FALLBACK: Calcul client-side (logique existante)
      // ========================================
      console.log('[useStockValuationPaginated] 🔄 Utilisation du calcul client-side...');

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

      // 4. Charger TOUS les produits actifs avec pagination interne (contourner la limite 1000)
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let productsQuery = supabase
          .from('produits')
          .select(`
            id, tenant_id, code_cip, libelle_produit,
            famille_id, rayon_id, prix_achat, prix_vente_ttc,
            stock_critique, stock_faible, stock_limite,
            famille_produit!fk_produits_famille_id(libelle_famille),
            rayons_produits!rayon_id(libelle_rayon)
          `)
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        // Ajouter la recherche côté serveur
        if (debouncedSearchTerm) {
          productsQuery = productsQuery.or(
            `libelle_produit.ilike.%${debouncedSearchTerm}%,code_cip.ilike.%${debouncedSearchTerm}%`
          );
        }

        // Appliquer la pagination
        const { data: batch, error: productsError } = await productsQuery.range(page * pageSize, (page + 1) * pageSize - 1);

        if (productsError) {
          console.error('[useStockValuationPaginated] Error loading products batch:', productsError);
          throw productsError;
        }

        if (batch && batch.length > 0) {
          allProducts = [...allProducts, ...batch];
          page++;
          hasMore = batch.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log('[useStockValuationPaginated] Products loaded:', allProducts?.length || 0);

      // 5. Charger TOUS les lots en stock avec pagination interne (contourner la limite 1000)
      let allLots: any[] = [];
      let lotPage = 0;
      const lotPageSize = 1000;
      let hasMoreLots = true;

      while (hasMoreLots) {
        const { data: lotBatch, error: lotsError } = await supabase
          .from('lots')
          .select('produit_id, quantite_restante, prix_achat_unitaire')
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0)
          .range(lotPage * lotPageSize, (lotPage + 1) * lotPageSize - 1);

        if (lotsError) {
          console.error('[useStockValuationPaginated] Error loading lots batch:', lotsError);
          throw lotsError;
        }

        if (lotBatch && lotBatch.length > 0) {
          allLots = [...allLots, ...lotBatch];
          lotPage++;
          hasMoreLots = lotBatch.length === lotPageSize;
        } else {
          hasMoreLots = false;
        }
      }

      console.log('[useStockValuationPaginated] Lots loaded:', allLots?.length || 0);

      // 6. Grouper les lots par produit_id
      const lotsByProduct = (allLots || []).reduce((acc, lot) => {
        if (!acc[lot.produit_id]) {
          acc[lot.produit_id] = [];
        }
        acc[lot.produit_id].push(lot);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('[useStockValuationPaginated] Products with lots:', Object.keys(lotsByProduct).length);

      // 7. Calculer la rotation pour tous les produits
      const productIds = (allProducts || []).map(p => p.id);
      const rotationMap = await calculateProductRotationsBatch(productIds);

      // 8. Traiter TOUS les produits
      const processedItems: StockValuationItem[] = (allProducts || []).map((product: any) => {
        const lots = lotsByProduct[product.id] || [];
        
        const stock_actuel = lots.reduce(
          (sum: number, lot: any) => sum + (lot.quantite_restante || 0),
          0
        );
        
        const valeur_stock = lots.reduce(
          (sum: number, lot: any) => sum + ((lot.quantite_restante || 0) * (lot.prix_achat_unitaire || product.prix_achat || 0)),
          0
        );

        // Utiliser la logique en cascade pour les seuils
        const criticalThreshold = getStockThreshold('critical', product.stock_critique, alertSettings?.critical_stock_threshold);
        const lowThreshold = getStockThreshold('low', product.stock_faible, alertSettings?.low_stock_threshold);
        const maximumThreshold = getStockThreshold('maximum', product.stock_limite, alertSettings?.maximum_stock_threshold);

        const statut: 'normal' | 'faible' | 'critique' | 'rupture' | 'surstock' = 
          stock_actuel === 0 ? 'rupture' :
          stock_actuel <= criticalThreshold ? 'critique' :
          stock_actuel <= lowThreshold ? 'faible' :
          stock_actuel > maximumThreshold ? 'surstock' : 'normal';

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
        normal: processedItems.filter(p => p.statut_stock === 'normal').length,
        surstock: processedItems.filter(p => p.statut_stock === 'surstock').length,
        faible: processedItems.filter(p => p.statut_stock === 'faible').length,
        critique: processedItems.filter(p => p.statut_stock === 'critique').length,
      });

      // 9. Filtrer par statut et rotation
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

      // 10. Trier tous les produits filtrés
      filteredItems.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'libelle_produit': comparison = a.libelle_produit.localeCompare(b.libelle_produit); break;
          case 'code_cip': comparison = a.code_cip.localeCompare(b.code_cip); break;
          case 'stock_actuel': comparison = a.stock_actuel - b.stock_actuel; break;
          case 'prix_achat': comparison = a.prix_achat - b.prix_achat; break;
          case 'valeur_stock': comparison = a.valeur_stock - b.valeur_stock; break;
          case 'statut_stock':
            const statusOrder = { 'rupture': 0, 'critique': 1, 'faible': 2, 'normal': 3, 'surstock': 4 };
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
          .filter(item => item.stock_actuel > 0)
          .reduce((sum, item) => sum + item.valeur_stock, 0);
        metrics.lowStockValue = processedItems
          .filter(item => item.statut_stock === 'faible' || item.statut_stock === 'critique')
          .reduce((sum, item) => sum + item.valeur_stock, 0);
        metrics.totalProducts = processedItems.length;
        metrics.availableProducts = processedItems.filter(item => item.stock_actuel > 0).length;
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