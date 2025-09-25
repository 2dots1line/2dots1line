-- V11.0 Field Naming Standardization - PostgreSQL Migration
-- This script standardizes field names across all tables

-- 1. concepts table migration
ALTER TABLE concepts ADD COLUMN title TEXT;
ALTER TABLE concepts ADD COLUMN content TEXT;
ALTER TABLE concepts ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE concepts ADD COLUMN importance_score FLOAT;

UPDATE concepts SET title = name;
UPDATE concepts SET content = description WHERE description IS NOT NULL;
UPDATE concepts SET updated_at = last_updated_ts WHERE last_updated_ts IS NOT NULL;
UPDATE concepts SET importance_score = salience WHERE salience IS NOT NULL;

ALTER TABLE concepts ALTER COLUMN title SET NOT NULL;
ALTER TABLE concepts RENAME COLUMN concept_id TO entity_id;

ALTER TABLE concepts DROP COLUMN name;
ALTER TABLE concepts DROP COLUMN description;
ALTER TABLE concepts DROP COLUMN last_updated_ts;
ALTER TABLE concepts DROP COLUMN salience;

-- 2. memory_units table migration
ALTER TABLE memory_units ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE memory_units ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE memory_units ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE memory_units ADD COLUMN type TEXT;

UPDATE memory_units SET created_at = creation_ts;
UPDATE memory_units SET updated_at = last_modified_ts;

ALTER TABLE memory_units ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE memory_units ALTER COLUMN status SET NOT NULL;
ALTER TABLE memory_units RENAME COLUMN muid TO entity_id;

ALTER TABLE memory_units DROP COLUMN creation_ts;
ALTER TABLE memory_units DROP COLUMN last_modified_ts;
ALTER TABLE memory_units DROP COLUMN ingestion_ts;

-- 3. derived_artifacts table migration
ALTER TABLE derived_artifacts ADD COLUMN content TEXT;
ALTER TABLE derived_artifacts ADD COLUMN type TEXT;
ALTER TABLE derived_artifacts ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE derived_artifacts ADD COLUMN status TEXT DEFAULT 'active';

UPDATE derived_artifacts SET content = content_narrative WHERE content_narrative IS NOT NULL;
UPDATE derived_artifacts SET type = artifact_type;

ALTER TABLE derived_artifacts ALTER COLUMN type SET NOT NULL;
ALTER TABLE derived_artifacts ALTER COLUMN status SET NOT NULL;
ALTER TABLE derived_artifacts RENAME COLUMN artifact_id TO entity_id;

ALTER TABLE derived_artifacts DROP COLUMN content_narrative;
ALTER TABLE derived_artifacts DROP COLUMN artifact_type;

-- 4. proactive_prompts table migration
ALTER TABLE proactive_prompts ADD COLUMN content TEXT;
ALTER TABLE proactive_prompts ADD COLUMN type TEXT;
ALTER TABLE proactive_prompts ADD COLUMN updated_at TIMESTAMP;

UPDATE proactive_prompts SET content = prompt_text;
UPDATE proactive_prompts SET type = metadata->>'prompt_type' WHERE metadata->>'prompt_type' IS NOT NULL;
UPDATE proactive_prompts SET type = 'engagement' WHERE type IS NULL;

ALTER TABLE proactive_prompts ALTER COLUMN content SET NOT NULL;
ALTER TABLE proactive_prompts ALTER COLUMN type SET NOT NULL;
ALTER TABLE proactive_prompts RENAME COLUMN prompt_id TO entity_id;

ALTER TABLE proactive_prompts DROP COLUMN prompt_text;
ALTER TABLE proactive_prompts DROP COLUMN source_agent;

-- 5. communities table migration
ALTER TABLE communities ADD COLUMN title TEXT;
ALTER TABLE communities ADD COLUMN content TEXT;
ALTER TABLE communities ADD COLUMN type TEXT;
ALTER TABLE communities ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE communities ADD COLUMN status TEXT DEFAULT 'active';

UPDATE communities SET title = name;
UPDATE communities SET content = description WHERE description IS NOT NULL;

ALTER TABLE communities ALTER COLUMN title SET NOT NULL;
ALTER TABLE communities ALTER COLUMN status SET NOT NULL;
ALTER TABLE communities RENAME COLUMN community_id TO entity_id;

ALTER TABLE communities DROP COLUMN name;
ALTER TABLE communities DROP COLUMN description;
ALTER TABLE communities DROP COLUMN last_analyzed_ts;

-- 6. conversations table migration
ALTER TABLE conversations ADD COLUMN content TEXT;
ALTER TABLE conversations ADD COLUMN type TEXT;

UPDATE conversations SET content = context_summary WHERE context_summary IS NOT NULL;

ALTER TABLE conversations RENAME COLUMN start_time TO created_at;
ALTER TABLE conversations RENAME COLUMN id TO conversation_id;

ALTER TABLE conversations DROP COLUMN context_summary;

-- 7. conversation_messages table migration
ALTER TABLE conversation_messages ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE conversation_messages ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE conversation_messages ADD COLUMN type TEXT;
ALTER TABLE conversation_messages ADD COLUMN metadata JSONB;

UPDATE conversation_messages SET created_at = timestamp;
UPDATE conversation_messages SET type = role;
UPDATE conversation_messages SET metadata = llm_call_metadata;

ALTER TABLE conversation_messages ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE conversation_messages ALTER COLUMN status SET NOT NULL;
ALTER TABLE conversation_messages ALTER COLUMN type SET NOT NULL;
ALTER TABLE conversation_messages RENAME COLUMN id TO message_id;

ALTER TABLE conversation_messages DROP COLUMN timestamp;
ALTER TABLE conversation_messages DROP COLUMN role;
ALTER TABLE conversation_messages DROP COLUMN llm_call_metadata;

-- 8. growth_events table migration
ALTER TABLE growth_events ADD COLUMN title TEXT;
ALTER TABLE growth_events ADD COLUMN content TEXT;
ALTER TABLE growth_events ADD COLUMN type TEXT;
ALTER TABLE growth_events ADD COLUMN updated_at TIMESTAMP;
ALTER TABLE growth_events ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE growth_events ADD COLUMN source_concept_ids TEXT[] DEFAULT '{}';
ALTER TABLE growth_events ADD COLUMN source_memory_unit_ids TEXT[] DEFAULT '{}';
ALTER TABLE growth_events ADD COLUMN metadata JSONB;

UPDATE growth_events SET type = dimension_key;
UPDATE growth_events SET content = rationale;

ALTER TABLE growth_events ALTER COLUMN content SET NOT NULL;
ALTER TABLE growth_events ALTER COLUMN status SET NOT NULL;
ALTER TABLE growth_events RENAME COLUMN event_id TO entity_id;

ALTER TABLE growth_events DROP COLUMN growth_dimensions;
ALTER TABLE growth_events DROP COLUMN dimension_key;
ALTER TABLE growth_events DROP COLUMN rationale;

-- 9. interaction_logs table migration
ALTER TABLE interaction_logs ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE interaction_logs ADD COLUMN content TEXT;
ALTER TABLE interaction_logs ADD COLUMN type TEXT;

UPDATE interaction_logs SET created_at = timestamp;
UPDATE interaction_logs SET content = content_text WHERE content_text IS NOT NULL;
UPDATE interaction_logs SET type = interaction_type;

ALTER TABLE interaction_logs ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE interaction_logs ALTER COLUMN type SET NOT NULL;

ALTER TABLE interaction_logs DROP COLUMN timestamp;
ALTER TABLE interaction_logs DROP COLUMN content_text;
ALTER TABLE interaction_logs DROP COLUMN interaction_type;

-- 10. user_cycles table migration
ALTER TABLE user_cycles ADD COLUMN type TEXT;
ALTER TABLE user_cycles ADD COLUMN created_at TIMESTAMP;
ALTER TABLE user_cycles ADD COLUMN ended_at TIMESTAMP;

UPDATE user_cycles SET type = cycle_type;
UPDATE user_cycles SET created_at = cycle_start_date;
UPDATE user_cycles SET ended_at = cycle_end_date;

ALTER TABLE user_cycles ALTER COLUMN type SET NOT NULL;
ALTER TABLE user_cycles ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE user_cycles DROP COLUMN cycle_type;
ALTER TABLE user_cycles DROP COLUMN cycle_start_date;
ALTER TABLE user_cycles DROP COLUMN cycle_end_date;
ALTER TABLE user_cycles DROP COLUMN job_id;
ALTER TABLE user_cycles DROP COLUMN cycle_duration_days;
ALTER TABLE user_cycles DROP COLUMN trigger_source;
ALTER TABLE user_cycles DROP COLUMN processing_duration_ms;
ALTER TABLE user_cycles DROP COLUMN llm_tokens_used;
ALTER TABLE user_cycles DROP COLUMN error_count;
ALTER TABLE user_cycles DROP COLUMN validation_score;
ALTER TABLE user_cycles DROP COLUMN insights_summary;
ALTER TABLE user_cycles DROP COLUMN growth_metrics;
ALTER TABLE user_cycles DROP COLUMN dashboard_ready;
