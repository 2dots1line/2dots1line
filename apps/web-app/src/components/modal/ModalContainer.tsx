'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React from 'react';

import { useHUDStore } from '../../stores/HUDStore';

import { CardModal } from './CardModal';
import ChatModal from './ChatModal';
import { CosmosModal } from './CosmosModal';
import DashboardModal from './DashboardModal';

interface ModalContainerProps {
  className?: string;
}



const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-2xl pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-brand">Settings</h2>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>
        <p className="text-white/80">Application settings and preferences will appear here.</p>
      </GlassmorphicPanel>
    </div>
  );
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  className,
}) => {
  const { activeView, setActiveView, cardDetailModalOpen, setCardDetailModalOpen } = useHUDStore();
  
  const handleClose = () => {
    setActiveView(null);
  };

  const handleCardModalClose = () => {
    setCardDetailModalOpen(false);
  };

  return (
    <div className={className}>
      {/* Main View Modals - Only show when not in cards view (mutually exclusive) */}
      {activeView && activeView !== 'cards' && (
        <>
          <DashboardModal 
            isOpen={activeView === 'dashboard'} 
            onClose={handleClose} 
          />
          <ChatModal 
            isOpen={activeView === 'chat'} 
            onClose={handleClose} 
          />
          <CosmosModal 
            isOpen={activeView === 'cosmos'} 
            onClose={handleClose} 
          />
          <SettingsModal 
            isOpen={activeView === 'settings'} 
            onClose={handleClose} 
          />
        </>
      )}
      
      {/* Card Detail Modal - Can overlay on cards view */}
      <CardModal 
        isOpen={cardDetailModalOpen} 
        onClose={handleCardModalClose} 
      />
    </div>
  );
}; 