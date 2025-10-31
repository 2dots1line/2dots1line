'use client';

import React from 'react';
import { HUDContainer } from '../../components/hud/HUDContainer';
import { MediumChat, MiniChat } from '../../components/chat';
import { useHUDStore } from '../../stores/HUDStore';
import { useDeviceStore } from '../../stores/DeviceStore';
import { MobileNavigationContainer } from '../../components/mobile/MobileNavigationContainer';
import CosmosScene from './CosmosScene';
import PWAInstallPrompt from '../../components/pwa/PWAInstallPrompt';

const CosmosPage: React.FC = () => {
  const { cosmosChatOpen, cosmosChatSize, setCosmosChatSize } = useHUDStore();
  const { deviceInfo } = useDeviceStore();

  return (
    <div className="w-screen h-screen bg-black">
      {deviceInfo.isMobile ? (
        <MobileNavigationContainer>
          <CosmosScene />
        </MobileNavigationContainer>
      ) : (
        <>
          <CosmosScene />
          
          {/* Chat Components for Cosmos View - Desktop only */}
          {cosmosChatOpen && (
            <div className="fixed inset-0 z-[1010] pointer-events-none">
              {cosmosChatSize === 'medium' ? (
                <MediumChat 
                  isOpen={cosmosChatOpen}
                  onSizeChange={setCosmosChatSize}
                />
              ) : (
                <MiniChat 
                  isOpen={cosmosChatOpen}
                  onSizeChange={setCosmosChatSize}
                />
              )}
            </div>
          )}
          
          {/* Navigation HUD - Desktop only */}
          <HUDContainer />
        </>
      )}
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default CosmosPage;