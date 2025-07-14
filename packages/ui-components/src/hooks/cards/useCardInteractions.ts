/**
 * useCardInteractions - Hook for handling card interactions
 * V11.0 - User interactions with cards (like, bookmark, share, etc.)
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';

// Interaction types
export type CardInteractionType = 
  | 'click' 
  | 'hover' 
  | 'favorite' 
  | 'share' 
  | 'archive' 
  | 'change_background'
  | 'detail_view';

// Interaction event
export interface CardInteractionEvent {
  type: CardInteractionType;
  card: DisplayCard;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Hover state
interface HoverState {
  cardId: string | null;
  position: { x: number; y: number } | null;
  isHovering: boolean;
}

// Selection state
interface SelectionState {
  selectedCards: string[];
  lastSelectedCard: string | null;
  isMultiSelect: boolean;
}

// Background change state
interface BackgroundChangeState {
  cardId: string | null;
  isOpen: boolean;
  currentImageUrl: string | null;
}

// Hook configuration
interface UseCardInteractionsConfig {
  onCardClick?: (card: DisplayCard) => void;
  onCardHover?: (card: DisplayCard | null) => void;
  onCardFavorite?: (card: DisplayCard) => void;
  onCardShare?: (card: DisplayCard) => void;
  onCardArchive?: (card: DisplayCard) => void;
  onBackgroundChange?: (card: DisplayCard, imageUrl: string) => void;
  onDetailView?: (card: DisplayCard) => void;
  enableMultiSelect?: boolean;
  hoverDelay?: number;
  clickDelay?: number;
}

export function useCardInteractions(config: UseCardInteractionsConfig = {}) {
  const {
    onCardClick,
    onCardHover,
    onCardFavorite,
    onCardShare,
    onCardArchive,
    onBackgroundChange,
    onDetailView,
    enableMultiSelect = false,
    hoverDelay = 200,
    clickDelay = 200
  } = config;
  
  // State
  const [hoverState, setHoverState] = useState<HoverState>({
    cardId: null,
    position: null,
    isHovering: false
  });
  
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedCards: [],
    lastSelectedCard: null,
    isMultiSelect: false
  });
  
  const [backgroundChangeState, setBackgroundChangeState] = useState<BackgroundChangeState>({
    cardId: null,
    isOpen: false,
    currentImageUrl: null
  });
  
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Refs for timers
  const hoverTimeoutRef = useRef<number>();
  const clickTimeoutRef = useRef<number>();
  const lastInteractionRef = useRef<CardInteractionEvent | null>(null);
  
  // Helper to update loading state
  const setCardLoading = useCallback((cardId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [cardId]: loading
    }));
  }, []);
  
  // Helper to log interactions
  const logInteraction = useCallback((event: CardInteractionEvent) => {
    lastInteractionRef.current = event;
    console.log('Card interaction:', event);
  }, []);
  
  // Card click handler
  const handleCardClick = useCallback((card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Handle multi-select
    if (enableMultiSelect && (e.ctrlKey || e.metaKey)) {
      setSelectionState(prev => {
        const isSelected = prev.selectedCards.includes(card.card_id);
        const newSelection = isSelected 
          ? prev.selectedCards.filter(id => id !== card.card_id)
          : [...prev.selectedCards, card.card_id];
        
        return {
          selectedCards: newSelection,
          lastSelectedCard: card.card_id,
          isMultiSelect: true
        };
      });
      
      logInteraction({
        type: 'click',
        card,
        timestamp: new Date(),
        metadata: { multiSelect: true, selected: !selectionState.selectedCards.includes(card.card_id) }
      });
      
      return;
    }
    
    // Clear selection if not multi-selecting
    if (selectionState.selectedCards.length > 0) {
      setSelectionState({
        selectedCards: [],
        lastSelectedCard: null,
        isMultiSelect: false
      });
    }
    
    logInteraction({
      type: 'click',
      card,
      timestamp: new Date(),
      metadata: { position: { x: e.clientX, y: e.clientY } }
    });
    
    // Debounced click to prevent double-click issues
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = window.setTimeout(() => {
      onCardClick?.(card);
    }, clickDelay);
  }, [enableMultiSelect, selectionState, onCardClick, clickDelay, logInteraction]);
  
  // Card hover handlers
  const handleCardHover = useCallback((card: DisplayCard, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoverState({
        cardId: card.card_id,
        position: { x: e.clientX, y: e.clientY },
        isHovering: true
      });
      
      logInteraction({
        type: 'hover',
        card,
        timestamp: new Date(),
        metadata: { position: { x: e.clientX, y: e.clientY } }
      });
      
      onCardHover?.(card);
    }, hoverDelay);
  }, [hoverDelay, onCardHover, logInteraction]);
  
  const handleCardHoverEnd = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setHoverState(prev => ({
      ...prev,
      isHovering: false
    }));
    
    // Delay clearing hover state to prevent flicker
    setTimeout(() => {
      setHoverState(prev => ({
        cardId: null,
        position: null,
        isHovering: false
      }));
      
      onCardHover?.(null);
    }, 100);
  }, [onCardHover]);
  
  // Card favorite handler
  const handleCardFavorite = useCallback(async (card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setCardLoading(card.card_id, true);
    
    try {
      // This part of the logic would typically involve a cardService call
      // For now, we'll simulate an update. In a real app, this would be:
      // await cardService.updateCard(card.card_id, { is_favorited: !card.is_favorited });
      // For demonstration, we'll just toggle the local state
      const updatedCard = { ...card, is_favorited: !card.is_favorited };
      
      logInteraction({
        type: 'favorite',
        card: updatedCard,
        timestamp: new Date(),
        metadata: { favorited: !card.is_favorited }
      });
      
      onCardFavorite?.(updatedCard);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setCardLoading(card.card_id, false);
    }
  }, [onCardFavorite, setCardLoading, logInteraction]);
  
  // Card share handler
  const handleCardShare = useCallback(async (card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Native share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.title || 'Card',
          text: card.description || 'Check out this card',
          url: window.location.href
        });
        
        logInteraction({
          type: 'share',
          card,
          timestamp: new Date(),
          metadata: { method: 'native' }
        });
      } catch (error) {
        // User cancelled share
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      const shareText = `${card.title || 'Card'}\n${card.description || ''}\n${window.location.href}`;
      
      try {
        await navigator.clipboard.writeText(shareText);
        
        logInteraction({
          type: 'share',
          card,
          timestamp: new Date(),
          metadata: { method: 'clipboard' }
        });
        
        // You might want to show a toast notification here
        console.log('Card details copied to clipboard');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
    
    onCardShare?.(card);
  }, [onCardShare, logInteraction]);
  
  // Card archive handler
  const handleCardArchive = useCallback(async (card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setCardLoading(card.card_id, true);
    
    try {
      // This part of the logic would typically involve a cardService call
      // For now, we'll simulate an update. In a real app, this would be:
      // await cardService.updateCard(card.card_id, { status: 'active_archive' });
      // For demonstration, we'll just toggle the local state
      const updatedCard = { ...card, status: 'active_archive' };
      
      logInteraction({
        type: 'archive',
        card: updatedCard,
        timestamp: new Date(),
        metadata: { previousStatus: card.status }
      });
      
      onCardArchive?.(updatedCard);
    } catch (error) {
      console.error('Error archiving card:', error);
    } finally {
      setCardLoading(card.card_id, false);
    }
  }, [onCardArchive, setCardLoading, logInteraction]);
  
  // Background change handlers
  const handleBackgroundChangeStart = useCallback((card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setBackgroundChangeState({
      cardId: card.card_id,
      isOpen: true,
      currentImageUrl: card.background_image_url || null
    });
    
    logInteraction({
      type: 'change_background',
      card,
      timestamp: new Date(),
      metadata: { action: 'open_selector' }
    });
  }, [logInteraction]);
  
  const handleBackgroundChangeSelect = useCallback(async (card: DisplayCard, imageUrl: string) => {
    setCardLoading(card.card_id, true);
    
    try {
      // This part of the logic would typically involve a cardService call
      // For now, we'll simulate an update. In a real app, this would be:
      // await cardService.updateCard(card.card_id, { background_image_url: imageUrl });
      // For demonstration, we'll just update the local state
      const updatedCard = { ...card, background_image_url: imageUrl };
      
      setBackgroundChangeState({
        cardId: null,
        isOpen: false,
        currentImageUrl: null
      });
      
      logInteraction({
        type: 'change_background',
        card: updatedCard,
        timestamp: new Date(),
        metadata: { 
          action: 'select_image',
          imageUrl,
          previousImageUrl: card.background_image_url 
        }
      });
      
      onBackgroundChange?.(updatedCard, imageUrl);
    } catch (error) {
      console.error('Error updating card background:', error);
    } finally {
      setCardLoading(card.card_id, false);
    }
  }, [onBackgroundChange, setCardLoading, logInteraction]);
  
  const handleBackgroundChangeCancel = useCallback(() => {
    setBackgroundChangeState({
      cardId: null,
      isOpen: false,
      currentImageUrl: null
    });
  }, []);
  
  // Detail view handler
  const handleDetailView = useCallback((card: DisplayCard, e: React.MouseEvent) => {
    e.stopPropagation();
    
    logInteraction({
      type: 'detail_view',
      card,
      timestamp: new Date(),
      metadata: { trigger: 'button' }
    });
    
    onDetailView?.(card);
  }, [onDetailView, logInteraction]);
  
  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionState({
      selectedCards: [],
      lastSelectedCard: null,
      isMultiSelect: false
    });
  }, []);
  
  // Select all visible cards
  const selectAll = useCallback((cards: DisplayCard[]) => {
    if (!enableMultiSelect) return;
    
    setSelectionState({
      selectedCards: cards.map(card => card.card_id),
      lastSelectedCard: cards[cards.length - 1]?.card_id || null,
      isMultiSelect: true
    });
  }, [enableMultiSelect]);
  
  // Check if card is selected
  const isCardSelected = useCallback((cardId: string) => {
    return selectionState.selectedCards.includes(cardId);
  }, [selectionState.selectedCards]);
  
  // Check if card is hovered
  const isCardHovered = useCallback((cardId: string) => {
    return hoverState.cardId === cardId && hoverState.isHovering;
  }, [hoverState]);
  
  // Check if card is loading
  const isCardLoading = useCallback((cardId: string) => {
    return loadingStates[cardId] || false;
  }, [loadingStates]);
  
  // Cleanup timers
  const cleanup = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
  }, []);
  
  return {
    // State
    hoverState,
    selectionState,
    backgroundChangeState,
    lastInteraction: lastInteractionRef.current,
    
    // Event handlers
    handleCardClick,
    handleCardHover,
    handleCardHoverEnd,
    handleCardFavorite,
    handleCardShare,
    handleCardArchive,
    handleBackgroundChangeStart,
    handleBackgroundChangeSelect,
    handleBackgroundChangeCancel,
    handleDetailView,
    
    // Selection methods
    clearSelection,
    selectAll,
    isCardSelected,
    
    // State checkers
    isCardHovered,
    isCardLoading,
    
    // Utilities
    cleanup,
    selectedCardCount: selectionState.selectedCards.length,
    hasSelection: selectionState.selectedCards.length > 0,
    hoveredCard: hoverState.cardId,
    hoverPosition: hoverState.position
  };
} 