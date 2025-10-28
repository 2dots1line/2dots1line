'use client';

import { useState, useCallback } from 'react';
// Dynamic import to avoid SSR issues

export const useEntitySelection = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const selectEntity = useCallback(async (entityId: string, graphData: any, positionScale: number = 10) => {
    console.log('🎯 useEntitySelection: selectEntity called with:', { entityId, positionScale });
    const entity = graphData.nodes?.find((node: any) => node.id === entityId);
    console.log('🎯 useEntitySelection: Found entity:', entity);
    
    if (entity) {
      setSelectedEntityId(entityId);
      console.log('🎯 useEntitySelection: Set selectedEntityId to:', entityId);
      
      // Pause auto rotation immediately when entity is clicked
      window.dispatchEvent(new CustomEvent('pause-auto-rotation', {
        detail: { pause: true, reason: 'entity-click' }
      }));
      
      // Calculate scaled position
      const originalX = (entity.position_x || entity.x || 0) * positionScale;
      const originalY = (entity.position_y || entity.y || 0) * positionScale;
      const originalZ = (entity.position_z || entity.z || 0) * positionScale;
      
      // SIMPLE APPROACH: Reset first, then focus on static coordinates
      console.log('🎯 Entity focus: resetting first, then focusing on static coordinates', { x: originalX, y: originalY, z: originalZ });
      
      // Step 1: Reset cluster to initial rotation
      window.dispatchEvent(new CustomEvent('camera-reset', {
        detail: { reason: 'entity-focus-reset' }
      }));
      
      // Step 2: Focus on entity after reset (use static coordinates)
      setTimeout(() => {
        const event = new CustomEvent('camera-focus-request', {
          detail: {
            position: { x: originalX, y: originalY, z: originalZ }, // Static coordinates
            entity: {
              id: entity.id,
              title: entity.title || entity.label || entity.id,
              type: entity.type || entity.entity_type || 'unknown'
            }
          }
        });
        window.dispatchEvent(event);
        console.log('🎯 Entity focus: reset complete, camera positioned');
      }, 100); // Small delay to ensure reset is complete
    } else {
      console.warn('🎯 useEntitySelection: Entity not found:', entityId);
    }
    return entity;
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedEntityId(null);
  }, []);
  
  return { selectedEntityId, selectEntity, clearSelection };
};
