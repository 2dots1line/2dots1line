/**
 * Types related to Cards (Presentation Layer)
 * Aligned with V9.7 schema.prisma Card model
 */

/**
 * Represents a card in the user interface
 * Aligns with the enhanced `cards` table schema (V11.0+)
 * Cards now serve as user preference layer over source entities
 */
export interface TCard {
  /** Unique identifier for the card (UUID) */
  card_id: string;
  /** ID of the user who owns this card */
  user_id: string;
  /** Type of card (e.g., 'memory_unit', 'concept', 'derived_artifact') */
  type: string;
  /** ID of the source entity this card represents */
  source_entity_id: string;
  /** Type of the source entity ('MemoryUnit', 'Concept', 'DerivedArtifact', 'ProactivePrompt') */
  source_entity_type: string;
  /** Status of the card ('active_canvas', 'active_archive', 'completed') */
  status: string;
  /** Whether the card is favorited by the user */
  is_favorited: boolean;
  /** Whether the card is synced with the backend */
  is_synced: boolean;
  /** Timestamp when the card was created */
  created_at: Date;
  /** Timestamp when the card was last updated */
  updated_at: Date;
  /** Background image URL for the card */
  background_image_url?: string | null;
  
  // User preferences for card display and interaction
  /** User-controlled ordering for physical cards */
  display_order?: number | null;
  /** User selection for physical cards */
  is_selected: boolean;
  /** User can override entity title */
  custom_title?: string | null;
  /** User can override entity content */
  custom_content?: string | null;
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

/**
 * Extended card interface with display data loaded from source entity
 * Used by UI components for rendering cards with entity data
 */
export interface DisplayCard extends TCard {
  /** Display title (custom_title or entity title) */
  title: string;
  /** Display subtitle (derived from entity data) */
  subtitle?: string;
  /** Display content (custom_content or entity content) */
  content: string;
  /** Entity type for display purposes */
  entity_type: string;
  /** Entity ID for linking to details */
  entity_id: string;
}

/**
 * Image collection interface for card background selection
 * Used by UI components for organizing and selecting card backgrounds
 */
export interface ImageCollection {
  name: string;
  source: string;
  images: string[];
} 