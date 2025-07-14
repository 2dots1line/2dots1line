/**
 * CardModal - Main card system modal with gallery and detail views
 * V11.0 - Comprehensive card system implementation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, Grid, Eye } from 'lucide-react';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { InfiniteCardGallery } from '../cards/InfiniteCardGallery';
import { useCardStore, DisplayCard, CardView } from '../../stores/CardStore';
import { cardService } from '../../services/cardService';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Card store state
  const {
    cards,
    filteredCards,
    currentView,
    selectedCard,
    setCards,
    setCurrentView,
    setSelectedCard,
    updateCard
  } = useCardStore();
  
  // Load cards on mount
  useEffect(() => {
    if (isOpen && cards.length === 0) {
      loadCards();
    }
  }, [isOpen, cards.length]);
  
  // Load cards from API
  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await cardService.getCards({
        limit: 1000 // Load a large batch for infinite scrolling
      });
      
      if (response.success && response.cards) {
        setCards(response.cards);
      } else {
        setError(response.error || 'Failed to load cards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, [setCards]);
  
  // Handle card selection
  const handleCardSelect = useCallback((card: DisplayCard) => {
    setSelectedCard(card);
    setCurrentView('detail');
  }, [setSelectedCard, setCurrentView]);
  
  // Handle back to gallery
  const handleBackToGallery = useCallback(() => {
    setSelectedCard(null);
    setCurrentView('gallery');
  }, [setSelectedCard, setCurrentView]);
  
  // Handle card updates
  const handleCardUpdate = useCallback(async (cardId: string, updates: Partial<DisplayCard>) => {
    try {
      const response = await cardService.updateCard({ card_id: cardId, updates });
      if (response.success && response.card) {
        updateCard(cardId, updates);
      }
    } catch (err) {
      console.error('Error updating card:', err);
    }
  }, [updateCard]);
  
  // Handle card favorite toggle
  const handleCardFavorite = useCallback(async (card: DisplayCard) => {
    try {
      const response = await cardService.toggleFavorite(card.card_id);
      if (response.success && response.card) {
        updateCard(card.card_id, { is_favorited: response.card.is_favorited });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [updateCard]);
  
  // Handle card background change
  const handleCardBackgroundChange = useCallback(async (card: DisplayCard, imageUrl: string) => {
    try {
      const response = await cardService.updateCardBackground({
        card_id: card.card_id,
        background_image_url: imageUrl
      });
      if (response.success && response.card) {
        updateCard(card.card_id, { background_image_url: imageUrl });
      }
    } catch (err) {
      console.error('Error updating card background:', err);
    }
  }, [updateCard]);
  
  // Handle modal close
  const handleClose = useCallback(() => {
    setSelectedCard(null);
    setCurrentView('gallery');
    onClose();
  }, [setSelectedCard, setCurrentView, onClose]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-4 z-modal flex items-center justify-center pointer-events-none">
      <GlassmorphicPanel
        variant="glass-panel"
        rounded="xl"
        padding="none"
        className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Back button (only show in detail view) */}
            {currentView === 'detail' && (
              <GlassButton
                onClick={handleBackToGallery}
                className="p-2 hover:bg-white/20"
              >
                <ArrowLeft size={20} />
              </GlassButton>
            )}
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-white font-brand">
              {currentView === 'gallery' ? 'Card Collection' : selectedCard?.title || 'Card Detail'}
            </h1>
            
            {/* View indicator */}
            <div className="flex items-center gap-1 text-sm text-white/60">
              {currentView === 'gallery' ? <Grid size={16} /> : <Eye size={16} />}
              <span className="capitalize">{currentView}</span>
            </div>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Card count */}
            <div className="text-sm text-white/60">
              {filteredCards.length} cards
            </div>
            
            {/* Close button */}
            <GlassButton
              onClick={handleClose}
              className="p-2 hover:bg-white/20"
            >
              <X size={20} />
            </GlassButton>
          </div>
        </div>
        
        {/* Content */}
        <div className="h-[calc(90vh-80px)] overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Loading cards...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Error Loading Cards
                </h3>
                <p className="text-white/70 mb-4">
                  {error}
                </p>
                <GlassButton
                  onClick={loadCards}
                  className="px-6 py-2"
                >
                  Try Again
                </GlassButton>
              </div>
            </div>
          )}
          
          {/* Gallery View */}
          {!isLoading && !error && currentView === 'gallery' && (
            <InfiniteCardGallery
              cards={filteredCards}
              onCardSelect={handleCardSelect}
              cardSize="md"
              showSearch={true}
              showFilters={true}
              showCollectionSelector={true}
              className="h-full"
            />
          )}
          
          {/* Detail View */}
          {!isLoading && !error && currentView === 'detail' && selectedCard && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Card Detail Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card Preview */}
                  <div className="space-y-4">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
                      {selectedCard.background_image_url && (
                        <img
                          src={selectedCard.background_image_url}
                          alt={selectedCard.title || 'Card'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Card Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <GlassButton
                        onClick={() => handleCardFavorite(selectedCard)}
                        className="flex items-center justify-center gap-2 py-3"
                      >
                        <span className={selectedCard.is_favorited ? '❤️' : '🤍'}>
                          {selectedCard.is_favorited ? '❤️' : '🤍'}
                        </span>
                        {selectedCard.is_favorited ? 'Favorited' : 'Add to Favorites'}
                      </GlassButton>
                      
                      <GlassButton
                        onClick={() => {
                          // Handle share
                          navigator.share?.({
                            title: selectedCard.title || 'Card',
                            text: selectedCard.description || 'Check out this card'
                          });
                        }}
                        className="flex items-center justify-center gap-2 py-3"
                      >
                        📤 Share
                      </GlassButton>
                    </div>
                  </div>
                  
                  {/* Card Information */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {selectedCard.title || selectedCard.card_type.replace(/_/g, ' ')}
                      </h2>
                      <p className="text-white/70 text-sm mb-4">
                        {selectedCard.subtitle || selectedCard.source_entity_type.replace(/_/g, ' ')}
                      </p>
                      {selectedCard.description && (
                        <p className="text-white/80">
                          {selectedCard.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Type:</span>
                        <p className="text-white font-medium capitalize">
                          {selectedCard.card_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/60">Status:</span>
                        <p className="text-white font-medium capitalize">
                          {selectedCard.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/60">Created:</span>
                        <p className="text-white font-medium">
                          {new Date(selectedCard.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/60">Updated:</span>
                        <p className="text-white font-medium">
                          {new Date(selectedCard.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Display Data */}
                    {selectedCard.display_data && Object.keys(selectedCard.display_data).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Additional Information
                        </h3>
                        <div className="bg-white/5 rounded-lg p-4 text-sm">
                          <pre className="text-white/70 whitespace-pre-wrap">
                            {JSON.stringify(selectedCard.display_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassmorphicPanel>
    </div>
  );
}; 