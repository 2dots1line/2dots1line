/**
 * Shared Utilities for 2dots1line V4
 * Provides common utilities for formatting, validation, security, and more
 */

// Re-export utility functions by category
export * from './constants';
export * from './formatting';
export * from './security';
export * from './validation';
export * from './environment/EnvironmentLoader';
export * from './service/BaseService';
export * from './llm';
export * from './entity-mapping';
export * from './relationship-utils';
export * from './cache/PromptCacheService';
export * from './cache/MultiStagePromptCacheManager';
// i18n exports (server-safe only)
export { TranslationService } from './i18n/TranslationService';
export { I18N_CONFIG, LOCALE_NAMES, LOCALE_LLM_NAMES } from './i18n/i18nConfig';
export type { Locale, TranslationKey, TranslationVariables } from './i18n/types';

// Client-side React hook (import directly in React components)
// import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';

// Server-side utilities (import directly if needed)
// import { getLocale, createTranslationFunction } from '@2dots1line/core-utils/i18n/translationUtils';