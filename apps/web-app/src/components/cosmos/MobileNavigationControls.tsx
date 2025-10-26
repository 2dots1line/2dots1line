'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const { cosmosChatOpen, mobileCosmosChatOpen, mobileHudVisible } = useHUDStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isNavigationPanelOpen, setIsNavigationPanelOpen] = useState(false);

  // Smart visibility logic - hide when navigation panel is open or other blocking UI
  const shouldShowControls = !isChatOpen && !mobileCosmosChatOpen && !isSeedEntityPanelOpen && !isEntityModalOpen && !isNavigationPanelOpen;
  
  console.log('📱 MobileNavigationControls: Device and state', {
    isMobile,
    hasTouch,
    isChatOpen,
    mobileCosmosChatOpen,
    isSeedEntityPanelOpen,
    isEntityModalOpen,
    isNavigationPanelOpen,
    shouldShowControls
  });
  
  // Touch interaction detection - improved responsiveness
  useEffect(() => {
    const handleTouchStart = () => {
      setIsInteracting(true);
      // Clear any existing timeout
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };

    const handleTouchEnd = () => {
      // Set a shorter timeout for better responsiveness
      const timeout = setTimeout(() => {
        setIsInteracting(false);
      }, 1000); // Reduced from 2000ms to 1000ms
      setFadeTimeout(timeout);
    };

    // Add touch event listeners to the canvas with better event handling
    const canvas = document.getElementById('cosmos-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [fadeTimeout]);

  // Listen for navigation panel state changes
  useEffect(() => {
    const handleNavigationPanelOpen = () => {
      setIsNavigationPanelOpen(true);
      console.log('📱 MobileNavigationControls: Navigation panel opened');
    };

    const handleNavigationPanelClose = () => {
      setIsNavigationPanelOpen(false);
      console.log('📱 MobileNavigationControls: Navigation panel closed');
    };

    // Listen for custom events from navigation panel
    window.addEventListener('navigation-panel-open', handleNavigationPanelOpen);
    window.addEventListener('navigation-panel-close', handleNavigationPanelClose);

    return () => {
      window.removeEventListener('navigation-panel-open', handleNavigationPanelOpen);
      window.removeEventListener('navigation-panel-close', handleNavigationPanelClose);
    };
  }, []);

  // Helper function to trigger haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    console.log('📱 Haptic feedback attempt:', {
      hasVibrate: 'vibrate' in navigator,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints
    });
    
    if ('vibrate' in navigator) {
      try {
        // Try different vibration patterns for better compatibility
        const vibrationPattern = [50, 10, 50]; // Short-long-short pattern
        navigator.vibrate(vibrationPattern);
        console.log('📱 Haptic feedback triggered successfully');
      } catch (error) {
        console.warn('📱 Haptic feedback blocked by browser:', error);
      }
    } else {
      console.log('📱 Device does not support vibration API');
    }
  }, []);

  // Track active keys to prevent sticky keys
  const activeKeysRef = useRef<Set<string>>(new Set());

  // All hooks must be called before any conditional returns
  const handleReset = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Prevent event propagation to avoid conflicts with other touch handlers
    e?.stopPropagation();
    e?.preventDefault();
    
    window.dispatchEvent(new CustomEvent('camera-reset', { 
      detail: { target: { x: 0, y: 0, z: 0 }, distance: 80 } 
    }));
    onReset?.();
  }, [onReset, triggerHapticFeedback]);

  // Helper function to handle key press with proper cleanup
  const handleKeyPress = useCallback((key: string, shiftKey: boolean = false) => {
    // Trigger haptic feedback
    triggerHapticFeedback();
    
    // Prevent duplicate key events
    if (activeKeysRef.current.has(key)) {
      return;
    }
    
    activeKeysRef.current.add(key);
    
    // Dispatch keydown event with proper event properties
    const keyboardEvent = new KeyboardEvent('keydown', { 
      key, 
      shiftKey,
      bubbles: true,
      cancelable: true,
      code: key === ' ' ? 'Space' : key.toUpperCase(),
      keyCode: key === ' ' ? 32 : key.charCodeAt(0),
      which: key === ' ' ? 32 : key.charCodeAt(0)
    });
    
    // Dispatch to window to match camera controller's event listener
    window.dispatchEvent(keyboardEvent);
  }, [triggerHapticFeedback]);

  // Helper function to handle key release with proper cleanup
  const handleKeyRelease = useCallback((key: string, shiftKey: boolean = false) => {
    // Only release if it was active
    if (!activeKeysRef.current.has(key)) {
      return;
    }
    
    activeKeysRef.current.delete(key);
    
    // Dispatch keyup event with proper event properties
    const keyboardEvent = new KeyboardEvent('keyup', { 
      key, 
      shiftKey,
      bubbles: true,
      cancelable: true,
      code: key === ' ' ? 'Space' : key.toUpperCase(),
      keyCode: key === ' ' ? 32 : key.charCodeAt(0),
      which: key === ' ' ? 32 : key.charCodeAt(0)
    });
    
    // Dispatch to window to match camera controller's event listener
    window.dispatchEvent(keyboardEvent);
  }, []);

  // Cleanup function to release all keys when component unmounts or loses focus
  const cleanupKeys = useCallback(() => {
    activeKeysRef.current.forEach((key: string) => {
      window.dispatchEvent(new KeyboardEvent('keyup', { 
        key, 
        shiftKey: false,
        bubbles: true,
        cancelable: true,
        code: key === ' ' ? 'Space' : key.toUpperCase(),
        keyCode: key === ' ' ? 32 : key.charCodeAt(0),
        which: key === ' ' ? 32 : key.charCodeAt(0)
      }));
    });
    activeKeysRef.current.clear();
  }, []);

  // Cleanup on unmount and visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupKeys();
      }
    };

    const handleBlur = () => {
      cleanupKeys();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      cleanupKeys();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [cleanupKeys]);

  // Add native touch event listeners for D-pad controls
  useEffect(() => {
    const handleNativeTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const dpadButton = target.closest('[data-dpad-control]');
      
      if (dpadButton) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine which key to press based on the button
        const buttonElement = dpadButton as HTMLElement;
        const ariaLabel = buttonElement.getAttribute('aria-label') || '';
        
        if (ariaLabel.includes('forward')) {
          handleKeyPress('w');
        } else if (ariaLabel.includes('backward')) {
          handleKeyPress('s');
        } else if (ariaLabel.includes('left')) {
          handleKeyPress('a');
        } else if (ariaLabel.includes('right')) {
          handleKeyPress('d');
        } else if (ariaLabel.includes('boost')) {
          handleKeyPress(' ', true);
        }
      }
    };

    const handleNativeTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const dpadButton = target.closest('[data-dpad-control]');
      
      if (dpadButton) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine which key to release based on the button
        const buttonElement = dpadButton as HTMLElement;
        const ariaLabel = buttonElement.getAttribute('aria-label') || '';
        
        if (ariaLabel.includes('forward')) {
          handleKeyRelease('w');
        } else if (ariaLabel.includes('backward')) {
          handleKeyRelease('s');
        } else if (ariaLabel.includes('left')) {
          handleKeyRelease('a');
        } else if (ariaLabel.includes('right')) {
          handleKeyRelease('d');
        } else if (ariaLabel.includes('boost')) {
          handleKeyRelease(' ', true);
        }
      }
    };

    // Add non-passive listeners to the document to catch our D-pad touches
    document.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    document.addEventListener('touchend', handleNativeTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleNativeTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleNativeTouchStart);
      document.removeEventListener('touchend', handleNativeTouchEnd);
      document.removeEventListener('touchcancel', handleNativeTouchEnd);
    };
  }, [handleKeyPress, handleKeyRelease]);

  // Only show on mobile/touch devices - after all hooks
  if (!isMobile && !hasTouch) {
    console.log('📱 MobileNavigationControls: Not mobile/touch device, hiding controls');
    return null;
  }

  // Don't render if any blocking UI is open - after all hooks
  if (!shouldShowControls) {
    console.log('📱 MobileNavigationControls: Blocking UI open, hiding controls', {
      isChatOpen,
      mobileCosmosChatOpen,
      isSeedEntityPanelOpen,
      isEntityModalOpen,
      isNavigationPanelOpen,
      shouldShowControls
    });
    return null;
  }

  console.log('📱 MobileNavigationControls: Rendering controls', {
    isMobile,
    hasTouch,
    shouldShowControls,
    isExpanded,
    isInteracting
  });

  return (
    <>
      {/* D-Pad Buttons - Moved left a little */}
      <div className={`fixed bottom-2 left-16 z-[9999] ${className} transition-all duration-300 ${
        isInteracting ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="relative w-32 h-32" data-dpad-control>
          {/* Center Circle (Shift) */}
          <button
            data-dpad-control
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg"
            aria-label="Shift (boost)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </button>
          {/* Up Arrow (W) */}
          <button
            data-dpad-control
            className="absolute top-1 left-1/2 transform -translate-x-1/2 w-10 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-t-lg flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg"
            aria-label="Move forward (W)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* Down Arrow (S) */}
          <button
            data-dpad-control
            className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-b-lg flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg"
            aria-label="Move backward (S)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Left Arrow (A) */}
          <button
            data-dpad-control
            className="absolute left-1 top-1/2 transform -translate-y-1/2 w-8 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-l-lg flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg"
            aria-label="Move left (A)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Right Arrow (D) */}
          <button
            data-dpad-control
            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-r-lg flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg"
            aria-label="Move right (D)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reset Button - Top of chat bubble */}
      <button
        onClick={handleReset}
        className="fixed bottom-20 left-4 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white/80 hover:bg-white/20 active:bg-white/30 transition-all duration-200 active:scale-95 shadow-lg z-[9999]"
        aria-label="Reset camera"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </>
  );
};

export default MobileNavigationControls;