/**
 * Utilitaire centralisé pour la gestion des seuils de stock
 * Implémente la logique de cascade : Produit > Settings > Défaut
 */

export interface StockThresholds {
  critique: number;
  faible: number;
  limite: number;
}

export interface ProductThresholds {
  stock_critique?: number | null;
  stock_faible?: number | null;
  stock_limite?: number | null;
}

export interface AlertSettings {
  critical_stock_threshold?: number;
  low_stock_threshold?: number;
  maximum_stock_threshold?: number;
}

/**
 * Récupère les seuils de stock avec la logique de cascade
 * Priorité : 1. Produit, 2. Settings utilisateur, 3. Défaut système
 */
/**
 * Helper pour ignorer 0 comme valeur invalide (équivalent NULLIF en SQL)
 */
const nullIfZero = (value: number | null | undefined): number | undefined => {
  return (value !== null && value !== undefined && value > 0) ? value : undefined;
};

/**
 * Récupère les seuils de stock avec la logique de cascade
 * Priorité : 1. Produit (si > 0), 2. Settings utilisateur, 3. Défaut système
 */
export function getStockThresholds(
  product: ProductThresholds,
  settings?: AlertSettings
): StockThresholds {
  const DEFAULT_CRITIQUE = 2;
  const DEFAULT_FAIBLE = 5;
  const DEFAULT_LIMITE = 10;

  return {
    critique: nullIfZero(product.stock_critique) ?? settings?.critical_stock_threshold ?? DEFAULT_CRITIQUE,
    faible: nullIfZero(product.stock_faible) ?? settings?.low_stock_threshold ?? DEFAULT_FAIBLE,
    limite: nullIfZero(product.stock_limite) ?? settings?.maximum_stock_threshold ?? DEFAULT_LIMITE,
  };
}

/**
 * Calcule le statut du stock selon les seuils
 */
export function calculateStockStatus(
  currentStock: number,
  thresholds: StockThresholds
): 'rupture' | 'critique' | 'faible' | 'normal' | 'surstock' {
  // Validation des seuils
  if (!thresholds || typeof thresholds.critique !== 'number') {
    console.error('[calculateStockStatus] Invalid thresholds:', thresholds);
    throw new Error('Invalid thresholds provided to calculateStockStatus');
  }

  if (currentStock === 0) {
    return 'rupture';
  }
  
  if (currentStock > 0 && currentStock <= thresholds.critique) {
    return 'critique';
  }
  
  if (currentStock > thresholds.critique && currentStock <= thresholds.faible) {
    return 'faible';
  }
  
  if (currentStock > thresholds.faible && currentStock <= thresholds.limite) {
    return 'normal';
  }
  
  return 'surstock';
}

/**
 * Détermine la rotation d'un produit selon son stock et ses seuils
 */
export function calculateRotation(
  currentStock: number,
  thresholds: StockThresholds
): 'rapide' | 'normale' | 'lente' {
  if (currentStock <= thresholds.faible) {
    return 'rapide';
  }
  
  if (currentStock <= thresholds.limite) {
    return 'normale';
  }
  
  return 'lente';
}

/**
 * Calcule le niveau d'urgence pour une alerte
 */
export function calculateUrgencyLevel(
  currentStock: number,
  thresholds: StockThresholds
): 'info' | 'warning' | 'danger' | 'critical' {
  const status = calculateStockStatus(currentStock, thresholds);
  
  switch (status) {
    case 'rupture':
      return 'critical';
    case 'critique':
      return 'danger';
    case 'faible':
      return 'warning';
    case 'surstock':
      return 'warning';
    default:
      return 'info';
  }
}
