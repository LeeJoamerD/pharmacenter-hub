import { supabase } from '@/integrations/supabase/client';
import { StockUpdateService } from './stockUpdateService';
import { toast } from '@/hooks/use-toast';

export interface StockAlert {
  id: string;
  tenant_id: string;
  produit_id: string;
  type_alerte: 'rupture' | 'stock_faible' | 'peremption_proche';
  niveau_urgence: 'faible' | 'moyen' | 'eleve' | 'critique';
  quantite_actuelle: number;
  quantite_minimale: number;
  message: string;
  suggestions: string[];
  created_at: string;
}

export interface SupplyNeed {
  produit_id: string;
  nom_produit: string;
  quantite_actuelle: number;
  quantite_minimale: number;
  quantite_recommandee: number;
  fournisseur_principal: string;
  delai_livraison: number;
  prix_unitaire_moyen: number;
  urgence: 'faible' | 'moyenne' | 'haute' | 'critique';
}

export class SupplyChainAutomationService {
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

  // Génération automatique des bons de commande
  static async generatePurchaseOrder(supplierId: string, products: Array<{
    produit_id: string;
    quantite: number;
    prix_unitaire_attendu?: number;
  }>): Promise<{ orderId: string | null; success: boolean }> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) throw new Error('Utilisateur non autorisé');

      const { data: commande, error: commandeError } = await supabase
        .from('commandes_fournisseurs')
        .insert({
          tenant_id: tenantId,
          fournisseur_id: supplierId,
          statut: 'En cours'
        })
        .select()
        .single();

      if (commandeError) throw commandeError;

      const lignesCommande = products.map(product => ({
        tenant_id: tenantId,
        commande_id: commande.id,
        produit_id: product.produit_id,
        quantite_commandee: product.quantite,
        prix_achat_unitaire_attendu: product.prix_unitaire_attendu
      }));

      const { error: lignesError } = await supabase
        .from('lignes_commande_fournisseur')
        .insert(lignesCommande);

      if (lignesError) throw lignesError;

      toast({
        title: "Commande générée",
        description: `Bon de commande créé automatiquement`
      });

      return { orderId: commande.id, success: true };
    } catch (error) {
      console.error('Erreur lors de la génération du bon de commande:', error);
      return { orderId: null, success: false };
    }
  }

  // Alertes de rupture de stock (données simulées)
  static async generateStockAlerts(): Promise<StockAlert[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    // Simulation d'alertes
    return [
      {
        id: 'alert1',
        tenant_id: tenantId,
        produit_id: 'prod1',
        type_alerte: 'rupture',
        niveau_urgence: 'critique',
        quantite_actuelle: 0,
        quantite_minimale: 10,
        message: 'Rupture de stock pour Paracétamol 500mg',
        suggestions: ['Commande urgente recommandée'],
        created_at: new Date().toISOString()
      }
    ];
  }

  // Calculs automatiques de besoins (données simulées)
  static async calculateSupplyNeeds(): Promise<SupplyNeed[]> {
    return [
      {
        produit_id: 'prod1',
        nom_produit: 'Paracétamol 500mg',
        quantite_actuelle: 5,
        quantite_minimale: 20,
        quantite_recommandee: 100,
        fournisseur_principal: 'Laboratoire Alpha',
        delai_livraison: 7,
        prix_unitaire_moyen: 250,
        urgence: 'haute'
      }
    ];
  }

  static async processAutomaticReception(receptionData: any): Promise<{ success: boolean; alerts: StockAlert[] }> {
    try {
      await StockUpdateService.processReception(receptionData);
      const alerts = await this.generateStockAlerts();
      
      toast({
        title: "Réception traitée",
        description: "Stocks mis à jour automatiquement"
      });

      return { success: true, alerts };
    } catch (error) {
      console.error('Erreur:', error);
      return { success: false, alerts: [] };
    }
  }

  static async updateOrderStatus(orderId: string, newStatus: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('commandes_fournisseurs')
        .update({ statut: newStatus })
        .eq('id', orderId);

      return !error;
    } catch (error) {
      return false;
    }
  }

  static async checkLateDeliveries(): Promise<Array<{ orderId: string; daysLate: number; supplierName: string }>> {
    return []; // Simulation
  }
}