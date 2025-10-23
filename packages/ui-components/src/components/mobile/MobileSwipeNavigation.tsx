'use client';

import React, { useRef } from 'react';

export interface MobileSwipeNavigationProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
  enabled?: boolean;
}

export const MobileSwipeNavigation: React.FC<MobileSwipeNavigationProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 30,
  preventDefault = false,
  enabled = true
}) => {
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    if (touch) {
      startPos.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      console.log('👆 Touch Start:', { x: touch.clientX, y: touch.clientY });
    }
    
    if (preventDefault) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled) return;
    
    if (preventDefault) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enabled || !startPos.current) return;
    
    const touch = e.changedTouches[0];
    if (!touch) {
      console.log('👆 Touch End: No touch found');
      startPos.current = null;
      return;
    }
    
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    console.log('👆 Touch End:', { 
      startX: startPos.current.x,
      startY: startPos.current.y,
      endX: touch.clientX,
      endY: touch.clientY,
      deltaX, 
      deltaY, 
      absDeltaX, 
      absDeltaY, 
      threshold,
      meetsThreshold: absDeltaX > threshold || absDeltaY > threshold
    });
    
    // Reset start position
    startPos.current = null;
    
    // Check if swipe meets threshold
    if (absDeltaX > threshold || absDeltaY > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        console.log('👆 Horizontal swipe detected:', deltaX > 0 ? 'Right' : 'Left', 'deltaX:', deltaX);
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        console.log('👆 Vertical swipe detected:', deltaY > 0 ? 'Down' : 'Up', 'deltaY:', deltaY);
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    } else {
      console.log('👆 Swipe too small, ignoring');
    }
    
    if (preventDefault) {
      e.preventDefault();
    }
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full w-full"
      style={{ touchAction: preventDefault ? 'none' : 'auto' }}
    >
      {children}
    </div>
  );
};
