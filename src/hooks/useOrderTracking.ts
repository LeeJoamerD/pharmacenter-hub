import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderTracking {
  id: string;
  tenant_id: string;
  commande_id: string;
  statut: 'En cours' | 'Confirmé' | 'Expédié' | 'En transit' | 'Livré' | 'Annulé';
  date_changement: string;
  commentaire: string | null;
  agent_id: string | null;
  transporteur_id: string | null;
  numero_suivi: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  agent?: {
    noms: string;
    prenoms: string;
  };
  transporteur?: {
    nom: string;
  };
}

export const useOrderTracking = (commandeId?: string) => {
  const [trackings, setTrackings] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrderTracking = async (orderId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('suivi_commandes')
        .select(`
          *,
          transporteur:transporteurs!transporteur_id(nom)
        `)
        .order('date_changement', { ascending: false });

      if (orderId) {
        query = query.eq('commande_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrackings((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du suivi des commandes';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTrackingEntry = async (trackingData: {
    commande_id: string;
    statut: 'En cours' | 'Confirmé' | 'Expédié' | 'En transit' | 'Livré' | 'Annulé';
    commentaire?: string;
    agent_id?: string;
    transporteur_id?: string;
    numero_suivi?: string;
  }) => {
    try {
      // Get current user's tenant_id and personnel_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id, id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      // Create tracking entry
      const { data: tracking, error: trackingError } = await supabase
        .from('suivi_commandes')
        .insert({
          tenant_id: personnel.tenant_id,
          commande_id: trackingData.commande_id,
          statut: trackingData.statut,
          commentaire: trackingData.commentaire,
          agent_id: trackingData.agent_id || personnel.id,
          transporteur_id: trackingData.transporteur_id,
          numero_suivi: trackingData.numero_suivi,
          date_changement: new Date().toISOString()
        })
        .select()
        .single();

      if (trackingError) throw trackingError;

      // Update the order status
      const { error: updateError } = await supabase
        .from('commandes_fournisseurs')
        .update({ statut: trackingData.statut })
        .eq('id', trackingData.commande_id);

      if (updateError) throw updateError;

      // Refresh tracking data
      await fetchOrderTracking(trackingData.commande_id);

      toast({
        title: "Succès",
        description: "Suivi ajouté avec succès",
      });
      
      return tracking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du suivi';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getLatestStatus = (commande_id: string): OrderTracking | null => {
    const orderTrackings = trackings.filter(t => t.commande_id === commande_id);
    return orderTrackings.length > 0 ? orderTrackings[0] : null;
  };

  const getTrackingHistory = (commande_id: string): OrderTracking[] => {
    return trackings.filter(t => t.commande_id === commande_id);
  };

  const getStatusColor = (statut: string): string => {
    switch (statut) {
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmé': return 'bg-blue-100 text-blue-800';
      case 'Expédié': return 'bg-purple-100 text-purple-800';
      case 'En transit': return 'bg-indigo-100 text-indigo-800';
      case 'Livré': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditOrder = (statut: string): boolean => {
    return !['Expédié', 'En transit', 'Livré'].includes(statut);
  };

  useEffect(() => {
    fetchOrderTracking(commandeId);
  }, [commandeId]);

  return {
    trackings,
    loading,
    error,
    addTrackingEntry,
    getLatestStatus,
    getTrackingHistory,
    getStatusColor,
    canEditOrder,
    refetch: () => fetchOrderTracking(commandeId),
  };
};