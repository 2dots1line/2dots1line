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
} 