import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierOrder {
  id: string;
  tenant_id: string;
  fournisseur_id: string;
  date_commande: string | null;
  agent_id: string | null;
  statut: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  fournisseur?: {
    nom: string;
    email: string | null;
  };
}

export interface OrderLine {
  id: string;
  tenant_id: string;
  commande_id: string;
  produit_id: string;
  quantite_commandee: number;
  prix_achat_unitaire_attendu: number | null;
  created_at: string;
  updated_at: string;
}

export const useSupplierOrders = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('commandes_fournisseurs')
        .select(`
          *,
          fournisseur:fournisseurs!fournisseur_id(nom, email)
        `)
        .order('date_commande', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des commandes';
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

  const createOrder = async (orderData: {
    fournisseur_id: string;
    date_commande?: string;
    agent_id?: string;
    statut?: string;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      prix_achat_unitaire_attendu?: number;
    }>;
  }) => {
    try {
      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      const { data: order, error: orderError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: orderData.fournisseur_id,
          date_commande: orderData.date_commande || new Date().toISOString(),
          agent_id: orderData.agent_id,
          statut: orderData.statut || 'En cours'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Ajouter les lignes de commande
      const lignesData = orderData.lignes.map(ligne => ({
        tenant_id: personnel.tenant_id,
        commande_id: order.id,
        ...ligne
      }));

      const { error: lignesError } = await supabase
        .from('lignes_commande_fournisseur')
        .insert(lignesData);

      if (lignesError) throw lignesError;

      toast({
        title: "Succès",
        description: "Commande créée avec succès",
      });

      // Recharger les commandes
      await fetchOrders();
      
      return order;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la commande';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateOrderStatus = async (id: string, statut: string) => {
    try {
      const { data, error } = await supabase
        .from('commandes_fournisseurs')
        .update({ statut })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, statut } : order
      ));
      
      toast({
        title: "Succès",
        description: "Statut de la commande mis à jour",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      // Supprimer d'abord les lignes de commande
      const { error: lignesError } = await supabase
        .from('lignes_commande_fournisseur')
        .delete()
        .eq('commande_id', id);

      if (lignesError) throw lignesError;

      // Puis supprimer la commande
      const { error } = await supabase
        .from('commandes_fournisseurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== id));
      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la commande';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    refetch: fetchOrders,
  };
};