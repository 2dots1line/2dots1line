/**
 * CardDetailSidePanel - Side panel showing card details in cosmos view
 * V11.0 - Detailed card information with image browser and metadata
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, Share2, Archive, ExternalLink, Edit3, Tag, Clock, MapPin } from 'lucide-react';
import { DisplayCard, CosmosNode, NodeConnection } from '@2dots1line/shared-types';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import Image from 'next/image';

interface CardDetailSidePanelProps {
  isOpen: boolean;
  selectedNode: CosmosNode | null;
  cardData?: DisplayCard;
  connections?: NodeConnection[];
  onClose: () => void;
  onFlyToNode?: (node: CosmosNode) => void;
  onUpdateCard?: (cardId: string, updates: Partial<DisplayCard>) => void;
  onToggleFavorite?: (cardId: string) => void;
  onShareCard?: (cardId: string) => void;
  onArchiveCard?: (cardId: string) => void;
  className?: string;
  debug?: boolean;
}

export const CardDetailSidePanel: React.FC<CardDetailSidePanelProps> = ({
  isOpen,
  selectedNode,
  cardData,
  connections = [],
  onClose,
  onFlyToNode,
  onToggleFavorite,
  onShareCard,
  onArchiveCard,
  className = '',
  debug = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'connections' | 'history'>('details');
  
  // Get card image - simple implementation
  const cardImage = cardData?.background_image_url || '';
  
  // Animation handler
  useEffect(() => {
    if (isOpen || !isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle actions
  const handleFavoriteToggle = useCallback(() => {
    if (cardData && onToggleFavorite) {
      onToggleFavorite(cardData.card_id);
    }
  }, [cardData, onToggleFavorite]);

  const handleShare = useCallback(() => {
    if (cardData && onShareCard) {
      onShareCard(cardData.card_id);
    }
  }, [cardData, onShareCard]);

  const handleArchive = useCallback(() => {
    if (cardData && onArchiveCard) {
      onArchiveCard(cardData.card_id);
    }
  }, [cardData, onArchiveCard]);

  const handleFlyToConnection = useCallback((connection: NodeConnection) => {
    if (onFlyToNode) {
      // Create a temporary node for the connection target
              const targetNode: CosmosNode = {
          id: connection.target_node_id,
          title: connection.target_node_id,
          category: 'card',
          position: { x: 0, y: 0, z: 0 }, // Position will be determined by the cosmos system
          appearance: { size: 1, color: '#00ff66', opacity: 1, glow_intensity: 0, animation_speed: 1 },
          connections: [],
          is_selected: false,
          is_hovered: false,
          is_visible: true,
        };
      onFlyToNode(targetNode);
    }
  }, [onFlyToNode]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'related':
        return <Tag size={16} className="text-blue-400" />;
      case 'temporal':
        return <Clock size={16} className="text-green-400" />;
      case 'contextual':
        return <MapPin size={16} className="text-purple-400" />;
      case 'hierarchical':
        return <ExternalLink size={16} className="text-orange-400" />;
      case 'derived':
        return <ExternalLink size={16} className="text-cyan-400" />;
      default:
        return <ExternalLink size={16} className="text-gray-400" />;
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${className}`}
    >
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="none"
        padding="none"
        className="h-full overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {selectedNode?.title || 'Cosmos Node'}
            </h2>
            <GlassButton
              onClick={onClose}
              className="p-2 hover:bg-white/20"
            >
              <X size={18} className="stroke-current" />
            </GlassButton>
          </div>
          
          {/* Node type indicator */}
          <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedNode?.appearance?.color || '#00ff66' }}
            />
                          <span>{selectedNode?.category || 'Unknown'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {(['details', 'connections', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white bg-white/10 border-b-2 border-white/40'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Card Image */}
              {cardImage && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={cardImage}
                    alt={cardData?.title || 'Card'}
                    fill
                    sizes="384px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Card Info */}
              {cardData && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {cardData.title}
                    </h3>
                    {cardData.subtitle && (
                      <p className="text-sm text-white/70">{cardData.subtitle}</p>
                    )}
                  </div>

                  {cardData.content && (
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-2">Description</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {cardData.content}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Type:</span>
                      <span className="text-white ml-2">{cardData.entity_type}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Status:</span>
                      <span className="text-white ml-2">{cardData.status}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-white/60">Created:</span>
                      <span className="text-white ml-2">
                        {formatDate(cardData.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Updated:</span>
                      <span className="text-white ml-2">
                        {formatDate(cardData.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Node Position */}
              {selectedNode?.position && (
                <div className="space-y-2 text-sm">
                  <h4 className="text-sm font-medium text-white/80">Position</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white/5 rounded">
                      <div className="text-white/60 text-xs">X</div>
                      <div className="text-white">{selectedNode.position.x.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded">
                      <div className="text-white/60 text-xs">Y</div>
                      <div className="text-white">{selectedNode.position.y.toFixed(1)}</div>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded">
                      <div className="text-white/60 text-xs">Z</div>
                      <div className="text-white">{selectedNode.position.z.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/80">
                Connected Nodes ({connections.length})
              </h4>
              
              {connections.length === 0 ? (
                <p className="text-sm text-white/60 text-center py-8">
                  No connections found
                </p>
              ) : (
                <div className="space-y-2">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getConnectionTypeIcon(connection.connection_type)}
                        <div>
                          <div className="text-sm text-white">
                                                          {connection.target_node_id}
                          </div>
                          <div className="text-xs text-white/60">
                                                          {connection.connection_type} connection
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-white/60">
                          {connection.strength?.toFixed(2) || '1.00'}
                        </div>
                        <GlassButton
                          onClick={() => handleFlyToConnection(connection)}
                          className="p-1 hover:bg-white/20"
                        >
                          <ExternalLink size={12} className="stroke-current" />
                        </GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/80">Activity History</h4>
              
              <div className="space-y-2">
                {/* Placeholder for history items */}
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white">Node created</div>
                  <div className="text-xs text-white/60">
                    {cardData ? formatDate(cardData.created_at) : 'Unknown'}
                  </div>
                </div>
                
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white">Added to cosmos</div>
                  <div className="text-xs text-white/60">
                    {cardData ? formatDate(cardData.updated_at) : 'Unknown'}
                  </div>
                </div>
                
                {connections.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-sm text-white">
                      Connected to {connections.length} nodes
                    </div>
                    <div className="text-xs text-white/60">Various times</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {cardData && (
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handleFavoriteToggle}
                  className={`p-2 ${
                    cardData.is_favorited ? 'text-red-400' : 'text-white/70'
                  } hover:bg-white/20`}
                >
                  <Heart size={18} className="stroke-current" />
                </GlassButton>
                
                <GlassButton
                  onClick={handleShare}
                  className="p-2 text-white/70 hover:bg-white/20"
                >
                  <Share2 size={18} className="stroke-current" />
                </GlassButton>
                
                <GlassButton
                  onClick={handleArchive}
                  className="p-2 text-white/70 hover:bg-white/20"
                >
                  <Archive size={18} className="stroke-current" />
                </GlassButton>
              </div>
              
              <GlassButton
                onClick={() => {
                  // Handle edit action
                  if (debug) console.log('Edit card:', cardData.card_id);
                }}
                className="p-2 text-white/70 hover:bg-white/20"
              >
                <Edit3 size={18} className="stroke-current" />
              </GlassButton>
            </div>
          </div>
        )}
      </GlassmorphicPanel>
    </div>
  );
};