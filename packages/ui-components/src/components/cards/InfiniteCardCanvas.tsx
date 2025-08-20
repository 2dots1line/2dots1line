import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
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

export const InfiniteCardCanvas: React.FC<InfiniteCardCanvasProps> = ({
  cards,
  onCardSelect,
  onLoadMore,
  hasMore = false,
  className = '',
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible cards based on current offset and viewport size
  const visibleCards = useMemo(() => {
    if (typeof window === 'undefined' || cards.length === 0) return [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Calculate bounds
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
        // Seeded random selection from cards array
        const seed = row * 1000 + col;
        const cardIndex = Math.floor(Math.abs(seededRandom(seed)) * cards.length) % cards.length;
        const card = cards[cardIndex];
        result.push({
          ...card,
          x: col * CELL_WIDTH + GRID_PADDING,
          y: row * CELL_HEIGHT + GRID_PADDING,
          gridRow: row,
          gridCol: col,
        });
      }
    }
    return result;
  }, [offset, cards]);

  // Check if we need to load more cards when user scrolls to edges
  useEffect(() => {
    if (!onLoadMore || !hasMore || cards.length === 0) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate if user is near the edges of the loaded area
    const gridWidth = Math.ceil(viewportWidth / CELL_WIDTH) + 4; // Buffer
    const gridHeight = Math.ceil(viewportHeight / CELL_HEIGHT) + 4; // Buffer
    
    // Estimate how many cards we have loaded in the grid
    const estimatedLoadedCards = gridWidth * gridHeight;
    
    // If we're using more than 80% of available cards, load more
    if (visibleCards.length > estimatedLoadedCards * 0.8) {
      console.log('InfiniteCardCanvas: Loading more cards, using', visibleCards.length, 'of', cards.length, 'available cards');
      onLoadMore();
    }
  }, [visibleCards.length, cards.length, hasMore, onLoadMore]);

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

  // Touch support (optional, can be expanded)
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

  // Add log for offset state changes
  React.useEffect(() => {
  }, [offset]);

  // Card click handler
  function handleCardClick(card: DisplayCard) {
    if (dragging || hasDragged) return;
    onCardSelect?.(card);
  }

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
        {visibleCards.map((card, idx) => (
          <div
            key={`${card.card_id || idx}-${card.gridRow}-${card.gridCol}`}
            className="card-tile"
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y,
              width: CARD_SIZE,
              height: CARD_SIZE,
              borderRadius: 24,
              overflow: 'hidden',
              background: 'transparent',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
            }}
            onClick={() => handleCardClick(card)}
          >
            {/* Card background image */}
            <div
              className="card-background"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: card.background_image_url ? `url(${card.background_image_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1,
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
            {/* Overlay for text readability */}
            <div className="card-overlay" />
            {/* Card content */}
            <div className="card-content">
              <h3 className="card-title">{card.title || card.card_type || "Card"}</h3>
              <p className="card-subtitle">{card.subtitle || card.display_data?.preview || ""}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Debug info (development only) */}
    </div>
  );
}; 