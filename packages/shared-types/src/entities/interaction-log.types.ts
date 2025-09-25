/**
 * Types related to Interaction Logs (Unified User Interaction Tracking)
 * Aligned with V9.7 schema.prisma InteractionLog model
 * 
 * This replaces the deprecated annotation system in V9.7.
 */

/**
 * Represents a logged user interaction with the system
 * Aligns with the `interaction_logs` table in schema.prisma V9.7
 */
export interface TInteractionLog {
  /** Unique identifier for the interaction log (UUID) */
  entity_id: string;
  /** ID of the user who performed the interaction */
  user_id: string;
  /** Timestamp when the interaction occurred */
  created_at: Date;
  /** Type of interaction (e.g., 'annotation', 'highlight', 'reflection') */
  type: string;
  /** ID of the target entity (optional) */
  target_entity_id?: string | null;
  /** Type of the target entity (optional) */
  target_entity_type?: string | null;
  /** Text content of the interaction (optional) */
  content?: string | null;
  /** Structured content data (JSON object, optional) */
  content_structured?: Record<string, unknown> | null;
  /** Additional metadata (JSON object, optional) */
  metadata?: Record<string, unknown> | null;
}

/**
 * Common interaction types
 */
export enum InteractionType {
  ANNOTATION = 'annotation',
  HIGHLIGHT = 'highlight',
  REFLECTION = 'reflection',
  NOTE = 'note',
  QUESTION = 'question',
  CORRECTION = 'correction',
  FAVORITE = 'favorite',
  ARCHIVE = 'archive',
  SHARE = 'share',
  EDIT = 'edit'
}

/**
 * Common target entity types for interactions
 */
export enum InteractionTargetType {
  MEMORY_UNIT = 'MemoryUnit',
  CONCEPT = 'Concept',
  CARD = 'Card',
  CONVERSATION = 'Conversation',
  DERIVED_ARTIFACT = 'DerivedArtifact',
  PROACTIVE_PROMPT = 'ProactivePrompt'
} 