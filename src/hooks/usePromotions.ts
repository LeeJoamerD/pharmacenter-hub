import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export type PromotionType = 'Pourcentage' | 'Montant fixe' | 'Achetez-Obtenez' | 'Quantité';
export type TargetCustomers = 'Tous' | 'Fidélité' | 'Nouveaux' | 'VIP';

export interface Promotion {
  id: string;
  tenant_id: string;
  nom: string;
  description?: string;
  type_promotion: PromotionType;
  valeur_promotion: number;
  montant_minimum: number;
  date_debut: string;
  date_fin: string;
  heure_debut?: string;
  heure_fin?: string;
  est_actif: boolean;
  conditions?: any;
  cible_clients: TargetCustomers;
  nombre_utilisations: number;
  limite_utilisations?: number;
  limite_par_client: number;
  priorite: number;
  combinable: boolean;
  code_promo?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EligibleProduct {
  id: string;
  promotion_id: string;
  produit_id: string;
  categorie_id?: string;
  classe_therapeutique_id?: string;
}

export interface PromotionUsage {
  id: string;
  promotion_id: string;
  vente_id?: string;
  client_id?: string;
  montant_remise: number;
  date_utilisation: string;
  agent_id?: string;
  metadata?: any;
}

export interface PromotionValidity {
  est_valide: boolean;
  message: string;
  valeur_remise: number;
}

/**
 * Hook pour gérer les promotions
 */
export const usePromotions = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer toutes les promotions
  const { data: promotions, isLoading: promotionsLoading } = useQuery({
    queryKey: ['promotions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
    enabled: !!tenantId,
  });

  // Récupérer les promotions actives
  const { data: activePromotions } = useQuery({
    queryKey: ['promotions-active', tenantId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('est_actif', true)
        .lte('date_debut', today)
        .gte('date_fin', today)
        .order('priorite', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
    enabled: !!tenantId,
  });

  // Récupérer les produits éligibles d'une promotion
  const getEligibleProducts = async (promotionId: string) => {
    const { data, error } = await supabase
      .from('produits_eligibles_promotion')
      .select(`
        *,
        produit:produit_id(id, nom_produit, prix_vente)
      `)
      .eq('promotion_id', promotionId);

    if (error) throw error;
    return data;
  };

  // Créer une promotion
  const createPromotionMutation = useMutation({
    mutationFn: async (promotion: Omit<Promotion, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'nombre_utilisations'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promotion,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['promotions-active', tenantId] });
      toast({
        title: 'Promotion créée',
        description: 'La promotion a été créée avec succès',
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

  // Mettre à jour une promotion
  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Promotion> }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['promotions-active', tenantId] });
      toast({
        title: 'Promotion mise à jour',
        description: 'La promotion a été modifiée avec succès',
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

  // Supprimer une promotion
  const deletePromotionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['promotions-active', tenantId] });
      toast({
        title: 'Promotion supprimée',
        description: 'La promotion a été supprimée avec succès',
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

  // Activer/Désactiver une promotion
  const togglePromotionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update({ est_actif: isActive })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['promotions-active', tenantId] });
      toast({
        title: isActive ? 'Promotion activée' : 'Promotion désactivée',
        description: `La promotion a été ${isActive ? 'activée' : 'désactivée'} avec succès`,
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

  // Ajouter des produits éligibles
  const addEligibleProductsMutation = useMutation({
    mutationFn: async ({ promotionId, productIds }: { promotionId: string; productIds: string[] }) => {
      const items = productIds.map(productId => ({
        tenant_id: tenantId,
        promotion_id: promotionId,
        produit_id: productId,
      }));

      const { data, error } = await supabase
        .from('produits_eligibles_promotion')
        .insert(items)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Produits ajoutés',
        description: 'Les produits ont été ajoutés à la promotion',
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

  // Retirer des produits éligibles
  const removeEligibleProductMutation = useMutation({
    mutationFn: async ({ promotionId, productId }: { promotionId: string; productId: string }) => {
      const { error } = await supabase
        .from('produits_eligibles_promotion')
        .delete()
        .eq('promotion_id', promotionId)
        .eq('produit_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré de la promotion',
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

  // Vérifier la validité d'une promotion
  const checkPromotionValidity = async (
    promotionId: string,
    clientId?: string,
    montant: number = 0
  ): Promise<PromotionValidity> => {
    const { data, error } = await supabase.rpc('check_promotion_validity', {
      p_promotion_id: promotionId,
      p_client_id: clientId || null,
      p_montant: montant,
    });

    if (error) throw error;
    return data[0] as PromotionValidity;
  };

  // Appliquer une promotion
  const applyPromotionMutation = useMutation({
    mutationFn: async ({
      promotionId,
      venteId,
      clientId,
      montantRemise,
      agentId,
    }: {
      promotionId: string;
      venteId?: string;
      clientId?: string;
      montantRemise: number;
      agentId?: string;
    }) => {
      const { data, error } = await supabase
        .from('utilisations_promotion')
        .insert({
          tenant_id: tenantId,
          promotion_id: promotionId,
          vente_id: venteId,
          client_id: clientId,
          montant_remise: montantRemise,
          agent_id: agentId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics', tenantId] });
    },
  });

  // Récupérer l'historique d'utilisation d'une promotion
  const { data: promotionUsages } = useQuery({
    queryKey: ['promotion-usages', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utilisations_promotion')
        .select(`
          *,
          promotion:promotion_id(nom),
          client:client_id(nom_complet),
          vente:vente_id(numero_vente)
        `)
        .eq('tenant_id', tenantId)
        .order('date_utilisation', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Statistiques des promotions
  const { data: statistics } = useQuery({
    queryKey: ['promotion-statistics', tenantId],
    queryFn: async () => {
      const { data: promos, error: promosError } = await supabase
        .from('promotions')
        .select('*')
        .eq('tenant_id', tenantId);

      if (promosError) throw promosError;

      const { data: usages, error: usagesError } = await supabase
        .from('utilisations_promotion')
        .select('montant_remise, date_utilisation')
        .eq('tenant_id', tenantId);

      if (usagesError) throw usagesError;

      const today = new Date().toISOString().split('T')[0];
      const activeCount = promos.filter(
        p => p.est_actif && p.date_debut <= today && p.date_fin >= today
      ).length;

      const totalRemises = usages.reduce((sum, u) => sum + Number(u.montant_remise), 0);
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthlyUsages = usages.filter(u => u.date_utilisation.startsWith(thisMonth)).length;

      const totalUsages = promos.reduce((sum, p) => sum + p.nombre_utilisations, 0);
      const totalLimits = promos.reduce((sum, p) => sum + (p.limite_utilisations || 0), 0);
      const conversionRate = totalLimits > 0 ? (totalUsages / totalLimits) * 100 : 0;

      return {
        totalPromotions: promos.length,
        activePromotions: activeCount,
        totalRemises,
        monthlyUsages,
        conversionRate: Math.round(conversionRate),
        totalUsages,
      };
    },
    enabled: !!tenantId,
  });

  return {
    promotions,
    promotionsLoading,
    activePromotions,
    promotionUsages,
    statistics,
    getEligibleProducts,
    createPromotion: createPromotionMutation.mutateAsync,
    updatePromotion: updatePromotionMutation.mutateAsync,
    deletePromotion: deletePromotionMutation.mutateAsync,
    togglePromotion: togglePromotionMutation.mutateAsync,
    addEligibleProducts: addEligibleProductsMutation.mutateAsync,
    removeEligibleProduct: removeEligibleProductMutation.mutateAsync,
    checkPromotionValidity,
    applyPromotion: applyPromotionMutation.mutateAsync,
  };
};
