import { supabase } from '@/integrations/supabase/client';
import { StockSettings } from '@/hooks/useStockSettings';

export interface StockMovement {
  produit_id: string;
  lot_id?: string;
  quantite: number;
  type_mouvement: 'entree' | 'sortie' | 'ajustement' | 'vente' | 'retour' | 'destruction' | 'transfert';
  reference_type?: string;
  reference_id?: string;
  agent_id?: string;
  description?: string;
  motif?: string;
  emplacement_source?: string;
  emplacement_destination?: string;
  lot_destination_id?: string;
  metadata?: Record<string, any>;
  quantite_reelle?: number; // Pour les ajustements
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
   * Enregistre un mouvement de stock de manière atomique via RPC
   */
  static async recordStockMovement(movement: StockMovement, settings?: StockSettings): Promise<void> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      // Auto-generate lot if required and not provided
      if (settings?.requireLotNumbers && !movement.lot_id && 
          movement.type_mouvement === 'entree') {
        if (settings.auto_generate_lots) {
          movement.lot_id = await this.generateLotNumber(movement.produit_id, tenantId);
        } else {
          throw new Error('Numéro de lot requis pour ce produit');
        }
      }

      // Assurer qu'on a un lot_id pour tous les mouvements
      if (!movement.lot_id) {
        throw new Error('ID de lot requis pour enregistrer un mouvement');
      }

      // Utiliser la fonction RPC atomique
      const { data, error } = await supabase.rpc('rpc_stock_record_movement', {
        p_lot_id: movement.lot_id,
        p_produit_id: movement.produit_id,
        p_type_mouvement: movement.type_mouvement,
        p_quantite_mouvement: Math.abs(movement.quantite),
        p_motif: movement.motif || movement.description,
        p_reference_document: movement.reference_id,
        p_reference_type: movement.reference_type,
        p_agent_id: movement.agent_id,
        p_emplacement_source: movement.emplacement_source,
        p_emplacement_destination: movement.emplacement_destination,
        p_lot_destination_id: movement.lot_destination_id,
        p_metadata: movement.metadata || {},
        p_quantite_reelle: movement.quantite_reelle
      });

      if (error) {
        console.error('Erreur RPC:', error);
        throw new Error(error.message);
      }

      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement du mouvement');
      }

      console.log('Mouvement enregistré:', data);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement de stock:', error);
      throw error;
    }
  }

  /**
   * Met à jour un mouvement existant via RPC
   */
  static async updateStockMovement(
    movementId: string,
    updates: {
      quantite_mouvement?: number;
      motif?: string;
      reference_document?: string;
      metadata?: Record<string, any>;
      quantite_reelle?: number;
    }
  ): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('rpc_stock_update_movement', {
        p_movement_id: movementId,
        p_new_quantite_mouvement: updates.quantite_mouvement,
        p_new_motif: updates.motif,
        p_new_reference_document: updates.reference_document,
        p_new_metadata: updates.metadata,
        p_new_quantite_reelle: updates.quantite_reelle
      });

      if (error) {
        console.error('Erreur RPC update:', error);
        throw new Error(error.message);
      }

      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour du mouvement');
      }

      console.log('Mouvement mis à jour:', data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mouvement:', error);
      throw error;
    }
  }

  /**
   * Supprime un mouvement et annule son effet via RPC
   */
  static async deleteStockMovement(movementId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('rpc_stock_delete_movement', {
        p_movement_id: movementId
      });

      if (error) {
        console.error('Erreur RPC delete:', error);
        throw new Error(error.message);
      }

      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression du mouvement');
      }

      console.log('Mouvement supprimé:', data);
    } catch (error) {
      console.error('Erreur lors de la suppression du mouvement:', error);
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
            type_mouvement: 'entree', // Utiliser 'entree' au lieu de 'reception'
            reference_type: 'commande',
            reference_id: receptionData.commande_id,
            agent_id: receptionData.agent_id,
            description: `Réception lot ${ligne.numero_lot}`,
            motif: `Réception fournisseur`
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
          type_mouvement: 'sortie', // Utiliser 'sortie' au lieu de 'vente'
          reference_type: 'vente',
          reference_id: vente_id,
          agent_id: agent_id,
          description: `Vente - Sortie de stock`,
          motif: `Vente produit`
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
    if (!settings.requireLotNumbers) return false;

    // Could be enhanced to check product-specific requirements
    return true;
  }

  /**
   * Validate stock movement against business rules
   */
  static async validateMovement(movement: StockMovement, settings: StockSettings): Promise<string[]> {
    const errors: string[] = [];

    // Check lot requirements
    if (settings.requireLotNumbers && !movement.lot_id && 
        movement.type_mouvement === 'entree') {
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