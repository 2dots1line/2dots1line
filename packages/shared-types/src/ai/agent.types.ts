/**
 * V9.7 Agent Types - Aligned with Current Architecture
 * Updated to remove obsolete chunk references and align with V9.7 implementation
 */

/**
 * Base interface for all cognitive agent inputs
 */
export interface IAgentInput {
  /** ID of the user making the request */
  userId: string;
  /** Region where the request is being processed */
  region: 'us' | 'cn';
  /** Request ID for tracking and logging */
  requestId: string;
  /** Timestamp of the request */
  timestamp: string;
}

/**
 * Base interface for all cognitive agent outputs
 */
export interface IAgentOutput {
  /** Status of the response */
  status: 'success' | 'error' | 'partial';
  /** Request ID for tracking and correlation */
  requestId: string;
  /** Processing metadata (timing, tool usage, etc.) */
  metadata: {
    /** Processing time in milliseconds */
    processingTimeMs: number;
    /** Tools used during processing */
    toolCalls: {
      /** Tool name */
      tool: string;
      /** Duration of tool call in milliseconds */
      durationMs: number;
      /** Success status of tool call */
      success: boolean;
    }[];
    /** Number of token used in processing */
    tokenUsage?: {
      /** Input token count */
      input: number;
      /** Output token count */
      output: number;
      /** Total token count */
      total: number;
    };
  };
}

/**
 * Dialogue Agent (Dot) input contract - V9.7 Aligned
 */
export interface IDialogueAgentInput extends IAgentInput {
  /** Text of the user's message */
  messageText: string;
  /** Media attachments in the message */
  messageMedia?: {
    /** Type of media */
    type: string;
    /** URL or data URI of the media */
    url: string;
  }[];
  /** ID of the conversation */
  conversationId: string;
  /** ID of the message */
  messageId: string;
}

/**
 * Dialogue Agent (Dot) output contract - V9.7 Aligned
 */
export interface IDialogueAgentOutput extends IAgentOutput {
  /** Text of the assistant's response */
  responseText: string;
  /** Media attachments in the response */
  responseMedia?: {
    /** Type of media */
    type: string;
    /** URL of the media */
    url: string;
  }[];
  /** Suggested actions for the user */
  suggestedActions?: {
    /** Type of action */
    action: string;
    /** Display label for the action */
    label: string;
    /** Payload for the action */
    payload: any;
  }[];
  /** Proactive insight to share */
  proactiveInsight?: {
    /** Text of the insight */
    text: string;
    /** Source of the insight */
    source: string;
    /** Confidence in the insight (0.0-1.0) */
    confidence: number;
  };
}

/**
 * @deprecated V9.7 removed IngestionAnalyst. Use background workers instead.
 * Ingestion Analyst input contract
 */
export interface IIngestionAnalystInput extends IAgentInput {
  /** ID for this batch of content */
  batchId: string;
  /** Content items to process */
  contentItems: {
    /** ID of the item */
    itemId: string;
    /** Text content */
    text: string;
    /** Media attachments */
    media?: {
      /** Type of media */
      type: string;
      /** URL of the media */
      url: string;
    }[];
    /** Type of content source */
    sourceType: string;
    /** Timestamp of the content */
    timestamp: string;
  }[];
  /** Processing tier (1-3) */
  processingTier: 1 | 2 | 3;
}

/**
 * @deprecated V9.7 removed IngestionAnalyst and chunk system. Use background workers instead.
 * Ingestion Analyst output contract
 */
export interface IIngestionAnalystOutput extends IAgentOutput {
  /** Memory units created */
  memoryUnits: {
    /** Memory unit ID */
    muid: string;
    /** Source item ID */
    sourceItemId: string;
    /** Title of the memory unit */
    title: string;
    /** Processing status */
    processingStatus: string;
    /** Importance score (0.0-1.0) */
    importanceScore: number;
  }[];
  /** @deprecated V9.7 removed chunk system */
  chunks: {
    /** Chunk ID */
    cid: string;
    /** Parent memory unit ID */
    muid: string;
    /** Text content */
    text: string;
    /** Sequence order */
    sequenceOrder: number;
    /** Role of the chunk */
    role: string;
  }[];
  /** Entities extracted */
  entities: {
    /** Concept ID */
    conceptId: string;
    /** Name of the entity */
    name: string;
    /** Type of entity */
    type: string;
    /** Confidence in entity (0.0-1.0) */
    confidence: number;
    /** Description of the entity */
    description: string;
  }[];
  /** Relationships identified */
  relations: {
    /** Source entity ID */
    sourceId: string;
    /** Target entity ID */
    targetId: string;
    /** Type of relationship */
    type: string;
    /** Relationship label */
    relationshipLabel: string;
    /** Weight of relationship (0.0-1.0) */
    weight: number;
  }[];
  /** Media items processed */
  mediaItems: any[];
  /** Embedding jobs created */
  embeddingJobs: any[];
}

/**
 * Generic structure for agent input, wrapping a specific payload.
 * Contains common fields like user_id and request_id.
 */
export interface TAgentInput<TPayload = any> {
  /** Unique identifier for the requesting user */
  user_id: string;
  /** Payload specific to the agent's task */
  payload: TPayload;
  /** Deployment region ('us' or 'cn') */
  region: 'us' | 'cn';
  /** Optional unique ID for tracing the request */
  request_id?: string;
  /** Optional metadata about the request (e.g., client info, timestamp) */
  metadata?: {
    timestamp: string; // ISO 8601
    [key: string]: any;
  };
}

/**
 * Generic structure for agent output, wrapping a specific result.
 * Contains common metadata about the execution.
 */
export interface TAgentOutput<TResult = any> {
  /** Result data specific to the agent's task */
  result?: TResult; // Optional to allow for errors where result might not be present
  /** Optional unique ID for tracing the request, should match input if provided */
  request_id?: string;
  /** Status of the response */
  status: 'success' | 'error' | 'partial';
  /** Error details if status is 'error' or 'partial' */
  error?: {
    code: string; // e.g., 'VALIDATION_ERROR', 'TOOL_EXECUTION_FAILED', 'INTERNAL_SERVER_ERROR'
    message: string;
    details?: Record<string, any>;
  };
  /** Metadata about the processing */
  metadata: {
    /** Time taken for the agent's task in milliseconds */
    processing_time_ms: number;
    /** List of tools called during processing */
    tool_calls?: { tool_name: string; duration_ms: number; success: boolean; error?: string }[];
    /** Model used if applicable */
    model_used?: string;
    /** Token usage if applicable */
    token_usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    /** Confidence score if applicable to the primary result */
    confidence?: number;
    /** Any warnings generated during processing */
    warnings?: string[];
    /** Region where processing occurred */
    processed_in_region?: 'us' | 'cn';
    [key: string]: any; // For any other specific metadata an agent might want to return
  };
}

/**
 * @deprecated V9.7 removed IngestionAnalyst. Use background workers instead.
 * Structure for ingestion content items
 */
export interface TIngestionContentItem {
  /** Unique ID for this item within a batch (client-generated) */
  item_id: string;
  /** Text content */
  text_content?: string | null;
  /** Media content. URL should be accessible by the ingestion service. */
  media_content?: {
    /** MIME type of the media */
    media_type: string;
    /** URL of the media */
    url: string;
    /** Optional: Original filename */
    filename?: string;
  }[];
  /** Source type (e.g., 'journal_entry', 'chat_message', 'imported_document') */
  source_type: string;
  /** Timestamp of the original content creation (ISO 8601 string) */
  creation_timestamp: string;
  /** Optional user-provided title for this item */
  title?: string | null;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * @deprecated V9.7 removed IngestionAnalyst. Use background workers instead.
 * Ingestion Analyst input payload
 */
export interface TIngestionAnalystInputPayload {
  /** Unique identifier for the batch being processed (client-generated or from queue message) */
  batch_id: string;
  /** Array of content items to ingest */
  content_items: TIngestionContentItem[];
  /** Processing tier (1-3) requested for this batch */
  processing_tier: 1 | 2 | 3;
  /** Optional: override default processing parameters */
  processing_params?: {
    force_reprocessing?: boolean;
    target_language?: string; // e.g., 'en', 'zh'
  };
}

/**
 * @deprecated V9.7 removed IngestionAnalyst and chunk system. Use background workers instead.
 * Ingestion Analyst result
 */
export interface TIngestionAnalystResult {
  /** Details of created/updated Memory Units */
  memory_units: { 
    muid: string; 
    source_item_id: string; 
    title?: string | null; 
    status: string; 
    importance_score?: number | null; 
  }[];
  /** @deprecated V9.7 removed chunk system */
  chunks?: { 
    cid: string; 
    muid: string; 
    text_preview: string; // A small preview
    sequence_order: number; 
    role?: string | null; 
  }[];
  /** Details of extracted Concepts/Entities */
  entities?: { 
    concept_id: string; 
    name: string; 
    type: string; 
    confidence?: number | null; 
    description?: string | null; 
  }[];
  /** Details of inferred Relationships */
  relations?: { 
    source_concept_id: string; 
    target_concept_id: string; 
    relationship_label: string; 
    weight?: number | null; 
    context_muid?: string | null;
  }[];
  /** Details of processed Media items */
  media_items?: { 
    media_id: string; 
    source_item_id: string; 
    muid?: string | null; // MUID it was attached to
    status: string; // e.g., 'processed', 'extraction_pending', 'error'
    extracted_text_preview?: string | null;
  }[];
  /** Jobs queued for embedding generation or further processing */
  queued_jobs?: { 
    job_id: string; 
    queue_name: string;
    content_type: 'memory_unit' | 'concept' | 'media_text' | 'media_visual'; 
    content_id: string; 
  }[];
  /** Errors encountered for specific items within the batch */
  item_errors?: {
    item_id: string;
    error_code: string;
    message: string;
  }[];
}

/** @deprecated V9.7 removed IngestionAnalyst */
export type TIngestionAnalystInput = TAgentInput<TIngestionAnalystInputPayload>;
/** @deprecated V9.7 removed IngestionAnalyst */
export type TIngestionAnalystOutput = TAgentOutput<TIngestionAnalystResult>;

// --- DialogueAgent Types (V9.7 Current) ---

/**
 * V9.7 DialogueAgent input payload - Current Implementation
 */
export interface TDialogueAgentInputPayload {
  /** Text of the user's message */
  message_text?: string | null;
  /** Media attachments in the message */
  message_media?: {
    /** Type of media (e.g., 'image/jpeg', 'audio/mp3') */
    type: string;
    /** URL or data URI of the media */
    url: string;
    /** Optional: ID if this media is already known to the system */
    media_id?: string;
  }[];
  /** ID of the conversation. If null/omitted, a new conversation may be started. */
  conversation_id?: string | null;
  /** Unique ID for this specific message from the client */
  message_id: string;
  /** Timestamp of the user message (ISO 8601 string) */
  client_timestamp: string;
  /** Optional: User preferences that might affect dialogue strategy */
  user_preferences?: Record<string, any>;
}

/**
 * V9.7 DialogueAgent result - Current Implementation
 */
export interface TDialogueAgentResult {
  /** Text of the assistant's response */
  response_text: string;
  /** Media attachments in the response */
  response_media?: {
    /** Type of media */
    type: string;
    /** URL of the media */
    url: string;
  }[];
  /** Suggested actions for the user */
  suggested_actions?: {
    /** Type of action (e.g., 'navigate', 'call_tool') */
    action_type: string;
    /** Display label for the action */
    label: string;
    /** Payload for the action */
    payload: Record<string, any>;
  }[];
  /** Proactive insight to share */
  proactive_insight?: {
    /** Text of the insight */
    text: string;
    /** Source insight ID from the database */
    source_insight_id: string;
    /** Confidence in the insight (0.0-1.0) */
    confidence: number;
  } | null;
  /** ID of the conversation (new or existing) */
  conversation_id: string;
}

export type TDialogueAgentInput = TAgentInput<TDialogueAgentInputPayload>;
export type TDialogueAgentOutput = TAgentOutput<TDialogueAgentResult>;

// Add types for RetrievalPlannerInput, RetrievalPlannerOutput, InsightEngineOutput, OntologyStewardInput, OntologyStewardOutput as needed
// based on V4TechSpec.md section 3 