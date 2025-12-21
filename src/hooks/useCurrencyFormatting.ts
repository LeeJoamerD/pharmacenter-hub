/**
 * Hook centralisé pour le formatage des montants multi-devises
 * Respecte les paramètres régionaux (pas de décimales pour XAF/XOF/FCFA)
 * 
 * IMPORTANT: Ce hook fournit les fonctions de formatage utilisées
 * dans toute l'application pour garantir la cohérence.
 */
import { useRegionalSettings } from './useRegionalSettings';
import { useCurrency } from '@/contexts/CurrencyContext';

// Devises sans décimales (Franc CFA zones CEMAC et UEMOA)
const NO_DECIMAL_CURRENCIES = ['XAF', 'XOF', 'FCFA'];

export const useCurrencyFormatting = () => {
  const { currency: regionalCurrency } = useRegionalSettings();
  const { currentCurrency } = useCurrency();

  /**
   * Vérifie si la devise courante est sans décimales
   */
  const checkIsNoDecimalCurrency = (): boolean => {
    const symbol = regionalCurrency || currentCurrency?.symbol || 'FCFA';
    const currencyCode = currentCurrency?.code || 'XAF';
    return NO_DECIMAL_CURRENCIES.includes(currencyCode) || 
           NO_DECIMAL_CURRENCIES.includes(symbol);
  };

  /**
   * Formate un montant selon la devise courante avec séparateurs de milliers
   * - XAF/XOF/FCFA : arrondi, sans décimales
   * - EUR/USD/autres : 2 décimales
   */
  const formatAmount = (amount: number): string => {
    const symbol = regionalCurrency || currentCurrency?.symbol || 'FCFA';
    const validAmount = Number(amount) || 0;
    
    if (checkIsNoDecimalCurrency()) {
      // Arrondir et formater sans décimales pour le Franc CFA
      return `${Math.round(validAmount).toLocaleString('fr-FR')} ${symbol}`;
    }
    
    // Autres devises avec 2 décimales
    return `${validAmount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} ${symbol}`;
  };

  /**
   * Formate un nombre SANS le symbole de devise avec séparateurs de milliers
   * Utile pour les champs de saisie readonly et affichage
   * - XAF/XOF/FCFA : arrondi, sans décimales
   * - EUR/USD/autres : 2 décimales
   */
  const formatNumber = (amount: number): string => {
    const validAmount = Number(amount) || 0;
    
    if (checkIsNoDecimalCurrency()) {
      return Math.round(validAmount).toLocaleString('fr-FR');
    }
    return validAmount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  /**
   * Formate un nombre entier (quantité) avec séparateurs de milliers
   * Toujours sans décimales, pour les quantités
   */
  const formatQuantity = (quantity: number): string => {
    const validQuantity = Math.round(Number(quantity) || 0);
    return validQuantity.toLocaleString('fr-FR');
  };

  /**
   * Formate un pourcentage avec le nombre de décimales spécifié
   */
  const formatPercentage = (value: number, decimals: number = 2): string => {
    const validValue = Number(value) || 0;
    return `${validValue.toFixed(decimals)} %`;
  };

  /**
   * Retourne uniquement le symbole de devise
   */
  const getCurrencySymbol = (): string => {
    return regionalCurrency || currentCurrency?.symbol || 'FCFA';
  };

  /**
   * Retourne le code de la devise
   */
  const getCurrencyCode = (): string => {
    return currentCurrency?.code || 'XAF';
  };

  /**
   * Retourne le step pour les inputs numériques
   * - XAF/XOF/FCFA : step="1" (entiers)
   * - EUR/USD/autres : step="0.01" (décimales)
   */
  const getInputStep = (): string => {
    return checkIsNoDecimalCurrency() ? '1' : '0.01';
  };

  /**
   * Vérifie si la devise courante est sans décimales (pour usage externe)
   */
  const isNoDecimalCurrency = (): boolean => {
    return checkIsNoDecimalCurrency();
  };

  return { 
    formatAmount, 
    formatNumber,
    formatQuantity,
    formatPercentage,
    getCurrencySymbol,
    getCurrencyCode,
    getInputStep,
    isNoDecimalCurrency,
    currency: regionalCurrency || currentCurrency?.symbol || 'FCFA'
  };
};
