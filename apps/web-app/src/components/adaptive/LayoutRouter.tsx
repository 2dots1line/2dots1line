'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useHUDStore } from '../../stores/HUDStore';
import DesktopLayout from '../layouts/DesktopLayout';
import { MobilePreviewToggle } from '../dev/MobilePreviewToggle';
import { MobileHUDContainer } from '../hud/MobileHUDContainer';
import { MobileChatOverlay } from '../chat/MobileChatOverlay';
import { MobileChatView } from '../chat/MobileChatView';

export const LayoutRouter: React.FC = () => {
  const { deviceInfo } = useDeviceStore();
  const { activeView } = useHUDStore();
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
            
            {/* Always use DesktopLayout for background and main content */}
            <DesktopLayout />
            
            {/* Mobile-specific overlays */}
            {deviceInfo.isMobile && (
              <>
                {/* Mobile HUD - replaces desktop HUD */}
                <MobileHUDContainer />
                
                {/* Mobile Chat Overlay - for Cards/Cosmos views */}
                {activeView === 'cards' || activeView === 'cosmos' ? (
                  <MobileChatOverlay 
                    isOpen={true} // Always open on mobile for these views
                    onClose={() => {}}
                  />
                ) : null}
                
                {/* Mobile Chat View - for dedicated chat view */}
                {activeView === 'chat' && (
                  <div className="fixed inset-0 z-30">
                    <MobileChatView onBack={() => {}} />
                  </div>
                )}
              </>
            )}
          </>
        );
};
