/**
 * Types related to Derived Artifacts (AI-Generated Content)
 * Aligned with V9.7 schema.prisma DerivedArtifact model
 */

/**
 * Represents an AI-generated artifact derived from user's data
 * Aligns with the `derived_artifacts` table in schema.prisma V9.7
 */
export interface TDerivedArtifact {
  /** Unique identifier for the derived artifact (UUID) */
  artifact_id: string;
  /** ID of the user this artifact belongs to */
  user_id: string;
  /** Type of artifact ('insight_summary', 'cycle_report', 'trophy') */
  artifact_type: string;
  /** Title of the artifact */
  title: string;
  /** Narrative content of the artifact (optional) */
  content_narrative: string | null;
  /** IDs of the source memory units (optional) */
  source_memory_unit_ids: string[];
  /** IDs of the source concepts (optional) */
  source_concept_ids: string[];
  /** Timestamp when the artifact was created */
  created_at: Date;
}

/**
 * Derived artifact types
 */
export enum DerivedArtifactType {
  INSIGHT_SUMMARY = 'insight_summary',
  CYCLE_REPORT = 'cycle_report',
  TROPHY = 'trophy',
  REFLECTION_SYNTHESIS = 'reflection_synthesis',
  GROWTH_MILESTONE = 'growth_milestone'
} 