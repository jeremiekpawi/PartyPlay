'use client';

import React, { createContext, useContext, useState } from 'react';
import type { LocaleCode } from '../shared/types';
import { fr, type TranslationDictionary } from './fr';

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: TranslationDictionary;
}

const DICTIONARIES: Record<LocaleCode, TranslationDictionary> = {
  fr,
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'fr',
  setLocale: () => {},
  t: fr,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<LocaleCode>('fr');

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICTIONARIES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  return useContext(I18nContext);
}
