import { supabase } from '@/integrations/supabase/client';

export interface ABCProduct {
  id: string;
  nom: string;
  categorie: string;
  famille_id?: string;
  classe: 'A' | 'B' | 'C';
  chiffreAffaires: number;
  pourcentageCA: number;
  pourcentageCumule: number;
  quantiteVendue: number;
  rotation: number;
  prixMoyen: number;
  stockActuel: number;
  margeUnitaire: number;
  derniereLivraison?: Date;
}

export interface ABCAnalysisResult {
  products: ABCProduct[];
  classeStats: {
    A: { count: number; ca: number; percentage: number };
    B: { count: number; ca: number; percentage: number };
    C: { count: number; ca: number; percentage: number };
  };
  totalCA: number;
  totalProducts: number;
  rotationMoyenne: number;
  respectePareto: boolean;
  periodeAnalyse: {
    debut: Date;
    fin: Date;
    libelle: string;
  };
}

export interface ABCAnalysisFilters {
  periode: 'mois' | 'trimestre' | 'semestre' | 'annee' | 'personnalise';
  dateDebut?: Date;
  dateFin?: Date;
  famille_id?: string;
  classe?: 'A' | 'B' | 'C' | 'toutes';
  categorie_tarification_id?: string;
  recherche?: string;
  seulement_actifs?: boolean;
}

export class ABCAnalysisService {
  private static getCurrentUserTenantId(): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase.rpc('get_current_user_tenant_id').then(({ data, error }) => {
        if (error || !data) {
          reject(new Error('Impossible de récupérer le tenant ID'));
        } else {
          resolve(data);
        }
      });
    });
  }

  private static calculatePeriodRange(periode: string, dateDebut?: Date, dateFin?: Date): { debut: Date; fin: Date; libelle: string } {
    const now = new Date();
    let debut: Date;
    let fin: Date = now;
    let libelle: string;

    switch (periode) {
      case 'mois':
        debut = new Date(now.getFullYear(), now.getMonth(), 1);
        libelle = 'Ce mois';
        break;
      case 'trimestre':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        debut = new Date(now.getFullYear(), currentQuarter * 3, 1);
        libelle = 'Ce trimestre';
        break;
      case 'semestre':
        const currentSemester = Math.floor(now.getMonth() / 6);
        debut = new Date(now.getFullYear(), currentSemester * 6, 1);
        libelle = 'Ce semestre';
        break;
      case 'annee':
        debut = new Date(now.getFullYear(), 0, 1);
        libelle = 'Cette année';
        break;
      case 'personnalise':
        if (!dateDebut || !dateFin) {
          throw new Error('Dates de début et fin requises pour une période personnalisée');
        }
        debut = dateDebut;
        fin = dateFin;
        libelle = `Du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}`;
        break;
      default:
        debut = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        libelle = 'Dernier trimestre';
    }

    return { debut, fin, libelle };
  }

  static async getSalesDataForABC(filters: ABCAnalysisFilters): Promise<{
    products: any[];
    totalCA: number;
  }> {
    try {
      const tenantId = await this.getCurrentUserTenantId();
      const { debut, fin } = this.calculatePeriodRange(
        filters.periode,
        filters.dateDebut,
        filters.dateFin
      );

      // Requête pour récupérer les données de vente
      let query = supabase
        .from('lignes_ventes')
        .select(`
          produit_id,
          quantite,
          prix_unitaire_ttc,
          montant_ligne_ttc,
          vente_id,
          ventes!inner(
            date_vente,
            statut
          ),
          produits!inner(
            id,
            libelle_produit,
            prix_vente_ttc,
            stock_actuel,
            famille_id,
            categorie_tarification_id,
            famille_produit:famille_id(libelle_famille),
            categorie_tarification!categorie_tarification_id(libelle_categorie)
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('ventes.date_vente', debut.toISOString())
        .lte('ventes.date_vente', fin.toISOString())
        .eq('ventes.statut', 'Finalisée');

      // Appliquer les filtres additionnels
      if (filters.famille_id) {
        query = query.eq('produits.famille_id', filters.famille_id);
      }

      if (filters.categorie_tarification_id) {
        query = query.eq('produits.categorie_tarification_id', filters.categorie_tarification_id);
      }

      if (filters.recherche) {
        query = query.ilike('produits.libelle_produit', `%${filters.recherche}%`);
      }

      const { data: salesData, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des données de vente:', error);
        throw error;
      }

      // Vérifier s'il y a des données de vente
      if (!salesData || salesData.length === 0) {
        throw new Error('NO_SALES_DATA');
      }

      // Agrégation des données par produit
      const productSales = new Map();
      let totalCA = 0;

      salesData?.forEach((sale: any) => {
        const produitId = sale.produit_id;
        const montant = Number(sale.montant_ligne_ttc) || 0;
        const quantite = Number(sale.quantite) || 0;

        if (productSales.has(produitId)) {
          const existing = productSales.get(produitId);
          existing.chiffreAffaires += montant;
          existing.quantiteVendue += quantite;
          existing.nombreVentes += 1;
        } else {
          productSales.set(produitId, {
            id: produitId,
            nom: sale.produits.libelle_produit,
            categorie: sale.produits.famille_produit?.libelle_famille || 'Non catégorisé',
            famille_id: sale.produits.famille_id,
            chiffreAffaires: montant,
            quantiteVendue: quantite,
            nombreVentes: 1,
            prixMoyen: Number(sale.produits.prix_vente_ttc) || 0,
            stockActuel: Number(sale.produits.stock_actuel) || 0,
            margeUnitaire: 0 // À calculer avec les données d'achat si disponibles
          });
        }

        totalCA += montant;
      });

      const products = Array.from(productSales.values());
      
      // Vérification finale s'il n'y a pas de produits avec des ventes
      if (products.length === 0) {
        throw new Error('NO_SALES_DATA');
      }

      return { products, totalCA };

    } catch (error) {
      console.error('Erreur dans getSalesDataForABC:', error);
      throw error;
    }
  }

  static calculateABCClassification(products: any[], totalCA: number): ABCProduct[] {
    // Trier les produits par chiffre d'affaires décroissant
    const sortedProducts = [...products].sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);

    let cumulatedCA = 0;
    const abcProducts: ABCProduct[] = sortedProducts.map((product, index) => {
      const pourcentageCA = totalCA > 0 ? (product.chiffreAffaires / totalCA) * 100 : 0;
      cumulatedCA += pourcentageCA;

      // Classification ABC selon la règle 80-15-5
      let classe: 'A' | 'B' | 'C';
      if (cumulatedCA <= 80) {
        classe = 'A';
      } else if (cumulatedCA <= 95) {
        classe = 'B';
      } else {
        classe = 'C';
      }

      // Calcul de la rotation (approximation basée sur les ventes)
      const rotation = product.stockActuel > 0 
        ? (product.quantiteVendue * 12) / product.stockActuel // Annualisé
        : product.quantiteVendue;

      return {
        ...product,
        classe,
        pourcentageCA,
        pourcentageCumule: cumulatedCA,
        rotation,
        derniereLivraison: undefined // À implémenter avec les données de réception
      };
    });

    return abcProducts;
  }

  static async performABCAnalysis(filters: ABCAnalysisFilters): Promise<ABCAnalysisResult> {
    try {
      // Récupération des données de vente
      const { products: rawProducts, totalCA } = await this.getSalesDataForABC(filters);

      // Classification ABC
      const products = this.calculateABCClassification(rawProducts, totalCA);

      // Calcul des statistiques par classe
      const classeStats = {
        A: { count: 0, ca: 0, percentage: 0 },
        B: { count: 0, ca: 0, percentage: 0 },
        C: { count: 0, ca: 0, percentage: 0 }
      };

      products.forEach(product => {
        classeStats[product.classe].count += 1;
        classeStats[product.classe].ca += product.chiffreAffaires;
      });

      // Calcul des pourcentages
      Object.keys(classeStats).forEach(classe => {
        classeStats[classe as keyof typeof classeStats].percentage = 
          totalCA > 0 ? (classeStats[classe as keyof typeof classeStats].ca / totalCA) * 100 : 0;
      });

      // Calcul de la rotation moyenne
      const rotationMoyenne = products.length > 0 
        ? products.reduce((sum, p) => sum + p.rotation, 0) / products.length 
        : 0;

      // Vérification du respect de la règle de Pareto (approximation)
      const respectePareto = classeStats.A.percentage >= 70 && classeStats.A.count <= (products.length * 0.3);

      // Période d'analyse
      const periodeAnalyse = this.calculatePeriodRange(
        filters.periode,
        filters.dateDebut,
        filters.dateFin
      );

      return {
        products,
        classeStats,
        totalCA,
        totalProducts: products.length,
        rotationMoyenne,
        respectePareto,
        periodeAnalyse
      };

    } catch (error) {
      console.error('Erreur lors de l\'analyse ABC:', error);
      throw error;
    }
  }

  static async getAvailableFamilies(): Promise<Array<{id: string, libelle: string}>> {
    try {
      const tenantId = await this.getCurrentUserTenantId();
      
      const { data, error } = await supabase
        .from('famille_produit')
        .select('id, libelle_famille')
        .eq('tenant_id', tenantId)
        .order('libelle_famille');

      if (error) throw error;

      return data?.map(f => ({
        id: f.id,
        libelle: f.libelle_famille
      })) || [];

    } catch (error) {
      console.error('Erreur lors de la récupération des familles:', error);
      return [];
    }
  }

  static async getAvailableCategories(): Promise<Array<{id: string, libelle: string}>> {
    try {
      const tenantId = await this.getCurrentUserTenantId();
      
      const { data, error } = await supabase
        .from('categorie_tarification')
        .select('id, libelle_categorie')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('libelle_categorie');

      if (error) throw error;

      return data?.map(c => ({
        id: c.id,
        libelle: c.libelle_categorie
      })) || [];

    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  }

  static async recalculateABCClasses(filters: ABCAnalysisFilters): Promise<ABCAnalysisResult> {
    // Force le recalcul en ignorant le cache
    return this.performABCAnalysis(filters);
  }
}