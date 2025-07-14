/**
 * CardModal - Individual card detail modal
 * V11.0 - Simplified to show only card details (gallery moved to InfiniteCardCanvas)
 */

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React from 'react';

import { useCardStore } from '../../stores/CardStore';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose
}) => {
  const { selectedCard, setSelectedCard } = useCardStore();
  
  if (!isOpen || !selectedCard) {
    return null;
  }

  const handleClose = () => {
    setSelectedCard(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4">
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="lg"
          className="relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedCard.display_data?.title || selectedCard.card_type?.replace(/_/g, ' ') || 'Card Details'}
            </h2>
            <GlassButton
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X size={20} />
            </GlassButton>
          </div>
          
          {/* Card Content */}
          <div className="space-y-4">
            {/* Card Type */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Type</h3>
              <p className="text-white">{selectedCard.card_type?.replace(/_/g, ' ')}</p>
            </div>
            
            {/* Card Description */}
            {selectedCard.display_data?.preview && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Description</h3>
                <p className="text-white">{selectedCard.display_data.preview}</p>
              </div>
            )}
            
            {/* Card Status */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Status</h3>
              <p className="text-white">{selectedCard.status || 'Unknown'}</p>
            </div>
            
            {/* Source Entity */}
            {selectedCard.source_entity_type && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Source</h3>
                <p className="text-white">{selectedCard.source_entity_type.replace(/_/g, ' ')}</p>
              </div>
            )}
            
            {/* Created Date */}
            {selectedCard.created_at && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Created</h3>
                <p className="text-white">{new Date(selectedCard.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end mt-8 space-x-3">
            <GlassButton
              onClick={handleClose}
              className="px-6 py-2"
            >
              Close
            </GlassButton>
          </div>
        </GlassmorphicPanel>
      </div>
    </div>
  );
}; 