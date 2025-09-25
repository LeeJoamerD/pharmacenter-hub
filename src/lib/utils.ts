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
