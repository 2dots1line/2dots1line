-- Add proactive_greeting and forward_looking_context fields to conversations table
-- This separates the context storage from user table to prevent conflicts between workers

ALTER TABLE "conversations" ADD COLUMN "proactive_greeting" TEXT;
ALTER TABLE "conversations" ADD COLUMN "forward_looking_context" JSONB;

-- Add indexes for efficient querying
CREATE INDEX "conversations_user_id_updated_at_idx" ON "conversations" ("user_id", "updated_at" DESC);
CREATE INDEX "conversations_status_updated_at_idx" ON "conversations" ("status", "updated_at" DESC);
