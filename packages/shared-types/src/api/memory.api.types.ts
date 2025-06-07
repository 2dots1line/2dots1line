/**
 * API types for Memory Units, Concepts, and Insights
 */
import type { TMemoryUnit, TConcept, TInsight, TAnnotation } from '../entities';

import type { TPaginationInput, TSortInput } from './common.types';

/**
 * Request payload for listing Memory Units
 */
export interface TListMemoryUnitsRequest extends TPaginationInput, TSortInput {
  source_type?: string;
  processing_status?: string;
  date_from?: string; // ISO 8601 date string
  date_to?: string; // ISO 8601 date string
  importance_min?: number;
  query?: string; // Optional search query
}

/**
 * Response payload containing a list of Memory Units
 */
export interface TListMemoryUnitsResponse {
  memory_units: TMemoryUnit[];
}

/**
 * Request payload for listing Concepts
 */
export interface TListConceptsRequest extends TPaginationInput, TSortInput {
  type?: string;
  query?: string;
  user_defined?: boolean;
  community_id?: string;
}

/**
 * Response payload containing a list of Concepts
 */
export interface TListConceptsResponse {
  concepts: TConcept[];
}

/**
 * Request payload for getting related concepts
 */
export interface TGetRelatedConceptsRequest {
  concept_id: string;
  max_depth?: number;
  relationship_labels?: string[];
}

/**
 * Response payload containing related concepts (could be a graph structure or flat list)
 */
export interface TGetRelatedConceptsResponse {
  related_concepts: TConcept[]; // Simplified for now, could be more complex graph structure
}

/**
 * Request payload for listing Insights
 */
export interface TListInsightsRequest extends TPaginationInput, TSortInput {
  type?: string;
  user_feedback?: 'resonated' | 'dismissed' | 'needs_clarification';
  status?: string;
}

/**
 * Response payload containing a list of Insights
 */
export interface TListInsightsResponse {
  insights: TInsight[];
}

/**
 * Request payload for creating an annotation
 */
export interface TCreateAnnotationRequest {
  target_id: string;
  target_node_type: TAnnotation['target_node_type'];
  annotation_type: string;
  text_content: string;
  metadata?: Record<string, any> | null;
}

/**
 * Response payload after creating an annotation
 */
export interface TCreateAnnotationResponse {
  annotation: TAnnotation;
} 