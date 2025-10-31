import { Locale } from './types';

export const I18N_CONFIG = {
  defaultLocale: 'en' as Locale,
  supportedLocales: ['en', 'zh-CN'] as Locale[],
  fallbackLocale: 'en' as Locale,
} as const;

/**
 * Map locale codes to human-readable names
 * Used in language selector UI
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
};

/**
 * Map locale codes to names used in LLM prompts
 */
export const LOCALE_LLM_NAMES: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': 'Simplified Chinese (简体中文)',
};