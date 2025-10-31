'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';
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

// MOBILE_HUD_BUTTONS will be created inside component to access translations

export const MobileHUDContainer: React.FC<MobileHUDContainerProps> = ({
  onViewSelect,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingView, setPendingView] = useState<ViewType | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUserStore();
  const { t } = useTranslation(user?.language_preference);
  
  // Create mobile HUD buttons with translations
  const MOBILE_HUD_BUTTONS: Array<{ id: ViewType; label: string; icon: React.ComponentType<any> }> = [
    { id: 'dashboard', label: t('hud.buttons.dashboard' as any), icon: BarChart3 },
    { id: 'chat', label: t('hud.buttons.chat' as any), icon: MessageCircle },
    { id: 'cards', label: t('hud.buttons.cards' as any), icon: CreditCard },
    { id: 'cosmos', label: t('hud.buttons.cosmos' as any), icon: Network },
    { id: 'settings', label: t('hud.buttons.settings' as any), icon: Settings },
  ];
  
  const {
    activeView,
    showSettings,
    isNavigatingFromCosmos: _isNavigatingFromCosmos,
    mobileHudVisible,
    mobileCardsChatOpen,
    mobileCosmosChatOpen,
    setActiveView,
    setIsNavigatingFromCosmos,
    toggleSettings,
    setMobileHudVisible,
    setMobileCardsChatOpen,
    setMobileCosmosChatOpen,
  } = useHUDStore();
  
  // Use store state for visibility instead of local state
  // Hide HUD when mobile chat is open
  const shouldShowHUD = mobileHudVisible && !mobileCardsChatOpen && !mobileCosmosChatOpen;
  
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
      setMobileHudVisible(false);
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

  // Handle mobile mini chat toggle for cosmos/cards
  const handleMobileChatToggle = (viewId: 'cosmos' | 'cards') => {
    if (viewId === 'cosmos') {
      setMobileCosmosChatOpen(!mobileCosmosChatOpen);
    } else if (viewId === 'cards') {
      setMobileCardsChatOpen(!mobileCardsChatOpen);
    }
    
    trackEvent({
      type: 'click',
      target: 'mobile_chat_toggle',
      targetType: 'button',
      view: currentView,
      metadata: {
        action: 'toggle_mobile_chat',
        view: viewId,
        isOpen: viewId === 'cosmos' ? !mobileCosmosChatOpen : !mobileCardsChatOpen
      }
    });
  };

  // Handle view button click
  const handleButtonClick = (viewId: ViewType | 'mini-chat') => {
    // Special handling for mini-chat button
    if (viewId === 'mini-chat') {
      if (activeView === 'cards') {
        handleMobileChatToggle('cards');
      } else if (activeView === 'cosmos' || pathname === '/cosmos') {
        handleMobileChatToggle('cosmos');
      }
      trackEvent({
        type: 'click',
        target: 'mini_chat',
        targetType: 'button',
        view: currentView,
        metadata: {
          action: 'toggle_mobile_chat',
          view: activeView
        }
      });
      return;
    }

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
      if (pathname === '/cosmos') {
        // We're already on cosmos page, toggle mobile mini chat
        handleMobileChatToggle('cosmos');
      } else {
        // Navigate to cosmos page
        router.push('/cosmos');
      }
    } else if (viewId === 'cards') {
      // If we're on main page and cards is already active, toggle mini chat
      const isAlreadyCardsOnMain = pathname === '/' && activeView === 'cards';
      setActiveView(viewId);
      onViewSelect?.(viewId);
      if (isAlreadyCardsOnMain) {
        handleMobileChatToggle('cards');
      }
    } else if (viewId === 'chat') {
      // For chat view, set active view (full screen chat)
      setActiveView(viewId);
      onViewSelect?.(viewId);
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
      
      <div
        ref={hudRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          shouldShowHUD ? 'translate-y-0' : 'translate-y-full'
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
          
          {/* Mini Chat button - only show when on cards or cosmos view */}
          {(activeView === 'cards' || activeView === 'cosmos' || pathname === '/cosmos') && (
            <button
              onClick={() => handleButtonClick('mini-chat')}
              className="w-12 h-12 rounded-full flex items-center justify-center
                         text-white/80 hover:text-white hover:bg-white/20
                         transition-all duration-200"
              title={t('hud.openMiniChat' as any)}
            >
              <MessageCircle 
                size={20} 
                className="stroke-current opacity-90" 
                strokeWidth={1.5}
              />
            </button>
          )}
          
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
