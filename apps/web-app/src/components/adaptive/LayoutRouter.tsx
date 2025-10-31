'use client';

import React from 'react';
import { useDeviceStore } from '../../stores/DeviceStore';
import { useHUDStore } from '../../stores/HUDStore';
import Layout from '../layouts/Layout';
import { MobilePreviewToggle } from '../dev/MobilePreviewToggle';
import { MobileChatView } from '../chat/MobileChatView';
import { ContextualSettings } from '../settings/ContextualSettings';
import { MobileNavigationContainer } from '../mobile/MobileNavigationContainer';

export const LayoutRouter: React.FC = () => {
  const [isClient, setIsClient] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { deviceInfo } = useDeviceStore();
  const { 
    activeView,
    showSettings,
    toggleSettings
  } = useHUDStore();
  
  // Handle hydration - simplified to prevent SSR mismatch
  React.useEffect(() => {
    try {
      setIsClient(true);
      setIsHydrated(true);
    } catch (error) {
      console.error('LayoutRouter hydration error:', error);
      setHasError(true);
    }
  }, []);

  // Early return for SSR
  if (!isClient) {
    return <div>Loading...</div>;
  }

  // Error boundary fallback
  if (hasError) {
    return <div>Something went wrong. Please refresh the page.</div>;
  }
  
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
            
            {/* Always use Layout for background and main content */}
            <Layout />
            
            {/* Mobile-specific overlays */}
            {deviceInfo.isMobile && (
              <>
                {/* Mobile Navigation Container - replaces MobileHUDContainer */}
                <MobileNavigationContainer>
                  {/* Mobile HUD - legacy, will be removed */}
                  {/* <MobileHUDContainer /> */}
                
                
                {/* Mobile Chat View - for dedicated chat view */}
                {activeView === 'chat' && (
                  <div className="fixed inset-0 z-30">
                    <MobileChatView onBack={() => {}} />
                  </div>
                )}
                
                
                {/* Mobile Settings Panel */}
                {showSettings && (
                  <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
                    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/20 rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Settings</h2>
                        <button
                          onClick={() => toggleSettings()}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <ContextualSettings />
                    </div>
                  </div>
                )}
                </MobileNavigationContainer>
              </>
            )}
          </>
        );
};
