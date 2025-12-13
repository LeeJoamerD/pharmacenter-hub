export interface RotationChartData {
  categorie: string;
  tauxRotation: number; // Nombre de rotations par an
  dureeEcoulement: number; // Jours pour écouler le stock
  valeurStock: number;
  statut: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique';
}

export interface RotationInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  categories: string[];
}

export class StockRotationService {
  /**
   * Calcule le taux de rotation
   * Formule: Consommation annuelle / Stock moyen
   */
  static calculateRotationRate(stockMoyen: number, consommationAnnuelle: number): number {
    if (stockMoyen <= 0) return 0;
    return Math.round((consommationAnnuelle / stockMoyen) * 100) / 100;
  }

  /**
   * Détermine le statut selon le taux de rotation
   */
  static getRotationStatus(tauxRotation: number): RotationChartData['statut'] {
    if (tauxRotation >= 10) return 'excellent';
    if (tauxRotation >= 6) return 'bon';
    if (tauxRotation >= 3) return 'moyen';
    if (tauxRotation >= 1) return 'faible';
    return 'critique';
  }

  /**
   * Calcule la durée d'écoulement en jours
   * Formule: 365 jours / Taux de rotation
   */
  static calculateDureeEcoulement(tauxRotation: number): number {
    if (tauxRotation <= 0) return 999;
    return Math.round(365 / tauxRotation);
  }

  /**
   * Calcule les données de rotation par famille
   */
  static calculateByFamily(
    products: any[],
    sales: any[],
    dateFilter: { start: Date; end: Date }
  ): RotationChartData[] {
    // Grouper les produits par famille
    const familyMap = new Map<string, {
      stockMoyen: number;
      quantiteVendue: number;
      valeurStock: number;
      nbProduits: number;
    }>();

    products.forEach(product => {
      const familleLibelle = product.famille_produit?.libelle_famille || 'Non classé';
      
      const current = familyMap.get(familleLibelle) || {
        stockMoyen: 0,
        quantiteVendue: 0,
        valeurStock: 0,
        nbProduits: 0
      };

      current.stockMoyen += product.stock_actuel || 0;
      current.valeurStock += (product.stock_actuel || 0) * (product.prix_achat || 0);
      current.nbProduits += 1;

      familyMap.set(familleLibelle, current);
    });

    // Ajouter les ventes
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.produit_id);
      if (product) {
        const familleLibelle = product.famille_produit?.libelle_famille || 'Non classé';
        const current = familyMap.get(familleLibelle);
        if (current) {
          current.quantiteVendue += sale.quantite || 0;
        }
      }
    });

    // Calculer les taux de rotation
    const rotationData: RotationChartData[] = [];

    familyMap.forEach((data, famille) => {
      const stockMoyenParProduit = data.nbProduits > 0 ? data.stockMoyen / data.nbProduits : 0;
      
      // Annualiser les ventes selon la période
      const daysDiff = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
      const consommationAnnuelle = daysDiff > 0 ? (data.quantiteVendue / daysDiff) * 365 : 0;
      
      const tauxRotation = this.calculateRotationRate(stockMoyenParProduit, consommationAnnuelle);
      const dureeEcoulement = this.calculateDureeEcoulement(tauxRotation);
      const statut = this.getRotationStatus(tauxRotation);

      rotationData.push({
        categorie: famille,
        tauxRotation,
        dureeEcoulement,
        valeurStock: data.valeurStock,
        statut
      });
    });

    // Trier par taux de rotation décroissant et limiter à 15
    return rotationData
      .sort((a, b) => b.tauxRotation - a.tauxRotation)
      .slice(0, 15);
  }

  /**
   * Génère des recommandations basées sur les données de rotation
   */
  static generateRotationInsights(data: RotationChartData[]): RotationInsight[] {
    const insights: RotationInsight[] = [];

    // Produits excellents
    const excellent = data.filter(d => d.statut === 'excellent');
    if (excellent.length > 0) {
      insights.push({
        type: 'success',
        title: 'Rotation Excellente',
        message: `${excellent.length} catégorie(s) avec rotation >10/an. Maintenir le niveau de stock.`,
        categories: excellent.map(e => e.categorie)
      });
    }

    // Produits critiques
    const critique = data.filter(d => d.statut === 'critique');
    if (critique.length > 0) {
      const valeurImmobilisee = critique.reduce((sum, c) => sum + c.valeurStock, 0);
      insights.push({
        type: 'error',
        title: 'Rotation Critique',
        message: `${critique.length} catégorie(s) avec rotation <1/an. Valeur immobilisée: ${Math.round(valeurImmobilisee).toLocaleString('fr-FR')} FCFA. Réduire les stocks.`,
        categories: critique.map(c => c.categorie)
      });
    }

    // Produits faibles
    const faible = data.filter(d => d.statut === 'faible');
    if (faible.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Rotation Faible',
        message: `${faible.length} catégorie(s) avec rotation 1-3/an. Surveiller et ajuster les commandes.`,
        categories: faible.map(f => f.categorie)
      });
    }

    // Moyenne globale
    const moyenneRotation = data.length > 0 
      ? data.reduce((sum, d) => sum + d.tauxRotation, 0) / data.length 
      : 0;
    
    insights.push({
      type: 'info',
      title: 'Taux Moyen',
      message: `Rotation moyenne: ${moyenneRotation.toFixed(2)}/an. ${
        moyenneRotation >= 5 ? 'Performance satisfaisante.' : 'Potentiel d\'optimisation.'
      }`,
      categories: []
    });

    return insights;
  }
}
