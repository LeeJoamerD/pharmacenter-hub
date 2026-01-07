import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

export interface PriceCategory {
  id: string;
  tenant_id: string;
  libelle_categorie: string; // name
  coefficient_prix_vente: number; // multiplier
  taux_tva: number;
  taux_centime_additionnel: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePriceCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['price-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorie_tarification')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (category: Omit<PriceCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('categorie_tarification')
        .insert({
          ...category,
          taux_tva: category.taux_tva || DEFAULT_SETTINGS.taxes.tva,
          taux_centime_additionnel: category.taux_centime_additionnel || DEFAULT_SETTINGS.taxes.centimeAdditionnel,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      toast({
        title: "Catégorie créée",
        description: "La catégorie de prix a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie de prix.",
        variant: "destructive",
      });
      console.error('Error creating price category:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<PriceCategory>) => {
      const { data, error } = await supabase
        .from('categorie_tarification')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      toast({
        title: "Catégorie mise à jour",
        description: "La catégorie de prix a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie de prix.",
        variant: "destructive",
      });
      console.error('Error updating price category:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorie_tarification')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-categories'] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie de prix a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie de prix.",
        variant: "destructive",
      });
      console.error('Error deleting price category:', error);
    },
  });

  return {
    categories: query.data,
    loading: query.isLoading,
    error: query.error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isUpdating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};