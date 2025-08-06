import { supabase } from '@/integrations/supabase/client';

export interface StockMovement {
  produit_id: string;
  lot_id?: string;
  quantite: number;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'reception' | 'vente' | 'retour';
  reference_type?: string;
  reference_id?: string;
  agent_id?: string;
  description?: string;
}

export class StockUpdateService {
  /**
   * Enregistre un mouvement de stock et met à jour les quantités
   */
  static async recordStockMovement(movement: StockMovement): Promise<void> {
    try {
      // Enregistrer le mouvement
      const { error: movementError } = await supabase
        .from('stock_mouvements')
        .insert({
          produit_id: movement.produit_id,
          lot_id: movement.lot_id,
          quantite: movement.quantite,
          type_mouvement: movement.type_mouvement,
          reference_type: movement.reference_type,
          reference_id: movement.reference_id,
          agent_id: movement.agent_id,
          date_mouvement: new Date().toISOString()
        });

      if (movementError) throw movementError;

      // Mettre à jour les quantités des lots si lot_id est spécifié
      if (movement.lot_id) {
        await this.updateLotQuantity(movement.lot_id, movement.quantite, movement.type_mouvement);
      }

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement de stock:', error);
      throw error;
    }
  }

  /**
   * Met à jour la quantité d'un lot
   */
  private static async updateLotQuantity(
    lotId: string, 
    quantite: number, 
    typeMovement: string
  ): Promise<void> {
    try {
      // Récupérer le lot actuel
      const { data: lot, error: fetchError } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('id', lotId)
        .single();

      if (fetchError) throw fetchError;
      if (!lot) throw new Error('Lot non trouvé');

      // Calculer la nouvelle quantité
      let nouvelleQuantite: number;
      switch (typeMovement) {
        case 'entree':
        case 'reception':
        case 'retour':
        case 'ajustement':
          nouvelleQuantite = lot.quantite_restante + Math.abs(quantite);
          break;
        case 'sortie':
        case 'vente':
          nouvelleQuantite = lot.quantite_restante - Math.abs(quantite);
          break;
        default:
          throw new Error(`Type de mouvement non supporté: ${typeMovement}`);
      }

      // Vérifier que la quantité ne devient pas négative
      if (nouvelleQuantite < 0) {
        throw new Error('Quantité insuffisante en stock');
      }

      // Mettre à jour le lot
      const { error: updateError } = await supabase
        .from('lots')
        .update({ quantite_restante: nouvelleQuantite })
        .eq('id', lotId);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité du lot:', error);
      throw error;
    }
  }

  /**
   * Traite la réception d'une commande
   */
  static async processReception(receptionData: {
    commande_id?: string;
    fournisseur_id: string;
    lignes: Array<{
      produit_id: string;
      quantite_acceptee: number;
      numero_lot: string;
      date_expiration?: string;
      prix_achat_unitaire?: number;
    }>;
    agent_id?: string;
  }): Promise<void> {
    try {
      for (const ligne of receptionData.lignes) {
        if (ligne.quantite_acceptee > 0) {
          // Créer le lot
          const { data: lot, error: lotError } = await supabase
            .from('lots')
            .insert({
              produit_id: ligne.produit_id,
              numero_lot: ligne.numero_lot,
              date_peremption: ligne.date_expiration,
              quantite_initiale: ligne.quantite_acceptee,
              quantite_restante: ligne.quantite_acceptee,
              prix_achat_unitaire: ligne.prix_achat_unitaire || 0,
              fournisseur_id: receptionData.fournisseur_id,
              date_reception: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

          if (lotError) throw lotError;

          // Enregistrer le mouvement de stock
          await this.recordStockMovement({
            produit_id: ligne.produit_id,
            lot_id: lot.id,
            quantite: ligne.quantite_acceptee,
            type_mouvement: 'reception',
            reference_type: 'commande',
            reference_id: receptionData.commande_id,
            agent_id: receptionData.agent_id,
            description: `Réception lot ${ligne.numero_lot}`
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la réception:', error);
      throw error;
    }
  }

  /**
   * Traite une vente et met à jour les stocks
   */
  static async processSale(venteLignes: Array<{
    produit_id: string;
    quantite: number;
    lot_id?: string;
  }>, vente_id: string, agent_id?: string): Promise<void> {
    try {
      for (const ligne of venteLignes) {
        let lotId = ligne.lot_id;

        // Si pas de lot spécifié, utiliser FIFO
        if (!lotId) {
          lotId = await this.findOldestLotWithStock(ligne.produit_id, ligne.quantite);
        }

        if (!lotId) {
          throw new Error(`Stock insuffisant pour le produit ${ligne.produit_id}`);
        }

        // Enregistrer le mouvement de sortie
        await this.recordStockMovement({
          produit_id: ligne.produit_id,
          lot_id: lotId,
          quantite: ligne.quantite,
          type_mouvement: 'vente',
          reference_type: 'vente',
          reference_id: vente_id,
          agent_id: agent_id,
          description: `Vente - Sortie de stock`
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la vente:', error);
      throw error;
    }
  }

  /**
   * Trouve le lot le plus ancien avec du stock disponible (FIFO)
   */
  private static async findOldestLotWithStock(
    produitId: string, 
    quantiteNecessaire: number
  ): Promise<string | null> {
    try {
      const { data: lots, error } = await supabase
        .from('lots')
        .select('id, quantite_restante')
        .eq('produit_id', produitId)
        .gt('quantite_restante', 0)
        .order('date_reception')
        .order('created_at');

      if (error) throw error;
      if (!lots || lots.length === 0) return null;

      // Vérifier s'il y a assez de stock dans le lot le plus ancien
      const oldestLot = lots[0];
      if (oldestLot.quantite_restante >= quantiteNecessaire) {
        return oldestLot.id;
      }

      // Si pas assez dans un seul lot, on pourrait implémenter 
      // une logique pour répartir sur plusieurs lots
      // Pour l'instant, on retourne null
      return null;

    } catch (error) {
      console.error('Erreur lors de la recherche du lot FIFO:', error);
      return null;
    }
  }

  /**
   * Calcule le stock disponible total pour un produit
   */
  static async calculateAvailableStock(produitId: string): Promise<number> {
    try {
      const { data: lots, error } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('produit_id', produitId)
        .gt('quantite_restante', 0);

      if (error) throw error;
      if (!lots) return 0;

      return lots.reduce((total, lot) => total + lot.quantite_restante, 0);
    } catch (error) {
      console.error('Erreur lors du calcul du stock disponible:', error);
      return 0;
    }
  }
}