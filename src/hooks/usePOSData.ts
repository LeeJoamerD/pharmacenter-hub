/**
 * Hook principal pour gérer les données du Point de Vente
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { POSProduct, TransactionData, VenteResult } from '@/types/pos';
import { updateStockAfterSale } from '@/utils/stockUpdater';
import { generateInvoiceNumber } from '@/utils/invoiceGenerator';

export const usePOSData = () => {
  const { tenantId, currentUser } = useTenant();
  const [error, setError] = useState<Error | null>(null);

  // Récupération des produits avec stock (approche en deux étapes pour éviter les erreurs PostgREST)
  const { 
    data: products = [], 
    isLoading: productsLoading,
    refetch: refreshProducts 
  } = useQuery({
    queryKey: ['pos-products', tenantId],
    queryFn: async () => {
      // Étape 1: Récupérer les produits actifs
      const { data: produitsData, error: produitsError } = await supabase
        .from('produits')
        .select(`
          id,
          tenant_id,
          libelle_produit,
          code_cip,
          prix_vente_ttc,
          prix_vente_ht,
          tva,
          stock_limite,
          famille_produit:famille_id(libelle_famille),
          dci:dci_id(libelle_dci)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('libelle_produit', { ascending: true });

      if (produitsError) throw produitsError;
      if (!produitsData || produitsData.length === 0) return [];

      // Étape 2: Récupérer tous les lots disponibles pour ces produits
      const productIds = produitsData.map(p => p.id);
      const { data: lotsData, error: lotsError } = await supabase
        .from('lots')
        .select('id, produit_id, numero_lot, quantite_restante, date_peremption, prix_achat_unitaire')
        .eq('tenant_id', tenantId)
        .in('produit_id', productIds)
        .gt('quantite_restante', 0);

      if (lotsError) throw lotsError;

      // Étape 3: Grouper les lots par produit
      const lotsByProduct: Record<string, any[]> = {};
      (lotsData || []).forEach(lot => {
        if (!lotsByProduct[lot.produit_id]) {
          lotsByProduct[lot.produit_id] = [];
        }
        lotsByProduct[lot.produit_id].push(lot);
      });

      // Étape 4: Combiner les produits avec leurs lots
      return produitsData
        .filter(p => lotsByProduct[p.id]?.length > 0)
        .map((p: any) => {
          const productLots = lotsByProduct[p.id] || [];
          return {
            id: p.id,
            tenant_id: p.tenant_id,
            name: p.libelle_produit,
            libelle_produit: p.libelle_produit,
            dci: p.dci?.libelle_dci,
            code_cip: p.code_cip,
            price: p.prix_vente_ttc || 0,
            price_ht: p.prix_vente_ht || 0,
            tva_rate: p.tva || 0,
            stock: productLots.reduce((sum: number, lot: any) => sum + (lot.quantite_restante || 0), 0),
            category: p.famille_produit?.libelle_famille || 'Autre',
            requiresPrescription: false,
            lots: productLots
              .sort((a: any, b: any) => 
                new Date(a.date_peremption).getTime() - new Date(b.date_peremption).getTime()
              )
              .map((lot: any) => ({
                id: lot.id,
                numero_lot: lot.numero_lot,
                quantite_restante: lot.quantite_restante,
                date_peremption: new Date(lot.date_peremption),
                prix_achat_unitaire: lot.prix_achat_unitaire || 0
              }))
          };
        }) as POSProduct[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Recherche de produits
  const searchProducts = useCallback((term: string): POSProduct[] => {
    if (!term || term.length < 2) return products;
    
    const searchLower = term.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.dci?.toLowerCase().includes(searchLower) ||
      p.code_cip?.includes(term)
    );
  }, [products]);

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
        metadata: {
          session_caisse_id: transactionData.session_caisse_id,
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

      // 6. Insérer les lignes de vente
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

      // 7. Mettre à jour le stock (FIFO)
      for (const item of transactionData.cart) {
        await updateStockAfterSale(item.product.id, item.quantity, tenantId);
      }

      // 8. Créer mouvements de stock
      const mouvementsStock = transactionData.cart.map(item => ({
        tenant_id: tenantId,
        produit_id: item.product.id,
        type_mouvement: 'Vente',
        quantite: -item.quantity,
        date_mouvement: new Date().toISOString(),
        agent_id: transactionData.agent_id,
        reference_type: 'vente',
        reference_id: vente.id
      }));

      await supabase
        .from('stock_mouvements')
        .insert(mouvementsStock);

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
    products,
    isLoading: productsLoading,
    error,
    refreshProducts,
    searchProducts,
    checkStock,
    saveTransaction
  };
};
