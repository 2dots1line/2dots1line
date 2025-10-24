'use client';

import React, { useState, useRef, useCallback } from 'react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { useEngagementStore } from '../../stores/EngagementStore';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { X } from 'lucide-react';
import CapsulePill from '../shared/CapsulePill';

interface SeedEntity {
  id: string;
  title?: string;
  type?: string;
}

interface SeedEntitiesDisplayProps {
  seedEntityIds: string[];
  entities: SeedEntity[];
  selectedEntityId?: string | null;
  onEntityClick?: (entityId: string) => void;
  onClose?: () => void;
}

const SeedEntitiesDisplay: React.FC<SeedEntitiesDisplayProps> = ({
  seedEntityIds,
  entities,
  selectedEntityId,
  onEntityClick,
  onClose
}) => {
  const { trackEvent } = useEngagementStore();
  const { isMobile, screenHeight } = useDeviceDetection();
  
  // Touch handling for swipe to close
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Touch handling functions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientY;
    const diff = touchStart - currentTouch;
    
    // Only start dragging if moving down significantly
    if (diff < -10) {
      setIsDragging(true);
    }
    
    setTouchEnd(currentTouch);
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isDownwardSwipe = distance < -50; // Swipe down to close
    
    if (isDownwardSwipe && isDragging && onClose) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
  }, [touchStart, touchEnd, isDragging, onClose]);

  if (seedEntityIds.length === 0) {
    return null;
  }

  const handleEntityClick = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    const entityName = entity?.title || entity?.type || `Entity ${entityId.slice(-6)}`;
    
    // Check if clicking the same entity that's already selected
    const isAlreadySelected = selectedEntityId === entityId;
    
    // Track entity capsule button click
    trackEvent({
      type: 'click',
      target: entityName,
      targetType: 'entity',
      view: 'cosmos',
      metadata: {
        entityId: entityId,
        entityTitle: entity?.title,
        entityType: entity?.type,
        action: isAlreadySelected ? 'capsule_button_modal_open' : 'capsule_button_click',
        source: 'seed_entities_display'
      }
    });

    if (isAlreadySelected) {
      // Second click on same entity - open modal
      // Dispatch event to open modal
      const modalEvent = new CustomEvent('open-entity-modal', {
        detail: { entityId, entity }
      });
      window.dispatchEvent(modalEvent);
    } else {
      // First click - focus camera
      onEntityClick?.(entityId);
    }
  };

  // Calculate mobile panel height (max 1/3 of viewport)
  const maxMobileHeight = screenHeight ? Math.min(screenHeight * 0.33, 300) : 300;

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-20 ${
      isMobile 
        ? 'px-2 pb-2' 
        : 'bottom-6 left-1/2 transform -translate-x-1/2 w-3/5 max-w-4xl'
    }`}>
      <GlassmorphicPanel
        ref={panelRef}
        variant="glass-panel"
        rounded="xl"
        padding="md"
        className={`border border-white/20 relative ${
          isMobile 
            ? 'w-full' 
            : ''
        }`}
        style={isMobile ? { maxHeight: `${maxMobileHeight}px` } : {}}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            aria-label="Close seed entities panel"
          >
            <X size={16} className="text-white/80" />
          </button>
        )}
        
        <div className={`flex flex-wrap gap-2 ${
          isMobile 
            ? 'justify-start overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent pr-8' 
            : 'justify-center'
        }`}
        style={isMobile ? { 
          maxHeight: `${maxMobileHeight - 32}px`, // Account for padding
        } : {}}
        >
          {seedEntityIds.map((entityId) => {
            const entity = entities.find(e => e.id === entityId);
            const displayTitle = entity?.title || entity?.type || `Entity ${entityId.slice(-6)}`;
            
            return (
              <CapsulePill
                key={entityId}
                type="entity"
                entityId={entityId}
                displayText={displayTitle}
                entityType={entity?.type as any}
                variant="block"
                isSelected={selectedEntityId === entityId}
                onEntityClick={onEntityClick}
              />
            );
          })}
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

export default SeedEntitiesDisplay;
