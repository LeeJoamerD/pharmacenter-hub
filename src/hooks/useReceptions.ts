import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reception {
  id: string;
  tenant_id: string;
  commande_id: string | null;
  fournisseur_id: string;
  date_reception: string | null;
  agent_id: string | null;
  reference_facture: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  fournisseur?: {
    nom: string;
  };
  commande?: {
    numero: string;
  };
}

export interface ReceptionLine {
  id: string;
  reception_id: string;
  produit_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  quantite_acceptee: number;
  numero_lot: string;
  date_expiration: string | null;
  statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
  commentaire: string | null;
}

export const useReceptions = () => {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReceptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receptions_fournisseurs')
        .select(`
          *,
          fournisseur:fournisseurs!fournisseur_id(nom)
        `)
        .order('date_reception', { ascending: false });

      if (error) throw error;
      setReceptions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des réceptions';
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

  const createReception = async (receptionData: {
    commande_id?: string;
    fournisseur_id: string;
    date_reception?: string;
    agent_id?: string;
    reference_facture?: string;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      quantite_recue: number;
      quantite_acceptee: number;
      numero_lot: string;
      date_expiration?: string;
      statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
      commentaire?: string;
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

      const { data: reception, error: receptionError } = await supabase
        .from('receptions_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          commande_id: receptionData.commande_id,
          fournisseur_id: receptionData.fournisseur_id,
          date_reception: receptionData.date_reception || new Date().toISOString(),
          agent_id: receptionData.agent_id,
          reference_facture: receptionData.reference_facture
        })
        .select()
        .single();

      if (receptionError) throw receptionError;

      // Gérer les lots et créer les lignes de réception
      const dateReception = receptionData.date_reception ? new Date(receptionData.date_reception).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      for (const ligne of receptionData.lignes) {
        // Créer la ligne de réception (adaptation au schéma existant)
        const { error: ligneError } = await supabase
          .from('lignes_reception_fournisseur')
          .insert({
            tenant_id: personnel.tenant_id,
            reception_id: reception.id,
            produit_id: ligne.produit_id,
            quantite_recue: ligne.quantite_acceptee, // Utiliser quantite_acceptee comme quantite_recue
            prix_achat_unitaire_reel: 0, // À définir selon les données de la commande
            date_peremption: ligne.date_expiration,
            lot_id: null // Sera mis à jour après création du lot
          });

        if (ligneError) throw ligneError;

        // Gérer les lots pour les quantités acceptées
        if (ligne.quantite_acceptee > 0) {
          // Vérifier si le lot existe déjà
          const { data: existingLot } = await supabase
            .from('lots')
            .select('id, quantite_restante')
            .eq('tenant_id', personnel.tenant_id)
            .eq('produit_id', ligne.produit_id)
            .eq('numero_lot', ligne.numero_lot)
            .maybeSingle();

          if (existingLot) {
            // Mettre à jour le lot existant
            const { error: updateError } = await supabase
              .from('lots')
              .update({
                quantite_restante: existingLot.quantite_restante + ligne.quantite_acceptee,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLot.id);

            if (updateError) throw updateError;

            // Enregistrer le mouvement d'entrée
            const { error: mouvementError } = await supabase
              .from('mouvements_lots')
              .insert({
                tenant_id: personnel.tenant_id,
                lot_id: existingLot.id,
                produit_id: ligne.produit_id,
                type_mouvement: 'reception',
                quantite_avant: existingLot.quantite_restante,
                quantite_mouvement: ligne.quantite_acceptee,
                quantite_apres: existingLot.quantite_restante + ligne.quantite_acceptee,
                reference_id: reception.id,
                reference_type: 'reception',
                reference_document: receptionData.reference_facture || `REC-${reception.id.slice(-6)}`,
                date_mouvement: new Date().toISOString(),
                motif: 'Réception fournisseur'
              });

            if (mouvementError) throw mouvementError;
          } else {
            // Créer un nouveau lot
            const { data: newLot, error: lotError } = await supabase
              .from('lots')
              .insert({
                tenant_id: personnel.tenant_id,
                produit_id: ligne.produit_id,
                numero_lot: ligne.numero_lot,
                date_peremption: ligne.date_expiration,
                quantite_initiale: ligne.quantite_acceptee,
                quantite_restante: ligne.quantite_acceptee,
                prix_achat_unitaire: 0, // À définir selon les données de la commande
                date_reception: dateReception
              })
              .select()
              .single();

            if (lotError) throw lotError;

            // Enregistrer le mouvement d'entrée pour le nouveau lot
            const { error: mouvementError } = await supabase
              .from('mouvements_lots')
              .insert({
                tenant_id: personnel.tenant_id,
                lot_id: newLot.id,
                produit_id: ligne.produit_id,
                type_mouvement: 'reception',
                quantite_avant: 0,
                quantite_mouvement: ligne.quantite_acceptee,
                quantite_apres: ligne.quantite_acceptee,
                reference_id: reception.id,
                reference_type: 'reception',
                reference_document: receptionData.reference_facture || `REC-${reception.id.slice(-6)}`,
                date_mouvement: new Date().toISOString(),
                motif: 'Réception fournisseur - Nouveau lot'
              });

            if (mouvementError) throw mouvementError;
          }
        }
      }

      toast({
        title: "Succès",
        description: "Réception enregistrée avec succès",
      });

      await fetchReceptions();
      return reception;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateReception = async (id: string, updates: Partial<Reception>) => {
    try {
      const { data, error } = await supabase
        .from('receptions_fournisseurs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReceptions(prev => prev.map(reception => 
        reception.id === id ? { ...reception, ...data } : reception
      ));
      
      toast({
        title: "Succès",
        description: "Réception modifiée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteReception = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receptions_fournisseurs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReceptions(prev => prev.filter(reception => reception.id !== id));
      toast({
        title: "Succès",
        description: "Réception supprimée avec succès",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la réception';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchReceptions();
  }, []);

  return {
    receptions,
    loading,
    error,
    createReception,
    updateReception,
    deleteReception,
    refetch: fetchReceptions,
  };
};