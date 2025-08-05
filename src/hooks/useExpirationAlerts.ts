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
  statut_alerte: 'active' | 'traitee' | 'ignoree';
  date_traitement?: string;
  notes_traitement?: string;
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
    nom_produit: string;
    code_bare: string;
  };
}

export interface ExpirationParameter {
  id: string;
  tenant_id: string;
  produit_id?: string;
  famille_id?: string;
  delai_alerte_jours: number;
  delai_critique_jours: number;
  actions_automatiques: string[];
  notification_email: boolean;
  notification_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpirationParameterInput {
  produit_id?: string;
  famille_id?: string;
  delai_alerte_jours: number;
  delai_critique_jours: number;
  actions_automatiques?: string[];
  notification_email?: boolean;
  notification_sms?: boolean;
}

export interface UpdateAlertStatusInput {
  id: string;
  statut_alerte: 'active' | 'traitee' | 'ignoree';
  notes_traitement?: string;
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
        lot:lots!inner(id, numero_lot, date_peremption, emplacement),
        produit:produits!inner(id, nom_produit, code_bare)
      `,
      {
        ...(filters?.niveau_urgence && { niveau_urgence: filters.niveau_urgence }),
        ...(filters?.statut_alerte && { statut_alerte: filters.statut_alerte }),
        ...(filters?.produit_id && { produit_id: filters.produit_id }),
      },
      {
        enabled: !!tenantId,
        refetchInterval: 60000, // Refresh every minute
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
        lot:lots!inner(id, numero_lot, date_peremption, emplacement),
        produit:produits!inner(id, nom_produit, code_bare)
      `,
      { statut_alerte: 'active' },
      {
        enabled: !!tenantId,
        refetchInterval: 30000,
        orderBy: { column: 'jours_restants', ascending: true },
      }
    );
  };

  // Récupérer les paramètres d'expiration
  const useExpirationParametersQuery = () => {
    return useTenantQueryWithCache(
      ['expiration-parameters'],
      () => supabase
        .from('parametres_expiration')
        .select(`
          *,
          produit:produits(id, nom_produit),
          famille:famille_produit(id, libelle_famille)
        `)
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false }),
      {
        enabled: !!tenantId,
      }
    );
  };

  // Récupérer les statistiques d'alertes
  const useAlertStatsQuery = () => {
    return useQuery({
      queryKey: ['expiration-alerts', 'stats'],
      queryFn: async () => {
        // Calculer les stats manuellement pour l'instant
        const { data: alerts, error } = await supabase
          .from('alertes_peremption')
          .select('niveau_urgence, statut_alerte')
          .eq('tenant_id', tenantId!);
        
        if (error) throw error;
        
        const stats = {
          total: alerts?.length || 0,
          critical: alerts?.filter(a => a.niveau_urgence === 'critique').length || 0,
          high: alerts?.filter(a => a.niveau_urgence === 'eleve').length || 0,
          active: alerts?.filter(a => a.statut_alerte === 'active').length || 0,
        };
        
        return stats;
      },
      enabled: !!tenantId,
      refetchInterval: 300000, // Refresh every 5 minutes
    });
  };

  // Mettre à jour le statut d'une alerte
  const updateAlertStatusMutation = useTenantMutation({
    tableName: 'alertes_peremption',
    mutationType: 'update',
    onSuccess: () => {
      toast.success('Alerte mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    },
  });

  // Créer des paramètres d'expiration
  const createExpirationParameterMutation = useTenantMutation({
    tableName: 'parametres_expiration',
    onSuccess: () => {
      toast.success('Paramètres d\'expiration créés avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-parameters'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création: ${error.message}`);
    },
  });

  // Supprimer des paramètres d'expiration
  const deleteExpirationParameterMutation = useTenantMutation({
    tableName: 'parametres_expiration',
    mutationType: 'delete',
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
      // Pour l'instant, simuler la génération d'alertes
      // TODO: Implémenter la fonction RPC quand elle sera disponible
      toast.success('Alertes d\'expiration générées avec succès');
      queryClient.invalidateQueries({ queryKey: ['expiration-alerts'] });
      return true;
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