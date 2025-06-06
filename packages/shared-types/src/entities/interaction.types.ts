/**
 * Types related to Conversations and Insights
 */

/**
 * Represents a single message within a conversation
 */
export interface TConversationMessage {
  /** Unique identifier for the message (UUID) */
  message_id: string;
  /** ID of the conversation this message belongs to */
  conversation_id: string;
  /** ID of the user */
  user_id: string;
  /** Sender type ('user' or 'assistant') */
  sender_type: 'user' | 'assistant';
  /** Text content of the message */
  message_text?: string | null;
  /** Type of message ('text', 'image', 'file', 'action') */
  message_type: string;
  /** Media attachments (JSON array of {type, url, media_id}) */
  media_attachments?: {type: string; url: string; media_id?: string}[] | null;
  /** Actions suggested by the assistant (JSON array) */
  suggested_actions?: Record<string, any>[] | null;
  /** Timestamp of the message */
  timestamp: Date;
  /** Status if this turn needs to become a MemoryUnit */
  processing_status: string;
  /** Link if this turn became a MemoryUnit */
  associated_muid?: string | null;
  /** Brief summary of context the assistant used for its response */
  retrieval_context_summary?: string | null;
  /** User feedback on the assistant's response */
  user_feedback_on_response?: 'helpful' | 'unhelpful' | 'neutral' | null;
  /** Additional message metadata (JSON object) */
  metadata?: Record<string, any> | null;
}

/**
 * Represents metadata for a conversation session
 */
export interface TConversation {
  /** Unique identifier for the conversation (UUID) */
  conversation_id: string;
  /** ID of the user */
  user_id: string;
  /** AI-generated or user-provided title for the conversation */
  title?: string | null;
  /** Timestamp when the conversation started */
  start_time: Date;
  /** Timestamp of the last message in the conversation */
  last_message_time: Date;
  /** Status of the conversation ('active', 'archived', 'deleted') */
  status: 'active' | 'archived' | 'deleted';
  /** Total number of messages in the conversation */
  message_count: number;
  /** Additional conversation metadata (JSON object) */
  metadata?: Record<string, any> | null;
}

/**
 * Represents an AI-generated insight (pattern, correlation, hypothesis)
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