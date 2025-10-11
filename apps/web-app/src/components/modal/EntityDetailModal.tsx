/**
 * EntityDetailModal - Unified modal for displaying entity details
 * Consolidates EnhancedCardModal and CosmosNodeModal
 * Supports both card and node contexts (ice/water states)
 */

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { useEntityDetails } from '../../hooks/cosmos/useEntityDetails';
import { useRelatedEntities } from '../../hooks/useRelatedEntities';
import { cardService } from '../../services/cardService';
import { useCardStore } from '../../stores/CardStore';

interface EntityDetailModalProps {
  entity: any; // Can be card or node
  isOpen: boolean;
  onClose: () => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  entity: initialEntity,
  isOpen,
  onClose,
}) => {
  const [currentEntity, setCurrentEntity] = useState(initialEntity);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const { updateCardBackground } = useCardStore();

  // Update current entity when prop changes
  useEffect(() => {
    setCurrentEntity(initialEntity);
  }, [initialEntity]);

  const { entityDetails, isLoading, error, refetch } = useEntityDetails(currentEntity);
  const { relatedEntities, isLoadingRelated } = useRelatedEntities(
    entityDetails?.id,
    entityDetails?.type
  );

  // Detect entity type and extract IDs
  const isCard = currentEntity?.card_id !== undefined;
  const entityId = isCard ? currentEntity.source_entity_id : currentEntity?.id;
  const entityType = isCard ? currentEntity.source_entity_type : currentEntity?.entity_type || currentEntity?.type;

  // Get background image URL - prioritize entityDetails if available (for fresh data after generation)
  const backgroundImageUrl = entityDetails?.metadata?.background_image_url || currentEntity?.background_image_url || null;

  const handleRefresh = async () => {
    await refetch();
  };

  const handleGenerateCover = async () => {
    if (!entityId || isGeneratingCover) return;

    try {
      setIsGeneratingCover(true);
      
      // Get or create card for this entity
      let cardId = currentEntity?.card_id;
      
      if (!cardId) {
        // Entity is in node state - need to create card entry (freeze water to ice)
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/cards`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              source_entity_id: entityId,
              source_entity_type: entityType,
              status: 'active_canvas',
            }),
          }
        );
        
        const data = await response.json();
        if (data.success && data.data.card_id) {
          cardId = data.data.card_id;
        } else {
          throw new Error('Failed to create card entry');
        }
      }

      // Generate cover using card ID
      const motif = entityDetails?.title || entityId;
      const resp = await fetch(`/api/cards/${cardId}/generate-cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif }),
      });
      
      const data = await resp.json();
      if (!resp.ok || !data?.image_url) {
        console.error('Failed to generate cover:', data);
        return;
      }

      const imageUrl: string = data.image_url;

      // Persist to backend and update store
      await cardService.updateCardBackground({
        card_id: cardId,
        background_image_url: imageUrl,
      });
      
      if (isCard) {
        updateCardBackground(cardId, imageUrl);
      }

      // Update current entity state with new background image
      setCurrentEntity((prev: any) => ({
        ...prev,
        background_image_url: imageUrl,
        card_id: cardId, // Update card_id if it was created
      }));

      // Refresh entity details to show new cover and updated data
      await refetch();
    } catch (e) {
      console.error('Error generating/persisting cover:', e);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleRelatedEntityClick = (relatedEntity: any) => {
    // Switch modal to show the related entity
    setCurrentEntity({
      id: relatedEntity.entity_id,
      entity_type: relatedEntity.entity_type,
      type: relatedEntity.entity_type,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImportanceLabel = (score?: number) => {
    if (!score) return 'Low';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const getImportanceColor = (score?: number) => {
    if (!score) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (score >= 0.8) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (score >= 0.6) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'active_canvas':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'archived':
      case 'active_archive':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (!isOpen || !currentEntity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="none"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/20 pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-white/60">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={handleGenerateCover}
              disabled={isGeneratingCover}
              className="p-2 hover:bg-white/20 disabled:opacity-50"
              title="Generate AI cover"
            >
              {isGeneratingCover ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Wand2 size={18} />
              )}
            </GlassButton>
            <GlassButton
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </GlassButton>
            <GlassButton
              onClick={onClose}
              className="p-2 hover:bg-white/20"
              title="Close"
            >
              <X size={20} />
            </GlassButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-300 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium">Error Loading Entity Details</span>
              </div>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !entityDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw size={32} className="animate-spin text-white/60 mx-auto mb-4" />
                <p className="text-white/60">Loading entity details...</p>
              </div>
            </div>
          )}

          {/* Entity Details Display */}
          {entityDetails && (
            <div className="space-y-6">
              {/* Card Cover Tile */}
              <div className="flex justify-center">
                <div className="relative w-[200px] h-[200px] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 backdrop-blur-md">
                  {/* Background image or gradient */}
                  {backgroundImageUrl ? (
                    <img
                      src={backgroundImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
                  )}
                </div>
              </div>

              {/* Title with hover tooltip */}
              <div className="text-center">
                <h2 
                  className="text-2xl font-semibold text-white group cursor-help inline-block relative"
                  title={entityDetails.id}
                >
                  {entityDetails.title}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 backdrop-blur-sm rounded-lg text-xs text-white/90 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    ID: {entityDetails.id}
                  </span>
                </h2>
              </div>

              {/* Compact Metadata Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(entityDetails.metadata?.status)}`}>
                  {entityDetails.metadata?.status || 'active'}
                </span>
                <span className="px-3 py-1 rounded-full border text-xs font-medium bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {entityDetails.type.replace(/_/g, ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getImportanceColor(entityDetails.importance)}`}>
                  {getImportanceLabel(entityDetails.importance)} Priority
                </span>
                {entityDetails.metadata?.createdAt && (
                  <span className="px-3 py-1 rounded-full border text-xs font-medium bg-white/10 text-white/70 border-white/20">
                    Created {formatDate(entityDetails.metadata.createdAt)}
                  </span>
                )}
                {entityDetails.metadata?.lastUpdated && (
                  <span className="px-3 py-1 rounded-full border text-xs font-medium bg-white/10 text-white/70 border-white/20">
                    Updated {formatDate(entityDetails.metadata.lastUpdated)}
                  </span>
                )}
              </div>

              {/* Content Section */}
              {entityDetails.description && (
                <GlassmorphicPanel
                  variant="glass-panel"
                  rounded="lg"
                  padding="md"
                  className="border border-white/10"
                >
                  <p className="text-white/90 leading-relaxed text-sm">
                    {entityDetails.description}
                  </p>
                </GlassmorphicPanel>
              )}

              {/* Related Entities Section */}
              {relatedEntities && relatedEntities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white/80 text-center">
                    Related Entities
                  </h3>
                  <GlassmorphicPanel
                    variant="glass-panel"
                    rounded="lg"
                    padding="sm"
                    className="border border-white/10"
                  >
                    <div className="flex flex-wrap gap-2 justify-center">
                      {relatedEntities.map((relatedEntity: any) => (
                        <GlassButton
                          key={relatedEntity.entity_id}
                          onClick={() => handleRelatedEntityClick(relatedEntity)}
                          variant="default"
                          size="sm"
                          className="group relative"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="truncate max-w-32 text-xs">
                              {relatedEntity.title || relatedEntity.entity_type}
                            </span>
                          </div>
                          
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white/90 whitespace-nowrap">
                              {relatedEntity.relationship_type && (
                                <div className="text-white/60 text-xs">
                                  {relatedEntity.relationship_type}
                                </div>
                              )}
                              Type: {relatedEntity.entity_type}
                            </div>
                          </div>
                        </GlassButton>
                      ))}
                    </div>
                  </GlassmorphicPanel>
                </div>
              )}

              {isLoadingRelated && (
                <div className="text-center">
                  <span className="text-xs text-white/50">Loading related entities...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </GlassmorphicPanel>
    </div>
  );
};

