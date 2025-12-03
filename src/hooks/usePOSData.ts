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
      price: Number(product.price) || 0,
      price_ht: Number(product.price_ht) || 0,
      tva_rate: Number(product.tva_rate) || 0,
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

  // Sauvegarde d'une transaction
  const saveTransaction = useCallback(async (transactionData: TransactionData): Promise<VenteResult> => {
    try {
      // 1. Générer numéro de facture
      const numeroFacture = await generateInvoiceNumber(tenantId);

      // 2. Calculer les montants
      const subtotal = transactionData.cart.reduce((sum, item) => sum + item.total, 0);
      const remise = subtotal * (transactionData.customer.discount_rate / 100);
      const montantNet = subtotal - remise;
      
      const montantHT = transactionData.cart.reduce((sum, item) => {
        const htItem = item.unitPrice / (1 + (item.product.tva_rate / 100));
        return sum + (htItem * item.quantity);
      }, 0);
      const montantTVA = montantNet - montantHT;

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

      // 5. Insérer la vente
      const venteData: any = {
        tenant_id: tenantId,
        numero_vente: numeroFacture,
        date_vente: new Date().toISOString(),
        montant_total_ht: montantHT,
        montant_tva: montantTVA,
        montant_total_ttc: subtotal,
        remise_globale: remise,
        montant_net: montantNet,
        montant_paye: transactionData.payment.amount_received,
        montant_rendu: transactionData.payment.change,
        mode_paiement: transactionData.payment.method,
        taux_couverture_assurance: tauxCouverture,
        montant_part_assurance: montantPartAssurance,
        montant_part_patient: montantPartPatient,
        statut: 'Validée',
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

      // 6. Créer le mouvement de caisse pour l'encaissement
      if (transactionData.session_caisse_id) {
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

      // 7. Insérer les lignes de vente
      const lignesVente = transactionData.cart.map(item => {
        const htUnitaire = item.unitPrice / (1 + (item.product.tva_rate / 100));
        
        return {
          tenant_id: tenantId,
          vente_id: vente.id,
          produit_id: item.product.id,
          lot_id: item.lot?.id,
          quantite: item.quantity,
          prix_unitaire_ht: htUnitaire,
          prix_unitaire_ttc: item.unitPrice,
          taux_tva: item.product.tva_rate,
          remise_ligne: item.discount || 0,
          montant_ligne_ttc: item.total
        };
      });

      const { error: lignesError } = await supabase
        .from('lignes_ventes')
        .insert(lignesVente);

      if (lignesError) throw lignesError;

      // 8. Mettre à jour le stock (FIFO)
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

  return {
    searchByBarcode,
    checkStock,
    saveTransaction
  };
};
