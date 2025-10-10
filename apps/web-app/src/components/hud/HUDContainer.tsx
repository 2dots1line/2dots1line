'use client';

import { GlassmorphicPanel, GlassButton, DragHandle, MinimizeToggle } from '@2dots1line/ui-components';
import { 
  BarChart3, 
  MessageCircle, 
  CreditCard, 
  Network, 
  Settings
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useHUDStore, ViewType } from '../../stores/HUDStore';
import { useCardStore } from '../../stores/CardStore';

interface HUDContainerProps {
  onViewSelect?: (view: ViewType) => void;
  className?: string;
}

const HUD_BUTTONS: Array<{ id: ViewType; label: string; icon: React.ComponentType<any> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'cosmos', label: 'Cosmos', icon: Network },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const HUDContainer: React.FC<HUDContainerProps> = ({
  onViewSelect,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingView, setPendingView] = useState<ViewType | null>(null);
  
  const {
    isExpanded,
    activeView,
    isDragging,
    position,
    isNavigatingFromCosmos,
    toggleHUD,
    setActiveView,
    setIsDragging,
    updatePosition,
    setIsNavigatingFromCosmos,
  } = useHUDStore();

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const hudRef = useRef<HTMLDivElement>(null);


  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!hudRef.current) return;
    
    const rect = hudRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    
    // Prevent text selection during drag
    e.preventDefault();
  }, [setIsDragging]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y));
    
    updatePosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, updatePosition]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle view button click
  const handleButtonClick = (viewId: ViewType) => {
    if (viewId === 'cosmos') {
      // Navigate to cosmos page
      router.push('/cosmos');
    } else {
      // For other views, navigate back to main page and set the active view
      if (pathname === '/cosmos') {
        // We're on cosmos page, navigate back to main page
        setPendingView(viewId);
        setIsNavigatingFromCosmos(true);
        router.push('/');
      } else {
        // We're on main page, just set the active view
        // Card loading is now managed by CardStore internally
        
        setActiveView(viewId);
        onViewSelect?.(viewId);
      }
    }
  };

  // Handle pending view when returning to main page
  useEffect(() => {
    if (pathname === '/' && pendingView) {
      setActiveView(pendingView);
      onViewSelect?.(pendingView);
      setPendingView(null);
      setIsNavigatingFromCosmos(false);
    }
  }, [pathname, pendingView, setActiveView, onViewSelect]);

  // Cleanup on unmount - CardStore manages its own lifecycle

  // Determine active view based on current route
  const getCurrentActiveView = (): ViewType => {
    if (pathname === '/cosmos') {
      return 'cosmos';
    }
    return activeView;
  };

  const currentActiveView = getCurrentActiveView();


  return (
    <div
      ref={hudRef}
      className={`fixed z-50 transition-all duration-300 ease-in-out ${className}`}
      style={{
        right: `${position.x}px`,
        top: `${position.y}px`,
        // Fixed positioning: Only slide the main panel, not the entire container
        transform: 'translateX(0)', // Container stays in place
      }}
    >
      {/* Main HUD Panel - This slides in/out */}
      <div 
        className="relative transition-transform duration-300 ease-in-out"
        style={{
          // Only slide the panel itself, leaving room for the toggle
          transform: isExpanded ? 'translateX(0)' : 'translateX(240px)', // Slide panel out completely
        }}
      >
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="sm"
          className={`
            w-64 transition-all duration-300 ease-in-out
            ${isDragging ? 'scale-105 shadow-2xl' : 'scale-100'}
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {/* Drag Handle */}
          <DragHandle
            onMouseDown={handleMouseDown}
            className="mb-3 cursor-move"
          >
            <div className="flex items-center justify-center py-2">
              <span className="text-xs text-white/70 font-medium">Navigation HUD</span>
            </div>
          </DragHandle>

          {/* Navigation Buttons - All views are now equal peers */}
          <div className="space-y-2">
            {HUD_BUTTONS.map((button) => {
              const IconComponent = button.icon;
              return (
                <GlassButton
                  key={button.id}
                  onClick={() => handleButtonClick(button.id)}
                  className={`
                    w-full justify-start text-left transition-all duration-200
                    ${currentActiveView === button.id 
                      ? 'bg-white/25 border-white/40 text-white shadow-lg' 
                      : 'text-white/80 hover:text-white'
                    }
                  `}
                >
                  <IconComponent 
                    size={18} 
                    className="mr-3 stroke-current opacity-90" 
                    strokeWidth={1.5}
                  />
                  <span className="font-medium">{button.label}</span>
                </GlassButton>
              );
            })}
          </div>
        </GlassmorphicPanel>
      </div>

      {/* Minimize Toggle - Always stays in place and visible */}
      <MinimizeToggle
        isExpanded={isExpanded}
        onToggle={toggleHUD}
        className="absolute top-0 right-0 z-50" // Positioned relative to container, stays put
      />

      {/* Chat Toggle removed - mini chat now always visible by default */}
    </div>
  );
}; 