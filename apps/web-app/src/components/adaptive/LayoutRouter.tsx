'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';
import DesktopLayout from '../layouts/DesktopLayout';
import MobileLayout from '../layouts/MobileLayout';
import { MobilePreviewToggle } from '../dev/MobilePreviewToggle';

export const LayoutRouter: React.FC = () => {
  const { deviceInfo } = useDeviceStore();
  const [isClient, setIsClient] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  
  // Handle hydration
  React.useEffect(() => {
    try {
      setIsClient(true);
      // Small delay to ensure device detection has run
      const timer = setTimeout(() => {
        setIsHydrated(true);
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('LayoutRouter hydration error:', error);
      setHasError(true);
    }
  }, []);
  
  // Show error state if something went wrong
  if (hasError) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <div>Something went wrong. Please refresh the page.</div>
          </div>
        </main>
      </div>
    );
  }
  
  // Show loading state while hydrating or device detection is initializing
  if (!isClient || !isHydrated) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <MobilePreviewToggle />
      {deviceInfo.isMobile ? <MobileLayout /> : <DesktopLayout />}
    </>
  );
};
