import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarginRule {
  id: string;
  tenant_id: string;
  category: string;
  margin: number;
  min_price: number;
  max_price?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMarginRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['margin-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('margin_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (rule: Omit<MarginRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('margin_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margin-rules'] });
      toast({
        title: "Règle créée",
        description: "La règle de marge a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle de marge.",
        variant: "destructive",
      });
      console.error('Error creating margin rule:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MarginRule>) => {
      const { data, error } = await supabase
        .from('margin_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margin-rules'] });
      toast({
        title: "Règle mise à jour",
        description: "La règle de marge a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la règle de marge.",
        variant: "destructive",
      });
      console.error('Error updating margin rule:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('margin_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margin-rules'] });
      toast({
        title: "Règle supprimée",
        description: "La règle de marge a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle de marge.",
        variant: "destructive",
      });
      console.error('Error deleting margin rule:', error);
    },
  });

  return {
    rules: query.data,
    loading: query.isLoading,
    error: query.error,
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    isUpdating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};