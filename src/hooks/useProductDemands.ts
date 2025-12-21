import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';

export interface ProductDemand {
  id: string;
  tenant_id: string;
  produit_id: string;
  nombre_demandes: number;
  derniere_demande: string;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  produit?: {
    id: string;
    libelle_produit: string;
    code_cip: string | null;
  };
}

export const useProductDemands = () => {
  const { tenantId, currentUser } = useTenant();
  const queryClient = useQueryClient();

  // Récupérer toutes les demandes
  const {
    data: demands = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['product-demands', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('demandes_produits_clients')
        .select(`
          *,
          produit:produits(id, libelle_produit, code_cip)
        `)
        .eq('tenant_id', tenantId)
        .order('nombre_demandes', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ProductDemand[];
    },
    enabled: !!tenantId
  });

  // Récupérer le nombre de demandes pour un produit spécifique
  const getProductDemandCount = useCallback(async (productId: string): Promise<number> => {
    if (!tenantId) return 0;

    const { data, error } = await supabase
      .from('demandes_produits_clients')
      .select('nombre_demandes')
      .eq('tenant_id', tenantId)
      .eq('produit_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching demand count:', error);
      return 0;
    }

    return data?.nombre_demandes || 0;
  }, [tenantId]);

  // Enregistrer/Incrémenter une demande (UPSERT)
  const recordDemandMutation = useMutation({
    mutationFn: async ({ productId, notes }: { productId: string; notes?: string }) => {
      if (!tenantId) throw new Error('Tenant ID manquant');

      // Vérifier si une demande existe déjà
      const { data: existing } = await supabase
        .from('demandes_produits_clients')
        .select('id, nombre_demandes')
        .eq('tenant_id', tenantId)
        .eq('produit_id', productId)
        .maybeSingle();

      if (existing) {
        // Incrémenter
        const { data, error } = await supabase
          .from('demandes_produits_clients')
          .update({
            nombre_demandes: existing.nombre_demandes + 1,
            derniere_demande: new Date().toISOString(),
            notes: notes || null
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { ...data, isNew: false, newCount: existing.nombre_demandes + 1 };
      } else {
        // Créer
        const { data, error } = await supabase
          .from('demandes_produits_clients')
          .insert({
            tenant_id: tenantId,
            produit_id: productId,
            nombre_demandes: 1,
            derniere_demande: new Date().toISOString(),
            created_by: currentUser?.id || null,
            notes: notes || null
          })
          .select()
          .single();

        if (error) throw error;
        return { ...data, isNew: true, newCount: 1 };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-demands', tenantId] });
      toast({
        title: result.isNew ? 'Demande enregistrée' : 'Demande incrémentée',
        description: `Nombre total de demandes: ${result.newCount}`
      });
    },
    onError: (error) => {
      console.error('Error recording demand:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la demande',
        variant: 'destructive'
      });
    }
  });

  // Supprimer une demande
  const deleteDemandMutation = useMutation({
    mutationFn: async (demandId: string) => {
      const { error } = await supabase
        .from('demandes_produits_clients')
        .delete()
        .eq('id', demandId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-demands', tenantId] });
      toast({
        title: 'Demande supprimée',
        description: 'La demande a été retirée de la liste'
      });
    },
    onError: (error) => {
      console.error('Error deleting demand:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la demande',
        variant: 'destructive'
      });
    }
  });

  // Compter le total des demandes en attente
  const totalDemandsCount = demands.reduce((sum, d) => sum + d.nombre_demandes, 0);
  const uniqueProductsCount = demands.length;

  return {
    demands,
    isLoading,
    error,
    refetch,
    getProductDemandCount,
    recordDemand: recordDemandMutation.mutateAsync,
    isRecording: recordDemandMutation.isPending,
    deleteDemand: deleteDemandMutation.mutateAsync,
    isDeleting: deleteDemandMutation.isPending,
    totalDemandsCount,
    uniqueProductsCount
  };
};
