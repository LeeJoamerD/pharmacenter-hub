import { supabase } from "@/integrations/supabase/client";
import { LotCalculationService } from "./lotCalculationService";

export interface RotationProductData {
  id: string;
  nom: string;
  categorie: string;
  stockMoyen: number;
  consommationAnnuelle: number;
  tauxRotation: number;
  dureeEcoulement: number;
  statut: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique';
  evolution: number;
  dernierMouvement: Date;
  valeurStock: number;
  famille_id?: string;
}

export interface RotationStats {
  excellent: number;
  bon: number;
  moyen: number;
  faible: number;
  critique: number;
}

export interface RotationMetrics {
  rotationMoyenne: number;
  produitsAnalyses: number;
  valeurAnalysee: number;
  alertesRotation: number;
}

export class RotationAnalysisService {
  
  /**
   * Récupère les données d'analyse de rotation pour une période donnée
   */
  static async getRotationAnalysis(
    tenantId: string,
    period: 'mensuel' | 'trimestriel' | 'annuel' | 'personnalise' = 'annuel',
    familleId?: string,
    statut?: string
  ): Promise<{
    products: RotationProductData[];
    metrics: RotationMetrics;
    stats: RotationStats;
  }> {
    try {
      // Calculer la date de début selon la période
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'mensuel':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'trimestriel':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'annuel':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Requête pour récupérer les produits avec leurs données de stock et ventes
      let query = supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          prix_achat,
          prix_vente_ttc,
          famille_id,
          famille_produit!famille_id(libelle_famille),
          lots!produit_id(
            id,
            quantite_initiale,
            quantite_restante,
            created_at,
            updated_at
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (familleId && familleId !== 'toutes') {
        query = query.eq('famille_id', familleId);
      }

      const { data: produits, error: produitsError } = await query;

      if (produitsError) {
        console.error('Erreur lors de la récupération des produits:', produitsError);
        throw produitsError;
      }

      if (!produits || produits.length === 0) {
        return {
          products: [],
          metrics: {
            rotationMoyenne: 0,
            produitsAnalyses: 0,
            valeurAnalysee: 0,
            alertesRotation: 0
          },
          stats: {
            excellent: 0,
            bon: 0,
            moyen: 0,
            faible: 0,
            critique: 0
          }
        };
      }

      // Récupérer les données de ventes pour la période
      const { data: ventes, error: ventesError } = await supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          lot_id,
          created_at,
          vente:vente_id(date_vente)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ventesError) {
        console.error('Erreur lors de la récupération des ventes:', ventesError);
      }

      // Récupérer les mouvements de stock
      const { data: mouvements, error: mouvementsError } = await supabase
        .from('stock_mouvements')
        .select(`
          produit_id,
          lot_id,
          type_mouvement,
          quantite,
          date_mouvement
        `)
        .eq('tenant_id', tenantId)
        .gte('date_mouvement', startDate.toISOString())
        .lte('date_mouvement', endDate.toISOString());

      if (mouvementsError) {
        console.error('Erreur lors de la récupération des mouvements:', mouvementsError);
      }

      // Traiter les données pour chaque produit
      const products: RotationProductData[] = [];

      for (const produit of produits) {
        // Calculer le stock moyen
        const lots = produit.lots || [];
        const stockMoyen = lots.reduce((sum: number, lot: any) => {
          return sum + (lot.quantite_initiale + lot.quantite_restante) / 2;
        }, 0) / Math.max(lots.length, 1);

        // Calculer la consommation annuelle
        const ventesProduct = ventes?.filter(v => v.produit_id === produit.id) || [];
        const consommationPeriode = ventesProduct.reduce((sum, vente) => sum + vente.quantite, 0);
        const multiplierAnnuel = period === 'mensuel' ? 12 : period === 'trimestriel' ? 4 : 1;
        const consommationAnnuelle = consommationPeriode * multiplierAnnuel;

        // Calculer le taux de rotation
        const tauxRotation = stockMoyen > 0 ? consommationAnnuelle / stockMoyen : 0;

        // Calculer la durée d'écoulement
        const dureeEcoulement = tauxRotation > 0 ? 365 / tauxRotation : 999;

        // Déterminer le statut
        let statut: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique';
        if (tauxRotation >= 10) statut = 'excellent';
        else if (tauxRotation >= 6) statut = 'bon';
        else if (tauxRotation >= 3) statut = 'moyen';
        else if (tauxRotation >= 1) statut = 'faible';
        else statut = 'critique';

        // Calculer l'évolution (simulée pour l'instant)
        const evolution = Math.random() * 20 - 10; // -10% à +10%

        // Dernier mouvement
        const mouvementsProduct = mouvements?.filter(m => m.produit_id === produit.id) || [];
        const dernierMouvement = mouvementsProduct.length > 0 
          ? new Date(Math.max(...mouvementsProduct.map(m => new Date(m.date_mouvement).getTime())))
          : new Date();

        // Valeur du stock
        const valeurStock = stockMoyen * (produit.prix_achat || 0);

        products.push({
          id: produit.id,
          nom: produit.libelle_produit,
          categorie: produit.famille_produit?.libelle_famille || 'Sans famille',
          stockMoyen: Math.round(stockMoyen),
          consommationAnnuelle: Math.round(consommationAnnuelle),
          tauxRotation: Math.round(tauxRotation * 10) / 10,
          dureeEcoulement: Math.round(dureeEcoulement),
          statut,
          evolution: Math.round(evolution * 10) / 10,
          dernierMouvement,
          valeurStock: Math.round(valeurStock),
          famille_id: produit.famille_id
        });
      }

      // Calculer les statistiques
      const stats: RotationStats = {
        excellent: products.filter(p => p.statut === 'excellent').length,
        bon: products.filter(p => p.statut === 'bon').length,
        moyen: products.filter(p => p.statut === 'moyen').length,
        faible: products.filter(p => p.statut === 'faible').length,
        critique: products.filter(p => p.statut === 'critique').length
      };

      // Calculer les métriques
      const rotationMoyenne = products.length > 0 
        ? products.reduce((sum, p) => sum + p.tauxRotation, 0) / products.length
        : 0;

      const valeurAnalysee = products.reduce((sum, p) => sum + p.valeurStock, 0);
      const alertesRotation = stats.faible + stats.critique;

      const metrics: RotationMetrics = {
        rotationMoyenne: Math.round(rotationMoyenne * 10) / 10,
        produitsAnalyses: products.length,
        valeurAnalysee: Math.round(valeurAnalysee),
        alertesRotation
      };

      return {
        products,
        metrics,
        stats
      };

    } catch (error) {
      console.error('Erreur dans getRotationAnalysis:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des familles de produits
   */
  static async getFamillesProduits(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('famille_produit')
        .select('id, libelle_famille')
        .eq('tenant_id', tenantId)
        .order('libelle_famille');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des familles:', error);
      return [];
    }
  }

  /**
   * Exporte les données d'analyse de rotation
   */
  static async exportRotationData(
    products: RotationProductData[],
    format: 'csv' | 'excel' = 'csv'
  ): Promise<string> {
    try {
      if (format === 'csv') {
        const headers = [
          'Produit',
          'Catégorie',
          'Stock Moyen',
          'Consommation Annuelle',
          'Taux Rotation',
          'Durée Écoulement (jours)',
          'Statut',
          'Évolution (%)',
          'Dernier Mouvement',
          'Valeur Stock'
        ];

        const csvContent = [
          headers.join(','),
          ...products.map(p => [
            `"${p.nom}"`,
            `"${p.categorie}"`,
            p.stockMoyen,
            p.consommationAnnuelle,
            p.tauxRotation,
            p.dureeEcoulement,
            `"${p.statut}"`,
            p.evolution,
            `"${p.dernierMouvement.toLocaleDateString('fr-FR')}"`,
            p.valeurStock
          ].join(','))
        ].join('\n');

        // Créer un blob et retourner l'URL
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Déclencher le téléchargement
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `analyse_rotation_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return url;
      }

      throw new Error('Format non supporté');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    }
  }

  /**
   * Génère des recommandations basées sur l'analyse de rotation
   */
  static generateRecommendations(products: RotationProductData[]): {
    recommendations: Array<{
      type: 'warning' | 'info' | 'success';
      message: string;
      products: string[];
    }>;
  } {
    const recommendations = [];

    // Produits à rotation critique
    const criticalProducts = products.filter(p => p.statut === 'critique');
    if (criticalProducts.length > 0) {
      recommendations.push({
        type: 'warning' as const,
        message: `${criticalProducts.length} produit(s) avec rotation critique nécessitent une attention immédiate`,
        products: criticalProducts.map(p => p.nom)
      });
    }

    // Produits à rotation faible
    const slowProducts = products.filter(p => p.statut === 'faible');
    if (slowProducts.length > 0) {
      recommendations.push({
        type: 'info' as const,
        message: `${slowProducts.length} produit(s) à rotation lente pourraient bénéficier d'une révision des commandes`,
        products: slowProducts.map(p => p.nom)
      });
    }

    // Produits performants
    const excellentProducts = products.filter(p => p.statut === 'excellent');
    if (excellentProducts.length > 0) {
      recommendations.push({
        type: 'success' as const,
        message: `${excellentProducts.length} produit(s) avec excellent taux de rotation - surveiller les ruptures`,
        products: excellentProducts.map(p => p.nom)
      });
    }

    return { recommendations };
  }
}