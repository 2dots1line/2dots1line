/**
 * NodeCardDisplay Component
 * Displays card data in a rich, formatted way for the Cosmos node modal
 */

import React from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
import { CardTile } from '@2dots1line/ui-components';
import { Star, Share2, Archive, Edit, ExternalLink } from 'lucide-react';

interface NodeCardDisplayProps {
  card: DisplayCard | null;
  node: any;
  onCardAction?: (action: string, cardId: string) => void;
  className?: string;
}

interface NodeCardDisplayState {
  isHovered: boolean;
  showActions: boolean;
}

export const NodeCardDisplay: React.FC<NodeCardDisplayProps> = ({
  card,
  node,
  onCardAction,
  className = ''
}) => {
  const [state, setState] = React.useState<NodeCardDisplayState>({
    isHovered: false,
    showActions: false
  });

  // Fallback to node data if card is not available
  const displayTitle = card?.title || node?.properties?.title || node?.name || 'Untitled Node';
  const displayContent = card?.content || node?.properties?.content || 'No description available';
  const displayType = card?.entity_type || node?.properties?.type || 'Unknown';
  const displayStatus = card?.status || 'active';
  const displayCreatedAt = card?.created_at || node?.properties?.metadata?.createdAt;
  const displayImportance = node?.properties?.importance || 0.5;

  const handleAction = (action: string) => {
    if (card && onCardAction) {
      onCardAction(action, card.card_id);
    }
  };

  const handleMouseEnter = () => {
    setState(prev => ({ ...prev, isHovered: true }));
  };

  const handleMouseLeave = () => {
    setState(prev => ({ ...prev, isHovered: false }));
  };

  const toggleActions = () => {
    setState(prev => ({ ...prev, showActions: !prev.showActions }));
  };

  return (
    <div
      className={`node-card-display ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card Container */}
      <div className="relative bg-black/40 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        {/* Background Image (if available) */}
        {card?.background_image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${card.background_image_url})` }}
          />
        )}

        {/* Content Overlay */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">
                {displayTitle}
              </h2>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="px-2 py-1 bg-white/10 rounded-full">
                  {displayType.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-1 bg-white/10 rounded-full">
                  {displayStatus.replace(/_/g, ' ')}
                </span>
                {displayImportance > 0.7 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star size={14} fill="currentColor" />
                    High Priority
                  </span>
                )}
              </div>
            </div>

            {/* Action Toggle */}
            <button
              onClick={toggleActions}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Edit size={16} className="text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-white/90 leading-relaxed">
              {displayContent}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm text-white/60 mb-6">
            {displayCreatedAt && (
              <div>
                <span className="block text-white/40 text-xs uppercase tracking-wide mb-1">
                  Created
                </span>
                <span>{new Date(displayCreatedAt).toLocaleDateString()}</span>
              </div>
            )}
            {card?.updated_at && (
              <div>
                <span className="block text-white/40 text-xs uppercase tracking-wide mb-1">
                  Updated
                </span>
                <span>{new Date(card.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Actions Panel */}
          {state.showActions && (
            <div className="border-t border-white/20 pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('favorite')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    card?.is_favorited 
                      ? 'bg-yellow-500/20 text-yellow-300' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Star size={14} fill={card?.is_favorited ? 'currentColor' : 'none'} />
                  {card?.is_favorited ? 'Favorited' : 'Favorite'}
                </button>

                <button
                  onClick={() => handleAction('share')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Share2 size={14} />
                  Share
                </button>

                <button
                  onClick={() => handleAction('archive')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>

                <button
                  onClick={() => handleAction('view')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} />
                  View Full
                </button>
              </div>
            </div>
          )}

          {/* Node Position Info (Debug) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-white/50 mb-2">Node Position (Debug)</div>
              <div className="text-xs text-white/70 font-mono">
                X: {node?.x?.toFixed(2)} | Y: {node?.y?.toFixed(2)} | Z: {node?.z?.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fallback Display (when no card data) */}
      {!card && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm text-white/60 mb-2">
            No corresponding card found for this node
          </div>
          <div className="text-xs text-white/40">
            Node ID: {node?.id}
          </div>
        </div>
      )}
    </div>
  );
};

// Styled version with glassmorphic effects
export const NodeCardDisplayGlass: React.FC<NodeCardDisplayProps> = (props) => {
  return (
    <div className="node-card-display-glass">
      <NodeCardDisplay {...props} className="glass-panel backdrop-blur-md" />
    </div>
  );
}; 