/**
 * Fonctions utilitaires pour le formatage des montants multi-devises
 * À utiliser dans les utilitaires de génération de documents (PDF, tickets, etc.)
 * 
 * Ces fonctions sont indépendantes des hooks React pour pouvoir être utilisées
 * dans des contextes non-React (génération de PDF, etc.)
 */

import { DEFAULT_SETTINGS } from '@/config/defaultSettings';

// Devises sans décimales (depuis configuration centralisée)
const NO_DECIMAL_CURRENCIES = DEFAULT_SETTINGS.currency.noDecimalCurrencies;

/**
 * Normalise les espaces pour compatibilité PDF (jsPDF)
 * Remplace les espaces insécables Unicode (U+202F, U+00A0) par des espaces ASCII standard
 * Cela évite que jsPDF affiche "/" au lieu d'espaces
 */
const normalizePdfSpaces = (str: string): string => {
  return str.replace(/[\u202F\u00A0]/g, ' ');
};

/**
 * Formate un montant avec le symbole de devise
 * Utilise l'espace comme séparateur de milliers (format français)
 * - XAF/XOF/FCFA : arrondi, sans décimales (ex: "7 441 FCFA")
 * - EUR/USD/autres : 2 décimales (ex: "1 234,56 EUR")
 */
export const formatCurrencyAmount = (
  amount: number, 
  currencySymbol: string = DEFAULT_SETTINGS.currency.symbol
): string => {
  const validAmount = Number(amount) || 0;
  const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(currencySymbol) || 
                      NO_DECIMAL_CURRENCIES.includes(currencySymbol.toUpperCase());
  
  if (isNoDecimal) {
    const formatted = normalizePdfSpaces(Math.round(validAmount).toLocaleString('fr-FR'));
    return `${formatted} ${currencySymbol}`;
  }
  
  const formatted = normalizePdfSpaces(validAmount.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }));
  return `${formatted} ${currencySymbol}`;
};

/**
 * Formate un nombre sans symbole de devise avec séparateurs de milliers
 * - XAF/XOF/FCFA : arrondi, sans décimales (ex: "7 441")
 * - EUR/USD/autres : 2 décimales (ex: "1 234,56")
 */
export const formatNumber = (
  amount: number, 
  currencyCode: string = DEFAULT_SETTINGS.currency.code
): string => {
  const validAmount = Number(amount) || 0;
  const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(currencyCode) ||
                      NO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase());
  
  if (isNoDecimal) {
    return normalizePdfSpaces(Math.round(validAmount).toLocaleString('fr-FR'));
  }
  
  return normalizePdfSpaces(validAmount.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }));
};

/**
 * Vérifie si une devise est sans décimales
 */
export const isNoDecimalCurrency = (currencyCode: string): boolean => {
  return NO_DECIMAL_CURRENCIES.includes(currencyCode) ||
         NO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase());
};
