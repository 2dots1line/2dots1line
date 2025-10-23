<!-- 70d7f75a-e6f5-4907-a60f-fc70ecf8d601 2bc23932-4d3b-4b63-944a-08af7a06a74a -->
# i18n Language Preference System - Bulletproof Implementation Plan

## Overview

Implement full internationalization with language preference storage, centralized translation management, and LLM integration for English and Simplified Chinese.

**CRITICAL CONSTRAINTS:**

- **NO external i18n libraries** (next-i18next, react-i18next, etc.) - Custom lightweight solution
- **Type-safe translation keys** - Build time errors for missing translations
- **Zero runtime cost** - All translations loaded at build/startup
- **Monorepo compliant** - No circular dependencies

---

## PHASE 1: Core i18n Infrastructure

### 1.1 Create Translation Files

**File: `config/translations/en.json`**

Create this file with the following EXACT structure:

```json
{
  "common": {
    "auth": {
      "login": "Log in",
      "signup": "Sign up",
      "logout": "Log out"
    },
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "close": "Close",
      "confirm": "Confirm",
      "reset": "Reset to Defaults",
      "search": "Search",
      "apply": "Apply",
      "send": "Send"
    },
    "status": {
      "loading": "Loading...",
      "saving": "Saving...",
      "success": "Success",
      "error": "Error",
      "enabled": "Enabled",
      "disabled": "Disabled"
    }
  },
  "landing": {
    "hero": {
      "title": "A New Horizon Awaits",
      "description": "Step into a space of reflection and connection. Discover the stories within, and watch your inner world expand."
    }
  },
  "chat": {
    "input": {
      "placeholder": "Ask anything"
    },
    "actions": {
      "newChat": "Start new chat",
      "expandChat": "Expand chat",
      "collapseChat": "Collapse to mini"
    },
    "errors": {
      "sendFailed": "I apologize, but I encountered an error processing your message: {{message}}. Please try again.",
      "genericError": "An error occurred. Please try again."
    },
    "status": {
      "generating": "Generating your image...",
      "videoGenerating": "Starting video generation..."
    }
  },
  "dashboard": {
    "fallback": {
      "title": "Your Journey Through the Cosmos",
      "paragraph1": "Welcome to your personal cosmic journey. This month, we've witnessed remarkable growth across all dimensions of your being. Your conversations have revealed patterns of self-discovery that speak to a deeper understanding of your place in the universe.",
      "paragraph2": "The insights we've gathered show a person who is not just growing, but evolving. Each interaction, each moment of reflection, each new connection you make adds another layer to the rich tapestry of your experience.",
      "paragraph3": "As you explore the cards and insights that follow, remember that this is your story. These are your discoveries, your breakthroughs, your moments of clarity. They represent not just where you've been, but where you're heading.",
      "quote": "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."
    },
    "empty": {
      "noCards": "No recent cards available",
      "noInsights": "No insights yet"
    }
  },
  "settings": {
    "title": "All Settings",
    "language": {
      "title": "Language Preference",
      "description": "Choose your preferred language for the interface and AI responses",
      "updated": "Language updated successfully"
    },
    "backgroundMedia": {
      "title": "Background Media",
      "description": "Choose different background media for each 2D view. You can use local videos or search for new ones from Pexels.",
      "localVideos": "Local Videos",
      "pexelsLibrary": "Pexels Library",
      "searchPexels": "Search Pexels",
      "aiGenerated": "AI Generated Videos ({{count}})",
      "askDot": "Ask Dot to generate a custom video for you!"
    },
    "notifications": {
      "title": "Notification Settings",
      "description": "Configure in-app toasts and delivery preferences",
      "enable": "Enable Notifications",
      "allowTypes": "Allow Types",
      "position": "Position",
      "maxVisible": "Max Visible",
      "autoHide": "Auto-hide (seconds, 0 = never)",
      "doNotDisturb": "Do Not Disturb",
      "snooze15": "Snooze 15m",
      "snooze30": "Snooze 30m",
      "snooze60": "Snooze 60m",
      "clearSnooze": "Clear Snooze",
      "snoozingUntil": "Snoozing until {{time}}",
      "sendTest": "Send Test",
      "testNotification": {
        "title": "Test Notification",
        "description": "This is a local test toast"
      },
      "types": {
        "newCard": "New Card Available",
        "graphUpdate": "Graph Projection Updated",
        "newStar": "New Star Generated"
      }
    }
  },
  "errors": {
    "unauthorized": "Unauthorized",
    "notFound": "Not found",
    "internalError": "Internal Server Error",
    "badRequest": "Bad request"
  }
}
```

**File: `config/translations/zh-CN.json`**

**⚠️ CRITICAL:** You (Danni) will provide Chinese translations. Create file with IDENTICAL structure:

```json
{
  "common": {
    "auth": {
      "login": "[TRANSLATE: Log in]",
      "signup": "[TRANSLATE: Sign up]",
      "logout": "[TRANSLATE: Log out]"
    },
    ...
  }
}
```

**Verification:**

- ✅ Both files must have IDENTICAL JSON structure
- ✅ Run `node -e "console.log(Object.keys(require('./config/translations/en.json')))"` to verify parsing
- ✅ Use JSON validator: `npx jsonlint config/translations/en.json`

---

### 1.2 Add i18n Utilities to core-utils Package

**⚠️ CORRECTION:** Use existing `@2dots1line/core-utils` package (confirmed exists at `packages/core-utils/`).

**File: `packages/core-utils/src/i18n/types.ts`** (NEW FILE)

```typescript
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
```

**File: `packages/i18n-utils/src/i18nConfig.ts`**

```typescript
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
```

**File: `packages/i18n-utils/src/TranslationService.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { Locale, Translations, TranslationKey, TranslationVariables } from './types';
import { I18N_CONFIG } from './i18nConfig';

/**
 * TranslationService - Singleton for loading and accessing translations
 * 
 * ⚠️ CRITICAL IMPLEMENTATION NOTES:
 * - Translations loaded synchronously at service initialization
 * - All translations cached in memory (no filesystem reads after init)
 * - Fallback chain: requested locale → default locale → throw error
 * - Variable interpolation uses {{variable}} syntax
 */
export class TranslationService {
  private static instance: TranslationService;
  private translations: Map<Locale, Translations> = new Map();
  private translationsDir: string;

  private constructor() {
    // ⚠️ CRITICAL: Find config directory from monorepo root
    // This works whether called from web-app, workers, or api-gateway
    this.translationsDir = this.findTranslationsDir();
    this.loadAllTranslations();
  }

  /**
   * Find translations directory by searching for monorepo root
   * Same pattern as ConfigService (line 31-49 in services/config-service/src/ConfigService.ts)
   */
  private findTranslationsDir(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      try {
        const packageJson = require(packageJsonPath);
        if (packageJson.workspaces) {
          return path.join(currentDir, 'config', 'translations');
        }
      } catch (e) {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback
    return path.join(process.cwd(), '../../config/translations');
  }

  /**
   * Load all translation files at initialization
   * ⚠️ CRITICAL: This must be synchronous - app waits for translations
   */
  private loadAllTranslations(): void {
    for (const locale of I18N_CONFIG.supportedLocales) {
      const filePath = path.join(this.translationsDir, `${locale}.json`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content) as Translations;
        this.translations.set(locale, parsed);
        console.log(`[TranslationService] Loaded translations for locale: ${locale}`);
      } catch (error) {
        console.error(`[TranslationService] Failed to load translations for ${locale}:`, error);
        throw new Error(`Failed to load translations for locale: ${locale}`);
      }
    }
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Get translation by key with optional variable interpolation
   * 
   * @param key - Dot notation key (e.g., 'common.auth.login')
   * @param locale - Target locale
   * @param variables - Optional variables for interpolation
   * 
   * ⚠️ CRITICAL: Falls back to English if key not found in target locale
   */
  public t(key: TranslationKey, locale: Locale, variables?: TranslationVariables): string {
    // Try target locale first
    let value = this.getNestedValue(key, locale);
    
    // Fallback to default locale
    if (value === null && locale !== I18N_CONFIG.defaultLocale) {
      console.warn(`[TranslationService] Key "${key}" not found in ${locale}, falling back to ${I18N_CONFIG.defaultLocale}`);
      value = this.getNestedValue(key, I18N_CONFIG.defaultLocale);
    }
    
    // If still not found, throw error
    if (value === null) {
      throw new Error(`Translation key not found: ${key}`);
    }
    
    // Interpolate variables if provided
    if (variables) {
      return this.interpolate(value, variables);
    }
    
    return value;
  }

  /**
   * Get nested value from translations using dot notation
   */
  private getNestedValue(key: string, locale: Locale): string | null {
    const translations = this.translations.get(locale);
    if (!translations) {
      return null;
    }
    
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpolate variables into translation string
   * Replaces {{variable}} with values from variables object
   */
  private interpolate(template: string, variables: TranslationVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  /**
   * Get all translations for a specific locale
   * Used for debugging and testing
   */
  public getAllTranslations(locale: Locale): Translations | undefined {
    return this.translations.get(locale);
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();
```

**File: `packages/i18n-utils/src/useTranslation.ts`**

````typescript
import { useMemo, useCallback } from 'react';
import { useUserStore } from '../../../apps/web-app/src/stores/UserStore';
import { translationService } from './TranslationService';
import { Locale, TranslationKey, TranslationVariables } from './types';
import { I18N_CONFIG } from './i18nConfig';

/**
 * React hook for translations
 * 
 * ⚠️ CRITICAL USAGE:
 * ```typescript
 * const { t, locale } = useTranslation();
 * return <button>{t('common.auth.login')}</button>;
 * ```
 * 
 * ⚠️ PITFALL: Do NOT call t() conditionally or in loops
 * ⚠️ PITFALL: Do NOT destructure t function outside component
 */
export function useTranslation() {
  // Get user's language preference from UserStore
  const user = useUserStore(state => state.user);
  
  // Determine current locale
  // Priority: user.language_preference → browser language → default
  const locale = useMemo((): Locale => {
    // 1. Use stored user preference
    if (user?.language_preference) {
      const userLocale = user.language_preference as Locale;
      if (I18N_CONFIG.supportedLocales.includes(userLocale)) {
        return userLocale;
      }
    }
    
    // 2. Detect browser language (client-side only)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const browserLang = navigator.language;
      if (browserLang.startsWith('zh')) {
        return 'zh-CN';
      }
    }
    
    // 3. Default fallback
    return I18N_CONFIG.defaultLocale;
  }, [user?.language_preference]);

  // Memoized translation function
  const t = useCallback(
    (key: TranslationKey, variables?: TranslationVariables): string => {
      return translationService.t(key, locale, variables);
    },
    [locale]
  );

  return { t, locale };
}
````

**File: `packages/i18n-utils/src/index.ts`**

```typescript
export * from './types';
export * from './i18nConfig';
export * from './TranslationService';
export * from './useTranslation';
```

**Verification Steps:**

1. ✅ Run `cd packages/i18n-utils && pnpm build` - must compile without errors
2. ✅ Check `packages/i18n-utils/dist/index.d.ts` exists
3. ✅ Verify types: `TranslationKey` should show autocomplete for all keys

---

### 1.3 Update UserStore

**File: `apps/web-app/src/stores/UserStore.ts`**

**⚠️ CRITICAL:** Follow EXACT Zustand pattern from existing stores (lines 43-545)

Add to `UserState` interface (after line 21):

```typescript
setLanguagePreference: (locale: 'en' | 'zh-CN') => Promise<void>;
```

Add action implementation (after line 400, before `initializeAuth`):

```typescript
setLanguagePreference: async (locale: 'en' | 'zh-CN') => {
  const state = get();
  if (!state.user) {
    throw new Error('Cannot set language preference: No user logged in');
  }

  set({ isLoading: true, error: null });
  console.log(`UserStore.setLanguagePreference - Updating to: ${locale}`);

  try {
    // Update database via API
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/users/${state.user.user_id}`,
      {
        language_preference: locale
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      }
    );

    if (response.data.success) {
      // Update local user object
      set({
        user: {
          ...state.user,
          language_preference: locale
        },
        isLoading: false
      });

      console.log(`UserStore.setLanguagePreference - Successfully updated to: ${locale}`);
    } else {
      throw new Error(response.data.error?.message || 'Failed to update language preference');
    }
  } catch (error) {
    console.error('UserStore.setLanguagePreference - Error:', error);
    set({
      error: error instanceof Error ? error.message : 'Failed to update language preference',
      isLoading: false
    });
    throw error;
  }
},
```

**Verification:**

- ✅ TypeScript compiles without errors
- ✅ Test in browser console: `useUserStore.getState().setLanguagePreference('zh-CN')`
- ✅ Check database: `SELECT user_id, language_preference FROM users WHERE user_id='dev-user-123';`

---

### 1.4 Update API Gateway User Controller

**File: `apps/api-gateway/src/controllers/user.controller.ts`**

**⚠️ CRITICAL:** The `updateUser` method (lines 209-278) already handles preferences updates.

**MANDATORY VERIFICATION:**

- ✅ Inspect line 237: `const { name, profileImageUrl, preferences } = req.body;`
- ✅ Inspect line 251-255: `updateUser` is called with `preferences`
- ✅ This MUST pass through `language_preference` in the preferences object

**HOWEVER:** Current implementation uses `preferences` (generic JSONB). We need to support direct `language_preference` field update.

**ADD this before line 237:**

```typescript
const { name, profileImageUrl, preferences, language_preference } = req.body;
```

**REPLACE lines 251-255 with:**

```typescript
const updateData: any = {};
if (name) updateData.name = name;
if (profileImageUrl) updateData.profile_picture_url = profileImageUrl;
if (preferences) updateData.preferences = preferences;
if (language_preference) updateData.language_preference = language_preference;

const updatedUser = await this.userService.updateUser(userId, updateData);
```

**Verification:**

- ✅ Test API: `curl -X PUT http://localhost:3001/api/v1/users/dev-user-123 -H "Authorization: Bearer dev-token" -H "Content-Type: application/json" -d '{"language_preference":"zh-CN"}'`
- ✅ Response should include `language_preference: "zh-CN"`

---

## PHASE 2: Replace Hardcoded Text (Priority 1)

### 2.1 Update Landing Page

**File: `apps/web-app/src/components/layouts/Layout.tsx`**

**Import at top (after existing imports):**

```typescript
import { useTranslation } from '@2dots1line/i18n-utils';
```

**Replace lines 573-579** (navigation buttons):

```typescript
// BEFORE:
<GlassButton onClick={openLoginModal} className="text-onBackground font-brand">
  Log in
</GlassButton>
<GlassButton onClick={openSignupModal} className="text-onBackground font-brand">
  Sign up
</GlassButton>

// AFTER:
const { t } = useTranslation();
// ... (add this at top of component, line 27)

<GlassButton onClick={openLoginModal} className="text-onBackground font-brand">
  {t('common.auth.login')}
</GlassButton>
<GlassButton onClick={openSignupModal} className="text-onBackground font-brand">
  {t('common.auth.signup')}
</GlassButton>
```

**Replace lines 592-597** (hero section):

```typescript
// BEFORE:
<h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-medium text-primary mb-4">
  A New Horizon Awaits
</h1>
<p className="font-sans text-base sm:text-lg text-onSurface max-w-prose mx-auto">
  Step into a space of reflection and connection. Discover the stories within, and watch your inner world expand.
</p>

// AFTER:
<h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-medium text-primary mb-4">
  {t('landing.hero.title')}
</h1>
<p className="font-sans text-base sm:text-lg text-onSurface max-w-prose mx-auto">
  {t('landing.hero.description')}
</p>
```

**⚠️ PITFALL:** Do NOT call `useTranslation()` inside conditional rendering or loops

**Verification:**

- ✅ Component renders without errors
- ✅ Text displays in English by default
- ✅ Change

### To-dos

- [ ] Create core i18n infrastructure: translation files, utilities package, types, and services
- [ ] Update UserStore with language preference management and persistence
- [ ] Extract all Priority 1 hardcoded text (Layout, Chat, Dashboard) to translation keys
- [ ] Replace Priority 1 hardcoded strings with useTranslation hook calls
- [ ] Build language selector UI component and integrate into Global Settings
- [ ] Update prompt templates and workers to use stored language preference
- [ ] Extract Priority 2 & 3 text (Settings, shared components) to translation keys
- [ ] Test all language switching scenarios, edge cases, and LLM responses
- [ ] Create developer guide and translation guide documentation