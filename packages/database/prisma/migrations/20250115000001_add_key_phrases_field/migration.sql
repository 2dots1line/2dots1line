-- Add key_phrases field to users table for dedicated key phrase storage
ALTER TABLE "users" ADD COLUMN "key_phrases" JSONB;
