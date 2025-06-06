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
}

// It seems the workers are importing `EmbeddingJob`, etc. directly.
// Let's define these as the payload types for now.
// If they are meant to be the full BullMQ Job<Payload>, that's a different structure.
// For now, to fix the TS2305, we'll export types with these names.

export type EmbeddingJob = TEmbeddingJobPayload;
export type IngestionJob = TIngestionJobPayload;
export type InsightJob = TInsightJobPayload; 