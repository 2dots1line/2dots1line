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
  /** Origin of the memory (e.g., 'journal_entry', 'chat_conversation') */
  source_type: EMemorySourceType;
  /** User-provided or AI-generated title for the memory unit */
  title?: string | null;
  /** Timestamp of original content creation by the user */
  creation_ts: Date;
  /** Timestamp when the memory unit was ingested into the system */
  ingestion_ts: Date;
  /** Timestamp when this record or its content was last updated */
  last_modified_ts: Date;
  /** Current stage in the ingestion/analysis pipeline */
  processing_status: EMemoryProcessingStatus;
  /** AI-assigned score (0.0-1.0) indicating significance */
  importance_score?: number | null;
  /** User's privacy setting for this memory unit */
  is_private: boolean;
  /** Processing tier (1, 2, or 3) assigned based on content significance */
  tier: 1 | 2 | 3;
  /** Additional metadata (JSON object, e.g., location, device info) */
  metadata?: Record<string, any> | null;
}

/**
 * Enum for origin types of memory units.
 */
export enum EMemorySourceType {
  JOURNAL_ENTRY = 'journal_entry',
  CHAT_CONVERSATION = 'chat_conversation',
  IMPORTED_DOCUMENT = 'imported_document',
  FLEETING_THOUGHT = 'fleeting_thought',
  EMAIL = 'email',
  AUDIO_NOTE = 'audio_note',
  WEB_CLIP = 'web_clip',
  USER_REFLECTION = 'user_reflection',
  OTHER = 'other'
}

/**
 * Enum for processing status values for memory units.
 */
export enum EMemoryProcessingStatus {
  PENDING_UPLOAD = 'pending_upload', // Content is being uploaded
  UPLOADED = 'uploaded', // Content is stored, awaiting processing
  PENDING_PROCESSING = 'pending_processing', // Queued for IngestionAnalyst
  TIER1_PROCESSING = 'tier1_processing',
  TIER1_COMPLETE = 'tier1_complete',
  TIER2_PROCESSING = 'tier2_processing',
  TIER2_COMPLETE = 'tier2_complete',
  TIER3_PROCESSING = 'tier3_processing',
  TIER3_COMPLETE = 'tier3_complete', // Fully processed, enriched
  PROCESSING_ERROR = 'processing_error',
  ARCHIVED = 'archived'
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
  metadata?: Record<string, any> | null;
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