'use client';

import { useState, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

interface SwipeGestureReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | null;
  isSwipeActive: boolean;
}

export const useSwipeGesture = ({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  preventDefault = true
}: SwipeGestureOptions): SwipeGestureReturn => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsSwipeActive(true);
    setSwipeDirection(null);
  }, [preventDefault]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isSwipeActive) return;
    
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Determine swipe direction based on movement
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
    }
  }, [touchStart, isSwipeActive, preventDefault]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isSwipeActive) return;
    
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Check if swipe meets threshold
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > threshold || absDeltaY > threshold) {
      // Determine final swipe direction
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
    
    // Reset state
    setTouchStart(null);
    setIsSwipeActive(false);
    setSwipeDirection(null);
  }, [touchStart, isSwipeActive, threshold, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, preventDefault]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    isSwipeActive
  };
};
