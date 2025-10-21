'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const detectDevice = () => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') return;
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Simple mobile detection: screen width <= 768px
      const isMobile = screenWidth <= 768;
      
      setDeviceInfo({
        isMobile,
        screenWidth,
        screenHeight,
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      detectDevice();
    });
    
    // Listen for resize events
    const handleResize = () => {
      detectDevice();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceInfo;
};
