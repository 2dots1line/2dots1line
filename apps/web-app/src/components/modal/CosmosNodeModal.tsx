/**
 * Enhanced CosmosNodeModal
 * Displays rich card data instead of raw JSON for graph nodes
 */

import React from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { NodeCardDisplay } from '../cosmos/NodeCardDisplay';
import { useNodeCardData } from '../../hooks/cosmos/useNodeCardData';
import { cardService } from '../../services/cardService';

interface CosmosNodeModalProps {
  node: any;
  onClose: () => void;
  onCardAction?: (action: string, cardId: string) => void;
}

const CosmosNodeModal: React.FC<CosmosNodeModalProps> = ({ 
  node, 
  onClose, 
  onCardAction 
}) => {
  const { cardData, isLoading, error, refetch } = useNodeCardData(node);

  const handleCardAction = async (action: string, cardId: string) => {
    try {
      switch (action) {
        case 'favorite':
          await cardService.toggleFavorite(cardId);
          break;
        case 'share':
          // Implement sharing functionality
          console.log('Sharing card:', cardId);
          break;
        case 'archive':
          // Implement archiving functionality
          console.log('Archiving card:', cardId);
          break;
        case 'view':
          // Navigate to full card view
          console.log('Viewing full card:', cardId);
          break;
        default:
          console.log('Unknown action:', action);
      }

      // Refetch card data to get updated state
      await refetch();

      // Call parent handler if provided
      if (onCardAction) {
        onCardAction(action, cardId);
      }
    } catch (error) {
      console.error('Error performing card action:', error);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (!node) {
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
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              Node Details
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
                <span className="font-medium">Error Loading Card Data</span>
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
          {isLoading && !cardData && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw size={32} className="animate-spin text-white/60 mx-auto mb-4" />
                <p className="text-white/60">Loading card data...</p>
              </div>
            </div>
          )}

          {/* Card Display */}
          {cardData && (
            <div className="space-y-6">
              {/* Main Card */}
              <NodeCardDisplay
                card={cardData.card}
                node={node}
                onCardAction={handleCardAction}
              />

              {/* Related Cards */}
              {cardData.relatedCards.length > 0 && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Related Cards ({cardData.relatedCards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cardData.relatedCards.slice(0, 4).map((relatedCard) => (
                      <div
                        key={relatedCard.card_id}
                        className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleCardAction('view', relatedCard.card_id)}
                      >
                        <h4 className="font-medium text-white mb-2">
                          {relatedCard.title || 'Untitled'}
                        </h4>
                        <p className="text-sm text-white/70 line-clamp-2">
                          {relatedCard.description || 'No description'}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
                            {relatedCard.card_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connections */}
              {cardData.connections.length > 0 && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Connections ({cardData.connections.length})
                  </h3>
                  <div className="space-y-2">
                    {cardData.connections.map((connection, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="text-sm text-white/70">
                          {JSON.stringify(connection, null, 2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Node Data (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="border-t border-white/20 pt-6">
                  <details className="text-white/60">
                    <summary className="cursor-pointer hover:text-white/80">
                      Raw Node Data (Debug)
                    </summary>
                    <pre className="mt-2 p-4 bg-white/5 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(node, null, 2)}
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

export default CosmosNodeModal;