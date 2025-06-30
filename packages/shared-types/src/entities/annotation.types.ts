/**
 * Types related to Annotations.
 * @deprecated V9.7 eliminated annotations table. Use InteractionLog model instead.
 * Annotations are now stored as interaction_type entries in the InteractionLog table.
 */

/**
 * Represents an annotation on a MemoryUnit, Chunk, or Concept.
 * Aligns with the `annotations` table in schema.prisma.
 * @deprecated V9.7 removed annotations table. Use InteractionLog with interaction_type='annotation' instead.
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
 * @deprecated V9.7 eliminated annotations. Use InteractionLog.interaction_type instead.
 */
export enum AnnotationType {
  NOTE = 'note',
  HIGHLIGHT = 'highlight',
  QUESTION = 'question',
  REFLECTION = 'reflection',
  CORRECTION = 'correction'
} 