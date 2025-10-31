'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useHUDStore } from '../../stores/HUDStore';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation'; // fixed
import { useUserStore } from '../../stores/UserStore';

export const MobilePreviewToggle: React.FC = () => {
  const { deviceInfo, setDeviceInfo } = useDeviceStore();
  const { mobileHudVisible, setMobileHudVisible } = useHUDStore();
  const { user } = useUserStore();
  const { t } = useTranslation(user?.language_preference);

  // Only show in development - check for localhost
  if (typeof window === 'undefined' || !window.location.hostname.includes('localhost')) return null;

  const toggleMobile = () => {
    setDeviceInfo({
      ...deviceInfo,
      isMobile: !deviceInfo.isMobile,
    });
  };

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
      <button
        onClick={toggleMobile}
        className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-red-600 transition-colors"
      >
        {t(deviceInfo.isMobile ? 'dev.preview.desktop' : 'dev.preview.mobile')}
      </button>

      {deviceInfo.isMobile && (
        <button
          onClick={() => setMobileHudVisible(!mobileHudVisible)}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-600 transition-colors"
        >
          {t(mobileHudVisible ? 'dev.hud.hide' : 'dev.hud.show')}
        </button>
      )}
    </div>
  );
};
