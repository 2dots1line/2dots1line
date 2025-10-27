'use client';

import { useState, useCallback } from 'react';
import { transformCoordinatesByRotation } from '../components/cosmos/coordinateTransform';

export const useEntitySelection = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const selectEntity = useCallback((entityId: string, graphData: any, positionScale: number = 10) => {
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
      
      // Transform coordinates by current rotation
      const transformedPosition = transformCoordinatesByRotation({
        x: originalX,
        y: originalY,
        z: originalZ
      });
      
      console.log('🎯 Entity focus: transformed coordinates', { original: { x: originalX, y: originalY, z: originalZ }, transformed: transformedPosition });
      
      // Dispatch camera focus event with transformed coordinates
      setTimeout(() => {
        const event = new CustomEvent('camera-focus-request', {
          detail: {
            position: transformedPosition,
            entity: {
              id: entity.id,
              title: entity.title || entity.label || entity.id,
              type: entity.type || entity.entity_type || 'unknown'
            }
          }
        });
        window.dispatchEvent(event);
        console.log('🎯 Entity focus: camera positioned');
      }, 100); // Small delay to ensure camera controller is ready
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
