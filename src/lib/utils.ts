import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FinancialCalculations {
  sousTotalHT: number;
  tva: number;
  centimeAdditionnel: number;
  totalTTC: number;
}

/**
 * Calcule les montants financiers (TVA, Centime Additionnel, TTC)
 * 
 * FORMULES OFFICIELLES:
 * - Montant TVA = sousTotalHT × (tauxTVA / 100)
 * - Montant Centime = Montant TVA × (tauxCentimeAdditionnel / 100)
 * - Total TTC = sousTotalHT + Montant TVA + Montant Centime
 * 
 * @param sousTotalHT - Sous-total hors taxes
 * @param tauxTVA - Taux de TVA en pourcentage (ex: 19.25)
 * @param tauxCentimeAdditionnel - Taux du centime additionnel en pourcentage (ex: 0.175)
 */
export function calculateFinancials(
  sousTotalHT: number,
  tauxTVA: number,
  tauxCentimeAdditionnel: number
): FinancialCalculations {
  // Validation des entrées
  const validHT = Number(sousTotalHT) || 0;
  const validTauxTVA = Number(tauxTVA) || 0;
  const validTauxCentime = Number(tauxCentimeAdditionnel) || 0;

  // Calcul TVA
  const tva = validHT * (validTauxTVA / 100);
  
  // Calcul Centime Additionnel (sur la TVA, pas sur le HT)
  const centimeAdditionnel = tva * (validTauxCentime / 100);
  
  // Total TTC
  const totalTTC = validHT + tva + centimeAdditionnel;
  
  return {
    sousTotalHT: validHT,
    tva,
    centimeAdditionnel,
    totalTTC
  };
}

/**
 * Arrondit un montant au multiple de précision spécifié
 * 
 * @param value - Valeur à arrondir
 * @param precision - Multiple d'arrondi (ex: 25 pour arrondir au multiple de 25)
 * @param method - Méthode d'arrondi: 'ceil' (supérieur), 'floor' (inférieur), 'round' (proche)
 * 
 * @example
 * roundToNearest(1677, 25, 'ceil') // => 1700
 * roundToNearest(1677, 25, 'round') // => 1675
 * roundToNearest(1677, 25, 'floor') // => 1675
 */
export function roundToNearest(
  value: number, 
  precision: number, 
  method: 'ceil' | 'floor' | 'round' = 'ceil'
): number {
  const validValue = Number(value) || 0;
  const validPrecision = Number(precision) || 1;
  
  if (validPrecision <= 1) {
    return Math.round(validValue);
  }
  
  switch (method) {
    case 'ceil':
      return Math.ceil(validValue / validPrecision) * validPrecision;
    case 'floor':
      return Math.floor(validValue / validPrecision) * validPrecision;
    case 'round':
    default:
      return Math.round(validValue / validPrecision) * validPrecision;
  }
}

/**
 * Formate un nombre avec séparateurs de milliers (format français)
 */
export function formatWithThousandSeparator(value: number, decimals: number = 0): string {
  const validValue = Number(value) || 0;
  return validValue.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Logique en cascade pour les seuils de stock
 * 1. Priorité aux valeurs du produit
 * 2. Si non renseignées, utiliser les valeurs de alert_settings
 * 3. Si non renseignées, utiliser les valeurs par défaut
 */
export function getStockThreshold(
  type: 'low' | 'critical' | 'maximum',
  productValue: number | null | undefined,
  settingsValue: number | undefined
): number {
  const defaults = {
    low: 10,
    critical: 5,
    maximum: 100
  };
  
  // 1. Priorité au produit si défini et valide
  if (productValue !== null && productValue !== undefined && productValue > 0) {
    return productValue;
  }
  
  // 2. Sinon, utiliser les paramètres utilisateur si définis
  if (settingsValue !== undefined && settingsValue > 0) {
    return settingsValue;
  }
  
  // 3. Sinon, valeur par défaut
  return defaults[type];
}
