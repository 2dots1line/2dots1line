'use client';

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React, { useState } from 'react';

import { useHUDStore } from '../../stores/HUDStore';
import { useCardStore } from '../../stores/CardStore';
import { useChatStore } from '../../stores/ChatStore';
import { useBackgroundVideoStore, type ViewType } from '../../stores/BackgroundVideoStore';
import { PexelsSearchModal } from './PexelsSearchModal';

import { EnhancedCardModal } from './EnhancedCardModal';
import ChatModal from './ChatModal';
import { CosmosModal } from './CosmosModal';
import DashboardModal from './DashboardModal';
import { ConversationHistoryModal } from './ConversationHistoryModal';

interface ModalContainerProps {
  className?: string;
}



const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { mediaPreferences, setMediaForView, resetToDefaults } = useBackgroundVideoStore();
  const [pexelsModalOpen, setPexelsModalOpen] = useState(false);
  const [targetView, setTargetView] = useState<ViewType>('dashboard');
  
  if (!isOpen) return null;
  
  const localVideoOptions = [
    { value: 'Cloud1.mp4', label: 'Cloud 1' },
    { value: 'Cloud2.mp4', label: 'Cloud 2' },
    { value: 'Cloud3.mp4', label: 'Cloud 3' },
    { value: 'Cloud4.mp4', label: 'Cloud 4' },
    { value: 'Star1.mp4', label: 'Stars' },
  ] as const;

  const views = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'chat', label: 'Chat' },
    { key: 'cards', label: 'Cards' },
    { key: 'settings', label: 'Settings' },
  ] as const;
  
  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
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
        
        {/* Background Media Settings */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Background Media</h3>
          <p className="text-white/80 mb-6">
            Choose different background media for each 2D view. You can use local videos or search for new ones from Pexels.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {views.map(({ key, label }) => {
              const currentMedia = mediaPreferences[key];
              const isLocal = currentMedia?.source === 'local';
              const isPexels = currentMedia?.source === 'pexels';
              
              return (
                <div key={key} className="space-y-3">
                  <label className="block text-sm font-medium text-white/90">
                    {label} View
                  </label>
                  
                  {/* Current Media Display */}
                  <div className="text-sm text-white/70 mb-2">
                    {isLocal && `Local: ${currentMedia?.id}`}
                    {isPexels && `Pexels: ${currentMedia?.title || 'Custom Media'}`}
                  </div>
                  
                  {/* Local Video Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-white/60">Local Videos</label>
                    <select
                      value={isLocal ? currentMedia?.id : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setMediaForView(key, {
                            source: 'local',
                            type: 'video',
                            id: e.target.value
                          });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm"
                    >
                      <option value="">Select local video...</option>
                      {localVideoOptions.map(({ value, label }) => (
                        <option key={value} value={value} className="bg-gray-800 text-white">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Pexels Search Button */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-white/60">Pexels Library</label>
                    <GlassButton
                      onClick={() => {
                        setTargetView(key);
                        setPexelsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-sm hover:bg-white/20"
                    >
                      Search Pexels
                    </GlassButton>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6">
            <GlassButton
              onClick={resetToDefaults}
              className="px-4 py-2 text-sm hover:bg-white/20"
            >
              Reset to Defaults
            </GlassButton>
          </div>
        </div>
        
        {/* Placeholder for other settings */}
        <div className="border-t border-white/20 pt-6">
          <h3 className="text-xl font-semibold text-white mb-4">Other Settings</h3>
          <p className="text-white/80">Additional application settings will appear here.</p>
        </div>
        
        {/* Pexels Search Modal */}
        <PexelsSearchModal
          isOpen={pexelsModalOpen}
          onClose={() => setPexelsModalOpen(false)}
          targetView={targetView}
        />
      </GlassmorphicPanel>
    </div>
  );
};

export const ModalContainer: React.FC<ModalContainerProps> = ({
  className,
}) => {
  const { activeView, setActiveView, cardDetailModalOpen, setCardDetailModalOpen } = useHUDStore();
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
      {selectedCard && (
        <EnhancedCardModal
          card={selectedCard}
          isOpen={cardDetailModalOpen}
          onClose={handleCardModalClose}
        />
      )}

      {/* Conversation History Modal - Global modal */}
      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}; 