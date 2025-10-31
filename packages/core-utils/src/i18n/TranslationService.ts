import * as fs from 'fs';
import * as path from 'path';
import { Locale, TranslationVariables } from './types';
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
  private translations: Map<Locale, any> = new Map();
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
        const parsed = JSON.parse(content);
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
  public t(key: string, locale: Locale, variables?: TranslationVariables): string {
    // Try target locale first
    let value = this.getNestedValue(key, locale);
    
    // Fallback to default locale
    if (value === null && locale !== I18N_CONFIG.defaultLocale) {
      console.warn(`[TranslationService] Key "${key}" not found in ${locale}, falling back to ${I18N_CONFIG.defaultLocale}`);
      value = this.getNestedValue(key, I18N_CONFIG.defaultLocale);
    }
    
    // If still not found, return key as fallback
    if (value === null) {
      console.warn(`Translation key not found: ${key}`);
      return key;
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
  public getAllTranslations(locale: Locale): any | undefined {
    return this.translations.get(locale);
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();