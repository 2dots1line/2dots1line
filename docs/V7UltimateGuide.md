Okay, this is a significant integration task! I will synthesize these five detailed documents into a single, coherent V7 "Ultimate" Technical Specification. The goal is to preserve all unique details, resolve any conflicts by prioritizing V7 designs and the event-sourcing/configuration-over-schema philosophy, and organize everything into a logical hierarchy.

Given the volume, I will structure the output thoughtfully.

Here is the integrated 2dots1line V7 Ultimate Technical Specification:

---

# 2dots1line V7 Ultimate Technical Specification

**Document Version:** 7.0 (Integrated)
**Date:** July 5, 2025
**Authors:** AI Collaboration (Claude, Gemini, GPT) with Human Direction (Synthesized by AI)

## Executive Summary

The 2dots1line System is a production-grade knowledge graph platform designed to help users define their identity, find their voice, gain creative agency, and build profound connections with their inner self and the world. It transforms a continuous stream of user inputs (conversations, journal entries, media, documents) into a rich, interconnected personal knowledge model presented through an immersive, emotionally resonant user experience.

This V7 Ultimate Technical Specification consolidates and harmonizes previous design iterations (V4 backend architecture, V7 UI/UX, V7 Data Schema, V7 Monorepo, and the V7 Technical Specification drafts) into a single source of truth. It outlines a system that not only discovers meaningful patterns across semantically and temporally distant data points but presents them in a way that is beautiful, intuitive, and emotionally resonant, grounded in an event-driven, configuration-flexible architecture.

### Core Capabilities

*   **Efficient Multi-Modal Data Ingestion & Knowledge Graph Construction:** Process multi-modal user inputs into structured knowledge with tiered analysis based on significance.
*   **Hybrid Retrieval Intelligence:** Combine vector, graph, and relational queries for nuanced retrieval across the user's knowledge and memory.
*   **Proactive Insight Generation:** Discover patterns, connections, and hypotheses through advanced algorithms and metaphorical reasoning.
*   **Six-Dimensional Growth Framework:** Support holistic user growth across the dimensions of knowing, acting, and showing for both self and world through the card gamification system, driven by an event-sourcing model.
*   **Immersive 3-Layer Interface:** Deliver a seamless user experience through:
    *   **3D Canvas Layer:** Immersive background scenes (CloudScene, AscensionScene, GraphScene) setting emotional tone and visualizing the knowledge graph.
    *   **2D Modal Layer:** Structured UI for content (Card Gallery, Dashboard, Chat) floating over the 3D canvas with glassmorphic design.
    *   **3D Orb:** A responsive, animated presence that embodies the AI assistant (Dot), changing appearance and behavior based on context and user interaction.
*   **Cross-Region Deployment:** Support for both US (AWS/Google AI) and China (Tencent/DeepSeek) markets with appropriate data localization and compliance.
*   **Adaptive Processing Tiers:** Cost-efficient operation through dynamic resource allocation.
*   **Coherent User Experience:** Beautiful, consistent UI across web and mobile platforms.

## 1. System Architecture Overview

### 1.1 Foundational Principles

1.  **Tiered Processing Model:** Multi-level analysis pipeline (lightweight → deep) based on content significance.
2.  **Agent-Tool Paradigm:** Core cognitive agents with well-defined responsibilities + deterministic tool layer.
3.  **Polyglot Persistence:** Strategic use of specialized databases (relational, graph, vector, cache).
4.  **Clear Data Flow Contracts:** Typed payloads and explicit schema contracts between components.
5.  **Regional Adaptability:** Architecture designed for deployment in both US (AWS/Google AI) and China (Tencent/DeepSeek).
6.  **Progressive Enhancement:** System delivers value from day one, with knowledge graph enrichment improving over time.
7.  **UI-Backend Coherence:** Backend state and data directly drive UI elements (Orb behavior, scene transitions, card content, graph visualization).
8.  **Emotional Design Integration:** Technical systems support emotional states, transitions, and expression through the UI.

### 1.2 Refined V7 Design Principles

Building on the foundation above, V7 incorporates these additional design principles:

1.  **Configuration over Schema**: Move static configuration (e.g., growth dimension definitions, evolution rules, UI mappings) out of database tables and into configuration files, Redis, or code. This makes the system more adaptable without requiring schema migrations.
2.  **Event-Sourcing for Growth & Analytics**: Implement an append-only event stream (e.g., `growth_events`) for historical tracking of user progress and system activities, enabling flexible recalculation of aggregated views and robust analytics.
3.  **Dynamic Computation over Static Storage**: Utilize materialized views and computed properties for derived data (e.g., card evolution states, user growth profiles) rather than storing and maintaining redundant, mutable state.
4.  **Distributed Storage by Domain**: Employ the right database technology for each data domain, with clean interfaces and clear data ownership between systems.
5.  **Lean Data Layer**: Keep the core relational schema focused on essential, raw data, with complex processing and analytics handled in dedicated layers or services.
6.  **Strict Vertical vs. Horizontal Separation (Monorepo)**: Front-end "vertical slices" in `apps/*`, shared "horizontal" libraries in `packages/*` with clear dependency direction.
7.  **Binary-Free Source of Truth (Monorepo)**: Store small source assets in Git; optimized artifacts in object storage, processed during build.
8.  **Progressive Service Decomposition**: Start with a monolithic `cognitive-hub` service, decomposing into microservices as justified by traffic patterns, shielded by an API Gateway/BFF.

### 1.3 High-Level Architecture

The architecture integrates a robust backend knowledge system with the immersive 3-layer UI:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE LAYER                           │
│ ┌─────────────────┐  ┌──────────────────────────┐  ┌───────────────────┐  │
│ │  3D CANVAS LAYER│  │     2D MODAL LAYER      │  │   3D ORB LAYER    │  │
│ │ (THREE.js/R3F)  │  │  (React/Next.js/DOM)     │  │  (THREE.js/R3F)   │  │
│ └────────┬────────┘  └──────────────┬───────────┘  └─────────┬─────────┘  │
└──────────┼─────────────────────────┼──────────────────────────┼───────────┘
           │                         │                          │
           │           ┌─────────────▼────────────┐             │
           └───────────►   UI STATE MANAGEMENT    ◄─────────────┘
                       │   (Zustand)              │
                       └────────────┬─────────────┘
                                    │ (API Gateway / BFF)
                       ┌────────────▼─────────────┐
                       │      DIALOGUE AGENT      │
                       │          (DOT)           │
                       └────────────┬─────────────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────────────┐
│                        COGNITIVE AGENT LAYER (Cognitive Hub)              │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│ │  INGESTION  │  │  RETRIEVAL  │  │   INSIGHT   │  │    ONTOLOGY     │    │
│ │   ANALYST   │  │   PLANNER   │  │   ENGINE    │  │     STEWARD     │    │
│ └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │
└────────┼─────────────────┼─────────────────┼───────────────┼──────────────┘
         │                 │                 │               │
┌────────┼─────────────────┼─────────────────┼───────────────┼──────────────┐
│                      DETERMINISTIC TOOLS LAYER                            │
│ ┌───────────────────────────────────────────────────────────────────┐     │
│ │ NER/Vision/Embedding/LLM/Reranking/Stats/Extraction/Summarize     │     │
│ └───────────────────────────────────────────────────────────────────┘     │
└────────┼─────────────────┼─────────────────┼───────────────────┼──────────┘
         │                 │                 │               │
┌────────▼─────────────────▼─────────────────▼───────────────▼──────────────┐
│                         PERSISTENCE LAYER                                 │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│ │ PostgreSQL  │  │   Neo4j     │  │  Weaviate   │  │     Redis       │    │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Core Components

#### 1.4.1 User Interface Layer

1.  **3D Canvas Layer:**
    *   **Purpose:** Creates immersive spatial environments that evoke emotion, provide context, and visualize the knowledge graph.
    *   **Technology:** Three.js with React Three Fiber (R3F) for WebGL rendering.
    *   **Key Scenes:** CloudScene, AscensionScene, GraphScene.

2.  **2D Modal Layer:**
    *   **Purpose:** Provides structured UI elements (cards, dashboards, chat) floating above the 3D canvas, using glassmorphic design.
    *   **Technology:** React components (Next.js) rendered in DOM.
    *   **Key Components:** Card Gallery, Dashboard, Chat Interface, HUD.

3.  **3D Orb Layer:**
    *   **Purpose:** Visual representation of the Dialogue Agent (Dot) as a responsive, non-anthropomorphic presence.
    *   **Technology:** Three.js/R3F with custom shaders.
    *   **Behaviors:** Dynamically changes color, form, motion patterns based on context and interaction state. Rendered above all other UI elements.

4.  **UI State Management:**
    *   **Purpose:** Coordinates state across the three UI layers and communicates with the backend via the API Gateway/BFF.
    *   **Technology:** Zustand for atomic, reactive state management.
    *   **Key Stores:** SceneStore, OrbStore, ModalStore, UserStore, CardGalleryStore, etc.

#### 1.4.2 API Gateway / Backend-For-Frontend (BFF)

*   **Purpose:** Centralizes authentication, API versioning, and client-facing contracts. Shields clients from internal service boundary changes. Optimizes payloads for UI needs.
*   **Technology:** Express.js or similar, supporting GraphQL, tRPC, or REST.

#### 1.4.3 Cognitive Agent Layer (Cognitive Hub)

Initially implemented as a unified `cognitive-hub` service, with agents as modules, to simplify early development. Can be decomposed into microservices later.

1.  **Dialogue Agent (Dot):**
    *   The sole user-facing agent, visually represented by the Orb.
    *   Manages conversations, suggests actions, and drives the Orb's visual/behavioral state.
    *   Interacts with other agents for information retrieval or input processing.
    *   Integrates with the event-driven growth model to track context and progress.

2.  **Ingestion Analyst:**
    *   **Purpose:** Processes inputs into graph-ready elements and drives growth model through selective, strategic concept creation.
    *   **V7 Enhancements:**
        *   Writes to `growth_events` stream instead of directly updating progress tables.
        *   Uses configurable rules (from Redis/config) to determine dimension activation from content.
        *   **Strategic Concept Creation:** Implements two-phase entity processing:
            *   **Phase 1 - Broad NER Detection:** Uses `ner.extract` tool to identify all entity types (PERSON, ORGANIZATION, LOCATION, DATE, EMAIL, PHONE, URL, etc.)
            *   **Phase 2 - Selective Concept Creation:** Applies filtering logic to create `Concept` nodes only for strategically important entities:
                *   **Core Named Entities:** PERSON, ORGANIZATION, LOCATION, DATE (create top-level `Concept` nodes)
                *   **Thematic Concepts:** emotion, value, goal, skill, interest, struggle, life_event_theme (identified via keyword/pattern matching or LLM-based abstract concept extraction)
                *   **Metadata Storage:** Other NER entities (EMAIL, PHONE, URL) stored as structured metadata in `MemoryUnit.attributes` or `Chunk.metadata` JSONB fields
        *   **Growth Event Linkage:** `growth_events` are generated primarily for prioritized `Concept` types that align with the Six-Dimensional Growth Model.
    *   **Tools:** `ner.extract`, `vision.caption`, `embed.queue_job`, `llm.extract_json`, `dedupe.match`.
    *   **Input/Output Example:**
        ```typescript
        // Input: User journal entry
        const input = {
          content: "Had coffee with Sarah at Starbucks. Feeling grateful for our friendship. Want to improve my communication skills.",
          memoryUnitId: "uuid-123"
        };
        
        // Phase 1: NER Detection
        const nerResults = await this.toolRegistry.executeTool('ner.extract', {
          payload: { text_to_analyze: input.content }
        });
        // Returns: [
        //   {text: "Sarah", type: "PERSON", confidence: 0.95},
        //   {text: "Starbucks", type: "ORGANIZATION", confidence: 0.88},
        //   {text: "grateful", type: "EMOTION", confidence: 0.82},
        //   {text: "communication skills", type: "SKILL", confidence: 0.90}
        // ]
        
        // Phase 2: Selective Concept Creation
        // Creates Concept nodes for: Sarah (PERSON), Starbucks (ORGANIZATION), grateful (emotion), communication skills (skill)
        // Generates growth_events for: self_know (gratitude emotion), self_act (skill improvement goal)
        ```

3.  **Retrieval Planner:**
    *   **Purpose:** Orchestrates hybrid retrieval.
    *   **V7 Enhancements:**
        *   Queries materialized views (e.g., `mv_entity_growth_progress`) and computed views (e.g., `v_card_evolution_state`) for efficient access to derived data.
        *   Considers card evolution state and growth dimensions in ranking.
    *   **Tools:** `embed.text`, `vector.similar`, `graph.query`, `rerank.cross_encode`.

4.  **Insight Engine:**
    *   **Purpose:** Discovers patterns, connections, hypotheses.
    *   **V7 Enhancements:**
        *   Analyzes `growth_events` stream for temporal patterns and user progression.
        *   Generates `DerivedArtifacts` for insights, quests, "Orb's Dream Cards."
        *   Can trigger new `growth_events` or suggest challenges based on findings.
    *   **Tools:** `graph.community_detect`, `graph.pattern_match`, `stats.correlate`, `llm.hypothesize`, `llm.evaluate_insight`.

5.  **Ontology Steward:**
    *   **Purpose:** Manages schema, vocabularies, rules, and **growth model configuration**.
    *   **V7 Enhancements:**
        *   **Primary Responsibility:** Manages configuration for growth dimensions, card evolution criteria, and UI visual mappings (stored in Redis/config files).
        *   **Growth Rules Management:** Validates and updates `growth_model_rules.json` configuration, ensuring rule consistency and preventing conflicts.
        *   **Configuration Validation:** Ensures growth dimension rules are syntactically correct, semantically meaningful, and don't create circular dependencies.
        *   **Admin Interface Integration:** Provides APIs for authorized updates to growth rules configuration (future sprint capability).
        *   Evaluates proposals for new terms/rules via an admin interface or automated triggers.
        *   **Schema Evolution:** Manages controlled vocabularies and ensures backward compatibility during configuration updates.
    *   **Tools:** `embed.text` (for semantic similarity of terms), `graph.schema_ops`, `llm.define`, `llm.classify_similarity`, `config.validate`, `config.update`.
    *   **Configuration Responsibilities:**
        ```typescript
        // Example OntologySteward methods
        async validateGrowthRules(rules: GrowthModelRules): Promise<ValidationResult>;
        async updateGrowthConfiguration(updates: Partial<GrowthModelRules>): Promise<void>;
        async getConfigurationHistory(): Promise<ConfigurationVersion[]>;
        async rollbackConfiguration(versionId: string): Promise<void>;
        ```

#### 1.4.4 Deterministic Tools Layer

Specialized, stateless functions for specific tasks, callable by agents. (Details in Section 5)

#### 1.4.5 Persistence Layer

A polyglot persistence approach leveraging specialized databases. (Details in Section 4)

1.  **PostgreSQL:** Core entities, user data, event streams (`growth_events`, `user_activity_log`), challenge system, materialized views.
2.  **Neo4j:** Knowledge graph structure (entities, relationships, properties), community detection.
3.  **Weaviate:** Vector embeddings for semantic search.
4.  **Redis:** Caching, temporary state, message queues, rate limiting, system configuration (e.g., growth dimension definitions).

## 2. Knowledge Model & Six-Dimensional Growth Framework

The Knowledge Model defines how user memories and insights are structured. V7 emphasizes an event-driven approach for the growth framework, with configuration over rigid schema.

### 2.1 Core Knowledge Graph Schema (Neo4j & supporting PostgreSQL tables)

The fundamental node and relationship types are largely consistent with V4, but their properties and interactions are enhanced to support V7 features.

#### 2.1.1 Node Types (Labels in Neo4j, corresponding tables in PostgreSQL)

1.  **`User`**
    *   **PostgreSQL Properties:** `user_id` (PK, UUID), `username`, `email`, `password_hash`, `display_name`, `profile_picture_url`, `created_at`, `last_login_at`, `preferences` (JSONB - UI settings, Orb interaction style), `is_active`, `region`, `growth_profile` (JSONB - aggregated scores for Six-Dimensional Growth).
    *   **Neo4j Properties:** `userId` (unique), `name`.
    *   Purpose: Central anchor for a user's graph.

2.  **`MemoryUnit`**
    *   **PostgreSQL Properties:** `memory_id` (PK, UUID), `user_id` (FK), `title`, `content` (TEXT), `memory_type`, `occurred_at`, `created_at`, `updated_at`, `location` (JSONB), `people` (JSONB[]), `emotions` (JSONB[]), `media_urls` (TEXT[]), `attributes` (JSONB - includes V4's `source_type`, `processing_status`, `importance_score`).
    *   **Neo4j Properties:** `muid` (or `id`), `creation_ts`, `title`, `importance_score`.
    *   Purpose: Container for a distinct piece of user memory/input.

3.  **`Chunk`** (Primarily PostgreSQL, referenced in Weaviate)
    *   **PostgreSQL Properties:** `cid` (PK, UUID), `memory_id` (FK to `memory_units`), `text_content`, `sequence_order`, `role`, `embedding_id` (VARCHAR, link to Weaviate).
    *   Purpose: Granular, semantically searchable units.

4.  **`Concept`**
    *   **PostgreSQL Properties:** `concept_id` (PK, UUID), `user_id` (FK), `name`, `description` (TEXT), `created_at`, `updated_at`, `attributes` (JSONB - includes V4's `type`, `user_defined`, `confidence`, `community_id`), `source`, `status`.
    *   **Neo4j Properties:** `id` (concept_id), `name`, `type`, `description`, `user_defined`, `confidence`.
    *   Purpose: Entities, themes, values, emotions. `Concept.attributes.type` draws from a controlled vocabulary (see V4/V7TechSpec) managed by Ontology Steward.

5.  **`Media`** (Primarily PostgreSQL, linked from MemoryUnits)
    *   **PostgreSQL Properties:** `media_id` (PK, UUID), `memory_id` (FK), `type` (e.g., "image", "audio"), `url`, `caption`, `extraction_status`, `metadata` (JSONB).
    *   Purpose: Non-text media.

6.  **`Annotation`**
    *   **PostgreSQL Properties:** `aid` (PK, UUID), `user_id` (FK), `target_id` (UUID), `target_node_type` (VARCHAR), `annotation_type` (VARCHAR - e.g., "user_reflection", "ai_significance", `know_self_reflection`), `text_content`, `media_url`, `source`, `creation_ts`, `last_modified_ts`, `metadata` (JSONB).
    *   **Neo4j Properties:** `aid`, `text`, `annotation_type`, `creation_ts`, `source`.
    *   Purpose: Meta-commentary, evidence for growth dimensions.

7.  **`Community`** (Detected in Neo4j, summary in PostgreSQL `concepts.attributes.community_id`)
    *   **Neo4j Properties:** `community_id`, `name`, `description`, `detection_method`.
    *   Purpose: Detected concept clusters.

8.  **`DerivedArtifact`** (V7 Specific)
    *   **PostgreSQL Properties:** `artifact_id` (PK, UUID), `user_id` (FK), `title`, `description` (TEXT), `artifact_type` (VARCHAR - e.g., "story_thread", "insight_summary", "quest", "trophy", "poster"), `created_at`, `updated_at`, `source_entities` (JSONB[] - array of {type, id}), `attributes` (JSONB), `thumbnail_url`.
    *   **Neo4j Properties:** `id` (artifact_id), `title`, `artifact_type`.
    *   Purpose: User or AI-curated collections, insights, challenges, rewards.

9.  **`Tag`** (Can be simple strings or dedicated table/node type)
    *   **PostgreSQL (if dedicated table):** `tag_id` (PK), `user_id` (FK), `name`, `type`.
    *   **Neo4j (if dedicated node):** `:Tag {id, name, type}`.
    *   Purpose: Flexible categorization.

10. **`Reflection`** (V7 Data Schema)
    *   **PostgreSQL Properties:** `reflection_id` (PK, UUID), `user_id` (FK), `title`, `content` (TEXT), `reflection_type`, `created_at`, `updated_at`, `related_entities` (JSONB[]), `sentiment` (FLOAT), `insights` (JSONB[]), `tags` (TEXT[]), `metadata` (JSONB).
    *   Purpose: Structured user reflections.

#### 2.1.2 Relationship Types (Primarily Neo4j)

(Largely from V4, with V7 additions/clarifications)
1.  `(User)-[:AUTHORED]->(MemoryUnit)`
2.  `(MemoryUnit)-[:CONTAINS_CHUNK]->(Chunk)` (Conceptual link, chunks in PG)
3.  `(MemoryUnit)-[:HIGHLIGHTS]->(Concept)` {`weight`, `significance`}
4.  `(Chunk)-[:MENTIONS_CONCEPT]->(Concept)` {`weight`} (Conceptual link)
5.  `(MemoryUnit)-[:INCLUDES_MEDIA]->(Media)` (Conceptual link, media in PG)
6.  `(Concept)-[:RELATED_TO]->(Concept)` {`relationship_label`, `weight`, `source`, `creation_ts`, `description`} (Labels: "is_a_type_of", "causes", "precedes", "is_analogous_to", "is_metaphor_for", etc. managed by Ontology Steward)
7.  `(User)-[:PERCEIVES]->(Concept)` {`perception_type`, `current_salience`, `start_date`, `end_date`} (Types: "holds_value", "pursues_goal", etc.)
8.  `(MemoryUnit)-[:CONTINUES_MEMORY_UNIT]->(MemoryUnit)` {`reason`}
9.  `(Annotation)-[:ANNOTATES]->(MemoryUnit | Concept | DerivedArtifact)`
10. `(Concept)-[:BELONGS_TO_COMMUNITY]->(Community)`
11. `(DerivedArtifact)-[:BASED_ON]->(MemoryUnit | Concept | DerivedArtifact)` {`contribution_type`}
12. `(User)-[:CREATED]->(Concept | MemoryUnit | DerivedArtifact)`
13. `(Entity)-[:TAGGED_WITH]->(Tag)`

#### 2.1.3 The Four Domains of Understanding (Emergent)

From V2/V4, these are perspectives queried from the graph, not explicit containers:
1.  **SELF:** `(User)-[:PERCEIVES]->(Concept)` where `Concept.attributes.type` relates to identity.
2.  **LIFE EVENTS:** `MemoryUnit`s highlighting `Concept`s like "life_event_theme".
3.  **RELATIONSHIPS:** `Concept`s of type "person", "group", and associated `MemoryUnit`s.
4.  **FUTURE ORIENTATION:** `(User)-[:PERCEIVES {perception_type: "pursues_goal"}]->(Concept)`.

### 2.2 Six-Dimensional Growth Model (V7 Core)

Implemented using an event-sourcing approach for flexibility and history.

#### 2.2.1 Growth Dimensions (Configuration)

*   The six dimensions (Self/World × Know/Act/Show) are defined in configuration (Redis/JSON file), not a database table.
    *   Keys: `self_know`, `self_act`, `self_show`, `world_know`, `world_act`, `world_show`.
    *   Config includes: `dim_key`, `name`, `description`, `side` ('self'/'world'), `actionType` ('know'/'act'/'show'), `color`, `icon`, UI display properties.

#### 2.2.2 Growth Events Stream (PostgreSQL)

```sql
CREATE TABLE growth_events (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- ID of Concept, MemoryUnit, or DerivedArtifact
  entity_type TEXT NOT NULL CHECK (entity_type IN ('concept', 'memory_unit', 'derived_artifact')),
  dim_key TEXT NOT NULL,        -- 'self_know', 'world_act', etc.
  delta FLOAT NOT NULL,         -- e.g., +0.1, -0.05
  source TEXT NOT NULL,         -- 'journal_entry', 'challenge_completion', 'annotation'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'    -- optional: e.g., annotation_id
);
CREATE INDEX idx_growth_events_user_entity ON growth_events(user_id, entity_id, entity_type);
CREATE INDEX idx_growth_events_user_dim_key ON growth_events(user_id, dim_key);
```

#### 2.2.3 Materialized View for Entity Growth (PostgreSQL)

```sql
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

CREATE UNIQUE INDEX uidx_mv_entity_growth_progress ON mv_entity_growth_progress(user_id, entity_id, entity_type, dim_key);
```
*This view is refreshed periodically or on trigger to provide fast access to current scores.*

#### 2.2.4 User Growth Profile (PostgreSQL `users.growth_profile`)

*   **Purpose:** Stores **overall user growth summaries** for Dashboard display and high-level progress tracking.
*   A JSONB column in the `users` table stores the aggregate score for each dimension for that user.
*   **Primary Usage:** Dashboard components (Cosmic Metrics, Dimensional Balance, overall progress visualization).
*   **Data Source:** Updated by a trigger or scheduled job that aggregates `mv_entity_growth_progress` per user.
*   **API Access:** Served via `/api/users/me/growth-profile` or `/api/dashboard/growth-summary` endpoints.
    ```json
    // Example users.growth_profile
    {
      "self_know": 0.75,
      "self_act": 0.50,
      "self_show": 0.60,
      "world_know": 0.45,
      "world_act": 0.30,
      "world_show": 0.55,
      "last_updated": "2025-01-26T10:30:00Z",
      "total_entities": 42,
      "active_dimensions": 6
    }
    ```

**Distinction from Per-Entity Growth Data:**
*   **Per-Entity Growth:** `mv_entity_growth_progress` materialized view provides **individual Card growth scores** across dimensions.
*   **Usage:** Individual `Card.tsx` components display per-card growth indicators and evolution states.
*   **API Access:** `CardService` methods (`getCards`, `getCardDetails`) fetch per-card growth data by querying/joining with `mv_entity_growth_progress`.
*   **Data Flow:**
    ```typescript
    // Dashboard uses overall user profile
    const userGrowth = await fetch('/api/users/me/growth-profile');
    
    // Card Gallery uses per-entity data
    const cardData = await fetch('/api/cards?include=growth_progress');
    // Returns cards with individual growth scores per dimension
    ```

#### 2.2.5 Card Evolution States (Computed View in PostgreSQL)

Card evolution (Seed → Sprout → Bloom → Constellation → Supernova) is computed dynamically.

```sql
CREATE VIEW v_card_evolution_state AS
SELECT
  eg.user_id,
  eg.entity_id,
  eg.entity_type,
  (SELECT COUNT(DISTINCT ge.dim_key) FROM growth_events ge WHERE ge.user_id = eg.user_id AND ge.entity_id = eg.entity_id AND ge.delta > 0) as engaged_dimensions_count,
  COALESCE(ncs.connection_count, 0) as connection_count,
  CASE
    WHEN (SELECT COUNT(DISTINCT ge.dim_key) FROM growth_events ge WHERE ge.user_id = eg.user_id AND ge.entity_id = eg.entity_id AND ge.delta > 0) >= 5 AND COALESCE(ncs.connection_count, 0) >= 10 THEN 'supernova' -- Example criteria
    WHEN (SELECT COUNT(DISTINCT ge.dim_key) FROM growth_events ge WHERE ge.user_id = eg.user_id AND ge.entity_id = eg.entity_id AND ge.delta > 0) >= 3 AND COALESCE(ncs.connection_count, 0) >= 5  THEN 'constellation'
    WHEN (SELECT COUNT(DISTINCT ge.dim_key) FROM growth_events ge WHERE ge.user_id = eg.user_id AND ge.entity_id = eg.entity_id AND ge.delta > 0) >= 2 OR COALESCE(ncs.connection_count, 0) >= 3  THEN 'bloom'
    WHEN (SELECT COUNT(DISTINCT ge.dim_key) FROM growth_events ge WHERE ge.user_id = eg.user_id AND ge.entity_id = eg.entity_id AND ge.delta > 0) >= 1 OR COALESCE(ncs.connection_count, 0) >= 1  THEN 'sprout'
    ELSE 'seed'
  END AS evolution_state
FROM (SELECT DISTINCT user_id, entity_id, entity_type FROM growth_events) eg -- Base of entities that have growth events
LEFT JOIN (
  -- This table would be populated by a periodic job that queries Neo4j for connection counts per node
  SELECT user_id, entity_id, COUNT(*) AS connection_count
  FROM entity_graph_connections_summary -- Assumed table summarizing Neo4j connections
  GROUP BY user_id, entity_id
) ncs ON eg.user_id = ncs.user_id AND eg.entity_id = ncs.entity_id;
```
*Note: `entity_graph_connections_summary` is a conceptual table. In practice, connection counts might be fetched from Neo4j and cached, or periodically synced to a PostgreSQL table.*

#### 2.2.6 Challenge System (PostgreSQL)

```sql
CREATE TABLE challenge_templates (
  template_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dim_keys TEXT[] NOT NULL, -- Dimensions this challenge contributes to
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  reward_description TEXT,   -- e.g., "Unlocks 'Cosmic Weaver' badge"
  payload JSONB DEFAULT '{}' -- Task parameters, e.g., {"target_actions": 5, "action_type": "journal_entry"}
);

CREATE TABLE user_challenges (
  challenge_instance_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES challenge_templates(template_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress JSONB DEFAULT '{}' -- e.g., {"actions_taken": 2}
);
CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, status);
```
*Challenge completion creates `growth_events` and potentially a `DerivedArtifact` of type "trophy" or "badge".*

#### 2.2.6 Growth Model Configuration Management

**Core Principle: Configuration over Schema/Code**
*   All rules for activating growth dimensions **MUST NOT** be hardcoded within agent code.
*   Growth activation logic is externalized to configuration files or Redis for runtime flexibility.

**Configuration Structure:**
```typescript
// services/cognitive-hub/config/growth_model_rules.json
{
  "dimensions": {
    "self_know": {
      "name": "Self Knowledge",
      "description": "Understanding one's inner world",
      "activation_rules": {
        "emotion_keywords": ["grateful", "anxious", "excited", "confused"],
        "reflection_patterns": ["I feel", "I realize", "I understand"],
        "base_delta": 0.1,
        "source_multipliers": {
          "journal_entry": 1.0,
          "reflection": 1.5,
          "conversation": 0.8
        }
      }
    },
    "self_act": {
      "name": "Self Action",
      "activation_rules": {
        "action_keywords": ["goal", "plan", "practice", "improve", "learn"],
        "commitment_patterns": ["I will", "I want to", "I'm going to"],
        "base_delta": 0.15,
        "source_multipliers": {
          "goal_setting": 2.0,
          "habit_tracking": 1.2
        }
      }
    }
    // ... other dimensions
  },
  "concept_type_mappings": {
    "emotion": ["self_know", "world_know"],
    "value": ["self_know", "self_show"],
    "goal": ["self_act", "world_act"],
    "skill": ["self_act", "self_show"]
  }
}
```

**Configuration Management:**
*   **Loading:** `IngestionAnalyst` loads rules at startup and on configuration updates.
*   **Management:** `OntologySteward` is responsible for validating and updating growth rules configuration.
*   **Storage:** Configuration stored in Redis (`growth_model:rules`) for runtime access and version control.
*   **Updates:** Admin interface (future sprint) allows authorized updates to growth rules via `OntologySteward` API.

**Implementation Pattern:**
```typescript
// IngestionAnalyst.ts
export class IngestionAnalyst extends BaseAgent {
  private growthRules: GrowthModelRules;
  
  async initialize() {
    this.growthRules = await this.configService.getGrowthRules();
  }
  
  async processContentForGrowth(content: string, concepts: Concept[]): Promise<GrowthEvent[]> {
    const events: GrowthEvent[] = [];
    
    for (const [dimKey, rules] of Object.entries(this.growthRules.dimensions)) {
      const delta = this.calculateDimensionDelta(content, concepts, rules);
      if (delta > 0) {
        events.push({
          dim_key: dimKey,
          delta,
          source: this.determineSource(content),
          // ... other fields
        });
      }
    }
    
    return events;
  }
}
```

### 2.3 Schema Governance and Evolution

The Ontology Steward manages:
*   Controlled vocabularies for `Concept.attributes.type`, `Relationship.relationship_label`, `Annotation.annotation_type`, `User.perceives.perception_type`.
*   Visual mapping rules (how `Concept.attributes.type` maps to GraphScene visuals).
*   Growth dimension activation triggers (rules for identifying dimension patterns in content).
*   Card evolution criteria (thresholds for state changes).
*   Schema changes follow a strict governance process (proposal, evaluation, promotion/mapping/rejection).

### 2.4 Vector Embedding Strategy

**Core Principle:** The 2dots1line system utilizes **externally generated vector embeddings**, leveraging powerful models such as Google's Gemini embedding models (for US region) and DeepSeek embedding models (for China region). This approach provides maximum flexibility, control over the embedding process, and ensures consistency across all vector operations.

**Primary Embedding Generation:**
*   Embeddings for `Chunk.text_content`, `Concept.name` + `Concept.description`, and textual representations of `Media` (e.g., captions) are generated by a dedicated embedding tool/service (e.g., `embed.text` tool within `packages/ai-clients/` or `services/cognitive-hub/src/tools/embedding-tools/`).
*   This tool calls the appropriate regional LLM embedding API (Gemini or DeepSeek).
*   The generated vector is then directly provided to Weaviate during data ingestion.

**Weaviate Configuration:**
*   For all Weaviate classes designed to store these externally generated embeddings (e.g., `UserConcept`, `UserMemory`, `UserArtifact`, `ConversationChunk`), the `vectorizer` property in the Weaviate schema **MUST** be set to `"none"`.
*   This means Weaviate will not attempt to generate vectors itself for these classes but will store and index the vectors provided by our application.
*   All vector generation is handled by the application layer through the `embed.text` tool.

**Embedding Model Details:**
*   Default models aim for a balance of quality and efficiency (e.g., 1536-dimensional models are common, such as `text-embedding-ada-002` or its generation's equivalents from Google/DeepSeek).
*   Specific model names/versions used are managed via configuration and potentially selected by the `OntologySteward` or embedding tool based on region and task.
*   All embeddings are version-tagged within their metadata (stored in Weaviate object properties or an associated tracking mechanism) to facilitate future model upgrades and re-embedding strategies.

**Multi-Modal Embeddings (Future Consideration):**
*   For future multi-modal capabilities (embedding images or audio directly), if models that produce vectors in a shared space with text embeddings are used (e.g., CLIP-style models), these vectors will also be generated externally and supplied to Weaviate with `vectorizer: "none"`.
*   If a Weaviate multi-modal module becomes mature and suitable (e.g., `multi2vec-clip`), its use would be evaluated as a specific exception, but the default is external generation.

**This strategy ensures that the application has full control over the embedding process and utilizes the most appropriate and up-to-date embedding models available through external APIs.**

### 2.5 External Embedding Implementation Guide

**Implementation Steps for External Embedding Strategy:**

1. **Embedding Tool Implementation:**
   ```typescript
   // packages/ai-clients/src/embedding/embed-text.tool.ts
   export class EmbedTextTool implements IExecutableTool<TTextEmbeddingInputPayload, TTextEmbeddingResult> {
     async execute(input: TTextEmbeddingToolInput): Promise<TTextEmbeddingToolOutput> {
       const { text_to_embed, model_id, embedding_type } = input.payload;
       
       // Route to appropriate regional client
       const client = this.getRegionalClient(model_id);
       const vector = await client.generateEmbedding(text_to_embed);
       
       return {
         status: 'success',
         result: {
           vector,
           embedding_metadata: {
             model_id_used: model_id,
             dimensions: vector.length,
             token_count: this.estimateTokens(text_to_embed)
           }
         }
       };
     }
   }
   ```

2. **Weaviate Object Creation with External Vectors:**
   ```typescript
   // packages/database/src/weaviate/repositories/concept.repository.ts
   export class ConceptRepository {
     async createConcept(concept: ConceptData, vector: number[]): Promise<void> {
       await this.client.data
         .creator()
         .withClassName('UserConcept')
         .withProperties({
           externalId: concept.id,
           userId: concept.userId,
           name: concept.name,
           description: concept.description,
           embeddingModelVersion: concept.embeddingModelVersion
         })
         .withVector(vector) // Externally generated vector
         .do();
     }
   }
   ```

3. **Integration in Ingestion Pipeline:**
   ```typescript
   // services/cognitive-hub/src/agents/ingestion/IngestionAnalyst.ts
   export class IngestionAnalyst extends BaseAgent {
     async processMemoryUnit(memoryUnit: MemoryUnit): Promise<void> {
       // Extract concepts
       const concepts = await this.extractConcepts(memoryUnit.content);
       
       for (const concept of concepts) {
         // Generate embedding externally
         const embeddingResult = await this.toolRegistry.executeTool('embed.text', {
           payload: {
             text_to_embed: `${concept.name}: ${concept.description}`,
             model_id: this.getRegionalModelId(),
             embedding_type: 'concept'
           }
         });
         
         // Store in Weaviate with external vector
         await this.conceptRepository.createConcept(concept, embeddingResult.result.vector);
       }
     }
   }
   ```

**Regional Model Configuration:**
```typescript
// packages/core-utils/src/config/embedding-models.ts
export const EMBEDDING_MODELS = {
  us: {
    default: 'text-embedding-004',
    models: {
      'text-embedding-004': {
        provider: 'google',
        dimensions: 768,
        maxTokens: 8192
      }
    }
  },
  cn: {
    default: 'deepseek-embed-v1',
    models: {
      'deepseek-embed-v1': {
        provider: 'deepseek',
        dimensions: 1536,
        maxTokens: 4096
      }
    }
  }
};
```

**Migration Strategy for Existing Weaviate Data:**
1. **Schema Update:** Apply new schema with `vectorizer: "none"` to existing Weaviate instance
2. **Data Migration:** Re-embed existing objects using external embedding tool
3. **Validation:** Verify vector dimensions and semantic similarity preservation
4. **Rollback Plan:** Maintain backup of original schema and data during transition

## 3. User Interface (UI) Layer Implementation

The UI is a 3-layer modular architecture designed for an immersive and emotionally resonant experience.

### 3.1 Frontend Technology Stack

*   **Core Framework:** React 19 with Next.js 15 (App Router)
*   **3D Rendering:** Three.js with React Three Fiber (R3F) and Drei
*   **State Management:** Zustand with Immer
*   **Styling:** Tailwind CSS with custom design tokens (from v7UIUXDesign.md)
*   **Animation:** Framer Motion (2D), R3F/GSAP (3D)
*   **API Communication:** TanStack Query (React Query) v5 via API Gateway/BFF
*   **Type Safety:** TypeScript
*   **Shader Programming:** GLSL

### 3.2 Visual Design Language (Summary from v7UIUXDesign.md)

*   **Color System:** Atmospheric palettes (Dawn Haze, Twilight Veil, Overcast Serenity), KGO Palette (Deep Cosmos), Accent colors (Journey Gold, Connection Ember, etc.), Neutrals.
*   **Typography:** General Sans (Headings), Inter (Body/UI). 8pt grid type scale.
*   **Space & Layout:** 8pt grid, layered depth, asymmetrical balance, progressive disclosure, glassmorphism.
*   **Motion & Animation:** Amorphous transitions, natural easing, atmospheric presence, purposeful choreography.
*   **Design Tokens:** Centralized system for colors, typography, spacing, radius, shadows, motion, z-index.

### 3.3 3D Canvas Layer

Immersive background scenes setting emotional tone and visualizing the knowledge graph.

#### 3.3.1 Canvas Architecture & Scene Management

(As per `v7TechSpec.md`'s Frontend Implementation section for `Canvas3D` and `SceneManager`)
*   Root R3F `<Canvas>` with conditional rendering of active scenes.
*   Shared lighting, assets, post-processing (e.g., Bloom).

#### 3.3.2 Scene Modules (from v7UIUXDesign.md & v7TechSpec.md)

1.  **CloudScene:**
    *   **Concept:** Dreamlike flight over clouds and peaks for reflection, hope, growth.
    *   **Visuals:** Layered volumetric clouds, Epyréan Skyscape, distant snowy peaks.
    *   **Tech:** GPU ray-marched volumetric clouds, dynamic time-of-day/weather, parallaxed heightmaps.
    *   **Interaction:** Primarily atmospheric, prompts for journaling.

2.  **AscensionScene:**
    *   **Concept:** Transition from outer landscape to inner cosmos, symbolic of shifting perspective.
    *   **Visuals:** Vertical ascent, clouds rushing past, tunneling effect, flash to starscape.
    *   **Tech:** Procedurally generated path, animated cloud layers/shaders, starfield generation.
    *   **Interaction:** Automated transition, subtly indicates loading/processing.

3.  **GraphScene (Knowledge Graph Observatory):**
    *   **Concept:** User's internal landscape as an interactive cosmic map.
    *   **Visuals:** Memory Stars, Concept Nebulae, Connection Pathways, Constellations/Clusters against a deep cosmos backdrop. Node/link appearance mapped to data attributes (type, importance, recency, relationship type).
    *   **Tech:** Force-directed 3D graph layout (e.g., `d3-force-3d` or custom physics), R3F for rendering nodes/links, instancing, LODs.
    *   **Interaction:** Zoom, orbit, click/select nodes, node expansion, contextual info display.

#### 3.3.3 Shader Implementations

Custom GLSL shaders for:
*   Volumetric Clouds (ray marching)
*   Orbital Connections / Energy Paths
*   Node Glimmer/Aura effects
*   Atmospheric Scattering
*   Text Glow

#### 3.3.4 Performance Optimization

(As per `v7TechSpec.md`'s AdaptiveQuality, Asset Management, Render Optimization, Memory Management strategies).

### 3.4 2D Modal Layer

Structured UI elements using glassmorphism, floating above the 3D canvas.

#### 3.4.1 Modal Architecture

(As per `v7TechSpec.md`'s `ModalLayer.tsx` structure).
*   DOM-rendered React components.
*   Managed by `ModalStore` (Zustand).
*   Accessibility considerations (focus trapping, ARIA).

#### 3.4.2 Card Gallery System

*   **Concept:** Infinite gallery of cards representing knowledge graph nodes/artifacts.
*   **Card Design:** Two-sided (Visual/Information), with evolution state, growth dimension indicators.
*   **Card Evolution States:** (Seed → Sprout → Bloom → Constellation → Supernova) computed via `v_card_evolution_state` view. Changes trigger UI animations.
*   **Growth Dimensions:** Displayed on cards, progress derived from `mv_entity_growth_progress`.
*   **Interaction:** Discovery, activation, nurturing (triggers `growth_events`), connection.
*   **Tech:** Virtualized grid for performance, `Card.tsx` component with front/back flip animation, `GrowthDimensionIndicator.tsx`. (Details from `v7TechSpec.md`).

#### 3.4.3 Dashboard

*   **Concept:** Landing modal for stats, updates, insights, action items.
*   **Sections:** Greeting & Status, Cosmic Metrics (Star Count, Constellation Map, Dimensional Balance from `users.growth_profile` & `mv_entity_growth_progress`), Active Journeys, Insight Discoveries, Growth Invitations (Challenges).
*   **Data:** Leverages `user_growth_summary` view, `user_challenges` table, and insights from `DerivedArtifacts`.
*   **Tech:** Layered data loading (cached summary, real-time events via WebSockets, deep analysis). (Details from `v7TechSpec.md`).

#### 3.4.4 HUD (Heads-Up Display)

*   **Concept:** Minimal, persistent control hub for scene switching, navigation shortcuts, status.
*   **Controls:** Scene Toggle, Ascension Trigger, Card Gallery, Chat, Dashboard, Quest Log.
*   **Tech:** Standard React components, positioned fixed or absolutely over the canvas.

#### 3.4.5 Chat Interface

*   **Concept:** Dedicated modal for conversations with Orb (Dialogue Agent).
*   **Features:** Text/voice/media input, contextual card display, Orb visual integration, smart suggestions.
*   **Tech:** `ChatInterface.tsx` with message list, input area, typing indicators. (Details from `v7TechSpec.md`).

### 3.5 3D Orb Layer

Visual and emotional anchor, embodying the Dialogue Agent (Dot).

#### 3.5.1 Visual Appearance & Behavior

(As per `v7UIUXDesign.md`'s Orb Design & Behavior section and `v7TechSpec.md`'s Orb Implementation).
*   **Shape:** Perfect sphere with core, shell, aura layers.
*   **State Changes:** Color, glow, intensity, motion patterns reflect emotional tone (Neutral, Curious, Reflective, Excited, etc.) and functional state (Listening, Thinking, Speaking, Insight, etc.). Driven by `OrbStore` updated by Dialogue Agent.
*   **Scene-Specific Behavior:** Adapts appearance and role in CloudScene, AscensionScene, GraphScene.
*   **Tech:** `Orb.tsx` R3F component with custom shaders for core, shell, aura, particles. State driven by `OrbStore`.

#### 3.5.2 Orb Effects System

Temporary visual effects (particle bursts, pulse rings, energy trails, glow intensity changes) to communicate events. (As per `v7TechSpec.md`'s `OrbEffect.tsx`).

### 3.6 UI State Management (Zustand)

Specialized stores for:
*   `SceneStore`: Active scene, transitions, environment state.
*   `OrbStore`: Orb appearance, behavior, position, effects.
*   `ModalStore`: Active modals, UI navigation.
*   `UserStore`: Session, preferences (including accessibility).
*   `CardGalleryStore`: Card data, layout, filters.
*   `ChatStore`: Conversation messages, status.
*   `GraphStore`: GraphScene nodes, links, focus, view parameters.

### 3.7 API Communication (TanStack Query)

*   Structured API client (`apiClient.ts`) with Axios, auth interceptor, error handling.
*   Custom hooks (e.g., `useCardQuery`, `useGraphData`, `useAgentEvents`) for data fetching, mutation, and WebSocket event handling.

### 3.8 Accessibility Implementation

(As per `v7TechSpec.md`'s Accessibility section)
*   Alternative navigation modes (`useAccessibilityMode`).
*   2D alternative views for Card Gallery and Graph View.
*   Keyboard navigation, screen reader support (ARIA), high contrast mode, text-to-speech, focus management.
*   `AccessibilityProvider.tsx` for global setup.

## 4. Persistence Layer Implementation

The V7 persistence layer uses a polyglot approach, detailed in `V7DataSchemaDesign.md` and refined by the event-sourcing principles.

### 4.1 PostgreSQL (Relational Database)

*   **Purpose:** Core entities, user information, raw content, event streams (`growth_events`, `user_activity_log`), challenge system, materialized views (`mv_entity_growth_progress`), and **performance-optimized relationship summaries**.
*   **Key Tables & Schema:**
    *   `users`: Includes `growth_profile` (JSONB).
    *   `user_sessions`, `user_activity_log`.
    *   `concepts`, `memory_units`, `derived_artifacts` (V7 specific).
    *   `chunks`, `media`, `annotations`, `reflections`.
    *   `conversations`, `conversation_messages`.
    *   `orb_states` (primarily for historical logging/analytics; real-time state in Redis).
    *   `challenge_templates`, `user_challenges`.
    *   `growth_events` (central to V7).
    *   `entity_vectors` (junction table for Weaviate IDs).

**Relationship Data Strategy - Neo4j as Source of Truth:**

*   **Primary Principle:** Neo4j serves as the **authoritative source** for all rich relationship data (`RELATED_TO`, `PERCEIVES`, etc.).

*   **`concept_relationships` Table (Performance Cache):**
    *   **Purpose:** **REMOVED** - Redundant with Neo4j relationships.
    *   **Replacement Strategy:** Connection counts for `v_card_evolution_state` view sourced from `entity_graph_connections_summary` table.
    *   **`entity_graph_connections_summary` Table:**
        ```sql
        CREATE TABLE entity_graph_connections_summary (
          user_id UUID NOT NULL,
          entity_id UUID NOT NULL,
          entity_type TEXT NOT NULL,
          connection_count INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, entity_id, entity_type)
        );
        ```
    *   **Population:** Periodic job queries Neo4j for connection counts and updates this summary table.
    *   **Justification:** Avoids duplicating relationship semantics while providing fast access for card evolution calculations.

*   **`user_perceived_concepts` Table (Analytical Cache):**
    *   **Purpose:** **CONDITIONALLY RETAINED** for specific analytical performance optimization.
    *   **Justification:** Complex array operations and aggregations on `(User)-[:PERCEIVES]->(Concept)` relationships may be inefficient in Neo4j for certain dashboard queries.
    *   **Synchronization:** One-way sync from Neo4j to PostgreSQL via scheduled job.
    *   **Schema:**
        ```sql
        CREATE TABLE user_perceived_concepts (
          user_id UUID NOT NULL,
          concept_id UUID NOT NULL,
          perception_type TEXT NOT NULL,
          current_salience FLOAT,
          start_date DATE,
          end_date DATE,
          synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, concept_id, perception_type)
        );
        ```
    *   **Alternative:** If analytical performance is acceptable with direct Neo4j queries, this table should be **REMOVED** to eliminate sync complexity.

**Synchronization Strategy:**
*   **Neo4j → PostgreSQL:** Scheduled jobs (every 15 minutes) update summary tables from Neo4j.
*   **No Bi-directional Sync:** PostgreSQL relationship tables are read-only caches, never written to directly.
*   **Consistency:** Accept eventual consistency for performance optimization; critical operations query Neo4j directly.

### 4.2 Neo4j (Graph Database)

*   **Purpose:** Storing and querying the knowledge graph structure – entities as nodes, relationships, properties. Community detection, pathfinding.
*   **Node Labels & Properties:** `User`, `Concept`, `MemoryUnit`, `DerivedArtifact`, `Annotation`, `Community`, `Tag`. Properties align with PostgreSQL counterparts but focus on graph-relevant attributes.
*   **Relationship Types:** As defined in Section 2.1.2.
*   **Query Patterns:** Entity navigation, concept exploration, memory context, temporal patterns, community structure.
*   **Optimization:** Strategic indexing, query caching, batch updates, relationship pruning.

### 4.3 Weaviate (Vector Database)

*   **Purpose:** Storing and querying vector embeddings for semantic search and similarity.
*   **Collections (Classes):**
    *   `UserConcept`, `UserMemory`, `UserArtifact`, `ConversationChunk`.
    *   Each class has properties for `userId`, relevant IDs (e.g., `conceptId`), text fields for metadata, and filterable metadata (e.g., `tags`, `evolutionState`, `timestamp`).
    *   **Vectorizer:** `"none"` - All embeddings are generated externally by the application using the `embed.text` tool and provided to Weaviate during object creation.
*   **External Embedding Strategy:**
    *   Embeddings generated by dedicated `embed.text` tool using regional models (Google Gemini for US, DeepSeek for China).
    *   Application provides pre-computed vectors when creating/updating Weaviate objects.
    *   No `moduleConfig` blocks for `text2vec-*` modules - Weaviate acts purely as vector storage and index.
*   **Query Patterns:** K-Nearest Neighbors (with filters), Hybrid Search (vector similarity + metadata filtering).
*   **Optimization:** HNSW indexing, vector quantization, filtered sharding, batch ingestion.

**Example Weaviate Class Definition:**
```json
{
  "class": "UserConcept",
  "description": "User-specific concepts with externally generated embeddings",
  "vectorizer": "none",
  "properties": [
    {
      "name": "externalId",
      "dataType": ["uuid"],
      "description": "Reference to concept_id in PostgreSQL",
      "indexInverted": true
    },
    {
      "name": "userId",
      "dataType": ["string"],
      "description": "User ID for filtering",
      "indexInverted": true
    },
    {
      "name": "name",
      "dataType": ["text"],
      "description": "Concept name for metadata filtering",
      "indexInverted": true
    },
    {
      "name": "embeddingModelVersion",
      "dataType": ["string"],
      "description": "Version of external model used for vector generation",
      "indexInverted": true
    }
  ]
}
```

### 4.4 Redis (Cache, Queues, Configuration & Real-time State)

*   **Purpose:** Caching, temporary state, **active job queues**, rate limiting, system configuration, real-time UI state.
*   **Key Caching Domains:** User context, query results, LLM responses.
*   **Active Queue Management (BullMQ):** 
    *   **Primary Job Queues:** Embedding Queue, Ingestion Processing Queue, Insight Generation Queue.
    *   **Queue Features:** Job prioritization, retry logic, dead letter queues, progress tracking.
    *   **Worker Integration:** Background workers consume jobs from these Redis-based queues.
*   **State Management:** Rate limiting, distributed locks, session management.
*   **Configuration Storage:** Growth dimension definitions, card evolution rules, UI mapping rules.
*   **Real-time State:**
    *   `user:{uid}:orb:state`: Current Orb visual and emotional state (from `OrbStateManager`).
    *   `user:{uid}:scene:active`: Current active 3D scene.
    *   `card:{id}:growth`: Cached card growth data.
*   **Pub/Sub Channels:**
    *   `user:{uid}:orb_state`, `user:{uid}:cards` (updates), `user:{uid}:challenges`, `user:{uid}:insights`, `user:{uid}:scene` (transitions).

**Job Management Strategy:**

*   **Active Job Queuing:** Redis/BullMQ handles all **active job management** (queuing, processing, retries).
*   **`agent_processing_jobs` Table (PostgreSQL):**
    *   **Purpose:** **Historical job logging** for auditing, analytics, and debugging.
    *   **NOT for Active Queuing:** This table does **NOT** manage active job queues.
    *   **Population:** Background workers move completed/failed job details from BullMQ to this table upon job completion.
    *   **Schema:**
        ```sql
        CREATE TABLE agent_processing_jobs (
          job_id UUID PRIMARY KEY,
          user_id UUID,
          agent_name TEXT NOT NULL,
          job_type TEXT NOT NULL,
          status TEXT NOT NULL, -- 'completed', 'failed', 'cancelled'
          started_at TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ,
          duration_ms INTEGER,
          input_payload JSONB,
          output_result JSONB,
          error_details JSONB,
          queue_name TEXT NOT NULL
        );
        ```
    *   **Data Flow:**
        ```typescript
        // Job Lifecycle
        1. Job Created → BullMQ Queue (Redis)
        2. Worker Processes → Job Status Updates in BullMQ
        3. Job Completes/Fails → Worker logs to agent_processing_jobs (PostgreSQL)
        4. Historical Analysis → Query agent_processing_jobs table
        ```

*   **Optimization:** TTL policies, LRU eviction, Redis Cluster, data compression.

### 4.5 Database Integration Layer

(As per `v7TechSpec.md` Backend `DatabaseService` class)
*   Provides unified access to Prisma (PostgreSQL), Neo4j, Weaviate, and Redis clients.
*   Includes a `withTransaction` method for PostgreSQL transactions, though true distributed transactions across all DBs are complex and usually avoided in favor of eventual consistency or saga patterns for inter-service operations.

## 5. Cognitive Agents & Deterministic Tools Layer

The V7 cognitive agents operate within the `cognitive-hub` service, leveraging the event-driven architecture and configuration-based rules.

### 5.1 Agent Architecture

*   **BaseAgent Class:** Provides shared functionality (ID, name, tool registration/execution, logging, lifecycle events).
*   **Agent-Tool Paradigm:** Agents use deterministic tools for specialized tasks.
*   **Event-Driven:** Agents react to and produce events, interacting with Redis queues and event streams in PostgreSQL.

### 5.2 Cognitive Agents: Implementation & Responsibilities

(Input/Output payloads, LLM Configs, tool use as per V4TechSpec, adapted for V7 data model and event sourcing)

1.  **Dialogue Agent (Dot / Orb):**
    *   **Purpose:** User-facing conversational interface, drives Orb visuals.
    *   **V7 Enhancements:**
        *   Manages `OrbStateManager` to control Orb's visual/emotional state, emitting state changes for frontend.
        *   Consumes insights and context for proactive, emotionally resonant conversation.
        *   Triggers `growth_events` based on conversational breakthroughs or reflections.
        *   Interacts with `ConversationRepository` and `UserRepository`.
    *   **Tools:** `emotionDetector`, `messageClassifier`, `retrieval.plan_and_execute`, `insight.get_relevant`, `llm.chat`.

2.  **Ingestion Analyst:**
    *   **Purpose:** Processes inputs into graph-ready elements and drives growth model through selective, strategic concept creation.
    *   **V7 Enhancements:**
        *   Writes to `growth_events` stream instead of directly updating progress tables.
        *   Uses configurable rules (from Redis/config) to determine dimension activation from content.
        *   **Strategic Concept Creation:** Implements two-phase entity processing:
            *   **Phase 1 - Broad NER Detection:** Uses `ner.extract` tool to identify all entity types (PERSON, ORGANIZATION, LOCATION, DATE, EMAIL, PHONE, URL, etc.)
            *   **Phase 2 - Selective Concept Creation:** Applies filtering logic to create `Concept` nodes only for strategically important entities:
                *   **Core Named Entities:** PERSON, ORGANIZATION, LOCATION, DATE (create top-level `Concept` nodes)
                *   **Thematic Concepts:** emotion, value, goal, skill, interest, struggle, life_event_theme (identified via keyword/pattern matching or LLM-based abstract concept extraction)
                *   **Metadata Storage:** Other NER entities (EMAIL, PHONE, URL) stored as structured metadata in `MemoryUnit.attributes` or `Chunk.metadata` JSONB fields
        *   **Growth Event Linkage:** `growth_events` are generated primarily for prioritized `Concept` types that align with the Six-Dimensional Growth Model.
    *   **Tools:** `ner.extract`, `vision.caption`, `embed.queue_job`, `llm.extract_json`, `dedupe.match`.
    *   **Input/Output Example:**
        ```typescript
        // Input: User journal entry
        const input = {
          content: "Had coffee with Sarah at Starbucks. Feeling grateful for our friendship. Want to improve my communication skills.",
          memoryUnitId: "uuid-123"
        };
        
        // Phase 1: NER Detection
        const nerResults = await this.toolRegistry.executeTool('ner.extract', {
          payload: { text_to_analyze: input.content }
        });
        // Returns: [
        //   {text: "Sarah", type: "PERSON", confidence: 0.95},
        //   {text: "Starbucks", type: "ORGANIZATION", confidence: 0.88},
        //   {text: "grateful", type: "EMOTION", confidence: 0.82},
        //   {text: "communication skills", type: "SKILL", confidence: 0.90}
        // ]
        
        // Phase 2: Selective Concept Creation
        // Creates Concept nodes for: Sarah (PERSON), Starbucks (ORGANIZATION), grateful (emotion), communication skills (skill)
        // Generates growth_events for: self_know (gratitude emotion), self_act (skill improvement goal)
        ```

3.  **Retrieval Planner:**
    *   **Purpose:** Orchestrates hybrid retrieval.
    *   **V7 Enhancements:**
        *   Queries materialized views (e.g., `mv_entity_growth_progress`) and computed views (e.g., `v_card_evolution_state`) for efficient access to derived data.
        *   Considers card evolution state and growth dimensions in ranking.
    *   **Tools:** `embed.text`, `vector.similar`, `graph.query`, `rerank.cross_encode`.

4.  **Insight Engine:**
    *   **Purpose:** Discovers patterns, connections, hypotheses.
    *   **V7 Enhancements:**
        *   Analyzes `growth_events` stream for temporal patterns and user progression.
        *   Generates `DerivedArtifacts` for insights, quests, "Orb's Dream Cards."
        *   Can trigger new `growth_events` or suggest challenges based on findings.
    *   **Tools:** `graph.community_detect`, `graph.pattern_match`, `stats.correlate`, `llm.hypothesize`, `llm.evaluate_insight`.

5.  **Ontology Steward:**
    *   **Purpose:** Manages schema, vocabularies, rules, and **growth model configuration**.
    *   **V7 Enhancements:**
        *   **Primary Responsibility:** Manages configuration for growth dimensions, card evolution criteria, and UI visual mappings (stored in Redis/config files).
        *   **Growth Rules Management:** Validates and updates `growth_model_rules.json` configuration, ensuring rule consistency and preventing conflicts.
        *   **Configuration Validation:** Ensures growth dimension rules are syntactically correct, semantically meaningful, and don't create circular dependencies.
        *   **Admin Interface Integration:** Provides APIs for authorized updates to growth rules configuration (future sprint capability).
        *   Evaluates proposals for new terms/rules via an admin interface or automated triggers.
        *   **Schema Evolution:** Manages controlled vocabularies and ensures backward compatibility during configuration updates.
    *   **Tools:** `embed.text` (for semantic similarity of terms), `graph.schema_ops`, `llm.define`, `llm.classify_similarity`, `config.validate`, `config.update`.
    *   **Configuration Responsibilities:**
        ```typescript
        // Example OntologySteward methods
        async validateGrowthRules(rules: GrowthModelRules): Promise<ValidationResult>;
        async updateGrowthConfiguration(updates: Partial<GrowthModelRules>): Promise<void>;
        async getConfigurationHistory(): Promise<ConfigurationVersion[]>;
        async rollbackConfiguration(versionId: string): Promise<void>;
        ```

### 5.3 Deterministic Tools Layer

(As per V4TechSpec, largely unchanged but now potentially deployed as part of the `cognitive-hub` or as standalone serverless functions/microservices accessible via registry).

#### 5.3.1 Core Tool Categories

*   **Text Processing & NLP:** `ner.extract`, `llm.extract_json`, `llm.chat`, `llm.summarize`.
*   **Visual Processing:** `vision.caption`, `vision.extract_entities`.
*   **Embedding & Vectorization:** `embed.text` (primary external embedding generator), `embed.queue_job`.
*   **Vector Operations:** `vector.similar`, `rerank.cross_encode`.
*   **Graph Operations:** `graph.query`, `graph.community_detect`, `graph.schema_ops`.
*   **Statistical Analysis:** `stats.correlate`, `stats.trend`.
*   **Utility Functions:** `dedupe.match`, `util.validate_json`.

**Key Tool: `embed.text`**
*   **Purpose:** Primary tool for generating vector embeddings using external LLM APIs (Google Gemini, DeepSeek).
*   **Input:** `{text_to_embed: string, model_id: string, embedding_type?: string}`
*   **Output:** `{vector: number[], embedding_metadata: {model_id_used, dimensions, token_count}}`
*   **Regional Models:**
    *   US: Google Gemini embedding models (e.g., `text-embedding-004`)
    *   China: DeepSeek embedding models (e.g., `deepseek-embed-v1`)
*   **Integration:** Generates vectors that are directly provided to Weaviate during object creation/update.
*   **Performance:** Optimized for batch processing, includes retry logic and rate limiting.

#### 5.3.2 Tool Registry & Discovery

*   Central registry with tool name, description, I/O schemas, capability tags, regional availability, performance metrics.
*   Enables dynamic discovery, capability-based routing, fallback handling, regional compliance.

#### 5.3.3 Implementation Pattern

*   Stateless HTTP/gRPC microservices or serverless functions.
*   Input validation, error handling, logging, rate limiting, circuit breaking.

## 6. Backend Services Implementation

Building on the V7 refined principles and the agent architecture.

### 6.1 Core Backend Services (within or supporting Cognitive Hub)

1.  **API Gateway / BFF:** (Described in Section 1.4.2 and 7.2.1)
    *   Manages external API calls, authentication, routing to internal services/agents.
    *   Handles real-time communication setup (Socket.IO proxying or termination).

2.  **Dialogue Agent Service (incorporating Orb State Manager):**
    *   Hosts the Dialogue Agent logic.
    *   `OrbStateManager` class (as per `v7TechSpec.md`) manages `OrbState` (visual/emotional state, effects), emits changes via Socket.IO to frontend `OrbStore`.
    *   Handles HTTP requests for messages, focus changes, explanations.
    *   Subscribes to relevant message broker topics (e.g., new insights, memory ingestions).

3.  **Card Service (New for V7):**
    *   Manages data and logic related to the Card Gallery and Six-Dimensional Growth Model.
    *   Uses `CardRepository` and `GrowthModelRepository`.
    *   Provides API endpoints for fetching cards, card details, completing growth challenges, creating connections.
    *   Calculates/retrieves card evolution states and growth dimension progress using views and event data.
    *   Interacts with Insight Engine for suggestions and Neo4j for connection data.

4.  **Memory Service (incorporating Ingestion Analyst logic):**
    *   Handles ingestion of memories, documents, etc.
    *   Orchestrates tiered processing pipeline.
    *   Manages interaction with embedding tools and storage of vectors in Weaviate.
    *   Creates `growth_events` related to ingested content.

5.  **Graph Service (incorporating Retrieval Planner & Insight Engine logic for graph ops):**
    *   Provides API endpoints for querying the Neo4j knowledge graph.
    *   Exposes graph traversal, pattern matching, community detection.
    *   Used by GraphScene frontend for visualization data.
    *   Hosts parts of Retrieval Planner and Insight Engine focused on graph analysis.

### 6.2 Background Workers (Redis/BullMQ based)

1.  **Ingestion Worker:** Processes jobs from the ingestion queue (tiered analysis, embedding).
2.  **Embedding Worker:** Handles asynchronous embedding generation requests.
3.  **Insight Worker:** Runs scheduled Insight Engine tasks (pattern mining, hypothesis generation).
4.  **Scheduler:** Manages periodic jobs like materialized view refreshes, data archiving, ontology health checks.

## 7. Data Flow & Processing

V7 emphasizes event-driven flows.

### 7.1 Memory Ingestion Workflow

1.  **Input Reception (UI → API Gateway → Memory Service):**
    *   User input (text, media) sent to API.
    *   Memory Service creates `memory_units` record (status 'raw'), stores raw content/media link.
    *   Enqueues job for Ingestion Worker. Frontend shows "pending" card.

2.  **Asynchronous Processing (Ingestion Worker & Tools):**
    *   **Tier 1 (Basic):** Preprocessing (transcription, OCR), basic chunking. `growth_events` for simple capture.
    *   **Embedding:** Embedding Worker generates vectors for chunks, stores in Weaviate. `entity_vectors` updated.
    *   **Tier 2/3 (Enrichment):** Ingestion Analyst uses LLMs for entity/concept extraction, relationship inference, deeper semantic analysis.
        *   Updates Neo4j graph.
        *   Crucially, **generates `growth_events`** based on content analysis and configured dimension activation rules.
        *   Updates `memory_units.processing_status`.

3.  **Finalization & Notification:**
    *   Memory Service updates `processing_status` to 'enriched'.
    *   Materialized views (`mv_entity_growth_progress`) may be refreshed.
    *   User's aggregate `growth_profile` in `users` table updated.
    *   WebSocket event sent to frontend to update card UI from "pending" to fully interactive. Orb may acknowledge.

### 7.2 Conversational Dialogue & Retrieval Workflow

1.  **Query Reception (UI → API Gateway → Dialogue Agent Service):**
    *   User query received. Dialogue Agent updates Orb state (e.g., 'listening').
    *   `conversation_messages` logged.

2.  **Contextual Retrieval (Dialogue Agent → Retrieval Planner → Databases):**
    *   Retrieval Planner devises hybrid strategy.
    *   Fetches relevant `Chunk` vectors from Weaviate, `Concept`/`MemoryUnit` graph context from Neo4j, and structured data/event summaries from PostgreSQL (materialized views).
    *   Results compiled into context bundle.

3.  **Response Generation (Dialogue Agent → LLM Tools):**
    *   Dialogue Agent updates Orb state (e.g., 'thinking').
    *   Context bundle + query + persona instructions sent to LLM.
    *   LLM response streamed to UI. Dialogue Agent updates Orb state (e.g., 'speaking', emotional tone).

4.  **Post-Response Processing (Dialogue Agent → Ingestion Analyst / Card Service):**
    *   Conversation segment may be queued for ingestion if deemed memory-worthy.
    *   Relevant `growth_events` generated if conversation led to insights or reflection fulfilling dimension criteria. Card Service updates relevant card states.

### 7.3 Insight Generation Flow

1.  **Trigger (Scheduler → Insight Worker):** Periodic or event-triggered.
2.  **Analysis (Insight Worker → Databases):**
    *   Processes `growth_events` stream, Neo4j graph structure, Weaviate concept similarities.
    *   Performs community detection, pattern mining, correlation, metaphorical connection finding.
3.  **Hypothesis & Storage (Insight Worker → PostgreSQL / Neo4j):**
    *   Generates hypotheses, evaluates confidence.
    *   Stores high-value insights as `DerivedArtifacts` in PostgreSQL.
    *   May update Neo4j graph with new inferred relationships or community tags.
4.  **Notification (Insight Worker → Dialogue Agent Service / UI):**
    *   Sends WebSocket event for new insights to be surfaced on Dashboard or by Orb.
    *   May trigger `growth_events` if an insight itself is a growth milestone.

## 8. Monorepo & Technical Implementation Details

### 8.1 Monorepo Structure (Turborepo - from V7MonoRepoDesign.md)

The system is built using Turborepo. Key aspects:
*   **`apps/`**: `web-app`, `mobile-app`, `api-gateway`, `storybook`.
    *   `web-app/src/canvas/`: Scene-specific 3D implementations (`CloudScene`, `AscensionScene`, `GraphScene`).
    *   `web-app/src/orb/`: App-specific Orb components/hooks.
*   **`packages/`**: Shared libraries.
    *   `shared-types/`: Common TypeScript types.
    *   `database/`: Database access layer (Prisma, Neo4j, Weaviate, Redis clients).
    *   `ai-clients/`: LLM provider clients (Google, DeepSeek).
    *   `ui-components/`: Shared React UI components, glassmorphism utilities.
    *   `canvas-core/`: Shared, scene-agnostic 3D utilities (camera, lighting, post-processing).
    *   `shader-lib/`: Shared GLSL shaders.
    *   `orb-core/`: Shared base Orb implementation, visual state definitions.
    *   `core-utils/`: Generic utilities (formatting, validation, math). *Not to be imported by other shared packages.*
    *   `agent-framework/` (New based on V7TechSpec): BaseAgent class, tool interfaces.
*   **`services/`**: Backend cognitive agents and tools.
    *   `cognitive-hub/`: Unified cognitive services process (hosts Dialogue, Ingestion, Retrieval, Insight, Ontology agents initially).
    *   `tools/`: Standalone deterministic tool implementations (if not part of cognitive-hub).
*   **`workers/`**: Background workers (`ingestion-worker`, `embedding-worker`, etc.).
*   **`3d-assets/`**: Source 3D assets (<5MB in Git), scripts for processing larger assets from object storage.
*   **`infrastructure/`**: IaC (Terraform).
    *   `modules/`: Shared Terraform modules.
    *   `env-aws/`, `env-tencent/`: Region-specific root configurations.
*   **`scripts/`**: Utility, migration, asset processing, shader compilation scripts.
*   **Root Files:** `package.json` (with workspaces), `turbo.json`, ESLint, Prettier, Jest, TSConfig.

### 8.2 API Design

*   **API Gateway (BFF):** Primary client-facing interface.
    *   Exposes GraphQL or tRPC for efficient client-server communication.
    *   May expose some REST endpoints for specific needs (e.g., file uploads).
    *   Handles authentication, rate limiting, request validation.
    *   Aggregates/transforms data from internal services for UI consumption.
*   **Internal APIs:** Services within `cognitive-hub` or future microservices communicate via gRPC or lightweight HTTP APIs, or direct function calls if co-located.

### 8.3 Security Considerations

(From V4TechSpec, adapted for V7)
*   **Authentication & Authorization:** JWT-based auth, OAuth2. Role-based access for admin. User-specific data isolation.
*   **Data Protection:** TLS for connections, HTTPS, encryption at rest. Region-specific data storage.
*   **Privacy Controls:** Granular user control, export/delete, clear privacy policy, opt-in/out for proactive insights.
*   **AI Safeguards:** Prompt security, LLM guardrails, rate limiting, input validation, model output auditing.
*   **API Gateway Security:** Input validation (e.g., Zod), output scrubbing, protection against common web vulnerabilities (OWASP Top 10).

### 8.4 Testing Strategy

(From V4TechSpec, adapted for V7)
*   **Unit Testing:** Jest/Vitest for agent services, tools, UI components (React Testing Library).
*   **Integration Testing:** Test agent pipelines, database interactions, API gateway routing.
*   **End-to-End (E2E) Testing:** Playwright or Cypress for UI flows, including 3D scene interactions (WebGL context stubbing or visual regression for critical scenes).
*   **Component Testing (UI):** Storybook for UI components; Cypress Component Testing for shader-free UI.
*   **3D Testing:** Playwright with WebGL context stubbing for scene logic; snapshot testing for Orb GLB scene JSON.
*   **Semantic Testing:** LLM tool validation, embedding quality, insight generation quality, retrieval precision/recall.
*   **Load & Performance Testing:** k6 or similar for API endpoints, 3D scene rendering benchmarks (FPS, draw calls).
*   **CI/CD Pipeline:** GitHub Actions, automated testing, quality gates, semantic test metrics tracking, canary deployments.

### 8.5 Deployment Strategy

(From V4TechSpec & V7MonorepoDesign)

#### 8.5.1 Infrastructure Architecture

*   **US Deployment (AWS):**
    *   Compute: EKS (Kubernetes) for containerized services (API Gateway, Cognitive Hub, Workers). Lambda for lightweight tools.
    *   Databases: RDS PostgreSQL, ElastiCache (Redis). Self-hosted Neo4j/Weaviate on EC2/EKS or managed services (Neo4j AuraDB, Weaviate Cloud).
    *   Storage: S3. Networking: CloudFront, API Gateway (AWS service), VPC.
    *   AI: Google AI APIs.
*   **China Deployment (Tencent Cloud):**
    *   Compute: TKE (Kubernetes). SCF for serverless.
    *   Databases: TencentDB for PostgreSQL, Tencent Cloud Redis. Self-hosted Neo4j/Weaviate.
    *   Storage: COS. Networking: Tencent CDN, API Gateway (Tencent service).
    *   AI: DeepSeek APIs.
*   **Shared:** Docker containerization, Terraform for IaC (`infrastructure/env-aws` & `infrastructure/env-tencent`), CI/CD pipeline with regional targets.

#### 8.5.2 Data Residency & Compliance

*   Strict regional data isolation. No cross-region user content transfer.
*   Region-specific AI model access.
*   Shared core codebase with region-specific configurations and feature flags.

#### 8.5.3 Scaling Strategy

*   Horizontal scaling for stateless services (API Gateway, agents).
*   Database read replicas. Worker pools scale on queue depth.
*   Autoscaling, scheduled scaling, spot instances for cost optimization.

#### 8.5.4 Monitoring & Observability

*   **Metrics:** System health, performance, user engagement, AI quality, business metrics.
*   **Tools:**
    *   US: AWS CloudWatch, DataDog/Prometheus+Grafana.
    *   China: Tencent Cloud Monitor, Prometheus+Grafana.
    *   OpenTelemetry for distributed tracing.
*   **Alerting:** Critical service degradation, error rates, cost thresholds, model performance.

#### 8.5.5 Backup & Disaster Recovery

*   Daily incremental, weekly full backups for databases. Point-in-time recovery.
*   Cross-zone/region backups (within compliance boundaries).
*   Automated failover for critical components, documented manual procedures. Multi-AZ deployment.

## 9. Design Principles Implementation Summary

This V7 specification systematically implements the refined design principles:

1.  **Configuration Over Schema:** Growth dimensions, card evolution rules, ontology categories, and UI mappings are stored in Redis or config files, allowing changes without DB schema migrations.
2.  **Event-Sourcing for Growth & Analytics:** The `growth_events` table serves as an append-only ledger for all dimension progress and significant user actions, preserving history and enabling flexible analytics.
3.  **Dynamic Computation Over Static Storage:** Materialized views (`mv_entity_growth_progress`) and computed views (`v_card_evolution_state`) provide efficient access to derived data, minimizing redundant stored state.
4.  **Distributed Storage By Domain:** PostgreSQL for core/event data, Neo4j for graph relationships, Weaviate for vectors, Redis for cache/config/queues, each used for its strengths.
5.  **Lean Data Layer:** PostgreSQL schema focuses on raw data and events, with complex processing and analytics in agent layers or background workers.
6.  **Monorepo Principles:** Strict separation of concerns, binary-free source of truth, and progressive service decomposition are embedded in the project structure and development workflow.

## 10. Conclusion & Next Steps

### 10.1 Implementation Roadmap (V7 Focused)

**Phase 1: Foundation & Core Backend (Months 1-3)**
*   Monorepo setup, CI/CD pipeline basics.
*   Core data models in PostgreSQL (Users, Concepts, MemoryUnits, `growth_events`).
*   Basic Ingestion Analyst creating `growth_events`.
*   Simple Dialogue Agent (text-only, no Orb visuals yet) with basic retrieval (PostgreSQL only).
*   API Gateway MVP.
*   Deployment of core backend services to one region.

**Phase 2: UI Core & Knowledge Graph Basics (Months 4-6)**
*   Basic 3D Canvas infrastructure (R3F setup, simple scene).
*   2D Modal Layer foundations (basic Card, Dashboard components).
*   Orb MVP (simple sphere, basic state changes driven by Dialogue Agent).
*   Neo4j integration: `Concept` and `MemoryUnit` nodes, basic `RELATED_TO` relationships.
*   Retrieval Planner enhanced with graph queries.
*   Weaviate integration: Embedding of Chunks and Concepts. Retrieval Planner uses vector search.
*   Card Gallery MVP displaying cards with data from PostgreSQL and Neo4j. Basic `mv_entity_growth_progress` and `v_card_evolution_state`.

**Phase 3: Immersive UI & Growth Model (Months 7-9)**
*   Full implementation of CloudScene, AscensionScene, GraphScene with interactive elements.
*   Detailed Orb visuals, animations, and complex state management.
*   Card Gallery with full Six-Dimensional Growth Model visualization and evolution animations.
*   Dashboard with growth metrics and insights.
*   Challenge System (`challenge_templates`, `user_challenges`, `DerivedArtifacts` for rewards).
*   Insight Engine MVP generating basic patterns and `DerivedArtifacts`.
*   Ontology Steward MVP for managing core types.

**Phase 4: Advanced Features & Polish (Months 10-12)**
*   Advanced shaders and post-processing effects for 3D Canvas.
*   Sophisticated Insight Engine capabilities (metaphorical connections, "Orb's Dream Cards").
*   Full mobile app experience parity.
*   Performance optimization across frontend and backend.
*   Comprehensive accessibility features.
*   Cross-region deployment and testing for second region.
*   Robust monitoring, logging, and alerting.

### 10.2 Critical Success Factors

1.  **User-Centered Iteration:** Continuous user testing of UI/UX, especially 3D interactions and Orb behavior.
2.  **Performance:** Smooth frame rates in 3D scenes and responsive backend are crucial for immersion.
3.  **Data Model Integrity:** Ensuring consistency and accuracy across the polyglot persistence layer, especially with event-sourcing.
4.  **AI Quality:** Relevance of insights, naturalness of Dialogue Agent, accuracy of retrieval.
5.  **Team Synergy:** Close collaboration between 3D artists, UI/UX designers, frontend, and backend engineers.
6.  **Scalability & Cost-Effectiveness:** Efficient use of cloud resources and scalable architecture.

### 10.3 Open Questions & Research Areas

1.  **Optimal Hybrid Retrieval:** Fine-tuning the balance between vector, graph, and relational search for different query types and contexts.
2.  **Long-Term Knowledge Graph Evolution:** Managing concept drift, graph maintenance, and pruning as user data grows extensively.
3.  **Personalization Nuances:** Deep adaptation to user communication styles, implicit privacy learning, and fine-tuning proactivity without being intrusive.
4.  **Multi-Modal Integration Depth:** Beyond captions/transcripts, exploring unified embedding spaces and cross-modal reasoning for richer insights.
5.  **Ethical AI:** Ensuring fairness, transparency, and user control over AI-generated insights and suggestions, particularly related to personal growth.
6.  **Scalability of Event Sourcing:** Strategies for managing very large `growth_events` tables (e.g., snapshotting, archiving) while maintaining performance of materialized views.

This V7 Ultimate Technical Specification provides a comprehensive blueprint for building 2dots1line. It aims to balance sophisticated AI and knowledge graph capabilities with an emotionally resonant, immersive user experience, all built upon a flexible and robust technical foundation.

---

**Content Storage Strategy:**

*   **`MemoryUnit.content` (TEXT):** Stores **processed/transcribed text content** ready for analysis and display.
    *   For text inputs: Cleaned, normalized user input (typos corrected, formatting standardized).
    *   For media inputs: Extracted text content (OCR results, transcriptions, captions).
    *   For documents: Extracted text content from PDFs, Word docs, etc.

*   **`raw_content` Table (DEPRECATED):**
    *   **Purpose:** Originally intended for storing **unmodified user input** before processing.
    *   **Current Status:** **MARKED FOR REMOVAL** - Redundant with current architecture.
    *   **Replacement Strategy:** 
        *   Text inputs: Store original in `MemoryUnit.content` if no processing needed, or maintain processing history in `user_activity_log`.
        *   Binary files: Store in object storage (S3/COS) and reference via `Media.url`.

*   **`Media.url` (TEXT):** References **original binary files** stored in object storage.
    *   Images, audio, video, documents stored in S3/COS.
    *   `Media.caption` stores extracted/generated text descriptions.
    *   `MemoryUnit.content` contains the textual representation derived from media.

*   **Content Processing Flow:**
    ```typescript
    // Text Input
    User Input → MemoryUnit.content (direct storage)
    
    // Media Input  
    User Upload → S3/COS → Media.url (reference)
                ↓
    OCR/Transcription → MemoryUnit.content (extracted text)
                     → Media.caption (description)
    
    // Document Input
    File Upload → S3/COS → Media.url (reference)
                ↓
    Text Extraction → MemoryUnit.content (extracted text)
    ```

*   **Migration Plan:** Remove `raw_content` table in next schema migration, ensure all content properly categorized between `MemoryUnit.content` and `Media` storage.

## 11. AI Agent Reporting Standards

### 11.1 Development Progress Reporting

**Mandatory Task Referencing:**
*   AI agents providing development logs or progress updates **MUST** clearly reference the specific Task ID from the official project roadmap.
*   Format: `"Progress on [Sprint].[Task]: [Description]"` (e.g., "Progress on S3.T1: Implemented NER tool with selective concept creation")
*   If work deviates from or expands upon a roadmap task, this **MUST** be explicitly noted and justified.
*   New internal sub-tasks should be linked back to the overarching roadmap task they contribute to.

**Example Reporting Format:**
```
## Development Log Entry - 2025-01-26

### Task: S3.T1 - Implement NER Tool for Entity Extraction

**Completed:**
- ✅ Created comprehensive NER tool at `/services/tools/text-tools/src/ner.ts`
- ✅ Implemented 7 entity types: PERSON, ORGANIZATION, LOCATION, DATE, EMAIL, PHONE, URL
- ✅ Added confidence scoring and context extraction
- ✅ Created unit tests with 14/15 passing

**Deviations/Expansions:**
- Added performance timing metrics (not in original spec) - justified for monitoring
- Implemented deduplication logic (expansion) - prevents duplicate entity extraction

**Next Steps for S3.T1:**
- Fix remaining test failure in convenience function
- Integration with IngestionAnalyst for selective concept creation

**Related Tasks:**
- Contributes to S3.T2 (Ingestion Pipeline) through entity extraction capability
```

**Quality Standards:**
*   Progress reports must include specific file paths, implementation details, and test results.
*   Any assumptions made due to specification ambiguities must be clearly stated.
*   Links to related tasks and dependencies should be explicitly noted.
*   Human verification steps should be clearly outlined when AI cannot directly test functionality.

### 11.2 Code Documentation Standards

**Inline Documentation:**
*   All AI-generated code must include clear JSDoc/TSDoc comments for public APIs.
*   Complex algorithms or business logic must include explanatory comments.
*   Configuration files must include inline comments explaining purpose and usage.

**Commit Message Standards:**
*   Format: `feat(TaskID): Brief description`
*   Examples: `feat(S3.T1): Add NER tool with 7 entity types`, `fix(S3.T1): Resolve regex pattern issues in person name extraction`

This standardization ensures human reviewers can efficiently track progress against the planned workstreams and maintain project coherence across AI-assisted development cycles.