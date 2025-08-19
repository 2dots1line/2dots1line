/**
 * useInfiniteCardGrid - Hook for infinite scrolling card grid
 * V11.0 - Handles viewport rendering and drag interactions
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TCard } from '@2dots1line/shared-types';

// Local types to avoid circular dependencies
interface DisplayCard extends TCard {
  image?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  background_image_url?: string;
}

// Grid configuration
interface GridConfig {
  cardWidth: number;
  cardHeight: number;
  gap: number;
  padding: number;
  columns: number;
  rows: number;
}

// Viewport bounds
interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Grid position
interface GridPosition {
  col: number;
  row: number;
}

// Visible card with position
interface VisibleCard {
  card: DisplayCard;
  position: GridPosition;
  x: number;
  y: number;
  index: number;
}

// Drag state
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
}

// Hook configuration
interface UseInfiniteCardGridConfig {
  cards: DisplayCard[];
  containerRef: React.RefObject<HTMLDivElement>;
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
  padding?: number;
  bufferSize?: number; // Number of cards to render outside viewport
  enableDrag?: boolean;
  onCardSelect?: (card: DisplayCard) => void;
  onViewportChange?: (offset: { x: number; y: number }) => void;
}

/**
 * Seeded random number generator for consistent card positioning
 * Adapted from prototype
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a card for a specific grid position
 * Uses seeded random to ensure same card always appears at same position
 */
function generateCardForPosition(
  cards: DisplayCard[],
  col: number,
  row: number
): DisplayCard | null {
  if (cards.length === 0) return null;
  
  const seed = col * 1000 + row;
  const randomValue = seededRandom(seed);
  const index = Math.floor(randomValue * cards.length);
  
  return cards[index];
}

/**
 * Calculate viewport bounds based on offset and container size
 */
function calculateViewportBounds(
  offset: { x: number; y: number },
  containerWidth: number,
  containerHeight: number,
  config: GridConfig
): ViewportBounds {
  const { cardWidth, cardHeight, gap } = config;
  const cellWidth = cardWidth + gap;
  const cellHeight = cardHeight + gap;
  
  return {
    left: Math.floor(-offset.x / cellWidth) - 1,
    top: Math.floor(-offset.y / cellHeight) - 1,
    right: Math.ceil((-offset.x + containerWidth) / cellWidth) + 1,
    bottom: Math.ceil((-offset.y + containerHeight) / cellHeight) + 1,
  };
}

/**
 * useInfiniteCardGrid hook for efficient viewport-based rendering
 */
export function useInfiniteCardGrid(config: UseInfiniteCardGridConfig) {
  const {
    cards,
    containerRef,
    cardWidth = 280,
    cardHeight = 200,
    gap = 16,
    padding = 20,
    bufferSize = 5,
    enableDrag = true,
    onCardSelect,
    onViewportChange
  } = config;
  
  // State
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  });
  
  // Refs
  const animationFrameRef = useRef<number>();
  const lastOffsetRef = useRef(offset);
  
  // Grid configuration
  const gridConfig: GridConfig = useMemo(() => ({
    cardWidth,
    cardHeight,
    gap,
    padding,
    columns: Math.floor((containerSize.width - 2 * padding) / (cardWidth + gap)) || 1,
    rows: Math.floor((containerSize.height - 2 * padding) / (cardHeight + gap)) || 1
  }), [cardWidth, cardHeight, gap, padding, containerSize]);
  
  // Calculate visible cards based on viewport
  const visibleCards = useMemo(() => {
    if (!containerRef.current || cards.length === 0) return [];
    
    const bounds = calculateViewportBounds(
      offset,
      containerSize.width,
      containerSize.height,
      gridConfig
    );
    
    const visible: VisibleCard[] = [];
    const cellWidth = cardWidth + gap;
    const cellHeight = cardHeight + gap;
    
    // Generate cards for visible grid positions
    for (let row = bounds.top; row <= bounds.bottom; row++) {
      for (let col = bounds.left; col <= bounds.right; col++) {
        const card = generateCardForPosition(cards, col, row);
        if (card) {
          visible.push({
            card,
            position: { col, row },
            x: col * cellWidth + padding,
            y: row * cellHeight + padding,
            index: visible.length
          });
        }
      }
    }
    
    return visible;
  }, [cards, offset, containerSize, gridConfig, cardWidth, cardHeight, gap, padding]);
  
  // Update container size
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height
      });
    }
  }, [containerRef]);
  
  // Handle viewport change
  const handleViewportChange = useCallback((newOffset: { x: number; y: number }) => {
    setOffset(newOffset);
    onViewportChange?.(newOffset);
  }, [onViewportChange]);
  
  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableDrag) return;
    
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY
    });
    
    e.preventDefault();
  }, [enableDrag]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const deltaX = e.clientX - dragState.lastX;
    const deltaY = e.clientY - dragState.lastY;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setDragState(prev => ({
      ...prev,
      lastX: e.clientX,
      lastY: e.clientY
    }));
  }, [dragState]);
  
  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableDrag || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY
    });
    
    e.preventDefault();
  }, [enableDrag]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.lastX;
    const deltaY = touch.clientY - dragState.lastY;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setDragState(prev => ({
      ...prev,
      lastX: touch.clientX,
      lastY: touch.clientY
    }));
    
    e.preventDefault();
  }, [dragState]);
  
  const handleTouchEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
  // Card click handler
  const handleCardClick = useCallback((card: DisplayCard, e: React.MouseEvent) => {
    // Don't trigger click if we were dragging
    if (Math.abs(e.clientX - dragState.startX) > 5 || 
        Math.abs(e.clientY - dragState.startY) > 5) {
      return;
    }
    
    onCardSelect?.(card);
  }, [dragState, onCardSelect]);
  
  // Smooth animation for programmatic offset changes
  const animateToOffset = useCallback((targetOffset: { x: number; y: number }, duration = 300) => {
    const startOffset = lastOffsetRef.current;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentOffset = {
        x: startOffset.x + (targetOffset.x - startOffset.x) * easeOut,
        y: startOffset.y + (targetOffset.y - startOffset.y) * easeOut
      };
      
      setOffset(currentOffset);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        lastOffsetRef.current = targetOffset;
      }
    };
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);
  
  // Effect to update container size on mount and resize
  useEffect(() => {
    updateContainerSize();
    
    const handleResize = () => {
      updateContainerSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateContainerSize]);
  
  // Effect to handle mouse events
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  
  // Update last offset ref
  useEffect(() => {
    lastOffsetRef.current = offset;
  }, [offset]);
  
  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Public API
  const resetPosition = useCallback(() => {
    animateToOffset({ x: 0, y: 0 });
  }, [animateToOffset]);
  
  const centerOnCard = useCallback((card: DisplayCard) => {
    // Find the card's position in the grid
    const cardPosition = visibleCards.find(vc => vc.card.card_id === card.card_id);
    if (cardPosition) {
      const centerX = containerSize.width / 2 - cardPosition.x - cardWidth / 2;
      const centerY = containerSize.height / 2 - cardPosition.y - cardHeight / 2;
      animateToOffset({ x: centerX, y: centerY });
    }
  }, [visibleCards, containerSize, cardWidth, cardHeight, animateToOffset]);
  
  return {
    // Rendered cards
    visibleCards,
    
    // Grid state
    offset,
    isDragging: dragState.isDragging,
    containerSize,
    gridConfig,
    
    // Event handlers
    handleMouseDown,
    handleTouchStart,
    handleCardClick,
    
    // Methods
    resetPosition,
    centerOnCard,
    animateToOffset,
    
    // Viewport info
    totalCards: cards.length,
    visibleCardCount: visibleCards.length,
    
    // Style helpers
    containerStyle: {
      cursor: dragState.isDragging ? 'grabbing' : 'grab',
      overflow: 'hidden',
      position: 'relative' as const,
      width: '100%',
      height: '100%'
    },
    
    gridStyle: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      transition: dragState.isDragging ? 'none' : 'transform 0.1s ease-out'
    }
  };
} 