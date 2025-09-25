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

  // Freeze the card pool during a drag so identities don’t change mid-gesture
  const cardsSnapshotRef = useRef<DisplayCard[]>(cards);
  useEffect(() => {
    if (!dragging) {
      // When not dragging, keep snapshot updated with the latest cards
      cardsSnapshotRef.current = cards;
    }
  }, [cards, dragging]);

  const activeCards = dragging ? cardsSnapshotRef.current : cards;

  // Calculate visible cards based on current offset and viewport size
  const visibleCards = useMemo(() => {
    if (typeof window === 'undefined' || activeCards.length === 0) return [];
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
        const card = selectCardForCell(activeCards, col, row);
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
  }, [offset, activeCards]);

  // Auto-load more if needed (unchanged)
  useEffect(() => {
    if (!onLoadMore || !hasMore || cards.length === 0) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gridWidth = Math.ceil(viewportWidth / CELL_WIDTH) + 4;
    const gridHeight = Math.ceil(viewportHeight / CELL_HEIGHT) + 4;
    const estimatedLoadedCards = gridWidth * gridHeight;
    if (visibleCards.length > estimatedLoadedCards * 0.8) {
      onLoadMore();
    }
  }, [visibleCards.length, cards.length, hasMore, onLoadMore]);

  // Mouse drag logic
  function onMouseDown(e: React.MouseEvent) {
    cardsSnapshotRef.current = cards; // snapshot at the moment drag starts
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
      cardsSnapshotRef.current = cards; // snapshot at drag start
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
          // Determine display values with resilient fallbacks
          const displayTitle =
            card?.title ||
            (typeof card?.type === 'string' ? card.type.replace(/_/g, ' ') : '') ||
            'Card';
          const displaySubtitle =
            card?.subtitle ||
            (typeof card?.source_entity_type === 'string' ? card.source_entity_type.replace(/_/g, ' ') : '') ||
            'Item';

          return (
            <div
              // Use stable per-cell key so identity never changes during drag
              key={`cell-${card.gridRow}-${card.gridCol}`}
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
              onClick={() => handleTileClick(card)}
            >
              {/* Background image */}
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
                }}
              />
              {/* Readability overlay */}
              <div className="card-overlay" />
              {/* Content */}
              <div className="card-content">
                <div className="card-title">{displayTitle}</div>
                <div className="card-subtitle">{displaySubtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};