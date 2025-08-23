-- CreateTable
CREATE TABLE "llm_interactions" (
    "interaction_id" TEXT NOT NULL,
    "worker_type" TEXT NOT NULL,
    "worker_job_id" TEXT,
    "session_id" TEXT,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "message_id" TEXT,
    "source_entity_id" TEXT,
    "model_name" TEXT NOT NULL,
    "temperature" DECIMAL(3,2),
    "max_tokens" INTEGER,
    "prompt_length" INTEGER NOT NULL,
    "prompt_tokens" INTEGER,
    "system_prompt" TEXT,
    "user_prompt" TEXT NOT NULL,
    "full_prompt" TEXT NOT NULL,
    "response_length" INTEGER NOT NULL,
    "response_tokens" INTEGER,
    "raw_response" TEXT NOT NULL,
    "parsed_response" JSONB,
    "finish_reason" TEXT,
    "request_started_at" TIMESTAMP(3) NOT NULL,
    "request_completed_at" TIMESTAMP(3) NOT NULL,
    "processing_time_ms" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "error_code" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_interactions_pkey" PRIMARY KEY ("interaction_id")
);

-- CreateIndex
CREATE INDEX "llm_interactions_user_id_idx" ON "llm_interactions"("user_id");

-- CreateIndex
CREATE INDEX "llm_interactions_worker_type_idx" ON "llm_interactions"("worker_type");

-- CreateIndex
CREATE INDEX "llm_interactions_created_at_idx" ON "llm_interactions"("created_at");

-- CreateIndex
CREATE INDEX "llm_interactions_conversation_id_idx" ON "llm_interactions"("conversation_id");

-- CreateIndex
CREATE INDEX "llm_interactions_status_idx" ON "llm_interactions"("status");

-- AddForeignKey
ALTER TABLE "llm_interactions" ADD CONSTRAINT "llm_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
