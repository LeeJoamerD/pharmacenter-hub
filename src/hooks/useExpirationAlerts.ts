import { useTenantQuery } from './useTenantQuery';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface ExpirationAlert {
  id: string;
  tenant_id: string;
  lot_id: string;
  produit_id: string;
  type_alerte: 'peremption_proche' | 'critique' | 'expire';
  niveau_urgence: 'faible' | 'moyen' | 'eleve' | 'critique';
  jours_restants: number;
  quantite_concernee: number;
  actions_recommandees: string[];
  statut: 'active' | 'traitee' | 'ignoree';
  date_alerte: string;
  date_traitement?: string;
  traite_par_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpirationAlertWithDetails extends ExpirationAlert {
  lot?: {
    id: string;
    numero_lot: string;
    date_peremption: string;
    emplacement: string;
  };
  produit?: {
    id: string;
    libelle_produit: string;
    code_cip: string;
  };
}

export interface ExpirationParameter {
  id: string;
  tenant_id: string;
  produit_id?: string;
  famille_id?: string;
  delai_alerte_jours: number;
  delai_critique_jours: number;
  delai_bloquant_jours: number;
  action_auto_alerte: boolean;
  action_auto_blocage: boolean;
  notifications_email: boolean;
  notifications_dashboard: boolean;
  type_parametre: 'famille' | 'produit';
  created_at: string;
  updated_at: string;
}

export interface CreateExpirationParameterInput {
  produit_id?: string;
  famille_id?: string;
  delai_alerte_jours: number;
  delai_critique_jours: number;
  delai_bloquant_jours?: number;
  action_auto_alerte?: boolean;
  action_auto_blocage?: boolean;
  notifications_email?: boolean;
  notifications_dashboard?: boolean;
  type_parametre?: 'famille' | 'produit';
}

export interface UpdateAlertStatusInput {
  id: string;
  statut: 'active' | 'traitee' | 'ignoree';
  notes?: string;
  traite_par_id?: string;
}

export const useExpirationAlerts = () => {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const { useTenantQueryWithCache, useTenantMutation } = useTenantQuery();

  // Récupérer toutes les alertes d'expiration
  const useExpirationAlertsQuery = (filters?: {
    niveau_urgence?: string;
    statut_alerte?: string;
    produit_id?: string;
  }) => {
    return useTenantQueryWithCache(
      ['expiration-alerts', JSON.stringify(filters)],
      'alertes_peremption',
      `
        *,
        lot:lots(id, numero_lot, date_peremption),
        produit:produits(id, libelle_produit, code_cip)
      `,
      {
        ...(filters?.niveau_urgence && { niveau_urgence: filters.niveau_urgence }),
        ...(filters?.statut_alerte && { statut: filters.statut_alerte }),
        ...(filters?.produit_id && { produit_id: filters.produit_id }),
      },
      {
        enabled: !!tenantId,
        orderBy: { column: 'jours_restants', ascending: true },
      }
    );
  };

  // Récupérer les alertes critiques
  const useCriticalAlertsQuery = () => {
    return useTenantQueryWithCache(
      ['expiration-alerts', 'critical'],
      'alertes_peremption',
      `
        *,
        lot:lots(id, numero_lot, date_peremption),
        produit:produits(id, libelle_produit, code_cip)
      `,
      { 
        statut: 'active',
        niveau_urgence: 'critique'
      },
      {
        enabled: !!tenantId,
        orderBy: { column: 'jours_restants', ascending: true },
      }
    );
  };

  // Récupérer les paramètres d'expiration
  const useExpirationParametersQuery = () => {
    return useTenantQueryWithCache(
      ['expiration-parameters'],
      'parametres_expiration',
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

  // Récupérer les statistiques d'alertes
  const useAlertStatsQuery = () => {
    return useQuery({
      queryKey: ['expiration-alerts', 'stats'],
      queryFn: async () => {
        // Récupérer les alertes avec les informations des lots pour obtenir les quantités réelles
        const { data: alerts, error } = await supabase
          .from('alertes_peremption')
          .select(`
            niveau_urgence,
            quantite_concernee,
            lot:lots(quantite_restante)
          `)
          .eq('tenant_id', tenantId!)
          .eq('statut', 'active');
        
        if (error) throw error;
        
        // Calculer les statistiques avec les quantités réelles
        const totalQuantity = alerts?.reduce((sum, alert) => {
          return sum + (alert.lot?.quantite_restante || alert.quantite_concernee || 0);
        }, 0) || 0;

        const criticalQuantity = alerts?.filter(a => a.niveau_urgence === 'critique')
          .reduce((sum, alert) => {
            return sum + (alert.lot?.quantite_restante || alert.quantite_concernee || 0);
          }, 0) || 0;

        const highQuantity = alerts?.filter(a => a.niveau_urgence === 'eleve')
          .reduce((sum, alert) => {
            return sum + (alert.lot?.quantite_restante || alert.quantite_concernee || 0);
          }, 0) || 0;

        const activeQuantity = totalQuantity; // Toutes les alertes actives
        
        const stats = {
          total: alerts?.length || 0,
          critical: alerts?.filter(a => a.niveau_urgence === 'critique').length || 0,
          high: alerts?.filter(a => a.niveau_urgence === 'eleve').length || 0,
          active: alerts?.length || 0,
          // Nouvelles propriétés pour les quantités réelles
          totalQuantity,
          criticalQuantity,
          highQuantity,
          activeQuantity,
        };
        
        return stats;
      },
      enabled: !!tenantId,
    });
  };

  // Mettre à jour le statut d'une alerte
  const updateAlertStatusMutation = useTenantMutation('alertes_peremption', 'update', {
    onSuccess: () => {
      toast.success('Alerte mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Créer des paramètres d'expiration
  const createExpirationParameterMutation = useTenantMutation('parametres_expiration', 'insert', {
    onSuccess: () => {
      toast.success('Paramètres d\'expiration créés avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-parameters'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  // Supprimer des paramètres d'expiration
  const deleteExpirationParameterMutation = useTenantMutation('parametres_expiration', 'delete', {
    onSuccess: () => {
      toast.success('Paramètres d\'expiration supprimés avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-parameters'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });

  // Fonctions utilitaires
  const getUrgencyColor = (niveau: string) => {
    switch (niveau) {
      case 'critique': return 'text-red-600 bg-red-50';
      case 'eleve': return 'text-orange-600 bg-orange-50';
      case 'moyen': return 'text-yellow-600 bg-yellow-50';
      case 'faible': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'peremption_proche': return 'Péremption proche';
      case 'critique': return 'Critique';
      case 'expire': return 'Expiré';
      default: return type;
    }
  };

  const getRecommendedActions = (daysRemaining: number, quantity: number) => {
    if (daysRemaining <= 0) {
      return ['Retrait immédiat du stock', 'Destruction selon protocole'];
    } else if (daysRemaining <= 7) {
      return ['Promotion urgente', 'Vente prioritaire', 'Don possible'];
    } else if (daysRemaining <= 30) {
      return ['Surveillance renforcée', 'Promotion préventive'];
    } else {
      return ['Surveillance normale'];
    }
  };

  // Générer manuellement les alertes d'expiration
  const generateExpirationAlerts = async () => {
    try {
      const { data, error } = await supabase.rpc('generer_alertes_expiration_automatiques');
      
      if (error) throw error;
      
      const result = data as { success: boolean; alertes_generees?: number; error?: string };
      
      if (result?.success) {
        toast.success(`${result.alertes_generees || 0} alertes générées avec succès`);
        queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
        return result;
      } else {
        throw new Error(result?.error || 'Erreur inconnue lors de la génération');
      }
    } catch (error: any) {
      toast.error(`Erreur lors de la génération: ${error.message}`);
      throw error;
    }
  };

  return {
    // Queries
    useExpirationAlertsQuery,
    useCriticalAlertsQuery,
    useExpirationParametersQuery,
    useAlertStatsQuery,
    
    // Mutations
    updateAlertStatus: updateAlertStatusMutation.mutate,
    createExpirationParameter: createExpirationParameterMutation.mutate,
    deleteExpirationParameter: deleteExpirationParameterMutation.mutate,
    
    // Loading states
    isUpdatingStatus: updateAlertStatusMutation.isPending,
    isCreatingParameter: createExpirationParameterMutation.isPending,
    isDeletingParameter: deleteExpirationParameterMutation.isPending,
    
    // Utilities
    getUrgencyColor,
    getAlertTypeLabel,
    getRecommendedActions,
    generateExpirationAlerts,
  };
};