export interface ForecastProduct {
  id: string;
  nom: string;
  stockActuel: number;
  prevision1Mois: number;
  prevision3Mois: number;
  prevision6Mois: number;
  fiabilite: number;
  tendance: string;
  recommandation: string;
  quantiteRecommandee: number;
  famille?: {
    id: string;
    libelle_famille: string;
  };
}

export interface ForecastStats {
  totalProduits: number;
  fiabiliteMoyenne: number;
  valeurPrevisionnelle: number;
  alertesStock: number;
}

export interface ForecastRecommendation {
  type: string;
  count: number;
  percentage: number;
}

export class ForecastAnalysisService {
  static async getForecastData(
    tenantId: string,
    filters: {
      horizon?: string;
      category?: string;
      recommendation?: string;
    } = {}
  ): Promise<{
    products: ForecastProduct[];
    stats: ForecastStats;
    recommendations: ForecastRecommendation[];
  }> {
    // Mock data for now - will be replaced with real data later
    const mockProducts: ForecastProduct[] = [
      {
        id: '1',
        nom: 'Doliprane 1000mg',
        stockActuel: 150,
        prevision1Mois: 120,
        prevision3Mois: 80,
        prevision6Mois: 20,
        fiabilite: 85,
        tendance: 'baisse',
        recommandation: 'Commande urgente',
        quantiteRecommandee: 200,
        famille: { id: '1', libelle_famille: 'Antalgiques' }
      },
      {
        id: '2',
        nom: 'Amoxicilline 500mg',
        stockActuel: 75,
        prevision1Mois: 65,
        prevision3Mois: 45,
        prevision6Mois: 15,
        fiabilite: 92,
        tendance: 'stable',
        recommandation: 'Surveiller',
        quantiteRecommandee: 100,
        famille: { id: '2', libelle_famille: 'Antibiotiques' }
      },
      {
        id: '3',
        nom: 'Sérum physiologique',
        stockActuel: 300,
        prevision1Mois: 280,
        prevision3Mois: 250,
        prevision6Mois: 180,
        fiabilite: 78,
        tendance: 'hausse',
        recommandation: 'Stock optimal',
        quantiteRecommandee: 0,
        famille: { id: '3', libelle_famille: 'Consommables' }
      },
      {
        id: '4',
        nom: 'Aspirine 100mg',
        stockActuel: 45,
        prevision1Mois: 38,
        prevision3Mois: 25,
        prevision6Mois: 5,
        fiabilite: 88,
        tendance: 'baisse',
        recommandation: 'Commande urgente',
        quantiteRecommandee: 150,
        famille: { id: '1', libelle_famille: 'Antalgiques' }
      },
      {
        id: '5',
        nom: 'Vitamines B Complex',
        stockActuel: 220,
        prevision1Mois: 200,
        prevision3Mois: 160,
        prevision6Mois: 100,
        fiabilite: 75,
        tendance: 'stable',
        recommandation: 'Surstockage',
        quantiteRecommandee: 0,
        famille: { id: '4', libelle_famille: 'Vitamines' }
      }
    ];

    // Apply filters
    let filteredProducts = mockProducts;
    
    if (filters.category && filters.category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.famille?.id === filters.category);
    }
    
    if (filters.recommendation && filters.recommendation !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.recommandation === filters.recommendation);
    }

    const stats = this.calculateStats(mockProducts);
    const recommendations = this.calculateRecommendations(mockProducts);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    return { products: filteredProducts, stats, recommendations };
  }

  private static calculateStats(products: ForecastProduct[]): ForecastStats {
    const totalProduits = products.length;
    const fiabiliteMoyenne = totalProduits > 0 ? 
      Math.round(products.reduce((sum, p) => sum + p.fiabilite, 0) / totalProduits) : 0;
    const valeurPrevisionnelle = Math.round(products.reduce((sum, p) => sum + (p.prevision1Mois * 10), 0));
    const alertesStock = products.filter(p => 
      p.recommandation === 'Commande urgente' || p.recommandation === 'Surveiller'
    ).length;

    return { totalProduits, fiabiliteMoyenne, valeurPrevisionnelle, alertesStock };
  }

  private static calculateRecommendations(products: ForecastProduct[]): ForecastRecommendation[] {
    const total = products.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    
    products.forEach(product => {
      const type = product.recommandation;
      counts[type] = (counts[type] || 0) + 1;
    });

    const results: ForecastRecommendation[] = [];
    Object.keys(counts).forEach(type => {
      results.push({
        type: type,
        count: counts[type],
        percentage: Math.round((counts[type] / total) * 100)
      });
    });

    return results;
  }

  static async getProductFamilies(tenantId: string): Promise<Array<{id: string; libelle_famille: string}>> {
    // Mock data for families
    const mockFamilies = [
      { id: '1', libelle_famille: 'Antalgiques' },
      { id: '2', libelle_famille: 'Antibiotiques' },
      { id: '3', libelle_famille: 'Consommables' },
      { id: '4', libelle_famille: 'Vitamines' }
    ];

    await new Promise(resolve => setTimeout(resolve, 200));
    return mockFamilies;
  }

  static async exportForecastData(
    tenantId: string,
    filters: Record<string, string> = {},
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<{success: boolean; message: string; url?: string}> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Export ${format.toUpperCase()} généré avec succès`,
      url: `/exports/previsions_${new Date().toISOString().split('T')[0]}.${format}`
    };
  }

  static async runForecastCalculation(tenantId: string): Promise<{success: boolean; message: string}> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: 'Calcul des prévisions terminé avec succès'
    };
  }
}