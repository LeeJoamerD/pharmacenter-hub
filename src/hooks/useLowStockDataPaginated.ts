import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantQuery } from './useTenantQuery';
import { useAlertThresholds } from './useAlertThresholds';
import { useAlertSettings } from './useAlertSettings';
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
  const { settings: alertSettings } = useAlertSettings();
  
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
  const { data: lowStockResponse, isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ['low-stock-products-rpc', tenantId, page, limit, debouncedSearch, category, status, sortBy, sortOrder],
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

      // ✅ Parser la structure JSONB correctement
      const response = data as any;
      return {
        data: response?.data || [],
        total: response?.total || 0
      };
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Extraire les données de la réponse
  const lowStockProductsData = (lowStockResponse as any)?.data || [];
  const totalCount = (lowStockResponse as any)?.total || 0;

  // Récupérer les catégories pour les filtres
  const { data: categories = [] } = useTenantQueryWithCache(
    ['categories-for-low-stock-filters'],
    'famille_produit',
    'id, libelle_famille'
  );

  // Charger les métriques une seule fois au montage ou changement de tenant
  useEffect(() => {
    const loadMetrics = async () => {
      if (!tenantId) return;

      // ✅ Utiliser la même RPC que le module Stock Actuel
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_stock_metrics', {
          p_tenant_id: tenantId
        });
      
      if (metricsError) {
        console.error('❌ [LOW STOCK METRICS] Erreur lors du chargement des métriques:', metricsError);
        return;
      }
      
      const metricsJson = metricsData as any;
      if (metricsJson && typeof metricsJson === 'object') {
        setMetrics({
          // ✅ Mapper vers les champs attendus par LowStockMetrics
          totalItems: Number(metricsJson.criticalStockProducts || 0) + Number(metricsJson.lowStockProducts || 0),
          criticalItems: Number(metricsJson.criticalStockProducts || 0),
          lowItems: Number(metricsJson.lowStockProducts || 0),
          attentionItems: 0, // Non utilisé
          totalValue: parseFloat(String(metricsJson.totalValue)) || 0,
          averageRotation: 0,
          urgentActions: Number(metricsJson.criticalStockProducts || 0) // Produits critiques = urgents
        });
      }
    };

    loadMetrics();
  }, [tenantId]); // ✅ NE PLUS dépendre de lowStockProductsData

  // ✅ Traiter les produits directement depuis la RPC (pas de state intermédiaire)
  const processedLowStockItems = useMemo(() => {
    if (!lowStockProductsData || !Array.isArray(lowStockProductsData)) {
      return [];
    }

    return lowStockProductsData.map((product: any) => {
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
      } as LowStockItem;
    });
  }, [lowStockProductsData]);

  // ✅ Calculer les pages avec le total de la RPC (pas de filtrage/tri/pagination côté client)
  const totalPages = Math.ceil(totalCount / limit);

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
    lowStockItems: processedLowStockItems,  // ✅ Directement depuis la RPC
    allItemsCount: totalCount,              // ✅ Total de la RPC
    metrics,
    categories,
    totalPages,                             // ✅ Calculé avec le total de la RPC
    isLoading: isLoadingProducts,
    refetch,
    filters: {
      search: debouncedSearch,
      category,
      status
    }
  };
};