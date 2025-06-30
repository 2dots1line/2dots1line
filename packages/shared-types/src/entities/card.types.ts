/**
 * Types related to Cards (Presentation Layer)
 * Aligned with V9.7 schema.prisma Card model
 */

/**
 * Represents a card in the user interface
 * Aligns with the `cards` table in schema.prisma V9.7
 */
export interface TCard {
  /** Unique identifier for the card (UUID) */
  card_id: string;
  /** ID of the user who owns this card */
  user_id: string;
  /** Type of card (e.g., 'memory_unit', 'concept', 'derived_artifact') */
  card_type: string;
  /** ID of the source entity this card represents */
  source_entity_id: string;
  /** Type of the source entity ('MemoryUnit', 'Concept', 'DerivedArtifact', 'ProactivePrompt') */
  source_entity_type: string;
  /** Status of the card ('active_canvas', 'active_archive', 'completed') */
  status: string;
  /** Whether the card is favorited by the user */
  is_favorited: boolean;
  /** Display configuration and UI data (JSON object) */
  display_data?: Record<string, any> | null;
  /** Whether the card is synced with the backend */
  is_synced: boolean;
  /** Timestamp when the card was created */
  created_at: Date;
  /** Timestamp when the card was last updated */
  updated_at: Date;
}

/**
 * Card status options
 */
export enum CardStatus {
  ACTIVE_CANVAS = 'active_canvas',
  ACTIVE_ARCHIVE = 'active_archive',
  COMPLETED = 'completed'
}

/**
 * Card type options
 */
export enum CardType {
  MEMORY_UNIT = 'memory_unit',
  CONCEPT = 'concept',
  DERIVED_ARTIFACT = 'derived_artifact',
  PROACTIVE_PROMPT = 'proactive_prompt'
} 