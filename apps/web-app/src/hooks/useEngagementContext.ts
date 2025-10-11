import { useCallback, useEffect, useRef } from 'react';
import { useEngagementStore } from '../stores/EngagementStore';
import { EngagementContext, EngagementEvent } from '@2dots1line/shared-types';

/**
 * Custom hook to extract relevant engagement context for DialogueAgent
 * Includes entity enrichment for prolonged engagement
 */
export const useEngagementContext = () => {
  const { getEngagementContext, getRecentEvents } = useEngagementStore();
  const entityEngagementTimers = useRef<Map<string, { startTime: number; timer: NodeJS.Timeout }>>(new Map());
  const enrichedEntities = useRef<Map<string, any>>(new Map());

  /**
   * Track entity engagement time and enrich with details for prolonged engagement
   */
  const trackEntityEngagement = useCallback((entityId: string, entityType: string) => {
    const now = Date.now();
    
    // Clear existing timer if any
    const existing = entityEngagementTimers.current.get(entityId);
    if (existing) {
      clearTimeout(existing.timer);
    }
    
    // Set timer to fetch entity details after 5 seconds of engagement
    const timer = setTimeout(async () => {
      try {
        // Fetch entity details using existing API endpoint
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/v1/nodes/${entityId}/details?entityType=${entityType}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            enrichedEntities.current.set(entityId, {
              entityId,
              title: data.data.title || data.data.name || 'Untitled',
              content: data.data.content || data.data.description || '',
              type: entityType,
              engagementDuration: Date.now() - now
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch entity details for engagement context:', error);
      }
    }, 5000); // 5 seconds
    
    entityEngagementTimers.current.set(entityId, { startTime: now, timer });
  }, []);

  /**
   * Stop tracking entity engagement
   */
  const stopEntityEngagement = useCallback((entityId: string) => {
    const existing = entityEngagementTimers.current.get(entityId);
    if (existing) {
      clearTimeout(existing.timer);
      entityEngagementTimers.current.delete(entityId);
    }
  }, []);

  /**
   * Get engagement context formatted for DialogueAgent
   */
  const getFormattedEngagementContext = useCallback((timeWindowMs: number = 30000): EngagementContext | null => {
    const context = getEngagementContext(timeWindowMs);
    
    // Events are already in serializable format
    const serializableEvents: EngagementEvent[] = context.recentEvents;
    
    // Include enriched entities
    const enrichedEntitiesArray = Array.from(enrichedEntities.current.values());
    
    // Only return context if there's meaningful data
    if (serializableEvents.length === 0 && enrichedEntitiesArray.length === 0) {
      return null;
    }
    
    return {
      recentEvents: serializableEvents,
      sessionDuration: context.sessionDuration || undefined,
      currentViewDuration: context.currentViewDuration || undefined,
      interactionSummary: context.interactionSummary || undefined,
      enrichedEntities: enrichedEntitiesArray.length > 0 ? enrichedEntitiesArray : undefined
    };
  }, [getEngagementContext]);

  /**
   * Analyze engagement patterns for proactive suggestions
   */
  const analyzeEngagementPatterns = useCallback((timeWindowMs: number = 30000) => {
    const recentEvents = getRecentEvents(timeWindowMs);
    
    const patterns = {
      cosmosExploration: {
        entityClicks: recentEvents.filter(e => e.view === 'cosmos' && e.type === 'click' && e.targetType === 'entity').length,
        hasMultipleEntityClicks: false,
        shouldSuggestWalkthrough: false
      },
      crossViewNavigation: {
        viewSwitches: recentEvents.filter(e => e.type === 'navigation').length,
        hasRapidSwitching: false
      },
      deepEngagement: {
        enrichedEntities: enrichedEntities.current.size,
        hasProlongedEngagement: false
      }
    };
    
    // Analyze patterns
    patterns.cosmosExploration.hasMultipleEntityClicks = patterns.cosmosExploration.entityClicks >= 3;
    patterns.cosmosExploration.shouldSuggestWalkthrough = patterns.cosmosExploration.entityClicks >= 2;
    patterns.crossViewNavigation.hasRapidSwitching = patterns.crossViewNavigation.viewSwitches >= 3;
    patterns.deepEngagement.hasProlongedEngagement = patterns.deepEngagement.enrichedEntities > 0;
    
    return patterns;
  }, [getRecentEvents]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      entityEngagementTimers.current.forEach(({ timer }) => clearTimeout(timer));
      entityEngagementTimers.current.clear();
    };
  }, []);

  return {
    getFormattedEngagementContext,
    analyzeEngagementPatterns,
    trackEntityEngagement,
    stopEntityEngagement,
    enrichedEntities: enrichedEntities.current
  };
};
