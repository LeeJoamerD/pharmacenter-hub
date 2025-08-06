import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReceptionLine {
  id: string;
  tenant_id: string;
  reception_id: string;
  produit_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  quantite_acceptee: number;
  prix_achat_unitaire: number | null;
  numero_lot: string;
  date_peremption: string | null;
  statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
  commentaire: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  produit?: {
    libelle_produit: string;
    code_cip: string;
  };
}

export const useReceptionLines = (receptionId?: string) => {
  const [receptionLines, setReceptionLines] = useState<ReceptionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReceptionLines = async (recId?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('lignes_reception_fournisseur')
        .select(`
          *,
          produit:produits!produit_id(libelle_produit, code_cip)
        `)
        .order('created_at', { ascending: false });

      if (recId) {
        query = query.eq('reception_id', recId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReceptionLines((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des lignes de réception';
      setError(errorMessage);
      // Don't show toast for table not found errors
      if (!errorMessage.includes('relation') && !errorMessage.includes('does not exist')) {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createReceptionLine = async (lineData: {
    reception_id: string;
    produit_id: string;
    quantite_commandee: number;
    quantite_recue: number;
    quantite_acceptee: number;
    prix_achat_unitaire?: number;
    numero_lot: string;
    date_peremption?: string;
    statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
    commentaire?: string;
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
        .from('lignes_reception_fournisseur')
        .insert({
          tenant_id: personnel.tenant_id,
          reception_id: lineData.reception_id,
          produit_id: lineData.produit_id,
          quantite_recue: lineData.quantite_recue,
          prix_achat_unitaire_reel: lineData.prix_achat_unitaire || 0,
          date_peremption: lineData.date_peremption
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Ligne de réception créée avec succès",
      });

      // Refresh reception lines
      await fetchReceptionLines(receptionId);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la ligne de réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateReceptionLine = async (id: string, updates: Partial<ReceptionLine>) => {
    try {
      const { data, error } = await supabase
        .from('lignes_reception_fournisseur')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReceptionLines(prev => prev.map(line => 
        line.id === id ? { ...line, ...data } : line
      ));
      
      toast({
        title: "Succès",
        description: "Ligne de réception modifiée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la ligne de réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteReceptionLine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lignes_reception_fournisseur')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceptionLines(prev => prev.filter(line => line.id !== id));
      toast({
        title: "Succès",
        description: "Ligne de réception supprimée avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la ligne de réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchReceptionLines(receptionId);
  }, [receptionId]);

  return {
    receptionLines,
    loading,
    error,
    createReceptionLine,
    updateReceptionLine,
    deleteReceptionLine,
    refetch: () => fetchReceptionLines(receptionId),
  };
};