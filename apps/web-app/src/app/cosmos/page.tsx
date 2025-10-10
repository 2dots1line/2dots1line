'use client';

import React, { useEffect } from 'react';
import { HUDContainer } from '../../components/hud/HUDContainer';
import { MediumChat, MiniChat } from '../../components/chat';
import { useHUDStore } from '../../stores/HUDStore';
import CosmosScene from './CosmosScene';

const CosmosPage: React.FC = () => {
  const { cosmosChatOpen, cosmosChatSize, setCosmosChatSize } = useHUDStore();

  return (
    <div className="w-screen h-screen bg-black">
      <CosmosScene />
      
      {/* Chat Components for Cosmos View */}
      {cosmosChatOpen && (
        <div className="fixed inset-0 z-[1010] pointer-events-none">
          {cosmosChatSize === 'medium' ? (
            <MediumChat 
              isOpen={cosmosChatOpen}
              onSizeChange={setCosmosChatSize}
              className="pointer-events-auto"
            />
          ) : (
            <MiniChat 
              isOpen={cosmosChatOpen}
              onSizeChange={setCosmosChatSize}
              className="pointer-events-auto"
            />
          )}
        </div>
      )}
      
      {/* Navigation HUD - Consistent across 2D and 3D views */}
      <HUDContainer />
    </div>
  );
};

export default CosmosPage;