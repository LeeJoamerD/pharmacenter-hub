import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

export interface Return {
  id: string;
  numero_retour: string;
  date_retour: string;
  vente_origine_id?: string;
  numero_vente_origine?: string;
  client_id?: string;
  type_operation: 'Retour' | 'Échange' | 'Avoir';
  montant_total_retour: number;
  montant_rembourse: number;
  montant_avoir: number;
  mode_remboursement?: 'Espèces' | 'Virement' | 'Avoir' | 'Crédit compte';
  statut: 'En attente' | 'Approuvé' | 'Rejeté' | 'Terminé';
  motif_retour: string;
  notes?: string;
  lignes?: ReturnLine[];
}

export interface ReturnLine {
  id: string;
  produit_id?: string;
  lot_id?: string;
  quantite_retournee: number;
  prix_unitaire: number;
  montant_ligne: number;
  etat_produit: 'Parfait' | 'Endommagé' | 'Expiré' | 'Non conforme';
  taux_remboursement: number;
  motif_ligne?: string;
  remis_en_stock: boolean;
}

export interface CreateReturnData {
  vente_origine_id: string;
  numero_vente_origine: string;
  client_id?: string;
  type_operation: 'Retour' | 'Échange' | 'Avoir';
  motif_retour: string;
  notes?: string;
  lignes: Omit<ReturnLine, 'id'>[];
}

/**
 * Hook pour gérer les retours et échanges de produits
 * Fonctionnalités: création, validation, traitement, statistiques
 */
export const useReturnsExchanges = () => {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer tous les retours avec filtres
  const { data: returns, isLoading: returnsLoading } = useQuery({
    queryKey: ['returns', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retours')
        .select(`
          *,
          client:client_id(nom_complet, telephone),
          agent:agent_id(noms, prenoms),
          validateur:validateur_id(noms, prenoms),
          lignes_retours(*)
        `)
        .eq('tenant_id', tenantId)
        .order('date_retour', { ascending: false });

      if (error) throw error;
      return data as Return[];
    },
    enabled: !!tenantId,
  });

  // Récupérer un retour par ID
  const getReturnById = async (id: string): Promise<Return | null> => {
    const { data, error } = await supabase
      .from('retours')
      .select(`
        *,
        client:client_id(nom_complet, telephone),
        lignes_retours(
          *,
          produit:produit_id(libelle_produit, code_cip),
          lot:lot_id(numero_lot, date_peremption)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching return:', error);
      return null;
    }
    return data as Return;
  };

  // Rechercher transaction originale
  const searchOriginalTransaction = async (reference: string) => {
    const { data, error } = await supabase
      .from('ventes')
      .select(`
        id,
        numero_facture,
        date_vente,
        montant_net,
        client:client_id(nom_complet),
        lignes_ventes(
          *,
          produit:produit_id(libelle_produit, code_cip)
        )
      `)
      .eq('tenant_id', tenantId)
      .or(`numero_facture.ilike.%${reference}%,id.eq.${reference}`)
      .order('date_vente', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  };

  // Calculer montant remboursement selon état produit
  const calculateRefundAmount = (
    items: Array<{ prix_unitaire: number; quantite_retournee: number; etat_produit: string }>
  ): number => {
    return items.reduce((total, item) => {
      let taux = 100; // Parfait = 100%
      if (item.etat_produit === 'Endommagé') taux = 50;
      if (item.etat_produit === 'Expiré' || item.etat_produit === 'Non conforme') taux = 0;
      
      return total + (item.prix_unitaire * item.quantite_retournee * taux / 100);
    }, 0);
  };

  // Créer un retour
  const createReturnMutation = useMutation({
    mutationFn: async (returnData: CreateReturnData) => {
      // Générer numéro retour
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const count = (returns?.length || 0) + 1;
      const numero = `RET-${dateStr}-${String(count).padStart(4, '0')}`;

      // Calculer montants
      const montantTotal = returnData.lignes.reduce((sum, l) => sum + l.montant_ligne, 0);
      const montantRembourse = calculateRefundAmount(returnData.lignes);

      // Créer le retour
      const { data: retour, error: retourError } = await supabase
        .from('retours')
        .insert({
          tenant_id: tenantId,
          numero_retour: numero,
          vente_origine_id: returnData.vente_origine_id,
          numero_vente_origine: returnData.numero_vente_origine,
          client_id: returnData.client_id,
          type_operation: returnData.type_operation,
          montant_total_retour: montantTotal,
          montant_rembourse: montantRembourse,
          montant_avoir: returnData.type_operation === 'Avoir' ? montantRembourse : 0,
          mode_remboursement: returnData.type_operation === 'Avoir' ? 'Avoir' : 'Espèces',
          statut: 'En attente',
          motif_retour: returnData.motif_retour,
          notes: returnData.notes,
        })
        .select()
        .single();

      if (retourError) throw retourError;

      // Créer les lignes de retour
      const lignes = returnData.lignes.map(ligne => ({
        tenant_id: tenantId,
        retour_id: retour.id,
        ...ligne,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_retours')
        .insert(lignes);

      if (lignesError) throw lignesError;

      return retour;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      toast({
        title: 'Retour créé',
        description: 'La demande de retour a été créée avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de créer le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Valider un retour (Approuver/Rejeter)
  const validateReturnMutation = useMutation({
    mutationFn: async ({ id, decision, validatorId }: { 
      id: string; 
      decision: 'Approuvé' | 'Rejeté';
      validatorId: string;
    }) => {
      const { error } = await supabase
        .from('retours')
        .update({
          statut: decision,
          validateur_id: validatorId,
          date_validation: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      toast({
        title: 'Retour validé',
        description: 'Le retour a été traité avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de valider le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Traiter le retour (remboursement + réintégration stock)
  const processReturnMutation = useMutation({
    mutationFn: async (returnId: string) => {
      const retour = await getReturnById(returnId);
      if (!retour || retour.statut !== 'Approuvé') {
        throw new Error('Le retour doit être approuvé avant traitement');
      }

      // Réintégrer le stock pour les produits en bon état
      const lignesAReintegrer = retour.lignes?.filter(l => 
        (l.etat_produit === 'Parfait' || l.etat_produit === 'Endommagé') && 
        l.lot_id
      );

      if (lignesAReintegrer && lignesAReintegrer.length > 0) {
        for (const ligne of lignesAReintegrer) {
          // Mettre à jour quantité lot
          const { data: lot } = await supabase
            .from('lots')
            .select('quantite_restante')
            .eq('id', ligne.lot_id)
            .single();
          
          if (lot) {
            await supabase
              .from('lots')
              .update({ quantite_restante: lot.quantite_restante + ligne.quantite_retournee })
              .eq('id', ligne.lot_id);
          }

          // Marquer comme remis en stock
          await supabase
            .from('lignes_retours')
            .update({ remis_en_stock: true })
            .eq('id', ligne.id);
        }
      }

      // Marquer le retour comme terminé
      const { error } = await supabase
        .from('retours')
        .update({ statut: 'Terminé' })
        .eq('id', returnId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['lots', tenantId] });
      toast({
        title: 'Retour traité',
        description: 'Le retour a été traité et le stock mis à jour',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Impossible de traiter le retour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Statistiques des retours
  const { data: statistics } = useQuery({
    queryKey: ['return-statistics', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retours')
        .select('montant_total_retour, montant_rembourse, statut')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const total = data.length;
      const enAttente = data.filter(r => r.statut === 'En attente').length;
      const approuves = data.filter(r => r.statut === 'Approuvé').length;
      const rejetes = data.filter(r => r.statut === 'Rejeté').length;
      const termines = data.filter(r => r.statut === 'Terminé').length;
      const montantTotal = data.reduce((sum, r) => sum + (r.montant_total_retour || 0), 0);
      const montantRembourse = data.reduce((sum, r) => sum + (r.montant_rembourse || 0), 0);
      const tauxRetour = total > 0 ? (total / 100) : 0; // À calculer par rapport aux ventes

      return {
        total,
        enAttente,
        approuves,
        rejetes,
        termines,
        montantTotal,
        montantRembourse,
        tauxRetour,
      };
    },
    enabled: !!tenantId,
  });

  return {
    returns,
    returnsLoading,
    getReturnById,
    searchOriginalTransaction,
    calculateRefundAmount,
    createReturn: createReturnMutation.mutateAsync,
    validateReturn: validateReturnMutation.mutateAsync,
    processReturn: processReturnMutation.mutateAsync,
    statistics,
  };
};
