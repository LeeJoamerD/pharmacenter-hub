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

export function calculateFinancials(
  sousTotalHT: number,
  tauxTVA: number,
  tauxCentimeAdditionnel: number
): FinancialCalculations {
  const tva = sousTotalHT * (tauxTVA / 100);
  const centimeAdditionnel = tva * (tauxCentimeAdditionnel / 100);
  const totalTTC = sousTotalHT + tva + centimeAdditionnel;
  
  return {
    sousTotalHT,
    tva,
    centimeAdditionnel,
    totalTTC
  };
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
