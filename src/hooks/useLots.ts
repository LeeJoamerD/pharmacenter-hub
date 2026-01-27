import { useCallback } from 'react';
import { useTenantQuery } from './useTenantQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface Lot {
  id: string;
  tenant_id: string;
  produit_id: string;
  numero_lot: string;
  fournisseur_id?: string;
  reception_id?: string;
  date_fabrication?: string;
  date_reception?: string;
  date_peremption?: string;
  quantite_initiale: number;
  quantite_restante: number;
  prix_achat_unitaire?: number;
  prix_vente_suggere?: number;
  statut?: string;
  emplacement?: string;
  temperature_stockage?: number;
  conditions_stockage?: string;
  notes?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

export interface LotWithDetails extends Lot {
  produit?: {
    id: string;
    libelle_produit: string;
    code_cip: string;
    quantite_unites_details_source?: number;
    niveau_detail?: number;
    produit_detail?: Array<{
      id: string;
      quantite_unites_details_source: number;
    }>;
  };
  fournisseur?: {
    id: string;
    nom: string;
  };
  jours_restants_expiration?: number;
  niveau_urgence?: string;
  pourcentage_utilise?: number;
}

export interface CreateLotInput {
  produit_id: string;
  numero_lot: string;
  fournisseur_id?: string;
  reception_id?: string;
  date_fabrication?: string;
  date_reception?: string;
  date_peremption?: string;
  quantite_initiale: number;
  prix_achat_unitaire?: number;
  prix_vente_suggere?: number;
  statut?: string;
  emplacement?: string;
  temperature_stockage?: number;
  conditions_stockage?: string;
  notes?: string;
}

export interface UpdateLotInput extends Partial<CreateLotInput> {
  id: string;
  quantite_restante?: number;
}

export const useLots = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer tous les lots avec détails
  const useLotsQuery = (filters?: {
    produit_id?: string;
    fournisseur_id?: string;
    statut?: string;
    expiration_proche?: boolean;
    stock_faible?: boolean;
  }) => {
    return useTenantQueryWithCache(
      ['lots', JSON.stringify(filters)],
      'lots',
      `
        *,
        produit:produits!inner(id, libelle_produit, code_cip, quantite_unites_details_source, niveau_detail, produit_detail:produits!id_produit_source(id, quantite_unites_details_source)),
        fournisseur:fournisseurs(id, nom)
      `,
      {
        ...filters,
        ...(filters?.statut && { statut: filters.statut }),
      },
      {
        enabled: !!tenantId,
        orderBy: { column: 'date_peremption', ascending: true },
      }
    );
  };

  // Récupérer un lot par ID avec tous les détails (incluant catégorie tarification pour recalcul)
  const useLotQuery = (lotId: string) => {
    return useTenantQueryWithCache(
      ['lot', lotId],
      'lots',
      `
        *,
        produit:produits!inner(
          id, libelle_produit, code_cip, famille_id,
          categorie_tarification:categorie_tarification(
            id, coefficient_prix_vente, taux_tva, taux_centime_additionnel
          )
        ),
        fournisseur:fournisseurs(id, nom)
      `,
      { id: lotId },
      {
        enabled: !!tenantId && !!lotId,
        single: true,
      }
    );
  };

  // Récupérer les lots avec stock faible
  const useLowStockLots = () => {
    return useQuery({
      queryKey: ['lots', 'low-stock'],
      queryFn: async () => {
        // Récupérer tous les lots avec leurs produits et seuils
        const { data: lotsData, error } = await supabase
          .from('lots')
          .select(`
            *,
            produit:produits!inner(id, libelle_produit, stock_critique, stock_faible, stock_limite)
          `)
          .eq('tenant_id', tenantId!)
          .gt('quantite_restante', 0)
          .order('quantite_restante', { ascending: true });
        
        if (error) throw error;
        
        // Filtrer les lots qui sont réellement en stock bas
        const lowStockLots = lotsData?.filter(lot => {
          const stockLimit = lot.produit?.stock_limite || 10; // Seuil par défaut
          return lot.quantite_restante <= stockLimit;
        }) || [];
        
        return lowStockLots;
      },
      enabled: !!tenantId,
    });
  };

  // Récupérer les lots proches de l'expiration
  const useExpiringLots = (daysThreshold: number = 30) => {
    return useQuery({
      queryKey: ['lots', 'expiring', daysThreshold],
      queryFn: async () => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysThreshold);
        
        const { data, error } = await supabase
          .from('lots')
          .select(`
            *,
            produit:produits!inner(id, libelle_produit, code_cip)
          `)
          .eq('tenant_id', tenantId!)
          .lte('date_peremption', futureDate.toISOString().split('T')[0])
          .gt('quantite_restante', 0)
          .order('date_peremption', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      enabled: !!tenantId,
    });
  };

  // Créer un nouveau lot
  const createLotMutation = useTenantMutation('lots', 'insert', {
    onSuccess: () => {
      toast.success('Lot créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  // Mettre à jour un lot
  const updateLotMutation = useTenantMutation('lots', 'update', {
    onSuccess: () => {
      toast.success('Lot mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Supprimer un lot
  const deleteLotMutation = useTenantMutation('lots', 'delete', {
    onSuccess: () => {
      toast.success('Lot supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  // Fonctions utilitaires
  const calculateDaysToExpiration = useCallback((expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  const determineUrgencyLevel = useCallback((daysToExpiration: number) => {
    if (daysToExpiration <= 0) return 'critique';
    if (daysToExpiration <= 7) return 'eleve';
    if (daysToExpiration <= 30) return 'moyen';
    return 'faible';
  }, []);

  const calculateUsagePercentage = useCallback((initial: number, remaining: number) => {
    return ((initial - remaining) / initial) * 100;
  }, []);

  return {
    // Queries
    useLotsQuery,
    useLotQuery,
    useLowStockLots,
    useExpiringLots,
    
    // Mutations
    createLot: createLotMutation.mutate,
    updateLot: updateLotMutation.mutate,
    deleteLot: deleteLotMutation.mutate,
    
    // Loading states
    isCreating: createLotMutation.isPending,
    isUpdating: updateLotMutation.isPending,
    isDeleting: deleteLotMutation.isPending,
    
    // Utilities
    calculateDaysToExpiration,
    determineUrgencyLevel,
    calculateUsagePercentage,
  };
};