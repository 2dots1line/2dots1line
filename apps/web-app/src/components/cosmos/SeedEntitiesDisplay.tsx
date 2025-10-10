'use client';

import React from 'react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';

interface SeedEntity {
  id: string;
  title?: string;
  type?: string;
}

interface SeedEntitiesDisplayProps {
  seedEntityIds: string[];
  entities: SeedEntity[];
  onEntityClick?: (entityId: string) => void;
}

const SeedEntitiesDisplay: React.FC<SeedEntitiesDisplayProps> = ({
  seedEntityIds,
  entities,
  onEntityClick
}) => {
  if (seedEntityIds.length === 0) {
    return null;
  }

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
              <GlassButton
                key={entityId}
                onClick={() => onEntityClick?.(entityId)}
                variant="default"
                size="sm"
                className="group relative"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="truncate max-w-32">
                    {displayTitle}
                  </span>
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white/90 whitespace-nowrap">
                    ID: {entityId}
                    {entity?.type && (
                      <div className="text-white/60 text-xs">
                        Type: {entity.type}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                </div>
              </GlassButton>
            );
          })}
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

export default SeedEntitiesDisplay;
