import { useEffect, useRef } from 'react';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Composant invisible qui synchronise automatiquement les paramètres système
 * avec les autres contextes (Currency, Language, Interface) au chargement de l'application
 */
export const SystemSettingsSync = () => {
  const { settings, syncWithOtherContexts, getCurrentLanguage } = useGlobalSystemSettings();
  const { changeLanguage, languages, currentLanguage } = useLanguage();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Synchroniser les paramètres avec les autres contextes dès que les settings sont chargés
    if (settings && !hasInitialized.current) {
      hasInitialized.current = true;
      syncWithOtherContexts();
      
      // Synchroniser directement la langue avec le LanguageContext
      const systemLang = getCurrentLanguage();
      if (systemLang?.code && systemLang.code !== currentLanguage.code) {
        const matchedLang = languages.find(l => l.code === systemLang.code);
        if (matchedLang) {
          changeLanguage(matchedLang);
        }
      }
    }
  }, [settings, syncWithOtherContexts, getCurrentLanguage, changeLanguage, languages, currentLanguage]);

  // Ce composant ne rend rien, il sert uniquement à la synchronisation
  return null;
};