/**
 * Types related to Conversations and Messages
 * Aligned with V9.7 schema.prisma
 */

/**
 * Represents a single message within a conversation
 * Aligns with ConversationMessage model in V9.7 schema
 */
export interface TConversationMessage {
  /** Unique identifier for the message (UUID) */
  message_id: string;
  /** ID of the conversation this message belongs to */
  conversation_id: string;
  /** Sender type ('user' or 'assistant') */
  type: 'user' | 'assistant';
  /** Text content of the message */
  content: string;
  /** Timestamp of the message */
  created_at: Date;
  /** LLM call metadata (JSON object) */
  metadata?: Record<string, unknown> | null;
  /** Media IDs associated with this message */
  media_ids: string[];
}

/**
 * Represents metadata for a conversation session
 * Aligns with Conversation model in V9.7 schema
 */
export interface TConversation {
  /** Unique identifier for the conversation (UUID) */
  conversation_id: string;
  /** ID of the user */
  user_id: string;
  /** AI-generated or user-provided title for the conversation */
  title?: string | null;
  /** Timestamp when the conversation started */
  created_at: Date;
  /** Timestamp when the conversation ended */
  ended_at?: Date | null;
  /** Status of the conversation ('active', 'ended', 'processing', 'processed') */
  status: string;
  /** Importance score of the conversation */
  importance_score?: number | null;
  /** Summary of the conversation context */
  content?: string | null;
  /** Additional conversation metadata (JSON object) */
  metadata?: Record<string, unknown> | null;
  /** ID of the source card that initiated this conversation */
  source_card_id?: string | null;
}

/**
 * Represents an AI-generated insight (pattern, correlation, hypothesis)
 * @deprecated V9.7 uses InteractionLog for tracking insights. This interface may be removed in future versions.
 */
export interface TInsight {
  /** Unique identifier for the insight (UUID) */
  insight_id: string;
  /** ID of the user */
  user_id: string;
  /** Type of insight (e.g., 'pattern_temporal', 'correlation_behavioral') */
  type: string;
  /** Human-readable description of the insight */
  description: string;
  /** Array of {id, type, relevance_score} pointing to supporting evidence */
  supporting_evidence: {id: string; type: string; relevance_score: number}[];
  /** AI's confidence in this insight (0.0-1.0) */
  confidence: number;
  /** How new or surprising this insight might be (0.0-1.0) */
  novelty_score?: number | null;
  /** Agent that generated the insight (e.g., 'InsightEngine_v1.1') */
  source_agent: string;
  /** Timestamp when the insight was created */
  created_at: Date;
  /** Timestamp when Dot last shared this with the user */
  last_surfaced_to_user_ts?: Date | null;
  /** User feedback ('resonated', 'dismissed', 'needs_clarification') */
  user_feedback?: 'resonated' | 'dismissed' | 'needs_clarification' | null;
  /** Status of the insight ('active', 'archived', 'deleted') */
  status: string;
} 