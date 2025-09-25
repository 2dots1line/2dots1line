/**
 * Types related to job payloads for workers.
 */

/**
 * Payload for a job to be processed by the Embedding Worker.
 */
export interface TEmbeddingJobPayload {
  content_type: 'chunk' | 'concept' | 'media_text' | 'media_visual';
  content_id: string;
  // Add other relevant fields, e.g., model_id, force_re_embed
}

/**
 * Payload for a job to be processed by the Ingestion Worker.
 * This would likely be the raw content that IngestionAnalyst processes.
 */
export interface TIngestionJobPayload {
  batch_id: string;
  // Define based on what IngestionAnalystInputPayload expects,
  // or the raw data before it's transformed into TIngestionAnalystInputPayload
  // For example:
  // content_items: { item_id: string; text_content?: string; media_url?: string; source_type: string; creation_timestamp: string; }[];
  // processing_tier: 1 | 2 | 3;
}

/**
 * Payload for a job to be processed by the Insight Worker.
 */
export interface TInsightJobPayload {
  // Define based on what the Insight Engine expects
  // For example:
  // user_id: string;
  // type_of_insight_requested: string; // e.g., 'correlation_analysis', 'pattern_detection'
  // memory_unit_ids?: string[];
  // concept_ids?: string[];
  // time_range?: { start: string; end: string };
  
  // Placeholder to prevent empty interface
  placeholder?: unknown;
}

/**
 * Payload for NotificationWorker - New Card Available
 * Published by: CardWorker after successfully creating a Card record
 */
export interface NewCardAvailablePayload {
  type: "new_card_available";
  userId: string;
  card: {
    card_id: string;
    type: string;
    display_data: {
      title: string;
    };
  };
}

/**
 * Payload for NotificationWorker - Graph Projection Updated
 * Published by: GraphProjectionWorker after a new projection is saved
 */
export interface GraphProjectionUpdatedPayload {
  type: "graph_projection_updated";
  userId: string;
  projection: {
    version: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Payload for NotificationWorker - New Star Generated
 * Published by: StarWorker after successfully creating a Star record
 */
export interface NewStarGeneratedPayload {
  type: "new_star_generated";
  userId: string;
  star: {
    star_id: string;
    star_type: string;
    display_data: {
      title: string;
      description?: string;
    };
  };
}

/**
 * SSE Message format for broadcasting to API Gateway
 */
export interface SSEMessage {
  userId: string;
  event: string; // Event name the frontend listens for (e.g., 'new_card', 'graph_updated')
  data: string; // JSON stringified data payload
}

// Union type for all notification payloads
export type NotificationJobPayload = NewCardAvailablePayload | GraphProjectionUpdatedPayload | NewStarGeneratedPayload;

// It seems the workers are importing `EmbeddingJob`, etc. directly.
// Let's define these as the payload types for now.
// If they are meant to be the full BullMQ Job<Payload>, that's a different structure.
// For now, to fix the TS2305, we'll export types with these names.

export type EmbeddingJob = TEmbeddingJobPayload;
export type IngestionJob = TIngestionJobPayload;
export type InsightJob = TInsightJobPayload;
export type NotificationJob = NotificationJobPayload;