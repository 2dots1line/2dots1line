# i18n Language Preference System - Complete Implementation Specification

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

**⚠️ NOTE:** Preliminary Chinese translations provided. Danni will refine to her liking.

```json
{
  "common": {
    "auth": {
      "login": "登录",
      "signup": "注册",
      "logout": "登出"
    },
    "actions": {
      "save": "保存",
      "cancel": "取消",
      "delete": "删除",
      "edit": "编辑",
      "close": "关闭",
      "confirm": "确认",
      "reset": "恢复默认设置",
      "search": "搜索",
      "apply": "应用",
      "send": "发送"
    },
    "status": {
      "loading": "加载中...",
      "saving": "保存中...",
      "success": "成功",
      "error": "错误",
      "enabled": "已启用",
      "disabled": "已禁用"
    }
  },
  "landing": {
    "hero": {
      "title": "新的地平线在等待",
      "description": "走进一个反思与连接的空间。发现内心的故事，看着你的内心世界不断扩展。"
    }
  },
  "chat": {
    "input": {
      "placeholder": "问我任何问题"
    },
    "actions": {
      "newChat": "开始新对话",
      "expandChat": "展开对话",
      "collapseChat": "收起为迷你模式"
    },
    "errors": {
      "sendFailed": "抱歉，处理您的消息时遇到错误：{{message}}。请重试。",
      "genericError": "发生错误。请重试。"
    },
    "status": {
      "generating": "正在生成图片...",
      "videoGenerating": "开始生成视频..."
    }
  },
  "dashboard": {
    "fallback": {
      "title": "你的宇宙之旅",
      "paragraph1": "欢迎来到你的个人宇宙之旅。这个月，我们见证了你在各个维度的显著成长。你的对话揭示了自我发现的模式，反映出你对自己在宇宙中位置的更深理解。",
      "paragraph2": "我们收集的洞察显示，你不仅在成长，而且在进化。每一次互动，每一刻反思，每一个新建立的联系，都为你丰富的经历增添了新的层次。",
      "paragraph3": "当你探索接下来的卡片和洞察时，请记住这是你的故事。这些是你的发现，你的突破，你的清晰时刻。它们不仅代表你曾经去过的地方，也代表你正在前往的方向。",
      "quote": "宇宙在我们之中。我们由星尘组成。我们是宇宙认识自己的一种方式。"
    },
    "empty": {
      "noCards": "暂无最近的卡片",
      "noInsights": "暂无洞察"
    }
  },
  "settings": {
    "title": "所有设置",
    "language": {
      "title": "语言偏好",
      "description": "选择界面和AI回复的首选语言",
      "updated": "语言更新成功"
    },
    "backgroundMedia": {
      "title": "背景媒体",
      "description": "为每个2D视图选择不同的背景媒体。你可以使用本地视频或从Pexels搜索新视频。",
      "localVideos": "本地视频",
      "pexelsLibrary": "Pexels 库",
      "searchPexels": "搜索 Pexels",
      "aiGenerated": "AI 生成的视频 ({{count}})",
      "askDot": "让 Dot 为你生成自定义视频！"
    },
    "notifications": {
      "title": "通知设置",
      "description": "配置应用内提示和推送偏好",
      "enable": "启用通知",
      "allowTypes": "允许的类型",
      "position": "位置",
      "maxVisible": "最大可见数",
      "autoHide": "自动隐藏（秒，0 = 永不）",
      "doNotDisturb": "勿扰模式",
      "snooze15": "暂停 15 分钟",
      "snooze30": "暂停 30 分钟",
      "snooze60": "暂停 60 分钟",
      "clearSnooze": "清除暂停",
      "snoozingUntil": "暂停至 {{time}}",
      "sendTest": "发送测试",
      "testNotification": {
        "title": "测试通知",
        "description": "这是一个本地测试提示"
      },
      "types": {
        "newCard": "新卡片可用",
        "graphUpdate": "图谱投影已更新",
        "newStar": "新星体已生成"
      }
    }
  },
  "errors": {
    "unauthorized": "未授权",
    "notFound": "未找到",
    "internalError": "内部服务器错误",
    "badRequest": "错误的请求"
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

**File: `packages/core-utils/src/i18n/i18nConfig.ts`** (NEW FILE)

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

**File: `packages/core-utils/src/i18n/TranslationService.ts`** (NEW FILE)

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

**File: `packages/core-utils/src/i18n/useTranslation.ts`** (NEW FILE)

```typescript
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
```

**File: `packages/core-utils/src/i18n/index.ts`** (NEW FILE)

```typescript
export * from './types';
export * from './i18nConfig';
export * from './TranslationService';
export * from './useTranslation';
```

**Update `packages/core-utils/src/index.ts`** (add export):

```typescript
// ... existing exports ...
export * from './i18n';
```

**Verification Steps:**
1. ✅ Run `cd packages/core-utils && pnpm build` - must compile without errors
2. ✅ Check `packages/core-utils/dist/i18n/index.d.ts` exists
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

## PHASE 2: Language Selector UI Implementation

### 2.1 Create Language Selector Component

**File: `apps/web-app/src/components/settings/LanguageSelector.tsx`** (NEW FILE)

```typescript
import React from 'react';
import { useTranslation } from '@2dots1line/core-utils';
import { useUserStore } from '../../stores/UserStore';
import { useNotificationStore } from '../../stores/NotificationStore';
import { GlassButton } from '@2dots1line/ui-components';
import { LOCALE_NAMES } from '@2dots1line/core-utils';
import { Locale } from '@2dots1line/core-utils';

interface LanguageSelectorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const { t, locale: currentLocale } = useTranslation();
  const { user, setLanguagePreference } = useUserStore();
  const { addNotification } = useNotificationStore();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    if (!user || newLocale === currentLocale || isUpdating) {
      return;
    }

    setIsUpdating(true);
    try {
      await setLanguagePreference(newLocale);
      
      // Show success notification
      addNotification({
        type: 'new_card_available', // Use existing notification type
        title: t('settings.language.updated'),
        description: `Language changed to ${LOCALE_NAMES[newLocale]}`,
        userId: user.user_id,
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
      addNotification({
        type: 'new_card_available',
        title: t('common.status.error'),
        description: 'Failed to update language preference',
        userId: user.user_id,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const languageOptions: { value: Locale; label: string }[] = [
    { value: 'en', label: LOCALE_NAMES.en },
    { value: 'zh-CN', label: LOCALE_NAMES['zh-CN'] },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-white/90 font-brand mb-2">
          {t('settings.language.title')}
        </label>
        <p className="text-xs text-white/60 mb-3">
          {t('settings.language.description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {languageOptions.map(({ value, label }) => (
          <GlassButton
            key={value}
            onClick={() => handleLanguageChange(value)}
            disabled={isUpdating}
            size={size}
            className={`w-full justify-start text-left transition-colors ${
              currentLocale === value 
                ? 'bg-white/20 text-white' 
                : 'hover:bg-white/10 text-white/80'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-brand">{label}</span>
              {currentLocale === value && (
                <span className="text-xs opacity-80">✓</span>
              )}
            </div>
          </GlassButton>
        ))}
      </div>
      
      {isUpdating && (
        <p className="text-xs text-white/60 text-center">
          {t('common.status.saving')}
        </p>
      )}
    </div>
  );
};
```

### 2.2 Integrate Language Selector into Global Settings

**File: `apps/web-app/src/components/modal/GlobalSettingsModal.tsx`**

**ADD import at top (after existing imports):**

```typescript
import { LanguageSelector } from '../settings/LanguageSelector';
```

**ADD new section BEFORE Background Media section (around line 79):**

```typescript
{/* Language Preference Settings */}
<div className="mb-8">
  <LanguageSelector />
</div>
```

**Verification:**
- ✅ Language selector appears in Global Settings modal
- ✅ Changing language updates all UI text immediately
- ✅ Success notification shows when language changes
- ✅ Language preference persists after page refresh

---

## PHASE 3: LLM Integration - Critical Implementation

### 3.1 Update Prompt Templates for Language Preference

**File: `config/prompt_templates.yaml`**

**⚠️ CRITICAL:** Add language preference section BEFORE `core_identity_section` (around line 9):

```yaml
# =============================================================================
# SECTION 0: USER LANGUAGE PREFERENCE (Highest Priority - 100% Cache Hit Rate)
# =============================================================================

user_language_preference_section: |
  === SECTION 0: USER LANGUAGE PREFERENCE ===
  
  **MANDATORY LANGUAGE INSTRUCTION:**
  User's preferred language: {{user_language_preference}}
  Language name: {{user_language_preference_name}}
  
  **CRITICAL RULE:** ALWAYS respond in {{user_language_preference_name}} unless the user explicitly switches languages mid-conversation.
  - If user_language_preference is 'en': Respond in English
  - If user_language_preference is 'zh-CN': Respond in Simplified Chinese (简体中文)
  - This preference overrides any input language detection
  - **VIOLATION OF THIS RULE WILL TERMINATE THE CONVERSATION.**
```

**UPDATE the existing language matching rule (around line 26):**

```yaml
# Change from:
1. **⚠️ CRITICAL: Language Matching** - ALWAYS respond in the same language that {{user_name}} uses. This is MANDATORY and non-negotiable. Violation will terminate the conversation.

# To:
2. **⚠️ CRITICAL: Language Matching** - ALWAYS respond in the same language that {{user_name}} uses. This is MANDATORY and non-negotiable. Violation will terminate the conversation.
  **NOTE:** User's stored language preference ({{user_language_preference}}) takes priority over input language detection.
```

### 3.2 Update Dialogue Worker Context Builder

**File: `workers/dialogue-worker/src/workers/DialogueWorker.ts`**

**⚠️ CRITICAL:** Find the method that builds prompt context (likely around line 200-300).

**ADD this method to load user language preference:**

```typescript
/**
 * Get user language preference for prompt context
 */
private async getUserLanguagePreference(userId: string): Promise<{
  user_language_preference: string;
  user_language_preference_name: string;
}> {
  try {
    const user = await this.dbService.prisma.users.findUnique({
      where: { user_id: userId },
      select: { language_preference: true }
    });

    const locale = user?.language_preference || 'en';
    
    // Map locale codes to LLM-readable names
    const localeNames: Record<string, string> = {
      'en': 'English',
      'zh-CN': 'Simplified Chinese (简体中文)'
    };

    return {
      user_language_preference: locale,
      user_language_preference_name: localeNames[locale] || 'English'
    };
  } catch (error) {
    console.error('[DialogueWorker] Failed to get user language preference:', error);
    return {
      user_language_preference: 'en',
      user_language_preference_name: 'English'
    };
  }
}
```

**UPDATE the prompt context building method to include language preference:**

```typescript
// In the method that builds prompt context, ADD this:
const languagePref = await this.getUserLanguagePreference(userId);

// Add to template variables:
const templateVariables = {
  user_name: user.name || 'User',
  user_language_preference: languagePref.user_language_preference,
  user_language_preference_name: languagePref.user_language_preference_name,
  // ... existing variables
};
```

### 3.3 Update Other Workers

**Apply the same pattern to:**

**File: `workers/insight-worker/src/InsightWorkflowOrchestrator.ts`**
- Add `getUserLanguagePreference()` method
- Include language preference in prompt context

**File: `workers/card-worker/src/CardWorker.ts`**
- Add `getUserLanguagePreference()` method  
- Include language preference in card generation prompts

**File: `workers/ingestion-worker/src/IngestionAnalyst.ts`**
- Add `getUserLanguagePreference()` method
- Include language preference in analysis prompts

### 3.4 Update ConfigService Template Loading

**File: `services/config-service/src/ConfigService.ts`**

**UPDATE the `getTemplate` method (around line 126) to support the new section:**

```typescript
public getTemplate(templateName: string, variables?: Record<string, any>): string {
  const templates = this.configCache.get('prompt_templates');
  if (!templates) {
    throw new Error('Prompt templates not loaded');
  }
  
  // Handle both structures: templates.templates[templateName] and templates[templateName]
  const template = templates.templates?.[templateName] || templates[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  // If variables provided, interpolate them
  if (variables) {
    return this.interpolateTemplate(template, variables);
  }
  
  return template;
}

/**
 * Interpolate template variables
 */
private interpolateTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}
```

---

## PHASE 4: Replace Hardcoded Text (Priority 1)

### 4.1 Update Landing Page

**File: `apps/web-app/src/components/layouts/Layout.tsx`**

**Import at top (after existing imports):**

```typescript
import { useTranslation } from '@2dots1line/core-utils';
```

**ADD at top of component (around line 27):**

```typescript
const { t } = useTranslation();
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

### 4.2 Update Chat Interface

**File: `apps/web-app/src/components/chat/ChatInterface.tsx`**

**Import at top (after existing imports):**

```typescript
import { useTranslation } from '@2dots1line/core-utils';
```

**ADD at top of component (around line 58):**

```typescript
const { t } = useTranslation();
```

**Replace line 1275** (input placeholder):

```typescript
// BEFORE:
placeholder="Ask anything"

// AFTER:
placeholder={t('chat.input.placeholder')}
```

**Replace error messages (around lines 879, 480):**

```typescript
// BEFORE:
content: `I apologize, but I encountered an error processing your message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,

// AFTER:
content: t('chat.errors.sendFailed', { message: error instanceof Error ? error.message : 'Unknown error' }),
```

### 4.3 Update Dashboard Modal

**File: `apps/web-app/src/components/modal/DashboardModal.tsx`**

**Import at top (after existing imports):**

```typescript
import { useTranslation } from '@2dots1line/core-utils';
```

**ADD at top of component (around line 41):**

```typescript
const { t } = useTranslation();
```

**Replace fallback content (lines 648-670):**

```typescript
// BEFORE:
<h1 className="text-4xl font-bold text-white mb-6 leading-tight">
  Your Journey Through the Cosmos
</h1>
<div className="text-lg text-white/90 leading-relaxed">
  <p>Welcome to your personal cosmic journey...</p>
  <p>The insights we've gathered show...</p>
  <p>As you explore the cards...</p>
  <p className="text-white/70 italic">
    "The cosmos is within us..."
  </p>
</div>

// AFTER:
<h1 className="text-4xl font-bold text-white mb-6 leading-tight">
  {t('dashboard.fallback.title')}
</h1>
<div className="text-lg text-white/90 leading-relaxed">
  <p>{t('dashboard.fallback.paragraph1')}</p>
  <p>{t('dashboard.fallback.paragraph2')}</p>
  <p>{t('dashboard.fallback.paragraph3')}</p>
  <p className="text-white/70 italic">
    {t('dashboard.fallback.quote')}
  </p>
</div>
```

**Replace empty state (around line 36):**

```typescript
// BEFORE:
<p className="text-sm">No recent cards available</p>

// AFTER:
<p className="text-sm">{t('dashboard.empty.noCards')}</p>
```

---

## PHASE 5: Testing & Validation

### 5.1 Manual Testing Checklist

- [ ] Language selector appears in Global Settings
- [ ] Changing language updates all UI text immediately
- [ ] Preference saves to database correctly
- [ ] Preference persists after logout/login
- [ ] LLM responds in selected language
- [ ] Fallback to English works if translation missing
- [ ] Browser language detection works for new users
- [ ] All hardcoded text replaced with translation keys

### 5.2 Edge Cases to Test

- [ ] User starts in English, switches to Chinese mid-conversation
- [ ] User types Chinese but preference is English (preference wins)
- [ ] Missing translation keys fall back gracefully
- [ ] Language switch during active chat doesn't break state
- [ ] Notification toasts show in correct language

### 5.3 LLM Integration Testing

- [ ] Test dialogue worker with English preference
- [ ] Test dialogue worker with Chinese preference
- [ ] Test insight worker with both languages
- [ ] Test card generation worker with both languages
- [ ] Verify prompt templates include language preference variables

---

## PHASE 6: Documentation

### 6.1 Developer Guide

**File: `docs/I18N_DEVELOPER_GUIDE.md`**

```markdown
# i18n Developer Guide

## Adding New UI Text

1. Add key to `config/translations/en.json`
2. Add corresponding translation to `config/translations/zh-CN.json`
3. Update TypeScript types in `packages/core-utils/src/i18n/types.ts`
4. Use in component: `const { t } = useTranslation(); return <span>{t('your.key')}</span>`

## Translation Key Naming

- Use dot notation: `section.subsection.key`
- Be descriptive: `settings.notifications.enable` not `settings.note.en`
- Group logically: `chat.errors.sendFailed` not `errors.chat.send`

## Variable Interpolation

```typescript
// In translation file:
"message": "Hello {{name}}, you have {{count}} messages"

// In component:
t('message', { name: 'John', count: 5 })
// Result: "Hello John, you have 5 messages"
```

## Testing Translations

```bash
# Validate JSON files
npx jsonlint config/translations/en.json
npx jsonlint config/translations/zh-CN.json

# Test in browser console
useTranslation().t('common.auth.login')
```

## Common Pitfalls

- ❌ Don't call `useTranslation()` in loops or conditionals
- ❌ Don't destructure `t` function outside component
- ❌ Don't forget to add translations to both language files
- ✅ Always use TypeScript types for translation keys
- ✅ Test with both languages before committing
```

### 6.2 Translation Guide

**File: `docs/TRANSLATION_GUIDE.md`**

```markdown
# Translation Guide for Danni

## Overview

This guide explains how to provide Chinese translations for the 2D1L application.

## File Structure

- `config/translations/en.json` - English (master) translations
- `config/translations/zh-CN.json` - Chinese translations (your file)

## Translation Process

1. **Review English text** in `en.json`
2. **Provide Chinese translation** in `zh-CN.json`
3. **Maintain exact structure** - both files must have identical keys
4. **Test in application** - change language preference to see results

## Key Guidelines

### Tone and Style
- Use formal but friendly tone (正式但友好)
- Match the cosmic/spiritual theme of the app
- Keep technical terms in English when appropriate

### Technical Terms
- "AI" → "AI" (keep as is)
- "Dashboard" → "仪表板"
- "Chat" → "对话"
- "Settings" → "设置"

### Variable Placeholders
- Keep `{{variable}}` exactly as shown
- Don't translate variable names
- Example: `"Hello {{name}}"` → `"你好 {{name}}"`

## Example Translation

```json
// English
{
  "common": {
    "auth": {
      "login": "Log in"
    }
  }
}

// Chinese
{
  "common": {
    "auth": {
      "login": "登录"
    }
  }
}
```

## Testing Your Translations

1. Open Global Settings
2. Change language to "简体中文"
3. Navigate through the app
4. Verify all text appears in Chinese
5. Test with different user scenarios

## Questions?

If you need clarification on any English text or want to suggest better Chinese translations, please ask!
```

---

## Implementation Order

1. ✅ **Phase 1.1-1.2**: Create translation files and core utilities
2. ✅ **Phase 1.3-1.4**: Update UserStore and API Gateway
3. ✅ **Phase 2.1-2.2**: Build language selector UI
4. ✅ **Phase 3.1-3.4**: Implement LLM integration
5. ✅ **Phase 4.1-4.3**: Replace Priority 1 hardcoded text
6. ✅ **Phase 5**: Testing and validation
7. ✅ **Phase 6**: Documentation

## Key Files to Modify

**New Files:**
- `config/translations/en.json`
- `config/translations/zh-CN.json`
- `packages/core-utils/src/i18n/types.ts`
- `packages/core-utils/src/i18n/i18nConfig.ts`
- `packages/core-utils/src/i18n/TranslationService.ts`
- `packages/core-utils/src/i18n/useTranslation.ts`
- `packages/core-utils/src/i18n/index.ts`
- `apps/web-app/src/components/settings/LanguageSelector.tsx`
- `docs/I18N_DEVELOPER_GUIDE.md`
- `docs/TRANSLATION_GUIDE.md`

**Modified Files:**
- `apps/web-app/src/stores/UserStore.ts`
- `apps/api-gateway/src/controllers/user.controller.ts`
- `apps/web-app/src/components/modal/GlobalSettingsModal.tsx`
- `apps/web-app/src/components/layouts/Layout.tsx`
- `apps/web-app/src/components/chat/ChatInterface.tsx`
- `apps/web-app/src/components/modal/DashboardModal.tsx`
- `config/prompt_templates.yaml`
- `workers/dialogue-worker/src/workers/DialogueWorker.ts`
- `workers/insight-worker/src/InsightWorkflowOrchestrator.ts`
- `workers/card-worker/src/CardWorker.ts`
- `workers/ingestion-worker/src/IngestionAnalyst.ts`
- `services/config-service/src/ConfigService.ts`
- `packages/core-utils/src/index.ts`

## Critical Success Factors

1. **Type Safety**: All translation keys must be typed to prevent runtime errors
2. **Performance**: Zero runtime cost - all translations loaded at startup
3. **LLM Integration**: Language preference must flow through to all workers
4. **User Experience**: Language switching must be instant and seamless
5. **Maintainability**: Adding new text requires updating both language files
6. **Testing**: Must test with both languages and all user scenarios

## Notes

- **No External Dependencies**: Custom lightweight solution fits monorepo architecture
- **Database Integration**: User preference stored in existing `language_preference` field
- **LLM Consistency**: Preference ensures consistent language across all AI interactions
- **Extensibility**: Easy to add more languages by creating new JSON files
- **Developer Control**: All translations in version-controlled files for easy management
