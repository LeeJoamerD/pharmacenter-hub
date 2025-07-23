import React, { createContext, useContext, ReactNode } from 'react';
import { useSystemSettings, SystemSettings, Currency, Timezone, Language } from '@/hooks/useSystemSettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

type SystemSettingsContextType = {
  settings: SystemSettings | null;
  loading: boolean;
  saving: boolean;
  saveSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  refetch: () => Promise<void>;
  
  // Fonctions d'aide pour l'intégration
  applyCurrencySettings: () => void;
  applyLanguageSettings: () => void;
  getCurrentCurrency: () => Currency | undefined;
  getCurrentTimezone: () => Timezone | undefined;
  getCurrentLanguage: () => Language | undefined;
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const { settings, loading, saving, saveSettings, updateSettings, refetch } = useSystemSettings();
  const { changeCurrency, currencies } = useCurrency();
  const { changeLanguage, languages } = useLanguage();
  const { pharmacy } = useAuth();

  // Appliquer les paramètres de devise au contexte Currency
  const applyCurrencySettings = () => {
    if (!settings) return;
    
    const systemCurrency = getCurrentCurrency();
    if (systemCurrency) {
      // Convertir le format système vers le format CurrencyContext
      const currencyForContext = {
        code: systemCurrency.code,
        name: systemCurrency.name,
        symbol: systemCurrency.symbol,
        rate: systemCurrency.rate
      };
      
      // Vérifier si cette devise existe dans le contexte Currency
      const existingCurrency = currencies.find(c => c.code === systemCurrency.code);
      if (existingCurrency) {
        changeCurrency(existingCurrency);
      }
    }
  };

  // Appliquer les paramètres de langue au contexte Language
  const applyLanguageSettings = () => {
    if (!settings) return;
    
    const systemLanguage = getCurrentLanguage();
    if (systemLanguage) {
      // Convertir le format système vers le format LanguageContext
      const languageForContext = {
        code: systemLanguage.code,
        name: systemLanguage.name,
        flag: systemLanguage.flag
      };
      
      // Vérifier si cette langue existe dans le contexte Language
      const existingLanguage = languages.find(l => l.code === systemLanguage.code);
      if (existingLanguage) {
        changeLanguage(existingLanguage);
      }
    }
  };

  // Obtenir la devise actuelle depuis les paramètres système
  const getCurrentCurrency = (): Currency | undefined => {
    if (!settings) return undefined;
    return settings.currencies_available.find(c => c.code === settings.default_currency);
  };

  // Obtenir le fuseau horaire actuel depuis les paramètres système
  const getCurrentTimezone = (): Timezone | undefined => {
    if (!settings) return undefined;
    return settings.timezones_available.find(t => t.code === settings.default_timezone);
  };

  // Obtenir la langue actuelle depuis les paramètres système
  const getCurrentLanguage = (): Language | undefined => {
    if (!settings) return undefined;
    return settings.languages_available.find(l => l.code === settings.default_language);
  };

  // Fonction de sauvegarde étendue qui applique les changements aux autres contextes
  const saveSettingsWithSync = async (updates: Partial<SystemSettings>) => {
    await saveSettings(updates);
    
    // Appliquer les changements aux contextes si les paramètres système ont changé
    if (updates.default_currency) {
      applyCurrencySettings();
    }
    if (updates.default_language) {
      applyLanguageSettings();
    }
  };

  const value: SystemSettingsContextType = {
    settings,
    loading,
    saving,
    saveSettings: saveSettingsWithSync,
    updateSettings,
    refetch,
    applyCurrencySettings,
    applyLanguageSettings,
    getCurrentCurrency,
    getCurrentTimezone,
    getCurrentLanguage,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettingsContext() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettingsContext must be used within a SystemSettingsProvider');
  }
  return context;
}