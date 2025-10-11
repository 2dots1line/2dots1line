import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EngagementEvent, EngagementContext } from '@2dots1line/shared-types';

// Internal store event with ID for tracking
interface InternalEngagementEvent extends EngagementEvent {
  id: string;
}

interface EngagementState {
  events: InternalEngagementEvent[];
  sessionStartTime: number; // Store as timestamp for persistence
  currentView: 'chat' | 'cards' | 'cosmos' | 'dashboard';
  viewStartTime: number; // Store as timestamp for persistence
  
  // Actions
  trackEvent: (event: Omit<EngagementEvent, 'timestamp'>) => void;
  setCurrentView: (view: string) => void;
  getRecentEvents: (timeWindowMs?: number, filterView?: string) => EngagementEvent[];
  getSessionDuration: () => number;
  getCurrentViewDuration: () => number;
  clearOldEvents: () => void;
  getEngagementContext: (timeWindowMs?: number) => {
    recentEvents: EngagementEvent[];
    sessionDuration: number;
    currentViewDuration: number;
    interactionSummary: {
      totalClicks: number;
      uniqueTargets: number;
      viewSwitches: number;
    };
  };
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      sessionStartTime: Date.now(),
      currentView: 'chat',
      viewStartTime: Date.now(),
      
      // Actions
      trackEvent: (event) => {
        const newEvent: InternalEngagementEvent = {
          ...event,
          id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        };
        
        console.log('🔍 EngagementStore - Tracking event:', newEvent);
        
        set((state) => ({
          events: [...state.events, newEvent].slice(-150) // Keep last 150 events
        }));
        
        // Auto-cleanup old events (older than 5 minutes)
        get().clearOldEvents();
      },
      
      setCurrentView: (view) => {
        const currentState = get();
        const now = Date.now();
        
        // Track view switch as an event
        if (view !== currentState.currentView) {
          currentState.trackEvent({
            type: 'navigation',
            target: view,
            targetType: 'view',
            view: currentState.currentView,
            metadata: { 
              fromView: currentState.currentView,
              toView: view,
              timeInPreviousView: now - currentState.viewStartTime
            }
          });
        }
        
        set({
          currentView: view as 'chat' | 'cards' | 'cosmos' | 'dashboard',
          viewStartTime: now
        });
      },
      
      getRecentEvents: (timeWindowMs = 30000, filterView?: string) => {
        const state = get();
        const cutoffTime = new Date(Date.now() - timeWindowMs).toISOString();
        
        let filteredEvents = state.events.filter(event => 
          event.timestamp >= cutoffTime
        );
        
        if (filterView) {
          filteredEvents = filteredEvents.filter(event => event.view === filterView);
        }
        
        // Return events without internal ID for external consumption
        return filteredEvents.map(({ id, ...event }) => event);
      },
      
      getSessionDuration: () => {
        const state = get();
        return Date.now() - state.sessionStartTime;
      },
      
      getCurrentViewDuration: () => {
        const state = get();
        return Date.now() - state.viewStartTime;
      },
      
      clearOldEvents: () => {
        const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
        
        set((state) => ({
          events: state.events.filter(event => event.timestamp >= cutoffTime)
        }));
      },
      
      getEngagementContext: (timeWindowMs = 30000) => {
        const state = get();
        const recentEvents = state.getRecentEvents(timeWindowMs);
        const sessionDuration = state.getSessionDuration();
        const currentViewDuration = state.getCurrentViewDuration();
        
        // Calculate interaction summary
        const clicks = recentEvents.filter(e => e.type === 'click');
        const uniqueTargets = new Set(recentEvents.map(e => e.target)).size;
        const viewSwitches = recentEvents.filter(e => e.type === 'navigation').length;
        
        return {
          recentEvents,
          sessionDuration,
          currentViewDuration,
          interactionSummary: {
            totalClicks: clicks.length,
            uniqueTargets,
            viewSwitches
          }
        };
      }
    }),
    {
      name: 'engagement-storage',
      // Only persist essential state, not transient events
      partialize: (state) => ({
        sessionStartTime: state.sessionStartTime,
        currentView: state.currentView,
        viewStartTime: state.viewStartTime
      })
    }
  )
);
