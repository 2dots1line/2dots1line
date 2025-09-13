/**
 * EnhancedCardModal - Card detail modal using entity system for consistency
 * V11.0 - Unified data source for both cards and nodes
 */

// EnhancedCardModal component - consolidated imports (keep only this block at the top)
import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';
import { NodeDetailsDisplay } from '../cosmos/NodeDetailsDisplay';
import { useEntityDetails } from '../../hooks/cosmos/useEntityDetails';
import type { DisplayCard } from '@2dots1line/shared-types';
import { useCardStore } from '../../stores/CardStore';
import { cardService } from '../../services/cardService';

interface EnhancedCardModalProps {
  card: DisplayCard;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedCardModal: React.FC<EnhancedCardModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const { entityDetails, isLoading, error, refetch } = useEntityDetails(card);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const { updateCardBackground } = useCardStore();

  const handleRefresh = async () => {
    await refetch();
  };

  const handleGenerateCover = async () => {
    if (!card?.card_id || isGeneratingCover) return;
    try {
      setIsGeneratingCover(true);
      const motif =
        (entityDetails?.title && String(entityDetails.title)) ||
        (card.title && String(card.title)) ||
        'cover';

      const resp = await fetch(`/api/cards/${card.card_id}/generate-cover`, {
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

      // Persist to backend (Postgres) and update local store immediately
      await cardService.updateCardBackground({
        card_id: card.card_id,
        background_image_url: imageUrl,
      });
      updateCardBackground(card.card_id, imageUrl);
    } catch (e) {
      console.error('Error generating/persisting cover:', e);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  if (!isOpen || !card) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fullscreen background image from card cover */}
      {card.background_image_url && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${card.background_image_url})` }}
        />
      )}

      {/* Backdrop overlay above the image */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-20 w-full max-w-4xl max-h-[90vh] bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {entityDetails?.title || card.title || 'Card Details'}
            </h2>
            {isLoading && (
              <div className="flex items-center gap-2 text-white/60">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateCover}
              disabled={isGeneratingCover}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Generate cover"
            >
              {isGeneratingCover ? (
                <RefreshCw size={16} className="animate-spin text-white/70" />
              ) : (
                <Wand2 size={18} className="text-white/70" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={16} className="text-white/70" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close modal"
            >
              <X size={20} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-300 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium">Error Loading Entity Details</span>
              </div>
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
              >
                Try Again
              </button>
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
              <NodeDetailsDisplay nodeDetails={entityDetails} />

              {/* Card-Specific Information */}
              <div className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Card Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-white/60">Card ID: </span>
                      <span className="text-white/90 font-mono">{card.card_id}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/60">Card Type: </span>
                      <span className="text-white/90">{card.card_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/60">Status: </span>
                      <span className="text-white/90">{card.status || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-white/60">Source Entity: </span>
                      <span className="text-white/90">{card.source_entity_id}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/60">Entity Type: </span>
                      <span className="text-white/90">{card.source_entity_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-white/60">Created: </span>
                      <span className="text-white/90">
                        {card.created_at ? new Date(card.created_at).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Card Data (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="border-t border-white/20 pt-6">
                  <details className="text-white/60">
                    <summary className="cursor-pointer hover:text-white/80">
                      Raw Card Data (Debug)
                    </summary>
                    <pre className="mt-2 p-4 bg-white/5 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(card, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};