'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useHUDStore } from '../../stores/HUDStore';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';

interface MobileNavigationControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onToggleMode?: () => void;
  className?: string;
  // Visibility control props
  isChatOpen?: boolean;
  isSeedEntityPanelOpen?: boolean;
  isEntityModalOpen?: boolean;
}

export const MobileNavigationControls: React.FC<MobileNavigationControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleMode,
  className = '',
  isChatOpen = false,
  isSeedEntityPanelOpen = false,
  isEntityModalOpen = false
}) => {
  const { isMobile, hasTouch } = useDeviceDetection();
  const { cosmosChatOpen } = useHUDStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null);

  // Only show on mobile/touch devices
  if (!isMobile && !hasTouch) {
    return null;
  }

  // Smart visibility logic
  const shouldShowControls = !cosmosChatOpen && !isChatOpen && !isSeedEntityPanelOpen && !isEntityModalOpen;
  
  // Touch interaction detection
  useEffect(() => {
    const handleTouchStart = () => {
      setIsInteracting(true);
      // Clear any existing timeout
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };

    const handleTouchEnd = () => {
      // Set a timeout to fade back in after touch interaction ends
      const timeout = setTimeout(() => {
        setIsInteracting(false);
      }, 2000); // 2 seconds delay before showing controls again
      setFadeTimeout(timeout);
    };

    // Add touch event listeners to the canvas
    const canvas = document.getElementById('cosmos-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [fadeTimeout]);

  // Don't render if any blocking UI is open
  if (!shouldShowControls) {
    return null;
  }

  const handleZoomIn = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event propagation to avoid conflicts with other touch handlers
    e?.stopPropagation();
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('camera-zoom-in', { 
      detail: { amount: 0.8 } 
    }));
    onZoomIn?.();
  }, [onZoomIn]);

  const handleZoomOut = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event propagation to avoid conflicts with other touch handlers
    e?.stopPropagation();
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('camera-zoom-out', { 
      detail: { amount: 1.2 } 
    }));
    onZoomOut?.();
  }, [onZoomOut]);

  const handleReset = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event propagation to avoid conflicts with other touch handlers
    e?.stopPropagation();
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('camera-reset', { 
      detail: { target: { x: 0, y: 0, z: 0 }, distance: 80 } 
    }));
    onReset?.();
  }, [onReset]);

  const handleToggleMode = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent event propagation to avoid conflicts with other touch handlers
    e?.stopPropagation();
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('camera-toggle-mode', { 
      detail: { mode: 'orbit' } // Toggle between orbit and free
    }));
    onToggleMode?.();
  }, [onToggleMode]);

  return (
    <div className={`fixed bottom-4 right-4 z-[60] ${className} transition-opacity duration-300 ${
      isInteracting ? 'opacity-20' : 'opacity-100'
    }`}>
      {/* Main Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 shadow-lg"
        aria-label="Toggle navigation controls"
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="w-12 h-12 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 shadow-lg"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="w-12 h-12 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 shadow-lg"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h3" />
            </svg>
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleReset}
            className="w-12 h-12 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 shadow-lg"
            aria-label="Reset camera"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Toggle Mode */}
          <button
            onClick={handleToggleMode}
            className="w-12 h-12 bg-black/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/30 transition-all duration-200 shadow-lg"
            aria-label="Toggle camera mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 12.8V2.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileNavigationControls;