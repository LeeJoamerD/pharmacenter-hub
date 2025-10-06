import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface SalesSuggestion {
  id: string;
  tenant_id: string;
  lot_id: string;
  produit_id: string;
  numero_lot: string;
  libelle_produit: string;
  code_cip?: string;
  quantite_disponible: number;
  date_peremption?: string;
  jours_avant_expiration?: number;
  priorite: 'haute' | 'moyenne' | 'faible';
  prix_vente_suggere: number;
  remise_suggere?: number;
  motif_suggestion: string;
  statut: 'active' | 'ignoree' | 'vendue' | 'promue';
  created_at: string;
  updated_at: string;
}

export interface CreateSalesSuggestionData {
  lot_id: string;
  produit_id: string;
  priorite: 'haute' | 'moyenne' | 'faible';
  prix_vente_suggere: number;
  remise_suggere?: number;
  motif_suggestion: string;
}

export interface UpdateSalesSuggestionData {
  priorite?: 'haute' | 'moyenne' | 'faible';
  prix_vente_suggere?: number;
  remise_suggere?: number;
  motif_suggestion?: string;
  statut?: 'active' | 'ignoree' | 'vendue' | 'promue';
}

export const useSalesSuggestions = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Récupérer toutes les suggestions de vente
  const {
    data: suggestions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['sales-suggestions', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase
        .from('suggestions_vente')
        .select(`
          *,
          lots!inner(
            numero_lot,
            date_peremption,
            quantite_restante,
            produits!inner(
              libelle_produit,
              code_cip,
              prix_vente_ttc
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(suggestion => ({
        ...suggestion,
        numero_lot: suggestion.lots?.numero_lot || '',
        libelle_produit: suggestion.lots?.produits?.libelle_produit || '',
        code_cip: suggestion.lots?.produits?.code_cip || '',
        quantite_disponible: suggestion.lots?.quantite_restante || 0,
        date_peremption: suggestion.lots?.date_peremption || undefined,
        jours_avant_expiration: suggestion.lots?.date_peremption 
          ? Math.ceil((new Date(suggestion.lots.date_peremption).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : undefined
      })) as SalesSuggestion[] || [];
    },
    enabled: !!tenantId,
  });

  // Générer des suggestions automatiques
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      // Appeler la fonction de génération de suggestions
      const { data, error } = await supabase.rpc('generate_sales_suggestions', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-suggestions'] });
    },
  });

  // Créer une suggestion manuelle
  const createSuggestionMutation = useMutation({
    mutationFn: async (suggestionData: CreateSalesSuggestionData) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase
        .from('suggestions_vente')
        .insert({
          ...suggestionData,
          tenant_id: tenantId,
          statut: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-suggestions'] });
    },
  });

  // Mettre à jour une suggestion
  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & UpdateSalesSuggestionData) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { data, error } = await supabase
        .from('suggestions_vente')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-suggestions'] });
    },
  });

  // Supprimer une suggestion
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      const { error } = await supabase
        .from('suggestions_vente')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-suggestions'] });
    },
  });

  // Actions spécifiques pour les boutons
  const ignoreSuggestion = (id: string) => {
    return updateSuggestionMutation.mutateAsync({ id, statut: 'ignoree' });
  };

  const promoteSuggestion = (id: string) => {
    return updateSuggestionMutation.mutateAsync({ id, statut: 'promue' });
  };

  const markAsSold = (id: string) => {
    return updateSuggestionMutation.mutateAsync({ id, statut: 'vendue' });
  };

  return {
    suggestions,
    isLoading,
    error,
    refetch,
    generateSuggestions: generateSuggestionsMutation.mutateAsync,
    createSuggestion: createSuggestionMutation.mutateAsync,
    updateSuggestion: updateSuggestionMutation.mutateAsync,
    deleteSuggestion: deleteSuggestionMutation.mutateAsync,
    ignoreSuggestion,
    promoteSuggestion,
    markAsSold,
    isGenerating: generateSuggestionsMutation.isPending,
    isCreating: createSuggestionMutation.isPending,
    isUpdating: updateSuggestionMutation.isPending,
    isDeleting: deleteSuggestionMutation.isPending,
  };
};