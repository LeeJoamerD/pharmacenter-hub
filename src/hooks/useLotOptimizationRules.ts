import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface OptimizationRule {
  id?: string;
  rule_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  priority: number;
  conditions: any;
  actions: any;
}

export const useLotOptimizationRules = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  
  // Récupérer les règles configurées
  const useRulesQuery = () => {
    return useQuery({
      queryKey: ['lot-optimization-rules', tenantId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('lot_optimization_rules')
          .select('*')
          .eq('tenant_id', tenantId!)
          .order('priority', { ascending: true });
        
        if (error) throw error;
        return data as OptimizationRule[];
      },
      enabled: !!tenantId
    });
  };
  
  // Créer/Mettre à jour une règle
  const upsertRuleMutation = useMutation({
    mutationFn: async (rule: OptimizationRule) => {
      const { data, error } = await supabase
        .from('lot_optimization_rules')
        .upsert({
          tenant_id: tenantId,
          rule_id: rule.rule_id,
          name: rule.name,
          description: rule.description,
          is_active: rule.is_active,
          priority: rule.priority,
          conditions: rule.conditions,
          actions: rule.actions,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot-optimization-rules'] });
      toast.success('Règle mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  });
  
  // Toggle actif/inactif
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('lot_optimization_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId!)
        .eq('rule_id', ruleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot-optimization-rules'] });
      toast.success('Règle mise à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  // Initialiser les règles par défaut si aucune n'existe
  const initializeDefaultRules = useMutation({
    mutationFn: async () => {
      const defaultRules: OptimizationRule[] = [
        {
          rule_id: 'expiration_optimization',
          name: 'Optimisation des Expirations',
          description: 'Suggère des actions pour les lots proches de l\'expiration',
          is_active: true,
          priority: 1,
          conditions: { daysToExpiration: { lte: 30 } },
          actions: { type: 'promotion', discount: 10 }
        },
        {
          rule_id: 'fifo_compliance',
          name: 'Conformité FIFO',
          description: 'Vérifie et corrige la conformité aux règles FIFO',
          is_active: true,
          priority: 2,
          conditions: { fifoViolation: true },
          actions: { type: 'reorder', priority: 'high' }
        },
        {
          rule_id: 'stock_balancing',
          name: 'Équilibrage des Stocks',
          description: 'Redistribue les stocks selon les niveaux optimaux',
          is_active: true,
          priority: 3,
          conditions: { stockLevel: { lte: 10 } },
          actions: { type: 'transfer', threshold: 20 }
        },
        {
          rule_id: 'value_optimization',
          name: 'Optimisation de la Valeur',
          description: 'Maximise la valeur du stock par rotation intelligente',
          is_active: false,
          priority: 4,
          conditions: { rotationRate: { lte: 6 } },
          actions: { type: 'promotion', incentive: 'volume' }
        }
      ];

      const promises = defaultRules.map(rule =>
        supabase.from('lot_optimization_rules').upsert({
          tenant_id: tenantId,
          ...rule
        })
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lot-optimization-rules'] });
    }
  });
  
  return {
    useRulesQuery,
    upsertRule: upsertRuleMutation.mutate,
    toggleRule: toggleRuleMutation.mutate,
    initializeDefaultRules: initializeDefaultRules.mutate,
    isUpdating: upsertRuleMutation.isPending || toggleRuleMutation.isPending
  };
};