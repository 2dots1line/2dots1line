-- Migration: Add generated_media table for AI-generated images and videos
-- Date: 2025-10-13
-- Description: Stores user-generated media (images/videos) with metadata, costs, and generation details

CREATE TABLE IF NOT EXISTS generated_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  prompt TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  view_context VARCHAR(20),
  generation_cost DECIMAL(10,4),
  generation_duration_seconds INTEGER,
  provider VARCHAR(50),
  model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_generated_media_user_media ON generated_media(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_generated_media_created_at ON generated_media(created_at DESC);

-- Comments
COMMENT ON TABLE generated_media IS 'Stores AI-generated media (images and videos) for users';
COMMENT ON COLUMN generated_media.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN generated_media.file_url IS 'Public URL path (e.g., /covers/card-123.png)';
COMMENT ON COLUMN generated_media.file_path IS 'Absolute file system path';
COMMENT ON COLUMN generated_media.prompt IS 'User prompt or motif used for generation';
COMMENT ON COLUMN generated_media.metadata IS 'Additional metadata (style_pack, mood, quality, etc.)';
COMMENT ON COLUMN generated_media.view_context IS 'View where media was generated (chat, cards, dashboard)';
COMMENT ON COLUMN generated_media.generation_cost IS 'Cost in USD for this generation';
COMMENT ON COLUMN generated_media.generation_duration_seconds IS 'Time taken to generate in seconds';

