/**
 * Relationship Types for 2dots1line V11.0
 * Standardized relationship properties across all workers
 */

export interface RelationshipProps {
  /** Unique identifier for the relationship */
  relationship_id: string;
  
  /** Type of relationship (RELATED_TO, MEMBER_OF, STRATEGIC_RELATIONSHIP, etc.) */
  relationship_type: string;
  
  /** ISO timestamp when relationship was created */
  created_at: string;
  
  /** User ID for multi-tenancy */
  user_id: string;
  
  /** Which worker/service created this relationship */
  source_agent: string;
  
  /** Relationship strength (0.0-1.0) */
  strength?: number;
  
  /** Human-readable description of the relationship */
  description?: string;
}
