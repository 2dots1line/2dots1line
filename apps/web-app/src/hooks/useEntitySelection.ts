'use client';

import { useState, useCallback } from 'react';

export const useEntitySelection = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const selectEntity = useCallback((entityId: string, graphData: any, positionScale: number = 10) => {
    console.log('🎯 useEntitySelection: selectEntity called with:', { entityId, positionScale });
    const entity = graphData.nodes?.find((node: any) => node.id === entityId);
    console.log('🎯 useEntitySelection: Found entity:', entity);
    
    if (entity) {
      setSelectedEntityId(entityId);
      console.log('🎯 useEntitySelection: Set selectedEntityId to:', entityId);
      
      // Calculate scaled position
      const x = (entity.position_x || entity.x || 0) * positionScale;
      const y = (entity.position_y || entity.y || 0) * positionScale;
      const z = (entity.position_z || entity.z || 0) * positionScale;
      
      console.log('🎯 useEntitySelection: Calculated position:', { x, y, z });
      
      // Dispatch camera focus event with a small delay to ensure camera controller is ready
      setTimeout(() => {
        const event = new CustomEvent('camera-focus-request', {
          detail: {
            position: { x, y, z },
            entity: {
              id: entity.id,
              title: entity.title || entity.label || entity.id,
              type: entity.type || entity.entity_type || 'unknown'
            }
          }
        });
        window.dispatchEvent(event);
        console.log('🎯 useEntitySelection: Dispatched camera-focus-request event with delay');
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
