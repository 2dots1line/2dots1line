'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  BarChart3, 
  MessageCircle, 
  CreditCard, 
  Network, 
  Settings,
  LogOut
} from 'lucide-react';

import { useHUDStore, ViewType } from '../../stores/HUDStore';
import { useUserStore } from '../../stores/UserStore';
import { useEngagementStore } from '../../stores/EngagementStore';

interface MobileHUDContainerProps {
  onViewSelect?: (view: ViewType) => void;
  className?: string;
}

const MOBILE_HUD_BUTTONS: Array<{ id: ViewType; label: string; icon: React.ComponentType<any> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'cosmos', label: 'Cosmos', icon: Network },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileHUDContainer: React.FC<MobileHUDContainerProps> = ({
  onViewSelect,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingView, setPendingView] = useState<ViewType | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  
  const {
    activeView,
    showSettings,
    isNavigatingFromCosmos,
    mobileHudVisible,
    setActiveView,
    setIsNavigatingFromCosmos,
    toggleSettings,
    setMobileHudVisible,
  } = useHUDStore();
  
  // Use store state for visibility instead of local state
  const isVisible = mobileHudVisible;
  
  const { logout } = useUserStore();
  const { trackEvent, currentView } = useEngagementStore();

  // Touch detection for top/bottom 10% of screen
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      
      const touch = e.touches[0];
      const screenHeight = window.innerHeight;
      const touchY = touch.clientY;
      
      // Check if touch is in top 10% or bottom 10% of screen
      const isTopZone = touchY <= screenHeight * 0.1;
      const isBottomZone = touchY >= screenHeight * 0.9;
      
      if (isTopZone || isBottomZone) {
        showHUD();
      }
    };

    const handleTouchMove = () => {
      // Reset timer on any touch movement
      resetAutoHideTimer();
    };

    const handleTouchEnd = () => {
      // Reset timer on touch end
      resetAutoHideTimer();
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Auto-hide timer management
  const resetAutoHideTimer = () => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // 3 seconds
    
    setAutoHideTimer(timer);
  };

  const showHUD = () => {
    setMobileHudVisible(true);
    resetAutoHideTimer();
  };

  const hideHUD = () => {
    setMobileHudVisible(false);
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
  };

  // Handle logout with proper navigation
  const handleLogout = () => {
    logout();
    setActiveView(null);
    
    // If we're on the cosmos page, navigate back to main page
    if (pathname === '/cosmos') {
      router.push('/');
    }
  };

  // Handle view button click
  const handleButtonClick = (viewId: ViewType) => {
    // Special handling for Settings button - just toggle inline settings panel
    if (viewId === 'settings') {
      toggleSettings();
      trackEvent({
        type: 'click',
        target: 'settings',
        targetType: 'button',
        view: currentView,
        metadata: {
          action: 'toggle_settings'
        }
      });
      return;
    }

    // Track navigation click for other views
    trackEvent({
      type: 'click',
      target: viewId || 'unknown',
      targetType: 'button',
      view: currentView,
      metadata: {
        fromView: currentView,
        toView: viewId,
        action: 'navigation'
      }
    });

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
  }, [pathname, pendingView, setActiveView, onViewSelect, setIsNavigatingFromCosmos]);

  // Determine active view based on current route
  const getCurrentActiveView = (): ViewType => {
    if (pathname === '/cosmos') {
      return 'cosmos';
    }
    return activeView;
  };

  const currentActiveView = getCurrentActiveView();

  return (
    <>
      {/* Touch indicator when HUD is hidden */}
      {!isVisible && (
        <div className="fixed top-0 left-0 right-0 h-10 z-40 bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm flex items-center justify-center">
          <div className="text-white/60 text-xs">Tap top or bottom edge to show navigation</div>
        </div>
      )}
      
      <div
        ref={hudRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } ${className}`}
      >
        {/* Mobile HUD - Horizontal row with gradient background */}
        <div className="h-14 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm">
        <div className="flex justify-around items-center h-full px-4">
          {/* Navigation buttons */}
          {MOBILE_HUD_BUTTONS.map((button) => {
            const IconComponent = button.icon;
            const isActive = button.id === 'settings' 
              ? showSettings 
              : currentActiveView === button.id;
            
            return (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button.id)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-white/25 border border-white/40 text-white shadow-lg' 
                    : 'text-white/80 hover:text-white hover:bg-white/20'
                  }
                `}
              >
                <IconComponent 
                  size={20} 
                  className="stroke-current opacity-90" 
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-full flex items-center justify-center
                       text-white/80 hover:text-white hover:bg-white/20
                       transition-all duration-200"
          >
            <LogOut 
              size={20} 
              className="stroke-current opacity-90" 
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
