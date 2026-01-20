import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStockSettings } from '@/hooks/useStockSettings';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';
import { ensureValidSession } from '@/utils/sessionRefresh';
import { LotNumberGenerator, generateFallbackLotNumber } from '@/utils/lotNumber';

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
      // Prix pré-calculés (pour éviter le recalcul)
      prix_vente_ht?: number | null;
      taux_tva?: number;
      montant_tva?: number;
      taux_centime_additionnel?: number;
      montant_centime_additionnel?: number;
      prix_vente_ttc?: number | null;
      prix_vente_suggere?: number | null;
    }>;
  }) => {
    try {
      // Vérifier la session dès le début
      const sessionValid = await ensureValidSession();
      if (!sessionValid) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

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

      // Refresh session avant l'insertion principale
      await ensureValidSession();

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

      // ====== OPTIMISATION BATCH ======
      // Remplacer les insertions séquentielles par des insertions batch
      
      const dateReception = receptionData.date_reception 
        ? new Date(receptionData.date_reception).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      // 1. Préparer toutes les lignes de réception en batch
      const lignesReceptionData = receptionData.lignes.map(ligne => ({
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
        lot_id: null
      }));

      // Refresh session avant l'insertion des lignes
      await ensureValidSession();

      // Insérer toutes les lignes en une seule requête
      const { error: lignesError } = await supabase
        .from('lignes_reception_fournisseur')
        .insert(lignesReceptionData);

      if (lignesError) throw lignesError;

      // 2. Préparer les lots - collecter les infos nécessaires
      // Utiliser le générateur centralisé pour garantir l'unicité des numéros de lots
      const lotGenerator = new LotNumberGenerator();
      
      const lignesWithLots = receptionData.lignes
        .filter(l => l.quantite_acceptee > 0)
        .map((ligne, index) => {
          // Générer automatiquement le numéro de lot si nécessaire
          let numeroLot = ligne.numero_lot;
          if (!numeroLot && stockSettings.auto_generate_lots) {
            // Utiliser le générateur centralisé pour garantir l'unicité
            numeroLot = lotGenerator.generate(ligne.produit_id, index);
          }

          if (!numeroLot && stockSettings.requireLotNumbers) {
            throw new Error(`Numéro de lot requis pour le produit.`);
          }

          if (!numeroLot) {
            // Fallback avec index pour garantir l'unicité
            numeroLot = generateFallbackLotNumber(ligne.produit_id, index);
          }

          return { ...ligne, numero_lot: numeroLot };
        });

      // 3. Pré-charger les lots existants en batch
      const productIds = [...new Set(lignesWithLots.map(l => l.produit_id))];
      
      const existingLotsMap = new Map<string, { id: string; quantite_restante: number }>();
      
      if (productIds.length > 0 && !stockSettings.oneLotPerReception) {
        // Charger les lots existants en chunks avec vérification de session
        const CHUNK_SIZE = 500;
        for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
          // Refresh session avant chaque chunk
          await ensureValidSession();
          
          const chunk = productIds.slice(i, i + CHUNK_SIZE);
          const { data: existingLots } = await supabase
            .from('lots')
            .select('id, produit_id, numero_lot, quantite_restante')
            .eq('tenant_id', personnel.tenant_id)
            .in('produit_id', chunk);

          if (existingLots) {
            for (const lot of existingLots) {
              existingLotsMap.set(`${lot.produit_id}:${lot.numero_lot}`, {
                id: lot.id,
                quantite_restante: lot.quantite_restante
              });
            }
          }
        }
      }

      // 4. Séparer les lots à créer vs à mettre à jour
      const lotsToInsert: any[] = [];
      const lotsToUpdate: { id: string; quantite_restante: number; updateData: any }[] = [];
      const mouvementsToInsert: any[] = [];
      const produitsToUpdate: { id: string; updateData: any }[] = [];

      for (const ligne of lignesWithLots) {
        const lotKey = `${ligne.produit_id}:${ligne.numero_lot}`;
        const existingLot = existingLotsMap.get(lotKey);

        const pricingData = {
          prix_vente_ht: ligne.prix_vente_ht ?? null,
          taux_tva: ligne.taux_tva ?? 0,
          montant_tva: ligne.montant_tva ?? 0,
          taux_centime_additionnel: ligne.taux_centime_additionnel ?? 0,
          montant_centime_additionnel: ligne.montant_centime_additionnel ?? 0,
          prix_vente_ttc: ligne.prix_vente_ttc ?? null,
          prix_vente_suggere: ligne.prix_vente_suggere ?? null
        };

        // Mise à jour produit si prix disponible
        if (pricingData.prix_vente_ttc !== null) {
          produitsToUpdate.push({
            id: ligne.produit_id,
            updateData: {
              prix_vente_ht: pricingData.prix_vente_ht,
              prix_vente_ttc: pricingData.prix_vente_ttc,
              taux_tva: pricingData.taux_tva,
              taux_centime_additionnel: pricingData.taux_centime_additionnel,
              updated_at: new Date().toISOString()
            }
          });
        }

        if (!stockSettings.oneLotPerReception && existingLot) {
          // Lot existant à mettre à jour
          const updateData: Record<string, any> = {
            quantite_restante: existingLot.quantite_restante + ligne.quantite_acceptee,
            updated_at: new Date().toISOString()
          };
          
          if (ligne.emplacement) updateData.emplacement = ligne.emplacement;
          if (ligne.commentaire) updateData.notes = ligne.commentaire;
          
          if (pricingData.prix_vente_ttc !== null) {
            updateData.prix_vente_ht = pricingData.prix_vente_ht;
            updateData.taux_tva = pricingData.taux_tva;
            updateData.montant_tva = pricingData.montant_tva;
            updateData.taux_centime_additionnel = pricingData.taux_centime_additionnel;
            updateData.montant_centime_additionnel = pricingData.montant_centime_additionnel;
            updateData.prix_vente_ttc = pricingData.prix_vente_ttc;
            updateData.prix_vente_suggere = pricingData.prix_vente_suggere;
          }

          lotsToUpdate.push({
            id: existingLot.id,
            quantite_restante: existingLot.quantite_restante,
            updateData
          });

          // Mouvement pour lot existant
          mouvementsToInsert.push({
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
        } else {
          // Nouveau lot à créer
          const lotInsertData: Record<string, any> = {
            tenant_id: personnel.tenant_id,
            produit_id: ligne.produit_id,
            numero_lot: ligne.numero_lot,
            date_peremption: ligne.date_expiration || null,
            quantite_initiale: ligne.quantite_acceptee,
            quantite_restante: ligne.quantite_acceptee,
            prix_achat_unitaire: ligne.prix_achat_reel || 0,
            date_reception: dateReception,
            fournisseur_id: receptionData.fournisseur_id,
            reception_id: reception.id,
            emplacement: ligne.emplacement || null,
            notes: ligne.commentaire || null,
            categorie_tarification_id: ligne.categorie_tarification_id || null
          };

          if (pricingData.prix_vente_ttc !== null) {
            lotInsertData.prix_vente_ht = pricingData.prix_vente_ht;
            lotInsertData.taux_tva = pricingData.taux_tva;
            lotInsertData.montant_tva = pricingData.montant_tva;
            lotInsertData.taux_centime_additionnel = pricingData.taux_centime_additionnel;
            lotInsertData.montant_centime_additionnel = pricingData.montant_centime_additionnel;
            lotInsertData.prix_vente_ttc = pricingData.prix_vente_ttc;
            lotInsertData.prix_vente_suggere = pricingData.prix_vente_suggere;
          }

          lotsToInsert.push({
            lotData: lotInsertData,
            ligneInfo: {
              produit_id: ligne.produit_id,
              quantite_acceptee: ligne.quantite_acceptee,
              motif: stockSettings.oneLotPerReception 
                ? 'Réception fournisseur - Lot distinct par réception' 
                : 'Réception fournisseur - Nouveau lot'
            }
          });
        }
      }

      // 5. Exécuter les mises à jour de lots existants en batch avec session check
      for (let i = 0; i < lotsToUpdate.length; i++) {
        // Refresh session toutes les 50 opérations
        if (i % 50 === 0) await ensureValidSession();
        
        const lotUpdate = lotsToUpdate[i];
        await supabase
          .from('lots')
          .update(lotUpdate.updateData)
          .eq('id', lotUpdate.id);
      }

      // 6. Insérer les nouveaux lots un par un (besoin de l'ID pour les mouvements) avec session check
      for (let i = 0; i < lotsToInsert.length; i++) {
        // Refresh session toutes les 50 opérations
        if (i % 50 === 0) await ensureValidSession();
        
        const { lotData, ligneInfo } = lotsToInsert[i];
        const { data: newLot, error: lotError } = await supabase
          .from('lots')
          .insert(lotData as any)
          .select('id')
          .single();

        if (lotError) throw lotError;

        // Ajouter le mouvement pour le nouveau lot
        mouvementsToInsert.push({
          tenant_id: personnel.tenant_id,
          lot_id: newLot.id,
          produit_id: ligneInfo.produit_id,
          type_mouvement: 'entree',
          quantite_avant: 0,
          quantite_mouvement: ligneInfo.quantite_acceptee,
          quantite_apres: ligneInfo.quantite_acceptee,
          reference_id: reception.id,
          reference_type: 'reception',
          reference_document: receptionData.reference_facture || `REC-${reception.id.slice(-6)}`,
          date_mouvement: new Date().toISOString(),
          motif: ligneInfo.motif
        });
      }

      // 7. Insérer tous les mouvements en batch avec session check
      if (mouvementsToInsert.length > 0) {
        const CHUNK_SIZE = 500;
        for (let i = 0; i < mouvementsToInsert.length; i += CHUNK_SIZE) {
          // Refresh session avant chaque chunk
          await ensureValidSession();
          
          const chunk = mouvementsToInsert.slice(i, i + CHUNK_SIZE);
          const { error: mouvementsError } = await supabase
            .from('mouvements_lots')
            .insert(chunk);
          
          if (mouvementsError) throw mouvementsError;
        }
      }

      // 8. Mettre à jour les produits en batch avec session check
      for (let i = 0; i < produitsToUpdate.length; i++) {
        // Refresh session toutes les 50 opérations
        if (i % 50 === 0) await ensureValidSession();
        
        const produitUpdate = produitsToUpdate[i];
        await supabase
          .from('produits')
          .update(produitUpdate.updateData)
          .eq('id', produitUpdate.id);
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