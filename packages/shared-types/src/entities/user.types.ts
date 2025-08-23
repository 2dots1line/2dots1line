/**
 * Types related to the User entity
 */

/**
 * Represents the core User entity, aligning with database schema.
 */
export interface TUser {
  /** Unique identifier for the user (UUID) */
  user_id: string;
  /** User's email address (unique) */
  email: string;
  /** User's display name */
  name?: string | null;
  /** User-specific preferences (JSON object). See TUserPreferences for structure. */
  preferences?: TUserPreferences | null;
  /** Deployment region ('us' or 'cn') */
  region: 'us' | 'cn';
  /** Timestamp when the user account was created */
  created_at: Date;
  /** Timestamp of the user's last activity */
  last_active_at?: Date | null;
  /** Account status ('active', 'suspended', 'deleted') */
  account_status: EUserAccountStatus;
}

/**
 * Represents the user's perception of a concept, aligning with database schema.
 */
export interface TUserPerceivedConcept {
  /** ID of the user */
  user_id: string;
  /** ID of the concept */
  concept_id: string;
  /** Type of perception (e.g., 'holds_value', 'has_interest') */
  perception_type: string;
  /** Current importance/salience of this perception (0.0-1.0) */
  current_salience?: number | null;
  /** Date when this perception began */
  start_date?: Date | null;
  /** Date when this perception ended (null if currently active) */
  end_date?: Date | null;
  /** Brief note on why this perception was inferred/added */
  source_description?: string | null;
  /** Confidence in this perception */
  confidence: number;
  /** Timestamp when this perception was last affirmed */
  last_affirmed_ts?: Date | null;
}

/**
 * Possible user account statuses.
 */
export enum EUserAccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * Structure for user preferences, stored as JSON in the TUser.preferences field.
 * Properties are in snake_case.
 */
export interface TUserPreferences {
  /** User interface theme preference */
  theme?: 'light' | 'dark' | 'system';
  /** Notification settings */
  notifications?: {
    /** Whether proactive insights are enabled */
    proactive_insights?: boolean;
    /** Whether email notifications are enabled */
    email?: boolean;
    /** Maximum number of notifications per day */
    max_per_day?: number;
  };
  /** Chat interface preferences */
  chat?: {
    /** Message density in chat interface */
    message_density?: 'compact' | 'comfortable' | 'spacious';
    /** Whether to show typing indicators */
    show_typing_indicator?: boolean;
  };
  /** Privacy settings */
  privacy?: {
    /** Whether to store chat history */
    store_chat_history?: boolean;
    /** Default privacy setting for memory units */
    default_memory_unit_privacy?: 'private' | 'shared';
  };
  /** Background media preferences for 2D views */
  background_media?: {
    /** Background media for dashboard view */
    dashboard?: {
      source: 'local' | 'pexels';
      type: 'video' | 'photo';
      id: string; // Local video name or Pexels ID
      url?: string; // For Pexels media
      title?: string; // For Pexels media
    };
    /** Background media for chat view */
    chat?: {
      source: 'local' | 'pexels';
      type: 'video' | 'photo';
      id: string;
      url?: string;
      title?: string;
    };
    /** Background media for cards view */
    cards?: {
      source: 'local' | 'pexels';
      type: 'video' | 'photo';
      id: string;
      url?: string;
      title?: string;
    };
    /** Background media for settings view */
    settings?: {
      source: 'local' | 'pexels';
      type: 'video' | 'photo';
      id: string;
      url?: string;
      title?: string;
    };
  };
}

// --- V10.8 Context Package Types ---

/**
 * Core Identity structure from CoreIdentity.yaml
 */
export interface CoreIdentity {
  persona: {
    name: string;
    archetype: string;
    description: string;
  };
  operational_mandate: {
    primary_directive: string;
    contextualization_protocol: string[];
    memory_retrieval_protocol: string[];
  };
  rules: string[];
}

/**
 * User Memory Profile structure (stored in User.memory_profile JSONB field)
 */
export interface UserMemoryProfile {
  [key: string]: unknown;
}

/**
 * Knowledge Graph Schema structure (stored in User.knowledge_graph_schema JSONB field)
 */
export interface KnowledgeGraphSchema {
  prominent_node_types: string[];
  prominent_relationship_types: string[];
  universal_concept_types: string[];
  universal_relationship_labels: {
    [key: string]: string[];
  };
}

/**
 * Next Conversation Context Package (stored in User.next_conversation_context_package JSONB field)
 */
export interface NextConversationContextPackage {
  proactive_greeting?: string;
  unresolved_topics_for_next_convo?: Array<{
    topic: string;
    summary_of_unresolution: string;
    suggested_question: string;
  }>;
  suggested_initial_focus?: string;
}

/**
 * Turn Context Package (stored in Redis with key pattern turn_context:{conversationId})
 */
export interface TurnContextPackage {
  suggested_next_focus?: string;
  emotional_tone_to_adopt?: string;
  flags_for_ingestion?: string[];
}

export interface AugmentedMemoryContext {
  relevant_memories?: string[];
  contextual_insights?: string[];
  emotional_context?: string;
}

export interface SummarizedConversation {
  conversation_summary: string;
  conversation_importance_score: number;
} 