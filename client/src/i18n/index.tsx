import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SupportedLanguage } from '../types/gateway';
import { LANGUAGE_REGISTRY, LanguageMetadata, TranslationDictionary } from './types';
import { en } from './locales/en';

interface I18nContextValue {
  language: SupportedLanguage;
  metadata: LanguageMetadata;
  t: TranslationDictionary;
  isLoadingLocale: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  format: (template: string, vars: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const loadedLocales: Partial<Record<SupportedLanguage, TranslationDictionary>> = {
  en,
};

export function normalizeSupportedLanguage(raw?: string | null): SupportedLanguage {
  const val = (raw || '').toLowerCase().trim();
  if (val === 'am' || val.startsWith('am-')) return 'am';
  if (val === 'om' || val.startsWith('om-')) return 'om';
  return 'en';
}

async function loadLocaleDictionary(lang: SupportedLanguage): Promise<TranslationDictionary> {
  if (loadedLocales[lang]) {
    return loadedLocales[lang]!;
  }
  if (lang === 'am') {
    const mod = await import('./locales/am');
    loadedLocales.am = mod.am;
    return mod.am;
  }
  if (lang === 'om') {
    const mod = await import('./locales/om');
    loadedLocales.om = mod.om;
    return mod.om;
  }
  return en;
}

export const I18nProvider: React.FC<{
  initialLanguage?: SupportedLanguage;
  children: React.ReactNode;
}> = ({ initialLanguage = 'en', children }) => {
  const safeInitial = normalizeSupportedLanguage(initialLanguage);
  const [language, setLanguageState] = useState<SupportedLanguage>(safeInitial);
  const [dict, setDict] = useState<TranslationDictionary>(loadedLocales[safeInitial] || en);
  const [isLoadingLocale, setIsLoadingLocale] = useState(false);

  const metadata = LANGUAGE_REGISTRY.find((l) => l.code === language) || LANGUAGE_REGISTRY[0];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = metadata.dir;
    }
  }, [language, metadata.dir]);

  const setLanguage = useCallback(async (nextLang: SupportedLanguage) => {
    const normalized = normalizeSupportedLanguage(nextLang);
    setLanguageState(normalized);
    if (loadedLocales[normalized]) {
      setDict(loadedLocales[normalized]!);
      return;
    }
    setIsLoadingLocale(true);
    try {
      const nextDict = await loadLocaleDictionary(normalized);
      setDict(nextDict);
    } finally {
      setIsLoadingLocale(false);
    }
  }, []);

  useEffect(() => {
    const normalized = normalizeSupportedLanguage(initialLanguage);
    if (normalized !== 'en') {
      void setLanguage(normalized);
    }
  }, [initialLanguage, setLanguage]);

  const format = useCallback((template: string, vars: Record<string, string | number>) => {
    return Object.entries(vars).reduce(
      (acc, [key, val]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
      template
    );
  }, []);

  return (
    <I18nContext.Provider
      value={{
        language,
        metadata,
        t: dict,
        isLoadingLocale,
        setLanguage,
        format,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
