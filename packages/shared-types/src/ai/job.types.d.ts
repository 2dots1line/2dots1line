/**
 * Types related to job payloads for workers.
 */
/**
 * Payload for a job to be processed by the Embedding Worker.
 */
export interface TEmbeddingJobPayload {
    content_type: 'chunk' | 'concept' | 'media_text' | 'media_visual';
    content_id: string;
}
/**
 * Payload for a job to be processed by the Ingestion Worker.
 * This would likely be the raw content that IngestionAnalyst processes.
 */
export interface TIngestionJobPayload {
    batch_id: string;
}
/**
 * Payload for a job to be processed by the Insight Worker.
 */
export interface TInsightJobPayload {
    placeholder?: unknown;
}
export type EmbeddingJob = TEmbeddingJobPayload;
export type IngestionJob = TIngestionJobPayload;
export type InsightJob = TInsightJobPayload;
//# sourceMappingURL=job.types.d.ts.map