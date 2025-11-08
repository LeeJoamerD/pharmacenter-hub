import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from './useTenantQuery';
import { useAlertThresholds } from './useAlertThresholds';
import { StockUpdateService } from '@/services/stockUpdateService';
import { StockValuationService } from '@/services/stockValuationService';
import { useStockSettings } from './useStockSettings';
import { useDebouncedValue } from './use-debounce';

export interface LowStockItem {
  id: string;
  tenant_id: string;
  codeProduit: string;
  nomProduit: string;
  dci: string;
  quantiteActuelle: number;
  seuilMinimum: number;
  seuilOptimal: number;
  unite: string;
  categorie: string;
  fournisseurPrincipal: string;
  prixUnitaire: number;
  valeurStock: number;
  dernierMouvement: Date | null;
  statut: 'critique' | 'faible' | 'attention';
  famille_id: string;
  rayon_id: string;
  rotation: 'rapide' | 'normale' | 'lente';
  jours_sans_mouvement: number;
}

export interface LowStockMetrics {
  totalItems: number;
  criticalItems: number;
  lowItems: number;
  attentionItems: number;
  totalValue: number;
  averageRotation: number;
  urgentActions: number;
}

interface UseLowStockDataPaginatedParams {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useLowStockDataPaginated = (params: UseLowStockDataPaginatedParams = {}) => {
  const {
    search = '',
    category = '',
    status = '',
    sortBy = 'statut',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = params;

  const { tenantId } = useTenant();
  const { useTenantQueryWithCache } = useTenantQuery();
  const { thresholds } = useAlertThresholds();
  const { settings: stockSettings } = useStockSettings();
  
  const [allLowStockItems, setAllLowStockItems] = useState<LowStockItem[]>([]);
  const [metrics, setMetrics] = useState<LowStockMetrics>({
    totalItems: 0,
    criticalItems: 0,
    lowItems: 0,
    attentionItems: 0,
    totalValue: 0,
    averageRotation: 0,
    urgentActions: 0
  });

  const debouncedSearch = useDebouncedValue(search, 300);

  // Utiliser la nouvelle RPC pour charger uniquement les produits critiques/faibles
  const { data: lowStockProductsData, isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ['low-stock-products-rpc', tenantId, page, limit, debouncedSearch, category, status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_low_stock_products' as any, {
        p_tenant_id: tenantId,
        p_search: debouncedSearch || null,
        p_category: category || null,
        p_status: status || null,
        p_limit: limit,
        p_offset: (page - 1) * limit
      });

      if (error) {
        console.error('❌ [LOW STOCK RPC] Erreur:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 secondes
  });

  // Récupérer les catégories pour les filtres
  const { data: categories = [] } = useTenantQueryWithCache(
    ['categories-for-low-stock-filters'],
    'famille_produit',
    'id, libelle_famille'
  );

  // Process products to determine low stock status et charger les métriques
  useEffect(() => {
    const processLowStockData = async () => {
      // ✅ Charger les métriques depuis la RPC corrigée
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_low_stock_metrics_v2' as any, {
          p_tenant_id: tenantId,
          p_critical_threshold: 5,
          p_low_threshold: 10
        });
      
      if (metricsError) {
        console.error('❌ [LOW STOCK METRICS] Erreur lors du chargement des métriques:', metricsError);
      }
      
      const metricsJson = metricsData as any;
      if (metricsJson && typeof metricsJson === 'object') {
        setMetrics({
          totalItems: Number(metricsJson.totalItems) || 0,
          criticalItems: Number(metricsJson.criticalItems) || 0,
          lowItems: Number(metricsJson.lowItems) || 0,
          attentionItems: 0, // Pas utilisé dans la nouvelle logique
          totalValue: parseFloat(String(metricsJson.totalValue)) || 0,
          averageRotation: 0,
          urgentActions: Number(metricsJson.urgentActions) || 0
        });
      }

      if (!lowStockProductsData || !Array.isArray(lowStockProductsData) || lowStockProductsData.length === 0) {
        setAllLowStockItems([]);
        return;
      }

      console.log('🔍 [LOW STOCK PAGINATED] Traitement de', lowStockProductsData.length, 'produits depuis RPC');

      // Convertir les données RPC en format LowStockItem
      const processedItems: LowStockItem[] = lowStockProductsData.map((product: any) => {
        // Déterminer la rotation (logique simplifiée)
        const daysSinceUpdate = Math.floor((Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        const rotation: 'rapide' | 'normale' | 'lente' = 
          daysSinceUpdate < 7 ? 'rapide' :
          daysSinceUpdate < 30 ? 'normale' : 'lente';

        return {
          id: product.id,
          tenant_id: product.tenant_id,
          codeProduit: product.code_cip || '',
          nomProduit: product.libelle_produit,
          dci: product.libelle_produit,
          quantiteActuelle: product.stock_actuel,
          seuilMinimum: product.stock_limite || 10,
          seuilOptimal: product.stock_alerte || (product.stock_limite || 10) * 3,
          unite: 'unité',
          categorie: product.famille_libelle || 'Non classé',
          fournisseurPrincipal: 'N/A',
          prixUnitaire: product.prix_achat || 0,
          valeurStock: product.valeur_stock || 0,
          dernierMouvement: new Date(product.updated_at),
          statut: product.statut_stock as 'critique' | 'faible' | 'attention',
          famille_id: product.famille_id,
          rayon_id: product.rayon_id,
          rotation,
          jours_sans_mouvement: daysSinceUpdate
        };
      });

      console.log('📊 [LOW STOCK PAGINATED] Items traités depuis RPC:', processedItems.length);
      setAllLowStockItems(processedItems);
    };

    processLowStockData();
  }, [lowStockProductsData, tenantId]);

  // Filter and sort items (simplifié car la RPC fait déjà le filtrage principal)
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...allLowStockItems];

    // Le filtrage par recherche, catégorie et statut est déjà fait par la RPC
    // On garde seulement le tri local
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof LowStockItem];
      let bValue: any = b[sortBy as keyof LowStockItem];

      // Handle special sorting cases
      if (sortBy === 'nomProduit') {
        aValue = a.nomProduit;
        bValue = b.nomProduit;
      } else if (sortBy === 'quantiteActuelle') {
        aValue = a.quantiteActuelle;
        bValue = b.quantiteActuelle;
      } else if (sortBy === 'seuilMinimum') {
        aValue = a.seuilMinimum;
        bValue = b.seuilMinimum;
      } else if (sortBy === 'valeurStock') {
        aValue = a.valeurStock;
        bValue = b.valeurStock;
      } else if (sortBy === 'dernierMouvement') {
        aValue = a.dernierMouvement ? new Date(a.dernierMouvement).getTime() : 0;
        bValue = b.dernierMouvement ? new Date(b.dernierMouvement).getTime() : 0;
      } else if (sortBy === 'statut') {
        const statusOrder = { 'critique': 3, 'faible': 2, 'attention': 1 };
        aValue = statusOrder[a.statut];
        bValue = statusOrder[b.statut];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [allLowStockItems, sortBy, sortOrder]);

  // Pagination locale pour les items filtrés et triés
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, page, limit]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / limit);
  const totalItems = filteredAndSortedItems.length;

  // Souscription temps réel aux changements de lots/produits pour mise à jour automatique
  useEffect(() => {
    const channel = (supabase as any)
      .channel('low-stock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lots', filter: `tenant_id=eq.${tenantId}` }, () => {
        refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produits', filter: `tenant_id=eq.${tenantId}` }, () => {
        refetch();
      })
      .subscribe();
  
    return () => {
      try {
        (supabase as any).removeChannel(channel);
      } catch {}
    };
  }, [tenantId, refetch]);

  return {
    lowStockItems: paginatedItems,
    allItemsCount: totalItems,
    metrics,
    categories,
    totalPages,
    isLoading: isLoadingProducts,
    refetch,
    filters: {
      search: debouncedSearch,
      category,
      status
    }
  };
};