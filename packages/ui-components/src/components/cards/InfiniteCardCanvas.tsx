import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DisplayCard } from '@2dots1line/shared-types';
import { CardTile } from './CardTile';
import './InfiniteCardCanvas.css';

interface InfiniteCardCanvasProps {
  cards: DisplayCard[];
  onCardSelect?: (card: DisplayCard) => void;
  className?: string;
}

interface CardPosition extends DisplayCard {
  x: number;
  y: number;
}

interface ViewportOffset {
  x: number;
  y: number;
}

export const InfiniteCardCanvas: React.FC<InfiniteCardCanvasProps> = ({
  cards,
  onCardSelect,
  className = ''
}) => {
  // Viewport state for infinite scrolling
  const [offset, setOffset] = useState<ViewportOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Refs for performance
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Constants for card grid layout
  const CARD_WIDTH = 320;
  const CARD_HEIGHT = 200;
  const CARD_SPACING = 40;
  const GRID_SIZE_X = 8; // Cards per row in virtual grid
  const GRID_SIZE_Y = 6; // Rows in virtual grid
  const VIEWPORT_BUFFER = 200; // Extra rendering buffer around viewport

  // Seeded random function for consistent card positioning
  const seededRandom = useCallback((seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }, []);

  // Generate card positions using seeded random for consistency
  const cardPositions = useMemo<CardPosition[]>(() => {
    return cards.map((card, index) => {
      // Use card ID for consistent seeding, fallback to index
      const seed = card.card_id || `card-${index}`;
      const seedValue = seededRandom(seed);
      
      // Create infinite grid with some randomness
      const baseGridX = index % GRID_SIZE_X;
      const baseGridY = Math.floor(index / GRID_SIZE_X);
      
      // Add seeded randomness to position within grid cell
      const randomOffsetX = (seedValue * 0.5 - 0.25) * CARD_SPACING;
      const randomOffsetY = (seededRandom(seed + 'y') * 0.5 - 0.25) * CARD_SPACING;
      
      const x = baseGridX * (CARD_WIDTH + CARD_SPACING) + randomOffsetX;
      const y = baseGridY * (CARD_HEIGHT + CARD_SPACING) + randomOffsetY;

      return {
        ...card,
        x,
        y
      };
    });
  }, [cards, seededRandom]);

  // Calculate visible cards based on current viewport
  const visibleCards = useMemo(() => {
    if (!containerRef.current) return cardPositions;

    const viewport = containerRef.current.getBoundingClientRect();
    const viewportLeft = -offset.x - VIEWPORT_BUFFER;
    const viewportRight = -offset.x + viewport.width + VIEWPORT_BUFFER;
    const viewportTop = -offset.y - VIEWPORT_BUFFER;
    const viewportBottom = -offset.y + viewport.height + VIEWPORT_BUFFER;

    return cardPositions.filter(card => 
      card.x + CARD_WIDTH >= viewportLeft &&
      card.x <= viewportRight &&
      card.y + CARD_HEIGHT >= viewportTop &&
      card.y <= viewportBottom
    );
  }, [cardPositions, offset]);

  // Mouse/touch event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    // Use requestAnimationFrame for smooth updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    });

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
      e.preventDefault();
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastMousePos.x;
    const deltaY = touch.clientY - lastMousePos.y;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    });

    setLastMousePos({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, lastMousePos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global event listeners for drag operations
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle card selection
  const handleCardClick = useCallback((card: DisplayCard) => {
    if (!isDragging) { // Only trigger if not in middle of drag
      onCardSelect?.(card);
    }
  }, [isDragging, onCardSelect]);

  return (
    <div 
      ref={containerRef}
      className={`infinite-card-canvas ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Infinite card container */}
      <div 
        className="infinite-card-container" 
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {visibleCards.map((card) => (
          <CardTile
            key={card.card_id || `card-${card.x}-${card.y}`}
            card={card}
            size="md"
            onClick={() => handleCardClick(card)}
            optimizeForInfiniteGrid={true}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
            }}
          />
        ))}
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <div>Total Cards: {cards.length}</div>
          <div>Visible Cards: {visibleCards.length}</div>
          <div>Offset: ({Math.round(offset.x)}, {Math.round(offset.y)})</div>
        </div>
      )}
    </div>
  );
}; 