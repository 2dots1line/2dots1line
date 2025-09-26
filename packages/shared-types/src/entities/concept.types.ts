/**
 * Types related to Concepts (entities, themes, values, etc.).
 */

/**
 * Represents a Concept, which can be an entity, theme, value, emotion, topic, etc.
 * Aligns with the `concepts` table in schema.prisma.
 */
export interface TConcept {
  /** Unique identifier for the concept (UUID) */
  entity_id: string;
  /** ID of the user who owns or has defined this version of the concept */
  user_id: string;
  /** Canonical name of the concept (e.g., "Patience", "Project Alpha") */
  title: string;
  /** Type from the controlled ontology (e.g., 'value', 'person', 'project_theme') */
  type: string;
  /** AI-generated or user-provided description of the concept */
  content?: string | null;
  /** True if explicitly created or heavily modified by the user */
  user_defined?: boolean;
  /** AI's confidence in this concept's identification/typing (0.0-1.0) */
  confidence?: number | null;
  /** AI-assigned importance score for this concept (0.0-1.0) */
  importance_score?: number | null;
  /** Optional: ID of a Community this concept belongs to */
  community_id?: string | null;
  /** Optional: Reference to vector in Weaviate (if concept has an embedding) */
  embedding_id?: string | null;
  /** Version of the ontology this concept type adheres to */
  ontology_version?: string | null;
  /** Timestamp when the concept was created */
  created_at: Date;
  /** Timestamp when the concept was last updated */
  updated_at: Date;
  /** Additional metadata (JSON object, e.g., synonyms, alternative labels) */
  metadata?: Record<string, unknown> | null;
}

/**
 * Represents a relationship between two Concepts.
 * Aligns with the `concept_relationships` table in schema.prisma.
 */
export interface TConceptRelationship {
  /** ID of the user in whose context this relationship exists */
  user_id: string;
  /** ID of the source Concept in the relationship */
  source_concept_id: string;
  /** ID of the target Concept in the relationship */
  target_concept_id: string;
  /** Label describing the relationship (from OntologyTerms, e.g., 'related_to', 'causes') */
  relationship_label: string;
  /** Weight or strength of the relationship (0.0-1.0) */
  weight?: number | null;
  /** Confidence in the accuracy or validity of this relationship (0.0-1.0) */
  confidence: number;
  /** Source of this relationship information ('ai_inferred', 'user_stated', 'ontology_default') */
  source_of_relation?: string | null;
  /** Timestamp when the relationship was created or identified */
  created_at: Date;
  /** Optional: MUID of the MemoryUnit where this relationship was primarily observed or defined */
  context_muid?: string | null;
  /** Optional metadata (JSON object) */
  metadata?: Record<string, unknown> | null; // Added metadata
}

/**
 * Represents entities, themes, values, emotions, topics, etc.
 */
export interface IConcept {
  /** Unique identifier for the concept */
  entityId: string;
  /** Each user has their own view/version of concepts */
  userId: string;
  /** Canonical name of the concept (e.g., "Patience", "McKinsey") */
  title: string;
  /** Type from the controlled ontology */
  type: ConceptType;
  /** AI-generated or user-provided description */
  content: string | null;
  /** True if explicitly created or heavily modified by the user */
  userDefined: boolean;
  /** AI's confidence in this concept's identification/typing (0.0-1.0) */
  confidence: number;
  /** Optional: ID of a Community this concept belongs to */
  communityId: string | null;
  /** Reference to vector in Weaviate (if concept has an embedding) */
  embeddingId: string | null;
  /** Version of the ontology this concept type adheres to */
  ontologyVersion: string;
  /** When this concept was first created */
  createdAt: Date;
  /** When this concept was last updated */
  updatedAt: Date;
  /** e.g., synonyms, alternative labels */
  metadata: Record<string, unknown>;
}

/**
 * Controlled vocabulary for concept types based on the ontology
 */
export enum ConceptType {
  // Self Domain
  VALUE = 'value',
  PERSONAL_TRAIT = 'personal_trait',
  SKILL = 'skill',
  EMOTION = 'emotion',
  INTEREST = 'interest',
  STRUGGLE = 'struggle',
  
  // Life Events Domain
  LIFE_EVENT_THEME = 'life_event_theme',
  ACHIEVEMENT = 'achievement',
  DECISION_POINT = 'decision_point',
  MILESTONE = 'milestone',
  
  // Relationships Domain
  PERSON = 'person',
  ORGANIZATION = 'organization',
  GROUP = 'group',
  RELATIONSHIP_DYNAMIC = 'relationship_dynamic',
  
  // Future Orientation Domain
  GOAL = 'goal',
  ASPIRATION = 'aspiration',
  PLAN = 'plan',
  CONCERN = 'concern',
  
  // General
  LOCATION = 'location',
  TIME_PERIOD = 'time_period',
  ACTIVITY = 'activity',
  ARTWORK = 'artwork',
  TOPIC = 'topic',
  ABSTRACT_IDEA = 'abstract_idea'
}

/**
 * Relationship types between concepts
 */
export enum RelationshipType {
  // Hierarchical
  IS_A_TYPE_OF = 'is_a_type_of',
  IS_PART_OF = 'is_part_of',
  IS_INSTANCE_OF = 'is_instance_of',
  
  // Causal
  CAUSES = 'causes',
  INFLUENCES = 'influences',
  ENABLES = 'enables',
  PREVENTS = 'prevents',
  CONTRIBUTES_TO = 'contributes_to',
  
  // Temporal
  PRECEDES = 'precedes',
  FOLLOWS = 'follows',
  CO_OCCURS_WITH = 'co_occurs_with',
  
  // Association
  IS_SIMILAR_TO = 'is_similar_to',
  IS_OPPOSITE_OF = 'is_opposite_of',
  IS_ANALOGOUS_TO = 'is_analogous_to',
  
  // Domain-specific
  INSPIRES = 'inspires',
  SUPPORTS_VALUE = 'supports_value',
  EXEMPLIFIES_TRAIT = 'exemplifies_trait',
  IS_MILESTONE_FOR = 'is_milestone_for',
  
  // Metaphorical
  IS_METAPHOR_FOR = 'is_metaphor_for',
  REPRESENTS_SYMBOLICALLY = 'represents_symbolically'
}

/**
 * User perception types for concepts
 */
export enum PerceptionType {
  HOLDS_VALUE = 'holds_value',
  HAS_INTEREST = 'has_interest',
  POSSESSES_TRAIT = 'possesses_trait',
  PURSUES_GOAL = 'pursues_goal',
  EXPERIENCES_EMOTION = 'experiences_emotion',
  STRUGGLES_WITH = 'struggles_with'
}

/**
 * Represents a relationship between two concepts
 */
export interface IConceptRelationship {
  /** Source concept ID */
  sourceConceptId: string;
  /** Target concept ID */
  targetConceptId: string;
  /** Relationship label from controlled vocabulary */
  relationshipLabel: RelationshipType;
  /** User ID for per-user context */
  userId: string;
  /** Strength of relationship (0.0-1.0) */
  weight: number;
  /** Confidence in this relationship (0.0-1.0) */
  confidence: number;
  /** Source of this relation */
  sourceOfRelation: 'ai_inferred' | 'user_stated' | 'ontology_default';
  /** When this relationship was created */
  creationTs: Date;
  /** Memory where this relationship was observed */
  contextMuid: string | null;
} 