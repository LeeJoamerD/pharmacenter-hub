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
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Utilisateur non autorisé');
    }

    try {
      // Validation before processing
      if (settings) {
        const validationErrors = await this.validateMovement(movement, settings);
        if (validationErrors.length > 0) {
          throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
        }
      }

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

      console.log('✅ Mouvement enregistré avec succès:', {
        type: movement.type_mouvement,
        produit: movement.produit_id,
        quantite: movement.quantite
      });

    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du mouvement:', error);
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
   * Traite la réception d'une commande de manière atomique via RPC
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

      // 1. Créer d'abord un enregistrement de réception
      const { data: reception, error: receptionError } = await supabase
        .from('receptions_fournisseurs')
        .insert({
          tenant_id: tenantId,
          commande_id: receptionData.commande_id,
          fournisseur_id: receptionData.fournisseur_id,
          date_reception: new Date().toISOString(),
          agent_id: receptionData.agent_id
        })
        .select('id')
        .single();

      if (receptionError) {
        throw new Error(`Erreur lors de la création de la réception: ${receptionError.message}`);
      }

      const receptionId = reception.id;

      for (const ligne of receptionData.lignes) {
        if (ligne.quantite_acceptee > 0) {
          // Utiliser la nouvelle fonction RPC qui gère la logique de manière atomique
          const receptionLineData = {
            tenant_id: tenantId,
            product_id: ligne.produit_id,
            numero_lot: ligne.numero_lot,
            quantite_recue: ligne.quantite_acceptee,
            date_fabrication: null, // Peut être ajouté plus tard si nécessaire
            date_peremption: ligne.date_expiration,
            prix_achat: ligne.prix_achat_unitaire || 0,
            reception_id: receptionId, // Utiliser le vrai reception_id
            id: null // Sera généré automatiquement
          };

          // Traitement direct sans RPC - Gestion des lots et mouvements de stock
          try {
            let lotId: string | null = null;

            // 1. Vérifier si un lot existe déjà avec ce numéro
            const { data: existingLot, error: lotSearchError } = await supabase
              .from('lots')
              .select('id, quantite_restante')
              .eq('numero_lot', receptionLineData.numero_lot)
              .eq('produit_id', receptionLineData.product_id)
              .eq('tenant_id', receptionLineData.tenant_id)
              .single();

            if (lotSearchError && lotSearchError.code !== 'PGRST116') {
              throw new Error(`Erreur lors de la recherche du lot: ${lotSearchError.message}`);
            }

            if (existingLot) {
              // 2a. Mettre à jour le lot existant
              lotId = existingLot.id;
              const { error: updateError } = await supabase
                .from('lots')
                .update({
                  quantite_restante: existingLot.quantite_restante + receptionLineData.quantite_recue,
                  updated_at: new Date().toISOString()
                })
                .eq('id', lotId);

              if (updateError) {
                throw new Error(`Erreur lors de la mise à jour du lot: ${updateError.message}`);
              }
            } else {
              // 2b. Créer un nouveau lot
              const { data: newLot, error: createLotError } = await supabase
                .from('lots')
                .insert({
                  tenant_id: receptionLineData.tenant_id,
                  produit_id: receptionLineData.product_id,
                  numero_lot: receptionLineData.numero_lot,
                  quantite_initiale: receptionLineData.quantite_recue,
                  quantite_restante: receptionLineData.quantite_recue,
                  date_fabrication: receptionLineData.date_fabrication,
                  date_peremption: receptionLineData.date_peremption
                })
                .select('id')
                .single();

              if (createLotError) {
                throw new Error(`Erreur lors de la création du lot: ${createLotError.message}`);
              }
              lotId = newLot.id;
            }

            // 3. Créer une ligne de réception
            const { error: receptionLineError } = await supabase
              .from('lignes_reception_fournisseur')
              .insert({
                tenant_id: receptionLineData.tenant_id,
                reception_id: receptionLineData.reception_id,
                produit_id: receptionLineData.product_id,
                lot_id: lotId,
                quantite_recue: receptionLineData.quantite_recue,
                prix_achat_unitaire_reel: receptionLineData.prix_achat,
                date_peremption: receptionLineData.date_peremption
              });

            if (receptionLineError) {
              throw new Error(`Erreur lors de la création de la ligne de réception: ${receptionLineError.message}`);
            }

            // 4. Créer un mouvement de stock
            const { error: movementError } = await supabase
              .from('stock_mouvements')
              .insert({
                tenant_id: receptionLineData.tenant_id,
                produit_id: receptionLineData.product_id,
                lot_id: lotId,
                type_mouvement: 'entree',
                quantite: receptionLineData.quantite_recue,
                date_mouvement: new Date().toISOString(),
                reference_type: 'reception',
                reference_id: receptionLineData.reception_id
              });

            if (movementError) {
              throw new Error(`Erreur lors de la création du mouvement de stock: ${movementError.message}`);
            }

            console.log(`✅ Lot ${ligne.numero_lot} traité avec succès`);

          } catch (error: any) {
            console.error(`Erreur lors du traitement du lot ${ligne.numero_lot}:`, error);
            throw new Error(`Le traitement du lot ${ligne.numero_lot} a échoué: ${error.message}`);
          }
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
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      const { data: lots, error } = await supabase
        .from('lots')
        .select('id, quantite_restante')
        .eq('tenant_id', tenantId)
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
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) {
        console.error('Tenant ID non trouvé pour le calcul du stock');
        return 0;
      }

      const { data: lots, error } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('tenant_id', tenantId)
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