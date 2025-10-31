/**
 * Supported locales
 * ⚠️ CRITICAL: Must match translation file names exactly
 */
export type Locale = 'en' | 'zh-CN';

/**
 * Translation object structure
 * ⚠️ CRITICAL: This type MUST match the JSON structure exactly
 */
export interface Translations {
  common: {
    auth: {
      login: string;
      signup: string;
      logout: string;
    };
    actions: {
      save: string;
      cancel: string;
      delete: string;
      edit: string;
      close: string;
      confirm: string;
      reset: string;
      search: string;
      apply: string;
      send: string;
    };
    status: {
      loading: string;
      saving: string;
      success: string;
      error: string;
      enabled: string;
      disabled: string;
    };
  };
  landing: {
    hero: {
      title: string;
      description: string;
    };
  };
  chat: {
    input: {
      placeholder: string;
    };
    actions: {
      newChat: string;
      expandChat: string;
      collapseChat: string;
    };
    errors: {
      sendFailed: string;
      genericError: string;
    };
    status: {
      generating: string;
      videoGenerating: string;
    };
  };
  dashboard: {
    fallback: {
      title: string;
      paragraph1: string;
      paragraph2: string;
      paragraph3: string;
      quote: string;
    };
    empty: {
      noCards: string;
      noInsights: string;
    };
  };
  settings: {
    title: string;
    language: {
      title: string;
      description: string;
      updated: string;
    };
    backgroundMedia: {
      title: string;
      description: string;
      localVideos: string;
      pexelsLibrary: string;
      searchPexels: string;
      aiGenerated: string;
      askDot: string;
    };
    notifications: {
      title: string;
      description: string;
      enable: string;
      allowTypes: string;
      position: string;
      maxVisible: string;
      autoHide: string;
      doNotDisturb: string;
      snooze15: string;
      snooze30: string;
      snooze60: string;
      clearSnooze: string;
      snoozingUntil: string;
      sendTest: string;
      testNotification: {
        title: string;
        description: string;
      };
      types: {
        newCard: string;
        graphUpdate: string;
        newStar: string;
      };
    };
  };
  errors: {
    unauthorized: string;
    notFound: string;
    internalError: string;
    badRequest: string;
  };
}

/**
 * Nested key paths for dot notation access
 * Examples: 'common.auth.login', 'dashboard.fallback.title'
 */
export type TranslationKey = 
  | `common.auth.${keyof Translations['common']['auth']}`
  | `common.actions.${keyof Translations['common']['actions']}`
  | `common.status.${keyof Translations['common']['status']}`
  | `landing.hero.${keyof Translations['landing']['hero']}`
  | `chat.input.${keyof Translations['chat']['input']}`
  | `chat.actions.${keyof Translations['chat']['actions']}`
  | `chat.errors.${keyof Translations['chat']['errors']}`
  | `chat.status.${keyof Translations['chat']['status']}`
  | `dashboard.fallback.${keyof Translations['dashboard']['fallback']}`
  | `dashboard.empty.${keyof Translations['dashboard']['empty']}`
  | `settings.${Exclude<keyof Translations['settings'], 'language' | 'backgroundMedia' | 'notifications'>}`
  | `settings.language.${keyof Translations['settings']['language']}`
  | `settings.backgroundMedia.${keyof Translations['settings']['backgroundMedia']}`
  | `settings.notifications.${Exclude<keyof Translations['settings']['notifications'], 'testNotification' | 'types'>}`
  | `settings.notifications.testNotification.${keyof Translations['settings']['notifications']['testNotification']}`
  | `settings.notifications.types.${keyof Translations['settings']['notifications']['types']}`
  | `errors.${keyof Translations['errors']}`;

/**
 * Variables for interpolation
 * Example: t('settings.notifications.snoozingUntil', { time: '3:00 PM' })
 */
export type TranslationVariables = Record<string, string | number>;