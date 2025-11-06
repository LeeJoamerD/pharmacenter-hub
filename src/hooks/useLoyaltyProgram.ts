import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface LoyaltyProgram {
  id: string;
  client_id: string;
  numero_carte: string;
  points_actuels: number;
  points_cumules: number;
  points_utilises: number;
  niveau_fidelite: LoyaltyTier;
  date_adhesion: string;
  date_derniere_activite?: string;
  montant_total_achats: number;
  nombre_achats: number;
  recompenses_gagnees: number;
  recompenses_utilisees: number;
  statut: 'Actif' | 'Inactif' | 'Suspendu';
}

export interface PointMovement {
  id: string;
  type_mouvement: 'Gain' | 'Utilisation' | 'Expiration' | 'Ajustement' | 'Bonus';
  montant_points: number;
  points_avant: number;
  points_apres: number;
  description?: string;
  date_mouvement: string;
}

export interface Reward {
  id: string;
  nom: string;
  description?: string;
  type_recompense: 'Remise' | 'Produit gratuit' | 'Cashback' | 'Service';
  cout_points: number;
  valeur?: number;
  niveau_requis?: LoyaltyTier;
  est_actif: boolean;
  stock_disponible?: number;
}

/**
 * Hook pour gérer le programme de fidélité
 * Règles: 1 point = 1000 FCFA dépensés
 * Niveaux: Bronze (0-999), Silver (1000-2499), Gold (2500-4999), Platinum (5000+)
 * Expiration: 12 mois
 */
export const useLoyaltyProgram = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer tous les programmes de fidélité
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['loyalty-programs', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programme_fidelite')
        .select(`
          *,
          client:client_id(nom_complet, telephone, email)
        `)
        .eq('tenant_id', tenantId)
        .order('points_actuels', { ascending: false });

      if (error) throw error;
      return data as LoyaltyProgram[];
    },
    enabled: !!tenantId,
  });

  // Récupérer le catalogue de récompenses
  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['loyalty-rewards', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recompenses_fidelite')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('est_actif', true)
        .order('cout_points', { ascending: true });

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!tenantId,
  });

  // Inscrire un client au programme
  const enrollClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      // Vérifier si déjà inscrit
      const { data: existing } = await supabase
        .from('programme_fidelite')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('client_id', clientId)
        .single();

      if (existing) {
        throw new Error('Client déjà inscrit au programme');
      }

      // Générer numéro de carte
      const count = (programs?.length || 0) + 1;
      const numero = `FID-${String(count).padStart(8, '0')}`;

      const { data, error } = await supabase
        .from('programme_fidelite')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          numero_carte: numero,
          points_actuels: 0,
          points_cumules: 0,
          niveau_fidelite: 'Bronze',
          statut: 'Actif',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs', tenantId] });
      toast({
        title: 'Inscription réussie',
        description: 'Le client a été inscrit au programme de fidélité',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Récupérer le programme d'un client
  const getClientLoyalty = async (clientId: string): Promise<LoyaltyProgram | null> => {
    const { data, error } = await supabase
      .from('programme_fidelite')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .single();

    if (error) return null;
    return data as LoyaltyProgram;
  };

  // Calculer points gagnés (1 point = 1000 FCFA)
  const calculatePoints = (amount: number): number => {
    return Math.floor(amount / 1000);
  };

  // Déterminer niveau selon points
  const determineTier = (points: number): LoyaltyTier => {
    if (points >= 5000) return 'Platinum';
    if (points >= 2500) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Bronze';
  };

  // Ajouter des points
  const addPointsMutation = useMutation({
    mutationFn: async ({
      clientId,
      points,
      reason,
      agentId,
      referenceId,
    }: {
      clientId: string;
      points: number;
      reason: string;
      agentId?: string;
      referenceId?: string;
    }) => {
      const program = await getClientLoyalty(clientId);
      if (!program) throw new Error('Client non inscrit au programme');

      const nouveauxPoints = program.points_actuels + points;
      const nouveauNiveau = determineTier(program.points_cumules + points);

      // Mettre à jour le programme
      const { error: updateError } = await supabase
        .from('programme_fidelite')
        .update({
          points_actuels: nouveauxPoints,
          points_cumules: program.points_cumules + points,
          niveau_fidelite: nouveauNiveau,
          date_derniere_activite: new Date().toISOString(),
        })
        .eq('id', program.id);

      if (updateError) throw updateError;

      // Enregistrer le mouvement
      const { error: movementError } = await supabase
        .from('mouvements_points')
        .insert({
          tenant_id: tenantId,
          programme_id: program.id,
          type_mouvement: 'Gain',
          montant_points: points,
          points_avant: program.points_actuels,
          points_apres: nouveauxPoints,
          description: reason,
          agent_id: agentId,
          reference_id: referenceId,
          date_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

      if (movementError) throw movementError;

      return { nouveauNiveau, ancienNiveau: program.niveau_fidelite };
    },
    onSuccess: ({ nouveauNiveau, ancienNiveau }) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs', tenantId] });
      
      if (nouveauNiveau !== ancienNiveau) {
        toast({
          title: 'Nouveau niveau atteint!',
          description: `Le client est passé au niveau ${nouveauNiveau}`,
        });
      } else {
        toast({
          title: 'Points ajoutés',
          description: 'Les points ont été ajoutés au compte client',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Utiliser des points (échanger contre récompense)
  const usePointsMutation = useMutation({
    mutationFn: async ({
      clientId,
      points,
      rewardId,
    }: {
      clientId: string;
      points: number;
      rewardId: string;
    }) => {
      const program = await getClientLoyalty(clientId);
      if (!program) throw new Error('Client non inscrit au programme');
      if (program.points_actuels < points) throw new Error('Points insuffisants');

      const nouveauxPoints = program.points_actuels - points;

      // Mettre à jour le programme
      const { error: updateError } = await supabase
        .from('programme_fidelite')
        .update({
          points_actuels: nouveauxPoints,
          points_utilises: program.points_utilises + points,
          recompenses_utilisees: program.recompenses_utilisees + 1,
          date_derniere_activite: new Date().toISOString(),
        })
        .eq('id', program.id);

      if (updateError) throw updateError;

      // Enregistrer le mouvement
      const { error: movementError } = await supabase
        .from('mouvements_points')
        .insert({
          tenant_id: tenantId,
          programme_id: program.id,
          type_mouvement: 'Utilisation',
          montant_points: -points,
          points_avant: program.points_actuels,
          points_apres: nouveauxPoints,
          reference_id: rewardId,
          description: 'Échange contre récompense',
        });

      if (movementError) throw movementError;

      // Mettre à jour les utilisations de la récompense
      await supabase
        .from('recompenses_fidelite')
        .update({ utilisations: supabase.raw('utilisations + 1') })
        .eq('id', rewardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', tenantId] });
      toast({
        title: 'Récompense échangée',
        description: 'La récompense a été échangée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Récupérer l'historique des points d'un client
  const getPointsHistory = async (clientId: string): Promise<PointMovement[]> => {
    const program = await getClientLoyalty(clientId);
    if (!program) return [];

    const { data, error } = await supabase
      .from('mouvements_points')
      .select('*')
      .eq('programme_id', program.id)
      .order('date_mouvement', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as PointMovement[];
  };

  // Statistiques globales du programme
  const { data: statistics } = useQuery({
    queryKey: ['loyalty-statistics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programme_fidelite')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const total = data.length;
      const actifs = data.filter(p => p.statut === 'Actif').length;
      const bronze = data.filter(p => p.niveau_fidelite === 'Bronze').length;
      const silver = data.filter(p => p.niveau_fidelite === 'Silver').length;
      const gold = data.filter(p => p.niveau_fidelite === 'Gold').length;
      const platinum = data.filter(p => p.niveau_fidelite === 'Platinum').length;
      const pointsCirculation = data.reduce((sum, p) => sum + p.points_actuels, 0);
      const pointsCumules = data.reduce((sum, p) => sum + p.points_cumules, 0);

      return {
        total,
        actifs,
        bronze,
        silver,
        gold,
        platinum,
        pointsCirculation,
        pointsCumules,
      };
    },
    enabled: !!tenantId,
  });

  return {
    programs,
    programsLoading,
    rewards,
    rewardsLoading,
    enrollClient: enrollClientMutation.mutateAsync,
    getClientLoyalty,
    calculatePoints,
    determineTier,
    addPoints: addPointsMutation.mutateAsync,
    usePoints: usePointsMutation.mutateAsync,
    getPointsHistory,
    statistics,
  };
};
