# 2dots1line V7 Data Schema Design

  

## Overview

  

This document details the database schema design for the 2dots1line V7 implementation. It defines the data models across multiple database engines to support the immersive UI/UX features and the Six-Dimensional Growth Model outlined in the V7 UI/UX Design and Technical Specification.

  

**Last Updated**: May 25, 2025 - Post Audit

  

### Design Principles

  

The V7 data schema is guided by these core principles:

  

1. **Growth model should guide behavior, not hard-code it**

- Dimensions and rules are stored as configuration rather than schema

- Event-driven approach allows for iterative refinement without migrations

- A/B testing of dimensions and scoring formulas becomes possible

  

2. **Gamification needs to stay "alive" and extensible**

- Challenge templates separate from user instances for easy addition of new quests

- Card evolution states are computed dynamically instead of stored

- Rewards implemented as derived artifacts for consistency with other content

  

3. **Data layer should stay lean**

- Heavy computations belong in analytic or cache layers

- Append-only event streams rather than constantly updated tables

- Materialized views for efficient UI access to derived data

  

4. **Configuration over schema**

- Key parameters stored in configuration or code, not database tables

- Flexible JSON for extensible metadata and progress tracking

- Reduced need for migrations when business rules change

  

5. **Clear separation of concerns** (Directive 4)

- PostgreSQL handles core entities and transactional data

- Neo4j manages relationships and graph traversals

- Redundant relationship tables removed to prevent data inconsistency

  

### Polyglot Persistence Approach

  

The V7 data architecture uses a polyglot persistence approach with each store focused on its strengths:

  

1. **PostgreSQL**:

- Core entities: Users, memory units, concepts, derived artifacts

- Event streams: Growth events, user activities, system logs

- Materialized views: Pre-computed for UI performance (mv_entity_growth_progress)

- Content storage: Unified content strategy in memory_units table

  

2. **Neo4j**:

- Knowledge graph: Concept-to-concept relationships

- Semantic network: Memory-to-concept connections

- Connection patterns: Community detection, centrality analysis

- Navigation paths: Traversal for UI visualization

  

3. **Weaviate**:

- Semantic embeddings: Text chunks, concept descriptions

- Multimodal vectors: Image and audio embeddings

- Hybrid search: Combined filter and vector similarity

- Cross-references to primary records via externalId field

  

4. **Redis**:

- Configuration: Growth dimensions, evolution rules

- Real-time state: Orb presence, session information

- Message queues: Processing pipelines, background jobs

- Rate limiting: API usage tracking

  

## Core Data Models

  

### User Data Model

  

**PostgreSQL Schema (Current):**

  

```sql

CREATE TABLE users (

user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

email VARCHAR(255) NOT NULL UNIQUE,

hashed_password VARCHAR(255),

name VARCHAR(255),

preferences JSONB,

region VARCHAR(64) NOT NULL DEFAULT 'us',

timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',

language_preference VARCHAR(8) NOT NULL DEFAULT 'en',

profile_picture_url VARCHAR(1024),

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

last_active_at TIMESTAMP WITH TIME ZONE,

account_status VARCHAR(32) NOT NULL DEFAULT 'active',

growth_profile JSONB, -- Directive 2: Overall user growth summaries

CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')

);

  

CREATE TABLE UserSession (

session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

device_info JSONB,

ip_address VARCHAR(45),

user_agent VARCHAR(1024),

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

);

```

  

### Knowledge Entities

  

**PostgreSQL Schema (Current):**

  

```sql

-- Core memory storage with unified content strategy (Directive 5)

CREATE TABLE memory_units (

muid UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

source_type VARCHAR(64) NOT NULL,

title VARCHAR(255),

content TEXT, -- Processed content storage

content_type VARCHAR(64) NOT NULL DEFAULT 'text',

content_source VARCHAR(64) NOT NULL DEFAULT 'processed', -- Directive 5

original_content TEXT, -- Directive 5: Original unprocessed content

content_processing_notes JSONB, -- Directive 5: Processing metadata

creation_ts TIMESTAMP WITH TIME ZONE NOT NULL,

ingestion_ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

last_modified_ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

processing_status VARCHAR(32) NOT NULL DEFAULT 'raw',

importance_score FLOAT,

is_private BOOLEAN NOT NULL DEFAULT true,

tier INTEGER NOT NULL DEFAULT 1,

metadata JSONB

);

  

-- Text chunks for semantic processing

CREATE TABLE chunks (

cid UUID PRIMARY KEY DEFAULT gen_random_uuid(),

muid UUID NOT NULL REFERENCES memory_units(muid) ON DELETE CASCADE,

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

text TEXT NOT NULL,

sequence_order INTEGER NOT NULL,

role VARCHAR(64),

embedding_id VARCHAR(255),

char_count INTEGER,

token_count INTEGER,

embedding_model VARCHAR(128),

embedding_created_at TIMESTAMP WITH TIME ZONE,

metadata JSONB

);

  

-- Concepts (entities, themes, values, emotions, topics)

CREATE TABLE concepts (

concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

name VARCHAR(255) NOT NULL,

type VARCHAR(64) NOT NULL,

description TEXT,

user_defined BOOLEAN NOT NULL DEFAULT false,

confidence FLOAT,

community_id UUID REFERENCES communities(community_id),

embedding_id VARCHAR(255),

ontology_version VARCHAR(32),

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

last_updated_ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

metadata JSONB,

CONSTRAINT unique_concept_per_user UNIQUE (user_id, name, type)

);

  

-- Derived artifacts (insights, summaries, etc.)

CREATE TABLE derived_artifacts (

artifact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

artifact_type VARCHAR(64) NOT NULL,

title VARCHAR(255),

content_json JSONB NOT NULL,

user_feedback_score INTEGER,

user_feedback_comment TEXT,

generated_by_agent VARCHAR(128),

agent_version VARCHAR(32),

generation_parameters JSONB,

source_memory_unit_id UUID REFERENCES memory_units(muid) ON DELETE SET NULL,

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

);

```

  

### Six-Dimensional Growth Model (Post-Directive Implementation)

  

**PostgreSQL Schema (Current):**

  

```sql

-- Growth events stream (append-only, Directive 1 & 3)

CREATE TABLE growth_events (

event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

entity_id UUID NOT NULL, -- ID of related entity (concept, memory, artifact)

entity_type VARCHAR(64) NOT NULL, -- 'concept', 'memory', 'artifact'

dim_key VARCHAR(32) NOT NULL, -- 'self_know', 'world_act', etc.

delta FLOAT NOT NULL, -- Change in dimension (+0.1, -0.05, etc.)

source VARCHAR(128) NOT NULL, -- 'journal_entry', 'challenge_complete', etc.

created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

);

  

-- Materialized view for efficient UI access (Directive 2)

CREATE MATERIALIZED VIEW mv_entity_growth_progress AS

SELECT

user_id,

entity_id,

entity_type,

dim_key,

SUM(delta) AS score,

COUNT(*) AS event_count,

MAX(created_at) AS last_event_ts

FROM growth_events

GROUP BY user_id, entity_id, entity_type, dim_key;

  

-- Computed view for card evolution states

CREATE VIEW v_card_evolution_state AS

SELECT

c.concept_id AS entity_id,

c.user_id,

'concept' AS entity_type,

c.name AS card_title,

CASE

WHEN COALESCE(cs.conn_cnt, 0) >= 5 THEN 'constellation'

WHEN COALESCE(gs.dim_cnt, 0) >= 3 THEN 'bloom'

WHEN COALESCE(gs.dim_cnt, 0) >= 1 THEN 'sprout'

ELSE 'seed'

END AS evolution_state

FROM concepts c

LEFT JOIN (

SELECT entity_id, user_id, COUNT(DISTINCT dim_key) AS dim_cnt

FROM mv_entity_growth_progress meg

WHERE meg.entity_type = 'concept' AND meg.score > 0

GROUP BY entity_id, user_id

) gs ON c.concept_id = gs.entity_id AND c.user_id = gs.user_id;

```

  

**Key Changes from Directive Implementation:**

  

1. **Directive 1**: Strategic entity filtering in IngestionAnalyst

2. **Directive 2**: Clear separation between `users.growth_profile` (dashboard) and `mv_entity_growth_progress` (per-entity)

3. **Directive 3**: Growth rules externalized to configuration files

4. **Directive 4**: Removed redundant tables (`concept_relationships`, `user_perceived_concepts`)

5. **Directive 5**: Unified content storage strategy in `memory_units` table

  

### Removed Tables (Directive 4)

  

The following tables were removed to eliminate redundancy with Neo4j:

  

- ~~`concept_relationships`~~ → Managed in Neo4j

- ~~`user_perceived_concepts`~~ → Managed in Neo4j

- ~~`raw_content`~~ → Consolidated into `memory_units.original_content`

  

### Configuration Management (Directive 3)

  

Growth model rules are now externalized to configuration files:

  

**File**: `services/cognitive-hub/config/growth_model_rules.json`

  

```json

{

"version": "1.0.0",

"dimensions": {

"self_know": {

"name": "Self-Knowing",

"description": "Understanding your inner world",

"activation_threshold": 0.1,

"mastery_threshold": 1.0

},

"self_act": {

"name": "Self-Acting",

"description": "Taking action on self-knowledge",

"activation_threshold": 0.1,

"mastery_threshold": 1.0

}

// ... other dimensions

},

"concept_mappings": {

"emotion": ["self_know"],

"value": ["self_know"],

"goal": ["self_show", "world_act"],

"skill": ["self_act"]

// ... other mappings

},

"evolution_criteria": {

"sprout": { "min_dimensions": 1 },

"bloom": { "min_dimensions": 3 },

"constellation": { "min_dimensions": 5, "min_connections": 3 },

"supernova": { "min_dimensions": 6, "min_connections": 5 }

}

}

```

  

## Data Model Relationships

  

### Growth Model Integration

  

The Six-Dimensional Growth Model is integrated across the data model:

  

1. **Growth Dimensions** (PostgreSQL): Define the six dimensions (Self/World × Know/Act/Show)

2. **Entity Growth Progress** (PostgreSQL): Track progress for each entity across dimensions

3. **Card Evolution States** (PostgreSQL): Track card evolution from seed to supernova

4. **Growth Challenges** (PostgreSQL): Tasks to advance growth in specific dimensions

5. **Neo4j Integration**: Growth dimensions are tracked as node properties for visualization

6. **Vector Search Integration**: Evolution state and growth dimensions as searchable properties

  

### Card Gallery Integration

  

The Card Gallery system is built on:

  

1. **Entity Core Data** (PostgreSQL): Basic information about concepts, memories, artifacts

2. **Growth Progress** (PostgreSQL): Dimension-specific progress for cards

3. **Evolution States** (PostgreSQL): Visual state of cards based on growth and connections

4. **Entity Relationships** (Neo4j): Connections between cards for visualization

5. **Vector Embeddings** (Weaviate): Semantic search and clustering of cards

6. **Real-time Updates** (Redis): Card state changes and evolution events

  

### 3D Visualization Support

  

Data structures supporting 3D visualization:

  

1. **Graph Nodes and Relationships** (Neo4j): Knowledge graph structure

2. **Graph Visual Properties** (Neo4j): Node and relationship visual attributes

3. **Node Clustering** (Neo4j & PostgreSQL): Grouping nodes for visualization

4. **Orb States** (PostgreSQL & Redis): Visual and emotional states of the Orb

5. **Scene State** (Redis): Active scene and transition information

6. **Viewport State** (Redis): User's current view position and focus

  

## Query Patterns

  

### Growth Dimension Queries

  

**Get a Card's Growth Dimensions:**

  

```sql

-- PostgreSQL

-- First, get the growth scores for this entity

SELECT

eg.dim_key,

eg.score,

COALESCE(cd.description, 'Dimension description') AS description,

COALESCE(cd.color, '#808080') AS color,

COALESCE(

(SELECT source FROM growth_events

WHERE entity_id = $entity_id AND dim_key = eg.dim_key

ORDER BY created_at DESC LIMIT 1),

'unknown'

) AS last_source

FROM mv_entity_growth_progress eg

LEFT JOIN config.dimensions cd ON eg.dim_key = cd.dim_key

WHERE eg.entity_id = $entity_id AND eg.entity_type = $entity_type

ORDER BY eg.dim_key;

```

  

**Get User's Overall Growth Summary:**

  

```sql

-- PostgreSQL

SELECT

eg.dim_key,

SUM(eg.score) as total_score,

COUNT(DISTINCT eg.entity_id) as entity_count,

MAX(ge.created_at) as last_activity

FROM users u

LEFT JOIN growth_events ge ON u.user_id = ge.user_id

LEFT JOIN mv_entity_growth_progress eg ON eg.entity_id = ge.entity_id AND eg.dim_key = ge.dim_key

WHERE u.user_id = $user_id

GROUP BY eg.dim_key;

```

  

### Card Connections and Evolution

  

**Find Card Connections in Knowledge Graph:**

  

```cypher

// Neo4j

MATCH (source {id: $card_id, user_id: $user_id})

MATCH (source)-[r]-(target)

WHERE target.user_id = $user_id

RETURN source, r, target

```

  

**Update Card Evolution State:**

  

```sql

-- PostgreSQL

-- Get card evolution state from the view directly

SELECT

entity_id,

entity_type,

evolution_state

FROM v_card_evolution_state

WHERE entity_id = $entity_id AND entity_type = 'concept';

  

-- No need to update as it's a computed view that always reflects current state

-- The evolution state is derived from:

-- 1. Connection count from Neo4j graph data

-- 2. Dimension count from the growth_events table

-- This eliminates the need for background job updates

```

  

### Semantic Search and Retrieval

  

**Vector Search for Relevant Cards:**

  

```json

// Weaviate

{

"query": {

"Get": {

"UserConcept": {

"nearText": {

"concepts": ["creativity", "inspiration"],

"certainty": 0.7

},

"where": {

"operator": "Equal",

"path": ["userId"],

"valueString": "user-123"

},

"limit": 10

}

}

}

}

```

  

**Hybrid Search (Vector + Graph):**

  

1. First, search for semantically similar cards in Weaviate:

  

```json

// Weaviate

{

"query": {

"Get": {

"UserConcept": {

"nearText": {

"concepts": ["personal growth", "self-improvement"],

"certainty": 0.7

},

"where": {

"operator": "Equal",

"path": ["userId"],

"valueString": "user-123"

},

"limit": 5,

"fields": ["conceptId"]

}

}

}

}

```

  

2. Then, expand with graph relationships in Neo4j:

  

```cypher

// Neo4j

MATCH (c:Concept)

WHERE c.id IN $concept_ids AND c.user_id = $user_id

OPTIONAL MATCH (c)-[r]-(related)

WHERE related.user_id = $user_id

RETURN c, r, related

```

  

### Real-time State Management

  

**Update Orb State:**

  

```javascript

// Redis Operations

// 1. Get current state

redis.get(`user:${userId}:orb:state`);

  

// 2. Update state

redis.set(`user:${userId}:orb:state`, JSON.stringify({

visual_state: "speaking",

emotional_tone: "excited",

energy_level: 0.8,

is_speaking: true,

effects: [{ id: "effect-123", type: "particles", /* ... */ }]

}));

  

// 3. Publish state change event

redis.publish(`user:${userId}:orb_state`, JSON.stringify({

visual_state: "speaking",

emotional_tone: "excited",

energy_level: 0.8,

timestamp: Date.now()

}));

```

  

**Scene Transition:**

  

```javascript

// Redis Operations

// 1. Get current scene

const currentScene = await redis.get(`user:${userId}:scene:active`);

  

// 2. Update scene

await redis.set(`user:${userId}:scene:active`, "graph");

  

// 3. Publish transition event

await redis.publish(`user:${userId}:scene`, JSON.stringify({

from: currentScene,

to: "graph",

transition_type: "zoom",

focus_entity: "concept-456",

timestamp: Date.now()

}));

```

  

## Migration Strategy

  

### Migrating from V4 to V7

  

The migration from V4 to V7 involves:

  

1. **Schema Expansion:** Add new tables for Growth Model, Evolution States, etc.

2. **Data Transformation:**

- Convert existing entities to the V7 card model

- Initialize growth dimensions for existing cards

- Set initial evolution states based on existing data

3. **Vector Re-embedding:** Create embeddings for all entities in Weaviate

4. **Graph Enrichment:** Enhance the Neo4j graph with visual properties

  

**Migration Steps:**

  

1. **Preparation**

- Create backup of V4 databases

- Deploy V7 schema with foreign key constraints disabled

  

2. **Core Data Migration**

- Migrate users and authentication data

- Migrate basic entity data with UUIDs preserved

  

3. **Growth Model Initialization**

- Create growth dimensions (predefined)

- Initialize entity growth progress records (default to 'unactivated')

- Analyze existing data to set initial growth values where applicable

  

4. **Graph and Vector Migration**

- Migrate Neo4j relationships with enhanced properties

- Create vector embeddings for all entities in Weaviate

  

5. **Validation**

- Verify data integrity with consistency checks

- Test sample queries and data access patterns

  

**Migration SQL Example:**

  

```sql

-- Create growth events for existing concepts

INSERT INTO growth_events (

event_id, user_id, entity_id, entity_type, dim_key,

delta, source, created_at

)

SELECT

gen_random_uuid(), c.user_id, c.concept_id, 'concept', d.dim_key,

0.1, 'migration', NOW()

FROM concepts c

CROSS JOIN (

SELECT dim_key FROM UNNEST(ARRAY['self_know', 'self_act', 'self_show',

'world_know', 'world_act', 'world_show']) AS dim_key

) d

WHERE EXISTS (

-- Only add events for concepts that have some connections

-- or other indicators of dimension activity

SELECT 1 FROM graph_connections gc

WHERE gc.entity_id = c.concept_id

LIMIT 1

);

  

-- Update user growth profiles based on events

UPDATE users u

SET growth_profile = (

SELECT jsonb_object_agg(dim_key, SUM(delta))

FROM growth_events ge

WHERE ge.user_id = u.user_id

GROUP BY dim_key

)

WHERE EXISTS (

SELECT 1 FROM growth_events ge WHERE ge.user_id = u.user_id

);

  

-- Populate materialized view for entity growth

REFRESH MATERIALIZED VIEW mv_entity_growth_progress;

  

-- Create the v_card_evolution_state view for evolution states

CREATE VIEW v_card_evolution_state AS

SELECT

c.concept_id AS entity_id,

c.user_id,

CASE

WHEN conn_cnt >= 5 THEN 'constellation'

WHEN dim_cnt >= 3 THEN 'bloom'

WHEN dim_cnt >= 1 THEN 'sprout'

ELSE 'seed'

END AS evolution_state

FROM concepts c

LEFT JOIN (

-- Connection count from Neo4j or graph_connections

SELECT entity_id, COUNT(*) AS conn_cnt

FROM graph_connections

GROUP BY entity_id

) cs ON c.concept_id = cs.entity_id

LEFT JOIN (

-- Dimension count from materialized view

SELECT entity_id, COUNT(DISTINCT dim_key) AS dim_cnt

FROM mv_entity_growth_progress

WHERE score > 0

GROUP BY entity_id

) gs ON c.concept_id = gs.entity_id;

```

  

## Conclusion

  

The V7 Data Schema Design provides a streamlined, event-driven foundation for implementing the immersive UI/UX features and Six-Dimensional Growth Model described in the V7 UI/UX Design. The polyglot persistence approach leverages the strengths of multiple database technologies while keeping the core schema lean and flexible.

  

Key features of the design include:

  

1. **Event-Sourced Growth Model:** An append-only ledger of growth events that maintains history and enables flexible recalculation

2. **Computed Card Evolution:** Dynamic derivation of card states from connection and dimension data

3. **Configuration Over Schema:** Moving dimension definitions and rules into configuration rather than database tables

4. **Real-time State Management:** Fast access to Orb and scene state information

5. **Semantic + Graph Search:** Combined vector and graph queries for rich retrieval

6. **Performance Optimization:** Materialized views and caching for real-time responsiveness

  

This schema design enables all the core features of the 2dots1line V7 system while providing a robust foundation for future extensions and enhancements without requiring schema changes. The event-sourcing approach also preserves historical data for analytics and allows for flexible recalculation of derived metrics.