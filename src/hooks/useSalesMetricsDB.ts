import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface SalesMetrics {
  dailyRevenue: number;
  yesterdayRevenue: number;
  dailyTransactions: number;
  averageBasket: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  monthlyProgress: number;
  pendingInvoices: number;
}

export interface CashRegister {
  id: string;
  name: string;
  code: string;
  status: 'open' | 'closed';
  currentAmount: number;
  openedAt: string | null;
  lastTransaction: string | null;
  session_id: string | null;
  agent_name: string | null;
}

export interface RecentTransaction {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  timestamp: string;
  payment_type: string;
  agent_name: string;
  status: string;
  cash_register: string;
  discount: number;
}

interface TransactionsResponse {
  data: RecentTransaction[];
  total: number;
  page: number;
  limit: number;
}

interface TransactionFilters {
  search?: string;
  caisse_id?: string;
  agent_id?: string;
  date_debut?: string;
  date_fin?: string;
}

export const useSalesMetricsDB = (
  transactionsPage: number = 1,
  transactionsLimit: number = 10,
  filters: TransactionFilters = {}
) => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Query 1: Métriques principales (pas de pagination, juste des agrégations)
  const { 
    data: metrics, 
    isLoading: metricsLoading,
    error: metricsError 
  } = useQuery<SalesMetrics>({
    queryKey: ['sales-dashboard-metrics', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');
      
      const { data, error } = await supabase.rpc('get_sales_dashboard_metrics', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      return data as unknown as SalesMetrics;
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    staleTime: 20000
  });

  // Query 2: État des caisses (pas de pagination, liste courte)
  const { 
    data: cashRegisters = [], 
    isLoading: registersLoading,
    error: registersError 
  } = useQuery<CashRegister[]>({
    queryKey: ['cash-registers-status', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');
      
      const { data, error } = await supabase.rpc('get_cash_registers_status', {
        p_tenant_id: tenantId
      });
      
      if (error) throw error;
      return (data as unknown as CashRegister[]) || [];
    },
    enabled: !!tenantId,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Query 3: Transactions récentes (AVEC PAGINATION)
  const { 
    data: transactionsResponse, 
    isLoading: transactionsLoading,
    error: transactionsError 
  } = useQuery<TransactionsResponse>({
    queryKey: [
      'recent-transactions', 
      tenantId, 
      transactionsPage, 
      transactionsLimit,
      filters
    ],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');
      
      const { data, error } = await supabase.rpc('get_recent_sales_transactions', {
        p_tenant_id: tenantId,
        p_limit: transactionsLimit,
        p_offset: (transactionsPage - 1) * transactionsLimit,
        p_search: filters.search || null,
        p_caisse_id: filters.caisse_id || null,
        p_agent_id: filters.agent_id || null,
        p_date_debut: filters.date_debut || null,
        p_date_fin: filters.date_fin || null
      });
      
      if (error) throw error;
      
      // Parser le JSONB retourné
      const response = data as any;
      return {
        data: response?.data || [],
        total: response?.total || 0,
        page: response?.page || 1,
        limit: response?.limit || transactionsLimit
      };
    },
    enabled: !!tenantId,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Mutation pour rafraîchir manuellement
  const refreshMetrics = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-dashboard-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['cash-registers-status'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-transactions'] })
      ]);
    }
  });

  // Real-time updates
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('sales-realtime-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ventes',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sales-dashboard-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions_caisse',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cash-registers-status'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);

  // Calculs dérivés pour les caisses
  const activeCashRegisters = cashRegisters.filter(r => r.status === 'open').length;
  const totalCashAmount = cashRegisters.reduce((sum, r) => sum + (r.currentAmount || 0), 0);

  // Calcul de la variation journalière
  const dailyVariation = metrics?.yesterdayRevenue 
    ? ((metrics.dailyRevenue - metrics.yesterdayRevenue) / metrics.yesterdayRevenue) * 100
    : 0;

  // Pagination pour les transactions
  const totalTransactionsPages = Math.ceil((transactionsResponse?.total || 0) / transactionsLimit);

  return {
    // Métriques enrichies
    metrics: metrics ? {
      ...metrics,
      dailyVariation,
      activeCashRegisters,
      totalCashAmount,
      cashRegisters
    } : null,
    
    // Caisses
    cashRegisters,
    
    // Transactions paginées
    recentTransactions: transactionsResponse?.data || [],
    totalTransactions: transactionsResponse?.total || 0,
    totalTransactionsPages,
    currentTransactionsPage: transactionsResponse?.page || 1,
    
    // États de chargement
    loading: metricsLoading || registersLoading || transactionsLoading,
    error: metricsError || registersError || transactionsError,
    
    // Actions
    refreshMetrics: refreshMetrics.mutate,
    isRefreshing: refreshMetrics.isPending
  };
};
