import { useTenantQuery } from './useTenantQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface LotMovement {
  id: string;
  tenant_id: string;
  lot_id: string;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'transfert' | 'retour' | 'destruction';
  quantite_mouvement: number;
  date_mouvement: string;
  reference_document?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LotMovementWithDetails extends LotMovement {
  lot?: {
    id: string;
    numero_lot: string;
    produit_id: string;
  };
  produit?: {
    id: string;
    libelle_produit: string;
    code_cip: string;
  };
}

export interface CreateLotMovementInput {
  lot_id: string;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'transfert' | 'retour' | 'destruction';
  quantite_mouvement: number;
  date_mouvement?: string;
  reference_document?: string;
  notes?: string;
}

export interface LotMovementStats {
  total_entries: number;
  total_exits: number;
  total_adjustments: number;
  total_transfers: number;
  total_returns: number;
  total_destructions: number;
  net_movement: number;
  movement_trend: 'increasing' | 'decreasing' | 'stable';
}

export const useLotMovements = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer tous les mouvements de lots
  const useLotMovementsQuery = (filters?: {
    lot_id?: string;
    produit_id?: string;
    type_mouvement?: string;
    date_debut?: string;
    date_fin?: string;
  }) => {
    return useTenantQueryWithCache(
      ['lot-movements', JSON.stringify(filters)],
      'mouvements_lots',
      `
        *,
        lot:lots(id, numero_lot, produit_id)
      `,
      {
        ...(filters?.lot_id && { lot_id: filters.lot_id }),
        ...(filters?.type_mouvement && { type_mouvement: filters.type_mouvement }),
      },
      {
        enabled: !!tenantId,
        orderBy: { column: 'date_mouvement', ascending: false },
      }
    );
  };

  // Récupérer les mouvements d'un lot spécifique
  const useLotMovementsForLot = (lotId: string) => {
    return useTenantQueryWithCache(
      ['lot-movements', 'lot', lotId],
      'mouvements_lots',
      '*',
      { lot_id: lotId },
      {
        enabled: !!tenantId && !!lotId,
        orderBy: { column: 'date_mouvement', ascending: false },
      }
    );
  };

  // Récupérer les statistiques de mouvements
  const useLotMovementStatsQuery = (lotId?: string, period?: 'day' | 'week' | 'month' | 'year') => {
    return useQuery({
      queryKey: ['lot-movements', 'stats', lotId, period],
      queryFn: async () => {
        // Calculer les stats manuellement pour l'instant
        const { data: movements, error } = await supabase
          .from('mouvements_lots')
          .select('type_mouvement, quantite_mouvement')
          .eq('tenant_id', tenantId!)
          .eq('lot_id', lotId || '');
        
        if (error) throw error;
        
        const stats = {
          total_entries: movements?.filter(m => m.type_mouvement === 'entree').reduce((sum, m) => sum + m.quantite_mouvement, 0) || 0,
          total_exits: movements?.filter(m => m.type_mouvement === 'sortie').reduce((sum, m) => sum + m.quantite_mouvement, 0) || 0,
          total_adjustments: movements?.filter(m => m.type_mouvement === 'ajustement').length || 0,
          total_transfers: movements?.filter(m => m.type_mouvement === 'transfert').length || 0,
          total_returns: movements?.filter(m => m.type_mouvement === 'retour').length || 0,
          total_destructions: movements?.filter(m => m.type_mouvement === 'destruction').length || 0,
          net_movement: 0,
          movement_trend: 'stable' as const
        };
        
        return stats;
      },
      enabled: !!tenantId,
    });
  };

  // Récupérer les mouvements récents
  const useRecentMovementsQuery = (limit: number = 10) => {
    return useTenantQueryWithCache(
      ['lot-movements', 'recent', limit.toString()],
      'mouvements_lots',
      `
        *,
        lot:lots(id, numero_lot, produit_id)
      `,
      {},
      {
        enabled: !!tenantId,
        limit: limit,
        orderBy: { column: 'date_mouvement', ascending: false },
      }
    );
  };

  // Créer un nouveau mouvement de lot
  const createLotMovementMutation = useTenantMutation('mouvements_lots', 'insert', {
    onSuccess: () => {
      toast.success('Mouvement enregistré avec succès');
      queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`);
    },
  });

  // Supprimer un mouvement (avec confirmation)
  const deleteLotMovementMutation = useTenantMutation('mouvements_lots', 'delete', {
    onSuccess: () => {
      toast.success('Mouvement supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['lot-movements'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  // Fonctions utilitaires
  const getMovementTypeLabel = (type: string) => {
    const labels = {
      entree: 'Entrée',
      sortie: 'Sortie',
      ajustement: 'Ajustement',
      transfert: 'Transfert',
      retour: 'Retour',
      destruction: 'Destruction'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors = {
      entree: 'text-green-600 bg-green-50',
      sortie: 'text-red-600 bg-red-50',
      ajustement: 'text-blue-600 bg-blue-50',
      transfert: 'text-purple-600 bg-purple-50',
      retour: 'text-orange-600 bg-orange-50',
      destruction: 'text-gray-600 bg-gray-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getMovementIcon = (type: string) => {
    const icons = {
      entree: '↗️',
      sortie: '↘️',
      ajustement: '⚖️',
      transfert: '↔️',
      retour: '↩️',
      destruction: '🗑️'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  // Valider un mouvement de lot
  const validateLotMovement = async (lotId: string, quantity: number, type: string): Promise<{
    isValid: boolean;
    message?: string;
    availableQuantity?: number;
  }> => {
    try {
      // Récupérer la quantité actuelle du lot
      const { data: lot, error } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('id', lotId)
        .eq('tenant_id', tenantId!)
        .single();

      if (error) throw error;

      if (!lot) {
        return {
          isValid: false,
          message: 'Lot non trouvé'
        };
      }

      // Pour les sorties et destructions, vérifier qu'il y a assez de stock
      if (['sortie', 'destruction'].includes(type) && quantity > lot.quantite_restante) {
        return {
          isValid: false,
          message: `Quantité insuffisante. Disponible: ${lot.quantite_restante}`,
          availableQuantity: lot.quantite_restante
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        isValid: false,
        message: 'Erreur lors de la validation'
      };
    }
  };

  // Calculer l'impact d'un mouvement sur le stock
  const calculateStockImpact = (currentQuantity: number, movementQuantity: number, movementType: string) => {
    switch (movementType) {
      case 'entree':
      case 'retour':
        return currentQuantity + movementQuantity;
      case 'sortie':
      case 'destruction':
        return Math.max(0, currentQuantity - movementQuantity);
      case 'ajustement':
        return movementQuantity; // Pour les ajustements, on définit la nouvelle quantité
      case 'transfert':
        return Math.max(0, currentQuantity - movementQuantity); // Comme une sortie
      default:
        return currentQuantity;
    }
  };

  return {
    // Queries
    useLotMovementsQuery,
    useLotMovementsForLot,
    useLotMovementStatsQuery,
    useRecentMovementsQuery,
    
    // Mutations
    createLotMovement: createLotMovementMutation.mutate,
    deleteLotMovement: deleteLotMovementMutation.mutate,
    
    // Loading states
    isCreating: createLotMovementMutation.isPending,
    isDeleting: deleteLotMovementMutation.isPending,
    
    // Utilities
    getMovementTypeLabel,
    getMovementTypeColor,
    getMovementIcon,
    validateLotMovement,
    calculateStockImpact,
  };
};