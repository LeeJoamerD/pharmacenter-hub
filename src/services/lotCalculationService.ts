/**
 * Service de calculs et logique métier pour la gestion des lots
 * Centralise tous les calculs complexes liés aux lots
 */

export interface LotCalculationResult {
  value: number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  message?: string;
}

export interface RotationAnalysis {
  rotationRate: number;
  averageStayDays: number;
  classification: 'fast' | 'medium' | 'slow' | 'very_slow';
  recommendation: string;
}

export interface FIFOAnalysis {
  isCompliant: boolean;
  deviationDays: number;
  suggestedLot?: string;
  potentialLoss?: number;
}

export interface ExpirationRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysToExpiration: number;
  recommendedActions: string[];
  estimatedLoss?: number;
}

export class LotCalculationService {
  
  /**
   * Calcule le taux de rotation d'un lot
   */
  static calculateRotationRate(
    initialQuantity: number,
    currentQuantity: number,
    daysInStock: number
  ): RotationAnalysis {
    const usedQuantity = initialQuantity - currentQuantity;
    const dailyUsage = usedQuantity / Math.max(daysInStock, 1);
    const rotationRate = (dailyUsage * 365) / initialQuantity; // Rotation annuelle
    
    let classification: RotationAnalysis['classification'];
    let recommendation: string;
    
    if (rotationRate >= 12) {
      classification = 'fast';
      recommendation = 'Produit à rotation rapide - Surveiller les ruptures de stock';
    } else if (rotationRate >= 6) {
      classification = 'medium';
      recommendation = 'Rotation normale - Maintenir les niveaux actuels';
    } else if (rotationRate >= 2) {
      classification = 'slow';
      recommendation = 'Rotation lente - Considérer une réduction des commandes';
    } else {
      classification = 'very_slow';
      recommendation = 'Rotation très lente - Revoir la stratégie d\'achat';
    }
    
    const averageStayDays = currentQuantity > 0 ? (currentQuantity / Math.max(dailyUsage, 0.1)) : 0;
    
    return {
      rotationRate: Math.round(rotationRate * 100) / 100,
      averageStayDays: Math.round(averageStayDays),
      classification,
      recommendation
    };
  }
  
  /**
   * Analyse le respect de la règle FIFO
   */
  static analyzeFIFOCompliance(
    selectedLotDate: Date,
    oldestLotDate: Date,
    tolerance: number = 7
  ): FIFOAnalysis {
    const daysDifference = Math.floor(
      (selectedLotDate.getTime() - oldestLotDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const isCompliant = daysDifference <= tolerance;
    
    return {
      isCompliant,
      deviationDays: Math.max(0, daysDifference),
      suggestedLot: !isCompliant ? 'oldest_available' : undefined,
      potentialLoss: !isCompliant ? daysDifference * 0.1 : undefined // Estimation
    };
  }
  
  /**
   * Évalue le risque d'expiration
   */
  static assessExpirationRisk(
    expirationDate: Date,
    currentQuantity: number,
    averageDailySales: number,
    productValue: number
  ): ExpirationRisk {
    const today = new Date();
    const daysToExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const daysToSellOut = averageDailySales > 0 ? currentQuantity / averageDailySales : Infinity;
    
    let riskLevel: ExpirationRisk['riskLevel'];
    let recommendedActions: string[];
    let estimatedLoss = 0;
    
    if (daysToExpiration <= 0) {
      riskLevel = 'critical';
      recommendedActions = [
        'Retrait immédiat du stock',
        'Destruction selon protocole',
        'Investigation des causes'
      ];
      estimatedLoss = currentQuantity * productValue;
    } else if (daysToExpiration <= 7 || daysToSellOut > daysToExpiration) {
      riskLevel = 'high';
      recommendedActions = [
        'Promotion urgente',
        'Vente prioritaire',
        'Contact fournisseur pour retour'
      ];
      if (daysToSellOut > daysToExpiration) {
        const unsoldQuantity = Math.max(0, currentQuantity - (daysToExpiration * averageDailySales));
        estimatedLoss = unsoldQuantity * productValue * 0.8; // 80% de perte
      }
    } else if (daysToExpiration <= 30) {
      riskLevel = 'medium';
      recommendedActions = [
        'Surveillance renforcée',
        'Promotion préventive',
        'Ajustement des commandes futures'
      ];
    } else {
      riskLevel = 'low';
      recommendedActions = ['Surveillance normale'];
    }
    
    return {
      riskLevel,
      daysToExpiration,
      recommendedActions,
      estimatedLoss: estimatedLoss > 0 ? Math.round(estimatedLoss * 100) / 100 : undefined
    };
  }
  
  /**
   * Calcule la valeur du stock d'un lot
   */
  static calculateStockValue(
    quantity: number,
    unitCost: number,
    method: 'fifo' | 'lifo' | 'average' = 'fifo'
  ): LotCalculationResult {
    const value = quantity * unitCost;
    
    return {
      value: Math.round(value * 100) / 100,
      unit: 'FCFA',
      status: value > 0 ? 'normal' : 'warning'
    };
  }
  
  /**
   * Calcule le pourcentage d'utilisation d'un lot
   */
  static calculateUsagePercentage(
    initialQuantity: number,
    currentQuantity: number
  ): LotCalculationResult {
    const usagePercentage = ((initialQuantity - currentQuantity) / initialQuantity) * 100;
    
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (usagePercentage >= 90) status = 'critical';
    else if (usagePercentage >= 70) status = 'warning';
    
    return {
      value: Math.round(usagePercentage * 100) / 100,
      unit: '%',
      status
    };
  }
  
  /**
   * Calcule les jours restants avant expiration
   */
  static calculateDaysToExpiration(expirationDate: Date): LotCalculationResult {
    const today = new Date();
    const daysToExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (daysToExpiration <= 0) status = 'critical';
    else if (daysToExpiration <= 7) status = 'critical';
    else if (daysToExpiration <= 30) status = 'warning';
    
    return {
      value: daysToExpiration,
      unit: 'jours',
      status
    };
  }
  
  /**
   * Détermine la priorité de vente d'un lot
   */
  static calculateSalePriority(
    daysToExpiration: number,
    quantity: number,
    averageDailySales: number,
    fifoPosition: number
  ): LotCalculationResult {
    let priority = 0;
    
    // Facteur expiration (0-40 points)
    if (daysToExpiration <= 0) priority += 40;
    else if (daysToExpiration <= 7) priority += 35;
    else if (daysToExpiration <= 30) priority += 25;
    else if (daysToExpiration <= 90) priority += 15;
    else priority += 5;
    
    // Facteur FIFO (0-30 points)
    priority += Math.max(0, 30 - (fifoPosition * 5));
    
    // Facteur quantité vs ventes (0-30 points)
    const daysToSellOut = averageDailySales > 0 ? quantity / averageDailySales : Infinity;
    if (daysToSellOut > daysToExpiration && daysToExpiration > 0) {
      priority += 30;
    } else if (daysToSellOut > daysToExpiration * 0.8) {
      priority += 20;
    } else {
      priority += 10;
    }
    
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (priority >= 80) status = 'critical';
    else if (priority >= 60) status = 'warning';
    
    return {
      value: Math.min(100, priority),
      unit: 'points',
      status,
      message: status === 'critical' ? 'Vente prioritaire urgente' :
               status === 'warning' ? 'Vente prioritaire' : 'Vente normale'
    };
  }
  
  /**
   * Calcule les métriques de performance d'un lot
   */
  static calculateLotPerformanceMetrics(
    initialQuantity: number,
    currentQuantity: number,
    daysInStock: number,
    targetRotation: number = 6
  ) {
    const usagePercentage = this.calculateUsagePercentage(initialQuantity, currentQuantity);
    const rotationAnalysis = this.calculateRotationRate(initialQuantity, currentQuantity, daysInStock);
    
    const performanceScore = (
      (usagePercentage.value * 0.3) +
      (Math.min(rotationAnalysis.rotationRate / targetRotation, 1) * 70)
    );
    
    return {
      usagePercentage,
      rotationAnalysis,
      performanceScore: Math.round(performanceScore * 100) / 100,
      classification: performanceScore >= 80 ? 'excellent' :
                      performanceScore >= 60 ? 'good' :
                      performanceScore >= 40 ? 'average' : 'poor'
    };
  }
  
  /**
   * Prédit la date de rupture de stock
   */
  static predictStockoutDate(
    currentQuantity: number,
    averageDailySales: number,
    variationCoefficient: number = 0.2
  ): Date | null {
    if (averageDailySales <= 0 || currentQuantity <= 0) return null;
    
    // Prendre en compte la variation des ventes
    const adjustedDailySales = averageDailySales * (1 + variationCoefficient);
    const daysUntilStockout = currentQuantity / adjustedDailySales;
    
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysUntilStockout));
    
    return stockoutDate;
  }
  
  /**
   * Calcule le coût de possession du stock
   */
  static calculateCarryingCost(
    stockValue: number,
    carryingCostRate: number = 0.15, // 15% par an par défaut
    daysInStock: number
  ): LotCalculationResult {
    const annualCarryingCost = stockValue * carryingCostRate;
    const dailyCarryingCost = annualCarryingCost / 365;
    const totalCarryingCost = dailyCarryingCost * daysInStock;
    
    return {
      value: Math.round(totalCarryingCost * 100) / 100,
      unit: 'FCFA',
      status: 'normal'
    };
  }
}