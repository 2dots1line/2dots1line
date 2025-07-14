/**
 * InfiniteCardGallery - Main 2D infinite gallery component
 * V11.0 - Adapted from prototype InfiniteCanvas.tsx with efficient viewport rendering
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Palette, RotateCcw, Search, Filter } from 'lucide-react';
import { TCard } from '@2dots1line/shared-types';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { CardTile, CardSize } from '@2dots1line/ui-components/src/components/cards/CardTile';
import { useInfiniteCardGrid } from '@2dots1line/ui-components/src/hooks/cards/useInfiniteCardGrid';
import { useCardSearch } from '@2dots1line/ui-components/src/hooks/cards/useCardSearch';
import { cn } from '@2dots1line/ui-components/src/utils/cn';

// Local types to avoid circular dependencies
interface DisplayCard extends TCard {
  image?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  background_image_url?: string;
}

interface CardFilter {
  category?: string;
  status?: string;
  tags?: string[];
  search?: string;
}

// Local imageCollections to avoid circular dependency
const imageCollections = [
  { name: 'Nature', category: 'nature' },
  { name: 'Abstract', category: 'abstract' },
  { name: 'Technology', category: 'technology' },
  { name: 'Art', category: 'art' }
];

interface InfiniteCardGalleryProps {
  cards: DisplayCard[];
  onCardSelect?: (card: DisplayCard) => void;
  cardSize?: CardSize;
  showSearch?: boolean;
  showFilters?: boolean;
  showCollectionSelector?: boolean;
  className?: string;
}

export const InfiniteCardGallery: React.FC<InfiniteCardGalleryProps> = ({
  cards,
  onCardSelect,
  cardSize = 'md',
  showSearch = true,
  showFilters = true,
  showCollectionSelector = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Card dimensions based on size
  const cardDimensions: { [key in CardSize]: { width: number; height: number } } = {
    sm: { width: 192, height: 128 },
    md: { width: 288, height: 192 },
    lg: { width: 384, height: 256 }
  };
  
  const { width: cardWidth, height: cardHeight } = cardDimensions[cardSize as keyof typeof cardDimensions];
  
  // Use search hook
  const {
    query,
    setQuery,
    filteredCards,
    isLoading: isSearchLoading,
    hasQuery,
    clearSearch
  } = useCardSearch({
    cards,
    mode: 'local' // Use local search for infinite gallery
  });
  
  // Use infinite grid hook
  const {
    visibleCards,
    handleMouseDown,
    handleTouchStart,
    handleCardClick,
    resetPosition,
    offset,
    containerStyle,
    gridStyle,
    totalCards,
    visibleCardCount
  } = useInfiniteCardGrid({
    cards: filteredCards,
    containerRef,
    cardWidth,
    cardHeight,
    gap: 16,
    padding: 20,
    enableDrag: true,
    onCardSelect,
    onViewportChange: (newOffset: { x: number; y: number }) => {
      // Optional: save viewport position
      console.log('Viewport changed:', newOffset);
    }
  });
  
  // Handle card selection wrapper for CardTile
  const handleCardTileClick = useCallback((card: DisplayCard) => {
    // Create a synthetic mouse event for the hook
    const syntheticEvent = {
      clientX: 0,
      clientY: 0,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as React.MouseEvent;
    
    handleCardClick(card, syntheticEvent);
  }, [handleCardClick]);

  // Handle collection change (theme switching)
  const handleCollectionChange = useCallback(() => {
    const nextIndex = (currentCollectionIndex + 1) % imageCollections.length;
    setCurrentCollectionIndex(nextIndex);
    
    // This would trigger a re-render with new images
    // The actual implementation would need to update the card store
    console.log('Collection changed to:', imageCollections[nextIndex].name);
  }, [currentCollectionIndex]);
  
  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, [setQuery]);
  
  // Handle card selection
  const handleCardSelect = useCallback((card: DisplayCard) => {
    onCardSelect?.(card);
  }, [onCardSelect]);
  
  // Prevent context menu on right click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);
  
  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseDown(e);
  }, [handleMouseDown]);
  
  // Handle drag end
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);
  
  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              <GlassmorphicPanel
                variant="glass-panel"
                rounded="md"
                padding="sm"
                className="flex items-center gap-2 min-w-64"
              >
                <Search size={16} className="text-onSurface/70" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={query}
                  onChange={handleSearchChange}
                  className="flex-1 bg-transparent border-none outline-none text-onSurface placeholder-onSurface/50 text-sm"
                />
                {hasQuery && (
                  <GlassButton
                    size="sm"
                    onClick={clearSearch}
                    className="p-1 hover:bg-white/20"
                  >
                    ×
                  </GlassButton>
                )}
              </GlassmorphicPanel>
            </div>
          )}
          
          {showFilters && (
            <GlassButton
              onClick={() => {
                // Handle filter panel toggle
                console.log('Toggle filters');
              }}
              className="p-2 hover:bg-white/20"
            >
              <Filter size={16} />
            </GlassButton>
          )}
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Collection Selector */}
          {showCollectionSelector && (
            <GlassButton
              onClick={handleCollectionChange}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/20"
            >
              <Palette size={16} />
              <span className="text-sm">
                {imageCollections[currentCollectionIndex]?.name || 'Default'}
              </span>
            </GlassButton>
          )}
          
          {/* Reset Position */}
          <GlassButton
            onClick={resetPosition}
            className="p-2 hover:bg-white/20"
            title="Reset to center"
          >
            <RotateCcw size={16} />
          </GlassButton>
        </div>
      </div>
      
      {/* Infinite Grid */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
        onTouchStart={handleTouchStart}
        onContextMenu={handleContextMenu}
        style={containerStyle}
      >
        <div className="absolute inset-0" style={gridStyle}>
          {visibleCards.map((visibleCard, index: number) => (
            <div 
              key={`${visibleCard.card.card_id}-${visibleCard.position.col}-${visibleCard.position.row}`}
              className="absolute transition-opacity duration-200"
              style={{
                left: visibleCard.x,
                top: visibleCard.y,
                width: cardWidth,
                height: cardHeight
              }}
            >
              <CardTile
                card={visibleCard.card}
                onClick={() => handleCardTileClick(visibleCard.card)}
                size={cardSize}
                className="transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 z-50">
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="md"
          padding="sm"
          className="flex items-center gap-4 text-xs text-onSurface/70"
        >
          <span>
            Showing {visibleCardCount} of {totalCards} cards
          </span>
          {hasQuery && (
            <span>
              Search: "{query}"
            </span>
          )}
          {isSearchLoading && (
            <span className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              Searching...
            </span>
          )}
        </GlassmorphicPanel>
      </div>
    </div>
  );
}; 