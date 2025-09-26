-- Rename merged_into_concept_id to merged_into_entity_id in concepts table
ALTER TABLE "concepts" RENAME COLUMN "merged_into_concept_id" TO "merged_into_entity_id";
