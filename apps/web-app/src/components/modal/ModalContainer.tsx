'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useHUDStore, ModalType } from '../../stores/HUDStore';
import DashboardModal from './DashboardModal';
import ChatModal from './ChatModal';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';

interface ModalContainerProps {
  className?: string;
}

// Placeholder modal components for Card, Graph, and Settings
const CardModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
          <h2 className="text-2xl font-bold text-white font-brand">Memory Cards</h2>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>
        <p className="text-white/80">Memory card interface will appear here.</p>
      </GlassmorphicPanel>
    </div>
  );
};

const GraphModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-4 z-40 flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="lg"
        className="relative w-full max-w-4xl pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-brand">Knowledge Graph</h2>
          <GlassButton
            onClick={onClose}
            className="p-2 hover:bg-white/20"
          >
            <X size={20} className="stroke-current" />
          </GlassButton>
        </div>
        <p className="text-white/80">Knowledge graph visualization will appear here.</p>
      </GlassmorphicPanel>
    </div>
  );
};

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

  const handleClose = () => {
    setActiveModal(null);
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
      <GraphModal 
        isOpen={activeModal === 'graph'} 
        onClose={handleClose} 
      />
      <SettingsModal 
        isOpen={activeModal === 'settings'} 
        onClose={handleClose} 
      />
    </div>
  );
}; 