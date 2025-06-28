/*
  Warnings:

  - You are about to drop the column `confidence_score` on the `communities` table. All the data in the column will be lost.
  - You are about to drop the column `detection_method` on the `communities` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `communities` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `concepts` table. All the data in the column will be lost.
  - You are about to drop the column `embedding_id` on the `concepts` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `concepts` table. All the data in the column will be lost.
  - You are about to drop the column `ontology_version` on the `concepts` table. All the data in the column will be lost.
  - You are about to drop the column `user_defined` on the `concepts` table. All the data in the column will be lost.
  - The primary key for the `conversation_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `associated_muid` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `message_text` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `message_type` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `processing_status` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `retrieval_context_summary` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `suggested_actions` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `user_feedback_on_response` on the `conversation_messages` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `conversation_messages` table. All the data in the column will be lost.
  - The primary key for the `conversations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `conversation_id` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `last_active_time` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `agent_version` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `content_json` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `generated_by_agent` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `generation_parameters` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `user_feedback_comment` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `user_feedback_score` on the `derived_artifacts` table. All the data in the column will be lost.
  - You are about to drop the column `content_processing_notes` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `content_source` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `content_type` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `is_private` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `original_content` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `processing_status` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `source_type` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `memory_units` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `progress_json` on the `user_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `user_notes` on the `user_challenges` table. All the data in the column will be lost.
  - You are about to drop the column `growth_profile` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `annotation_concept_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `annotations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challenge_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chunks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `derived_artifact_concept_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orb_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reflections` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `communities` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `content` to the `conversation_messages` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `conversation_messages` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `conversations` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `title` on table `derived_artifacts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `memory_units` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `memory_units` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "annotation_concept_links" DROP CONSTRAINT "annotation_concept_links_annotation_id_fkey";

-- DropForeignKey
ALTER TABLE "annotation_concept_links" DROP CONSTRAINT "annotation_concept_links_concept_id_fkey";

-- DropForeignKey
ALTER TABLE "annotations" DROP CONSTRAINT "annotations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chunks" DROP CONSTRAINT "chunks_muid_fkey";

-- DropForeignKey
ALTER TABLE "chunks" DROP CONSTRAINT "chunks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_associated_muid_fkey";

-- DropForeignKey
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "derived_artifact_concept_links" DROP CONSTRAINT "derived_artifact_concept_links_concept_id_fkey";

-- DropForeignKey
ALTER TABLE "derived_artifact_concept_links" DROP CONSTRAINT "derived_artifact_concept_links_derived_artifact_id_fkey";

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_muid_fkey";

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_user_id_fkey";

-- DropForeignKey
ALTER TABLE "orb_states" DROP CONSTRAINT "orb_states_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "orb_states" DROP CONSTRAINT "orb_states_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reflections" DROP CONSTRAINT "reflections_memory_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "reflections" DROP CONSTRAINT "reflections_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_challenges" DROP CONSTRAINT "user_challenges_challenge_template_id_fkey";

-- DropIndex
DROP INDEX "communities_user_id_idx";

-- DropIndex
DROP INDEX "concepts_community_id_idx";

-- DropIndex
DROP INDEX "concepts_user_id_name_idx";

-- DropIndex
DROP INDEX "concepts_user_id_type_idx";

-- DropIndex
DROP INDEX "conversation_messages_associated_muid_idx";

-- DropIndex
DROP INDEX "conversation_messages_conversation_id_created_at_idx";

-- DropIndex
DROP INDEX "conversation_messages_user_id_created_at_idx";

-- DropIndex
DROP INDEX "conversations_session_id_idx";

-- DropIndex
DROP INDEX "conversations_session_id_key";

-- DropIndex
DROP INDEX "conversations_user_id_last_active_time_idx";

-- DropIndex
DROP INDEX "derived_artifacts_source_memory_unit_id_idx";

-- DropIndex
DROP INDEX "derived_artifacts_user_id_artifact_type_idx";

-- DropIndex
DROP INDEX "derived_artifacts_user_id_created_at_idx";

-- DropIndex
DROP INDEX "growth_events_user_id_created_at_idx";

-- DropIndex
DROP INDEX "growth_events_user_id_dim_key_idx";

-- DropIndex
DROP INDEX "growth_events_user_id_entity_id_entity_type_idx";

-- DropIndex
DROP INDEX "memory_units_user_id_creation_ts_idx";

-- DropIndex
DROP INDEX "memory_units_user_id_importance_score_idx";

-- DropIndex
DROP INDEX "memory_units_user_id_processing_status_idx";

-- DropIndex
DROP INDEX "memory_units_user_id_source_type_idx";

-- DropIndex
DROP INDEX "user_challenges_user_id_challenge_template_id_idx";

-- DropIndex
DROP INDEX "user_challenges_user_id_status_idx";

-- DropIndex
DROP INDEX "user_sessions_expires_at_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_region_idx";

-- AlterTable
ALTER TABLE "communities" DROP COLUMN "confidence_score",
DROP COLUMN "detection_method",
DROP COLUMN "keywords",
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "concepts" DROP COLUMN "confidence",
DROP COLUMN "embedding_id",
DROP COLUMN "metadata",
DROP COLUMN "ontology_version",
DROP COLUMN "user_defined",
ADD COLUMN     "merged_into_concept_id" TEXT,
ADD COLUMN     "salience" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_pkey",
DROP COLUMN "associated_muid",
DROP COLUMN "created_at",
DROP COLUMN "message_id",
DROP COLUMN "message_text",
DROP COLUMN "message_type",
DROP COLUMN "metadata",
DROP COLUMN "processing_status",
DROP COLUMN "retrieval_context_summary",
DROP COLUMN "suggested_actions",
DROP COLUMN "user_feedback_on_response",
DROP COLUMN "user_id",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "llm_call_metadata" JSONB,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_pkey",
DROP COLUMN "conversation_id",
DROP COLUMN "last_active_time",
DROP COLUMN "session_id",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "importance_score" DOUBLE PRECISION,
ADD COLUMN     "source_card_id" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "derived_artifacts" DROP COLUMN "agent_version",
DROP COLUMN "content_json",
DROP COLUMN "generated_by_agent",
DROP COLUMN "generation_parameters",
DROP COLUMN "updated_at",
DROP COLUMN "user_feedback_comment",
DROP COLUMN "user_feedback_score",
ADD COLUMN     "content_data" JSONB,
ADD COLUMN     "content_narrative" TEXT,
ADD COLUMN     "source_concept_id" TEXT,
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "memory_units" DROP COLUMN "content_processing_notes",
DROP COLUMN "content_source",
DROP COLUMN "content_type",
DROP COLUMN "is_private",
DROP COLUMN "metadata",
DROP COLUMN "original_content",
DROP COLUMN "processing_status",
DROP COLUMN "source_type",
DROP COLUMN "tier",
ADD COLUMN     "sentiment_score" DOUBLE PRECISION,
ADD COLUMN     "source_conversation_id" TEXT,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_challenges" DROP COLUMN "created_at",
DROP COLUMN "progress_json",
DROP COLUMN "updated_at",
DROP COLUMN "user_notes",
ADD COLUMN     "progress_data" JSONB;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "growth_profile",
ADD COLUMN     "concepts_created_in_cycle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "knowledge_graph_schema" JSONB,
ADD COLUMN     "last_cycle_started_at" TIMESTAMP(3),
ADD COLUMN     "memory_profile" JSONB,
ADD COLUMN     "next_conversation_context_package" JSONB;

-- DropTable
DROP TABLE "annotation_concept_links";

-- DropTable
DROP TABLE "annotations";

-- DropTable
DROP TABLE "challenge_templates";

-- DropTable
DROP TABLE "chunks";

-- DropTable
DROP TABLE "derived_artifact_concept_links";

-- DropTable
DROP TABLE "media";

-- DropTable
DROP TABLE "orb_states";

-- DropTable
DROP TABLE "reflections";

-- CreateTable
CREATE TABLE "cards" (
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "source_entity_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active_canvas',
    "is_favorited" BOOLEAN NOT NULL DEFAULT false,
    "display_data" JSONB,
    "is_synced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "media_items" (
    "media_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "memory_unit_id" TEXT,
    "type" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "filename" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "hash" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "proactive_prompts" (
    "prompt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "source_agent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "proactive_prompts_pkey" PRIMARY KEY ("prompt_id")
);

-- CreateTable
CREATE TABLE "interaction_logs" (
    "interaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interaction_type" TEXT NOT NULL,
    "target_entity_id" TEXT,
    "target_entity_type" TEXT,
    "content_text" TEXT,
    "content_structured" JSONB,
    "metadata" JSONB,

    CONSTRAINT "interaction_logs_pkey" PRIMARY KEY ("interaction_id")
);

-- CreateTable
CREATE TABLE "user_graph_projections" (
    "projection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "projection_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_graph_projections_pkey" PRIMARY KEY ("projection_id")
);

-- CreateIndex
CREATE INDEX "cards_user_id_status_idx" ON "cards"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "media_items_hash_key" ON "media_items"("hash");

-- CreateIndex
CREATE INDEX "user_graph_projections_user_id_created_at_idx" ON "user_graph_projections"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_timestamp_idx" ON "conversation_messages"("conversation_id", "timestamp");

-- CreateIndex
CREATE INDEX "conversations_user_id_status_idx" ON "conversations"("user_id", "status");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "cards"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_units" ADD CONSTRAINT "memory_units_source_conversation_id_fkey" FOREIGN KEY ("source_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_merged_into_concept_id_fkey" FOREIGN KEY ("merged_into_concept_id") REFERENCES "concepts"("concept_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_memory_unit_id_fkey" FOREIGN KEY ("memory_unit_id") REFERENCES "memory_units"("muid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proactive_prompts" ADD CONSTRAINT "proactive_prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derived_artifacts" ADD CONSTRAINT "derived_artifacts_source_concept_id_fkey" FOREIGN KEY ("source_concept_id") REFERENCES "concepts"("concept_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_logs" ADD CONSTRAINT "interaction_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_graph_projections" ADD CONSTRAINT "user_graph_projections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
