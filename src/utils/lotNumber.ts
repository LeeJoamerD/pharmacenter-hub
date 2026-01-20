/**
 * Utilitaire centralisé pour la génération de numéros de lots uniques
 * Garantit l'unicité même lors d'imports massifs avec plusieurs lignes du même produit
 */

export interface LotGenerationParams {
  produitId: string;
  index: number;          // Index global de la ligne dans l'import
  productCounter: number; // Compteur spécifique à ce produit (0, 1, 2...)
  baseTimestamp?: number; // Timestamp de base (capturer une fois au début de l'import)
}

/**
 * Génère un numéro de lot unique avec le format:
 * LOT-{productCode}-{dateStr}-{uniqueSequence}
 * 
 * La séquence unique combine:
 * - 6 derniers chiffres du timestamp
 * - Index global sur 3 chiffres
 * - Compteur produit sur 2 chiffres
 */
export function generateAutoLotNumber(params: LotGenerationParams): string {
  const { produitId, index, productCounter, baseTimestamp = Date.now() } = params;
  
  // Extraire les 8 premiers caractères du produit_id en majuscules
  const productCode = produitId.slice(0, 8).toUpperCase();
  
  // Format date: YYMMDD
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  
  // Générer une séquence unique: timestamp + index global + compteur produit
  const uniqueSequence = `${baseTimestamp.toString().slice(-6)}${index.toString().padStart(3, '0')}${productCounter.toString().padStart(2, '0')}`;
  
  return `LOT-${productCode}-${dateStr}-${uniqueSequence}`;
}

/**
 * Génère un numéro de lot de fallback (utilisé quand l'auto-génération est désactivée mais qu'un lot est requis)
 */
export function generateFallbackLotNumber(produitId: string, index: number): string {
  return `LOT-${produitId.slice(0, 4)}-${Date.now()}-${index}`;
}

/**
 * Classe helper pour gérer les compteurs par produit lors d'un import
 */
export class LotNumberGenerator {
  private productCounters = new Map<string, number>();
  private baseTimestamp: number;
  
  constructor() {
    this.baseTimestamp = Date.now();
  }
  
  /**
   * Génère un numéro de lot unique pour une ligne d'import
   */
  generate(produitId: string, globalIndex: number): string {
    const currentCount = this.productCounters.get(produitId) || 0;
    this.productCounters.set(produitId, currentCount + 1);
    
    return generateAutoLotNumber({
      produitId,
      index: globalIndex,
      productCounter: currentCount,
      baseTimestamp: this.baseTimestamp
    });
  }
  
  /**
   * Réinitialise les compteurs (pour un nouvel import)
   */
  reset(): void {
    this.productCounters.clear();
    this.baseTimestamp = Date.now();
  }
}
