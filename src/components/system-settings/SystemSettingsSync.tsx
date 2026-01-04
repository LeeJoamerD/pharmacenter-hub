import { useEffect } from 'react';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

/**
 * Composant invisible qui synchronise automatiquement les paramètres système
 * avec les autres contextes (Currency, Language, Interface) au chargement de l'application
 */
export const SystemSettingsSync = () => {
  const { settings, syncWithOtherContexts, getCurrentLanguage } = useGlobalSystemSettings();

  useEffect(() => {
    // Synchroniser les paramètres avec les autres contextes dès que les settings sont chargés
    if (settings) {
      syncWithOtherContexts();
      
      // Dispatch custom event to sync language with LanguageContext
      const currentLang = getCurrentLanguage();
      if (currentLang?.code) {
        window.dispatchEvent(new CustomEvent('systemSettingsLanguageChanged', {
          detail: { languageCode: currentLang.code }
        }));
      }
    }
  }, [settings, syncWithOtherContexts, getCurrentLanguage]);

  // Ce composant ne rend rien, il sert uniquement à la synchronisation
  return null;
};