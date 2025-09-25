/**
 * Types related to Communities of Concepts.
 */

/**
 * Represents a detected thematic cluster or community of Concepts.
 * Aligns with the `communities` table in schema.prisma V9.7.
 */
export interface TCommunity {
  /** Unique identifier for the community (UUID) */
  entity_id: string;
  /** ID of the user to whom this community belongs */
  user_id: string;
  /** AI-generated or user-assigned name for the community */
  title: string;
  /** AI-generated summary of the community's theme */
  content?: string | null;
  /** Timestamp when the community was created */
  created_at: Date;
  /** Timestamp when the community was last analyzed or updated */
  updated_at?: Date | null;
}

/**
 * Represents the link between a Concept and a Community.
 * This type can be used if relationship properties for Concept-Community links are needed.
 * Currently, `TConcept` has an optional `community_id` for a direct link.
 */
export interface TConceptCommunityLink {
  /** ID of the Concept */
  concept_id: string;
  /** ID of the Community */
  community_id: string;
  /** Strength of the concept's membership in the community (0.0-1.0) */
  membership_strength?: number | null;
  /** Centrality or importance of the concept within the community */
  centrality?: number | null;
  /** Optional: Source or reason for this link */
  link_source?: string;
} 