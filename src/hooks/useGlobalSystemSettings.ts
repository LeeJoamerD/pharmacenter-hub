import { useSystemSettingsContext } from '@/contexts/SystemSettingsContext';
import { SystemSettings } from '@/hooks/useSystemSettings';

/**
 * Hook réutilisable pour accéder aux paramètres système depuis n'importe où dans l'application
 * Ce hook peut être utilisé dans tous les modules pour accéder aux paramètres globaux
 */
export const useGlobalSystemSettings = () => {
  const context = useSystemSettingsContext();
  
  return {
    // États
    settings: context.settings,
    loading: context.loading,
    saving: context.saving,
    
    // Actions
    saveSettings: context.saveSettings,
    updateSettings: context.updateSettings,
    refetch: context.refetch,
    
    // Utilitaires
    getCurrentCurrency: context.getCurrentCurrency,
    getCurrentTimezone: context.getCurrentTimezone,
    getCurrentLanguage: context.getCurrentLanguage,
    
    // Fonctions d'aide pour récupérer des valeurs spécifiques
    getPharmacyInfo: () => {
      if (!context.settings) return null;
      return {
        name: context.settings.name,
        code: context.settings.code,
        address: context.settings.address,
        city: context.settings.city,
        email: context.settings.email,
        telephone_appel: context.settings.telephone_appel,
        telephone_whatsapp: context.settings.telephone_whatsapp,
      };
    },
    
    getTaxSettings: () => {
      if (!context.settings) return null;
      return {
        taux_tva: context.settings.taux_tva,
        taux_centime_additionnel: context.settings.taux_centime_additionnel,
        fiscal_year: context.settings.fiscal_year,
      };
    },
    
    getRegionalSettings: () => {
      if (!context.settings) return null;
      return {
        currency: context.getCurrentCurrency(),
        timezone: context.getCurrentTimezone(),
        language: context.getCurrentLanguage(),
      };
    },
    
    // Fonctions pour appliquer les paramètres à d'autres contextes
    syncWithOtherContexts: () => {
      context.applyCurrencySettings();
      context.applyLanguageSettings();
    },
  };
};

// Types exportés pour la réutilisation
export type PharmacyInfo = ReturnType<ReturnType<typeof useGlobalSystemSettings>['getPharmacyInfo']>;
export type TaxSettings = ReturnType<ReturnType<typeof useGlobalSystemSettings>['getTaxSettings']>;
export type RegionalSettings = ReturnType<ReturnType<typeof useGlobalSystemSettings>['getRegionalSettings']>;