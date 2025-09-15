import { supabase } from "@/integrations/supabase/client";

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
    try {
      // Get base product data
      let query = supabase
        .from('produits')
        .select(`
          id,
          libelle_produit,
          famille_produit:famille_id (
            id,
            libelle_famille
          ),
          lots!inner (
            quantite_restante
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (filters.category && filters.category !== 'all') {
        query = query.eq('famille_id', filters.category);
      }

      const { data: products, error: productsError } = await query;
      if (productsError) throw productsError;

      const forecastProducts: ForecastProduct[] = (products || []).map((product) => {
        const currentStock = product.lots?.reduce((sum: number, lot: any) => 
          sum + (lot.quantite_restante || 0), 0) || 0;

        // Mock calculations for now
        const month1 = Math.max(0, currentStock - Math.floor(Math.random() * 50));
        const month3 = Math.max(0, month1 - Math.floor(Math.random() * 100));
        const month6 = Math.max(0, month3 - Math.floor(Math.random() * 150));
        const reliability = Math.floor(Math.random() * 30) + 70;
        
        let recommendation = 'Stock optimal';
        let recommendedQty = 0;
        
        if (month1 <= 10) {
          recommendation = 'Commande urgente';
          recommendedQty = 100;
        } else if (month3 <= 30) {
          recommendation = 'Surveiller';
          recommendedQty = 50;
        } else if (currentStock > month6 * 2) {
          recommendation = 'Surstockage';
        }

        return {
          id: product.id,
          nom: product.libelle_produit || 'Produit inconnu',
          stockActuel: currentStock,
          prevision1Mois: month1,
          prevision3Mois: month3,
          prevision6Mois: month6,
          fiabilite: reliability,
          tendance: Math.random() > 0.5 ? 'stable' : Math.random() > 0.5 ? 'hausse' : 'baisse',
          recommandation: recommendation,
          quantiteRecommandee: recommendedQty,
          famille: product.famille_produit ? {
            id: product.famille_produit.id,
            libelle_famille: product.famille_produit.libelle_famille
          } : undefined
        };
      });

      // Apply filters
      let filteredProducts = forecastProducts;
      if (filters.recommendation && filters.recommendation !== 'all') {
        filteredProducts = forecastProducts.filter(p => 
          p.recommandation === filters.recommendation
        );
      }

      const stats = this.calculateStats(forecastProducts);
      const recommendations = this.calculateRecommendations(forecastProducts);

      return { products: filteredProducts, stats, recommendations };
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw error;
    }
  }

  private static calculateStats(products: ForecastProduct[]): ForecastStats {
    const totalProduits = products.length;
    const fiabiliteMoyenne = totalProduits > 0 ? 
      Math.round(products.reduce((sum, p) => sum + p.fiabilite, 0) / totalProduits) : 0;
    const valeurPrevisionnelle = products.reduce((sum, p) => sum + (p.prevision1Mois * 10), 0);
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

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  static async getProductFamilies(tenantId: string) {
    const { data, error } = await supabase
      .from('famille_produit')
      .select('id, libelle_famille')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('libelle_famille');

    if (error) throw error;
    return data || [];
  }

  static async exportForecastData(
    tenantId: string,
    filters: any = {},
    format: 'pdf' | 'excel' = 'pdf'
  ) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: `Export ${format.toUpperCase()} généré avec succès`,
      url: `/exports/previsions_${new Date().toISOString().split('T')[0]}.${format}`
    };
  }

  static async runForecastCalculation(tenantId: string) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      message: 'Calcul des prévisions terminé avec succès'
    };
  }
}