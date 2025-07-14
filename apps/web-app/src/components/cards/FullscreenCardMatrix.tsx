/**
 * FullscreenCardMatrix - Fullscreen card matrix overlay with infinite scrolling
 * V11.0 - Direct overlay on video background with Apple-like card grid
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Search, Filter, RotateCcw, Grid, Maximize2, Minimize2 } from 'lucide-react';
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

interface FullscreenCardMatrixProps {
  cards: DisplayCard[];
  onCardSelect?: (card: DisplayCard) => void;
  onClose?: () => void;
  cardSize?: CardSize;
  showSearch?: boolean;
  showFilters?: boolean;
  className?: string;
  isVisible?: boolean;
}

export const FullscreenCardMatrix: React.FC<FullscreenCardMatrixProps> = ({
  cards = [],
  onCardSelect,
  onClose,
  cardSize = 'md',
  showSearch = true,
  showFilters = true,
  className = '',
  isVisible = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHUD, setShowHUD] = useState(true);

  // Card dimensions - optimized for Apple-like proportions
  const cardDimensions: { [key in CardSize]: { width: number; height: number } } = {
    sm: { width: 160, height: 160 },  // Square like iOS icons
    md: { width: 200, height: 200 },  // Medium square
    lg: { width: 240, height: 240 }   // Large square
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
    cards: cards,
    mode: 'local'
  });
  
  // Use infinite grid hook with smaller gaps for tighter Apple-like layout
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
    gap: 24, // Increased gap for Apple-like spacing proportions
    padding: 32, // Increased padding for better frame
    enableDrag: true,
    onCardSelect,
    onViewportChange: (newOffset: { x: number; y: number }) => {
      // Optional: save viewport position for persistence
      console.log('Matrix viewport changed:', newOffset);
    }
  });

  // Auto-hide HUD during drag
  useEffect(() => {
    setShowHUD(!isDragging);
  }, [isDragging]);

  // Handle container drag start
  const handleMouseDownContainer = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseDown(e);
  };

  // Handle container touch start  
  const handleTouchStartContainer = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchStart(e);
  };

  // Handle mouse up globally
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch(e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetPosition();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Focus search
            const searchInput = document.querySelector('#card-search-input') as HTMLInputElement;
            searchInput?.focus();
          }
          break;
      }
    };
    
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose, resetPosition]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md",
      "flex flex-col overflow-hidden",
      className
    )}>
      {/* Top HUD - Auto-hide during drag */}
      <div className={cn(
        "transition-all duration-300 z-[10000]",
        showHUD && !isMinimized 
          ? "translate-y-0 opacity-100" 
          : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            {/* Left: Search and filters */}
            <div className="flex items-center gap-3">
              {showSearch && (
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                  <input
                    id="card-search-input"
                    type="text"
                    placeholder="Search cards..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-white/10 border border-white/20 rounded-lg 
                             text-white placeholder-white/60 focus:border-white/40 focus:outline-none
                             backdrop-blur-sm"
                  />
                </div>
              )}
              
              {showFilters && (
                <GlassButton
                  className="p-2 hover:bg-white/20"
                >
                  <Filter size={16} className="stroke-current" />
                </GlassButton>
              )}
              
              {hasQuery && (
                <GlassButton
                  onClick={clearSearch}
                  className="px-3 py-2 text-sm hover:bg-white/20"
                >
                  Clear
                </GlassButton>
              )}
            </div>

            {/* Center: Stats */}
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>{totalCards} cards</span>
              <span>{visibleCardCount} visible</span>
              {hasQuery && (
                <span className="text-blue-300">
                  {filteredCards.length} filtered
                </span>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={resetPosition}
                className="p-2 hover:bg-white/20"
                title="Reset Position (Ctrl+R)"
              >
                <RotateCcw size={16} className="stroke-current" />
              </GlassButton>
              
              <GlassButton
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 size={16} className="stroke-current" />
                ) : (
                  <Minimize2 size={16} className="stroke-current" />
                )}
              </GlassButton>
              
              <GlassButton
                onClick={onClose}
                className="p-2 hover:bg-white/20"
                title="Close (Escape)"
              >
                <X size={16} className="stroke-current" />
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {cards.length === 0 ? (
          /* Empty State */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Grid size={64} className="mx-auto mb-4 text-white/30" />
              <h3 className="text-xl font-semibold text-white mb-2">No Cards Available</h3>
              <p className="text-white/60">
                Cards will appear here when they're loaded from your collection.
              </p>
            </div>
          </div>
        ) : (
          /* Card Grid */
          <div
            ref={containerRef}
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
            style={containerStyle}
            onMouseDown={handleMouseDownContainer}
            onTouchStart={handleTouchStartContainer}
          >
            <div style={gridStyle} className="relative">
              {visibleCards.map((visibleCard, index) => (
                <div
                  key={`${visibleCard.card.card_id}-${index}`}
                  style={{
                    position: 'absolute',
                    left: visibleCard.x,
                    top: visibleCard.y,
                    width: cardWidth,
                    height: cardHeight,
                  }}
                  className="transition-transform duration-200 hover:scale-105 hover:z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDragging) {
                      handleCardClick(visibleCard.card, e);
                    }
                  }}
                >
                  <CardTile
                    card={visibleCard.card}
                    size={cardSize}
                    onClick={() => !isDragging && onCardSelect?.(visibleCard.card)}
                    className="shadow-lg hover:shadow-xl border border-white/10"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      {showHUD && !isMinimized && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-[10000]">
          <div className="flex items-center justify-center">
            <GlassmorphicPanel
              variant="glass-panel"
              rounded="full" 
              padding="sm"
              className="text-sm text-white/70"
            >
              <div className="flex items-center gap-6">
                <span>Matrix View</span>
                <span>Drag to navigate • Ctrl+R to reset • Escape to close</span>
                <span>Offset: ({Math.round(offset.x)}, {Math.round(offset.y)})</span>
              </div>
            </GlassmorphicPanel>
          </div>
        </div>
      )}
    </div>
  );
}; 