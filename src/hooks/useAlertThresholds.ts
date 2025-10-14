import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AlertThreshold {
  id: string;
  tenant_id: string;
  category: string;
  threshold: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useAlertThresholds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_thresholds_by_category')
        .select('*')
        .order('category');

      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AlertThreshold>) => {
      const { data, error } = await supabase
        .from('alert_thresholds_by_category')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      toast({
        title: "Seuil mis à jour",
        description: "Le seuil d'alerte a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le seuil d'alerte.",
        variant: "destructive",
      });
      console.error('Error updating alert threshold:', error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (threshold: Omit<AlertThreshold, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('alert_thresholds_by_category')
        .insert(threshold)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      toast({
        title: "Seuil créé",
        description: "Le seuil d'alerte a été créé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le seuil d'alerte.",
        variant: "destructive",
      });
      console.error('Error creating alert threshold:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_thresholds_by_category')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      toast({
        title: "Seuil supprimé",
        description: "Le seuil d'alerte a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le seuil d'alerte.",
        variant: "destructive",
      });
      console.error('Error deleting alert threshold:', error);
    },
  });

  return {
    thresholds: query.data,
    loading: query.isLoading,
    error: query.error,
    updateThreshold: updateMutation.mutateAsync,
    createThreshold: createMutation.mutateAsync,
    deleteThreshold: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending || createMutation.isPending || deleteMutation.isPending,
  };
};