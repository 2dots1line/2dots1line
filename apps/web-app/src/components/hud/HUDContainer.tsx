'use client';

import { GlassmorphicPanel, GlassButton, MinimizeToggle } from '@2dots1line/ui-components';
import { 
  BarChart3, 
  MessageCircle, 
  CreditCard, 
  Network, 
  Settings,
  LogOut
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@2dots1line/core-utils/i18n/useTranslation';

import { useHUDStore, ViewType } from '../../stores/HUDStore';
import { useUserStore } from '../../stores/UserStore';
import { useEngagementStore } from '../../stores/EngagementStore';
import { ContextualSettings } from '../settings/ContextualSettings';

interface HUDContainerProps {
  onViewSelect?: (view: ViewType) => void;
  className?: string;
}

// HUD_BUTTONS will be created inside component to access translations

export const HUDContainer: React.FC<HUDContainerProps> = ({
  onViewSelect,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingView, setPendingView] = useState<ViewType | null>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUserStore();
  const { t } = useTranslation(user?.language_preference);
  
  // Create HUD buttons with translations
  const HUD_BUTTONS: Array<{ id: ViewType; label: string; icon: React.ComponentType<any> }> = [
    { id: 'dashboard', label: t('hud.buttons.dashboard' as any), icon: BarChart3 },
    { id: 'chat', label: t('hud.buttons.chat' as any), icon: MessageCircle },
    { id: 'cards', label: t('hud.buttons.cards' as any), icon: CreditCard },
    { id: 'cosmos', label: t('hud.buttons.cosmos' as any), icon: Network },
    { id: 'settings', label: t('hud.buttons.settings' as any), icon: Settings },
  ];
  
  const {
    isExpanded,
    activeView,
    showSettings,
    isNavigatingFromCosmos: _isNavigatingFromCosmos,
    toggleHUD,
    toggleSettings,
    minimizeHUD,
    expandHUD,
    setActiveView,
    setIsNavigatingFromCosmos,
  } = useHUDStore();
  
  const { logout } = useUserStore();
  const { trackEvent, currentView } = useEngagementStore();

  // Handle logout with proper navigation
  const handleLogout = () => {
    logout();
    setActiveView(null);
    
    // If we're on the cosmos page, navigate back to main page
    if (pathname === '/cosmos') {
      router.push('/');
    }
  };

  // Drag functionality removed - using minimize toggle instead






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
  }, [pathname, pendingView, setActiveView, onViewSelect, setIsNavigatingFromCosmos]);

  // Handlers for hover-based auto-open/close
  const handleMouseEnter = () => {
    expandHUD();
  };

  const handleMouseLeave = () => {
    minimizeHUD();
  };

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out ${className}`}
    >
      {/* Main HUD Panel - This slides in/out */}
      <div 
        className="relative transition-transform duration-300 ease-in-out"
        style={{
          // Only slide the panel itself, leaving room for the toggle
          transform: isExpanded ? 'translateX(0)' : 'translateX(128px)', // Slide panel out completely
        }}
      >
        <GlassmorphicPanel
          variant="glass-panel"
          rounded="xl"
          padding="sm"
          className={`
            ${showSettings ? 'w-72' : 'w-32'} transition-all duration-300 ease-in-out
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          {/* Drag handle removed - using minimize toggle instead */}

          {/* Minimized Navigation Button - Shows when collapsed */}
          {!isExpanded && (
            <div className="mb-2">
              <GlassButton
                onClick={toggleHUD}
                className="w-full justify-start text-left transition-all duration-200 text-white/80 hover:text-white hover:bg-white/20"
              >
                <Network 
                  size={18} 
                  className="mr-3 stroke-current opacity-90" 
                  strokeWidth={1.5}
                />
                <span className="font-medium">{t('hud.navigation' as any)}</span>
              </GlassButton>
            </div>
          )}

          {/* Navigation Buttons */}
          {isExpanded && (
            <div className="space-y-2">
              {HUD_BUTTONS.map((button: { id: ViewType; label: string; icon: React.ComponentType<any> }) => {
                const IconComponent = button.icon;
                const isActive = button.id === 'settings' ? showSettings : currentActiveView === button.id;
                return (
                  <GlassButton
                    key={button.id}
                    onClick={() => handleButtonClick(button.id)}
                    className={`
                      w-full justify-start text-left transition-all duration-200
                      ${isActive 
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
          )}
          
          {/* NEW: Inline contextual settings when showSettings is true */}
          {isExpanded && showSettings && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <ContextualSettings />
            </div>
          )}
          
          {/* Logout Button - Separated at bottom - Only show when expanded */}
          {isExpanded && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <GlassButton
              onClick={handleLogout}
              className="w-full justify-start text-left transition-all duration-200 text-white/80 hover:text-white hover:bg-white/20"
            >
              <LogOut 
                size={18} 
                className="mr-3 stroke-current opacity-90" 
                strokeWidth={1.5}
              />
              <span className="font-medium">{t('common.auth.logout')}</span>
            </GlassButton>
          </div>
          )}
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