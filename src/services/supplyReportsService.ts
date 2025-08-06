import { supabase } from '@/integrations/supabase/client';

export interface SupplyReport {
  id: string;
  type: 'stock_analysis' | 'supplier_performance' | 'cost_analysis' | 'movement_history';
  title: string;
  period: { start: string; end: string };
  data: any;
  generated_at: string;
}

export class SupplyReportsService {
  /**
   * Génère un rapport d'analyse des stocks
   */
  static async generateStockAnalysisReport(startDate: string, endDate: string): Promise<SupplyReport> {
    try {
      // Analyse des niveaux de stock
      const { data: stockLevels } = await supabase
        .from('produits')
        .select(`
          id, nom_produit, stock_minimum, stock_maximum,
          lots!inner(quantite_restante, prix_achat_unitaire)
        `)
        .eq('is_active', true);

      // Analyse des mouvements sur la période
      const { data: movements } = await supabase
        .from('stock_mouvements')
        .select(`
          id, type_mouvement, quantite, date_mouvement,
          produits!inner(nom_produit)
        `)
        .gte('date_mouvement', startDate)
        .lte('date_mouvement', endDate);

      // Calculs statistiques
      const stockAnalysis = this.calculateStockMetrics(stockLevels || []);
      const movementAnalysis = this.calculateMovementMetrics(movements || []);

      const reportData = {
        summary: {
          total_products: stockLevels?.length || 0,
          products_low_stock: stockAnalysis.lowStockCount,
          products_overstock: stockAnalysis.overstockCount,
          total_movements: movements?.length || 0,
          stock_value: stockAnalysis.totalValue
        },
        stock_levels: stockAnalysis.productAnalysis,
        movements_by_type: movementAnalysis.byType,
        movements_by_date: movementAnalysis.byDate,
        top_moving_products: movementAnalysis.topProducts
      };

      return {
        id: `stock-analysis-${Date.now()}`,
        type: 'stock_analysis',
        title: 'Analyse des stocks',
        period: { start: startDate, end: endDate },
        data: reportData,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erreur génération rapport stocks:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport de performance des fournisseurs
   */
  static async generateSupplierPerformanceReport(startDate: string, endDate: string): Promise<SupplyReport> {
    try {
      const { data: orders } = await supabase
        .from('commandes_fournisseurs')
        .select(`
          id, fournisseur_id, date_commande, statut,
          fournisseurs!inner(nom, email),
          lignes_commande_fournisseur(quantite_commandee, prix_achat_unitaire_attendu),
          receptions_fournisseurs(date_reception, reference_facture)
        `)
        .gte('date_commande', startDate)
        .lte('date_commande', endDate);

      const supplierMetrics = this.calculateSupplierMetrics(orders || []);

      const reportData = {
        summary: {
          total_suppliers: supplierMetrics.length,
          total_orders: orders?.length || 0,
          average_delivery_time: this.calculateOverallAverageDeliveryTime(supplierMetrics),
          top_supplier: supplierMetrics[0]?.nom_fournisseur || 'N/A'
        },
        supplier_performance: supplierMetrics,
        delivery_trends: this.calculateDeliveryTrends(orders || []),
        order_status_distribution: this.calculateOrderStatusDistribution(orders || [])
      };

      return {
        id: `supplier-performance-${Date.now()}`,
        type: 'supplier_performance',
        title: 'Performance des fournisseurs',
        period: { start: startDate, end: endDate },
        data: reportData,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erreur génération rapport fournisseurs:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport d'analyse des coûts
   */
  static async generateCostAnalysisReport(startDate: string, endDate: string): Promise<SupplyReport> {
    try {
      const { data: receptions } = await supabase
        .from('receptions_fournisseurs')
        .select(`
          id, date_reception, reference_facture,
          fournisseurs!inner(nom),
          lots!inner(
            quantite_initiale, prix_achat_unitaire,
            produits!inner(nom_produit, famille_id)
          )
        `)
        .gte('date_reception', startDate)
        .lte('date_reception', endDate);

      const costAnalysis = this.calculateCostMetrics(receptions || []);

      const reportData = {
        summary: {
          total_cost: costAnalysis.totalCost,
          average_cost_per_order: costAnalysis.averageCostPerOrder,
          cost_by_supplier: costAnalysis.costBySupplier,
          cost_trend: costAnalysis.costTrend
        },
        cost_breakdown: {
          by_supplier: costAnalysis.costBySupplier,
          by_product_family: costAnalysis.costByFamily,
          by_month: costAnalysis.costByMonth
        },
        price_variations: costAnalysis.priceVariations
      };

      return {
        id: `cost-analysis-${Date.now()}`,
        type: 'cost_analysis',
        title: 'Analyse des coûts d\'approvisionnement',
        period: { start: startDate, end: endDate },
        data: reportData,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erreur génération rapport coûts:', error);
      throw error;
    }
  }

  /**
   * Exporte un rapport au format CSV
   */
  static exportToCSV(report: SupplyReport): string {
    let csv = '';
    
    // En-tête du rapport
    csv += `Rapport: ${report.title}\n`;
    csv += `Période: ${report.period.start} à ${report.period.end}\n`;
    csv += `Généré le: ${new Date(report.generated_at).toLocaleString('fr-FR')}\n\n`;

    // Contenu spécifique selon le type de rapport
    switch (report.type) {
      case 'stock_analysis':
        csv += this.formatStockAnalysisToCSV(report.data);
        break;
      case 'supplier_performance':
        csv += this.formatSupplierPerformanceToCSV(report.data);
        break;
      case 'cost_analysis':
        csv += this.formatCostAnalysisToCSV(report.data);
        break;
    }

    return csv;
  }

  /**
   * Exporte un rapport au format Excel
   */
  static exportToExcel(report: SupplyReport): Blob {
    // Implémentation simplifiée - dans un vraie app, utiliser une librairie comme xlsx
    const csvContent = this.exportToCSV(report);
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }

  private static calculateStockMetrics(products: any[]) {
    let lowStockCount = 0;
    let overstockCount = 0;
    let totalValue = 0;
    const productAnalysis = [];

    for (const product of products) {
      const stockActuel = (product as any).lots?.reduce(
        (sum: number, lot: any) => sum + lot.quantite_restante, 0
      ) || 0;
      
      const valeurStock = (product as any).lots?.reduce(
        (sum: number, lot: any) => sum + (lot.quantite_restante * lot.prix_achat_unitaire), 0
      ) || 0;

      totalValue += valeurStock;

      const stockMin = (product as any).stock_minimum || 0;
      const stockMax = (product as any).stock_maximum || stockMin * 2;

      if (stockActuel <= stockMin) lowStockCount++;
      if (stockActuel >= stockMax) overstockCount++;

      productAnalysis.push({
        nom_produit: (product as any).nom_produit,
        stock_actuel: stockActuel,
        stock_minimum: stockMin,
        stock_maximum: stockMax,
        valeur_stock: valeurStock,
        statut: stockActuel <= stockMin ? 'Faible' : stockActuel >= stockMax ? 'Excès' : 'Normal'
      });
    }

    return {
      lowStockCount,
      overstockCount,
      totalValue,
      productAnalysis
    };
  }

  private static calculateMovementMetrics(movements: any[]) {
    const byType: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    const productMovements: Record<string, number> = {};

    for (const movement of movements) {
      // Par type
      byType[movement.type_mouvement] = (byType[movement.type_mouvement] || 0) + 1;

      // Par date
      const date = new Date(movement.date_mouvement).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + Math.abs(movement.quantite);

      // Par produit
      const produit = (movement as any).produits?.nom_produit || 'Inconnu';
      productMovements[produit] = (productMovements[produit] || 0) + Math.abs(movement.quantite);
    }

    // Top produits les plus mouvementés
    const topProducts = Object.entries(productMovements)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([nom, quantite]) => ({ nom_produit: nom, quantite_totale: quantite }));

    return { byType, byDate, topProducts };
  }

  private static calculateSupplierMetrics(orders: any[]) {
    const supplierMetrics = new Map();

    for (const order of orders) {
      const supplierId = order.fournisseur_id;
      const supplierName = (order as any).fournisseurs?.nom || 'Inconnu';

      if (!supplierMetrics.has(supplierId)) {
        supplierMetrics.set(supplierId, {
          fournisseur_id: supplierId,
          nom_fournisseur: supplierName,
          total_commandes: 0,
          commandes_livrees: 0,
          delais_livraison: [],
          montant_total: 0
        });
      }

      const metrics = supplierMetrics.get(supplierId);
      metrics.total_commandes++;

      if (order.statut === 'Livré') {
        metrics.commandes_livrees++;
        
        // Calculer délai si réception existe
        const reception = (order as any).receptions_fournisseurs?.[0];
        if (reception && order.date_commande) {
          const delai = Math.ceil(
            (new Date(reception.date_reception).getTime() - new Date(order.date_commande).getTime()) 
            / (1000 * 3600 * 24)
          );
          metrics.delais_livraison.push(delai);
        }
      }

      // Calculer montant
      const montant = (order as any).lignes_commande_fournisseur?.reduce(
        (sum: number, ligne: any) => sum + (ligne.quantite_commandee * (ligne.prix_achat_unitaire_attendu || 0)), 0
      ) || 0;
      metrics.montant_total += montant;
    }

    return Array.from(supplierMetrics.values()).map(metrics => ({
      ...metrics,
      taux_livraison: metrics.total_commandes > 0 ? (metrics.commandes_livrees / metrics.total_commandes) * 100 : 0,
      delai_moyen: metrics.delais_livraison.length > 0 ? 
        metrics.delais_livraison.reduce((a: number, b: number) => a + b, 0) / metrics.delais_livraison.length : 0
    })).sort((a, b) => b.taux_livraison - a.taux_livraison);
  }

  private static calculateCostMetrics(receptions: any[]) {
    let totalCost = 0;
    const costBySupplier: Record<string, number> = {};
    const costByFamily: Record<string, number> = {};
    const costByMonth: Record<string, number> = {};
    const priceVariations: any[] = [];

    for (const reception of receptions) {
      const supplierName = (reception as any).fournisseurs?.nom || 'Inconnu';
      const month = new Date(reception.date_reception).toISOString().slice(0, 7);

      for (const lot of (reception as any).lots || []) {
        const cost = lot.quantite_initiale * lot.prix_achat_unitaire;
        totalCost += cost;

        // Par fournisseur
        costBySupplier[supplierName] = (costBySupplier[supplierName] || 0) + cost;

        // Par famille
        const family = (lot as any).produits?.famille_id || 'Autres';
        costByFamily[family] = (costByFamily[family] || 0) + cost;

        // Par mois
        costByMonth[month] = (costByMonth[month] || 0) + cost;
      }
    }

    return {
      totalCost,
      averageCostPerOrder: receptions.length > 0 ? totalCost / receptions.length : 0,
      costBySupplier: Object.entries(costBySupplier).map(([nom, montant]) => ({ nom, montant })),
      costByFamily: Object.entries(costByFamily).map(([famille, montant]) => ({ famille, montant })),
      costByMonth: Object.entries(costByMonth).map(([mois, montant]) => ({ mois, montant })),
      costTrend: this.calculateCostTrend(costByMonth),
      priceVariations
    };
  }

  private static calculateOverallAverageDeliveryTime(suppliers: any[]): number {
    const allDelays = suppliers.flatMap(s => s.delais_livraison || []);
    return allDelays.length > 0 ? allDelays.reduce((a, b) => a + b, 0) / allDelays.length : 0;
  }

  private static calculateDeliveryTrends(orders: any[]) {
    // Implémentation simplifiée des tendances de livraison
    return orders.reduce((trends: any, order) => {
      const month = new Date(order.date_commande).toISOString().slice(0, 7);
      trends[month] = (trends[month] || 0) + 1;
      return trends;
    }, {});
  }

  private static calculateOrderStatusDistribution(orders: any[]) {
    return orders.reduce((dist: any, order) => {
      dist[order.statut] = (dist[order.statut] || 0) + 1;
      return dist;
    }, {});
  }

  private static calculateCostTrend(costByMonth: Record<string, number>) {
    const months = Object.keys(costByMonth).sort();
    if (months.length < 2) return 'stable';
    
    const firstMonth = costByMonth[months[0]];
    const lastMonth = costByMonth[months[months.length - 1]];
    const change = ((lastMonth - firstMonth) / firstMonth) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private static formatStockAnalysisToCSV(data: any): string {
    let csv = 'ANALYSE DES STOCKS\n';
    csv += `Produits,Niveau de stock,Valeur totale\n`;
    
    for (const product of data.stock_levels || []) {
      csv += `${product.nom_produit},${product.statut},${product.valeur_stock}\n`;
    }
    
    return csv;
  }

  private static formatSupplierPerformanceToCSV(data: any): string {
    let csv = 'PERFORMANCE FOURNISSEURS\n';
    csv += `Fournisseur,Commandes,Taux livraison,Délai moyen\n`;
    
    for (const supplier of data.supplier_performance || []) {
      csv += `${supplier.nom_fournisseur},${supplier.total_commandes},${supplier.taux_livraison}%,${supplier.delai_moyen} jours\n`;
    }
    
    return csv;
  }

  private static formatCostAnalysisToCSV(data: any): string {
    let csv = 'ANALYSE DES COÛTS\n';
    csv += `Fournisseur,Montant total\n`;
    
    for (const cost of data.cost_breakdown?.by_supplier || []) {
      csv += `${cost.nom},${cost.montant}\n`;
    }
    
    return csv;
  }
}