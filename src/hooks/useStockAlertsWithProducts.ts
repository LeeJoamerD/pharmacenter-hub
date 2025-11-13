import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useDebouncedValue } from './use-debounce';

export interface StockAlertProduct {
  id: string;
  tenant_id: string;
  code_produit: string;
  nom_produit: string;
  dci: string;
  stock_actuel: number;
  seuil_critique: number;
  seuil_faible: number;
  seuil_limite: number;
  unite: string;
  categorie: string;
  famille_id: string;
  rayon_id: string;
  prix_unitaire: number;
  valeur_stock: number;
  dernier_mouvement: string | null;
  stock_status: 'rupture' | 'critique' | 'faible' | 'normal' | 'surstock';
  rotation: 'rapide' | 'normale' | 'lente';
  jours_sans_mouvement: number;
}

export interface StockAlertMetrics {
  totalItems: number;
  ruptureItems: number;
  criticalItems: number;
  lowItems: number;
  totalValue: number;
}

interface UseStockAlertsWithProductsParams {
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const useStockAlertsWithProducts = (params: UseStockAlertsWithProductsParams = {}) => {
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
  const debouncedSearch = useDebouncedValue(search, 300);

  const [metrics, setMetrics] = useState<StockAlertMetrics>({
    totalItems: 0,
    ruptureItems: 0,
    criticalItems: 0,
    lowItems: 0,
    totalValue: 0
  });

  // Utiliser la RPC pour charger les alertes avec pagination et métriques globales
  const { data: alertsResponse, isLoading, refetch } = useQuery({
    queryKey: ['stock-alerts-with-products', tenantId, page, limit, debouncedSearch, category, status, sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_stock_alerts_with_products' as any, {
        p_tenant_id: tenantId,
        p_search: debouncedSearch || null,
        p_category: category || null,
        p_status: status || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
        p_limit: limit,
        p_offset: (page - 1) * limit
      });

      if (error) {
        console.error('❌ [STOCK ALERTS RPC] Erreur:', error);
        throw error;
      }

      return data;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Extraire les données de la réponse (nouvelle structure avec métriques)
  const alertProducts: StockAlertProduct[] = (alertsResponse as any)?.data || [];
  const totalCount: number = (alertsResponse as any)?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Utiliser les métriques GLOBALES calculées côté serveur (pas uniquement la page courante)
  const globalMetrics: StockAlertMetrics = {
    totalItems: (alertsResponse as any)?.metrics?.total_alerts || 0,
    ruptureItems: (alertsResponse as any)?.metrics?.ruptures || 0,
    criticalItems: (alertsResponse as any)?.metrics?.critiques || 0,
    lowItems: (alertsResponse as any)?.metrics?.faibles || 0,
    totalValue: (alertsResponse as any)?.metrics?.total_value || 0
  };

  return {
    alertProducts,
    totalCount,
    totalPages,
    currentPage: page,
    metrics: globalMetrics,
    isLoading,
    refetch
  };
};
