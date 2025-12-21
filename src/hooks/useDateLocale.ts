import { useMemo } from 'react';
import { fr, enUS, es, de } from 'date-fns/locale';
import { useGlobalSystemSettings } from '@/hooks/useGlobalSystemSettings';

/**
 * Hook pour obtenir la locale date-fns basée sur les paramètres système
 * Supporte la multi-localité de l'application
 */
export const useDateLocale = () => {
  const { getCurrentLanguage } = useGlobalSystemSettings();
  
  const dateLocale = useMemo(() => {
    const language = getCurrentLanguage();
    const langCode = language?.code || 'fr';
    
    if (langCode === 'en') return enUS;
    if (langCode === 'es') return es;
    if (langCode === 'de') return de;
    // Default to French
    return fr;
  }, [getCurrentLanguage]);

  return { dateLocale };
};
