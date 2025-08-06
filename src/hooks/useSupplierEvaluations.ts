import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierEvaluation {
  id: string;
  tenant_id: string;
  fournisseur_id: string;
  commande_id: string | null;
  evaluateur_id: string | null;
  note_qualite: number | null;
  note_delai: number | null;
  note_service: number | null;
  note_prix: number | null;
  note_globale: number | null;
  commentaires: string | null;
  recommande: boolean;
  date_evaluation: string;
  created_at: string;
  updated_at: string;
  // Relations
  fournisseur?: {
    nom: string;
  };
  evaluateur?: {
    noms: string;
    prenoms: string;
  };
  commande?: {
    date_commande: string;
  };
}

export const useSupplierEvaluations = (fournisseurId?: string) => {
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvaluations = async (supplierId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('evaluations_fournisseurs')
        .select(`
          *,
          fournisseur:fournisseurs!fournisseur_id(nom),
          evaluateur:personnel!evaluateur_id(noms, prenoms),
          commande:commandes_fournisseurs!commande_id(date_commande)
        `)
        .order('date_evaluation', { ascending: false });

      if (supplierId) {
        query = query.eq('fournisseur_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvaluations((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des évaluations';
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

  const createEvaluation = async (evaluationData: {
    fournisseur_id: string;
    commande_id?: string;
    note_qualite: number;
    note_delai: number;
    note_service: number;
    note_prix: number;
    commentaires?: string;
    recommande?: boolean;
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

      const { data, error } = await supabase
        .from('evaluations_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          fournisseur_id: evaluationData.fournisseur_id,
          commande_id: evaluationData.commande_id,
          evaluateur_id: personnel.id,
          note_qualite: evaluationData.note_qualite,
          note_delai: evaluationData.note_delai,
          note_service: evaluationData.note_service,
          note_prix: evaluationData.note_prix,
          commentaires: evaluationData.commentaires,
          recommande: evaluationData.recommande ?? true,
          date_evaluation: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Évaluation créée avec succès",
      });

      // Refresh evaluations
      await fetchEvaluations(fournisseurId);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'évaluation';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEvaluation = async (id: string, updates: Partial<SupplierEvaluation>) => {
    try {
      const { data, error } = await supabase
        .from('evaluations_fournisseurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEvaluations(prev => prev.map(evaluation => 
        evaluation.id === id ? { ...evaluation, ...data } : evaluation
      ));
      
      toast({
        title: "Succès",
        description: "Évaluation modifiée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de l\'évaluation';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evaluations_fournisseurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvaluations(prev => prev.filter(evaluation => evaluation.id !== id));
      toast({
        title: "Succès",
        description: "Évaluation supprimée avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'évaluation';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getSupplierAverageRating = (supplierId: string) => {
    const supplierEvaluations = evaluations.filter(e => e.fournisseur_id === supplierId);
    if (supplierEvaluations.length === 0) return null;
    
    const totalRating = supplierEvaluations.reduce((sum, e) => sum + (e.note_globale || 0), 0);
    return totalRating / supplierEvaluations.length;
  };

  const getSupplierRecommendationRate = (supplierId: string) => {
    const supplierEvaluations = evaluations.filter(e => e.fournisseur_id === supplierId);
    if (supplierEvaluations.length === 0) return null;
    
    const recommendations = supplierEvaluations.filter(e => e.recommande).length;
    return (recommendations / supplierEvaluations.length) * 100;
  };

  useEffect(() => {
    fetchEvaluations(fournisseurId);
  }, [fournisseurId]);

  return {
    evaluations,
    loading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getSupplierAverageRating,
    getSupplierRecommendationRate,
    refetch: () => fetchEvaluations(fournisseurId),
  };
};