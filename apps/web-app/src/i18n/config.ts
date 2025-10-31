export type Locale = 'en' | 'zh-CN';

export const I18N_CONFIG = {
  defaultLocale: 'en' as Locale,
  supportedLocales: ['en', 'zh-CN'] as Locale[],
  fallbackLocale: 'en' as Locale,
} as const;

export const LOCALE_NAMES: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
};