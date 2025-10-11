'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useEngagementStore } from '../../stores/EngagementStore';

/**
 * Component that automatically tracks view changes for engagement context
 * Should be included in the main layout or app component
 */
export const ViewTracker: React.FC = () => {
  const pathname = usePathname();
  const { setCurrentView } = useEngagementStore();

  useEffect(() => {
    // Map pathname to view type
    let view: 'chat' | 'cards' | 'cosmos' | 'dashboard' = 'chat';
    
    console.log('🔍 ViewTracker - Current pathname:', pathname);
    
    if (pathname.includes('/cards')) {
      view = 'cards';
    } else if (pathname.includes('/cosmos')) {
      view = 'cosmos';
    } else if (pathname.includes('/dashboard')) {
      view = 'dashboard';
    } else if (pathname.includes('/chat') || pathname === '/') {
      view = 'chat';
    }
    
    // Track view change
    console.log('🔍 ViewTracker - Setting current view to:', view, 'from pathname:', pathname);
    setCurrentView(view);
  }, [pathname, setCurrentView]);

  return null; // This component doesn't render anything
};
