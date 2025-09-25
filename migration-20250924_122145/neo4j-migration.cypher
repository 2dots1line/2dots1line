// V11.0 Field Naming Standardization - Neo4j Migration
// This script standardizes field names across all node types

// Step 1: Add standardized fields to all entity types
// Concepts: Standardize existing fields
MATCH (c:Concept)
SET c.entity_id = c.id,
    c.user_id = c.userId,
    c.entity_type = 'concept',
    c.title = c.name,
    c.content = c.description,
    c.type = c.type,
    c.status = c.status,
    c.created_at = c.created_at,
    c.updated_at = c.updatedAt;

// MemoryUnits: Add missing fields, standardize existing
MATCH (m:MemoryUnit)
SET m.entity_id = m.muid,
    m.user_id = m.userId,
    m.entity_type = 'memory_unit',
    m.title = m.title,
    m.content = m.content,
    m.type = 'memory',
    m.status = 'active',
    m.created_at = m.creation_ts,
    m.updated_at = m.updatedAt;

// DerivedArtifacts: Standardize field names
MATCH (d:DerivedArtifact)
SET d.entity_id = d.artifact_id,
    d.user_id = d.userId,
    d.entity_type = 'derived_artifact',
    d.title = d.title,
    d.content = d.content_narrative,
    d.type = d.artifact_type,
    d.status = 'active',
    d.created_at = d.created_at;

// ProactivePrompts: Standardize field names
MATCH (p:ProactivePrompt)
SET p.entity_id = p.prompt_id,
    p.user_id = p.userId,
    p.entity_type = 'proactive_prompt',
    p.title = p.prompt_text,
    p.content = p.prompt_text,
    p.type = p.prompt_type,
    p.status = 'pending',
    p.created_at = p.created_at;

// Communities: Standardize field names
MATCH (c:Community)
SET c.entity_id = c.community_id,
    c.user_id = c.userId,
    c.entity_type = 'community',
    c.title = c.name,
    c.content = c.description,
    c.type = 'community',
    c.status = 'active',
    c.created_at = c.created_at;

// Step 2: Update constraints to use entity_id
DROP CONSTRAINT concept_id_unique IF EXISTS;
DROP CONSTRAINT memoryunit_muid_unique IF EXISTS;
DROP CONSTRAINT derivedartifact_id_unique IF EXISTS;
DROP CONSTRAINT proactiveprompt_prompt_id_unique IF EXISTS;
DROP CONSTRAINT community_community_id_unique IF EXISTS;

CREATE CONSTRAINT concept_entity_id_unique FOR (n:Concept) REQUIRE n.entity_id IS UNIQUE;
CREATE CONSTRAINT memoryunit_entity_id_unique FOR (n:MemoryUnit) REQUIRE n.entity_id IS UNIQUE;
CREATE CONSTRAINT derivedartifact_entity_id_unique FOR (n:DerivedArtifact) REQUIRE n.entity_id IS UNIQUE;
CREATE CONSTRAINT proactiveprompt_entity_id_unique FOR (n:ProactivePrompt) REQUIRE n.entity_id IS UNIQUE;
CREATE CONSTRAINT community_entity_id_unique FOR (n:Community) REQUIRE n.entity_id IS UNIQUE;

// Step 3: Update indexes to use standardized field names
DROP INDEX concept_userId_idx IF EXISTS;
DROP INDEX concept_name_idx IF EXISTS;
DROP INDEX memoryunit_userId_idx IF EXISTS;
DROP INDEX memoryunit_creation_ts_idx IF EXISTS;
DROP INDEX derivedartifact_userId_idx IF EXISTS;
DROP INDEX community_userId_idx IF EXISTS;
DROP INDEX proactiveprompt_userId_idx IF EXISTS;

CREATE INDEX user_id_idx FOR (n) ON (n.user_id);
CREATE INDEX entity_type_idx FOR (n) ON (n.entity_type);
CREATE INDEX type_idx FOR (n) ON (n.type);
CREATE INDEX status_idx FOR (n) ON (n.status);
CREATE INDEX created_at_idx FOR (n) ON (n.created_at);

// Step 4: Remove old properties (after validation)
MATCH (c:Concept)
REMOVE c.id, c.userId, c.name, c.description, c.updatedAt;

MATCH (m:MemoryUnit)
REMOVE m.muid, m.userId, m.creation_ts, m.updatedAt;

MATCH (d:DerivedArtifact)
REMOVE d.artifact_id, d.userId, d.content_narrative, d.artifact_type;

MATCH (p:ProactivePrompt)
REMOVE p.prompt_id, p.userId, p.prompt_text, p.prompt_type;

MATCH (c:Community)
REMOVE c.community_id, c.userId, c.name, c.description, c.last_analyzed_ts;
