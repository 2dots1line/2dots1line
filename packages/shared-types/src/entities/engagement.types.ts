/**
 * Engagement tracking types for user interaction context
 */

export interface EngagementEvent {
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'navigation';
  target: string;
  targetType: 'entity' | 'card' | 'button' | 'modal' | 'view';
  view: 'chat' | 'cards' | 'cosmos' | 'dashboard';
  timestamp: string; // ISO string for serialization
  metadata?: Record<string, any>;
}

export interface EngagementContext {
  recentEvents: EngagementEvent[];
  sessionDuration?: number; // milliseconds
  currentViewDuration?: number; // milliseconds
  interactionSummary?: {
    totalClicks: number;
    uniqueTargets: number;
    viewSwitches: number;
  };
  enrichedEntities?: {
    entityId: string;
    title: string;
    content: string;
    type: string;
    engagementDuration: number; // milliseconds
  }[];
}
