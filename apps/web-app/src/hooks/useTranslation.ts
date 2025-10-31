import { useMemo, useState, useEffect } from 'react';
import { useTranslationContext } from '../components/providers/TranslationProvider';
import { useUserStore } from '../stores/UserStore';

type Locale = 'en' | 'zh-CN';
type TranslationKey = string;
type TranslationVariables = Record<string, string | number>;

function getLocale(userLanguagePreference?: string): Locale {
  if (userLanguagePreference === 'en' || userLanguagePreference === 'zh-CN') {
    return userLanguagePreference as Locale;
  }

  if (typeof window !== 'undefined') {
    const browserLang = navigator.language;

    if (browserLang === 'en' || browserLang === 'zh-CN') {
      return browserLang as Locale;
    }

    const langCode = browserLang.split('-')[0];
    if (langCode === 'en') return 'en';
    if (langCode === 'zh') return 'zh-CN';
  }

  return 'en';
}

function getNestedValue(obj: any, path: string): string | null {
  const keys = path.split('.');
  let current = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }

  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, variables?: TranslationVariables): string {
  if (!variables) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

export function useTranslation(userLanguagePreference?: string) {
  const { translations } = useTranslationContext();
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration and UserStore access
  useEffect(() => {
    setIsClient(true);
    
    // Try to get user from UserStore safely
    try {
      const currentUser = useUserStore.getState()?.user;
      setUser(currentUser);
      
      // Subscribe to UserStore changes
      const unsubscribe = useUserStore.subscribe((state) => {
        setUser(state.user);
      });
      
      return unsubscribe;
    } catch (error) {
      console.debug('UserStore not ready, using fallback');
      setUser(null);
    }
  }, []);

  const locale = useMemo(() => {
    // Priority: passed parameter > user preference > browser/default
    const preferenceToUse = userLanguagePreference || user?.language_preference;
    return getLocale(preferenceToUse);
  }, [userLanguagePreference, user?.language_preference, isClient]);

  const t = useMemo(() => {
    return (key: TranslationKey, variables?: TranslationVariables): string => {
      const value =
        getNestedValue(translations[locale], key) ??
        getNestedValue(translations['en'], key);

      if (value === null) {
        console.warn(`Missing translation for key "${key}" in ${locale}`);
        return key;
      }
      return interpolate(value, variables);
    };
  }, [translations, locale]);

  const getCurrentLanguage = (): Locale => locale;
  const isLanguageSupported = (lang: string): boolean => ['en', 'zh-CN'].includes(lang);
  const getSupportedLanguages = (): Locale[] => ['en', 'zh-CN'];

  return {
    t,
    locale,
    getCurrentLanguage,
    isLanguageSupported,
    getSupportedLanguages
  };
}