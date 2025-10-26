'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  hasTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    hasTouch: false,
    screenWidth: 0,
    screenHeight: 0,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      // Check if we're in browser environment
      if (typeof window === 'undefined') return;
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Enhanced device detection
      const isMobile = screenWidth <= 768;
      const isTablet = screenWidth > 768 && screenWidth <= 1024;
      const isDesktop = screenWidth > 1024;
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      (navigator as any).msMaxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile,
        hasTouch,
        screenWidth,
        screenHeight,
        isTablet,
        isDesktop,
      });
      
      console.log('📱 useDeviceDetection: Device detected', {
        isMobile,
        hasTouch,
        screenWidth,
        screenHeight,
        isTablet,
        isDesktop,
        userAgent: navigator.userAgent
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
