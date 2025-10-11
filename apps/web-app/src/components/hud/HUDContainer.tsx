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
import React, { useState, useEffect } from 'react';

import { useHUDStore, ViewType } from '../../stores/HUDStore';
import { useCardStore } from '../../stores/CardStore';
import { useUserStore } from '../../stores/UserStore';
import { useEngagementStore } from '../../stores/EngagementStore';

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
    isNavigatingFromCosmos,
    toggleHUD,
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
    // Track navigation click
    trackEvent({
      type: 'click',
      target: viewId,
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
            w-32 transition-all duration-300 ease-in-out
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
                <span className="font-medium">Navigation</span>
              </GlassButton>
            </div>
          )}

          {/* Navigation Buttons - All views are now equal peers */}
          {isExpanded && (
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
              <span className="font-medium">Log out</span>
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