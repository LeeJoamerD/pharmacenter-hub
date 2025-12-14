import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStockSettings } from '@/hooks/useStockSettings';

export interface Reception {
  id: string;
  tenant_id: string;
  commande_id: string | null;
  fournisseur_id: string;
  date_reception: string | null;
  agent_id: string | null;
  reference_facture: string | null;
  numero_reception?: string;
  statut?: string;
  notes?: string;
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
  const { settings: stockSettings } = useStockSettings();

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
    isValidated?: boolean;
    notes?: string;
    // Montants financiers
    montant_ht?: number;
    montant_tva?: number;
    montant_centime_additionnel?: number;
    montant_asdi?: number;
    montant_ttc?: number;
    // Contrôle qualité
    emballage_conforme?: boolean;
    temperature_respectee?: boolean;
    etiquetage_correct?: boolean;
    lignes: Array<{
      produit_id: string;
      quantite_commandee: number;
      quantite_recue: number;
      quantite_acceptee: number;
      numero_lot: string;
      date_expiration?: string;
      statut: 'conforme' | 'non-conforme' | 'partiellement-conforme';
      commentaire?: string;
      prix_achat_reel?: number;
      emplacement?: string;
      categorie_tarification_id?: string;
    }>;
  }) => {
    try {
      // Get current user's tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel, error: personnelError } = await supabase
        .from('personnel')
        .select('id, tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      console.log('🔍 Personnel récupéré pour réception:', personnel);

      if (personnelError) {
        console.error('❌ Erreur récupération personnel:', personnelError);
        throw new Error('Erreur lors de la récupération du personnel');
      }

      if (!personnel?.id || !personnel?.tenant_id) {
        console.error('❌ Données personnel incomplètes:', personnel);
        throw new Error('Données personnel incomplètes (id ou tenant_id manquant)');
      }

      console.log('📝 Création réception avec agent_id:', personnel.id);
      console.log('💰 Montants financiers:', {
        montant_ht: receptionData.montant_ht,
        montant_tva: receptionData.montant_tva,
        montant_centime_additionnel: receptionData.montant_centime_additionnel,
        montant_ttc: receptionData.montant_ttc
      });

      const { data: reception, error: receptionError } = await supabase
        .from('receptions_fournisseurs')
        .insert({
          tenant_id: personnel.tenant_id,
          commande_id: receptionData.commande_id,
          fournisseur_id: receptionData.fournisseur_id,
          date_reception: receptionData.date_reception || new Date().toISOString(),
          agent_id: personnel.id,
          reference_facture: receptionData.reference_facture,
          statut: receptionData.isValidated ? 'Validé' : 'En cours',
          valide_par_id: receptionData.isValidated ? personnel.id : null,
          // Montants financiers
          montant_ht: receptionData.montant_ht || 0,
          montant_tva: receptionData.montant_tva || 0,
          montant_centime_additionnel: receptionData.montant_centime_additionnel || 0,
          montant_asdi: receptionData.montant_asdi || 0,
          montant_ttc: receptionData.montant_ttc || 0,
          notes: receptionData.notes || null,
          // Contrôle qualité
          emballage_conforme: receptionData.emballage_conforme || false,
          temperature_respectee: receptionData.temperature_respectee || false,
          etiquetage_correct: receptionData.etiquetage_correct || false
        })
        .select()
        .single();

      console.log('✅ Réception créée:', reception);

      if (receptionError) {
        console.error('❌ Erreur création réception:', receptionError);
        throw receptionError;
      }

      // Gérer les lots et créer les lignes de réception
      const dateReception = receptionData.date_reception ? new Date(receptionData.date_reception).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      for (const ligne of receptionData.lignes) {
        // Créer la ligne de réception avec toutes les colonnes
        const { error: ligneError } = await supabase
          .from('lignes_reception_fournisseur')
          .insert({
            tenant_id: personnel.tenant_id,
            reception_id: reception.id,
            produit_id: ligne.produit_id,
            quantite_commandee: ligne.quantite_commandee || 0,
            quantite_recue: ligne.quantite_recue || ligne.quantite_acceptee,
            quantite_acceptee: ligne.quantite_acceptee || 0,
            prix_achat_unitaire_reel: ligne.prix_achat_reel || 0,
            date_peremption: ligne.date_expiration || null,
            numero_lot: ligne.numero_lot || null,
            statut: ligne.statut || 'conforme',
            commentaire: ligne.commentaire || null,
            emplacement: ligne.emplacement || null,
            categorie_tarification_id: ligne.categorie_tarification_id || null,
            lot_id: null // Sera mis à jour après création du lot
          });

        if (ligneError) throw ligneError;

        // Gérer les lots pour les quantités acceptées
        if (ligne.quantite_acceptee > 0) {
          let shouldCreateNewLot = false;
          let existingLot = null;

          if (stockSettings.oneLotPerReception) {
            // Mode "1 lot par réception" : toujours créer un nouveau lot
            shouldCreateNewLot = true;
          } else {
            // Mode par défaut : vérifier si le lot existe déjà
            const { data: lotData } = await supabase
              .from('lots')
              .select('id, quantite_restante')
              .eq('tenant_id', personnel.tenant_id)
              .eq('produit_id', ligne.produit_id)
              .eq('numero_lot', ligne.numero_lot)
              .maybeSingle();
            
            existingLot = lotData;
            shouldCreateNewLot = !existingLot;
          }

          if (!shouldCreateNewLot && existingLot) {
            // Mettre à jour le lot existant avec emplacement et notes si fournis
            const { error: updateError } = await supabase
              .from('lots')
              .update({
                quantite_restante: existingLot.quantite_restante + ligne.quantite_acceptee,
                updated_at: new Date().toISOString(),
                ...(ligne.emplacement && { emplacement: ligne.emplacement }),
                ...(ligne.commentaire && { notes: ligne.commentaire })
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
                type_mouvement: 'entree',
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
            // Créer un nouveau lot (mode par défaut ou mode "1 lot par réception")
            const { data: newLot, error: lotError } = await supabase
              .from('lots')
              .insert({
                tenant_id: personnel.tenant_id,
                produit_id: ligne.produit_id,
                numero_lot: ligne.numero_lot,
                date_peremption: ligne.date_expiration || null,
                quantite_initiale: ligne.quantite_acceptee,
                quantite_restante: ligne.quantite_acceptee,
                prix_achat_unitaire: ligne.prix_achat_reel || 0,
                date_reception: dateReception,
                // Ajout des colonnes complètes
                fournisseur_id: receptionData.fournisseur_id,
                reception_id: reception.id,
                emplacement: ligne.emplacement || null,
                notes: ligne.commentaire || null,
                categorie_tarification_id: ligne.categorie_tarification_id || null
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
                type_mouvement: 'entree',
                quantite_avant: 0,
                quantite_mouvement: ligne.quantite_acceptee,
                quantite_apres: ligne.quantite_acceptee,
                reference_id: reception.id,
                reference_type: 'reception',
                reference_document: receptionData.reference_facture || `REC-${reception.id.slice(-6)}`,
                date_mouvement: new Date().toISOString(),
                motif: stockSettings.oneLotPerReception ? 
                  'Réception fournisseur - Lot distinct par réception' : 
                  'Réception fournisseur - Nouveau lot'
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

  const validateReception = async (id: string) => {
    try {
      // Récupérer le personnel actuel
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non authentifié');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.id) throw new Error('Personnel non trouvé');

      const { data, error } = await supabase
        .from('receptions_fournisseurs')
        .update({ 
          statut: 'Validé',
          valide_par_id: personnel.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReceptions(prev => prev.map(reception => 
        reception.id === id ? { ...reception, ...data } : reception
      ));
      
      toast({
        title: "Succès",
        description: "Réception validée avec succès",
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation de la réception';
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
    validateReception,
    deleteReception,
    refetch: fetchReceptions,
  };
};