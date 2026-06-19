import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

export type Language = 'en' | 'es';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('sweetheart_lang');
    if (saved === 'en' || saved === 'es') return saved;
    // Fallback to browser language if available
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') return 'es';
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sweetheart_lang', lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to english if translation is missing
        let fallback: any = translations['en'];
        let found = true;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            found = false;
            break;
          }
        }
        if (found) {
          current = fallback;
        } else {
          return key;
        }
        break;
      }
    }

    if (typeof current !== 'string') return key;

    let result = current;
    if (variables) {
      Object.entries(variables).forEach(([k, val]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(val));
      });
    }

    return result;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
