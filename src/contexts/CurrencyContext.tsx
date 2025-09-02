
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Taux de conversion par rapport au XAF
};

const currencies: Currency[] = [
  { code: 'XAF', name: 'Franc CFA', symbol: 'FCFA', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.00152 },
  { code: 'USD', name: 'Dollar US', symbol: '$', rate: 0.00166 },
];

type CurrencyContextType = {
  currentCurrency: Currency;
  currencies: Currency[];
  changeCurrency: (currency: Currency, showToast?: boolean) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number, fromCurrency?: Currency) => number;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferredCurrency');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && currencies.find(c => c.code === parsed.code)) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse stored currency', e);
        }
      }
    }
    return currencies[0]; // Default to XAF (Franc CFA)
  });

  const changeCurrency = (currency: Currency, showToast: boolean = true) => {
    setCurrentCurrency(currency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredCurrency', JSON.stringify(currency));
    }
    if (showToast) {
      toast({
        title: "Devise modifiée",
        description: `La devise a été changée en ${currency.name} (${currency.code})`,
      });
    }
  };

  const formatPrice = (amount: number): string => {
    const convertedAmount = (amount * currentCurrency.rate).toFixed(2);
    // For XAF, don't show decimal places as they're rarely used
    const formattedAmount = currentCurrency.code === 'XAF' 
      ? Math.round(parseFloat(convertedAmount)).toString()
      : convertedAmount;
    
    return `${formattedAmount} ${currentCurrency.symbol}`;
  };

  const convertPrice = (amount: number, fromCurrency?: Currency): number => {
    const from = fromCurrency || currencies[0]; // Default from XAF if not specified
    return amount * (currentCurrency.rate / from.rate);
  };

  return (
    <CurrencyContext.Provider value={{
      currentCurrency,
      currencies,
      changeCurrency,
      formatPrice,
      convertPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
