import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface OptimizationMetrics {
  id: string;
  metric_date: string;
  total_suggestions_generated: number;
  suggestions_applied: number;
  suggestions_ignored: number;
  expirations_avoided: number;
  expirations_avoided_value: number;
  stock_reorders_suggested: number;
  fifo_corrections: number;
  total_savings: number;
  metadata: any;
}

export const useLotOptimizationMetrics = () => {
  const { tenantId } = useTenant();
  
  // Récupérer les métriques du jour
  const useTodayMetrics = () => {
    return useQuery({
      queryKey: ['lot-optimization-metrics', 'today', tenantId],
      queryFn: async () => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('lot_optimization_metrics')
          .select('*')
          .eq('tenant_id', tenantId!)
          .eq('metric_date', today)
          .maybeSingle();
        
        if (error) throw error;
        
        // Retourner des métriques par défaut si aucune n'existe
        return data || {
          metric_date: today,
          total_suggestions_generated: 0,
          suggestions_applied: 0,
          suggestions_ignored: 0,
          expirations_avoided: 0,
          expirations_avoided_value: 0,
          stock_reorders_suggested: 0,
          fifo_corrections: 0,
          total_savings: 0,
          metadata: {}
        };
      },
      enabled: !!tenantId
    });
  };
  
  // Récupérer l'historique des métriques
  const useMetricsHistory = (days: number = 30) => {
    return useQuery({
      queryKey: ['lot-optimization-metrics', 'history', days, tenantId],
      queryFn: async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const { data, error } = await supabase
          .from('lot_optimization_metrics')
          .select('*')
          .eq('tenant_id', tenantId!)
          .gte('metric_date', startDate.toISOString().split('T')[0])
          .order('metric_date', { ascending: true });
        
        if (error) throw error;
        return data as OptimizationMetrics[];
      },
      enabled: !!tenantId
    });
  };

  // Récupérer le résumé des métriques totales
  const useTotalMetrics = () => {
    return useQuery({
      queryKey: ['lot-optimization-metrics', 'total', tenantId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('lot_optimization_metrics')
          .select('*')
          .eq('tenant_id', tenantId!);
        
        if (error) throw error;
        
        // Calculer les totaux
        const totals = (data || []).reduce((acc, metric) => ({
          totalSuggestions: acc.totalSuggestions + metric.total_suggestions_generated,
          totalApplied: acc.totalApplied + metric.suggestions_applied,
          totalIgnored: acc.totalIgnored + metric.suggestions_ignored,
          totalExpirationsAvoided: acc.totalExpirationsAvoided + metric.expirations_avoided,
          totalReorders: acc.totalReorders + metric.stock_reorders_suggested,
          totalFIFOCorrections: acc.totalFIFOCorrections + metric.fifo_corrections,
          totalSavings: acc.totalSavings + metric.total_savings
        }), {
          totalSuggestions: 0,
          totalApplied: 0,
          totalIgnored: 0,
          totalExpirationsAvoided: 0,
          totalReorders: 0,
          totalFIFOCorrections: 0,
          totalSavings: 0
        });

        return {
          ...totals,
          applicationRate: totals.totalSuggestions > 0 
            ? (totals.totalApplied / totals.totalSuggestions) * 100 
            : 0
        };
      },
      enabled: !!tenantId
    });
  };

  // Calculer les métriques des dernières suggestions
  const useRecentSuggestions = () => {
    return useQuery({
      queryKey: ['lot-optimization-suggestions', 'recent', tenantId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('lot_optimization_suggestions')
          .select('*')
          .eq('tenant_id', tenantId!)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        const byType = (data || []).reduce((acc, suggestion) => {
          acc[suggestion.suggestion_type] = (acc[suggestion.suggestion_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const byStatus = (data || []).reduce((acc, suggestion) => {
          acc[suggestion.status] = (acc[suggestion.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          total: data?.length || 0,
          byType,
          byStatus,
          applied: byStatus.applied || 0,
          pending: byStatus.pending || 0,
          ignored: byStatus.ignored || 0
        };
      },
      enabled: !!tenantId
    });
  };
  
  return {
    useTodayMetrics,
    useMetricsHistory,
    useTotalMetrics,
    useRecentSuggestions
  };
};