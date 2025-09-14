import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface AlertRule {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  rule_type: string;
  conditions: any;
  threshold_value?: number;
  threshold_operator: string;
  notification_channels: string[];
  recipients: any;
  is_active: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_triggered_at?: string;
}

export const useAlertRules = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alert-rules', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', tenantId] });
      toast({
        title: "Règle créée",
        description: "La règle d'alerte a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle d'alerte.",
        variant: "destructive",
      });
      console.error('Error creating alert rule:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlertRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', tenantId] });
      toast({
        title: "Règle mise à jour",
        description: "La règle d'alerte a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la règle d'alerte.",
        variant: "destructive",
      });
      console.error('Error updating alert rule:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', tenantId] });
      toast({
        title: "Règle supprimée",
        description: "La règle d'alerte a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle d'alerte.",
        variant: "destructive",
      });
      console.error('Error deleting alert rule:', error);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules', tenantId] });
      toast({
        title: data.is_active ? "Règle activée" : "Règle désactivée",
        description: `La règle d'alerte a été ${data.is_active ? 'activée' : 'désactivée'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la règle.",
        variant: "destructive",
      });
      console.error('Error toggling alert rule:', error);
    },
  });

  const createRule = async (rule: Omit<AlertRule, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    return createMutation.mutateAsync({ ...rule, tenant_id: tenantId });
  };

  const updateRule = async (id: string, updates: Partial<AlertRule>) => {
    return updateMutation.mutateAsync({ ...updates, id });
  };

  const deleteRule = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const toggleRule = async (id: string) => {
    const rule = query.data?.find(r => r.id === id);
    if (rule) {
      return toggleMutation.mutateAsync({ id, is_active: !rule.is_active });
    }
  };

  return {
    rules: query.data,
    loading: query.isLoading,
    error: query.error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    isUpdating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleMutation.isPending,
  };
};