/**
 * Fonctions utilitaires pour le formatage des montants multi-devises
 * À utiliser dans les utilitaires de génération de documents (PDF, tickets, etc.)
 * 
 * Ces fonctions sont indépendantes des hooks React pour pouvoir être utilisées
 * dans des contextes non-React (génération de PDF, etc.)
 */

// Devises sans décimales (Franc CFA zones CEMAC et UEMOA)
const NO_DECIMAL_CURRENCIES = ['XAF', 'XOF', 'FCFA'];

/**
 * Formate un montant avec le symbole de devise
 * Utilise l'espace comme séparateur de milliers (format français)
 * - XAF/XOF/FCFA : arrondi, sans décimales (ex: "7 441 FCFA")
 * - EUR/USD/autres : 2 décimales (ex: "1 234,56 EUR")
 */
export const formatCurrencyAmount = (
  amount: number, 
  currencySymbol: string = 'FCFA'
): string => {
  const validAmount = Number(amount) || 0;
  const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(currencySymbol) || 
                      NO_DECIMAL_CURRENCIES.includes(currencySymbol.toUpperCase());
  
  if (isNoDecimal) {
    return `${Math.round(validAmount).toLocaleString('fr-FR')} ${currencySymbol}`;
  }
  
  return `${validAmount.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} ${currencySymbol}`;
};

/**
 * Formate un nombre sans symbole de devise avec séparateurs de milliers
 * - XAF/XOF/FCFA : arrondi, sans décimales (ex: "7 441")
 * - EUR/USD/autres : 2 décimales (ex: "1 234,56")
 */
export const formatNumber = (
  amount: number, 
  currencyCode: string = 'XAF'
): string => {
  const validAmount = Number(amount) || 0;
  const isNoDecimal = NO_DECIMAL_CURRENCIES.includes(currencyCode) ||
                      NO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase());
  
  if (isNoDecimal) {
    return Math.round(validAmount).toLocaleString('fr-FR');
  }
  
  return validAmount.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

/**
 * Vérifie si une devise est sans décimales
 */
export const isNoDecimalCurrency = (currencyCode: string): boolean => {
  return NO_DECIMAL_CURRENCIES.includes(currencyCode) ||
         NO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase());
};
