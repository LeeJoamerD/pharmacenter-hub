import { supabase } from '@/integrations/supabase/client';

export interface SupplyNotification {
  id: string;
  type: 'low_stock' | 'expiry_alert' | 'order_suggestion' | 'supplier_alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: any;
  created_at: string;
  read: boolean;
}

export interface SupplyRecommendation {
  produit_id: string;
  nom_produit: string;
  stock_actuel: number;
  stock_minimum: number;
  quantite_suggere: number;
  fournisseur_recommande?: string;
  urgence: 'low' | 'medium' | 'high' | 'critical';
  raison: string;
  cout_estime?: number;
}

export class SupplyIntelligenceService {
  /**
   * Analyse les stocks et génère des recommandations d'approvisionnement
   */
  static async generateSupplyRecommendations(): Promise<SupplyRecommendation[]> {
    const recommendations: SupplyRecommendation[] = [];

    try {
      // Mock data for demo purposes since we don't have access to real database structure yet
      const mockProducts = [
        {
          id: '1',
          nom: 'Paracétamol 500mg',
          stock_minimum: 100,
          stock_maximum: 500,
          stock_actuel: 50
        },
        {
          id: '2',
          nom: 'Amoxicilline 250mg',
          stock_minimum: 50,
          stock_maximum: 200,
          stock_actuel: 0
        },
        {
          id: '3',
          nom: 'Vitamine C 500mg',
          stock_minimum: 200,
          stock_maximum: 1000,
          stock_actuel: 150
        }
      ];

      for (const product of mockProducts) {
        const stockActuel = product.stock_actuel;
        const stockMinimum = product.stock_minimum || 0;
        const stockMaximum = product.stock_maximum || stockMinimum * 2;

        if (stockActuel <= stockMinimum) {
          const quantiteSuggeree = Math.max(stockMaximum - stockActuel, stockMinimum);
          
          let urgence: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          if (stockActuel === 0) urgence = 'critical';
          else if (stockActuel < stockMinimum * 0.5) urgence = 'high';

          recommendations.push({
            produit_id: product.id,
            nom_produit: product.nom,
            stock_actuel: stockActuel,
            stock_minimum: stockMinimum,
            quantite_suggere: quantiteSuggeree,
            urgence,
            raison: stockActuel === 0 ? 'Stock épuisé' : 'Stock sous le seuil minimum'
          });
        }
      }

      // Trier par urgence
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.urgence] - priorityOrder[a.urgence];
      });

    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      return [];
    }
  }

  /**
   * Analyse les commandes fournisseurs pour optimiser les délais
   */
  static async analyzeSupplierPerformance(): Promise<{
    fournisseur_id: string;
    nom_fournisseur: string;
    delai_moyen_livraison: number;
    taux_conformite: number;
    nombre_commandes: number;
    performance_score: number;
  }[]> {
    try {
      const { data: orders, error } = await supabase
        .from('commandes_fournisseurs')
        .select(`
          fournisseur_id,
          date_commande,
          statut,
          fournisseurs!inner(nom),
          receptions_fournisseurs(date_reception)
        `)
        .not('statut', 'eq', 'Annulé');

      if (error) throw error;

      const performanceMap = new Map();

      for (const order of orders || []) {
        const fournisseurId = order.fournisseur_id;
        const fournisseurNom = (order as any).fournisseurs?.nom || 'Inconnu';

        if (!performanceMap.has(fournisseurId)) {
          performanceMap.set(fournisseurId, {
            fournisseur_id: fournisseurId,
            nom_fournisseur: fournisseurNom,
            commandes: [],
            receptions: []
          });
        }

        performanceMap.get(fournisseurId).commandes.push(order);
        if ((order as any).receptions_fournisseurs?.length > 0) {
          performanceMap.get(fournisseurId).receptions.push(...(order as any).receptions_fournisseurs);
        }
      }

      const results = [];
      for (const [_, data] of performanceMap) {
        const delaiMoyen = this.calculateAverageDeliveryTime(data.commandes, data.receptions);
        const tauxConformite = this.calculateConformityRate(data.commandes);
        const performanceScore = this.calculatePerformanceScore(delaiMoyen, tauxConformite);

        results.push({
          fournisseur_id: data.fournisseur_id,
          nom_fournisseur: data.nom_fournisseur,
          delai_moyen_livraison: delaiMoyen,
          taux_conformite: tauxConformite,
          nombre_commandes: data.commandes.length,
          performance_score: performanceScore
        });
      }

      return results.sort((a, b) => b.performance_score - a.performance_score);

    } catch (error) {
      console.error('Erreur lors de l\'analyse des performances fournisseurs:', error);
      return [];
    }
  }

  /**
   * Génère des notifications automatiques basées sur l'état des stocks
   */
  static async generateAutomaticNotifications(): Promise<SupplyNotification[]> {
    const notifications: SupplyNotification[] = [];

    try {
      // Notifications de stock faible
      const recommendations = await this.generateSupplyRecommendations();
      
      for (const rec of recommendations) {
        if (rec.urgence === 'critical' || rec.urgence === 'high') {
          notifications.push({
            id: `stock-${rec.produit_id}-${Date.now()}`,
            type: 'low_stock',
            priority: rec.urgence === 'critical' ? 'critical' : 'high',
            title: `Stock ${rec.urgence === 'critical' ? 'épuisé' : 'faible'}`,
            message: `${rec.nom_produit}: ${rec.stock_actuel} unités restantes (min: ${rec.stock_minimum})`,
            metadata: rec,
            created_at: new Date().toISOString(),
            read: false
          });
        }
      }

      // Notifications d'expiration
      const { data: expiringLots } = await supabase
        .from('lots')
        .select(`
          id, numero_lot, date_peremption, quantite_restante,
          produits!inner(nom_produit)
        `)
        .not('date_peremption', 'is', null)
        .gt('quantite_restante', 0)
        .lte('date_peremption', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      for (const lot of expiringLots || []) {
        const daysToExpiry = Math.ceil(
          (new Date(lot.date_peremption!).getTime() - Date.now()) / (1000 * 3600 * 24)
        );

        notifications.push({
          id: `expiry-${lot.id}-${Date.now()}`,
          type: 'expiry_alert',
          priority: daysToExpiry <= 7 ? 'critical' : 'high',
          title: 'Produit proche de l\'expiration',
          message: `${(lot as any).produits?.nom_produit} (Lot ${lot.numero_lot}) expire dans ${daysToExpiry} jours`,
          metadata: { lot, daysToExpiry },
          created_at: new Date().toISOString(),
          read: false
        });
      }

      // Notifications de suggestions de commande
      const criticalRecommendations = recommendations.filter(r => r.urgence === 'critical');
      if (criticalRecommendations.length > 0) {
        notifications.push({
          id: `suggestion-${Date.now()}`,
          type: 'order_suggestion',
          priority: 'high',
          title: 'Commandes urgentes recommandées',
          message: `${criticalRecommendations.length} produits nécessitent un réapprovisionnement urgent`,
          metadata: { recommendations: criticalRecommendations },
          created_at: new Date().toISOString(),
          read: false
        });
      }

      return notifications.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Erreur lors de la génération des notifications:', error);
      return [];
    }
  }

  /**
   * Prédiction des besoins futurs basée sur l'historique
   */
  static async predictFutureNeeds(produitId: string, periodeDays: number = 30): Promise<{
    produit_id: string;
    consommation_moyenne_journaliere: number;
    besoin_prevu: number;
    stock_recommande: number;
    date_rupture_estimee?: string;
  } | null> {
    try {
      // Analyser l'historique des ventes/sorties
      const { data: movements } = await supabase
        .from('stock_mouvements')
        .select('quantite, date_mouvement')
        .eq('produit_id', produitId)
        .eq('type_mouvement', 'vente')
        .gte('date_mouvement', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('date_mouvement');

      if (!movements || movements.length === 0) return null;

      // Calculer la consommation moyenne
      const totalConsommation = movements.reduce((sum, m) => sum + Math.abs(m.quantite), 0);
      const joursAnalyses = Math.max(1, movements.length > 0 ? 
        Math.ceil((Date.now() - new Date(movements[0].date_mouvement).getTime()) / (1000 * 3600 * 24)) : 1
      );
      
      const consommationMoyenne = totalConsommation / joursAnalyses;
      const besoinPrevu = consommationMoyenne * periodeDays;

      // Stock actuel
      const { data: lots } = await supabase
        .from('lots')
        .select('quantite_restante')
        .eq('produit_id', produitId)
        .gt('quantite_restante', 0);

      const stockActuel = lots?.reduce((sum, lot) => sum + lot.quantite_restante, 0) || 0;

      // Date de rupture estimée
      let dateRuptureEstimee: string | undefined;
      if (consommationMoyenne > 0 && stockActuel > 0) {
        const joursRestants = stockActuel / consommationMoyenne;
        dateRuptureEstimee = new Date(Date.now() + joursRestants * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      return {
        produit_id: produitId,
        consommation_moyenne_journaliere: consommationMoyenne,
        besoin_prevu: besoinPrevu,
        stock_recommande: besoinPrevu * 1.2, // Marge de sécurité de 20%
        date_rupture_estimee: dateRuptureEstimee
      };

    } catch (error) {
      console.error('Erreur lors de la prédiction des besoins:', error);
      return null;
    }
  }

  private static calculateAverageDeliveryTime(commandes: any[], receptions: any[]): number {
    let totalDelai = 0;
    let count = 0;

    for (const commande of commandes) {
      const reception = receptions.find(r => r.commande_id === commande.id);
      if (reception && commande.date_commande) {
        const delai = Math.ceil(
          (new Date(reception.date_reception).getTime() - new Date(commande.date_commande).getTime()) 
          / (1000 * 3600 * 24)
        );
        totalDelai += delai;
        count++;
      }
    }

    return count > 0 ? totalDelai / count : 0;
  }

  private static calculateConformityRate(commandes: any[]): number {
    const commandesLivrees = commandes.filter(c => c.statut === 'Livré');
    return commandesLivrees.length > 0 ? (commandesLivrees.length / commandes.length) * 100 : 0;
  }

  private static calculatePerformanceScore(delaiMoyen: number, tauxConformite: number): number {
    // Score basé sur délai (moins = mieux) et conformité (plus = mieux)
    const scoreDelai = Math.max(0, 100 - delaiMoyen * 2); // Pénalité de 2 points par jour de délai
    const scoreConformite = tauxConformite;
    
    return (scoreDelai + scoreConformite) / 2;
  }
}