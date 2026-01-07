import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStockSettings } from '@/hooks/useStockSettings';
import { unifiedPricingService } from '@/services/UnifiedPricingService';
import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

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
          // Générer automatiquement le numéro de lot si paramètre activé et numéro vide
          let numeroLot = ligne.numero_lot;
          if (!numeroLot && stockSettings.auto_generate_lots) {
            const productCode = ligne.produit_id.slice(0, 8).toUpperCase();
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const sequence = Date.now().toString().slice(-4);
            numeroLot = `LOT-${productCode}-${dateStr}-${sequence}`;
            console.log('🔢 Numéro de lot auto-généré dans useReceptions:', numeroLot);
          }

          // Vérifier que le numéro est présent si obligatoire
          if (!numeroLot && stockSettings.requireLotNumbers) {
            throw new Error(`Numéro de lot requis pour le produit. Activez la génération automatique ou saisissez manuellement.`);
          }

          // Si toujours pas de numéro, utiliser un générique
          if (!numeroLot) {
            numeroLot = `LOT-${ligne.produit_id.slice(0, 4)}-${Date.now()}`;
          }
          let shouldCreateNewLot = false;
          let existingLot = null;

          // Récupérer la catégorie de tarification pour calculer les prix
          let pricingData: {
            prix_vente_ht: number | null;
            taux_tva: number | null;
            montant_tva: number | null;
            taux_centime_additionnel: number | null;
            montant_centime_additionnel: number | null;
            prix_vente_ttc: number | null;
          } = {
            prix_vente_ht: null,
            taux_tva: null,
            montant_tva: null,
            taux_centime_additionnel: null,
            montant_centime_additionnel: null,
            prix_vente_ttc: null
          };

          // Calculer les prix de vente si catégorie et prix d'achat disponibles
          if (ligne.categorie_tarification_id && ligne.prix_achat_reel && ligne.prix_achat_reel > 0) {
            // Récupérer les infos de la catégorie de tarification
            // @ts-ignore - Ignorer les erreurs de typage Supabase
            const { data: categorieData } = await supabase
              .from('categorie_tarification')
              .select('coefficient_prix_vente, taux_tva, taux_centime_additionnel')
              .eq('id', ligne.categorie_tarification_id)
              .single();

            if (categorieData) {
              // Récupérer les paramètres système pour l'arrondi
              // @ts-ignore - Ignorer les erreurs de typage Supabase
              const { data: parametres } = await supabase
                .from('parametres_systeme')
                .select('cle_parametre, valeur_parametre')
                .eq('tenant_id', personnel.tenant_id)
                .in('cle_parametre', ['stock_rounding_precision', 'taxRoundingMethod', 'default_currency']);

              const paramsMap: Record<string, string> = {};
              (parametres as any[])?.forEach((p: any) => { paramsMap[p.cle_parametre] = p.valeur_parametre; });

              const roundingPrecision = parseFloat(paramsMap['stock_rounding_precision'] || String(DEFAULT_SETTINGS.rounding.precision));
              const roundingMethod = (paramsMap['taxRoundingMethod'] || DEFAULT_SETTINGS.rounding.method) as 'ceil' | 'floor' | 'round' | 'none';
              const currencyCode = paramsMap['default_currency'] || DEFAULT_SETTINGS.currency.code;

              // Calculer les prix via UnifiedPricingService
              const pricingResult = unifiedPricingService.calculateSalePrice({
                prixAchat: ligne.prix_achat_reel,
                coefficientPrixVente: categorieData.coefficient_prix_vente || 1,
                tauxTVA: categorieData.taux_tva || 0,
                tauxCentimeAdditionnel: categorieData.taux_centime_additionnel || 0,
                roundingPrecision,
                roundingMethod,
                currencyCode
              });

              pricingData = {
                prix_vente_ht: pricingResult.prixVenteHT,
                taux_tva: pricingResult.tauxTVA,
                montant_tva: pricingResult.montantTVA,
                taux_centime_additionnel: pricingResult.tauxCentimeAdditionnel,
                montant_centime_additionnel: pricingResult.montantCentimeAdditionnel,
                prix_vente_ttc: pricingResult.prixVenteTTC
              };

              console.log('💰 Prix calculés pour lot:', {
                produit_id: ligne.produit_id,
                prix_achat: ligne.prix_achat_reel,
                coefficient: categorieData.coefficient_prix_vente,
                ...pricingData
              });

              // Mettre à jour aussi la table produits avec ces prix
              const { error: produitUpdateError } = await supabase
                .from('produits')
                .update({
                  prix_vente_ht: pricingData.prix_vente_ht,
                  prix_vente_ttc: pricingData.prix_vente_ttc,
                  taux_tva: pricingData.taux_tva,
                  taux_centime_additionnel: pricingData.taux_centime_additionnel,
                  updated_at: new Date().toISOString()
                })
                .eq('id', ligne.produit_id);

              if (produitUpdateError) {
                console.warn('⚠️ Erreur mise à jour prix produit:', produitUpdateError);
              }
            }
          }

          if (stockSettings.oneLotPerReception) {
            // Mode "1 lot par réception" : toujours créer un nouveau lot
            shouldCreateNewLot = true;
          } else {
            // Mode par défaut : vérifier si le lot existe déjà (utiliser numeroLot au lieu de ligne.numero_lot)
            const { data: lotData } = await supabase
              .from('lots')
              .select('id, quantite_restante')
              .eq('tenant_id', personnel.tenant_id)
              .eq('produit_id', ligne.produit_id)
              .eq('numero_lot', numeroLot)
              .maybeSingle();
            
            existingLot = lotData;
            shouldCreateNewLot = !existingLot;
          }

          if (!shouldCreateNewLot && existingLot) {
            // Mettre à jour le lot existant avec emplacement, notes et prix si fournis
            const updateData: Record<string, any> = {
              quantite_restante: existingLot.quantite_restante + ligne.quantite_acceptee,
              updated_at: new Date().toISOString()
            };
            
            if (ligne.emplacement) updateData.emplacement = ligne.emplacement;
            if (ligne.commentaire) updateData.notes = ligne.commentaire;
            
            // Mettre à jour les prix si calculés
            if (pricingData.prix_vente_ttc !== null) {
              updateData.prix_vente_ht = pricingData.prix_vente_ht;
              updateData.taux_tva = pricingData.taux_tva;
              updateData.montant_tva = pricingData.montant_tva;
              updateData.taux_centime_additionnel = pricingData.taux_centime_additionnel;
              updateData.montant_centime_additionnel = pricingData.montant_centime_additionnel;
              updateData.prix_vente_ttc = pricingData.prix_vente_ttc;
            }

            const { error: updateError } = await supabase
              .from('lots')
              .update(updateData)
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
            // Créer un nouveau lot avec les prix calculés (utiliser numeroLot au lieu de ligne.numero_lot)
            const lotInsertData: Record<string, any> = {
              tenant_id: personnel.tenant_id,
              produit_id: ligne.produit_id,
              numero_lot: numeroLot,
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

            // Ajouter les prix calculés s'ils existent
            if (pricingData.prix_vente_ttc !== null) {
              lotInsertData.prix_vente_ht = pricingData.prix_vente_ht;
              lotInsertData.taux_tva = pricingData.taux_tva;
              lotInsertData.montant_tva = pricingData.montant_tva;
              lotInsertData.taux_centime_additionnel = pricingData.taux_centime_additionnel;
              lotInsertData.montant_centime_additionnel = pricingData.montant_centime_additionnel;
              lotInsertData.prix_vente_ttc = pricingData.prix_vente_ttc;
            }

            // @ts-ignore - Ignorer les erreurs de typage Supabase pour Record<string, any>
            const { data: newLot, error: lotError } = await supabase
              .from('lots')
              .insert(lotInsertData as any)
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