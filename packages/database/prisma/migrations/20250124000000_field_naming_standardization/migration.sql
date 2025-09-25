-- Field Naming Standardization Migration
-- This migration standardizes field names across all tables according to V11.0 specification

-- ==============================================
-- 1. CARDS TABLE MIGRATION
-- ==============================================

-- Update cards table: card_type → type
ALTER TABLE "cards" RENAME COLUMN "card_type" TO "type";

-- ==============================================
-- 2. CONVERSATION_MESSAGES TABLE MIGRATION
-- ==============================================

-- Add new columns
ALTER TABLE "conversation_messages" ADD COLUMN "created_at" TIMESTAMP DEFAULT NOW();
ALTER TABLE "conversation_messages" ADD COLUMN "status" TEXT DEFAULT 'active';
ALTER TABLE "conversation_messages" ADD COLUMN "type" TEXT;
ALTER TABLE "conversation_messages" ADD COLUMN "metadata" JSONB;

-- Migrate data
UPDATE "conversation_messages" SET "created_at" = "timestamp";
UPDATE "conversation_messages" SET "type" = "role";
UPDATE "conversation_messages" SET "metadata" = "llm_call_metadata";

-- Make new columns NOT NULL
ALTER TABLE "conversation_messages" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "conversation_messages" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "conversation_messages" ALTER COLUMN "type" SET NOT NULL;

-- Rename primary key
ALTER TABLE "conversation_messages" RENAME COLUMN "id" TO "message_id";

-- Drop old columns
ALTER TABLE "conversation_messages" DROP COLUMN "timestamp";
ALTER TABLE "conversation_messages" DROP COLUMN "role";
ALTER TABLE "conversation_messages" DROP COLUMN "llm_call_metadata";

-- ==============================================
-- 3. GROWTH_EVENTS TABLE MIGRATION
-- ==============================================

-- Add new columns
ALTER TABLE "growth_events" ADD COLUMN "title" TEXT;
ALTER TABLE "growth_events" ADD COLUMN "content" TEXT;
ALTER TABLE "growth_events" ADD COLUMN "type" TEXT;
ALTER TABLE "growth_events" ADD COLUMN "updated_at" TIMESTAMP;
ALTER TABLE "growth_events" ADD COLUMN "status" TEXT DEFAULT 'active';
ALTER TABLE "growth_events" ADD COLUMN "source_concept_ids" TEXT[] DEFAULT '{}';
ALTER TABLE "growth_events" ADD COLUMN "source_memory_unit_ids" TEXT[] DEFAULT '{}';
ALTER TABLE "growth_events" ADD COLUMN "metadata" JSONB;

-- Migrate data
UPDATE "growth_events" SET "type" = "dimension_key";
UPDATE "growth_events" SET "content" = "rationale";
UPDATE "growth_events" SET "source_concept_ids" = "related_concepts";
UPDATE "growth_events" SET "source_memory_unit_ids" = "related_memory_units";
UPDATE "growth_events" SET "metadata" = "details";

-- Make new columns NOT NULL
ALTER TABLE "growth_events" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "growth_events" ALTER COLUMN "status" SET NOT NULL;

-- Rename primary key
ALTER TABLE "growth_events" RENAME COLUMN "event_id" TO "entity_id";

-- Drop old columns
ALTER TABLE "growth_events" DROP COLUMN "growth_dimensions";
ALTER TABLE "growth_events" DROP COLUMN "dimension_key";
ALTER TABLE "growth_events" DROP COLUMN "rationale";
ALTER TABLE "growth_events" DROP COLUMN "related_concepts";
ALTER TABLE "growth_events" DROP COLUMN "related_memory_units";
ALTER TABLE "growth_events" DROP COLUMN "details";

-- ==============================================
-- 4. INTERACTION_LOGS TABLE MIGRATION
-- ==============================================

-- Add new columns
ALTER TABLE "interaction_logs" ADD COLUMN "created_at" TIMESTAMP DEFAULT NOW();
ALTER TABLE "interaction_logs" ADD COLUMN "content" TEXT;
ALTER TABLE "interaction_logs" ADD COLUMN "type" TEXT;

-- Migrate data
UPDATE "interaction_logs" SET "created_at" = "timestamp";
UPDATE "interaction_logs" SET "content" = "content_text" WHERE "content_text" IS NOT NULL;
UPDATE "interaction_logs" SET "type" = "interaction_type";

-- Make new columns NOT NULL
ALTER TABLE "interaction_logs" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "interaction_logs" ALTER COLUMN "type" SET NOT NULL;

-- Drop old columns
ALTER TABLE "interaction_logs" DROP COLUMN "timestamp";
ALTER TABLE "interaction_logs" DROP COLUMN "content_text";
ALTER TABLE "interaction_logs" DROP COLUMN "interaction_type";

-- ==============================================
-- 5. USER_CYCLES TABLE MIGRATION
-- ==============================================

-- Add new columns
ALTER TABLE "user_cycles" ADD COLUMN "type" TEXT;
ALTER TABLE "user_cycles" ADD COLUMN "ended_at" TIMESTAMP;

-- Migrate data
UPDATE "user_cycles" SET "type" = "cycle_type";
UPDATE "user_cycles" SET "ended_at" = "cycle_end_date";

-- Make new column NOT NULL
ALTER TABLE "user_cycles" ALTER COLUMN "type" SET NOT NULL;

-- Rename existing column
ALTER TABLE "user_cycles" RENAME COLUMN "cycle_start_date" TO "created_at";

-- Drop old columns
ALTER TABLE "user_cycles" DROP COLUMN "cycle_type";
ALTER TABLE "user_cycles" DROP COLUMN "cycle_end_date";
ALTER TABLE "user_cycles" DROP COLUMN "job_id";
ALTER TABLE "user_cycles" DROP COLUMN "cycle_duration_days";
ALTER TABLE "user_cycles" DROP COLUMN "trigger_source";
ALTER TABLE "user_cycles" DROP COLUMN "processing_duration_ms";
ALTER TABLE "user_cycles" DROP COLUMN "llm_tokens_used";
ALTER TABLE "user_cycles" DROP COLUMN "error_count";
ALTER TABLE "user_cycles" DROP COLUMN "validation_score";
ALTER TABLE "user_cycles" DROP COLUMN "insights_summary";
ALTER TABLE "user_cycles" DROP COLUMN "growth_metrics";
ALTER TABLE "user_cycles" DROP COLUMN "dashboard_ready";
ALTER TABLE "user_cycles" DROP COLUMN "artifacts_created";
ALTER TABLE "user_cycles" DROP COLUMN "prompts_created";
ALTER TABLE "user_cycles" DROP COLUMN "concepts_merged";
ALTER TABLE "user_cycles" DROP COLUMN "relationships_created";

-- ==============================================
-- 6. UPDATE FOREIGN KEY REFERENCES
-- ==============================================

-- Update conversation_messages foreign key reference
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_conversation_id_fkey";
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE;

-- Update memory_units foreign key reference to conversations
ALTER TABLE "memory_units" DROP CONSTRAINT "memory_units_source_conversation_id_fkey";
ALTER TABLE "memory_units" ADD CONSTRAINT "memory_units_source_conversation_id_fkey" 
    FOREIGN KEY ("source_conversation_id") REFERENCES "conversations"("conversation_id");

-- ==============================================
-- 7. UPDATE INDEXES
-- ==============================================

-- Drop old indexes that reference renamed columns
DROP INDEX IF EXISTS "conversation_messages_conversation_id_timestamp_idx";
DROP INDEX IF EXISTS "growth_events_user_id_dimension_key_idx";
DROP INDEX IF EXISTS "growth_events_dimension_key_idx";
DROP INDEX IF EXISTS "user_cycles_cycle_start_date_cycle_end_date_idx";

-- Create new indexes with updated column names
CREATE INDEX "conversation_messages_conversation_id_created_at_idx" ON "conversation_messages"("conversation_id", "created_at");
CREATE INDEX "growth_events_user_id_type_idx" ON "growth_events"("user_id", "type");
CREATE INDEX "growth_events_type_idx" ON "growth_events"("type");
CREATE INDEX "user_cycles_created_at_ended_at_idx" ON "user_cycles"("created_at", "ended_at");

-- ==============================================
-- 8. VALIDATION QUERIES
-- ==============================================

-- Verify all tables have the expected standardized fields
-- These queries will fail if the migration was not successful

-- Check cards table
SELECT "card_id", "type" FROM "cards" LIMIT 1;

-- Check conversation_messages table
SELECT "message_id", "type", "created_at", "status", "metadata" FROM "conversation_messages" LIMIT 1;

-- Check growth_events table
SELECT "entity_id", "type", "content", "source_concept_ids", "source_memory_unit_ids", "metadata" FROM "growth_events" LIMIT 1;

-- Check interaction_logs table
SELECT "interaction_id", "type", "content", "created_at" FROM "interaction_logs" LIMIT 1;

-- Check user_cycles table
SELECT "cycle_id", "type", "created_at", "ended_at" FROM "user_cycles" LIMIT 1;

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- All field naming standardization changes have been applied
-- The database now conforms to the V11.0 field naming standards
