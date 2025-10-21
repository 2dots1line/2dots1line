'use client';

import React, { useEffect } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useDeviceStore } from '../../stores/DeviceStore';

interface DeviceDetectionProviderProps {
  children: React.ReactNode;
}

export const DeviceDetectionProvider: React.FC<DeviceDetectionProviderProps> = ({ children }) => {
  const deviceInfo = useDeviceDetection();
  const { setDeviceInfo } = useDeviceStore();
  
  useEffect(() => {
    try {
      // Only update if we have valid device info
      if (deviceInfo.screenWidth > 0) {
        setDeviceInfo(deviceInfo);
      }
    } catch (error) {
      console.error('DeviceDetectionProvider error:', error);
    }
  }, [deviceInfo, setDeviceInfo]);
  
  return <>{children}</>;
};
