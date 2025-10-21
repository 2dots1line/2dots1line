'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useHUDStore } from '../../stores/HUDStore';

export const MobilePreviewToggle: React.FC = () => {
  const { deviceInfo, setDeviceInfo } = useDeviceStore();
  const { mobileHudVisible, setMobileHudVisible } = useHUDStore();
  
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
        {deviceInfo.isMobile ? 'Desktop' : 'Mobile'} Preview
      </button>
      
      {deviceInfo.isMobile && (
        <button
          onClick={() => setMobileHudVisible(!mobileHudVisible)}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-600 transition-colors"
        >
          {mobileHudVisible ? 'Hide' : 'Show'} HUD
        </button>
      )}
    </div>
  );
};
