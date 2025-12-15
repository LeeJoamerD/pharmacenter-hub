import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderLine {
  id: string;
  tenant_id: string;
  commande_id: string;
  produit_id: string;
  quantite_commandee: number;
  prix_achat_unitaire_attendu: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  produit?: {
    libelle_produit: string;
    code_cip: string;
    famille_id: string | null;
    categorie_tarification_id: string | null;
  };
}

export const useOrderLines = (commandeId?: string) => {
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrderLines = async (orderId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('lignes_commande_fournisseur')
        .select(`
          *,
          produit:produits!produit_id(libelle_produit, code_cip, famille_id, categorie_tarification_id)
        `)
        .order('created_at', { ascending: false });

      if (orderId) {
        query = query.eq('commande_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrderLines((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des lignes de commande';
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

  const createOrderLine = async (lineData: {
    commande_id: string;
    produit_id: string;
    quantite_commandee: number;
    prix_achat_unitaire_attendu?: number;
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

      const { data, error } = await supabase
        .from('lignes_commande_fournisseur')
        .insert({
          tenant_id: personnel.tenant_id,
          ...lineData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ligne de commande créée avec succès",
      });

      // Refresh order lines
      await fetchOrderLines(commandeId);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la ligne de commande';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateOrderLine = async (id: string, updates: Partial<OrderLine>) => {
    try {
      const { data, error } = await supabase
        .from('lignes_commande_fournisseur')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOrderLines(prev => prev.map(line => 
        line.id === id ? { ...line, ...data } : line
      ));
      
      toast({
        title: "Succès",
        description: "Ligne de commande modifiée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la ligne de commande';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteOrderLine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lignes_commande_fournisseur')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOrderLines(prev => prev.filter(line => line.id !== id));
      toast({
        title: "Succès",
        description: "Ligne de commande supprimée avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la ligne de commande';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getTotalAmount = (): number => {
    return orderLines.reduce((total, line) => {
      const unitPrice = line.prix_achat_unitaire_attendu || 0;
      return total + (line.quantite_commandee * unitPrice);
    }, 0);
  };

  const getTotalQuantity = (): number => {
    return orderLines.reduce((total, line) => total + line.quantite_commandee, 0);
  };

  useEffect(() => {
    fetchOrderLines(commandeId);
  }, [commandeId]);

  return {
    orderLines,
    loading,
    error,
    createOrderLine,
    updateOrderLine,
    deleteOrderLine,
    getTotalAmount,
    getTotalQuantity,
    refetch: () => fetchOrderLines(commandeId),
  };
};