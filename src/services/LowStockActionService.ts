import { supabase } from '@/integrations/supabase/client';
import { LowStockItem } from '@/hooks/useLowStockData';
import { StockAlert } from '@/hooks/useStockAlerts';

export interface OrderAction {
  produit_id: string;
  quantite_recommandee: number;
  fournisseur_id?: string;
  urgence: 'normale' | 'elevee' | 'critique';
  prix_estime?: number;
}

export interface AlertAction {
  produit_id: string;
  type_alerte: 'stock_faible' | 'critique' | 'rupture';
  niveau_urgence: 'faible' | 'moyen' | 'eleve' | 'critique';
  notifications: ('email' | 'dashboard' | 'sms')[];
  destinataires?: string[];
}

export class LowStockActionService {
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
   * Calculate recommended order quantities for low stock items
   */
  static calculateOrderRecommendations(items: LowStockItem[]): OrderAction[] {
    return items.map(item => {
      // Calculate recommended quantity based on stock level and rotation
      let multiplier = 2; // Default: order 2x minimum stock
      
      // Adjust based on urgency
      if (item.statut === 'critique') {
        multiplier = 3; // More aggressive for critical items
      } else if (item.statut === 'attention') {
        multiplier = 1.5; // Less aggressive for attention items
      }

      // Adjust based on rotation speed
      if (item.rotation === 'rapide') {
        multiplier *= 1.5; // Fast-moving items need more stock
      } else if (item.rotation === 'lente') {
        multiplier *= 0.8; // Slow-moving items need less stock
      }

      const quantiteRecommandee = Math.ceil(
        Math.max(
          item.seuilOptimal - item.quantiteActuelle, // Reach optimal level
          item.seuilMinimum * multiplier - item.quantiteActuelle // Or multiplier of minimum
        )
      );

      return {
        produit_id: item.id,
        quantite_recommandee: Math.max(quantiteRecommandee, 1), // At least 1
        urgence: item.statut === 'critique' ? 'critique' : 
                item.statut === 'faible' ? 'elevee' : 'normale',
        prix_estime: item.prixUnitaire
      };
    });
  }

  /**
   * Generate alerts for low stock items
   */
  static generateAlertRecommendations(items: LowStockItem[]): AlertAction[] {
    return items.map(item => {
      let typeAlerte: AlertAction['type_alerte'] = 'stock_faible';
      let niveauUrgence: AlertAction['niveau_urgence'] = 'moyen';
      let notifications: AlertAction['notifications'] = ['dashboard'];

      // Determine alert type and urgency
      if (item.quantiteActuelle === 0) {
        typeAlerte = 'rupture';
        niveauUrgence = 'critique';
        notifications = ['email', 'dashboard', 'sms'];
      } else if (item.statut === 'critique') {
        typeAlerte = 'critique';
        niveauUrgence = 'critique';
        notifications = ['email', 'dashboard'];
      } else if (item.statut === 'faible') {
        typeAlerte = 'stock_faible';
        niveauUrgence = 'eleve';
        notifications = ['dashboard', 'email'];
      } else {
        niveauUrgence = 'moyen';
        notifications = ['dashboard'];
      }

      return {
        produit_id: item.id,
        type_alerte: typeAlerte,
        niveau_urgence: niveauUrgence,
        notifications
      };
    });
  }

  /**
   * Execute order action for specific items
   */
  static async executeOrderAction(
    items: LowStockItem[],
    selectedItems: string[] = [],
    options: {
      fournisseur_id?: string;
      date_livraison_souhaitee?: string;
      notes?: string;
    } = {}
  ): Promise<{success: boolean; commande_id?: string; error?: string}> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) {
      await this.logAction(null, 'order_creation', 'failed', null, {
        error: 'Utilisateur non authentifié'
      });
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    try {
      // Filter items to process
      const itemsToOrder = selectedItems.length > 0 
        ? items.filter(item => selectedItems.includes(item.id))
        : items.filter(item => item.statut === 'critique');

      if (itemsToOrder.length === 0) {
        throw new Error('Aucun produit sélectionné pour la commande');
      }

      // Get order recommendations
      const recommendations = this.calculateOrderRecommendations(itemsToOrder);

      // Find active supplier - use explicit any to avoid deep type inference
      let fournisseurId = options.fournisseur_id;
      if (!fournisseurId) {
        try {
          // @ts-ignore - Avoid deep type instantiation issues
          const queryResult = await supabase
            .from('fournisseurs')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('is_active', true)
            .limit(1);

          const data: any = queryResult.data;
          const error: any = queryResult.error;

          if (error || !data || data.length === 0) {
            throw new Error('Aucun fournisseur actif disponible');
          }
          fournisseurId = data[0].id;
        } catch (e) {
          throw new Error('Aucun fournisseur actif disponible');
        }
      }

      // Calculate totals
      const totalHT = recommendations.reduce(
        (sum, rec) => sum + (rec.quantite_recommandee * (rec.prix_estime || 0)),
        0
      );
      const totalTTC = totalHT * 1.18;

      // Create order
      const numeroCommande = `URG-${Date.now()}`;
      const { data: commande, error: commandeError }: any = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: tenantId,
          numero_commande: numeroCommande,
          fournisseur_id: fournisseurId,
          statut: 'en_attente',
          date_commande: new Date().toISOString().split('T')[0],
          date_livraison_prevue: options.date_livraison_souhaitee || 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_ht: totalHT,
          total_ttc: totalTTC,
          notes: `${options.notes || ''}\nCommande urgente pour ${itemsToOrder.length} produit(s)`
        })
        .select()
        .single();

      if (commandeError) throw commandeError;

      // Create order lines
      const lignesCommande = recommendations.map(rec => ({
        tenant_id: tenantId,
        commande_id: commande.id,
        produit_id: rec.produit_id,
        quantite_commandee: rec.quantite_recommandee,
        prix_achat_unitaire_attendu: rec.prix_estime || 0
      }));

      const { error: lignesError }: any = await supabase
        .from('lignes_commande_fournisseur')
        .insert(lignesCommande);

      if (lignesError) throw lignesError;

      // Log action for each product
      for (const item of itemsToOrder) {
        await this.logAction(
          tenantId,
          'order_creation',
          'success',
          item.id,
          {
            commande_id: commande.id,
            numero_commande: numeroCommande,
            quantite_commandee: recommendations.find(r => r.produit_id === item.id)?.quantite_recommandee,
            urgence: item.statut
          }
        );
      }

      return {
        success: true,
        commande_id: commande.id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Log failed action
      for (const item of (selectedItems.length > 0 ? selectedItems : items.map(i => i.id))) {
        await this.logAction(tenantId, 'order_creation', 'failed', item, {
          error: errorMessage
        });
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute alert action for specific items
   */
  static async executeAlertAction(
    items: LowStockItem[],
    selectedItems: string[] = [],
    options: {
      custom_message?: string;
      force_notifications?: ('email' | 'dashboard' | 'sms')[];
    } = {}
  ): Promise<{success: boolean; alerts_created: number; error?: string}> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) {
      await this.logAction(null, 'alert_creation', 'failed', null, {
        error: 'Utilisateur non authentifié'
      });
      return { success: false, alerts_created: 0, error: 'Utilisateur non authentifié' };
    }

    try {
      // Filter items to alert
      const itemsToAlert = selectedItems.length > 0 
        ? items.filter(item => selectedItems.includes(item.id))
        : items.filter(item => item.statut === 'critique' || item.statut === 'faible');

      if (itemsToAlert.length === 0) {
        throw new Error('Aucun produit sélectionné pour les alertes');
      }

      // Generate alert recommendations
      const recommendations = this.generateAlertRecommendations(itemsToAlert);
      let alertsCreated = 0;

      // Create alerts
      for (const rec of recommendations) {
        const item = items.find(i => i.id === rec.produit_id);
        if (!item) continue;

        // Try to get a lot for this product
        const { data: lots }: any = await supabase
          .from('lots')
          .select('id')
          .eq('produit_id', rec.produit_id)
          .eq('tenant_id', tenantId)
          .gt('quantite_restante', 0)
          .limit(1);

        let lotId = lots?.[0]?.id;

        // If no lot exists, skip (alertes_peremption requires lot_id)
        if (!lotId) {
          console.warn(`No lot found for product ${rec.produit_id}, skipping alert`);
          await this.logAction(tenantId, 'alert_creation', 'skipped', rec.produit_id, {
            reason: 'Aucun lot disponible',
            message: options.custom_message
          });
          continue;
        }

        const { error } = await supabase
          .from('alertes_peremption')
          .insert({
            lot_id: lotId,
            produit_id: rec.produit_id,
            type_alerte: rec.type_alerte,
            niveau_urgence: rec.niveau_urgence,
            quantite_concernee: item.quantiteActuelle,
            statut: 'active',
            date_alerte: new Date().toISOString(),
            actions_recommandees: [
              'Vérifier les niveaux de stock',
              'Contacter le fournisseur',
              'Planifier une commande de réapprovisionnement'
            ],
            notes: options.custom_message || 
              `Alerte - ${item.nomProduit} (${item.quantiteActuelle} unités)`
          } as any);

        if (!error) {
          alertsCreated++;
          await this.logAction(tenantId, 'alert_creation', 'success', rec.produit_id, {
            type_alerte: rec.type_alerte,
            niveau_urgence: rec.niveau_urgence,
            notifications: rec.notifications
          });
        } else {
          await this.logAction(tenantId, 'alert_creation', 'failed', rec.produit_id, {
            error: error.message
          });
        }
      }

      return {
        success: alertsCreated > 0,
        alerts_created: alertsCreated
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      for (const item of (selectedItems.length > 0 ? selectedItems : items.map(i => i.id))) {
        await this.logAction(tenantId, 'alert_creation', 'failed', item, {
          error: errorMessage
        });
      }

      return {
        success: false,
        alerts_created: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Log action to low_stock_actions_log table
   */
  private static async logAction(
    tenantId: string | null,
    actionType: string,
    status: string,
    produitId: string | null,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!tenantId) return;

    try {
      await supabase
        .from('low_stock_actions_log')
        .insert({
          tenant_id: tenantId,
          produit_id: produitId,
          action_type: actionType,
          result_status: status,
          executed_at: new Date().toISOString(),
          result_data: metadata
        });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  /**
   * Get action recommendations for dashboard
   */
  static getActionRecommendations(items: LowStockItem[]) {
    const criticalItems = items.filter(item => item.statut === 'critique');
    const lowItems = items.filter(item => item.statut === 'faible');
    const attentionItems = items.filter(item => item.statut === 'attention');

    const recommendations = [];

    if (criticalItems.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'urgent_order',
        title: 'Commande d\'urgence requise',
        description: `${criticalItems.length} produit(s) en stock critique nécessitent une commande immédiate`,
        items: criticalItems.length,
        icon: 'ShoppingCart'
      });
    }

    if (lowItems.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'schedule_order',
        title: 'Planifier une commande',
        description: `${lowItems.length} produit(s) à réapprovisionner prochainement`,
        items: lowItems.length,
        icon: 'Calendar'
      });
    }

    if (attentionItems.length > 0) {
      recommendations.push({
        priority: 'low',
        action: 'monitor',
        title: 'Surveillance recommandée',
        description: `${attentionItems.length} produit(s) à surveiller de près`,
        items: attentionItems.length,
        icon: 'Eye'
      });
    }

    return recommendations;
  }
}
