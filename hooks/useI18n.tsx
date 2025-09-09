import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Language, MultilingualString } from '../types';

export type Direction = 'ltr' | 'rtl';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  getLocalized: (data: MultilingualString | { en: string[]; ar: string[] } | undefined) => string | string[];
  dir: Direction;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Initial state with empty objects to prevent errors before loading
const initialTranslations = { en: {}, ar: {} };

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('louayStoreLang') as Language;
    return savedLang && ['en', 'ar'].includes(savedLang) ? savedLang : 'en';
  });
  
  const [translations, setTranslations] = useState<Record<Language, any>>(initialTranslations);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        // Paths are relative to the root `index.html` file
        const [enResponse, arResponse] = await Promise.all([
          fetch('./locales/en.json'),
          fetch('./locales/ar.json')
        ]);
        
        if (!enResponse.ok || !arResponse.ok) {
          console.error('Failed to fetch translation files. Status:', { en: enResponse.status, ar: arResponse.status });
          throw new Error('Network response was not ok for one or more translation files.');
        }

        const enData = await enResponse.json();
        const arData = await arResponse.json();
        
        setTranslations({ en: enData, ar: arData });
      } catch (error) {
        console.error("Error loading translation files:", error);
        // Keep initial empty translations on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('louayStoreLang', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key];
    
    if (translation === undefined) {
      if (!isLoading) {
        // This warning is useful for development to find missing keys
        // console.warn(`Translation key not found: "${key}" for language "${language}"`);
      }
      return key; // Fallback to key
    }

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            // Use a global regex to replace all occurrences
            translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(replacements[placeholder]));
        });
    }
    return translation;
  }, [language, translations, isLoading]);

  const getLocalized = useCallback(
    (data: MultilingualString | { en: string[]; ar: string[] } | undefined): string | string[] => {
      if (!data) {
        return '';
      }
      // Check if it's the keywords structure with array values
      if ('en' in data && Array.isArray(data.en)) {
        return data[language] || data.en;
      }
      // Check if it's a MultilingualString with string values
      if (typeof data === 'object' && 'en' in data && typeof data.en === 'string') {
        const typedData = data as MultilingualString;
        return typedData[language] || typedData.en;
      }
      // Fallback for unexpected data types
      return '';
    },
    [language]
  );
  

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    getLocalized,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    isLoading
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};