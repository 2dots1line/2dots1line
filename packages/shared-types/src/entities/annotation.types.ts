/**
 * Types related to Annotations.
 */

/**
 * Represents an annotation on a MemoryUnit, Chunk, or Concept.
 * Aligns with the `annotations` table in schema.prisma.
 */
export interface TAnnotation {
  /** Unique identifier for the annotation (UUID) */
  aid: string;
  /** ID of the user who created or owns this annotation */
  user_id: string;
  /** ID of the target item being annotated (muid, cid, concept_id) */
  target_id: string;
  /** Type of the target node (e.g., 'MemoryUnit', 'Chunk', 'Concept') */
  target_node_type: string;
  /** Type of annotation (e.g., 'user_reflection', 'ai_inferred_significance') */
  annotation_type: string;
  /** The textual content of the annotation */
  text_content: string;
  /** Source of the annotation ('user' or specific agent name) */
  source: string;
  /** Timestamp when the annotation was created */
  creation_ts: Date;
  /** Additional metadata (JSON object) */
  metadata?: Record<string, any> | null;
}

/**
 * Annotation types
 */
export enum AnnotationType {
  NOTE = 'note',
  HIGHLIGHT = 'highlight',
  QUESTION = 'question',
  REFLECTION = 'reflection',
  CORRECTION = 'correction'
} 