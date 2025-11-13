import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockUpdateService } from '@/services/stockUpdateService';
import { toast } from '@/hooks/use-toast';

interface DetailProduct {
  id: string;
  libelle_produit: string;
  quantite_unites_details_source: number;
  prix_vente_ttc: number | null;
}

interface LotInfo {
  id: string;
  numero_lot: string;
  produit_id: string;
  quantite_restante: number;
  date_peremption: string | null;
  date_fabrication: string | null;
  fournisseur_id: string | null;
  produit: {
    id: string;
    libelle_produit: string;
    prix_vente_ttc: number | null;
  };
}

export const useDetailBreakdown = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Récupère le produit détail lié au produit source
   */
  const getDetailProduct = async (sourceProductId: string): Promise<DetailProduct | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      const { data: detailProduct, error } = await supabase
        .from('produits')
        .select('id, libelle_produit, quantite_unites_details_source, prix_vente_ttc')
        .eq('id_produit_source', sourceProductId)
        .eq('tenant_id', personnel.tenant_id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Aucun produit détail trouvé
        }
        throw error;
      }

      return detailProduct;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit détail:', error);
      throw error;
    }
  };

  /**
   * Récupère les informations du lot source
   */
  const getLotInfo = async (lotId: string): Promise<LotInfo | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      const { data: lot, error } = await supabase
        .from('lots')
        .select(`
          id,
          numero_lot,
          produit_id,
          quantite_restante,
          date_peremption,
          date_fabrication,
          fournisseur_id,
          produit:produits(id, libelle_produit, prix_vente_ttc)
        `)
        .eq('id', lotId)
        .eq('tenant_id', personnel.tenant_id)
        .single();

      if (error) throw error;
      return lot as LotInfo;
    } catch (error) {
      console.error('Erreur lors de la récupération du lot:', error);
      throw error;
    }
  };

  /**
   * Traite la mise en détail d'un produit
   */
  const processDetailBreakdown = async (
    lotId: string,
    prixVenteTTC: number
  ): Promise<{ success: boolean; message: string }> => {
    setIsProcessing(true);

    try {
      // 1. Récupérer les informations du lot source
      const lotSource = await getLotInfo(lotId);
      if (!lotSource) {
        throw new Error('Lot source non trouvé');
      }

      // 2. Vérifier le stock disponible
      if (lotSource.quantite_restante < 1) {
        throw new Error('Stock insuffisant pour effectuer la mise en détail');
      }

      // 3. Récupérer le produit détail
      const detailProduct = await getDetailProduct(lotSource.produit_id);
      if (!detailProduct) {
        throw new Error('Aucun produit détail configuré pour ce produit');
      }

      if (!detailProduct.quantite_unites_details_source || detailProduct.quantite_unites_details_source <= 0) {
        throw new Error('Quantité des unités détails non configurée');
      }

      // 4. Obtenir le tenant_id
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id, id')
        .eq('auth_user_id', user.user.id)
        .single();

      if (!personnel?.tenant_id) throw new Error('Tenant non trouvé');

      // 5. Générer le numéro de lot détail
      const numeroLotDetail = `${lotSource.numero_lot}-D`;

      // 6. Vérifier si un lot détail existe déjà
      const { data: existingDetailLot, error: searchError } = await supabase
        .from('lots')
        .select('id, quantite_restante')
        .eq('numero_lot', numeroLotDetail)
        .eq('produit_id', detailProduct.id)
        .eq('tenant_id', personnel.tenant_id)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw new Error(`Erreur lors de la recherche du lot détail: ${searchError.message}`);
      }

      // 7. Transaction atomique
      let detailLotId: string;

      if (existingDetailLot) {
        // Lot détail existe - Mettre à jour
        const nouvelleQuantite = existingDetailLot.quantite_restante + detailProduct.quantite_unites_details_source;
        
        const { error: updateError } = await supabase
          .from('lots')
          .update({
            quantite_restante: nouvelleQuantite,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDetailLot.id);

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour du lot détail: ${updateError.message}`);
        }

        detailLotId = existingDetailLot.id;

        // Enregistrer le mouvement d'entrée pour le lot détail
        await StockUpdateService.recordStockMovement({
          produit_id: detailProduct.id,
          lot_id: detailLotId,
          quantite: detailProduct.quantite_unites_details_source,
          type_mouvement: 'entree',
          reference_type: 'mise_en_detail',
          reference_id: lotSource.id,
          agent_id: personnel.id,
          motif: 'Entrée par mise en détail',
          description: `Mise en détail du lot ${lotSource.numero_lot}`,
          metadata: {
            lot_source_id: lotSource.id,
            lot_source_numero: lotSource.numero_lot,
            produit_source_id: lotSource.produit_id
          }
        });

      } else {
        // Créer un nouveau lot détail
        const { data: newLot, error: createError } = await supabase
          .from('lots')
          .insert({
            tenant_id: personnel.tenant_id,
            produit_id: detailProduct.id,
            numero_lot: numeroLotDetail,
            quantite_initiale: detailProduct.quantite_unites_details_source,
            quantite_restante: detailProduct.quantite_unites_details_source,
            date_peremption: lotSource.date_peremption,
            date_fabrication: lotSource.date_fabrication,
            fournisseur_id: lotSource.fournisseur_id
          })
          .select('id')
          .single();

        if (createError) {
          throw new Error(`Erreur lors de la création du lot détail: ${createError.message}`);
        }

        detailLotId = newLot.id;

        // Enregistrer le mouvement d'entrée pour le nouveau lot
        await StockUpdateService.recordStockMovement({
          produit_id: detailProduct.id,
          lot_id: detailLotId,
          quantite: detailProduct.quantite_unites_details_source,
          type_mouvement: 'entree',
          reference_type: 'mise_en_detail',
          reference_id: lotSource.id,
          agent_id: personnel.id,
          motif: 'Entrée par mise en détail',
          description: `Création lot détail depuis ${lotSource.numero_lot}`,
          metadata: {
            lot_source_id: lotSource.id,
            lot_source_numero: lotSource.numero_lot,
            produit_source_id: lotSource.produit_id
          }
        });
      }

      // 8. Enregistrer le mouvement de sortie pour le lot source
      await StockUpdateService.recordStockMovement({
        produit_id: lotSource.produit_id,
        lot_id: lotSource.id,
        quantite: 1,
        type_mouvement: 'sortie',
        reference_type: 'mise_en_detail',
        reference_id: detailLotId,
        agent_id: personnel.id,
        motif: 'Sortie par mise en détail',
        description: `Mise en détail vers lot ${numeroLotDetail}`,
        metadata: {
          lot_detail_id: detailLotId,
          lot_detail_numero: numeroLotDetail,
          produit_detail_id: detailProduct.id,
          quantite_unites_details: detailProduct.quantite_unites_details_source
        }
      });

      // 9. Mettre à jour le prix de vente TTC du produit détail si modifié
      if (prixVenteTTC !== detailProduct.prix_vente_ttc) {
        const { error: priceUpdateError } = await supabase
          .from('produits')
          .update({ prix_vente_ttc: prixVenteTTC })
          .eq('id', detailProduct.id);

        if (priceUpdateError) {
          console.warn('Erreur lors de la mise à jour du prix:', priceUpdateError);
          // Ne pas bloquer le processus pour cette erreur
        }
      }

      toast({
        title: 'Mise en détail réussie',
        description: `${detailProduct.quantite_unites_details_source} unités de "${detailProduct.libelle_produit}" ajoutées au stock (lot ${numeroLotDetail})`,
      });

      return {
        success: true,
        message: `Mise en détail effectuée avec succès. ${detailProduct.quantite_unites_details_source} unités ajoutées.`
      };

    } catch (error: any) {
      console.error('Erreur lors de la mise en détail:', error);
      
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la mise en détail',
        variant: 'destructive',
      });

      return {
        success: false,
        message: error.message || 'Échec de la mise en détail'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    getDetailProduct,
    getLotInfo,
    processDetailBreakdown,
    isProcessing
  };
};
