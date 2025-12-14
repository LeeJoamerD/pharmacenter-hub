import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface LotMetrics {
  totalLots: number;
  activeLots: number;
  expiredLots: number;
  emptyLots: number;
  expiringLots30: number;
  expiringLots60: number;
  locations: number;
  totalQuantity: number;
  totalValue: number;
}

export interface LotsPaginatedParams {
  searchTerm: string;
  pageSize: number;
  currentPage: number;
  statusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface LotsPaginatedResult {
  lots: any[];
  count: number;
  totalPages: number;
  currentPage: number;
  metrics: LotMetrics | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export const useLotsPaginated = (params: LotsPaginatedParams): LotsPaginatedResult => {
  const { tenantId } = useTenant();
  const { searchTerm, pageSize, currentPage, statusFilter, sortBy, sortOrder } = params;

  // Fetch metrics via RPC
  const { data: metricsData } = useQuery({
    queryKey: ['lot-metrics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_lot_metrics', { p_tenant_id: tenantId });
      
      if (error) throw error;
      return data as unknown as LotMetrics;
    },
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch paginated lots with filters using optimized RPC
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['lots-paginated', tenantId, searchTerm, pageSize, currentPage, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('search_lots_paginated', {
          p_tenant_id: tenantId,
          p_search_term: searchTerm || null,
          p_status_filter: statusFilter,
          p_sort_by: sortBy,
          p_sort_order: sortOrder,
          p_page_size: pageSize,
          p_current_page: currentPage
        });

      if (error) throw error;

      // Handle the JSON response from the RPC
      const result = data as { lots: any[]; count: number } | null;
      
      return {
        lots: result?.lots || [],
        count: result?.count || 0,
      };
    },
    enabled: !!tenantId,
    placeholderData: keepPreviousData, // Keep previous data while loading new results
    staleTime: 10000, // 10 seconds
  });

  const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;

  return {
    lots: data?.lots || [],
    count: data?.count || 0,
    totalPages,
    currentPage,
    metrics: metricsData || null,
    isLoading,
    isFetching,
    error: error as Error | null,
  };
};
