import { useMemo } from 'react';
import { fr, enUS, es, de } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook pour obtenir la locale date-fns basée sur la langue active
 * Utilise le LanguageContext pour être réactif aux changements de langue
 */
export const useDateLocale = () => {
  const { currentLanguage } = useLanguage();
  
  const dateLocale = useMemo(() => {
    const langCode = currentLanguage?.code || 'fr';
    
    if (langCode === 'en') return enUS;
    if (langCode === 'es') return es;
    if (langCode === 'de') return de;
    if (langCode === 'ln') return fr; // Lingala uses French date format
    // Default to French
    return fr;
  }, [currentLanguage]);

  return { dateLocale };
};
