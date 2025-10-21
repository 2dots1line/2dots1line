'use client';
import React from 'react';
import { GlassButton } from '@2dots1line/ui-components';
import { ExternalLink } from 'lucide-react';
import { useEngagementStore } from '../../stores/EngagementStore';

type CapsuleType = 'entity' | 'web_source';
type EntityType = 'concept' | 'memory_unit' | 'artifact' | 'growth_event' | 'prompt' | 'community';

interface CapsulePillProps {
  displayText: string;
  variant?: 'inline' | 'block';
  type?: CapsuleType;
  entityId?: string;
  entityType?: EntityType;
  url?: string;
  isSelected?: boolean;
  onEntityClick?: (entityId: string) => void; // For Cosmos camera focus
}

const CapsulePill: React.FC<CapsulePillProps> = ({
  displayText,
  variant = 'inline',
  type = 'entity',
  entityId,
  entityType,
  url,
  isSelected = false,
  onEntityClick
}) => {
  const { trackEvent } = useEngagementStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (type === 'web_source' && url) {
      // Web source - always open in new tab
      trackEvent({
        type: 'click',
        target: displayText,
        targetType: 'entity',
        view: variant === 'block' ? 'cosmos' : 'dashboard',
        metadata: { url, source: variant === 'block' ? 'seed_entities' : 'insight_worker' }
      });
      window.open(url, '_blank', 'noopener,noreferrer');
      
    } else if (type === 'entity' && entityId) {
      // Entity capsule
      const view = variant === 'inline' ? 'dashboard' : 'cosmos';
      
      trackEvent({
        type: 'click',
        target: displayText,
        targetType: 'entity',
        view,
        metadata: {
          entityId,
          entityType,
          action: isSelected ? 'capsule_button_modal_open' : 'capsule_button_click',
          source: variant === 'inline' ? 'opening_artifact' : 'seed_entities_display'
        }
      });

      if (variant === 'block') {
        // Cosmos: Preserve double-click behavior
        if (isSelected) {
          // Second click - open modal
          window.dispatchEvent(new CustomEvent('open-entity-modal', {
            detail: { entityId, entityType, displayText }
          }));
        } else {
          // First click - focus camera
          onEntityClick?.(entityId);
        }
      } else {
        // Dashboard inline: Single-click opens modal
        window.dispatchEvent(new CustomEvent('open-entity-modal', {
          detail: { entityId, entityType, displayText }
        }));
      }
    }
  };

  const getColorClasses = () => {
    // Web sources blue
    if (type === 'web_source') {
      return {
        bg: 'bg-blue-500/10',
        hover: 'hover:bg-blue-500/20',
        border: 'border-blue-400/30',
        hoverBorder: 'hover:border-blue-400/50',
        text: 'text-blue-300',
        hoverText: 'hover:text-blue-200',
        dot: 'bg-blue-400'
      };
    }
    
    // Entity colors by type
    const colorMap: Record<EntityType, any> = {
      concept: { bg: 'bg-green-500/10', hover: 'hover:bg-green-500/20', border: 'border-green-400/30', hoverBorder: 'hover:border-green-400/50', text: 'text-green-300', hoverText: 'hover:text-green-200', dot: 'bg-green-400' },
      memory_unit: { bg: 'bg-purple-500/10', hover: 'hover:bg-purple-500/20', border: 'border-purple-400/30', hoverBorder: 'hover:border-purple-400/50', text: 'text-purple-300', hoverText: 'hover:text-purple-200', dot: 'bg-purple-400' },
      artifact: { bg: 'bg-yellow-500/10', hover: 'hover:bg-yellow-500/20', border: 'border-yellow-400/30', hoverBorder: 'hover:border-yellow-400/50', text: 'text-yellow-300', hoverText: 'hover:text-yellow-200', dot: 'bg-yellow-400' },
      growth_event: { bg: 'bg-pink-500/10', hover: 'hover:bg-pink-500/20', border: 'border-pink-400/30', hoverBorder: 'hover:border-pink-400/50', text: 'text-pink-300', hoverText: 'hover:text-pink-200', dot: 'bg-pink-400' },
      prompt: { bg: 'bg-orange-500/10', hover: 'hover:bg-orange-500/20', border: 'border-orange-400/30', hoverBorder: 'hover:border-orange-400/50', text: 'text-orange-300', hoverText: 'hover:text-orange-200', dot: 'bg-orange-400' },
      community: { bg: 'bg-cyan-500/10', hover: 'hover:bg-cyan-500/20', border: 'border-cyan-400/30', hoverBorder: 'hover:border-cyan-400/50', text: 'text-cyan-300', hoverText: 'hover:text-cyan-200', dot: 'bg-cyan-400' }
    };
    
    // Ensure we always return a valid color object
    const validEntityType = entityType && colorMap[entityType] ? entityType : 'concept';
    return colorMap[validEntityType];
  };

  const colors = getColorClasses();

  // Inline variant - Dashboard style pill
  if (variant === 'inline') {
    return (
      <a
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 ${colors.bg} ${colors.hover} border ${colors.border} ${colors.hoverBorder} rounded-full text-xs ${colors.text} ${colors.hoverText} transition-all cursor-pointer group`}
        title={type === 'web_source' ? `Open: ${url}` : `Click to explore ${entityType || 'entity'}`}
      >
        <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-pulse`}></div>
        <span className="font-medium">{displayText}</span>
        {type === 'web_source' && <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />}
      </a>
    );
  }

  // Block variant - Cosmos style
  return (
    <GlassButton
      onClick={handleClick}
      variant="default"
      size="sm"
      className={`group relative ${isSelected ? 'ring-2 ring-green-400 ring-opacity-50 bg-green-500/20' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`}></div>
        <span className="truncate max-w-32">{displayText}</span>
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white/90 whitespace-nowrap">
          <div>ID: {entityId}</div>
          {entityType && <div className="text-white/60 text-xs">Type: {entityType}</div>}
        </div>
      </div>
    </GlassButton>
  );
};

export default CapsulePill;
