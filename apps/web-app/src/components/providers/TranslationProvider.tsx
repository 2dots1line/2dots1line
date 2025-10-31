'use client';

import React, { createContext, useContext } from 'react';
import en from '../../translations/en.json';
import zhCN from '../../translations/zh-CN.json';

type Locale = 'en' | 'zh-CN';

interface TranslationContextType {
  isReady: boolean;
  error: string | null;
  translations: Record<Locale, any>;
}

const TranslationContext = createContext<TranslationContextType>({
  isReady: true,
  error: null,
  translations: { en, 'zh-CN': zhCN },
});

export const useTranslationContext = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const contextValue: TranslationContextType = {
    isReady: true,
    error: null,
    translations: { en, 'zh-CN': zhCN },
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};