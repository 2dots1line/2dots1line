-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT,
    "name" TEXT,
    "preferences" JSONB,
    "region" TEXT NOT NULL DEFAULT 'us',
    "timezone" TEXT DEFAULT 'UTC',
    "language_preference" TEXT DEFAULT 'en',
    "profile_picture_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3),
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "growth_profile" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "memory_units" (
    "muid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "content_type" TEXT NOT NULL DEFAULT 'text',
    "original_content" TEXT,
    "content_source" TEXT NOT NULL DEFAULT 'processed',
    "content_processing_notes" JSONB,
    "creation_ts" TIMESTAMP(3) NOT NULL,
    "ingestion_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_ts" TIMESTAMP(3) NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'raw',
    "importance_score" DOUBLE PRECISION,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,

    CONSTRAINT "memory_units_pkey" PRIMARY KEY ("muid")
);

-- CreateTable
CREATE TABLE "chunks" (
    "cid" TEXT NOT NULL,
    "muid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "role" TEXT,
    "embedding_id" TEXT,
    "char_count" INTEGER,
    "token_count" INTEGER,
    "embedding_model" TEXT,
    "embedding_created_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "chunks_pkey" PRIMARY KEY ("cid")
);

-- CreateTable
CREATE TABLE "concepts" (
    "concept_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "user_defined" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "community_id" TEXT,
    "embedding_id" TEXT,
    "ontology_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_ts" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("concept_id")
);

-- CreateTable
CREATE TABLE "communities" (
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "detection_method" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_analyzed_ts" TIMESTAMP(3),

    CONSTRAINT "communities_pkey" PRIMARY KEY ("community_id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "muid" TEXT,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "hash_value" TEXT,
    "caption" TEXT,
    "extracted_text" TEXT,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "embedding_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotations" (
    "aid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_node_type" TEXT NOT NULL,
    "annotation_type" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_ts" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "derived_artifacts" (
    "artifact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "title" TEXT,
    "content_json" JSONB NOT NULL,
    "user_feedback_score" INTEGER,
    "user_feedback_comment" TEXT,
    "generated_by_agent" TEXT,
    "agent_version" TEXT,
    "generation_parameters" JSONB,
    "source_memory_unit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "derived_artifacts_pkey" PRIMARY KEY ("artifact_id")
);

-- CreateTable
CREATE TABLE "derived_artifact_concept_links" (
    "id" TEXT NOT NULL,
    "derived_artifact_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "relationship_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "derived_artifact_concept_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annotation_concept_links" (
    "id" TEXT NOT NULL,
    "annotation_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_concept_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_templates" (
    "challenge_template_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "difficulty_level" INTEGER,
    "estimated_duration_days" INTEGER,
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "tasks_json" JSONB NOT NULL,
    "rewards_json" JSONB,
    "dim_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_templates_pkey" PRIMARY KEY ("challenge_template_id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "user_challenge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_template_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_time" TIMESTAMP(3),
    "progress_json" JSONB,
    "user_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("user_challenge_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "title" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_time" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "context_summary" TEXT,
    "metadata" JSONB,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "message_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "media_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggested_actions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_status" TEXT NOT NULL DEFAULT 'pending_ingestion',
    "associated_muid" TEXT,
    "retrieval_context_summary" TEXT,
    "user_feedback_on_response" TEXT,
    "metadata" JSONB,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "growth_events" (
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "dim_key" TEXT NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "growth_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "reflection_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "memory_unit_id" TEXT,
    "title" TEXT,
    "content_text" TEXT NOT NULL,
    "reflection_type" TEXT NOT NULL DEFAULT 'journal_prompt_response',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sentiment" DOUBLE PRECISION,
    "insights" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("reflection_id")
);

-- CreateTable
CREATE TABLE "orb_states" (
    "orb_state_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visual_state" TEXT,
    "emotional_tone" TEXT,
    "energy_level" DOUBLE PRECISION,
    "is_speaking" BOOLEAN,
    "current_activity" TEXT,
    "active_effects" JSONB,
    "metadata" JSONB,

    CONSTRAINT "orb_states_pkey" PRIMARY KEY ("orb_state_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_region_idx" ON "users"("region");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "memory_units_user_id_creation_ts_idx" ON "memory_units"("user_id", "creation_ts" DESC);

-- CreateIndex
CREATE INDEX "memory_units_user_id_processing_status_idx" ON "memory_units"("user_id", "processing_status");

-- CreateIndex
CREATE INDEX "memory_units_user_id_source_type_idx" ON "memory_units"("user_id", "source_type");

-- CreateIndex
CREATE INDEX "memory_units_user_id_importance_score_idx" ON "memory_units"("user_id", "importance_score");

-- CreateIndex
CREATE INDEX "chunks_muid_sequence_order_idx" ON "chunks"("muid", "sequence_order");

-- CreateIndex
CREATE INDEX "chunks_user_id_idx" ON "chunks"("user_id");

-- CreateIndex
CREATE INDEX "chunks_embedding_id_idx" ON "chunks"("embedding_id");

-- CreateIndex
CREATE INDEX "concepts_user_id_type_idx" ON "concepts"("user_id", "type");

-- CreateIndex
CREATE INDEX "concepts_user_id_name_idx" ON "concepts"("user_id", "name");

-- CreateIndex
CREATE INDEX "concepts_community_id_idx" ON "concepts"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_user_id_name_type_key" ON "concepts"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "communities_user_id_idx" ON "communities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_hash_value_key" ON "media"("hash_value");

-- CreateIndex
CREATE INDEX "media_muid_idx" ON "media"("muid");

-- CreateIndex
CREATE INDEX "media_user_id_idx" ON "media"("user_id");

-- CreateIndex
CREATE INDEX "media_user_id_type_idx" ON "media"("user_id", "type");

-- CreateIndex
CREATE INDEX "media_user_id_hash_value_idx" ON "media"("user_id", "hash_value");

-- CreateIndex
CREATE INDEX "annotations_user_id_target_id_target_node_type_idx" ON "annotations"("user_id", "target_id", "target_node_type");

-- CreateIndex
CREATE INDEX "annotations_user_id_annotation_type_idx" ON "annotations"("user_id", "annotation_type");

-- CreateIndex
CREATE INDEX "annotations_source_idx" ON "annotations"("source");

-- CreateIndex
CREATE INDEX "derived_artifacts_user_id_artifact_type_idx" ON "derived_artifacts"("user_id", "artifact_type");

-- CreateIndex
CREATE INDEX "derived_artifacts_user_id_created_at_idx" ON "derived_artifacts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "derived_artifacts_source_memory_unit_id_idx" ON "derived_artifacts"("source_memory_unit_id");

-- CreateIndex
CREATE INDEX "derived_artifact_concept_links_derived_artifact_id_idx" ON "derived_artifact_concept_links"("derived_artifact_id");

-- CreateIndex
CREATE INDEX "derived_artifact_concept_links_concept_id_idx" ON "derived_artifact_concept_links"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "derived_artifact_concept_links_derived_artifact_id_concept__key" ON "derived_artifact_concept_links"("derived_artifact_id", "concept_id", "relationship_type");

-- CreateIndex
CREATE UNIQUE INDEX "annotation_concept_links_annotation_id_concept_id_key" ON "annotation_concept_links"("annotation_id", "concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_templates_template_name_key" ON "challenge_templates"("template_name");

-- CreateIndex
CREATE INDEX "challenge_templates_category_idx" ON "challenge_templates"("category");

-- CreateIndex
CREATE INDEX "user_challenges_user_id_status_idx" ON "user_challenges"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_challenges_user_id_challenge_template_id_idx" ON "user_challenges"("user_id", "challenge_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_session_id_key" ON "conversations"("session_id");

-- CreateIndex
CREATE INDEX "conversations_user_id_last_active_time_idx" ON "conversations"("user_id", "last_active_time" DESC);

-- CreateIndex
CREATE INDEX "conversations_session_id_idx" ON "conversations"("session_id");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_created_at_idx" ON "conversation_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "conversation_messages_user_id_created_at_idx" ON "conversation_messages"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_messages_associated_muid_idx" ON "conversation_messages"("associated_muid");

-- CreateIndex
CREATE INDEX "growth_events_user_id_created_at_idx" ON "growth_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "growth_events_user_id_entity_id_entity_type_idx" ON "growth_events"("user_id", "entity_id", "entity_type");

-- CreateIndex
CREATE INDEX "growth_events_user_id_dim_key_idx" ON "growth_events"("user_id", "dim_key");

-- CreateIndex
CREATE INDEX "reflections_user_id_created_at_idx" ON "reflections"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reflections_memory_unit_id_idx" ON "reflections"("memory_unit_id");

-- CreateIndex
CREATE INDEX "orb_states_user_id_timestamp_idx" ON "orb_states"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "orb_states_conversation_id_idx" ON "orb_states"("conversation_id");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_units" ADD CONSTRAINT "memory_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_muid_fkey" FOREIGN KEY ("muid") REFERENCES "memory_units"("muid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("community_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_muid_fkey" FOREIGN KEY ("muid") REFERENCES "memory_units"("muid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derived_artifacts" ADD CONSTRAINT "derived_artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derived_artifacts" ADD CONSTRAINT "derived_artifacts_source_memory_unit_id_fkey" FOREIGN KEY ("source_memory_unit_id") REFERENCES "memory_units"("muid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derived_artifact_concept_links" ADD CONSTRAINT "derived_artifact_concept_links_derived_artifact_id_fkey" FOREIGN KEY ("derived_artifact_id") REFERENCES "derived_artifacts"("artifact_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derived_artifact_concept_links" ADD CONSTRAINT "derived_artifact_concept_links_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("concept_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_concept_links" ADD CONSTRAINT "annotation_concept_links_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "annotations"("aid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_concept_links" ADD CONSTRAINT "annotation_concept_links_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("concept_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_template_id_fkey" FOREIGN KEY ("challenge_template_id") REFERENCES "challenge_templates"("challenge_template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_associated_muid_fkey" FOREIGN KEY ("associated_muid") REFERENCES "memory_units"("muid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_events" ADD CONSTRAINT "growth_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_memory_unit_id_fkey" FOREIGN KEY ("memory_unit_id") REFERENCES "memory_units"("muid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orb_states" ADD CONSTRAINT "orb_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orb_states" ADD CONSTRAINT "orb_states_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE SET NULL ON UPDATE CASCADE;
