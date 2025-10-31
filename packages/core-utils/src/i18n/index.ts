// Export server-safe i18n utilities only
export * from './types';
export * from './i18nConfig';
export * from './TranslationService';

// Re-export commonly used items for convenience
export { TranslationService } from './TranslationService';
export { I18N_CONFIG, LOCALE_NAMES, LOCALE_LLM_NAMES } from './i18nConfig';
export type { Locale, Translations, TranslationKey, TranslationVariables } from './types';

// Client-side React hook must be imported directly:
// import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';