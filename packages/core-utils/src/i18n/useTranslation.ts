import { useMemo, useCallback, useState, useEffect } from 'react';
import { I18N_CONFIG } from './i18nConfig';
import type { Locale, TranslationVariables } from './types';

// Browser-compatible translation cache
const browserTranslationCache = new Map<Locale, any>();

/**
 * Get the appropriate locale based on user preference and browser language
 */
export function getLocale(userLanguagePreference?: string): Locale {
  if (userLanguagePreference && I18N_CONFIG.supportedLocales.includes(userLanguagePreference as Locale)) {
    return userLanguagePreference as Locale;
  }

  if (typeof window !== 'undefined') {
    const browserLang = navigator.language;
    if (I18N_CONFIG.supportedLocales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
    const langCode = browserLang.split('-')[0];
    if (I18N_CONFIG.supportedLocales.includes(langCode as Locale)) {
      return langCode as Locale;
    }
  }

  return I18N_CONFIG.defaultLocale;
}

/**
 * Load translations from JSON files (browser-compatible)
 */
async function loadBrowserTranslations(locale: Locale): Promise<any> {
  if (browserTranslationCache.has(locale)) {
    return browserTranslationCache.get(locale);
  }

  try {
    // Load from API route that serves translations from config directory
    const response = await fetch(`/api/translations/${locale}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const translations = await response.json();
    browserTranslationCache.set(locale, translations);
    return translations;
  } catch (error) {
    console.error(`[useTranslation] Failed to load translations for ${locale}:`, error);
    throw new Error(`Failed to load translations for locale: ${locale}`);
  }
}

/**
 * Create translation function for server-side use
 */
export function createTranslationFunction(locale: Locale, translations: any) {
  return (key: string, variables?: TranslationVariables): string => {
    const value = getNestedValue(translations, key);
    if (value === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return interpolate(value, variables);
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): string | null {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return typeof current === 'string' ? current : null;
}

/**
 * Interpolate variables into string
 */
function interpolate(template: string, variables?: TranslationVariables): string {
  if (!variables) return template;
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

/**
 * React hook for translations (browser-compatible)
 * 
 * ⚠️ CRITICAL USAGE:
 * ```typescript
 * const { t, locale, isLoading } = useTranslation();
 * if (isLoading) return <div>Loading...</div>;
 * return <button>{t('common.auth.login')}</button>;
 * ```
 * 
 * ⚠️ PITFALL: Do NOT call t() conditionally or in loops
 * ⚠️ PITFALL: Do NOT destructure t function outside component
 */
export function useTranslation(userLanguagePreference?: string) {
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine current locale
  const locale = useMemo((): Locale => {
    return getLocale(userLanguagePreference);
  }, [userLanguagePreference]);

  // Load translations when locale changes
  useEffect(() => {
    let isMounted = true;

    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const currentTranslations = await loadBrowserTranslations(locale);
        
        if (isMounted) {
          setTranslations(currentTranslations);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[useTranslation] Failed to load translations:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load translations');
          setIsLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Translation function
  const t = useCallback(
    (key: string, variables?: TranslationVariables): string => {
      if (isLoading || !translations) {
        return key; // Return key while loading
      }

      // Get nested value
      const value = getNestedValue(translations, key);
      
      if (value === null) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      
      // Interpolate variables if provided
      return interpolate(value, variables);
    },
    [translations, isLoading]
  );

  return { t, locale, isLoading, error };
}