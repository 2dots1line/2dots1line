/**
 * Types related to Growth Events (6D Growth Tracking)
 * Aligned with V9.7 schema.prisma GrowthEvent model
 */

/**
 * Represents a growth event in the 6D growth methodology
 * Aligns with the `growth_events` table in schema.prisma V9.7
 */
export interface TGrowthEvent {
  /** Unique identifier for the growth event (UUID) */
  event_id: string;
  /** ID of the user this growth event belongs to */
  user_id: string;
  /** ID of the entity that triggered this growth event */
  entity_id: string;
  /** Type of entity that triggered this growth event */
  entity_type: string;
  /** The dimension key (one of the 6D dimensions) */
  dim_key: string;
  /** The growth delta value (positive or negative) */
  delta: number;
  /** Source that generated this growth event */
  source: string;
  /** Timestamp when the growth event was created */
  created_at: Date;
  /** Additional details about the growth event (JSON object) */
  details?: Record<string, any> | null;
}

/**
 * 6D Growth Dimension Keys
 */
export enum GrowthDimension {
  SELF_AWARENESS = 'self_awareness',
  EMOTIONAL_INTELLIGENCE = 'emotional_intelligence',
  RELATIONSHIPS = 'relationships',
  PURPOSE = 'purpose',
  RESILIENCE = 'resilience',
  GROWTH_MINDSET = 'growth_mindset'
}

/**
 * Growth event source types
 */
export enum GrowthEventSource {
  INGESTION_ANALYST = 'IngestionAnalyst',
  INSIGHT_ENGINE = 'InsightEngine',
  DIALOGUE_AGENT = 'DialogueAgent',
  USER_REFLECTION = 'UserReflection'
} 