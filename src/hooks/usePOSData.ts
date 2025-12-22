/**
 * Hook principal pour gérer les données du Point de Vente
 * Version optimisée - suppression du fetch massif de produits
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { POSProduct, TransactionData, VenteResult } from '@/types/pos';
import { updateStockAfterSale } from '@/utils/stockUpdater';
import { generateInvoiceNumber } from '@/utils/invoiceGenerator';
import { generateSaleAccountingEntries, isAutoAccountingEnabled } from '@/services/AccountingEntriesService';
import { unifiedPricingService } from '@/services/UnifiedPricingService';

export const usePOSData = () => {
  const { tenantId, currentUser } = useTenant();

  // Recherche produit par code-barres via RPC (serveur-side)
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

    if (!data || data.length === 0) return null;

    const product = data[0];
    return {
      id: product.id,
      tenant_id: product.tenant_id,
      name: product.name,
      libelle_produit: product.libelle_produit,
      dci: product.dci,
      code_cip: product.code_cip,
      // Prix depuis la table produits (source de vérité)
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
      lots: [] // Les lots seront chargés séparément si nécessaire
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

      // 2. Calculer les montants en utilisant les données produits comme source de vérité
      // Logique: Prioriser prix_vente_ht, tva_montant, centime_additionnel depuis produits
      // Si manquants et produit soumis à TVA, calculer depuis le TTC
      let montantHT = 0;
      let montantTVA = 0;
      let montantCentimeAdditionnel = 0;
      
      for (const item of transactionData.cart) {
        const product = item.product;
        let prixHT = product.prix_vente_ht || 0;
        let tvaMontant = product.tva_montant || 0;
        let centimeMontant = product.centime_additionnel_montant || 0;
        const prixTTC = product.prix_vente_ttc || product.price || item.unitPrice;
        const tauxTVA = product.taux_tva || 0;
        const tauxCentime = product.taux_centime_additionnel || 0;
        
        // Si pas de prix HT et produit soumis à TVA, utiliser le service centralisé pour calculer
        if (prixHT === 0 && prixTTC > 0 && tauxTVA > 0) {
          // Calcul inverse via le service centralisé
          const diviseur = 1 + (tauxTVA / 100) + (tauxCentime / 100);
          prixHT = unifiedPricingService.roundForCurrency(prixTTC / diviseur);
          tvaMontant = unifiedPricingService.roundForCurrency(prixHT * tauxTVA / 100);
          centimeMontant = unifiedPricingService.roundForCurrency(tvaMontant * tauxCentime / 100);
        } else if (prixHT === 0 && prixTTC > 0) {
          // Produit exonéré de TVA : HT = TTC
          prixHT = prixTTC;
        }
        
        montantHT += prixHT * item.quantity;
        // Centime Additionnel uniquement sur produits soumis à TVA
        if (tauxTVA > 0) {
          montantTVA += tvaMontant * item.quantity;
          montantCentimeAdditionnel += centimeMontant * item.quantity;
        }
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
            type_client: transactionData.customer.type === 'assure' ? 'Assuré' : 'Ordinaire',
            nom_complet: transactionData.customer.name,
            telephone: transactionData.customer.phone,
            statut: 'Actif'
          })
          .select()
          .single();
        
        if (clientError) {
          console.error('Erreur création client:', clientError);
        } else {
          clientId = newClient.id;
        }
      }

      // 4. Calculer parts assurance
      let montantPartAssurance = 0;
      let montantPartPatient = montantNet;
      let tauxCouverture = 0;
      
      if (transactionData.payment.method === 'Assurance' && transactionData.customer.insurance) {
        tauxCouverture = transactionData.customer.insurance.coverage_rate;
        montantPartAssurance = montantNet * (tauxCouverture / 100);
        montantPartPatient = montantNet - montantPartAssurance;
      }

      // 5. Insérer la vente - Statut "En cours" si skipPayment, sinon "Validée"
      const venteData: any = {
        tenant_id: tenantId,
        numero_vente: numeroFacture,
        date_vente: new Date().toISOString(),
        montant_total_ht: montantHT,
        montant_tva: montantTVA,
        montant_total_ttc: subtotal,
        remise_globale: remise,
        montant_net: montantNet,
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
          payment_reference: transactionData.payment.reference
        }
      };

      if (clientId) venteData.client_id = clientId;
      if (transactionData.agent_id) venteData.agent_id = transactionData.agent_id;

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
            montant: transactionData.payment.amount_received,
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

      // 7. Insérer les lignes de vente avec calcul correct des prix
      const lignesVente = transactionData.cart.map(item => {
        const product = item.product;
        let prixHT = product.prix_vente_ht || 0;
        let tvaMontant = product.tva_montant || 0;
        let centimeMontant = product.centime_additionnel_montant || 0;
        const prixTTC = product.prix_vente_ttc || product.price || item.unitPrice;
        const tauxTVA = product.taux_tva || 0;
        const tauxCentime = product.taux_centime_additionnel || 0;
        
        // Si pas de prix HT et produit soumis à TVA, utiliser le service centralisé pour calculer
        if (prixHT === 0 && prixTTC > 0 && tauxTVA > 0) {
          const diviseur = 1 + (tauxTVA / 100) + (tauxCentime / 100);
          prixHT = unifiedPricingService.roundForCurrency(prixTTC / diviseur);
          tvaMontant = unifiedPricingService.roundForCurrency(prixHT * tauxTVA / 100);
          centimeMontant = unifiedPricingService.roundForCurrency(tvaMontant * tauxCentime / 100);
        } else if (prixHT === 0 && prixTTC > 0) {
          prixHT = prixTTC;
        }
        
        return {
          tenant_id: tenantId,
          vente_id: vente.id,
          produit_id: product.id,
          lot_id: item.lot?.id,
          quantite: item.quantity,
          prix_unitaire_ht: prixHT,
          prix_unitaire_ttc: prixTTC,
          taux_tva: tauxTVA,
          remise_ligne: item.discount || 0,
          montant_ligne_ttc: item.total
        };
      });

      const { error: lignesError } = await supabase
        .from('lignes_ventes')
        .insert(lignesVente);

      if (lignesError) throw lignesError;

      // 8. Mettre à jour le stock (FIFO) - Se fait immédiatement, même si pas de paiement
      for (const item of transactionData.cart) {
        await updateStockAfterSale(item.product.id, item.quantity, tenantId);
      }

      // 9. Créer mouvements de stock
      const mouvementsStock = transactionData.cart.map(item => ({
        tenant_id: tenantId,
        produit_id: item.product.id,
        type_mouvement: 'vente',
        quantite: -item.quantity,
        date_mouvement: new Date().toISOString(),
        agent_id: transactionData.agent_id,
        reference_type: 'vente',
        reference_id: vente.id,
        lot_id: item.lot?.id || null
      }));

      const { error: mouvementError } = await supabase
        .from('stock_mouvements')
        .insert(mouvementsStock);

      if (mouvementError) {
        console.error('Erreur mouvements stock:', mouvementError);
      }

      // 10. Générer les écritures comptables automatiquement (si configuré)
      try {
        const autoAccountingEnabled = await isAutoAccountingEnabled(tenantId);
        if (autoAccountingEnabled && !skipPayment) {
          await generateSaleAccountingEntries({
            venteId: vente.id,
            numeroVente: numeroFacture,
            tenantId,
            montantHT,
            montantTVA,
            montantCentimeAdditionnel,
            montantTTC: subtotal,
            modePaiement: transactionData.payment.method
          });
        }
      } catch (accountingError) {
        console.error('Erreur écritures comptables (non bloquante):', accountingError);
      }

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

      // 2. Mettre à jour la vente
      const { error: updateError } = await supabase
        .from('ventes')
        .update({
          statut: 'Validée',
          montant_paye: paymentData.amount_received,
          montant_rendu: paymentData.change,
          mode_paiement: paymentData.method,
          metadata: {
            ...((vente.metadata as object) || {}),
            payment_reference: paymentData.reference,
            encaisse_le: new Date().toISOString()
          }
        })
        .eq('id', venteId);

      if (updateError) throw updateError;

      // 3. Créer le mouvement de caisse
      const { error: mouvementError } = await supabase
        .from('mouvements_caisse')
        .insert([{
          tenant_id: tenantId,
          session_caisse_id: sessionCaisseId,
          type_mouvement: 'Vente',
          montant: paymentData.amount_received,
          description: `Encaissement ${vente.numero_vente} - ${paymentData.method}`,
          motif: `Paiement vente ${vente.numero_vente}`,
          reference_id: venteId,
          reference_type: 'vente',
          agent_id: agentId,
          date_mouvement: new Date().toISOString()
        }]);

      if (mouvementError) {
        console.error('Erreur création mouvement caisse:', mouvementError);
      }

      // 4. Générer les écritures comptables automatiquement (si configuré)
      try {
        const autoAccountingEnabled = await isAutoAccountingEnabled(tenantId);
        if (autoAccountingEnabled) {
          await generateSaleAccountingEntries({
            venteId,
            numeroVente: vente.numero_vente,
            tenantId,
            montantHT: Number(vente.montant_total_ht) || 0,
            montantTVA: Number(vente.montant_tva) || 0,
            montantCentimeAdditionnel: 0, // Non stocké dans la vente, sera calculé si nécessaire
            montantTTC: Number(vente.montant_total_ttc) || paymentData.amount_received,
            modePaiement: paymentData.method
          });
        }
      } catch (accountingError) {
        console.error('Erreur écritures comptables (non bloquante):', accountingError);
      }

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
