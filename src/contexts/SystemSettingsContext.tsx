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
  applyInterfaceSettings: () => void;
  getCurrentCurrency: () => Currency | undefined;
  getCurrentTimezone: () => Timezone | undefined;
  getCurrentLanguage: () => Language | undefined;
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const { settings, loading, saving, saveSettings, updateSettings, refetch } = useSystemSettings();
  
  // Utilisation conditionnelle des hooks pour éviter les erreurs d'ordre d'initialisation
  const currencyContext = React.useContext(React.createContext<any>(undefined));
  const languageContext = React.useContext(React.createContext<any>(undefined));
  const authContext = React.useContext(React.createContext<any>(undefined));
  
  // Hooks avec gestion d'erreur
  let changeCurrency: any = null;
  let currencies: any[] = [];
  let changeLanguage: any = null;
  let languages: any[] = [];
  let pharmacy: any = null;
  
  try {
    const currencyHook = useCurrency();
    changeCurrency = currencyHook.changeCurrency;
    currencies = currencyHook.currencies;
  } catch (error) {
    console.warn('CurrencyProvider not available yet');
  }
  
  try {
    const languageHook = useLanguage();
    changeLanguage = languageHook.changeLanguage;
    languages = languageHook.languages;
  } catch (error) {
    console.warn('LanguageProvider not available yet');
  }
  
  try {
    const authHook = useAuth();
    pharmacy = authHook.pharmacy;
  } catch (error) {
    console.warn('AuthProvider not available yet');
  }

  // Appliquer les paramètres de devise au contexte Currency
  const applyCurrencySettings = () => {
    if (!settings || !changeCurrency || !currencies.length) return;
    
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
        changeCurrency(existingCurrency, false); // Ne pas afficher le toast pour les changements automatiques
      }
    }
  };

  // Appliquer les paramètres de langue au contexte Language
  const applyLanguageSettings = () => {
    if (!settings || !changeLanguage || !languages.length) return;
    
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

  // Palette de couleurs HSL pour Tailwind (format: H S% L%)
  const colorPalettes = {
    blue: { primary: '221 83% 53%', foreground: '210 40% 98%' },
    green: { primary: '142 76% 36%', foreground: '355 20% 98%' },
    purple: { primary: '262 83% 58%', foreground: '210 40% 98%' },
    orange: { primary: '25 95% 53%', foreground: '210 40% 98%' },
    red: { primary: '0 84% 60%', foreground: '210 40% 98%' },
    teal: { primary: '173 58% 39%', foreground: '210 40% 98%' },
    indigo: { primary: '239 84% 67%', foreground: '210 40% 98%' }
  };

  // Appliquer les paramètres d'interface en temps réel
  const applyInterfaceSettings = () => {
    if (!settings) return;

    // 1. Appliquer le thème
    const theme = settings.interface_theme || 'clair';
    const html = document.documentElement;
    
    if (theme === 'foncé') {
      html.classList.add('dark');
    } else if (theme === 'clair') {
      html.classList.remove('dark');
    } else if (theme === 'auto') {
      // Mode automatique avec matchMedia
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applyAutoTheme = () => {
        if (darkModeQuery.matches) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      };
      
      applyAutoTheme();
      // Écouter les changements de préférence système
      darkModeQuery.addEventListener('change', applyAutoTheme);
    }

    // 2. Appliquer la couleur principale
    const primaryColor = settings.interface_primary_color || 'bleu';
    const colorKey = primaryColor === 'bleu' ? 'blue' :
                     primaryColor === 'vert' ? 'green' :
                     primaryColor === 'violet' ? 'purple' :
                     primaryColor === 'orange' ? 'orange' :
                     primaryColor === 'rouge' ? 'red' :
                     primaryColor === 'sarcelle' ? 'teal' :
                     primaryColor === 'indigo' ? 'indigo' : 'blue';
    
    const palette = colorPalettes[colorKey as keyof typeof colorPalettes];
    if (palette) {
      const root = document.documentElement;
      root.style.setProperty('--primary', palette.primary);
      root.style.setProperty('--primary-foreground', palette.foreground);
    }

    // 3. Appliquer la taille de police
    const fontSize = parseInt(settings.interface_font_size || '14');
    if (fontSize >= 12 && fontSize <= 20) {
      document.documentElement.style.fontSize = `${fontSize}px`;
    }

    // 4. Appliquer les attributs data sur body
    const body = document.body;
    
    // Densité de grille
    const gridDensity = settings.interface_grid_density || 'confortable';
    body.dataset.gridDensity = gridDensity;
    
    // Mode compact
    const compactMode = settings.interface_compact_mode === 'vrai';
    body.dataset.compact = compactMode.toString();
    
    // Tooltips
    const showTooltips = settings.interface_show_tooltips !== 'faux';
    body.dataset.tooltips = showTooltips.toString();
    
    // Animations
    const animationsEnabled = settings.interface_animations_activées !== 'faux';
    body.dataset.animations = animationsEnabled.toString();
    
    // Sidebar collapsed par défaut (préférence initiale)
    const sidebarCollapsed = settings.interface_sidebar_collapsed === 'vrai';
    body.dataset.sidebarCollapsed = sidebarCollapsed.toString();
  };

  // Fonction de sauvegarde étendue qui applique les changements aux autres contextes
  const saveSettingsWithSync = async (updates: Partial<SystemSettings>) => {
    await saveSettings(updates);
    
    // Appliquer les changements aux contextes si les paramètres système ont changé
    if (updates.default_currency) {
      applyCurrencySettings();
    }
    
    // Application immédiate des paramètres de langue si modifiés
    if (updates.default_language || updates.default_lingual) {
      setTimeout(() => {
        applyLanguageSettings();
      }, 200);
    }
    
    // Appliquer les paramètres d'interface si des paramètres d'interface ont changé
    const interfaceKeys = [
      'interface_theme', 'interface_primary_color', 'interface_font_size',
      'interface_sidebar_collapsed', 'interface_show_tooltips', 'interface_animations_activées',
      'interface_compact_mode', 'interface_grid_density'
    ];
    
    if (interfaceKeys.some(key => key in updates)) {
      // Petit délai pour s'assurer que les settings sont mis à jour
      setTimeout(() => {
        applyInterfaceSettings();
      }, 100);
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
    applyInterfaceSettings,
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