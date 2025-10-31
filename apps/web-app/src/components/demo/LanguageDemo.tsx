'use client';

import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { GlassmorphicPanel } from '@2dots1line/ui-components';

export const LanguageDemo: React.FC = () => {
  const { t, locale } = useTranslation();

  return (
    <GlassmorphicPanel
      variant="glass-panel"
      rounded="lg"
      padding="md"
      className="max-w-md mx-auto mt-8"
    >
      <h3 className="text-lg font-bold text-white mb-4 font-brand">
        {t('common.demo')} - i18n
      </h3>
      
      <div className="space-y-3 text-white/90">
        <p><strong>{t('common.currentLanguage')}:</strong> {locale}</p>
        <p><strong>{t('common.welcome')}:</strong> {t('landing.welcome')}</p>
        <p><strong>{t('common.description')}:</strong> {t('landing.subtitle')}</p>
        <p><strong>{t('settings.language')}:</strong> {t('settings.language.title')}</p>
        
        <div className="pt-4 border-t border-white/20">
          <p className="text-sm text-white/70">
            {t('common.changeLanguageInSettings')}
          </p>
        </div>
      </div>
    </GlassmorphicPanel>
  );
};