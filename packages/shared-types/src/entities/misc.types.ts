/**
 * Types related to the Ontology.
 */

/**
 * Represents a term within the controlled ontology, used for defining types of concepts,
 * relationships, perceptions, etc.
 * Aligns with the `ontology_terms` table in schema.prisma.
 */
export interface TOntologyTerm {
  /** Unique identifier for the term (UUID) */
  term_id: string;
  /** Scope of the term (e.g., 'Concept.type', 'Relationship.label', 'Perception.type') */
  term_scope: string;
  /** The actual name or label of the term (e.g., 'value', 'causes', 'holds_value') */
  term_name: string;
  /** Detailed definition of the term */
  definition?: string | null;
  /** Status of the term in the ontology lifecycle (e.g., 'active', 'deprecated', 'candidate') */
  status: string;
  /** Version identifier for the term, if applicable */
  version?: string | null;
  /** Optional: ID of a parent term for hierarchical classification within its scope */
  parent_term_id?: string | null;
  /** Agent or user responsible for creating/proposing this term */
  created_by: string;
  /** Timestamp when the term was created */
  created_at: Date;
  /** Timestamp when the term was last updated */
  last_updated_at: Date;
  /** Additional metadata (JSON object, e.g., usage examples, constraints) */
  metadata?: Record<string, any> | null;
}

/**
 * Enum for common ontology term scopes.
 */
export enum EOntologyTermScope {
  CONCEPT_TYPE = 'Concept.type',
  RELATIONSHIP_LABEL = 'Relationship.label',
  PERCEPTION_TYPE = 'Perception.type',
  ANNOTATION_TYPE = 'Annotation.type',
  MEDIA_TYPE = 'Media.type',
  // Add other scopes as ontology evolves
}

/**
 * Enum for common ontology term statuses.
 */
export enum EOntologyTermStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  CANDIDATE = 'candidate',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review'
} 