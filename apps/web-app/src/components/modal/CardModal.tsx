/**
 * CardModal - Individual card detail modal
 * V11.0 - Simplified to show only card details (gallery moved to InfiniteCardCanvas)
 */

import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X } from 'lucide-react';
import React from 'react';

import { useCardStore } from '../../stores/CardStore';
import './CardModal.css';

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
        className="absolute inset-0 card-modal-backdrop"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4">
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="lg"
          className="relative overflow-hidden card-modal-panel"
        >
          {/* Header */}
          <div className="card-modal-header">
            <h2 className="card-modal-title">
              {selectedCard.title || selectedCard.entity_type?.replace(/_/g, ' ') || 'Card Details'}
            </h2>
            <GlassButton
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <X size={20} />
            </GlassButton>
          </div>
          
          {/* Card Content */}
          <div className="card-modal-content">
            {/* Card Type */}
            <div className="card-modal-section">
              <div className="card-modal-label">Type</div>
              <div className="card-modal-value">{selectedCard.entity_type?.replace(/_/g, ' ') || 'Unknown'}</div>
            </div>
            
            {/* Card Description */}
            {selectedCard.content && (
              <div className="card-modal-section">
                <div className="card-modal-label">Description</div>
                <div className="card-modal-value">{selectedCard.content}</div>
              </div>
            )}
            
            {/* Card Status */}
            <div className="card-modal-section">
              <div className="card-modal-label">Status</div>
              <div className="card-modal-value">{selectedCard.status || 'Unknown'}</div>
            </div>
            
            {/* Source Entity */}
            {typeof selectedCard.source_entity_type === 'string' && (
              <div className="card-modal-section">
                <div className="card-modal-label">Source</div>
                <div className="card-modal-value">{selectedCard.source_entity_type.replace(/_/g, ' ')}</div>
              </div>
            )}
            
            {/* Created Date */}
            {selectedCard.created_at && (
              <div className="card-modal-section">
                <div className="card-modal-label">Created</div>
                <div className="card-modal-value">{new Date(selectedCard.created_at).toLocaleDateString()}</div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="card-modal-actions">
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