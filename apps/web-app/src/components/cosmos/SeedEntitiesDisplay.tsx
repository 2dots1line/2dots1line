'use client';

import React from 'react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { useEngagementStore } from '../../stores/EngagementStore';
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
}

const SeedEntitiesDisplay: React.FC<SeedEntitiesDisplayProps> = ({
  seedEntityIds,
  entities,
  selectedEntityId,
  onEntityClick
}) => {
  const { trackEvent } = useEngagementStore();

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

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-3/5 max-w-4xl">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="md"
        className="border border-white/20"
      >
        <div className="flex flex-wrap gap-2 justify-center">
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
