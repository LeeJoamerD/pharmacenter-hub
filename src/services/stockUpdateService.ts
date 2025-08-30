import { supabase } from '@/integrations/supabase/client';
import { StockSettings } from '@/hooks/useStockSettings';

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
   * Get current user's tenant_id
   */
  private static async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: personnel } = await supabase
        .from('personnel')
        .select('tenant_id')
        .eq('auth_user_id', user.user.id)
        .single();

      return personnel?.tenant_id || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du tenant_id:', error);
      return null;
    }
  }

  /**
   * Enregistre un mouvement de stock et met à jour les quantités
   */
  static async recordStockMovement(movement: StockMovement, settings?: StockSettings): Promise<void> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      // Check negative stock allowance before processing outbound movements
      if (movement.type_mouvement === 'sortie' || movement.type_mouvement === 'vente') {
        const currentStock = await this.calculateAvailableStock(movement.produit_id);
        const newStock = currentStock - Math.abs(movement.quantite);
        
        if (newStock < 0 && settings && !settings.allow_negative_stock) {
          throw new Error(`Stock insuffisant. Stock actuel: ${currentStock}, Quantité demandée: ${Math.abs(movement.quantite)}`);
        }
      }

      // Auto-generate lot if required and not provided
      if (settings?.require_lot_numbers && !movement.lot_id && 
          (movement.type_mouvement === 'entree' || movement.type_mouvement === 'reception')) {
        if (settings.auto_generate_lots) {
          movement.lot_id = await this.generateLotNumber(movement.produit_id, tenantId);
        } else {
          throw new Error('Numéro de lot requis pour ce produit');
        }
      }

      // Enregistrer le mouvement
      const { error: movementError } = await supabase
        .from('stock_mouvements')
        .insert({
          tenant_id: tenantId,
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
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      for (const ligne of receptionData.lignes) {
        if (ligne.quantite_acceptee > 0) {
          // Créer le lot
          const { data: lot, error: lotError } = await supabase
            .from('lots')
            .insert({
              tenant_id: tenantId,
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

  /**
   * Generate automatic lot number
   */
  private static async generateLotNumber(produitId: string, tenantId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get product code for lot generation
    const { data: product } = await supabase
      .from('produits')
      .select('code_cip')
      .eq('id', produitId)
      .single();

    const productCode = product?.code_cip?.slice(0, 4) || 'PROD';
    
    // Find next sequence number for today
    const { data: existingLots } = await supabase
      .from('lots')
      .select('numero_lot')
      .eq('tenant_id', tenantId)
      .like('numero_lot', `${productCode}-${dateStr}-%`);

    const sequenceNumber = (existingLots?.length || 0) + 1;
    return `${productCode}-${dateStr}-${sequenceNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Check if product requires lot tracking
   */
  static async requiresLotTracking(produitId: string, settings: StockSettings): Promise<boolean> {
    if (!settings.require_lot_numbers) return false;

    // Could be enhanced to check product-specific requirements
    return true;
  }

  /**
   * Validate stock movement against business rules
   */
  static async validateMovement(movement: StockMovement, settings: StockSettings): Promise<string[]> {
    const errors: string[] = [];

    // Check lot requirements
    if (settings.require_lot_numbers && !movement.lot_id && 
        (movement.type_mouvement === 'entree' || movement.type_mouvement === 'reception')) {
      if (!settings.auto_generate_lots) {
        errors.push('Numéro de lot requis pour ce type de mouvement');
      }
    }

    // Check negative stock allowance
    if (movement.type_mouvement === 'sortie' || movement.type_mouvement === 'vente') {
      const currentStock = await this.calculateAvailableStock(movement.produit_id);
      const newStock = currentStock - Math.abs(movement.quantite);
      
      if (newStock < 0 && !settings.allow_negative_stock) {
        errors.push(`Stock insuffisant. Disponible: ${currentStock}, Demandé: ${Math.abs(movement.quantite)}`);
      }
    }

    return errors;
  }
}