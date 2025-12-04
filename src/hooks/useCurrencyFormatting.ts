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
   * Formate un montant selon la devise courante
   * - XAF/XOF/FCFA : arrondi, sans décimales
   * - EUR/USD/autres : 2 décimales
   */
  const formatAmount = (amount: number): string => {
    const symbol = regionalCurrency || currentCurrency?.symbol || 'FCFA';
    const currencyCode = currentCurrency?.code || 'XAF';
    
    // Vérifier si c'est une devise sans décimales
    const isNoDecimalCurrency = NO_DECIMAL_CURRENCIES.includes(currencyCode) || 
                                 NO_DECIMAL_CURRENCIES.includes(symbol);
    
    if (isNoDecimalCurrency) {
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
   * Retourne uniquement le symbole de devise
   */
  const getCurrencySymbol = (): string => {
    return regionalCurrency || currentCurrency?.symbol || 'FCFA';
  };

  /**
   * Vérifie si la devise courante est sans décimales
   */
  const isNoDecimalCurrency = (): boolean => {
    const symbol = regionalCurrency || currentCurrency?.symbol || 'FCFA';
    const currencyCode = currentCurrency?.code || 'XAF';
    return NO_DECIMAL_CURRENCIES.includes(currencyCode) || 
           NO_DECIMAL_CURRENCIES.includes(symbol);
  };

  return { 
    formatAmount, 
    getCurrencySymbol,
    isNoDecimalCurrency,
    currency: regionalCurrency || currentCurrency?.symbol || 'FCFA'
  };
};
