import { useQuery } from "@tanstack/react-query";
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
  });

  // Fetch paginated lots with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['lots-paginated', tenantId, searchTerm, pageSize, currentPage, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('lots')
        .select(`
          *,
          produit:produits (
            id,
            libelle_produit,
            code_cip,
            niveau_detail,
            produit_detail (
              quantite_unites_details_source
            )
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Apply status filters
      if (statusFilter === 'actif') {
        query = query
          .gt('quantite_restante', 0)
          .or('date_peremption.is.null,date_peremption.gt.now()');
      } else if (statusFilter === 'expire') {
        query = query.lte('date_peremption', new Date().toISOString());
      } else if (statusFilter === 'epuise') {
        query = query.eq('quantite_restante', 0);
      } else if (statusFilter === 'expiration_proche') {
        const today = new Date();
        const in60Days = new Date();
        in60Days.setDate(today.getDate() + 60);
        query = query
          .gt('date_peremption', today.toISOString())
          .lte('date_peremption', in60Days.toISOString());
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `numero_lot.ilike.%${searchTerm}%,produit.libelle_produit.ilike.%${searchTerm}%`
        );
      }

      // Apply sorting
      const orderColumn = sortBy === 'date_peremption' ? 'date_peremption' :
                         sortBy === 'numero_lot' ? 'numero_lot' :
                         sortBy === 'produit' ? 'produit.libelle_produit' :
                         sortBy === 'stock' ? 'quantite_restante' :
                         'date_peremption';

      query = query.order(orderColumn, { ascending: sortOrder === 'asc', nullsFirst: false });

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        lots: data || [],
        count: count || 0,
      };
    },
    enabled: !!tenantId,
  });

  const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;

  return {
    lots: data?.lots || [],
    count: data?.count || 0,
    totalPages,
    currentPage,
    metrics: metricsData || null,
    isLoading,
    error: error as Error | null,
  };
};
