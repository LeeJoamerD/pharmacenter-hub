
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Language = {
  code: string;
  name: string;
  flag: string;
};

type LanguageContextType = {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  languages: Language[];
};

const defaultLanguages: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ln', name: 'Lingala', flag: '🇨🇬' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to get the stored language from localStorage, or default to French
  const getStoredLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('preferredLanguage');
      if (storedLang) {
        try {
          const parsed = JSON.parse(storedLang);
          // Validate the parsed object has the right structure
          if (parsed && parsed.code && parsed.name && parsed.flag) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse stored language', e);
        }
      }
    }
    return defaultLanguages[0]; // Default to French
  };

  const [currentLanguage, setCurrentLanguage] = useState<Language>(getStoredLanguage);

  // Function to change the language
  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', JSON.stringify(lang));
      document.documentElement.lang = lang.code; // Update the HTML lang attribute
    }
  };

  // Set the initial language on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = currentLanguage.code;
    }
  }, [currentLanguage.code]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages: defaultLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
