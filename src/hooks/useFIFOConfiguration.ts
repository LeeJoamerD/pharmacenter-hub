import { useTenantQuery } from './useTenantQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface FIFOConfiguration {
  id: string;
  tenant_id: string;
  produit_id?: string;
  famille_id?: string;
  actif: boolean;
  priorite?: number;
  delai_alerte_jours?: number;
  action_automatique?: boolean;
  type_regle?: string;
  tolerance_delai_jours?: number;
  created_at?: string;
  updated_at?: string;
  // Extended fields for UI (not in database yet)
  activer_fifo?: boolean;
  tolerance_jours?: number;
  ignorer_lots_expires?: boolean;
  priorite_prix?: boolean;
  seuil_alerte_rotation?: number;
}

export interface FIFOConfigurationWithDetails extends FIFOConfiguration {
  produit?: {
    id: string;
    libelle_produit: string;
  };
  famille?: {
    id: string;
    libelle_famille: string;
  };
}

export interface CreateFIFOConfigInput {
  produit_id?: string;
  famille_id?: string;
  actif?: boolean;
  priorite?: number;
  delai_alerte_jours?: number;
  action_automatique?: boolean;
  type_regle?: string;
  tolerance_delai_jours?: number;
  // Extended fields for UI
  activer_fifo?: boolean;
  tolerance_jours?: number;
  ignorer_lots_expires?: boolean;
  priorite_prix?: boolean;
  seuil_alerte_rotation?: number;
}

export interface UpdateFIFOConfigInput extends Partial<CreateFIFOConfigInput> {
  id: string;
}

export const useFIFOConfiguration = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer toutes les configurations FIFO
  const useFIFOConfigurationsQuery = () => {
    return useTenantQueryWithCache(
      ['fifo-configurations'],
      'configurations_fifo',
      `
        *,
        produit:produits(id, libelle_produit),
        famille:famille_produit(id, libelle_famille)
      `,
      {},
      {
        enabled: !!tenantId,
        orderBy: { column: 'created_at', ascending: false },
      }
    );
  };

  // Récupérer une configuration FIFO par ID
  const useFIFOConfigurationQuery = (configId: string) => {
    return useTenantQueryWithCache(
      ['fifo-configuration', configId],
      'configurations_fifo',
      `
        *,
        produit:produits(id, libelle_produit),
        famille:famille_produit(id, libelle_famille)
      `,
      { id: configId },
      {
        enabled: !!tenantId && !!configId,
        single: true,
      }
    );
  };

  // Récupérer la configuration FIFO pour un produit spécifique
  const useFIFOConfigForProduct = (productId: string) => {
    return useQuery({
      queryKey: ['fifo-configuration', 'product', productId],
      queryFn: async () => {
        // D'abord chercher une config spécifique au produit
        let { data: productConfig } = await supabase
          .from('configurations_fifo')
          .select('*')
          .eq('tenant_id', tenantId!)
          .eq('produit_id', productId)
          .single();

        if (productConfig) return productConfig;

        // Sinon chercher une config par famille
        const { data: product }: { data: any } = await supabase
          .from('produits')
          .select('famille_id')
          .eq('id', productId)
          .single();

        if (product?.famille_id) {
          const { data: familyConfig }: { data: any } = await supabase
            .from('configurations_fifo')
            .select('*')
            .eq('tenant_id', tenantId!)
            .eq('famille_id', product.famille_id)
            .single();

          if (familyConfig) return familyConfig;
        }

        // Configuration par défaut
        return {
          activer_fifo: true,
          tolerance_jours: 7,
          ignorer_lots_expires: true,
          priorite_prix: false,
          seuil_alerte_rotation: 30
        };
      },
      enabled: !!tenantId && !!productId,
    });
  };

  // Récupérer les configurations FIFO par famille
  const useFIFOConfigurationsByFamily = (familyId: string) => {
    return useTenantQueryWithCache(
      ['fifo-configurations', 'family', familyId],
      'configurations_fifo',
      '*',
      { famille_id: familyId },
      {
        enabled: !!tenantId && !!familyId,
      }
    );
  };

  // Créer une nouvelle configuration FIFO
  const createFIFOConfigMutation = useTenantMutation('configurations_fifo', 'insert', {
    onSuccess: () => {
      toast.success('Configuration FIFO créée avec succès');
      // Invalider toutes les requêtes liées aux configurations FIFO
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configurations'] });
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configuration'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  // Mettre à jour une configuration FIFO
  const updateFIFOConfigMutation = useTenantMutation('configurations_fifo', 'update', {
    onSuccess: () => {
      toast.success('Configuration FIFO mise à jour avec succès');
      // Invalider toutes les requêtes liées aux configurations FIFO
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configurations'] });
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configuration'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Supprimer une configuration FIFO
  const deleteFIFOConfigMutation = useTenantMutation('configurations_fifo', 'delete', {
    onSuccess: () => {
      toast.success('Configuration FIFO supprimée avec succès');
      // Invalider toutes les requêtes liées aux configurations FIFO
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configurations'] });
      queryClient.invalidateQueries({ queryKey: [tenantId, 'fifo-configuration'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  // Helper function to transform UI data to database format
  const transformToDbFormat = (input: CreateFIFOConfigInput | UpdateFIFOConfigInput) => {
    // Determine type_regle based on which ID is provided - this takes priority over input.type_regle
    let type_regle = 'global'; // Default
    if (input.produit_id) {
      type_regle = 'produit';
    } else if (input.famille_id) {
      type_regle = 'famille';
    }
    // Only use input.type_regle if no specific ID is provided
    else if (input.type_regle) {
      type_regle = input.type_regle;
    }

    // Create clean object without UI-only fields
    const dbData: any = {
      actif: input.activer_fifo ?? input.actif ?? true,
      tolerance_delai_jours: input.tolerance_jours ?? input.tolerance_delai_jours ?? 7,
      delai_alerte_jours: input.seuil_alerte_rotation ?? input.delai_alerte_jours ?? 30,
      priorite: input.priorite ?? 1,
      action_automatique: input.action_automatique ?? false,
      type_regle: type_regle, // Use the determined type_regle, not input.type_regle
    };

    // Add optional fields only if they exist
    if (input.produit_id) dbData.produit_id = input.produit_id;
    if (input.famille_id) dbData.famille_id = input.famille_id;
    if ('id' in input && input.id) dbData.id = input.id;

    console.log('🔧 Transform to DB format:', {
      input,
      dbData,
      determinedType: type_regle
    });

    return dbData;
  };

  // Helper function to transform database data to UI format
  const transformFromDbFormat = (config: any) => {
    return {
      ...config,
      activer_fifo: config.actif,
      tolerance_jours: config.tolerance_delai_jours,
      seuil_alerte_rotation: config.delai_alerte_jours,
      ignorer_lots_expires: true, // Default value
      priorite_prix: false, // Default value
    };
  };

  // Fonctions utilitaires pour FIFO
  const getNextLotToSell = async (productId: string): Promise<string | null> => {
    try {
      const { data: config } = await useFIFOConfigForProduct(productId);
      
      let query = supabase
        .from('lots')
        .select('id, date_peremption, prix_achat_unitaire, quantite_restante')
        .eq('tenant_id', tenantId!)
        .eq('produit_id', productId)
        .gt('quantite_restante', 0);

      // Note: Les propriétés ignorer_lots_expires et priorite_prix ne sont pas encore dans le schéma
      // Utiliser les valeurs par défaut pour l'instant
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date_peremption', today);
      query = query.order('date_peremption', { ascending: true });

      const { data: lots } = await query.limit(1);
      return lots?.[0]?.id || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du prochain lot FIFO:', error);
      return null;
    }
  };

  const validateFIFOCompliance = async (productId: string, selectedLotId: string): Promise<{
    isCompliant: boolean;
    message?: string;
    suggestedLotId?: string;
  }> => {
    try {
      const nextLotId = await getNextLotToSell(productId);
      
      if (!nextLotId) {
        return { isCompliant: true };
      }

      if (nextLotId === selectedLotId) {
        return { isCompliant: true };
      }

      const { data: config } = await useFIFOConfigForProduct(productId);
      
      // Vérifier si FIFO est activé
      if (!(config as any)?.activer_fifo) {
        return { isCompliant: true };
      }

      return {
        isCompliant: false,
        message: 'Ce lot ne respecte pas la règle FIFO. Un lot plus ancien est disponible.',
        suggestedLotId: nextLotId
      };
    } catch (error) {
      console.error('Erreur lors de la validation FIFO:', error);
      return { isCompliant: true }; // En cas d'erreur, on autorise
    }
  };

  return {
    // Queries
    useFIFOConfigurationsQuery,
    useFIFOConfigurationQuery,
    useFIFOConfigForProduct,
    useFIFOConfigurationsByFamily,
    
    // Mutations with data transformation
    createFIFOConfig: (data: CreateFIFOConfigInput) => {
      const dbData = transformToDbFormat(data);
      createFIFOConfigMutation.mutate(dbData);
    },
    updateFIFOConfig: (data: UpdateFIFOConfigInput) => {
      const dbData = transformToDbFormat(data);
      updateFIFOConfigMutation.mutate(dbData);
    },
    deleteFIFOConfig: deleteFIFOConfigMutation.mutate,
    
    // Loading states
    isCreating: createFIFOConfigMutation.isPending,
    isUpdating: updateFIFOConfigMutation.isPending,
    isDeleting: deleteFIFOConfigMutation.isPending,
    
    // FIFO Utilities
    getNextLotToSell,
    validateFIFOCompliance,
    
    // Data transformation helpers
    transformToDbFormat,
    transformFromDbFormat,
  };
};