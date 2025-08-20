/**
 * Types related to Memory Units and Raw Content.
 */

/**
 * Represents a distinct piece of user memory or input (e.g., journal, conversation, document).
 * Aligns with the `memory_units` table in schema.prisma.
 */
export interface TMemoryUnit {
  /** Unique identifier for the memory unit (UUID) */
  muid: string;
  /** ID of the user who authored this memory unit */
  user_id: string;
  /** User-provided or AI-generated title for the memory unit */
  title: string;
  /** The core text content of the memory unit */
  content: string;
  /** Timestamp of original content creation by the user */
  creation_ts: Date;
  /** Timestamp when the memory unit was ingested into the system */
  ingestion_ts: Date;
  /** Timestamp when this record or its content was last updated */
  last_modified_ts: Date;
  /** AI-assigned score (0.0-1.0) indicating significance */
  importance_score: number | null;
  /** AI-assigned sentiment score for the content */
  sentiment_score: number | null;
  /** If sourced from a conversation, the ID of that conversation */
  source_conversation_id: string | null;
}

/**
 * Represents a user's knowledge item stored in Weaviate for semantic search.
 * Used by WeaviateService for vector operations.
 */
export interface UserKnowledgeItem {
  /** Unique identifier for this knowledge item in Weaviate */
  id: string;
  /** External identifier (e.g., muid for MemoryUnit, concept_id for Concept) */
  externalId: string;
  /** ID of the user who owns this knowledge item */
  userId: string;
  /** Type of the source entity ('MemoryUnit', 'Concept', etc.) */
  sourceEntityType: string;
  /** ID of the source entity */
  sourceEntityId: string;
  /** Main text content for semantic search */
  textContent: string;
  /** Title or summary of the knowledge item */
  title: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Vector embedding (populated by Weaviate) */
  vector?: number[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents the original unprocessed content associated with a Memory Unit.
 * Aligns with the `raw_content` table in schema.prisma.
 */
export interface TRawContent {
  /** Unique identifier for the raw content (UUID) */
  content_id: string;
  /** ID of the parent Memory Unit this raw content belongs to */
  muid: string;
  /** ID of the user who owns this raw content (denormalized) */
  user_id: string;
  /** Type of content (e.g., 'journal_text', 'chat_message') */
  content_type: ERawContentType;
  /** The original raw content (can be large, consider streaming for very large content) */
  content: string;
  /** For conversational content, indicates the sender ('user' or 'assistant') */
  sender_type?: 'user' | 'assistant' | null;
  /** For ordered content (like conversation messages), indicates the sequence */
  sequence_order?: number | null;
  /** Timestamp of original content creation */
  creation_ts: Date;
  /** Hash of the content to detect duplicates or changes */
  content_hash?: string | null;
  /** Additional content-specific metadata (JSON object) */
  metadata?: Record<string, unknown> | null;
}

/**
 * Enum for raw content types.
 */
export enum ERawContentType {
  JOURNAL_TEXT = 'journal_text',
  CHAT_MESSAGE_TEXT = 'chat_message_text',
  DOCUMENT_TEXT = 'document_text',
  EMAIL_BODY_TEXT = 'email_body_text',
  AUDIO_TRANSCRIPT = 'audio_transcript',
  WEB_PAGE_CONTENT = 'web_page_content',
  IMAGE_TEXT_OCR = 'image_text_ocr', // Text extracted from an image
  USER_NOTE = 'user_note',
  OTHER_TEXT = 'other_text'
} 