'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React from 'react';

import { useHUDStore } from '../../stores/HUDStore';

import ChatModal from './ChatModal';
import DashboardModal from './DashboardModal';
import { CardModal } from './CardModal';
import { CosmosModal } from './CosmosModal';
import { FullscreenCardMatrix } from '../cards/FullscreenCardMatrix';
import { useCardStore } from '../../stores/CardStore';

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
  const { activeModal, setActiveModal } = useHUDStore();
  const { filteredCards, setSelectedCard, setCurrentView, loadCards, cards, isLoading } = useCardStore();

  // Load cards when cardMatrix modal opens if no cards are present
  React.useEffect(() => {
    if (activeModal === 'cardMatrix' && cards.length === 0 && !isLoading) {
      loadCards();
    }
  }, [activeModal, cards.length, isLoading, loadCards]);

  const handleClose = () => {
    setActiveModal(null);
  };

  const handleCardSelect = (card: any) => {
    setSelectedCard(card);
    setCurrentView('detail');
    setActiveModal('card');
  };

  return (
    <div className={className}>
      <DashboardModal 
        isOpen={activeModal === 'dashboard'} 
        onClose={handleClose} 
      />
      <ChatModal 
        isOpen={activeModal === 'chat'} 
        onClose={handleClose} 
      />
      <CardModal 
        isOpen={activeModal === 'card'} 
        onClose={handleClose} 
      />
      <CosmosModal 
        isOpen={activeModal === 'cosmos'} 
        onClose={handleClose} 
      />
      <SettingsModal 
        isOpen={activeModal === 'settings'} 
        onClose={handleClose} 
      />
      
      {/* Fullscreen Card Matrix */}
      <FullscreenCardMatrix
        cards={cards}
        onCardSelect={handleCardSelect}
        onClose={handleClose}
        cardSize="md"
        showSearch={true}
        showFilters={true}
        isVisible={activeModal === 'cardMatrix'}
      />
    </div>
  );
}; 