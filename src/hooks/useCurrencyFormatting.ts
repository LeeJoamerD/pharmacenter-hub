/**
 * Hook centralisé pour le formatage des montants multi-devises
 * Respecte les paramètres régionaux (pas de décimales pour XAF/XOF/FCFA)
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
   * Formate un montant selon la devise courante
   * - XAF/XOF/FCFA : arrondi, sans décimales
   * - EUR/USD/autres : 2 décimales
   */
  const formatAmount = (amount: number): string => {
    const symbol = regionalCurrency || currentCurrency?.symbol || 'FCFA';
    
    if (checkIsNoDecimalCurrency()) {
      // Arrondir et formater sans décimales pour le Franc CFA
      return `${Math.round(amount).toLocaleString('fr-FR')} ${symbol}`;
    }
    
    // Autres devises avec 2 décimales
    return `${amount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} ${symbol}`;
  };

  /**
   * Formate un nombre SANS le symbole de devise
   * Utile pour les champs de saisie readonly
   * - XAF/XOF/FCFA : arrondi, sans décimales
   * - EUR/USD/autres : 2 décimales
   */
  const formatNumber = (amount: number): string => {
    if (checkIsNoDecimalCurrency()) {
      return Math.round(amount).toLocaleString('fr-FR');
    }
    return amount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  /**
   * Retourne uniquement le symbole de devise
   */
  const getCurrencySymbol = (): string => {
    return regionalCurrency || currentCurrency?.symbol || 'FCFA';
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
    getCurrencySymbol,
    getInputStep,
    isNoDecimalCurrency,
    currency: regionalCurrency || currentCurrency?.symbol || 'FCFA'
  };
};
