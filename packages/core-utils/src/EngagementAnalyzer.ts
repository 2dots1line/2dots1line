import { EngagementEvent, EngagementContext } from '@2dots1line/shared-types';

/**
 * Utility class for analyzing user engagement patterns
 * Provides pattern detection for proactive agent suggestions
 */
export class EngagementAnalyzer {
  /**
   * Analyze cosmos exploration patterns
   */
  static analyzeCosmosExploration(events: EngagementEvent[]): {
    hasClickedMultipleEntities: boolean;
    entityIds: string[];
    explorationPattern: 'focused' | 'scattered' | 'systematic';
    shouldSuggestWalkthrough: boolean;
    timeSpent: number;
  } {
    const cosmosEvents = events.filter(e => e.view === 'cosmos');
    const entityClicks = cosmosEvents.filter(e => e.type === 'click' && e.targetType === 'entity');
    const entityIds = entityClicks.map(e => e.target);
    
    // Calculate time spent in cosmos
    const cosmosTimeEvents = cosmosEvents.filter(e => e.type === 'navigation' || e.type === 'click');
    const timeSpent = cosmosTimeEvents.length > 0 ? 
      new Date(cosmosTimeEvents[cosmosTimeEvents.length - 1].timestamp).getTime() - 
      new Date(cosmosTimeEvents[0].timestamp).getTime() : 0;
    
    // Determine exploration pattern
    const uniqueEntities = new Set(entityIds).size;
    const totalClicks = entityClicks.length;
    
    let explorationPattern: 'focused' | 'scattered' | 'systematic';
    if (totalClicks <= 2) {
      explorationPattern = 'focused';
    } else if (uniqueEntities / totalClicks < 0.7) {
      explorationPattern = 'scattered';
    } else {
      explorationPattern = 'systematic';
    }
    
    return {
      hasClickedMultipleEntities: entityIds.length >= 3,
      entityIds,
      explorationPattern,
      shouldSuggestWalkthrough: entityIds.length >= 2 && timeSpent > 10000, // 10+ seconds
      timeSpent
    };
  }

  /**
   * Detect if user needs guided walkthrough
   */
  static shouldSuggestGuidedWalkthrough(events: EngagementEvent[]): {
    shouldSuggest: boolean;
    reason: string;
    suggestedTourType: 'cosmos_exploration' | 'cross_view_journey' | 'entity_connections' | null;
  } {
    const cosmosAnalysis = this.analyzeCosmosExploration(events);
    const viewSwitches = events.filter(e => e.type === 'navigation').length;
    const enrichedEntities = events.filter(e => e.metadata?.enrichedEntity).length;
    
    if (cosmosAnalysis.shouldSuggestWalkthrough) {
      return {
        shouldSuggest: true,
        reason: `User has explored ${cosmosAnalysis.entityIds.length} entities in cosmos`,
        suggestedTourType: 'cosmos_exploration'
      };
    }
    
    if (viewSwitches >= 3) {
      return {
        shouldSuggest: true,
        reason: 'User has switched views multiple times, may need guidance',
        suggestedTourType: 'cross_view_journey'
      };
    }
    
    if (enrichedEntities >= 2) {
      return {
        shouldSuggest: true,
        reason: 'User has engaged deeply with multiple entities',
        suggestedTourType: 'entity_connections'
      };
    }
    
    return {
      shouldSuggest: false,
      reason: 'No clear pattern suggesting need for guidance',
      suggestedTourType: null
    };
  }

  /**
   * Detect exploration pattern type
   */
  static detectExplorationPattern(events: EngagementEvent[]): {
    pattern: 'deep_dive' | 'broad_exploration' | 'casual_browsing' | 'focused_search';
    confidence: number;
    characteristics: string[];
  } {
    const clicks = events.filter(e => e.type === 'click');
    const uniqueTargets = new Set(events.map(e => e.target)).size;
    const viewSwitches = events.filter(e => e.type === 'navigation').length;
    const enrichedEntities = events.filter(e => e.metadata?.enrichedEntity).length;
    
    const characteristics: string[] = [];
    let pattern: 'deep_dive' | 'broad_exploration' | 'casual_browsing' | 'focused_search';
    let confidence = 0;
    
    // Deep dive: few targets, many interactions, enriched entities
    if (uniqueTargets <= 3 && clicks.length >= 5 && enrichedEntities >= 1) {
      pattern = 'deep_dive';
      confidence = 0.8;
      characteristics.push('Focused on few entities', 'High interaction density', 'Deep engagement');
    }
    // Broad exploration: many targets, moderate interactions
    else if (uniqueTargets >= 5 && clicks.length >= 3) {
      pattern = 'broad_exploration';
      confidence = 0.7;
      characteristics.push('Many different targets', 'Moderate interaction level');
    }
    // Focused search: specific target type, systematic clicks
    else if (events.filter(e => e.targetType === 'entity').length >= 3) {
      pattern = 'focused_search';
      confidence = 0.6;
      characteristics.push('Systematic entity exploration');
    }
    // Casual browsing: low interaction, scattered
    else {
      pattern = 'casual_browsing';
      confidence = 0.5;
      characteristics.push('Low interaction level', 'Scattered engagement');
    }
    
    if (viewSwitches >= 2) {
      characteristics.push('Cross-view navigation');
    }
    
    return { pattern, confidence, characteristics };
  }

  /**
   * Get feature suggestions based on engagement patterns
   */
  static getFeatureSuggestions(engagementContext: EngagementContext): {
    suggestions: Array<{
      feature: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
      action?: {
        type: 'open_card' | 'focus_entity' | 'start_guided_tour' | 'switch_view';
        payload: Record<string, any>;
      };
    }>;
  } {
    const suggestions: Array<{
      feature: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
      action?: {
        type: 'open_card' | 'focus_entity' | 'start_guided_tour' | 'switch_view';
        payload: Record<string, any>;
      };
    }> = [];
    
    const events = engagementContext.recentEvents || [];
    const walkthroughAnalysis = this.shouldSuggestGuidedWalkthrough(events);
    const explorationPattern = this.detectExplorationPattern(events);
    
    // Suggest guided walkthrough
    if (walkthroughAnalysis.shouldSuggest) {
      suggestions.push({
        feature: 'guided_walkthrough',
        reason: walkthroughAnalysis.reason,
        priority: 'high',
        action: {
          type: 'start_guided_tour',
          payload: {
            tour_type: walkthroughAnalysis.suggestedTourType,
            reason: walkthroughAnalysis.reason
          }
        }
      });
    }
    
    // Suggest card view for entity exploration
    const entityClicks = events.filter(e => e.targetType === 'entity' && e.view === 'cosmos');
    if (entityClicks.length >= 2) {
      suggestions.push({
        feature: 'card_view_exploration',
        reason: 'User has explored multiple entities - cards view might be helpful',
        priority: 'medium',
        action: {
          type: 'switch_view',
          payload: {
            target_view: 'cards',
            context: 'entity_exploration'
          }
        }
      });
    }
    
    // Suggest cosmos view for card exploration
    const cardClicks = events.filter(e => e.targetType === 'card' && e.view === 'cards');
    if (cardClicks.length >= 2) {
      suggestions.push({
        feature: 'cosmos_visualization',
        reason: 'User has explored multiple cards - cosmos view might show connections',
        priority: 'medium',
        action: {
          type: 'switch_view',
          payload: {
            target_view: 'cosmos',
            context: 'card_visualization'
          }
        }
      });
    }
    
    // Suggest entity focus for enriched entities
    if (engagementContext.enrichedEntities && engagementContext.enrichedEntities.length > 0) {
      const mostEngaged = engagementContext.enrichedEntities.reduce((prev, current) => 
        (current.engagementDuration > prev.engagementDuration) ? current : prev
      );
      
      suggestions.push({
        feature: 'entity_focus',
        reason: `User spent significant time with "${mostEngaged.title}"`,
        priority: 'low',
        action: {
          type: 'focus_entity',
          payload: {
            entity_id: mostEngaged.entityId,
            view: 'cosmos',
            reason: 'prolonged_engagement'
          }
        }
      });
    }
    
    return { suggestions };
  }

  /**
   * Analyze cross-view journey patterns
   */
  static analyzeCrossViewJourney(events: EngagementEvent[]): {
    hasCrossViewPattern: boolean;
    journey: Array<{ view: string; timestamp: string; action: string }>;
    suggestedConnections: string[];
  } {
    const navigationEvents = events.filter(e => e.type === 'navigation');
    const journey = navigationEvents.map(e => ({
      view: e.target,
      timestamp: e.timestamp,
      action: 'navigation'
    }));
    
    // Add significant clicks to journey
    const significantClicks = events.filter(e => 
      e.type === 'click' && 
      (e.targetType === 'entity' || e.targetType === 'card')
    );
    
    significantClicks.forEach(click => {
      journey.push({
        view: click.view,
        timestamp: click.timestamp,
        action: `clicked_${click.targetType}`
      });
    });
    
    // Sort by timestamp
    journey.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const hasCrossViewPattern = new Set(journey.map(j => j.view)).size > 1;
    
    // Suggest connections based on journey
    const suggestedConnections: string[] = [];
    if (hasCrossViewPattern) {
      const views = new Set(journey.map(j => j.view));
      if (views.has('cards') && views.has('cosmos')) {
        suggestedConnections.push('Explore card relationships in 3D cosmos view');
      }
      if (views.has('cosmos') && views.has('chat')) {
        suggestedConnections.push('Discuss cosmos exploration in chat');
      }
    }
    
    return {
      hasCrossViewPattern,
      journey,
      suggestedConnections
    };
  }
}
