'use client';

import React from 'react';

import { useHUDStore } from '../../stores/HUDStore';
import { useCardStore } from '../../stores/CardStore';
import { useChatStore } from '../../stores/ChatStore';

import { EntityDetailModal } from './EntityDetailModal';
import { ChatModal } from '../chat';
import DashboardModal from './DashboardModal';
import { ConversationHistoryModal } from './ConversationHistoryModal';
import { GlobalSettingsModal } from './GlobalSettingsModal';
import { PexelsSearchModal } from './PexelsSearchModal';

interface ModalContainerProps {
  className?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  className,
}) => {
  const { activeView, setActiveView, cardDetailModalOpen, setCardDetailModalOpen, showGlobalSettings, setShowGlobalSettings, pexelsModalView, setPexelsModalView } = useHUDStore();
  const { selectedCard } = useCardStore();
  const { showHistoryModal, setShowHistoryModal } = useChatStore();
  
  const handleClose = () => {
    setActiveView(null);
  };

  const handleCardModalClose = () => {
    setCardDetailModalOpen(false);
  };

  return (
    <div className={className}>
      {/* Main View Modals - Only show when not in cards view and not settings (mutually exclusive) */}
      {activeView && activeView !== 'cards' && activeView !== 'settings' && (
        <>
          <DashboardModal 
            isOpen={activeView === 'dashboard'} 
            onClose={handleClose} 
          />
          <ChatModal 
            isOpen={activeView === 'chat'} 
            onClose={handleClose} 
          />
        </>
      )}
      
      {/* Global Settings Modal - controlled separately via showGlobalSettings */}
      <GlobalSettingsModal
        isOpen={showGlobalSettings}
        onClose={() => setShowGlobalSettings(false)}
      />
      
      {/* Card Detail Modal - Can overlay on cards view */}
      {selectedCard && (
        <EntityDetailModal
          entity={selectedCard}
          isOpen={cardDetailModalOpen}
          onClose={handleCardModalClose}
        />
      )}

      {/* Conversation History Modal - Global modal */}
      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
      
      {/* Pexels Search Modal - Global modal for background video selection */}
      {pexelsModalView && (
        <PexelsSearchModal
          isOpen={!!pexelsModalView}
          onClose={() => setPexelsModalView(null)}
          targetView={pexelsModalView as any}
        />
      )}
    </div>
  );
};