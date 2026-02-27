/**
 * Hook principal pour gérer les données du Point de Vente
 * Version optimisée - suppression du fetch massif de produits
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { POSProduct, TransactionData, VenteResult, LotInfo } from '@/types/pos';
import { updateStockAfterSale, LotUsage } from '@/utils/stockUpdater';
import { generateInvoiceNumber } from '@/utils/invoiceGenerator';
// Note: Écritures comptables maintenant générées à la fermeture de session (CloseSessionModal)
import { unifiedPricingService } from '@/services/UnifiedPricingService';

export const usePOSData = () => {
  const { tenantId, currentUser } = useTenant();

  // Recherche produit par code-barres via RPC (serveur-side)
  // Supporte la recherche par code-barres lot (prioritaire) ou code produit
  const searchByBarcode = useCallback(async (barcode: string): Promise<POSProduct | null> => {
    if (!tenantId || !barcode) return null;

    const { data, error } = await supabase.rpc('search_product_by_barcode', {
      p_tenant_id: tenantId,
      p_barcode: barcode.trim()
    });

    if (error) {
      console.error('Erreur recherche code-barres:', error);
      return null;
    }

    // La fonction RPC retourne une TABLE (tableau de rows)
    // Prendre le premier résultat s'il existe
    const rows = data as any[];
    if (!rows || rows.length === 0) return null;

    const product = rows[0];
    return {
      id: product.id,
      tenant_id: product.tenant_id,
      name: product.libelle_produit,
      libelle_produit: product.libelle_produit,
      dci: product.dci,
      code_cip: product.code_cip,
      // Prix depuis le lot (source de vérité)
      prix_vente_ht: Number(product.price_ht) || 0,
      prix_vente_ttc: Number(product.price) || 0,
      taux_tva: Number(product.taux_tva) || 0,
      tva_montant: Number(product.tva_montant) || 0,
      taux_centime_additionnel: Number(product.taux_centime_additionnel) || 0,
      centime_additionnel_montant: Number(product.centime_additionnel_montant) || 0,
      // Alias compatibilité
      price: Number(product.price) || 0,
      price_ht: Number(product.price_ht) || 0,
      tva_rate: Number(product.taux_tva) || 0,
      stock: Number(product.stock) || 0,
      category: product.category || 'Autre',
      requiresPrescription: product.requires_prescription || false,
      // Lot spécifique trouvé (via code-barres lot ou FIFO)
      lots: product.lot_id ? [{
        id: product.lot_id,
        numero_lot: product.numero_lot || '',
        quantite_restante: 0, // Non fourni par la RPC, sera mis à jour si nécessaire
        date_peremption: product.date_peremption ? new Date(product.date_peremption) : null,
        prix_achat_unitaire: Number(product.prix_achat_unitaire) || 0,
        code_barre: product.code_barre_lot || null
      }] : [],
      // Info expiration
      earliest_expiration_date: product.date_peremption,
      has_valid_stock: product.stock > 0,
      all_lots_expired: false
    };
  }, [tenantId]);

  // Vérification de stock
  const checkStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    const { data, error } = await supabase
      .from('lots')
      .select('quantite_restante')
      .eq('tenant_id', tenantId)
      .eq('produit_id', productId)
      .gt('quantite_restante', 0);

    if (error) {
      console.error('Erreur vérification stock:', error);
      return false;
    }

    const totalStock = (data || []).reduce((sum, lot) => sum + lot.quantite_restante, 0);
    return totalStock >= quantity;
  }, [tenantId]);

  // Sauvegarde d'une transaction (avec option skipPayment pour le mode séparé)
  const saveTransaction = useCallback(async (
    transactionData: TransactionData, 
    skipPayment: boolean = false
  ): Promise<VenteResult> => {
    try {
      // 0. Vérification de stock AVANT de créer la vente
      for (const item of transactionData.cart) {
        const { data: lots, error: stockError } = await supabase
          .from('lots')
          .select('quantite_restante')
          .eq('tenant_id', tenantId)
          .eq('produit_id', item.product.id)
          .gt('quantite_restante', 0);
        
        if (stockError) {
          throw new Error(`Erreur vérification stock: ${stockError.message}`);
        }
        
        const totalStock = (lots || []).reduce((sum, lot) => sum + lot.quantite_restante, 0);
        if (totalStock < item.quantity) {
          throw new Error(`Stock insuffisant pour "${item.product.name || item.product.libelle_produit}". Disponible: ${totalStock}, Demandé: ${item.quantity}`);
        }
      }

      // 1. Générer numéro de facture
      const numeroFacture = await generateInvoiceNumber(tenantId);

      // 2. Calculer les montants en utilisant les données du LOT comme source de vérité
      // Les prix sont déjà calculés et sauvegardés lors de la réception - PAS DE RECALCUL
      let montantHT = 0;
      let montantTVA = 0;
      let montantCentimeAdditionnel = 0;
      
      for (const item of transactionData.cart) {
        const product = item.product;
        const lot = item.lot;
        
        // Priorité: prix du lot > prix du produit (déjà récupéré depuis lot FIFO par RPC)
        const prixHT = lot?.prix_vente_ht || product.prix_vente_ht || product.price_ht || 0;
        const tvaMontant = lot?.montant_tva || product.tva_montant || 0;
        const centimeMontant = lot?.montant_centime_additionnel || product.centime_additionnel_montant || 0;
        
        // Utiliser directement les valeurs sauvegardées, sans recalcul
        montantHT += prixHT * item.quantity;
        montantTVA += tvaMontant * item.quantity;
        montantCentimeAdditionnel += centimeMontant * item.quantity;
      }
      
      const subtotal = transactionData.cart.reduce((sum, item) => sum + item.total, 0);
      const remise = subtotal * (transactionData.customer.discount_rate / 100);
      const montantNet = subtotal - remise;

      // 3. Créer client si nécessaire
      let clientId = transactionData.customer.id;
      if (!clientId && transactionData.customer.name) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            tenant_id: tenantId,
            type_client: 'Conventionné', // Type par défaut pour nouveaux clients au POS
            nom_complet: transactionData.customer.name,
            telephone: transactionData.customer.phone,
            statut: 'Actif'
          } as any)
          .select()
          .single();
        
        if (clientError) {
          console.error('Erreur création client:', clientError);
        } else {
          clientId = newClient.id;
        }
      }

      // 4. Calculer parts assurance - Utiliser les données client au lieu du mode de paiement
      let montantPartAssurance = 0;
      let montantPartPatient = montantNet;
      let tauxCouverture = 0;
      
      // Un client est assuré s'il a un assureur_id ET un taux_ayant_droit > 0
      const customerData = transactionData.customer;
      const estAssure = !!(customerData.assureur_id && (customerData.taux_ayant_droit ?? 0) > 0);
      
      if (estAssure) {
        tauxCouverture = customerData.taux_ayant_droit || 0;
        montantPartAssurance = Math.round(montantNet * tauxCouverture / 100);
        montantPartPatient = montantNet - montantPartAssurance;
      }
      
      // Calculer le ticket modérateur (si non assuré)
      const tauxTicketModerateur = !estAssure ? (customerData.taux_ticket_moderateur ?? 0) : 0;
      const montantTicketModerateur = tauxTicketModerateur > 0 
        ? Math.round(montantPartPatient * tauxTicketModerateur / 100) 
        : 0;
      
      // Calculer la remise automatique
      const tauxRemiseAuto = customerData.taux_remise_automatique ?? customerData.discount_rate ?? 0;
      const baseRemise = montantPartPatient - montantTicketModerateur;
      const montantRemiseAuto = tauxRemiseAuto > 0 ? Math.round(baseRemise * tauxRemiseAuto / 100) : 0;
      
      // Total final à payer par le client
      const totalAPayer = Math.max(0, montantPartPatient - montantTicketModerateur - montantRemiseAuto);

      // 5. Insérer la vente - Statut "En cours" si skipPayment, sinon "Validée"
      const venteData: any = {
        tenant_id: tenantId,
        numero_vente: numeroFacture,
        date_vente: new Date().toISOString(),
        montant_total_ht: montantHT,
        montant_tva: montantTVA,
        montant_centime_additionnel: montantCentimeAdditionnel,
        montant_total_ttc: subtotal,
        remise_globale: montantRemiseAuto + montantTicketModerateur, // Total réductions
        montant_net: totalAPayer, // Le montant final après toutes les réductions
        montant_paye: skipPayment ? 0 : transactionData.payment.amount_received,
        montant_rendu: skipPayment ? 0 : transactionData.payment.change,
        mode_paiement: skipPayment ? null : transactionData.payment.method,
        taux_couverture_assurance: tauxCouverture,
        montant_part_assurance: montantPartAssurance,
        montant_part_patient: montantPartPatient,
        statut: skipPayment ? 'En cours' : 'Validée',
        session_caisse_id: transactionData.session_caisse_id,
        caisse_id: transactionData.caisse_id,
        metadata: {
          payment_reference: transactionData.payment.reference,
          client_info: {
            assureur_id: customerData.assureur_id,
            assureur_libelle: customerData.assureur_libelle,
            taux_agent: customerData.taux_agent,
            taux_ayant_droit: customerData.taux_ayant_droit,
            taux_ticket_moderateur: tauxTicketModerateur,
            montant_ticket_moderateur: montantTicketModerateur,
            taux_remise_automatique: tauxRemiseAuto,
            montant_remise_automatique: montantRemiseAuto,
            societe_id: customerData.societe_id,
            personnel_id: customerData.personnel_id,
            caution: customerData.caution,
            utiliser_caution: customerData.utiliser_caution,
            peut_prendre_bon: customerData.peut_prendre_bon,
            limite_credit: customerData.limite_credit
          }
        }
      };

      if (clientId) venteData.client_id = clientId;
      if (transactionData.agent_id) venteData.agent_id = transactionData.agent_id;
      // Phase 2.1: Sauvegarder assureur_id directement dans la colonne
      if (customerData.assureur_id) venteData.assureur_id = customerData.assureur_id;

      const { data: vente, error: venteError } = await supabase
        .from('ventes')
        .insert(venteData)
        .select()
        .single();

      if (venteError) throw venteError;

      // 6. Créer le mouvement de caisse uniquement si paiement immédiat
      if (!skipPayment && transactionData.session_caisse_id) {
        const { error: mouvementCaisseError } = await supabase
          .from('mouvements_caisse')
          .insert([{
            tenant_id: tenantId,
            session_caisse_id: transactionData.session_caisse_id,
            type_mouvement: 'Vente',
            montant: totalAPayer,
            description: `Vente ${numeroFacture} - ${transactionData.payment.method}`,
            motif: `Paiement vente ${numeroFacture}`,
            reference_id: vente.id,
            reference_type: 'vente',
            agent_id: transactionData.agent_id,
            date_mouvement: new Date().toISOString()
          }]);

        if (mouvementCaisseError) {
          console.error('Erreur création mouvement caisse:', mouvementCaisseError);
        }
      }

      // 7. Insérer les lignes de vente avec prix directement depuis les lots (source de vérité)
      // NOUVEAU: Éclater les lignes si une vente puise dans plusieurs lots (traçabilité FIFO)
      const lignesVente: any[] = [];
      const allLotsUsed: Map<string, LotUsage[]> = new Map();

      for (const item of transactionData.cart) {
        const product = item.product;
        const lot = item.lot;
        
        // Priorité: prix du lot > prix du produit - PAS DE RECALCUL
        const prixHT = lot?.prix_vente_ht || product.prix_vente_ht || product.price_ht || 0;
        const prixTTC = lot?.prix_vente_ttc || product.prix_vente_ttc || product.price || item.unitPrice;
        const tauxTVA = lot?.taux_tva || product.taux_tva || 0;
        const tvaMontant = lot?.montant_tva || product.tva_montant || 0;
        const tauxCentime = lot?.taux_centime_additionnel || product.taux_centime_additionnel || 0;
        const centimeMontant = lot?.montant_centime_additionnel || product.centime_additionnel_montant || 0;

        // Si un lot est explicitement sélectionné, créer une seule ligne
        if (lot?.id) {
          lignesVente.push({
            tenant_id: tenantId,
            vente_id: vente.id,
            produit_id: product.id,
            lot_id: lot.id,
            numero_lot: lot.numero_lot,
            date_peremption_lot: lot.date_peremption,
            quantite: item.quantity,
            prix_unitaire_ht: prixHT,
            prix_unitaire_ttc: prixTTC,
            taux_tva: tauxTVA,
            taux_centime_additionnel: tauxCentime,
            remise_ligne: item.discount || 0,
            montant_ligne_ttc: item.total,
            montant_tva_ligne: tvaMontant * item.quantity,
            montant_centime_ligne: centimeMontant * item.quantity
          });
        } else {
          // Sinon, créer une ligne par défaut (le lot sera déterminé par updateStockAfterSale)
          // Le lot FIFO sera associé lors de la mise à jour du stock
          lignesVente.push({
            tenant_id: tenantId,
            vente_id: vente.id,
            produit_id: product.id,
            lot_id: product.lots?.[0]?.id || null,
            numero_lot: product.lots?.[0]?.numero_lot || null,
            date_peremption_lot: product.lots?.[0]?.date_peremption || null,
            quantite: item.quantity,
            prix_unitaire_ht: prixHT,
            prix_unitaire_ttc: prixTTC,
            taux_tva: tauxTVA,
            taux_centime_additionnel: tauxCentime,
            remise_ligne: item.discount || 0,
            montant_ligne_ttc: item.total,
            montant_tva_ligne: tvaMontant * item.quantity,
            montant_centime_ligne: centimeMontant * item.quantity
          });
        }
      }

      const { error: lignesError } = await supabase
        .from('lignes_ventes')
        .insert(lignesVente);

      if (lignesError) throw lignesError;

      // 8. Mettre à jour le stock (FIFO) et récupérer les lots utilisés
      // La RPC rpc_stock_record_movement gère à la fois la mise à jour de quantite_restante
      // ET l'insertion dans mouvements_lots et stock_mouvements
      for (const item of transactionData.cart) {
        const lotsUsed = await updateStockAfterSale(item.product.id, item.quantity, tenantId, vente.id, 'Vente POS');
        allLotsUsed.set(item.product.id, lotsUsed);
      }

      // 9. Écritures comptables maintenant générées à la fermeture de session
      // (voir CloseSessionModal.tsx)

      return {
        vente_id: vente.id,
        numero_facture: numeroFacture,
        success: true
      };

    } catch (error: any) {
      console.error('Erreur sauvegarde transaction:', error);
      return {
        vente_id: '',
        numero_facture: '',
        success: false,
        error: error.message
      };
    }
  }, [tenantId]);

  // Encaisser une vente existante (mode séparé)
  const processPayment = useCallback(async (
    venteId: string,
    paymentData: {
      method: 'Espèces' | 'Carte Bancaire' | 'Mobile Money' | 'Chèque' | 'Virement';
      amount_received: number;
      change: number;
      reference?: string;
    },
    sessionCaisseId: string,
    agentId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Récupérer la vente
      const { data: vente, error: venteError } = await supabase
        .from('ventes')
        .select('*')
        .eq('id', venteId)
        .single();

      if (venteError || !vente) {
        throw new Error('Vente introuvable');
      }

      if (vente.statut !== 'En cours') {
        throw new Error('Cette vente a déjà été encaissée');
      }

      // 2. Déterminer le statut selon le montant payé
      const montantNet = vente.montant_net || 0;
      const isFullyPaid = paymentData.amount_received >= montantNet;
      const peutPrendreBon = (vente as any).metadata?.client_info?.peut_prendre_bon === true;
      const newStatut = (isFullyPaid || peutPrendreBon) ? 'Validée' : 'En cours';

      // 3. Mettre à jour la vente
      const { error: updateError } = await supabase
        .from('ventes')
        .update({
          statut: newStatut,
          montant_paye: paymentData.amount_received,
          montant_rendu: paymentData.change,
          mode_paiement: paymentData.method,
          metadata: {
            ...((vente.metadata as object) || {}),
            payment_reference: paymentData.reference,
            encaisse_le: new Date().toISOString(),
            paiement_partiel: !isFullyPaid,
            montant_dette: isFullyPaid ? 0 : montantNet - paymentData.amount_received
          }
        })
        .eq('id', venteId);

      if (updateError) throw updateError;

      // 4. Créer le mouvement de caisse uniquement si montant > 0
      if (paymentData.amount_received > 0) {
        const { error: mouvementError } = await supabase
          .from('mouvements_caisse')
          .insert([{
            tenant_id: tenantId,
            session_caisse_id: sessionCaisseId,
            type_mouvement: 'Vente',
            montant: Math.min(paymentData.amount_received, montantNet),
            description: `Encaissement ${vente.numero_vente} - ${paymentData.method}${!isFullyPaid ? ' (partiel)' : ''}`,
            motif: `Paiement vente ${vente.numero_vente}`,
            reference_id: venteId,
            reference_type: 'vente',
            agent_id: agentId,
            date_mouvement: new Date().toISOString()
          }]);

        if (mouvementError) {
          console.error('Erreur création mouvement caisse:', mouvementError);
        }
      }

      // 5. Écritures comptables maintenant générées à la fermeture de session
      // (voir CloseSessionModal.tsx)

      return { success: true };

    } catch (error: any) {
      console.error('Erreur encaissement:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  return {
    searchByBarcode,
    checkStock,
    saveTransaction,
    processPayment
  };
};
