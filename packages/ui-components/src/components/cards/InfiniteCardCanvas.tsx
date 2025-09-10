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
  // NEW: placement + origin + reset behavior
  placementMode?: 'random' | 'orderedFromOrigin';
  origin?: { col: number; row: number };
  resetOnCardsChange?: boolean;
  showResetButton?: boolean;
  // NEW: anchor pixel in viewport coordinates (x,y) to lock index 0 under a specific UI point
  anchorPixel?: { x: number; y: number };
  // NEW: sorting controls (handled internally on each drag end)
  sortKey?: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
  hasCoverFirst?: boolean;
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

// NEW: map a grid cell to a card using ordered mapping near origin
function selectCardForCell(
  cards: DisplayCard[],
  col: number,
  row: number,
  placementMode: 'random' | 'orderedFromOrigin',
  origin: { col: number; row: number }
): DisplayCard {
  if (cards.length === 0) {
    // Fallback dummy object shape safeguard
    return {} as DisplayCard;
  }

  if (placementMode === 'orderedFromOrigin') {
    const localCol = col - origin.col;
    const localRow = row - origin.row;

    // Only enforce ordering in the first quadrant (>= origin)
    if (localCol >= 0 && localRow >= 0) {
      // Use a very wide virtual row width to ensure unique mapping
      // This provides a stable row-major order for visible regions
      const LARGE_GRID_WIDTH = 1000;
      const index = localRow * LARGE_GRID_WIDTH + localCol;
      return cards[index % cards.length];
    }
  }

  // Fallback: deterministic seeded random (for other quadrants / far regions)
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
  placementMode = 'orderedFromOrigin',
  origin = { col: 0, row: 0 },
  resetOnCardsChange = true,
  showResetButton = true,
  anchorPixel,
  sortKey = 'newest',
  hasCoverFirst = false,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // NEW: track a dynamic origin that matches the current viewport’s top-left tile
  const [dynamicOrigin, setDynamicOrigin] = useState<{ col: number; row: number }>(origin);
  // NEW: epoch to recompute sorting after each drag end (ensures “reset unsorted then sort” each time)
  const [dragEpoch, setDragEpoch] = useState(0);

  // Helper to compute the viewport’s top-left tile (closest full tile to top-left)
  const getViewportTopLeftCell = useCallback(() => {
    // Use floor so we always pick the fully visible top-left cell
    const col0 = Math.floor((-offset.x - GRID_PADDING) / CELL_WIDTH);
    const row0 = Math.floor((-offset.y - GRID_PADDING) / CELL_HEIGHT);
    return { col: col0, row: row0 };
  }, [offset.x, offset.y]);

  // NEW: compute the grid cell that contains the given anchor pixel (just below toolbar)
  const getAnchorCell = useCallback(() => {
    if (anchorPixel) {
      const col0 = Math.floor((anchorPixel.x - offset.x - GRID_PADDING) / CELL_WIDTH);
      const row0 = Math.floor((anchorPixel.y - offset.y - GRID_PADDING) / CELL_HEIGHT);
      return { col: col0, row: row0 };
    }
    return getViewportTopLeftCell();
  }, [anchorPixel?.x, anchorPixel?.y, offset.x, offset.y, getViewportTopLeftCell]);

  // NEW: create a freshly sorted list from the raw pool each time (ignores any prior order)
  const orderedCards = useMemo(() => {
    const arr = [...cards];
    arr.sort((a, b) => {
      const aCreated = a?.created_at ? new Date(a.created_at as any).getTime() : 0;
      const bCreated = b?.created_at ? new Date(b.created_at as any).getTime() : 0;
      const aTitle = (a?.title || '').toString().toLowerCase();
      const bTitle = (b?.title || '').toString().toLowerCase();
      switch (sortKey) {
        case 'oldest':
          return aCreated - bCreated;
        case 'title_asc':
          return aTitle.localeCompare(bTitle);
        case 'title_desc':
          return bTitle.localeCompare(aTitle);
        case 'newest':
        default:
          return bCreated - aCreated;
      }
    });
    if (hasCoverFirst) {
      const withCover = arr.filter(c => !!c.background_image_url);
      const withoutCover = arr.filter(c => !c.background_image_url);
      return [...withCover, ...withoutCover];
    }
    return arr;
  }, [cards, sortKey, hasCoverFirst, dragEpoch]);

  // Ensure sort changes immediately trigger a fresh compute and re-anchor cycle
  useEffect(() => {
    setDragEpoch(prev => prev + 1);
  }, [sortKey, hasCoverFirst]);

    // NEW: on mount and on drag (offset changes), re-anchor so orderedCards[0] sits under anchorPixel
    useEffect(() => {
    const next = getAnchorCell();
    if (next.col !== dynamicOrigin.col || next.row !== dynamicOrigin.row) {
      setDynamicOrigin(next);
    }
  }, [getAnchorCell, dynamicOrigin.col, dynamicOrigin.row]);

  // NEW: when cards order changes (e.g., due to sortKey/cover toggle or data change), re-anchor to anchorPixel cell
  const prevOrderKeyRef = useRef<string>('');
  useEffect(() => {
    const orderKey = orderedCards.map(c => c.card_id).join('|');
    if (resetOnCardsChange && orderKey !== prevOrderKeyRef.current) {
      setDynamicOrigin(getAnchorCell());
      prevOrderKeyRef.current = orderKey;
    }
  }, [orderedCards, resetOnCardsChange, getAnchorCell]);

  // Calculate visible cards based on current offset and viewport size
  const visibleCards = useMemo(() => {
    if (typeof window === 'undefined' || orderedCards.length === 0) return [];
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
        // NEW: use dynamicOrigin so index 0 is anchored at the anchorPixel’s cell
        const card = selectCardForCell(orderedCards, col, row, placementMode, dynamicOrigin);
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
  }, [offset, orderedCards, placementMode, dynamicOrigin]);

  // Auto-load more if needed (unchanged)
  useEffect(() => {
    if (!onLoadMore || !hasMore || orderedCards.length === 0) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gridWidth = Math.ceil(viewportWidth / CELL_WIDTH) + 4;
    const gridHeight = Math.ceil(viewportHeight / CELL_HEIGHT) + 4;
    const estimatedLoadedCards = gridWidth * gridHeight;
    if (visibleCards.length > estimatedLoadedCards * 0.8) {
      onLoadMore();
    }
  }, [visibleCards.length, orderedCards.length, hasMore, onLoadMore]);

  // Mouse drag logic (increment epoch on drag end)
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
    setDragEpoch(prev => prev + 1); // NEW: trigger “reset unsorted then sort”
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
    setDragEpoch(prev => prev + 1); // NEW: trigger “reset unsorted then sort”
  }

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
      {/* Optional quick action to jump to the starting point */}
      {showResetButton && (
        <div
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 10px', borderRadius: 12, fontSize: 12, userSelect: 'none' }}
          title="Reset view to the start (origin)"
        >
          <button
            onClick={() => { setOffset({ x: 0, y: 0 }); setDynamicOrigin(origin); }}
            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
          >
            Reset to start
          </button>
        </div>
      )}
      {/* Infinite card container */}
      <div
        className="infinite-card-container"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {/* NEW: tiny origin marker at the current dynamic origin */}
        <div
          title="Start (anchored to current viewport)"
          style={{
            position: 'absolute',
            left: dynamicOrigin.col * CELL_WIDTH + GRID_PADDING - 6,
            top: dynamicOrigin.row * CELL_HEIGHT + GRID_PADDING - 6,
            width: 12,
            height: 12,
            borderRadius: 12,
            background: '#fff',
            border: '2px solid rgba(0,0,0,0.6)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            zIndex: 2,
          }}
        />
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
              }}
            />
            {/* Subtle overlay and content (existing UI) */}
            {/* ... existing code ... */}
          </div>
        ))}
      </div>
    </div>
  );
};