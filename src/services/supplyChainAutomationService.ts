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

  // Alertes de rupture de stock basées sur les données réelles
  static async generateStockAlerts(): Promise<StockAlert[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    try {
      const { data: produits } = await supabase
        .from('produits_with_stock')
        .select('id, nom, stock_actuel, stock_critique, stock_faible')
        .eq('tenant_id', tenantId);

      if (!produits || produits.length === 0) return [];

      const alerts: StockAlert[] = [];

      produits.forEach(p => {
        const stockActuel = p.stock_actuel || 0;
        const stockCritique = p.stock_critique || 0;
        const stockFaible = p.stock_faible || 0;

        if (stockActuel <= 0 && stockCritique > 0) {
          alerts.push({
            id: `alert-rupture-${p.id}`,
            tenant_id: tenantId,
            produit_id: p.id,
            type_alerte: 'rupture',
            niveau_urgence: 'critique',
            quantite_actuelle: stockActuel,
            quantite_minimale: stockCritique,
            message: `Rupture de stock pour ${p.nom}`,
            suggestions: ['Commande urgente recommandée'],
            created_at: new Date().toISOString()
          });
        } else if (stockActuel > 0 && stockActuel <= stockCritique) {
          alerts.push({
            id: `alert-critique-${p.id}`,
            tenant_id: tenantId,
            produit_id: p.id,
            type_alerte: 'stock_faible',
            niveau_urgence: 'eleve',
            quantite_actuelle: stockActuel,
            quantite_minimale: stockCritique,
            message: `Stock critique pour ${p.nom} (${stockActuel} restant)`,
            suggestions: ['Planifier un réapprovisionnement'],
            created_at: new Date().toISOString()
          });
        } else if (stockActuel > stockCritique && stockActuel <= stockFaible) {
          alerts.push({
            id: `alert-faible-${p.id}`,
            tenant_id: tenantId,
            produit_id: p.id,
            type_alerte: 'stock_faible',
            niveau_urgence: 'moyen',
            quantite_actuelle: stockActuel,
            quantite_minimale: stockFaible,
            message: `Stock faible pour ${p.nom} (${stockActuel} restant)`,
            suggestions: ['Surveiller les ventes', 'Prévoir une commande'],
            created_at: new Date().toISOString()
          });
        }
      });

      // Trier par urgence
      const urgenceOrder = { critique: 0, eleve: 1, moyen: 2, faible: 3 };
      alerts.sort((a, b) => urgenceOrder[a.niveau_urgence] - urgenceOrder[b.niveau_urgence]);

      return alerts;
    } catch (error) {
      console.error('Erreur generateStockAlerts:', error);
      return [];
    }
  }

  // Calculs automatiques de besoins basés sur les données réelles
  static async calculateSupplyNeeds(): Promise<SupplyNeed[]> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    try {
      // Produits en stock critique ou en rupture
      const { data: produits } = await supabase
        .from('produits_with_stock')
        .select('id, nom, stock_actuel, stock_critique, stock_faible, prix_achat')
        .eq('tenant_id', tenantId);

      if (!produits) return [];

      const produitsEnBesoin = produits.filter(p => {
        const stock = p.stock_actuel || 0;
        const seuil = p.stock_faible || p.stock_critique || 0;
        return stock <= seuil && seuil > 0;
      });

      if (produitsEnBesoin.length === 0) return [];

      // Trouver le fournisseur principal par produit (celui avec le plus de commandes)
      const { data: lignesCmd } = await supabase
        .from('lignes_commande_fournisseur')
        .select('produit_id, commande_id, prix_achat_unitaire_attendu')
        .eq('tenant_id', tenantId)
        .in('produit_id', produitsEnBesoin.map(p => p.id));

      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('id, fournisseur_id')
        .eq('tenant_id', tenantId);

      const { data: fournisseurs } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId);

      return produitsEnBesoin.map(p => {
        const lignesProduit = lignesCmd?.filter(l => l.produit_id === p.id) || [];
        
        // Compter les commandes par fournisseur
        const fournisseurCounts: Record<string, number> = {};
        lignesProduit.forEach(l => {
          const cmd = commandes?.find(c => c.id === l.commande_id);
          if (cmd?.fournisseur_id) {
            fournisseurCounts[cmd.fournisseur_id] = (fournisseurCounts[cmd.fournisseur_id] || 0) + 1;
          }
        });

        const topFournisseurId = Object.entries(fournisseurCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const fournisseurNom = fournisseurs?.find(f => f.id === topFournisseurId)?.nom || 'Non assigné';

        const stockActuel = p.stock_actuel || 0;
        const stockCritique = p.stock_critique || 0;
        const stockFaible = p.stock_faible || 0;
        const quantiteRecommandee = Math.max(stockFaible * 2, stockCritique * 3, 10);

        let urgence: 'faible' | 'moyenne' | 'haute' | 'critique' = 'faible';
        if (stockActuel <= 0) urgence = 'critique';
        else if (stockActuel <= stockCritique) urgence = 'haute';
        else if (stockActuel <= stockFaible) urgence = 'moyenne';

        return {
          produit_id: p.id,
          nom_produit: p.nom || 'Produit inconnu',
          quantite_actuelle: stockActuel,
          quantite_minimale: stockCritique || stockFaible,
          quantite_recommandee: quantiteRecommandee,
          fournisseur_principal: fournisseurNom,
          delai_livraison: 7,
          prix_unitaire_moyen: p.prix_achat || 0,
          urgence
        };
      });
    } catch (error) {
      console.error('Erreur calculateSupplyNeeds:', error);
      return [];
    }
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
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) return [];

    try {
      // Commandes en cours sans réception depuis plus de 14 jours
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() - 14);

      const { data: commandes } = await supabase
        .from('commandes_fournisseurs')
        .select('id, date_commande, fournisseur_id, statut')
        .eq('tenant_id', tenantId)
        .in('statut', ['En cours', 'Envoyée', 'Confirmée'])
        .lte('date_commande', dateLimite.toISOString().split('T')[0]);

      if (!commandes || commandes.length === 0) return [];

      // Vérifier lesquelles n'ont pas de réception
      const { data: receptions } = await supabase
        .from('receptions_fournisseurs')
        .select('commande_id')
        .eq('tenant_id', tenantId)
        .in('commande_id', commandes.map(c => c.id));

      const commandesRecues = new Set(receptions?.map(r => r.commande_id) || []);

      const { data: fournisseurs } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('tenant_id', tenantId);

      return commandes
        .filter(c => !commandesRecues.has(c.id))
        .map(c => {
          const daysLate = Math.ceil((Date.now() - new Date(c.date_commande || '').getTime()) / (1000 * 60 * 60 * 24));
          return {
            orderId: c.id,
            daysLate,
            supplierName: fournisseurs?.find(f => f.id === c.fournisseur_id)?.nom || 'Inconnu'
          };
        })
        .sort((a, b) => b.daysLate - a.daysLate);
    } catch (error) {
      console.error('Erreur checkLateDeliveries:', error);
      return [];
    }
  }
}
