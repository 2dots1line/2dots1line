import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
import { CardTile } from './CardTile';
import './InfiniteCardCanvas.css';

/**
 * InfiniteCardCanvas
 * Renders an infinite, responsive grid of real user cards with modern styling and infinite swiping.
 * Cards are placed in a grid, with each cell using a seeded random function to select a card (allowing repetition).
 * Card backgrounds use the card.background_image_url field (Unsplash/Pexels/etc.).
 *
 * Props:
 *   - cards: DisplayCard[] (real user cards, each with background_image_url)
 *   - onCardSelect?: (card: DisplayCard) => void
 *   - onLoadMore?: () => void (callback to load more cards)
 *   - hasMore?: boolean (whether more cards are available)
 *   - className?: string
 */
interface InfiniteCardCanvasProps {
  cards: DisplayCard[];
  onCardSelect?: (card: DisplayCard) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

// Constants for grid layout (match prototype, responsive via CSS)
const CARD_SIZE = 200; // Container size (px)
const ICON_SIZE = 180; // Icon size (px)
const CARD_GAP = 48;   // Gap between cards (px)
const GRID_PADDING = 64; // Padding (px)
const CELL_WIDTH = CARD_SIZE + CARD_GAP;
const CELL_HEIGHT = CARD_SIZE + CARD_GAP;

// Seeded random number generator for consistent card selection
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Simplified: map a grid cell to a card using seeded random only (no ordering/anchoring)
function selectCardForCell(
  cards: DisplayCard[],
  col: number,
  row: number
): DisplayCard {
  if (cards.length === 0) {
    return {} as DisplayCard;
  }
  const seed = row * 1000 + col;
  const cardIndex = Math.floor(Math.abs(seededRandom(seed)) * cards.length) % cards.length;
  return cards[cardIndex];
}

// Get or create a stable card for a grid position
function getStableCardForCell(
  cards: DisplayCard[],
  col: number,
  row: number,
  positionMap: Map<string, { row: number; col: number; card: DisplayCard }>
): DisplayCard {
  const positionKey = `${row}-${col}`;
  
  // If we already have a card for this position, use it if it's still in the current card pool
  // This provides stability while allowing for view switches
  if (positionMap.has(positionKey)) {
    const existing = positionMap.get(positionKey)!;
    const cardStillExists = cards.some(card => card.card_id === existing.card.card_id);
    if (cardStillExists) {
      return existing.card;
    }
  }
  
  // Assign new cards to positions that haven't been visited or where the card no longer exists
  const newCard = selectCardForCell(cards, col, row);
  if (newCard.card_id) {
    positionMap.set(positionKey, { row, col, card: newCard });
  }
  
  return newCard;
}

export const InfiniteCardCanvas: React.FC<InfiniteCardCanvasProps> = ({
  cards,
  onCardSelect,
  onLoadMore,
  hasMore = false,
  className = '',
}) => {
  // Early return if no cards to prevent unnecessary processing
  if (!cards || cards.length === 0) {
    return (
      <div className={`infinite-card-canvas ${className}`}>
        <div className="infinite-card-container">
          <div className="flex items-center justify-center h-full">
            <div className="text-white/70 text-center">
              <div className="text-6xl mb-4">🎴</div>
              <p>No cards available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stable card-to-position mapping that persists across card pool changes
  const cardPositionMapRef = useRef<Map<string, { row: number; col: number; card: DisplayCard }>>(new Map());
  
  // Cache the visible cards to prevent recalculation during drag
  const visibleCardsCacheRef = useRef<any[]>([]);
  const lastOffsetRef = useRef({ x: 0, y: 0 });
  const lastCardsLengthRef = useRef(0);


  // Clear cache when cards array changes significantly (e.g., view switching)
  useEffect(() => {
    const currentCardsLength = cards.length;
    const previousCardsLength = lastCardsLengthRef.current;
    
    // If cards array changed significantly (likely a view switch or reinitialization)
    if (previousCardsLength > 0 && Math.abs(currentCardsLength - previousCardsLength) > 10) {
      console.log('[InfiniteCardCanvas] Clearing cache due to significant cards change');
      visibleCardsCacheRef.current = [];
      cardPositionMapRef.current.clear();
    }
    
    // Also clear cache if cards array was reset (length went to 0 and back up)
    if (previousCardsLength > 0 && currentCardsLength === 0) {
      console.log('[InfiniteCardCanvas] Clearing cache due to cards reset');
      visibleCardsCacheRef.current = [];
      cardPositionMapRef.current.clear();
    }
    
    lastCardsLengthRef.current = currentCardsLength;
  }, [cards.length]);

  // Calculate visible cards with maximum stability - only recalculate when absolutely necessary
  const visibleCards = useMemo(() => {
    if (typeof window === 'undefined' || cards.length === 0) return [];
    
    // Use cached cards if available - be very conservative about recalculating
    const offsetChanged = Math.abs(offset.x - lastOffsetRef.current.x) > 10 || Math.abs(offset.y - lastOffsetRef.current.y) > 10;
    
    if (!offsetChanged && visibleCardsCacheRef.current.length > 0) {
      return visibleCardsCacheRef.current;
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Calculate bounds with smaller buffer to reduce computation
    const leftBound = -offset.x - CARD_SIZE;
    const rightBound = -offset.x + viewportWidth + CARD_SIZE;
    const topBound = -offset.y - CARD_SIZE;
    const bottomBound = -offset.y + viewportHeight + CARD_SIZE;
    // Grid positions
    const startCol = Math.floor(leftBound / CELL_WIDTH);
    const endCol = Math.ceil(rightBound / CELL_WIDTH);
    const startRow = Math.floor(topBound / CELL_HEIGHT);
    const endRow = Math.ceil(bottomBound / CELL_HEIGHT);

    const result = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        // Use stable card mapping to maintain consistency
        const card = getStableCardForCell(cards, col, row, cardPositionMapRef.current);
        if (card.card_id) { // Only add cards with valid IDs
          result.push({
            ...card,
            x: col * CELL_WIDTH + GRID_PADDING,
            y: row * CELL_HEIGHT + GRID_PADDING,
            gridRow: row,
            gridCol: col,
          });
        }
      }
    }
    
    // Cache the result
    visibleCardsCacheRef.current = result;
    lastOffsetRef.current = { x: offset.x, y: offset.y };
    
    return result;
  }, [offset, cards]); // Include cards dependency but with caching

  // Check if we need to load more cards (but don't load during drag)
  useEffect(() => {
    if (!onLoadMore || !hasMore || cards.length === 0) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gridWidth = Math.ceil(viewportWidth / CELL_WIDTH) + 4;
    const gridHeight = Math.ceil(viewportHeight / CELL_HEIGHT) + 4;
    const estimatedLoadedCards = gridWidth * gridHeight;
    
    // Check if we need more cards
    const needsMoreCards = visibleCards.length > estimatedLoadedCards * 0.8;
    
    if (needsMoreCards && !dragging) {
      // Load immediately if not dragging
      onLoadMore();
    } else if (needsMoreCards && dragging) {
      // Mark that we should load more after drag ends
      setShouldLoadMore(true);
    }
  }, [visibleCards.length, cards.length, hasMore, onLoadMore, dragging]);

  // Load more cards after drag ends (debounced)
  useEffect(() => {
    if (!dragging && shouldLoadMore && onLoadMore && hasMore) {
      // Clear any existing timeout
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      
      // Debounce the loading to avoid rapid successive calls
      loadMoreTimeoutRef.current = setTimeout(() => {
        onLoadMore();
        setShouldLoadMore(false);
      }, 300); // 300ms delay after drag ends
    }
    
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [dragging, shouldLoadMore, onLoadMore, hasMore]);

  // Mouse drag logic
  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    setHasDragged(false);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setHasDragged(true);
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  }
  function onMouseUp() {
    setDragging(false);
    setTimeout(() => setHasDragged(false), 100);
  }
  // Touch support
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      setDragging(true);
      setHasDragged(false);
      setStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging || e.touches.length !== 1) return;
    setHasDragged(true);
    setOffset({ x: e.touches[0].clientX - start.x, y: e.touches[0].clientY - start.y });
  }
  function onTouchEnd() {
    setDragging(false);
    setTimeout(() => setHasDragged(false), 100);
  }

  // Cleanup timeout on unmount and periodically clean position map
  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  // Periodically clean up old position mappings to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentViewportWidth = window.innerWidth;
      const currentViewportHeight = window.innerHeight;
      const currentOffset = offset;
      
      // Calculate current visible bounds with larger buffer for cleanup
      const leftBound = -currentOffset.x - CARD_SIZE * 3;
      const rightBound = -currentOffset.x + currentViewportWidth + CARD_SIZE * 3;
      const topBound = -currentOffset.y - CARD_SIZE * 3;
      const bottomBound = -currentOffset.y + currentViewportHeight + CARD_SIZE * 3;
      
      const startCol = Math.floor(leftBound / CELL_WIDTH);
      const endCol = Math.ceil(rightBound / CELL_WIDTH);
      const startRow = Math.floor(topBound / CELL_HEIGHT);
      const endRow = Math.ceil(bottomBound / CELL_HEIGHT);
      
      // Remove position mappings that are far outside the current viewport
      const keysToDelete: string[] = [];
      for (const [key, value] of cardPositionMapRef.current.entries()) {
        if (value.row < startRow - 15 || value.row > endRow + 15 || 
            value.col < startCol - 15 || value.col > endCol + 15) {
          keysToDelete.push(key);
        }
      }
      
      if (keysToDelete.length > 0) {
        console.log(`[InfiniteCardCanvas] Cleaning up ${keysToDelete.length} old position mappings`);
        keysToDelete.forEach(key => cardPositionMapRef.current.delete(key));
      }
    }, 15000); // Clean up every 15 seconds (less frequent)
    
    return () => clearInterval(cleanupInterval);
  }, [offset]);

  // Stable click handler inside the component
  const handleTileClick = React.useCallback(
    (card: DisplayCard) => {
      if (hasDragged) return;
      onCardSelect?.(card);
    },
    [hasDragged, onCardSelect]
  );

  return (
    <div
      ref={containerRef}
      className={`infinite-card-canvas${dragging ? ' dragging' : ''} ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      {/* Infinite card container */}
      <div
        className="infinite-card-container"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {visibleCards.map((card) => {
          return (
            <CardTile
              key={`cell-${card.gridRow}-${card.gridCol}`}
              card={card}
              optimizeForInfiniteGrid={true}
              style={{
                position: 'absolute',
                left: card.x,
                top: card.y,
                width: CARD_SIZE,
                height: CARD_SIZE,
              }}
              onClick={() => handleTileClick(card)}
              showActions={false}
              showMetadata={true}
            />
          );
        })}
      </div>
    </div>
  );
};