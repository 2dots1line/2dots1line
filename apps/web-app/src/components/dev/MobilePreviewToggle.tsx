'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';

export const MobilePreviewToggle: React.FC = () => {
  const { deviceInfo, setDeviceInfo } = useDeviceStore();
  
  // Only show in development - check for localhost
  if (typeof window === 'undefined' || !window.location.hostname.includes('localhost')) return null;
  
  const toggleMobile = () => {
    setDeviceInfo({
      ...deviceInfo,
      isMobile: !deviceInfo.isMobile,
    });
  };
  
  return (
    <button
      onClick={toggleMobile}
      className="fixed top-4 left-4 z-50 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-red-600 transition-colors"
    >
      {deviceInfo.isMobile ? 'Desktop' : 'Mobile'} Preview
    </button>
  );
};
