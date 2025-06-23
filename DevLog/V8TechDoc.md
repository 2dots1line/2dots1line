
### **File 1 of 4: V8 Ultimate Technical Specification**
---
# **2dots1line V8 Ultimate Technical Specification**

**Document Version:** 8.0  
**Date:** June 14, 2025  
**Authors:** AI Collaboration with Human Direction

## **1. Executive Summary**

The 2dots1line System is a production-grade knowledge graph platform designed to help users define their identity, find their voice, and build profound connections with their inner self and the world. It transforms a continuous stream of user inputs (conversations, journal entries, media) into a rich, interconnected personal knowledge model.

This V8 specification marks a significant architectural evolution, formalizing a **cyclical, multi-layered processing pipeline** and establishing the **"Card" as the primary, user-facing representation of knowledge**. The system moves beyond simple data retrieval to a proactive, context-aware model that surfaces insights and guides user growth through a refined, configuration-driven framework. The core principle is a clear separation between the deep, underlying knowledge graph and the curated, tangible card-based user experience.

### **Core V8 Capabilities:**

*   **Cyclical Agent Pipeline:** A dual-loop system where a "fast loop" processes individual conversations tactically, and a "slow loop" performs strategic, global analysis of the user's knowledge graph over time (a "cycle").
*   **Persistent Card System:** The "Card" is a first-class entity in the database, representing a curated view of an underlying knowledge node (`MemoryUnit`, `Concept`, `DerivedArtifact`) or a proactive "Quest." This provides a stable foundation for the user experience.
*   **Configuration-Driven Logic:** Key business logic, including card layouts, challenge rules, and growth model triggers, is managed in external configuration files, allowing for rapid iteration without database migrations.
*   **Proactive "Quest" Generation:** The Insight Engine can identify knowledge gaps and generate "Quest Cards," prompting users to explore new facets of their lives and enrich their knowledge graph.
*   **Holistic Conversation Analysis:** Conversations are treated as the primary unit of analysis, with importance scores and memory extraction occurring at the conversation level, leading to more meaningful insights.
*   **Unified Semantic Search:** A consolidated Weaviate schema allows for powerful, meaning-based searches across all types of knowledge entities.

## **2. V8 Foundational Principles**

1.  **Card as a Persistent Entity:** The user-facing "Card" is a stable record in the database, providing a consistent anchor for the UI. It is a distinct entity that *points to* underlying knowledge nodes.
2.  **Cyclical Processing Loops:** The system operates on two timescales: a fast, post-conversation loop for immediate knowledge integration and a slow, post-cycle loop for deep, strategic analysis and ontology refinement.
3.  **Configuration over Schema:** Business rules (Card Templates, Challenge Templates, Growth Rules) are defined in configuration files, not database tables, for maximum flexibility.
4.  **Agent Specialization by Frequency:** Agents are defined by their operational frequency. The `IngestionAnalyst` is tactical (post-conversation), while the `InsightEngine` is strategic (post-cycle). The `OntologySteward` is an on-demand validation service.
5.  **Graceful Ontology Evolution:** Merging concepts does not delete user-facing history. Instead, old entities are marked as "merged," creating a seamless user experience that respects their interaction history.
6.  **Separation of Knowledge and Presentation:** The PostgreSQL/Neo4j graph represents the deep, underlying knowledge. The `Card` table and `CardService` create a curated presentation layer on top of that knowledge.

## **3. System Architecture Overview**

The V8 architecture refines the agent roles and introduces the `CardService` as a central component for preparing the user experience.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER (Web/Mobile)                │
│                         (Endless 2D Card Canvas)                        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                   │ (API Gateway / BFF)
                  ┌───────────────▼───────────────┐
                  │         CARD SERVICE          │
                  │ (Queries Card Table & Enriches) │
                  └────┬──────────────────────┬───┘
                       │                      │ (Queries other services)
                       │                      │
┌──────────────────────▼──────────────────────▼───────────────────────────┐
│                        BACKEND SERVICES & AGENTS                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌───────────┐ │
│ │ Dialogue Agent  │ │ Ingestion Analyst │ Insight Engine  │ Ontology  │ │
│ │ (Real-time)     │ │ (Post-Convo)      │ (Post-Cycle)    │ Steward   │ │
│ └──────┬──────────┘ └───────┬─────────┘ └───────┬───────┘ └────┬──────┘ │
└────────┼────────────────────┼───────────────────┼────────────────┼────────┘
         │ (Tools)            │ (Tools)           │ (Tools)        │ (Config)
┌────────┼────────────────────┼───────────────────┼────────────────┼────────┐
│        ▼                    ▼                   ▼                ▼        │
│                         PERSISTENCE LAYER                                 │
│ ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐      │
│ │ PostgreSQL │   │   Neo4j    │   │  Weaviate  │   │   Redis    │      │
│ │(Cards,Data)│   │(Relations) │   │ (Semantic) │   │(Cache,Jobs)│      │
│ └────────────┘   └────────────┘   └────────────┘   └────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## **4. Agent Pipeline (V8 Refined Flow)**

### **4.1. Fast Loop: Post-Conversation Processing**
*   **Trigger:** A conversation becomes inactive for a configured duration (e.g., 5 minutes). A `conversation_timeout_worker` marks the conversation as `ended` and queues it for processing.
*   **Agent Responsible:** `IngestionAnalyst`
*   **Tasks:**
    1.  **Summarize Conversation:** Generate a concise summary of the dialogue.
    2.  **Assign Importance:** Score the entire conversation's significance. Low-importance conversations may be skipped for further processing.
    3.  **Extract `MemoryUnit`s:** Holistically analyze the conversation to create one or more new `MemoryUnit` records.
    4.  **Extract `Concept`s:** Identify and create or link `Concept`s mentioned.
    5.  **Create `GrowthEvent`s:** Detect actions or reflections that trigger events in the Six-Dimensional Growth Model.
    6.  **Generate `Card`s:** Based on rules (e.g., in `card_templates.json`), create `Card` records in PostgreSQL for the new `MemoryUnit`s and any `Concept`s that have just received a growth event.
    7.  **Generate Proactive Prompts:** Create short-term `ProactivePrompt`s for follow-up questions.
    8.  **Update Vector DB:** Create/update entries in Weaviate for the new entities and their textual chunks.

### **4.2. Slow Loop: Post-Cycle Processing**
*   **Trigger:** A periodic scheduler (e.g., daily, weekly) initiates a new "cycle."
*   **Agent Responsible:** `InsightEngine`
*   **Tasks:**
    1.  **Ontology Review:** Perform a global analysis of the Neo4j graph. Merge duplicative concepts, reconcile conflicts, and identify new thematic `Community` clusters.
    2.  **Generate `userMemoryProfile`:** Create a new, condensed summary of the user's core concepts, goals, and recent events. This profile is stored in `users.memory_profile` and is used to bootstrap all future conversations.
    3.  **Generate Global Insights:** Discover long-term trends, correlations, and metaphorical connections. Create `DerivedArtifact`s for these insights.
    4.  **Generate "Quest Cards":** Identify major knowledge gaps in the user's graph and create `ProactivePrompt`s and corresponding "Quest" `Card`s to encourage exploration.
    5.  **Generate Cycle Report:** Create a `DerivedArtifact` of type `cycle_report` that summarizes the user's growth and key events from the last cycle.
    6.  **Generate `Card`s:** Create `Card` records for the new `cycle_report` and any major `insight` artifacts.

### **4.3. On-Demand: Semantic Governance**
*   **Trigger:** An agent needs to validate a new term or fetch configuration.
*   **Agent/Service Responsible:** `OntologySteward`
*   **Tasks:**
    1.  **  Serve Configuration:** Provide access to `card_templates.json`, `challenges.json`, `growth_model_rules.json`, and `controlled_vocabularies.json`.
    2.  **Validate Semantics:** Provide a real-time service for other agents to check if a newly extracted term should be mapped to an existing concept.
    3.  **Manage Feedback:** Manage the `entity_feedback` and `ontology_suggestions` tables for admin review.

## **5. Knowledge Model & Persistence Layer**

The V8 persistence layer is refined to support the new Card-centric architecture and cyclical pipeline.

### **5.1. PostgreSQL: The System of Record**

PostgreSQL stores all structured, transactional data. It is the definitive source for user data, content, and the state of all user-facing entities, including cards.

*   **Key Models:**
    *   **`User`**: Stores user identity and their top-level profiles (`memory_profile`, `growth_profile`) generated by the `InsightEngine`.
    *   **`Conversation`**: A log of a single, continuous interaction episode. Crucially, it now holds the `importance_score` for the entire dialogue.
    *   **`MemoryUnit`**: A canonical piece of knowledge extracted from a source like a conversation or journal. It is linked back to its source `Conversation` if applicable.
    *   **`Concept`**: A named entity, theme, or idea. Now includes a `status` field (`active`, `merged`) to handle graceful ontology evolution.
    *   **`Card` (New & Central):** The new, first-class table that represents every card visible to the user. It links a `card_type` to a `source_entity` (like a `MemoryUnit`, `Concept`, or `ProactivePrompt`), defining what the user sees in their gallery.
    *   **`growth_events`**: The immutable, append-only log of all actions contributing to user growth. Its structure is unchanged and remains fundamental.
    *   **`UserChallenge`**: The log of a user's interaction with a challenge. Its structure is unchanged.
*   **Removed Models:**
    *   **`Chunk`**: This is now an in-memory concept for the `IngestionAnalyst` and a persistent one only in Weaviate. Removing it from PostgreSQL eliminates major data redundancy.
    *   **`ChallengeTemplate`**: This is now managed as a configuration file (`challenges.json`) for flexibility.
    *   **`OrbState`**: Real-time state is better suited for Redis. Logging this to PostgreSQL creates unnecessary write load for a low-priority analytics use case.

### **5.2. Neo4j: The System of Relationships**

Neo4j's role remains the same and is critically important: it models the rich, complex relationships between the underlying knowledge entities. It is the "why" and "how" things are connected.

*   **Nodes:** The primary nodes are `:User`, `:MemoryUnit`, `:Concept`, and `:DerivedArtifact`. **There is no `:Card` node.** The card is a presentation concept.
*   **Relationships:** The `[:HIGHLIGHTS]`, `[:RELATED_TO]`, and `[:PERCEIVES]` relationships form the core of the semantic graph.
*   **Usage:** The `InsightEngine` performs its global analysis here. The `DialogueAgent` runs targeted queries here for on-demand context. The `CardService` queries it for connectivity data (e.g., `connection_count`) to enrich cards.

### **5.3. Weaviate: The System of Semantics**

Weaviate's role is to be the fast, searchable semantic index for all textual content in the knowledge graph.

*   **Unified Class:** V8 consolidates into a single `UserKnowledgeItem` class. This is a significant optimization.
*   **Content:** This class stores vectors for both high-level entities (like a `Concept`'s description) and granular `chunks` of text from source messages.
*   **Metadata:** Crucial metadata fields like `parentMemoryUnitId` and `sourceConversationId` allow the system to trace a found chunk back to its canonical source in PostgreSQL.
*   **Usage:** The `RetrievalPlanner` uses it for finding context for the `DialogueAgent`. The `CardService` can use it for semantic card search.

### **5.4. Redis: The System of Cache & Queues**

Redis's role is unchanged: it manages ephemeral state, job queues, and cached configuration.

*   **Cache:** Caches user sessions, frequently accessed configuration files (`card_templates.json`, etc.), and expensive query results.
*   **Queues:** Manages job queues for the `IngestionAnalyst` and `InsightEngine` using BullMQ or a similar library.

## **6. Backend Services**

*   **`CardService`:** Now a central service. Its primary job is to query the `Card` table and enrich the results with data from other sources (PostgreSQL views for growth, Neo4j for connections) before sending a unified DTO to the frontend.
*   **`DialogueAgent`, `IngestionAnalyst`, `InsightEngine`:** Roles are redefined by the new cyclical pipeline, as described in Section 4.
*   **`OntologySteward`:** Refocused as an on-demand semantic governance and configuration management service.

## **7. UI/UX Integration (High-Level)**

As requested, this section is simplified to focus on the backend's responsibility.

*   **The Endless 2D Canvas:** The primary UI is an "endless" canvas for displaying cards, similar to a spatial board.
*   **Card Rendering:** The frontend is responsible for rendering different `Card` DTOs using the appropriate React component, as specified by the `card_type` and `componentName` provided by the `CardService`.
*   **Filtering:** The frontend will provide filter pills (as per clarification #7) that translate into API query parameters for the `GET /api/cards` endpoint, allowing the `CardService` to return a filtered set of cards.

This V8 specification provides a leaner, more powerful, and logically coherent blueprint for development. It embraces the system's core value propositions while creating a more maintainable and scalable architecture.

---
### **File 2 of 4: PostgreSQL V8 Schema (Prisma)**
---
```prisma
// packages/database/prisma/schema.prisma
// V8.0 - Card-Centric & Cyclical Pipeline Architecture

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native"]
  output        = "../../../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========================================================================
// SECTION 1: CORE USER & SESSION MANAGEMENT
// ========================================================================
// Foundational models for user identity, authentication, and profiles.

model User {
  user_id             String    @id @default(uuid())
  email               String    @unique
  hashed_password     String?
  name                String?
  region              String    @default("us")
  account_status      String    @default("active")
  created_at          DateTime  @default(now())
  last_active_at      DateTime? @updatedAt

  // Stores user-configurable settings like Orb style, insight frequency.
  preferences         Json?
  // Stores the high-level summary of the user's graph, generated by the InsightEngine at the end of each cycle.
  // This is the "userMemoryProfile" and is critical for bootstrapping conversations.
  memory_profile      Json?
  // Stores aggregated scores for the Six-Dimensional Growth model for quick dashboard display.
  growth_profile      Json?

  // --- Relations ---
  sessions                UserSession[]
  conversations           Conversation[]
  cards                   Card[]
  memory_units            MemoryUnit[]
  concepts                Concept[]
  media                   Media[]
  annotations             Annotation[]
  reflections             Reflection[]
  derived_artifacts       DerivedArtifact[]
  user_challenges         UserChallenge[]
  proactive_prompts       ProactivePrompt[]
  growth_events           growth_events[]       @relation("UserGrowthEvents")
  communities             Community[]
}

model UserSession {
  session_id     String   @id @default(uuid())
  user_id        String
  user           User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  device_info    Json?
  ip_address     String?
  user_agent     String?
  created_at     DateTime @default(now())
  expires_at     DateTime
  last_active_at DateTime @updatedAt

  @@index([user_id])
  @@index([expires_at])
  @@map("user_sessions")
}


// ========================================================================
// SECTION 2: CONVERSATION & INTERACTION LOGGING
// ========================================================================
// Models that capture the raw back-and-forth between the user and the AI.

model Conversation {
  id                String    @id @default(uuid())
  user_id           String
  user              User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  title             String?
  start_time        DateTime  @default(now())
  last_active_time  DateTime  @updatedAt
  ended_at          DateTime?
  status            String    @default("active") // 'active', 'ended', 'processing', 'summarized'
  // The importance of the entire conversation, used to decide processing depth and context inclusion.
  importance_score  Float?
  context_summary   String?
  metadata          Json?

  // --- Relations ---
  messages          ConversationMessage[]
  // A conversation can result in the creation of multiple MemoryUnits.
  spawned_memory_units MemoryUnit[] @relation("ConversationToMemoryUnit")

  @@index([user_id, status])
  @@index([user_id, importance_score])
}

model ConversationMessage {
  id              String      @id @default(uuid())
  conversation_id String
  conversation    Conversation @relation(fields: [conversation_id], references: [id], onDelete: Cascade)
  role            String      // 'user' or 'assistant'
  content         String
  message_type    String      @default("text")
  timestamp       DateTime    @default(now())
  metadata        Json?

  @@map("conversation_messages")
  @@index([conversation_id, timestamp])
}


// ========================================================================
// SECTION 3: CARD & KNOWLEDGE MANAGEMENT
// ========================================================================
// The Card is the central, persistent entity for the user experience.
// It points to an underlying knowledge node.

model Card {
  card_id             String    @id @default(uuid())
  user_id             String
  user                User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  // The type of card, used for template mapping on the frontend.
  card_type           String    // e.g., 'growth_concept', 'quest', 'journal_entry', 'cycle_report'

  // Link to the source entity. This is the core of the Card's identity.
  source_entity_id    String
  source_entity_type  String    // 'MemoryUnit', 'Concept', 'DerivedArtifact', 'ProactivePrompt'

  status              String    @default("active") // 'active', 'archived', 'completed' (for quests)
  is_favorited        Boolean   @default(false)
  user_order_position Float?    // For custom user arrangement on the canvas.

  // Optional link to a prompt that is associated with this card's "next action".
  associated_prompt_id String?
  associated_prompt   ProactivePrompt? @relation(fields: [associated_prompt_id], references: [prompt_id], onDelete: SetNull)

  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@map("cards")
  @@index([user_id, status])
  @@index([source_entity_id, source_entity_type])
}

// These are the underlying knowledge nodes that a Card can point to.

model MemoryUnit {
  muid                       String    @id @default(uuid())
  user_id                    String
  user                       User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  source_type                String    // 'journal_entry', 'conversation_extraction', 'image_upload', etc.
  title                      String?
  content                    String?
  creation_ts                DateTime
  ingestion_ts               DateTime  @default(now())
  last_modified_ts           DateTime  @updatedAt
  processing_status          String    @default("raw")
  metadata                   Json?

  source_conversation_id     String?
  source_conversation        Conversation? @relation("ConversationToMemoryUnit", fields: [source_conversation_id], references: [id], onDelete: SetNull)

  // --- Relations ---
  media_links                Media[]
  reflections                Reflection[]
  derived_artifacts_as_source DerivedArtifact[] @relation("DerivedArtifactSourceMemoryUnit")

  @@map("memory_units")
  @@index([user_id, creation_ts(sort: Desc)])
}

model Concept {
  concept_id      String    @id @default(uuid())
  user_id         String
  user            User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  name            String
  type            String
  description     String?
  community_id    String?
  community       Community? @relation(fields: [community_id], references: [community_id], onDelete: SetNull)
  // `status` and `merged_into_concept_id` are crucial for graceful ontology merges.
  status          String    @default("active") // 'active', 'merged', 'archived'
  merged_into_concept_id String?
  merged_into_concept    Concept?  @relation("ConceptMerge", fields: [merged_into_concept_id], references: [concept_id], onDelete: NoAction, onUpdate: NoAction)
  merge_children         Concept[] @relation("ConceptMerge")
  created_at      DateTime  @default(now())
  last_updated_ts DateTime  @updatedAt
  metadata        Json?

  // --- Relations ---
  derived_artifacts DerivedArtifact[] @relation("ConceptToDerivedArtifact")
  annotations       Annotation[]      @relation("ConceptToAnnotation")

  @@map("concepts")
  @@unique([user_id, name, type])
  @@index([user_id, type])
}

model Media {
  id                String      @id @default(uuid())
  muid              String
  memory_unit       MemoryUnit  @relation(fields: [muid], references: [muid], onDelete: Cascade)
  user_id           String
  user              User        @relation(fields: [user_id], references: [user_id])
  type              String
  storage_url       String
  mime_type         String?
  caption           String?
  processing_status String      @default("pending")
  metadata          Json?
  created_at        DateTime    @default(now())

  @@map("media")
  @@index([muid])
  @@index([user_id, type])
}


// ========================================================================
// SECTION 4: GROWTH, CHALLENGES & GAMIFICATION
// ========================================================================

model growth_events {
  event_id    String   @id @default(uuid())
  user_id     String
  entity_id   String
  entity_type String
  dim_key     String
  delta       Float
  source      String
  created_at  DateTime @default(now())
  details     Json?

  user        User     @relation("UserGrowthEvents", fields: [user_id], references: [user_id], onDelete: Cascade)

  @@map("growth_events")
  @@index([user_id, entity_id, entity_type])
  @@index([user_id, dim_key])
}

// ChallengeTemplate is removed and will be managed in a config file.
// UserChallenge tracks a user's progress against a template from the config.
model UserChallenge {
  user_challenge_id     String            @id @default(uuid())
  user_id               String
  user                  User              @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  // This now refers to an ID from the challenges.json config file. No direct DB relation.
  challenge_template_id String
  status                String            @default("active")
  start_time            DateTime          @default(now())
  completion_time       DateTime?
  progress_json         Json?
  user_notes            String?

  @@map("user_challenges")
  @@index([user_id, status])
  @@index([user_id, challenge_template_id])
}


// ========================================================================
// SECTION 5: DERIVED CONTENT & META-LAYERS
// ========================================================================

model Reflection {
  reflection_id    String      @id @default(uuid())
  user_id          String
  user             User        @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  memory_unit_id   String
  memory_unit      MemoryUnit  @relation(fields: [memory_unit_id], references: [muid], onDelete: Cascade)
  content          String
  reflection_type  String
  created_at       DateTime    @default(now())
  sentiment        Float?
  insights_json    Json?

  @@map("reflections")
  @@index([memory_unit_id])
}

model Annotation {
  aid                String   @id @default(uuid())
  user_id            String
  user               User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  target_id          String
  target_node_type   String
  annotation_type    String
  text_content       String
  source             String
  created_at         DateTime @default(now())
  metadata           Json?

  concepts           Concept[] @relation("ConceptToAnnotation")

  @@map("annotations")
  @@index([user_id, target_id, target_node_type])
}

model DerivedArtifact {
  artifact_id                 String      @id @default(uuid())
  user_id                     String
  user                        User        @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  artifact_type               String      // 'insight', 'cycle_report', 'trophy'
  title                       String?
  content_json                Json
  generated_by_agent          String?
  source_memory_unit_id       String?
  source_memory_unit          MemoryUnit? @relation("DerivedArtifactSourceMemoryUnit", fields: [source_memory_unit_id], references: [muid], onDelete: SetNull)
  created_at                  DateTime    @default(now())

  concepts                    Concept[]   @relation("ConceptToDerivedArtifact")

  @@map("derived_artifacts")
  @@index([user_id, artifact_type])
}

model Community {
  community_id     String    @id @default(uuid())
  user_id          String
  user             User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  name             String?
  description      String?
  detection_method String?
  created_at       DateTime  @default(now())
  last_analyzed_ts DateTime?

  concepts         Concept[]

  @@map("communities")
  @@index([user_id])
}

model ProactivePrompt {
  prompt_id         String    @id @default(uuid())
  user_id           String
  user              User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  prompt_text       String
  source_agent      String
  priority          Int       @default(5)
  status            String    @default("pending") // 'pending', 'delivered', 'completed', 'dismissed'
  created_at        DateTime  @default(now())
  delivered_at      DateTime?

  // A prompt can be associated with one card (e.g., a "Quest" card).
  associated_card   Card?

  @@index([user_id, status, priority])
  @@map("proactive_prompts")
}
```

---
### **File 3 of 4: Neo4j V8 Schema (Cypher)**
---
```cypher
// Neo4j V8 Schema - Constraints & Indexes
// This script defines the structure for the underlying knowledge graph.
// It should be run against a clean Neo4j 5.x database.
// The nodes defined here are the sources of truth that "Cards" in PostgreSQL point to.

// --- CONSTRAINTS (Ensure Uniqueness) ---
// Constraints automatically create a backing index.

// A User's ID must be unique across all User nodes.
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE;

// Each MemoryUnit must have a unique ID.
CREATE CONSTRAINT memoryunit_id_unique IF NOT EXISTS FOR (mu:MemoryUnit) REQUIRE mu.muid IS UNIQUE;

// Each Concept must have a unique ID.
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// Each DerivedArtifact must have a unique ID.
CREATE CONSTRAINT derivedartifact_id_unique IF NOT EXISTS FOR (da:DerivedArtifact) REQUIRE da.id IS UNIQUE;

// Each thematic Community must have a unique ID.
CREATE CONSTRAINT community_id_unique IF NOT EXISTS FOR (co:Community) REQUIRE co.community_id IS UNIQUE;


// --- INDEXES (For Query Performance) ---
// Create indexes on properties that will be frequently used in WHERE clauses.

// Index on Concept name for faster lookups by name.
CREATE INDEX concept_name_idx IF NOT EXISTS FOR (c:Concept) ON (c.name);

// Index on Concept type for finding all concepts of a certain type (e.g., all 'goals').
CREATE INDEX concept_type_idx IF NOT EXISTS FOR (c:Concept) ON (c.type);

// Index on MemoryUnit creation timestamp for temporal queries.
CREATE INDEX memoryunit_creation_ts_idx IF NOT EXISTS FOR (mu:MemoryUnit) ON (mu.creation_ts);

// Index on User ID for all primary node types to optimize user-scoped queries.
CREATE INDEX user_scoped_memoryunit_idx IF NOT EXISTS FOR (n:MemoryUnit) ON (n.userId);
CREATE INDEX user_scoped_concept_idx IF NOT EXISTS FOR (n:Concept) ON (n.userId);
CREATE INDEX user_scoped_derivedartifact_idx IF NOT EXISTS FOR (n:DerivedArtifact) ON (n.userId);

// It is NOT recommended to create a :Card node in Neo4j. The card is a presentation-layer
// concept managed in PostgreSQL. The graph should only contain the core knowledge entities.

// NOTE ON RELATIONSHIP INDEXES:
// As of Neo4j 5, relationship property indexes are available and can be useful for
// complex queries that filter on relationship properties (e.g., weight, timestamp).
// Example (if needed later):
// CREATE INDEX rel_related_to_weight_idx IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.weight);
```

---
### **File 4 of 4: Weaviate V8 Schema (JSON)**
---
```json
{
  "classes": [
    {
      "class": "UserKnowledgeItem",
      "description": "A unified searchable item representing either a high-level entity (Concept, MemoryUnit, DerivedArtifact) or a granular chunk of text from a source message. This is the semantic index for the user's entire knowledge graph.",
      "vectorizer": "none",
      "properties": [
        {
          "name": "externalId",
          "dataType": ["uuid"],
          "description": "The UUID of the item in PostgreSQL. For a text_chunk, this can be a generated UUID."
        },
        {
          "name": "userId",
          "dataType": ["string"],
          "description": "The user this item belongs to.",
          "indexInverted": true
        },
        {
          "name": "itemType",
          "dataType": ["string"],
          "description": "The type of this item: 'high_level_entity' or 'text_chunk'.",
          "indexInverted": true
        },
        {
          "name": "entityType",
          "dataType": ["string"],
          "description": "If itemType is 'high_level_entity', this is 'concept', 'memory_unit', etc. If 'text_chunk', this is null.",
          "indexInverted": true
        },
        {
          "name": "textContent",
          "dataType": ["text"],
          "description": "The primary text content that is vectorized and made searchable."
        },
        {
          "name": "title",
          "dataType": ["text"],
          "description": "The title of the item, for metadata and potential keyword search.",
          "indexInverted": true
        },
        {
          "name": "embeddingModelVersion",
          "dataType": ["string"],
          "description": "Version of the external model used for the vector generation.",
          "indexInverted": true
        },
        {
          "name": "createdAt",
          "dataType": ["date"],
          "description": "Creation timestamp for temporal filtering.",
          "indexInverted": true
        },
        {
          "name": "parentMemoryUnitId",
          "dataType": ["uuid"],
          "description": "If this is a text_chunk, which MemoryUnit was it associated with?",
          "indexInverted": true
        },
        {
          "name": "sourceConversationId",
          "dataType": ["uuid"],
          "description": "The conversation this chunk or entity originated from.",
          "indexInverted": true
        },
        {
          "name": "sourceMessageId",
          "dataType": ["uuid"],
          "description": "If this is a text_chunk, which specific message did it come from?",
          "indexInverted": true
        }
      ]
    }
  ]
}
```