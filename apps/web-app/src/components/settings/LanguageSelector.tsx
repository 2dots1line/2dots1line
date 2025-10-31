'use client';

import React, { useState } from 'react';
import { GlassButton } from '@2dots1line/ui-components';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';
import { LOCALE_NAMES, I18N_CONFIG } from '@2dots1line/core-utils/i18n/i18nConfig';
import { useUserStore } from '../../stores/UserStore';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { user, setLanguagePreference } = useUserStore();
  const { t, locale } = useTranslation(user?.language_preference);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale || isLoading) return;
    
    setIsLoading(true);
    try {
      await setLanguagePreference(newLocale);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update language preference:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-white/90 mb-2 font-brand">
        {t('settings.language')}
      </label>
      
      <div className="relative">
        <GlassButton
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full justify-between px-3 py-2 text-left hover:bg-white/20 disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-white/70" />
            <span className="text-white">
              {LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES] || locale}
            </span>
          </div>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/70">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </GlassButton>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50 overflow-hidden">
            {I18N_CONFIG.supportedLocales.map((supportedLocale) => (
              <button
                key={supportedLocale}
                onClick={() => handleLanguageChange(supportedLocale)}
                disabled={isLoading}
                className="w-full px-3 py-2 text-left hover:bg-white/20 transition-colors flex items-center justify-between text-white disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-white/50" />
                  <span>
                    {LOCALE_NAMES[supportedLocale as keyof typeof LOCALE_NAMES] || supportedLocale}
                  </span>
                </div>
                {supportedLocale === locale && (
                  <Check size={14} className="text-green-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};