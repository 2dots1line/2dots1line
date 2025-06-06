# 2dots1line V7 Technical Specification

**Document Version:** 7.0  
**Date:** July 1, 2025  
**Authors:** AI Collaboration with Human Direction

## 1. Executive Summary

The 2dots1line System is a production-grade knowledge graph platform designed to help users define their identity, find their voice, gain creative agency, and build profound connections with their inner self and the world. It transforms a continuous stream of user inputs (conversations, journal entries, media, documents) into a rich, interconnected personal knowledge model presented through an immersive, emotionally resonant user experience.

This V7 Technical Specification integrates the comprehensive backend architecture from V4 with the immersive visual design language from V7 UI/UX Design to create a fully-realized product that not only discovers meaningful patterns across semantically and temporally distant data points but presents them in a way that is beautiful, intuitive, and emotionally resonant.

### Core Capabilities

- **Efficient Data Ingestion & Knowledge Graph Construction:** Process multi-modal user inputs into structured knowledge with tiered analysis based on significance.
- **Hybrid Retrieval Intelligence:** Combine vector, graph, and relational queries for nuanced retrieval across the user's knowledge and memory.
- **Proactive Insight Generation:** Discover patterns, connections, and hypotheses through advanced algorithms and metaphorical reasoning.
- **Six-Dimensional Growth Framework:** Support holistic user growth across the dimensions of knowing, acting, and showing for both self and world through the card gamification system.
- **Immersive 3-Layer Interface:** Deliver a seamless user experience through:
  - **3D Canvas Layer:** Immersive background scenes (CloudScene, AscensionScene, GraphScene) setting emotional tone and visualizing the knowledge graph.
  - **2D Modal Layer:** Structured UI for content (Card Gallery, Dashboard, Chat) floating over the 3D canvas.
  - **3D Orb:** A responsive, animated presence that embodies the AI assistant, changing appearance and behavior based on context and user interaction.
- **Cross-Region Deployment:** Support for both US (AWS/Google AI) and China (Tencent/DeepSeek) markets with appropriate data localization.

## 2. System Architecture Overview

V7 builds on the robust foundation of previous versions while refining the architecture to embrace key design principles that enhance flexibility and maintainability.

### 2.1 Foundational Principles

1. **Tiered Processing Model:** Multi-level analysis pipeline (lightweight → deep) based on content significance.
2. **Agent-Tool Paradigm:** Core cognitive agents with well-defined responsibilities + deterministic tool layer.
3. **Polyglot Persistence:** Strategic use of specialized databases (relational, graph, vector, cache).
4. **Clear Data Flow Contracts:** Typed payloads and explicit schema contracts between components.
5. **Regional Adaptability:** Architecture designed for deployment in both US (AWS/Google AI) and China (Tencent/DeepSeek).
6. **Progressive Enhancement:** System delivers value from day one, with knowledge graph enrichment improving over time.
7. **UI-Backend Coherence:** Backend state and data directly drive UI elements (Orb behavior, scene transitions, card content, graph visualization).
8. **Emotional Design Integration:** Technical systems support emotional states, transitions, and expression through the UI.

### 2.2 Refined Design Principles

Building on the foundation above, V7 incorporates these additional design principles from feedback:

1. **Configuration over Schema**: Move static configuration and rules out of database tables and into configuration files, Redis, or code, making the system more adaptable without schema migrations.

2. **Event-Sourcing for Growth & Analytics**: Implement an append-only event stream for historical tracking and flexible recalculation of aggregated views.

3. **Dynamic Computation over Static Storage**: Use materialized views and computed properties for derived data rather than storing and maintaining redundant state.

4. **Distributed Storage by Domain**: Use the right tool for each data domain, with clean interfaces between systems.

### 2.3 High-Level Architecture

The architecture combines a proven backend knowledge system with the 3-layer UI architecture:

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
                       │   (Zustand/Redux)        │
                       └────────────┬─────────────┘
                                    │
                       ┌────────────▼─────────────┐
                       │      DIALOGUE AGENT      │
                       │          (DOT)           │
                       └────────────┬─────────────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────────────┐
│                        COGNITIVE AGENT LAYER                              │
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

### 2.4 Core Components

#### 2.4.1 User Interface Layer

1. **3D Canvas Layer:**
   - **Purpose:** Creates immersive spatial environments that evoke emotion, provide context, and visualize the knowledge graph.
   - **Technology:** Three.js with React Three Fiber (R3F) for WebGL rendering.
   - **Key Scenes:**
     - **CloudScene:** Tranquil cloudscape with snowy peaks for reflection and journaling.
     - **AscensionScene:** Dynamic transition from atmospheric flight to cosmic space.
     - **GraphScene:** Interactive visualization of the knowledge graph as a celestial system.

2. **2D Modal Layer:**
   - **Purpose:** Provides structured UI elements floating above the 3D canvas.
   - **Technology:** React components with glassmorphic design rendered in DOM (not WebGL).
   - **Key Components:**
     - **Card Gallery:** Grid/field of cards representing nodes in the knowledge graph.
     - **Dashboard:** Landing modal with metrics, insights, and recommendations.
     - **Chat Interface:** Communication with Orb/Dialogue Agent.
     - **HUD:** Minimal interface for navigation and quick actions.

3. **3D Orb Layer:**
   - **Purpose:** Visual representation of the Dialogue Agent (Dot) as a responsive, non-anthropomorphic presence.
   - **Technology:** Three.js/R3F with custom shaders for visual effects.
   - **Behaviors:** Changes color, form, motion patterns based on context and interaction state.
   - **Rendered** above all UI elements to maintain consistent presence across the experience.

4. **UI State Management:**
   - **Purpose:** Coordinates state across the three layers and communicates with backend.
   - **Technology:** Zustand for atomic, reactive state management with Redux DevTools integration.
   - **Key Stores:**
     - **SceneStore:** Controls active scene, transitions, and environment state.
     - **OrbStore:** Manages Orb appearance, behavior, and position.
     - **ModalStore:** Tracks open modals, active cards, and UI navigation state.
     - **UserStore:** Maintains session state and preferences.

#### 2.4.2 Cognitive Agent Layer

1. **Dialogue Agent (Dot):**
   - Serves as the primary conversational interface and is visually represented by the Orb.
   - Orchestrates conversations, suggests next actions, and manages the Orb's visual/behavioral state.
   - Interacts with other agents to retrieve information or process inputs.
   - Works with the event-driven growth model to track conversation context and progress.

2. **Ingestion Analyst:**
   - Processes raw inputs (journal entries, conversations, uploads) into structured knowledge.
   - Implements tiered analysis based on content significance.
   - Extracts entities, relationships, and creates growth events for the Six-Dimensional Growth Model.
   - Writes to append-only event streams rather than updating static tables directly.

3. **Retrieval Planner:**
   - Plans and executes hybrid retrieval strategies combining vector, graph, and relational queries.
   - Powers the content for the Card Gallery, GraphScene visualization, and contextual responses.
   - Optimizes retrieval based on scene context and user interaction patterns.
   - Queries materialized views for efficient data access to computed growth dimensions.

4. **Insight Engine:**
   - Discovers patterns, connections, and hypotheses in the knowledge graph.
   - Generates "Orb's Dream Cards" and suggests constellation completions.
   - Creates challenges, quests, and prompts for the card gamification system.
   - Processes growth event streams to identify patterns and trigger growth opportunities.

5. **Ontology Steward:**
   - Manages the controlled vocabularies and schema evolution.
   - Ensures consistency in concept types, relationship labels, and growth dimensions.
   - Provides visual classification guidance for GraphScene visualization.
   - Maintains configuration data in Redis rather than hard-coded database tables.

#### 2.4.3 Deterministic Tools Layer

Specialized, stateless functions for specific tasks, including:

1. **Text Processing Tools:** NER, chunking, summarization, language detection.
2. **Vision Analysis Tools:** Image captioning, object detection, scene classification.
3. **Embedding Generation Tools:** Text and image vectorization for semantic search.
4. **LLM Interaction Tools:** Prompt construction, response parsing, chain-of-thought.
5. **Vector Operation Tools:** Similarity search, clustering, nearest neighbor lookup.
6. **Graph Analysis Tools:** Pattern matching, path finding, community detection.
7. **Statistical Tools:** Correlation analysis, trend detection, significance testing.

#### 2.4.4 Persistence Layer

The persistence layer adopts a distributed approach where data is stored in the most appropriate system:

1. **PostgreSQL:**
   - Core entities: Users, memory units, concepts, derived artifacts
   - Event streams: Growth events, user activities, system logs
   - Junction tables: Entity vectors, relationships to external systems
   - Growth and gamification: Challenge templates, user challenges
   - Materialized views: Pre-computed for UI performance

2. **Neo4j:**
   - Knowledge graph: Concept-to-concept relationships
   - Semantic network: Memory-to-concept connections
   - Connection patterns: Community detection, centrality analysis
   - Navigation paths: Traversal for UI visualization

3. **Weaviate:**
   - Semantic embeddings: Text chunks, concept descriptions
   - Multimodal vectors: Image and audio embeddings
   - Hybrid search: Combined filter and vector similarity
   - Cross-references to primary records via externalId field

4. **Redis:**
   - Configuration: Growth dimensions, evolution rules
   - Real-time state: Orb presence, session information
   - Message queues: Processing pipelines, background jobs 
   - Rate limiting: API usage tracking

### 2.5 Key Integration Points

1. **Orb-Dialogue Agent Binding:**
   - The Orb's visual state (color, motion, effects) is directly driven by the Dialogue Agent's internal state.
   - Agent output includes explicit visual state parameters.
   - Example: When analyzing, the Orb pulses with amethyst glow; when sharing insights, it emits golden particles.

2. **GraphScene-Knowledge Graph Binding:**
   - The celestial bodies and connections in the GraphScene directly visualize Neo4j data.
   - Node properties (type, importance, recency) map to visual properties (size, color, glow).
   - Real-time updates: New connections appearing as animated light trails.

3. **Card Gallery-Six-Dimensional Growth System:**
   - Card visual states reflect computed evolution states from growth events.
   - User interactions with cards trigger analysis by the Ingestion Analyst.
   - Completed dimensions and constellation achievements trigger particle effects and Orb responses.

4. **Scene Transitions-Navigation Events:**
   - UI navigation (e.g., "explore graph") initiates scene transition sequences.
   - Backend state changes can suggest scene transitions (e.g., "I notice a pattern forming in your cosmos").
   - AscensionScene serves as a meaningful loading/transition metaphor between modes.

## 3. User Interface Implementation

This section details how the UI components leverage the event-sourcing approach and computed views to display information to users in an engaging, visually coherent way.

### 3.1 Card Modal Implementation

The Card Modal is a central UI element that displays detailed information about a concept, memory, or derived artifact. With the revised event-sourcing schema, the card modal dynamically reflects the current state computed from events rather than reading static values.

#### 3.1.1 Card Modal Structure

1. **Header Section:**
   - Title and entity type with visually distinct styling per type
   - Card evolution state visualization (seed, sprout, bloom, constellation) derived from `v_card_state` view
   - Visual indicator showing recency and importance (glow intensity based on event timestamps)

2. **Content Section:**
   - Description or summary text with media attachments if applicable
   - For memories: journal text, images, or embedded media
   - For concepts: definition and key associations
   - For artifacts: derived content and insight summary

3. **Growth Dimension Panel:**
   - Radar chart visualization of the six dimensions, computed from the `mv_entity_growth` materialized view
   - Dimension bars fill proportionally to accumulated scores from events
   - Animated transitions when dimensions reach threshold values
   - Tooltip descriptions for each dimension loaded from Redis configuration, not hardcoded

4. **Connection Map:**
   - Miniature visualization of connected entities fetched from Neo4j
   - Connection strength indicated by line thickness (based on relationship weight)
   - Click targets for navigation to related cards

5. **History Timeline:**
   - Chronological display of growth events affecting this entity
   - Meaningful grouping of events for readability (e.g., "5 growth events from journal entries")
   - Interactive timeline that allows exploring how the entity evolved over time

#### 3.1.2 Data Loading Strategy

The card modal implements a tiered loading approach aligned with the overall architecture:

1. **Initial Load (Fast):**
   - Basic metadata and pre-computed state from Postgres via API call:
     ```typescript
     GET /api/entities/:entityId
     Response: {
       id: string,
       name: string,
       type: string,
       description: string,
       evolution_state: string, // From v_card_state view
       growth_dimensions: {     // From mv_entity_growth view
         self_know: number,
         self_act: number,
         // ... other dimensions
       },
       created_at: string,
       connection_count: number
     }
     ```

2. **Enrichment Phase (Progressive):**
   - While user views the card, background requests fetch:
     - Neo4j connections with endpoint `/api/entities/:entityId/connections`
     - Recent growth events with `/api/entities/:entityId/events?limit=10`
     - Associated media with `/api/entities/:entityId/media`

3. **Interactive Elements:**
   - User actions trigger real-time updates:
     - Clicking "Explore dimension" fetches detailed dimension data from events
     - Expanding connection graph loads additional relationship data
     - Adding annotations creates new events in the system

#### 3.1.3 State Transitions & Animations

Card state transitions are driven by the computed state and visualized with animations:

1. **Evolution Transitions:**
   - When a card evolves from one state to another, a particle animation celebrates the change
   - Animation is triggered when frontend detects a difference between cached and fresh evolution_state
   - State change persists in user activity log as an event for analytics

2. **Dimension Activations:**
   - When a dimension crosses activation threshold, a radial animation highlights that spoke
   - Activation animations are controlled by frontend logic comparing previous vs. current dimension scores
   - The animation also triggers an Orb response acknowledging the growth

3. **New Connection Visualization:**
   - When a new connection is made between cards, an animated path traces the connection
   - The animation is triggered by websocket notification when relationship events occur

### 3.2 Dashboard Modal Implementation

The Dashboard Modal serves as the user's central hub for system-wide information, progress tracking, and recommendations. It directly visualizes the event-sourced growth model and computed states.

#### 3.2.1 Dashboard Components

1. **Growth Profile Section:**
   - Six-dimensional radar chart showing overall profile from `users.growth_profile` JSONB
   - Progression indicators showing historic trends derived from growth events
   - Visual indicators for dominant and growing dimensions
   - Dimension descriptions loaded from configuration, not hardcoded schema

2. **Active Challenges Panel:**
   - List of current challenges with progress bars
   - Progress computed from event comparison rather than static values:
     ```typescript
     // Pseudo-code for challenge progress computation
     const challengeProgress = {
       journalingStreak: {
         currentCount: countEventsOfType('journal_entry', { 
           since: lastStreakBreak, 
           timeframe: 'daily' 
         }),
         target: challengeTemplate.payload.streakTarget,
         progress: currentCount / target
       }
     };
     ```
   - New challenge suggestions based on growth event patterns
   - Challenge completion celebrations with confetti animation and reward cards

3. **Recent Activity Timeline:**
   - Chronological stream of growth events across all entities
   - Intelligent grouping of similar events
   - Visual differentiation by dimension and source
   - "Continue" links to relevant memories or concepts

4. **Insights Gallery:**
   - AI-generated insights derived from analysis of growth events and patterns
   - "Orb's Dreams" section featuring creative connections between seemingly unrelated concepts
   - Insight cards link to the source entities that contributed to their generation

5. **Constellation Progress:**
   - Galaxy-like visualization of concept clusters from Neo4j community detection
   - Progress indicators showing completion status of key constellations
   - Recommendations for actions to complete emerging constellations

#### 3.2.2 Dashboard Data Architecture

The Dashboard implements a layered data loading strategy that balances real-time updates with performance:

1. **Cached Summary Layer:**
   - Fast-loading profile summary and counts from materialized views
   - Pre-computed constellation state and challenge progress
   - Last refresh timestamp to indicate recency

2. **Real-Time Events Layer:**
   - WebSocket connection for live updates as events occur
   - Event counter badges showing new activity since last visit
   - Notification panel for significant threshold crossings or insights

3. **Deep Analysis Layer:**
   - Background loading of trend analysis and pattern detection
   - On-demand computation of complex relationship visualizations
   - Lazy-loaded historical statistics that don't impact initial render time

#### 3.2.3 Frontend-Backend Integration

The Dashboard connects to multiple backend services, implementing the event-driven architecture:

1. **API Endpoints:**
   ```typescript
   GET /api/dashboard/summary                // Fast, cached overview
   GET /api/dashboard/challenges             // Active and available challenges
   GET /api/dashboard/growth-profile         // Six-dimensional stats with history
   GET /api/dashboard/recent-events?limit=20 // Latest growth events
   GET /api/dashboard/insights/recent        // Latest insights from Insight Engine
   ```

2. **WebSocket Channels:**
   ```typescript
   socket.subscribe('user:growth-events', (event) => {
     // Update dimension chart
     updateDimensionChart(event.dim_key, event.delta);
     // Add to activity timeline
     prependToTimeline(formatEvent(event));
     // Check for threshold crossings
     checkThresholds(event.dim_key, currentValues[event.dim_key] + event.delta);
   });
   
   socket.subscribe('insight:new', (insight) => {
     // Show new insight notification
     showInsightNotification(insight);
     // Add to insights gallery if dashboard open
     if (isDashboardVisible) {
       addInsightToGallery(insight);
     }
   });
   ```

3. **UI State Management:**
   ```typescript
   const dashboardStore = create((set, get) => ({
     // Core data
     growthProfile: null,
     recentEvents: [],
     activeInsights: [],
     activeChallenges: [],
     
     // UI state
     selectedDimension: null,
     timeRange: '30days',
     
     // Actions
     fetchDashboardData: async () => {
       // Parallel requests for better performance
       const [profile, events, insights, challenges] = await Promise.all([
         api.get('/dashboard/growth-profile'),
         api.get('/dashboard/recent-events?limit=20'),
         api.get('/dashboard/insights/recent'),
         api.get('/dashboard/challenges')
       ]);
       
       set({
         growthProfile: profile,
         recentEvents: events,
         activeInsights: insights,
         activeChallenges: challenges,
       });
     },
     
     // Event handlers
     handleNewEvent: (event) => {
       set(state => ({
         recentEvents: [event, ...state.recentEvents.slice(0, 19)],
         // Update other state based on event
       }));
     }
   }));
   ```

### 3.3 Card and Dashboard Visual Design

Both the Card Modal and Dashboard implement coherent visual design principles that reflect the event-sourced nature of the data:

1. **Growth Visualization:**
   - Consistent color coding of dimensions across all UI components
   - Animated transitions that reflect actual changes in the event stream
   - Visual history elements showing progression over time

2. **State Representation:**
   - Card evolution states have distinct visual treatments with increasing complexity
   - Surface characteristics (glow, particle effects, motion) tied to underlying data
   - Clear visual feedback when a state change occurs

3. **Interactive Elements:**
   - Direct manipulation triggers event creation in the backend
   - Real-time feedback when new events affect the visualization
   - Cause-and-effect clarity between user actions and system responses

4. **Temporal Context:**
   - Timeline elements to visualize the historical event stream
   - Visual differentiation between recent and older events
   - Growth trajectory indicators showing momentum and trends

By implementing the UI components with direct connection to the event-sourcing system, they become dynamic reflections of the user's growth journey rather than static displays of database state. This approach aligns perfectly with the design principles of configuration over schema, event-sourcing for analytics, and dynamic computation over static storage.


## 4. Knowledge Model

The Knowledge Model defines how user memories and insights are structured to support both backend logic and frontend visualization. It builds on the core graph structure from V4 while adding specific extensions for the V7 UI/UX design.

### 4.1 Core Knowledge Graph Schema

#### 4.1.1 Node Types

1. **`User`**
   - Properties: `userId` (unique), `name`, `preferences` (includes UI settings, Orb interaction style), `growth_profile` (JSONB for Six-Dimensional Growth progress).
   - Purpose: Central anchor point for a user's memory graph.
   - UI Representation: Not directly visualized, but preferences influence UI styling and behavior.

2. **`MemoryUnit`**
   - Properties: `muid` (unique), `creation_ts`, `last_modified_ts`, `source_type`, `title`, `processing_status`, `importance_score`.
   - Purpose: Container for a distinct piece of user memory/input.
   - UI Representation: Can be represented as a `Card` in the Card Gallery or as a "Memory Star" node in the GraphScene.

3. **`Chunk`**
   - Properties: `cid` (unique), `muid` (parent link), `text`, `sequence_order`, `role`, `embedding_id`.
   - Purpose: Granular, semantically searchable units extracted from MemoryUnits.
   - UI Representation: Not directly visualized but used for retrieval context and card content.

4. **`Concept`**
   - Properties: `concept_id` (unique), `name`, `type`, `description`, `user_defined`, `confidence`, `last_updated_ts`, `community_id`.
   - Purpose: Represents entities, themes, values, emotions, or other significant abstractions.
   - UI Representation: Primary nodes in the GraphScene as "Concept Nebula/Node", also represented as concept Cards with visual properties mapped from concept attributes.
   - The `type` property draws from a controlled vocabulary influencing visual appearance:
     - **Self Domain:** "value", "personal_trait", "skill", "emotion", "interest", "struggle"
     - **Life Events Domain:** "life_event_theme", "achievement", "decision_point", "milestone" 
     - **Relationships Domain:** "person", "organization", "group", "relationship_dynamic"
     - **Future Orientation Domain:** "goal", "aspiration", "plan", "concern"
     - **General:** "location", "time_period", "activity", "artwork", "topic", "abstract_idea"

5. **`Media`**
   - Properties: `media_id` (unique), `muid` (parent link), `type`, `url`, `caption`, `extraction_status`.
   - Purpose: Represents non-text media associated with MemoryUnits.
   - UI Representation: Displayed within Cards or as media thumbnails in the GraphScene.

6. **`Annotation`**
   - Properties: `aid` (unique), `target_id`, `target_type`, `annotation_type`, `text`, `creation_ts`, `source`.
   - Purpose: Layer of interpretation or meta-commentary on graph elements.
   - UI Representation: Displayed within Cards as notes/reflections or as contextual tooltips.
   - `annotation_type` can include tags related to the Six-Dimensional Growth Model (e.g., `know_self_reflection`, `act_world_plan`).

7. **`Community`**
   - Properties: `community_id` (unique), `name`, `description`, `creation_ts`, `detection_method`, `confidence_score`.
   - Purpose: Represents detected concept clusters/communities.
   - UI Representation: Visualized as constellations or galaxy clusters in the GraphScene.

8. **`DerivedArtifact`** (NEW)
   - Properties: `daid` (unique), `user_id`, `title`, `summary_text`, `artifact_type` (e.g., "story_thread", "themed_collection", "insight_summary", "quest"), `source_element_ids` (JSON array), `creation_ts`, `last_modified_ts`.
   - Purpose: Represents user or AI-curated collections built from existing graph elements.
   - UI Representation: Special Cards with unique visual treatment in the Card Gallery.
   - Includes "Orb's Dream Cards", "Mystery Challenges", and "Cosmic Quests" from the gamification system.

#### 4.1.2 Relationship Types

1. **`(User)-[:AUTHORED]->(MemoryUnit)`**
   - Connects users to their memory units.

2. **`(MemoryUnit)-[:CONTAINS]->(Chunk)`**
   - Connects memory units to their constituent chunks.

3. **`(MemoryUnit)-[:HIGHLIGHTS]->(Concept)`**
   - Properties: `weight` (float), `significance` (string).
   - Indicates a memory unit prominently features a concept.
   - Visual: Influences connection brightness/thickness in GraphScene.

4. **`(Chunk)-[:MENTIONS]->(Concept)`**
   - Properties: `weight` (float).
   - Indicates a chunk references a concept.

5. **`(MemoryUnit)-[:INCLUDES]->(Media)`**
   - Links media assets to their parent memory units.

6. **`(Concept)-[:RELATED_TO]->(Concept)`**
   - Properties: `relationship_label` (string), `weight` (float), `source` (string), `creation_ts`.
   - Critical relationship for building the semantic web.
   - Visual: Represented as "Connection Pathways" in GraphScene, with appearance driven by relationship properties.
   - The `relationship_label` influences connection color/style and includes:
     - Hierarchical: "is_a_type_of", "is_part_of", "is_instance_of"
     - Causal: "causes", "influences", "enables", "prevents", "contributes_to"
     - Temporal: "precedes", "follows", "co-occurs_with"
     - Association: "is_similar_to", "is_opposite_of", "is_analogous_to"
     - Domain-specific: "inspires", "supports_value", "exemplifies_trait", "is_milestone_for"
     - Metaphorical: "is_metaphor_for", "represents_symbolically"

7. **`(User)-[:PERCEIVES]->(Concept)`**
   - Properties: `perception_type`, `current_salience`, `start_date`, `end_date`.
   - Represents the user's relationship to concepts over time.
   - Influences concept importance in UI visualization.

8. **`(MemoryUnit)-[:CONTINUES]->(MemoryUnit)`**
   - Properties: `reason` (string).
   - Links related memory units temporally or thematically.

9. **`(Annotation)-[:ANNOTATES]->(MemoryUnit | Chunk | Concept)`**
   - Links annotations to their targets.

10. **`(Concept)-[:BELONGS_TO]->(Community)`**
    - Indicates a concept is part of a detected community/cluster.
    - Visual: Drives constellation grouping in GraphScene.

11. **`(DerivedArtifact)-[:BASED_ON]->(MemoryUnit | Concept)`** (NEW)
    - Links derived artifacts to their source components.
    - Properties: `contribution_type` (e.g., "primary", "supporting", "contrast").

12. **`(DerivedArtifact)-[:CONTRIBUTES_TO]->(GrowthDimension)`** (NEW)
    - Properties: `dimension_key` (string), `strength` (float).
    - Links derived artifacts (especially quests/challenges) to growth dimensions.

### 4.2 Six-Dimensional Growth Model Implementation

The Six-Dimensional Growth Model is a core gamification element implemented through an event-sourcing approach that provides flexibility, history tracking, and efficient analytics.

#### 4.2.1 Growth Profile and Configuration

```sql
-- Growth profile stored directly in user table for efficient access
ALTER TABLE users
ADD COLUMN growth_profile JSONB DEFAULT '{}'; -- e.g. {"self_know":0.4,"world_act":0.1}
```

Instead of maintaining a separate table for growth dimensions, we store them as configuration in a seed JSON file or in Redis. This approach allows:
- Easy A/B testing of dimensions or weighting formulas per cohort
- No migration required when dimension copy or parameters change
- Efficient loading and caching of dimension metadata

The six core dimensions remain unchanged conceptually:
1. Know Self: Understanding one's internal landscape
2. Know World: Learning about the external environment
3. Act for Self: Taking actions to benefit oneself
4. Act for World: Contributing to the wider world
5. Show Self: Expressing one's inner truth
6. Show to World: Sharing insights with others

#### 4.2.2 Growth Events Stream

```sql
CREATE TABLE growth_events (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,      -- 'concept' | 'memory' | 'artifact'
  dim_key TEXT NOT NULL,          -- 'self_know' etc.
  delta FLOAT NOT NULL,           -- +0.1, -0.05 …
  source TEXT NOT NULL,           -- 'journal_entry', 'challenge_complete', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

This event-sourcing approach provides several advantages:
- **Append-only**: No lost history, simplifying concurrency management
- **Time-series friendly**: Powers entity progress, user charts, and analytics from the same table
- **Flexible evolution**: New scoring algorithms can be implemented by recalculating the materialized view without migrating rows

#### 4.2.3 Materialized View for UI

```sql
CREATE MATERIALIZED VIEW mv_entity_growth AS 
SELECT 
  entity_id, 
  entity_type,
  dim_key, 
  SUM(delta) AS score
FROM growth_events
GROUP BY entity_id, entity_type, dim_key;
```

This materialized view provides efficient read access for UI components that need to display growth progress. It can be refreshed on demand or with triggers when new events are added.

#### 4.2.4 Card Evolution as Computed View

```sql
CREATE VIEW v_card_state AS
SELECT
  c.concept_id AS entity_id,
  'concept' AS entity_type,
  CASE
    WHEN conn_cnt >= 5 THEN 'constellation'
    WHEN dim_cnt >= 3 THEN 'bloom'
    WHEN dim_cnt >= 1 THEN 'sprout'
    ELSE 'seed'
  END AS evolution_state
FROM concepts c
LEFT JOIN (
  SELECT entity_id, COUNT(*) conn_cnt
  FROM neo4j_connection_stats -- nightly export into Postgres
  GROUP BY entity_id
) cs USING (entity_id)
LEFT JOIN (
  SELECT entity_id, COUNT(DISTINCT dim_key) dim_cnt
  FROM mv_entity_growth
  WHERE entity_type = 'concept'
  GROUP BY entity_id
) gs USING (entity_id);
```

Evolution states are computed dynamically based on:
- Connection count (from Neo4j graph data)
- Dimension count (distinct dimensions engaged)

This removes the need for a separate evolution state table and background jobs to update states. The UI queries the view to get current states, eliminating potential sync issues.

#### 4.2.5 Challenge System

The challenge system is split into templates and instances for greater flexibility:

```sql
CREATE TABLE challenge_templates (
  tpl_id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  dim_keys TEXT[] NULL,   -- can span multiple dimensions
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  payload JSONB           -- flexible task parameters
);

CREATE TABLE user_challenges (
  ch_id UUID PRIMARY KEY,
  tpl_id UUID REFERENCES challenge_templates,
  user_id UUID REFERENCES users(user_id),
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress JSONB DEFAULT '{}'   -- e.g. {"days_logged":5}
);
```

This approach offers several advantages:
- Marketing can create new quests by inserting templates—no schema change required
- A challenge can drive several dimensions by listing multiple dimension keys
- Progress logic lives in backend code with flexible progress tracking via JSON
- Rewards are implemented as DerivedArtifacts of type "trophy" or "poster" for consistency

### 4.3 Activation Logic for Growth Dimensions

The system applies rules to update growth dimensions by appending events to the growth_events table based on user interactions:

1. **Know Self:**
   - Activated by: Reflective journal entries, answering self-knowledge prompts,
   - Event Source: Annotations with type "self_reflection" linked to concepts
   - UI Examples: "How does patience show up in your life?", "What values underlie this choice?"

2. **Know World:**
   - Activated by: Adding factual content, integrating external knowledge
   - Event Source: Annotations with type "factual_context" or "external_knowledge"
   - UI Examples: "What research informs this idea?", "What experts influenced your thinking here?"

3. **Act for Self:**
   - Activated by: Recording personal actions, completing self-focused challenges
   - Event Source: MemoryUnits with source_type "action_completion" referencing concepts
   - UI Examples: "How did you apply this learning?", "What step did you take based on this idea?"

4. **Act for World:**
   - Activated by: Recording contributions, sharing with others, impact documentation
   - Event Source: MemoryUnits with source_type "world_contribution" or "impact_record"
   - UI Examples: "How did you share this insight?", "What impact did this create?"

5. **Show Self:**
   - Activated by: Creative expression, personal synthesis, transformation documentation
   - Event Source: Annotations with type "personal_expression" or "transformation_story"
   - UI Examples: "How has this changed how you see yourself?", "Express this concept creatively"

6. **Show to World:**
   - Activated by: Teaching others, external sharing, public articulation
   - Event Source: MemoryUnits with source_type "teaching" or "public_sharing"
   - UI Examples: "How did you teach this to someone else?", "How would you explain this concept?"

The Ingestion Analyst agent analyzes user content to identify these patterns and creates growth events accordingly, which in turn refreshes the materialized view and updates dimension scores in the UI.

### 4.4 User Growth Summary View

```sql
CREATE VIEW user_growth_summary AS
SELECT 
    u.user_id,
    u.name,
    ge.dim_key,
    SUM(ge.delta) as total_score,
    COUNT(DISTINCT ge.entity_id) as entity_count,
    MAX(ge.created_at) as last_activity
FROM users u
LEFT JOIN growth_events ge ON u.user_id = ge.user_id
GROUP BY u.user_id, u.name, ge.dim_key;
```

This view provides an efficient summary of a user's growth progress across all dimensions, derived directly from the event stream.

### 4.5 Schema Governance and Evolution

The Ontology Steward continues to manage controlled vocabularies for the system as specified in V4. Additionally, it now also manages:

1. **Visual Mapping Rules:** Specifications for how `Concept.type` maps to visual properties in GraphScene.
2. **Growth Dimension Triggers:** Rules for identifying dimension activation patterns in user content.
3. **Card Evolution Criteria:** Requirements for progression between card states.

This governance ensures consistency between backend knowledge representation and frontend visualization.

## 5. Frontend Implementation

### 5.1 Technology Stack

The frontend implementation leverages modern web technologies to create an immersive, performant experience:

- **Framework:** React 19 with Next.js 15 (App Router)
- **3D Rendering:** Three.js with React Three Fiber and Drei
- **State Management:** Zustand with Immer for immutable updates
- **Styling:** Tailwind CSS with custom design tokens
- **Animation:** Framer Motion for 2D animations, R3F animations for 3D
- **API Communication:** TanStack Query (React Query) v5
- **Type Safety:** TypeScript with strict type checking
- **Shader Programming:** GLSL for custom WebGL shaders

### 5.2 3D Canvas Layer Implementation

The 3D Canvas Layer provides immersive spatial environments that evoke emotion and visualize the knowledge graph in a way that is both beautiful and informative.

#### 5.2.1 Canvas Architecture

```tsx
// Base Canvas Component
export function Canvas3D() {
  const { activeScene, sceneTransitioning } = useSceneStore();

  return (
    <div className="fixed inset-0 z-0">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 15], fov: 60 }}>
        <Suspense fallback={<CanvasLoader />}>
          <SceneManager
            activeScene={activeScene}
            transitioning={sceneTransitioning}
          />
          <CoreLighting />
          <SharedAssets />
          <AdaptivePerformance />
          <OrbLayer />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Scene Manager Component
function SceneManager({ activeScene, transitioning }) {
  return (
    <>
      {activeScene === 'cloud' && <CloudScene />}
      {activeScene === 'ascension' && <AscensionScene />}
      {activeScene === 'graph' && <GraphScene />}
      {transitioning && <SceneTransition from={transitionFrom} to={activeScene} />}
    </>
  );
}
```

#### 5.2.2 Scene Implementations

##### 5.2.2.1 CloudScene

The CloudScene provides a tranquil, reflective environment for journaling and contemplation.

**Technical Features:**
- **Volumetric Clouds:** GPU-based ray marching for realistic clouds with dynamic lighting.
- **Dynamic Time of Day:** Sky coloration and lighting changes based on user preferences and session time.
- **Reactive Weather:** Subtle weather changes reflecting user's emotional state and content.
- **Performance Optimization:** Dynamically adjusts detail level based on device performance.

```tsx
// CloudScene.tsx (simplified)
export function CloudScene() {
  const { timeOfDay, weatherState } = useSceneStore();
  const { emotionalTone } = useOrbStore();
  
  return (
    <group>
      <Sky time={timeOfDay} turbidity={6} rayleigh={1} />
      <VolumetricClouds 
        density={getCloudDensity(weatherState, emotionalTone)}
        coverage={getCloudCoverage(weatherState)}
        seed={Math.random() * 100}
      />
      <Mountains />
      <DistantPeaks />
      <FogLayer 
        color={getFogColor(timeOfDay, emotionalTone)} 
        density={getFogDensity(weatherState)}
      />
      <FloatingIslands count={3} seed={userId} />
    </group>
  );
}
```

**Implementation Considerations:**
- Cloud shader optimization critical for mobile performance
- Simplified version automatically used for low-power devices
- Precomputed cloud noise textures for better performance
- Seamless transitions between weather/time states

##### 5.2.2.2 AscensionScene

The AscensionScene provides a meaningful transition between the CloudScene and GraphScene, visualizing the journey from personal reflection to knowledge exploration.

**Technical Features:**
- **Procedural Content:** Dynamically generated flight path through clouds and into space.
- **Star Field Generation:** Procedurally generated stars based on knowledge graph node density.
- **Transition Choreography:** Carefully timed sequence of movements and visual effects.
- **Progress Indication:** Subtly indicates loading/processing happening during transition.

```tsx
// AscensionScene.tsx (simplified)
export function AscensionScene() {
  const { progress, direction } = useSceneTransitionStore();
  const { cameraRef } = useThree();
  
  useEffect(() => {
    // Animate camera along ascension path
    const path = direction === 'to_graph' 
      ? calculateAscensionPath() 
      : calculateDescentPath();
      
    animateAlongPath(cameraRef, path, progress);
  }, [progress, direction]);
  
  return (
    <group>
      <CloudLayer opacity={1 - progress} />
      <AtmosphereLayer thickness={1 - progress * 0.8} />
      <StarField opacity={progress} />
      <CosmicDust density={progress * 0.5} />
      <DistantNebulae fadeIn={progress > 0.7} />
    </group>
  );
}
```

**Implementation Considerations:**
- Optimize for smooth frame rates during transition
- Preload GraphScene assets during transition
- Adaptive transition duration based on device performance
- Fallback simplified transition for low-end devices

##### 5.2.2.3 GraphScene

The GraphScene visualizes the knowledge graph as an explorable cosmic system with celestial metaphors for different node types.

**Technical Features:**
- **Graph Visualization Engine:** Force-directed 3D graph layout with physics simulation.
- **Cosmic Metaphors:** Visual language where concepts are stars/nebulae, connections are energy paths.
- **Interactive Elements:** Hoverable, selectable nodes with contextual information display.
- **Detail Levels:** Multiple zoom levels revealing different graph detail.
- **Clustering:** Visual grouping of related nodes into constellations.

```tsx
// GraphScene.tsx (simplified)
export function GraphScene() {
  const { nodes, links, focusedNodeId, viewDistance } = useGraphStore();
  const { fetchGraphData } = useGraphQuery();
  
  // Fetch graph data from Neo4j
  useEffect(() => {
    fetchGraphData();
  }, []);
  
  // Calculate force-directed layout
  const simulationRef = useRef(null);
  useLayoutEffect(() => {
    if (nodes.length === 0) return;
    
    simulationRef.current = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.distance))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(0, 0, 0))
      .on('tick', () => setNodePositions(nodes));
      
    return () => simulationRef.current?.stop();
  }, [nodes, links]);
  
  return (
    <group>
      <CosmicBackground />
      <NebulaeClusters data={getCommunityData(nodes)} />
      
      {/* Render connections first (behind nodes) */}
      {links.map(link => (
        <EnergyConnection 
          key={link.id}
          source={link.source}
          target={link.target}
          strength={link.weight}
          type={link.relationship_label}
        />
      ))}
      
      {/* Render nodes */}
      {nodes.map(node => (
        <ConceptNode
          key={node.id}
          position={[node.x, node.y, node.z]}
          nodeData={node}
          isFocused={node.id === focusedNodeId}
          size={getNodeSize(node, viewDistance)}
          type={node.type}
        />
      ))}
      
      <OrbitControls 
        enableZoom={true}
        minDistance={5}
        maxDistance={100}
      />
    </group>
  );
}

// Node Component
function ConceptNode({ position, nodeData, isFocused, size, type }) {
  const matRef = useRef();
  const { setFocusedNode } = useGraphStore();
  
  // Node appearance based on type
  const visualProperties = getNodeVisualProperties(type);
  
  useFrame(() => {
    if (isFocused && matRef.current) {
      matRef.current.emissiveIntensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
    }
  });
  
  return (
    <group position={position}>
      <mesh
        onClick={() => setFocusedNode(nodeData.id)}
        onPointerOver={() => setHoveredNode(nodeData.id)}
        onPointerOut={() => setHoveredNode(null)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={visualProperties.color}
          emissive={visualProperties.emissive}
          emissiveIntensity={isFocused ? 1.5 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {nodeData.name && (
        <NodeLabel 
          text={nodeData.name}
          visible={isFocused || viewDistance < 50}
        />
      )}
      {isFocused && <FocusRing radius={size * 1.2} />}
    </group>
  );
}
```

**Implementation Considerations:**
- Optimize for large graphs using techniques like:
  - Frustum culling for off-screen nodes
  - Level-of-detail rendering based on distance
  - Instanced geometry for similar node types
  - WebGL 2.0 features like compute shaders where available
- Dynamic loading of graph sections as user explores
- Efficient GPU-based force calculation for large graphs
- Fall back to 2D visualization on low-end devices

#### 5.2.3 Shader Implementations

Custom GLSL shaders provide advanced visual effects critical to the emotional resonance of the experience:

1. **Cloud Shader:** Volumetric ray marching for realistic cloud rendering
2. **Orbital Connection Shader:** Energy beam/path visualization between nodes
3. **Glimmer Shader:** Subtle sparkling effects for concept nodes
4. **Atmosphere Shader:** Realistic atmospheric scattering for planet-like objects
5. **Text Glow Shader:** High-quality text rendering with custom glow effects

Example Cloud Shader (simplified GLSL):

```glsl
// CloudShader.frag (simplified)
uniform sampler3D noiseTexture;
uniform float cloudDensity;
uniform float cloudCoverage;
uniform vec3 lightDirection;

varying vec3 vOrigin;
varying vec3 vDirection;

vec4 rayMarchClouds(vec3 origin, vec3 direction) {
  // Ray marching parameters
  const int MAX_STEPS = 64;
  const float STEP_SIZE = 0.05;
  
  // Cloud height bounds (atmosphere-relative)
  const float CLOUD_MIN_HEIGHT = 0.2;
  const float CLOUD_MAX_HEIGHT = 0.45;
  
  vec4 result = vec4(0.0);
  
  // Start ray marching
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 pos = origin + direction * t;
    
    // Check if we're in the cloud layer
    float height = length(pos) - 1.0; // 1.0 = planet radius
    if (height < CLOUD_MIN_HEIGHT || height > CLOUD_MAX_HEIGHT) {
      t += STEP_SIZE;
      continue;
    }
    
    // Sample noise texture
    float density = texture(noiseTexture, pos * 0.1).r;
    density = smoothstep(1.0 - cloudCoverage, 1.0, density) * cloudDensity;
    
    if (density > 0.01) {
      // Calculate lighting
      float lightDensity = calculateLightDensity(pos, lightDirection, noiseTexture);
      vec3 cloudColor = mix(vec3(1.0), vec3(0.8, 0.85, 0.95), height / CLOUD_MAX_HEIGHT);
      
      // Accumulate color and opacity
      float alpha = density * STEP_SIZE * 10.0;
      result.rgb += cloudColor * lightDensity * alpha * (1.0 - result.a);
      result.a += alpha * (1.0 - result.a);
      
      // Early exit if opaque enough
      if (result.a > 0.99) break;
    }
    
    t += STEP_SIZE;
  }
  
  return result;
}

void main() {
  // Ray marching from camera
  vec4 clouds = rayMarchClouds(vOrigin, normalize(vDirection));
  
  // Blend with background
  clouds.rgb = mix(vBackgroundColor, clouds.rgb, clouds.a);
  
  gl_FragColor = clouds;
}
```

#### 5.2.4 Performance Optimization Strategy

The 3D Canvas Layer employs several strategies to ensure high performance across devices:

1. **Adaptive Quality:**
   - Device capability detection at startup
   - Adjustable render resolution scaling (0.5x-1.0x)
   - Simplified shaders for mobile devices
   - LOD (Level of Detail) based on device performance

2. **Asset Management:**
   - Progressive loading of scene resources
   - Texture compression (WebP with AVIF fallback)
   - Geometry optimization (decimated meshes)
   - Asset instancing for repeated elements

3. **Render Optimization:**
   - Frustum culling for off-screen elements
   - Occlusion culling for hidden elements
   - WebGL 2.0 features where available
   - WebGPU with graceful fallback when supported

4. **Memory Management:**
   - Texture atlas for common elements
   - Geometry buffer pooling
   - Scene unloading for inactive scenes
   - Automatic texture size adjustment for low-memory devices

```tsx
// AdaptivePerformance.tsx
export function AdaptivePerformance() {
  const { gl, camera } = useThree();
  const { setPerformanceTier } = usePerformanceStore();
  
  useEffect(() => {
    // Detect device capabilities
    const gpu = detectGPUTier();
    const tier = gpu.tier; // 0-3, where 3 is high-end
    
    // Configure scene based on performance tier
    setPerformanceTier(tier);
    
    // Adjust renderer settings
    gl.setPixelRatio(tier < 2 ? 1 : window.devicePixelRatio);
    gl.shadowMap.enabled = tier > 1;
    gl.shadowMap.type = tier > 2 ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    
    // Start performance monitoring
    const monitor = new PerformanceMonitor(gl, camera);
    return () => monitor.dispose();
  }, []);
  
  return null;
}
```

### 5.3 2D Modal Layer Implementation

The 2D Modal Layer consists of structured UI elements floating above the 3D canvas, providing intuitive access to information and interactions.

#### 5.3.1 Modal Architecture

```tsx
// ModalLayer.tsx
export function ModalLayer() {
  const { activeModals } = useModalStore();
  
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* HUD is always present */}
      <HUD />
      
      {/* Modal container for card gallery */}
      {activeModals.includes('card-gallery') && (
        <FocusScope contain>
          <div className="pointer-events-auto">
            <CardGallery />
          </div>
        </FocusScope>
      )}
      
      {/* Modal container for chat */}
      {activeModals.includes('chat') && (
        <FocusScope contain>
          <div className="pointer-events-auto">
            <ChatInterface />
          </div>
        </FocusScope>
      )}
      
      {/* Other modals */}
      {activeModals.includes('dashboard') && <Dashboard />}
      {activeModals.includes('settings') && <Settings />}
      
      {/* Context-specific modals */}
      {activeModals.includes('node-detail') && <NodeDetailModal />}
      
      {/* Toasts and notifications */}
      <ToastContainer />
    </div>
  );
}
```

#### 5.3.2 Card Gallery Implementation

The Card Gallery is the primary interface for browsing and interacting with the user's knowledge graph as discrete cards.

```tsx
// CardGallery.tsx
export function CardGallery() {
  const { cards, layout, filters, focusedCardId } = useCardGalleryStore();
  const { fetchCards, fetchMoreCards } = useCardQuery();
  
  // Fetch initial card data
  useEffect(() => {
    fetchCards(filters);
  }, [filters]);
  
  // Virtualized grid for performance
  return (
    <div className="card-gallery-container glassmorphic-panel">
      <CardGalleryToolbar 
        filters={filters} 
        layout={layout}
      />
      
      <VirtualizedGrid
        items={cards}
        itemHeight={layout === 'compact' ? 280 : 380}
        itemWidth={layout === 'compact' ? 220 : 320}
        gap={24}
        renderItem={(card) => (
          <Card
            key={card.id}
            data={card}
            isFocused={card.id === focusedCardId}
            layout={layout}
          />
        )}
        onEndReached={fetchMoreCards}
      />
    </div>
  );
}
```

#### 5.3.3 Card Component

The Card component is a central UI element representing nodes from the knowledge graph.

```tsx
// Card.tsx
export function Card({ data, isFocused, layout }) {
  const { type, id, title, preview, state, growthDimensions } = data;
  const { flipCard, focusCard } = useCardActions();
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Card appearance based on state and growth dimensions
  const cardEvolution = getCardEvolutionState(state);
  const completedDimensions = growthDimensions.filter(d => d.status === 'activated' || d.status === 'mastered');
  
  // Animation for card flipping
  const { transform, opacity } = useSpring({
    opacity: isFlipped ? 0 : 1,
    transform: `perspective(1200px) rotateY(${isFlipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 }
  });
  
  return (
    <motion.div 
      className={`card ${cardEvolution.className} ${isFocused ? 'focused' : ''}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => focusCard(id)}
    >
      {/* Card front side */}
      <animated.div 
        className="card-front"
        style={{ opacity, transform }}
        onClick={() => setIsFlipped(true)}
      >
        <div className="card-header">
          <CardTypeIcon type={type} />
          <h3>{title}</h3>
        </div>
        
        <div className="card-preview">
          {data.mediaUrl ? (
            <img src={data.mediaUrl} alt={title} />
          ) : (
            <p>{preview}</p>
          )}
        </div>
        
        <div className="card-dimensions">
          {growthDimensions.map(dimension => (
            <GrowthDimensionIndicator
              key={dimension.key}
              dimension={dimension}
              status={dimension.status}
              progress={dimension.progress}
            />
          ))}
        </div>
      </animated.div>
      
      {/* Card back side */}
      <animated.div 
        className="card-back"
        style={{ 
          opacity: opacity.to(o => 1 - o),
          transform: transform.to(t => `${t} rotateY(180deg)`)
        }}
        onClick={() => setIsFlipped(false)}
      >
        <div className="card-details">
          <h3>{title}</h3>
          <p>{data.description}</p>
          
          <div className="card-dimensions-detail">
            {growthDimensions.map(dimension => (
              <GrowthDimensionDetail 
                key={dimension.key}
                dimension={dimension}
                nextStepSuggestion={dimension.nextStepSuggestion}
              />
            ))}
          </div>
          
          <div className="card-actions">
            <Button onClick={() => expandCard(id)}>Expand</Button>
            {data.type === 'concept' && (
              <Button onClick={() => exploreInGraph(id)}>Explore in Graph</Button>
            )}
          </div>
        </div>
      </animated.div>
      
      {/* Evolution visual effects */}
      {cardEvolution.state === 'constellation' && <ConstellationEffect />}
      {cardEvolution.state === 'supernova' && <SupernovaEffect />}
    </motion.div>
  );
}
```

#### 5.3.4 Growth Dimension Indicator

Visual indicator for a card's progress in the Six-Dimensional Growth Model.

```tsx
// GrowthDimensionIndicator.tsx
export function GrowthDimensionIndicator({ dimension, status, progress }) {
  const dimensionColor = getDimensionColor(dimension.key);
  
  return (
    <div className={`dimension-indicator ${status}`}>
      <div 
        className="dimension-progress" 
        style={{ 
          backgroundColor: dimensionColor,
          opacity: status === 'unactivated' ? 0.2 : 0.8,
          width: `${progress * 100}%` 
        }} 
      />
      <Icon name={dimension.icon} color={dimensionColor} opacity={status === 'unactivated' ? 0.3 : 1} />
    </div>
  );
}
```

#### 5.3.5 Chat Interface

The Chat Interface enables communication with the Dialogue Agent (Dot), represented visually by the Orb.

```tsx
// ChatInterface.tsx
export function ChatInterface() {
  const { messages, chatStatus, inputDisabled } = useChatStore();
  const { sendMessage, loadPreviousMessages } = useChatActions();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load initial messages from backend
  useEffect(() => {
    loadPreviousMessages();
  }, []);
  
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    sendMessage(inputText);
    setInputText('');
  };
  
  return (
    <div className="chat-container glassmorphic-panel">
      <div className="chat-header">
        <h2>Conversation with Dot</h2>
        <IconButton 
          icon="minimize" 
          onClick={() => toggleChatVisibility(false)} 
        />
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <ChatMessage 
            key={message.id}
            message={message}
            isUser={message.sender === 'user'}
          />
        ))}
        <div ref={messagesEndRef} />
        
        {chatStatus === 'thinking' && <TypingIndicator />}
      </div>
      
      <div className="chat-input">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message Dot..."
          disabled={inputDisabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <IconButton 
          icon="send" 
          onClick={handleSendMessage}
          disabled={inputDisabled || !inputText.trim()}
        />
      </div>
    </div>
  );
}

// Chat Message Component
function ChatMessage({ message, isUser }) {
  return (
    <div className={`message ${isUser ? 'user-message' : 'dot-message'}`}>
      {!isUser && <OrbAvatar emotion={message.emotion} size="small" />}
      
      <div className="message-content">
        {message.content}
        
        {message.attachments?.map(attachment => (
          <MessageAttachment key={attachment.id} attachment={attachment} />
        ))}
        
        {message.suggestionButtons?.map(suggestion => (
          <SuggestionButton 
            key={suggestion.id}
            label={suggestion.text}
            onClick={() => handleSuggestion(suggestion)}
          />
        ))}
      </div>
      
      <div className="message-timestamp">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}
```

#### 5.3.6 HUD (Heads-Up Display)

The HUD provides consistent navigation and status display across all scenes.

```tsx
// HUD.tsx
export function HUD() {
  const { activeScene } = useSceneStore();
  const { userGrowthSummary } = useUserStore();
  
  return (
    <div className="hud-container pointer-events-auto">
      <div className="top-nav">
        <Logo />
        <MainNavigation activeScene={activeScene} />
        <UserMenu />
      </div>
      
      <div className="side-nav">
        <IconButton icon="cards" onClick={() => toggleModal('card-gallery')} />
        <IconButton icon="chat" onClick={() => toggleModal('chat')} />
        <IconButton icon="dashboard" onClick={() => toggleModal('dashboard')} />
      </div>
      
      <div className="bottom-hud">
        <GrowthDimensionSummary summary={userGrowthSummary} />
        <SceneContext scene={activeScene} />
      </div>
    </div>
  );
}
```

#### 5.3.7 Glassmorphic Design System

The UI implements a consistent glassmorphic design language using Tailwind CSS and custom utilities.

```tsx
// GlassmorphicPanel.tsx
export function GlassmorphicPanel({ 
  children, 
  opacity = 0.15, 
  blur = 10,
  border = true,
  className = "" 
}) {
  return (
    <div 
      className={`
        relative rounded-2xl overflow-hidden
        ${border ? 'glassmorphic-border' : ''}
        ${className}
      `}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`, // Safari support
      }}
    >
      {/* Background with gradient and opacity */}
      <div 
        className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/30 dark:to-gray-900/10"
        style={{ opacity }}
      />
      
      {children}
    </div>
  );
}
```

```css
/* Glass design utilities in Tailwind CSS */
@layer components {
  .glassmorphic-panel {
    @apply relative backdrop-blur-md bg-white/15 dark:bg-gray-900/20 rounded-2xl;
    @apply shadow-lg border border-white/20 dark:border-white/10;
  }
  
  .glassmorphic-border {
    @apply after:absolute after:inset-0 after:rounded-2xl after:pointer-events-none;
    @apply after:border after:border-white/20 dark:after:border-white/10;
    @apply after:bg-gradient-to-br after:from-white/5 after:to-transparent after:backdrop-blur-sm;
  }
}
```

### 5.4 State Management

The application uses Zustand with Immer for state management, organized into multiple specialized stores:

```tsx
// sceneStore.ts
export const useSceneStore = create<SceneStore>()(
  immer((set) => ({
    activeScene: 'cloud',
    sceneTransitioning: false,
    timeOfDay: 'day',
    weatherState: 'clear',
    
    // Scene transition action
    transitionToScene: (targetScene: SceneType) => set(state => {
      if (state.activeScene === targetScene) return;
      
      state.sceneTransitioning = true;
      state.transitionTarget = targetScene;
    }),
    
    // Complete transition
    completeTransition: () => set(state => {
      state.activeScene = state.transitionTarget as SceneType;
      state.sceneTransitioning = false;
      state.transitionTarget = undefined;
    }),
    
    // Update scene environment
    updateEnvironment: (updates: Partial<SceneEnvironment>) => set(state => {
      Object.assign(state, updates);
    }),
  }))
);

// orbStore.ts
export const useOrbStore = create<OrbStore>()(
  immer((set) => ({
    emotionalTone: 'neutral',
    visualState: 'default',
    energyLevel: 0.5,
    position: [0, 2, 0],
    isVisible: true,
    isSpeaking: false,
    activeEffects: [],
    
    // Update orb state
    updateOrbState: (state: Partial<OrbState>) => set(draft => {
      Object.assign(draft, state);
    }),
    
    // Transition orb to a new state
    transitionToState: (targetState: OrbVisualState, duration: number = 1.0) => set(state => {
      state.targetVisualState = targetState;
      state.transitioning = true;
      state.transitionDuration = duration;
    }),
    
    // Add a temporary visual effect
    addEffect: (effect: OrbEffect) => set(state => {
      state.activeEffects.push(effect);
    }),
    
    // Remove a visual effect
    removeEffect: (effectId: string) => set(state => {
      state.activeEffects = state.activeEffects.filter(e => e.id !== effectId);
    }),
  }))
);

// cardGalleryStore.ts
export const useCardGalleryStore = create<CardGalleryStore>()(
  immer((set) => ({
    cards: [],
    layout: 'standard',
    filters: {
      type: 'all',
      timeRange: 'all',
      growthDimension: null,
      searchQuery: '',
    },
    focusedCardId: null,
    isLoading: false,
    
    // Set card data
    setCards: (cards: Card[]) => set(state => {
      state.cards = cards;
    }),
    
    // Append new cards (pagination)
    appendCards: (newCards: Card[]) => set(state => {
      state.cards = [...state.cards, ...newCards];
    }),
    
    // Update filters
    updateFilters: (filters: Partial<CardFilters>) => set(state => {
      state.filters = { ...state.filters, ...filters };
    }),
    
    // Focus a card
    focusCard: (cardId: string | null) => set(state => {
      state.focusedCardId = cardId;
    }),
    
    // Update a single card
    updateCard: (cardId: string, updates: Partial<Card>) => set(state => {
      const cardIndex = state.cards.findIndex(c => c.id === cardId);
      if (cardIndex >= 0) {
        Object.assign(state.cards[cardIndex], updates);
      }
    }),
  }))
);
```

### 5.5 API Communication

The application uses TanStack Query for data fetching and mutation with a structured API client:

```tsx
// api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error handler
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

```tsx
// hooks/useCardQuery.ts
export function useCardQuery() {
  const queryClient = useQueryClient();
  
  // Fetch cards query
  const cardsQuery = useQuery({
    queryKey: ['cards', filters],
    queryFn: () => fetchCards(filters),
    keepPreviousData: true,
  });
  
  // Fetch more cards for pagination
  const fetchMoreCards = async () => {
    if (!cardsQuery.data?.nextCursor) return;
    
    const nextPage = await fetchCards({
      ...filters,
      cursor: cardsQuery.data.nextCursor,
    });
    
    queryClient.setQueryData(['cards', filters], {
      cards: [...cardsQuery.data.cards, ...nextPage.cards],
      nextCursor: nextPage.nextCursor,
    });
  };
  
  // Update card mutation
  const updateCardMutation = useMutation({
    mutationFn: updateCard,
    onSuccess: (updatedCard) => {
      queryClient.setQueryData(['cards', filters], (old: any) => ({
        ...old,
        cards: old.cards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        ),
      }));
    },
  });
  
  return {
    cards: cardsQuery.data?.cards || [],
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    fetchMoreCards,
    updateCard: updateCardMutation.mutate,
  };
}
```

### 5.6 3D Orb Implementation

The 3D Orb is a central element of the user experience, serving as the visual representation of the Dialogue Agent (Dot). Its appearance, behavior, and effects dynamically change to reflect the agent's internal state and the user's interaction context.

#### 5.6.1 Orb Architecture

```tsx
// OrbLayer.tsx
export function OrbLayer() {
  const { position, emotionalTone, visualState, energyLevel, isVisible, isSpeaking, activeEffects } = useOrbStore();
  
  if (!isVisible) return null;
  
  return (
    <group position={position}>
      <Orb 
        emotionalTone={emotionalTone}
        visualState={visualState}
        energyLevel={energyLevel}
        isSpeaking={isSpeaking}
      />
      
      {/* Orb Effects */}
      {activeEffects.map(effect => (
        <OrbEffect key={effect.id} effect={effect} />
      ))}
      
      {/* Light source from orb */}
      <pointLight 
        color={getOrbLightColor(emotionalTone)}
        intensity={1.5 * energyLevel}
        distance={8}
        decay={2}
      />
    </group>
  );
}

// Orb.tsx (main implementation)
export function Orb({ emotionalTone, visualState, energyLevel, isSpeaking }) {
  const materialRef = useRef();
  const noiseRef = useRef();
  
  // Get visual properties based on state
  const visualProps = useMemo(() => {
    return getOrbVisualProperties(emotionalTone, visualState);
  }, [emotionalTone, visualState]);
  
  // Time-based animation
  useFrame((state) => {
    if (!materialRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Update shader uniforms for time-based animation
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uEnergyLevel.value = energyLevel;
    materialRef.current.uniforms.uPulse.value = isSpeaking 
      ? Math.sin(time * 8) * 0.1 + 0.9 
      : 1.0;
      
    // Slight position animation
    noiseRef.current = (noiseRef.current || 0) + 0.01;
    const noiseX = simplex.noise2D(noiseRef.current, 0) * 0.05;
    const noiseY = simplex.noise2D(0, noiseRef.current) * 0.05;
    
    // More active when speaking or high energy
    const moveFactor = isSpeaking || energyLevel > 0.7 ? 1.0 : 0.3;
    
    // Apply noise to group position
    group.current.position.x += noiseX * moveFactor;
    group.current.position.y += noiseY * moveFactor;
  });
  
  return (
    <group ref={group}>
      {/* Main Orb Mesh */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          transparent={true}
          uniforms={{
            uTime: { value: 0 },
            uBaseColor: { value: new THREE.Color(visualProps.baseColor) },
            uAccentColor: { value: new THREE.Color(visualProps.accentColor) },
            uNoiseScale: { value: visualProps.noiseScale },
            uNoiseIntensity: { value: visualProps.noiseIntensity },
            uGlowIntensity: { value: visualProps.glowIntensity },
            uEnergyLevel: { value: energyLevel },
            uPulse: { value: 1.0 },
            uVoronoiScale: { value: visualProps.voronoiScale },
          }}
        />
      </mesh>
      
      {/* Inner Core */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          transparent={true}
          uniforms={{
            uTime: { value: 0 },
            uCoreColor: { value: new THREE.Color(visualProps.coreColor) },
            uEnergyLevel: { value: energyLevel },
          }}
        />
      </mesh>
      
      {/* Particle System for energy emissions */}
      <OrbParticleSystem 
        color={visualProps.particleColor}
        count={100 * energyLevel}
        size={0.05}
        speed={0.5 + energyLevel * 2}
      />
    </group>
  );
}
```

#### 5.6.2 Orb Shader Implementation

The Orb's visual appearance is primarily driven by custom GLSL shaders:

```glsl
// orbVertexShader.glsl
uniform float uTime;
uniform float uEnergyLevel;
uniform float uPulse;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vPosition = position;
  vNormal = normal;
  vUv = uv;
  
  // Apply subtle vertex displacement based on energy level
  float displacement = sin(position.x * 10.0 + uTime) * sin(position.y * 10.0 + uTime) * sin(position.z * 10.0 + uTime) * 0.05 * uEnergyLevel;
  
  // Apply pulse effect when speaking
  float scale = 1.0 + displacement + (uPulse - 1.0) * 0.1;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
}

// orbFragmentShader.glsl
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uNoiseScale;
uniform float uNoiseIntensity;
uniform float uGlowIntensity;
uniform float uEnergyLevel;
uniform float uVoronoiScale;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

// Simplex noise function implementation
// ... (noise function code)

// Voronoi function implementation
// ... (voronoi function code)

void main() {
  // Calculate view direction
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
  
  // Generate noise patterns
  float noise1 = simplexNoise(vPosition * uNoiseScale + uTime * 0.1);
  float noise2 = simplexNoise(vPosition * uNoiseScale * 2.0 - uTime * 0.15);
  
  // Voronoi cells for energy structure
  vec2 voronoiResult = voronoi(vPosition * uVoronoiScale + uTime * 0.05);
  float cells = voronoiResult.x;
  float borders = voronoiResult.y;
  
  // Combine patterns
  float pattern = mix(noise1, cells, 0.5) * noise2;
  pattern = pattern * 0.5 + 0.5; // normalize to 0-1
  
  // Energy flow effect
  float energyFlow = sin(vPosition.y * 20.0 + uTime * 3.0) * 0.5 + 0.5;
  energyFlow = smoothstep(0.0, 1.0, energyFlow) * uEnergyLevel;
  
  // Combine colors
  vec3 baseWithNoise = mix(uBaseColor, uAccentColor, pattern * energyFlow);
  vec3 finalColor = mix(baseWithNoise, uAccentColor, fresnel * uGlowIntensity);
  
  // Add border highlights to cell structure
  finalColor += vec3(1,1,1) * smoothstep(0.05, 0.0, borders) * uEnergyLevel * 0.5;
  
  // Apply fresnel-based opacity for edge glow
  float opacity = mix(0.7, 0.9, fresnel * uGlowIntensity);
  
  gl_FragColor = vec4(finalColor, opacity);
}
```

#### 5.6.3 Emotional States

The Orb's appearance changes based on the emotional tone of the interaction:

| Emotional Tone | Base Color  | Core Color  | Visual Characteristics |
|----------------|-------------|-------------|------------------------|
| Neutral        | #8ECAE6     | #FFFFFF     | Gentle blue waves, subtle pulsing |
| Curious        | #7B6FF0     | #E0D8FF     | Swirling patterns, more active movement |
| Reflective     | #6D6875     | #B5838D     | Slow-moving deep patterns, pensive |
| Excited        | #F6BD60     | #FFF1E0     | Rapid energy bursts, bright pulses |
| Focused        | #5E60CE     | #64DFDF     | Concentrated energy, directed patterns |
| Concerned      | #BC6C25     | #DDA15E     | Irregular patterns, fluctuating energy |
| Celebratory    | #F72585     | #FFCCD5     | Explosive patterns, particle emissions |
| Serene         | #588157     | #A3B18A     | Smooth flowing energy, harmonious patterns |

#### 5.6.4 Visual States

The Orb's form and behavior changes based on its functional state:

| Visual State     | Description | Implementation Details |
|------------------|-------------|------------------------|
| Default          | Standard orb appearance | Balanced noise, moderate glow |
| Listening        | Receptive, attentive form | Increased surface definition, subtle inward flow |
| Thinking         | Processing information | Internal swirling patterns, concentrated energy |
| Speaking         | Communicating information | Rhythmic pulsing synchronized with voice |
| Analyzing        | Deep processing mode | Complex pattern formation, scanning effect |
| Dormant          | Background, passive state | Reduced energy, slower movement, dimmer glow |
| Insight          | Moment of discovery | Momentary bright flash, expanding rings |
| Transitioning    | Moving between scenes | Elongated form, directional energy flow |
| Celebration      | Achievement recognition | Particle bursts, increase in size and activity |

#### 5.6.5 Orb Effects System

The Orb can display temporary visual effects to communicate specific events or conditions:

```tsx
// OrbEffect.tsx
export function OrbEffect({ effect }) {
  const { type, duration, startTime, ...params } = effect;
  const elapsedTime = useElapsedTime(startTime);
  const progress = Math.min(elapsedTime / duration, 1);
  
  // Remove effect when complete
  useEffect(() => {
    if (progress >= 1) {
      const { removeEffect } = useOrbStore.getState();
      removeEffect(effect.id);
    }
  }, [progress, effect.id]);
  
  // Render effect based on type
  switch (type) {
    case 'particles':
      return <OrbParticleBurst 
        color={params.color}
        count={params.count}
        speed={params.speed}
        size={params.size}
        progress={progress}
      />;
      
    case 'pulse':
      return <OrbPulseRing 
        color={params.color}
        thickness={params.thickness}
        progress={progress}
      />;
      
    case 'trail':
      return <OrbEnergyTrail 
        target={params.target}
        color={params.color}
        width={params.width}
        progress={progress}
      />;
      
    case 'glow':
      return <OrbGlowIntensity 
        color={params.color}
        intensity={params.intensity}
        progress={progress}
      />;
      
    default:
      return null;
  }
}
```

### 5.7 Frontend-Backend Integration

The frontend and backend systems are tightly integrated, with several key mechanisms for synchronization:

#### 5.7.1 Event-Driven State Synchronization

The UI state and backend events are synchronized through a bidirectional event system:

```tsx
// hooks/useAgentEvents.ts
export function useAgentEvents() {
  const { updateOrbState, addEffect } = useOrbStore();
  const { transitionToScene } = useSceneStore();
  const { addMessage } = useChatStore();
  
  // WebSocket connection for real-time events
  useEffect(() => {
    const socket = io('/agent-events');
    
    // Agent state updates
    socket.on('agent-state', (state) => {
      // Update Orb visual state based on agent state
      updateOrbState({
        emotionalTone: state.emotionalTone,
        visualState: state.visualState,
        energyLevel: state.energyLevel,
        isSpeaking: state.isSpeaking,
      });
      
      // Add any triggered effects
      if (state.effects) {
        state.effects.forEach(effect => addEffect(effect));
      }
      
      // Handle scene transition requests
      if (state.sceneRequest) {
        transitionToScene(state.sceneRequest);
      }
    });
    
    // New message events
    socket.on('agent-message', (message) => {
      addMessage(message);
    });
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Agent API actions
  return {
    // Send user message to agent
    sendMessage: async (text) => {
      const response = await apiClient.post('/api/dialogue', { message: text });
      return response.data;
    },
    
    // Request agent focus on a specific concept
    focusConcept: async (conceptId) => {
      await apiClient.post('/api/dialogue/focus', { conceptId });
    },
    
    // Request explanation of a connection
    explainConnection: async (sourceId, targetId) => {
      const response = await apiClient.post('/api/dialogue/explain-connection', {
        sourceId,
        targetId
      });
      return response.data;
    }
  };
}
```

#### 5.7.2 Graph Visualization Data Integration

The GraphScene directly visualizes data from the knowledge graph:

```tsx
// hooks/useGraphData.ts
export function useGraphData() {
  const { updateNodes, updateLinks, setGraphLoading } = useGraphStore();
  
  const fetchGraphData = async (options: GraphQueryOptions = {}) => {
    setGraphLoading(true);
    
    try {
      // Convert UI options to Neo4j query parameters
      const params = composeQueryParams(options);
      
      // Fetch graph structure from backend
      const response = await apiClient.get('/api/graph', { params });
      
      // Transform backend graph data into visualization format
      const { nodes, links } = transformGraphData(response.data);
      
      // Update graph visualization state
      updateNodes(nodes);
      updateLinks(links);
      
      return { nodes, links };
    } catch (error) {
      console.error('Error fetching graph data:', error);
      throw error;
    } finally {
      setGraphLoading(false);
    }
  };
  
  return { fetchGraphData };
}

// Transform backend graph data to visualization format
function transformGraphData(backendData) {
  // Convert Neo4j nodes to visualization nodes
  const nodes = backendData.nodes.map(node => ({
    id: node.id,
    label: node.properties.name,
    type: node.labels[1] || node.labels[0], // Use second label if available (more specific)
    data: node.properties,
    // Visual properties based on node type
    visualProperties: getNodeVisualProperties(node.labels, node.properties),
  }));
  
  // Convert Neo4j relationships to visualization links
  const links = backendData.relationships.map(rel => ({
    id: rel.id,
    source: rel.startNode,
    target: rel.endNode,
    label: rel.type,
    weight: rel.properties.weight || 1,
    // Visual properties based on relationship type
    visualProperties: getLinkVisualProperties(rel.type, rel.properties),
  }));
  
  return { nodes, links };
}
```

#### 5.7.3 Card Data Integration

The Card Gallery integrates with the backend to display and update cards:

```tsx
// hooks/useCardData.ts
export function useCardData() {
  const queryClient = useQueryClient();
  
  // Fetch cards based on filters
  const fetchCards = async (filters, pagination = { limit: 20, cursor: null }) => {
    const response = await apiClient.get('/api/cards', {
      params: {
        ...filters,
        ...pagination
      }
    });
    
    // Add client-side visual properties
    return {
      cards: response.data.cards.map(enrichCardWithVisuals),
      nextCursor: response.data.nextCursor
    };
  };
  
  // Update a single card
  const updateCard = useMutation({
    mutationFn: async (updates) => {
      const response = await apiClient.patch(`/api/cards/${updates.id}`, updates);
      return enrichCardWithVisuals(response.data);
    },
    onSuccess: (updatedCard) => {
      // Update card in cache
      queryClient.setQueriesData(
        { queryKey: ['cards'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.map(card => 
              card.id === updatedCard.id ? updatedCard : card
            )
          };
        }
      );
    }
  });
  
  // Complete a growth dimension challenge on a card
  const completeGrowthChallenge = useMutation({
    mutationFn: async ({ cardId, dimensionKey, evidence }) => {
      const response = await apiClient.post(`/api/cards/${cardId}/dimensions/${dimensionKey}/complete`, {
        evidence
      });
      return enrichCardWithVisuals(response.data);
    },
    onSuccess: (updatedCard) => {
      // Update card in cache
      queryClient.setQueriesData(
        { queryKey: ['cards'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cards: old.cards.map(card => 
              card.id === updatedCard.id ? updatedCard : card
            )
          };
        }
      );
      
      // Trigger celebration effect
      const { addEffect } = useOrbStore.getState();
      addEffect({
        id: `dimension-complete-${Date.now()}`,
        type: 'particles',
        color: getDimensionColor(dimensionKey),
        count: 100,
        speed: 2,
        size: 0.1,
        duration: 3,
        startTime: Date.now()
      });
    }
  });
  
  return {
    fetchCards,
    updateCard: updateCard.mutate,
    completeGrowthChallenge: completeGrowthChallenge.mutate,
    isUpdating: updateCard.isPending || completeGrowthChallenge.isPending
  };
}

// Add visual properties to card data
function enrichCardWithVisuals(card) {
  return {
    ...card,
    // Visual properties based on card type and state
    visualProperties: getCardVisualProperties(card),
    // Evolution state
    evolutionState: calculateCardEvolutionState(card),
    // Dimension visual indicators
    growthDimensions: card.growthDimensions.map(dim => ({
      ...dim,
      color: getDimensionColor(dim.key),
      icon: getDimensionIcon(dim.key)
    }))
  };
}
```

### 5.8 Accessibility Implementation

The 3D-heavy nature of the application presents accessibility challenges that are addressed through:

#### 5.8.1 Alternative Navigation Modes

```tsx
// hooks/useAccessibilityMode.ts
export function useAccessibilityMode() {
  const { accessibilityPreferences, updatePreferences } = useUserStore();
  
  // Toggle accessibility mode
  const toggleAccessibilityMode = useCallback(() => {
    updatePreferences({
      accessibilityMode: !accessibilityPreferences.accessibilityMode
    });
  }, [accessibilityPreferences.accessibilityMode]);
  
  // When accessibility mode is enabled, apply these effects
  useEffect(() => {
    if (accessibilityPreferences.accessibilityMode) {
      // Replace 3D canvas with accessible alternative
      document.body.classList.add('accessibility-mode');
      
      // Use simpler visualizations
      useSceneStore.setState({
        simplifiedRendering: true
      });
      
      // Reduce motion
      useOrbStore.setState({
        reducedMotion: true
      });
    } else {
      document.body.classList.remove('accessibility-mode');
      
      useSceneStore.setState({
        simplifiedRendering: false
      });
      
      useOrbStore.setState({
        reducedMotion: false
      });
    }
  }, [accessibilityPreferences.accessibilityMode]);
  
  return {
    isAccessibilityModeEnabled: accessibilityPreferences.accessibilityMode,
    toggleAccessibilityMode
  };
}
```

#### 5.8.2 2D Alternative Views

For users who cannot use the 3D interface, the system provides 2D alternatives:

```tsx
// AccessibleCardGallery.tsx
export function AccessibleCardGallery() {
  const { cards, filters, isLoading } = useCardGalleryStore();
  
  return (
    <div className="accessible-card-gallery" role="grid">
      <div className="filters" role="search">
        <AccessibleFilterControls filters={filters} />
      </div>
      
      {isLoading ? (
        <div className="loading-indicator" aria-live="polite">
          Loading cards...
        </div>
      ) : (
        <div className="card-list">
          {cards.map(card => (
            <AccessibleCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

// AccessibleGraphView.tsx
export function AccessibleGraphView() {
  const { nodes, links, focusedNodeId } = useGraphStore();
  
  // Organize nodes into conceptual groups
  const groupedNodes = groupNodesByType(nodes);
  
  return (
    <div className="accessible-graph-view">
      <h2>Knowledge Graph Explorer</h2>
      
      {focusedNodeId && (
        <FocusedNodeDetails 
          node={nodes.find(n => n.id === focusedNodeId)}
          connections={getNodeConnections(focusedNodeId, nodes, links)}
        />
      )}
      
      <div className="node-groups">
        {Object.entries(groupedNodes).map(([type, nodes]) => (
          <div key={type} className="node-group">
            <h3>{formatNodeTypeName(type)}</h3>
            <ul>
              {nodes.map(node => (
                <li key={node.id}>
                  <button 
                    onClick={() => focusNode(node.id)}
                    aria-selected={node.id === focusedNodeId}
                  >
                    {node.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5.8.3 Accessibility Features

Additional accessibility features include:

1. **Keyboard Navigation:** Full keyboard control of all UI elements.
2. **Screen Reader Support:** ARIA attributes and role definitions for all components.
3. **High Contrast Mode:** Alternative color schemes for better visibility.
4. **Text-to-Speech:** Audio feedback for Orb communications.
5. **Closed Captions:** Text descriptions of visual events.
6. **Focus Management:** Clear focus indicators and logical tab order.

```tsx
// AccessibilityProvider.tsx
export function AccessibilityProvider({ children }) {
  const { accessibilityPreferences } = useUserStore();
  
  // Set up focus trap for modals
  useEffect(() => {
    const modals = document.querySelectorAll('[role="dialog"]');
    const focusTraps = Array.from(modals).map(modal => 
      createFocusTrap(modal, {
        allowOutsideClick: true,
        escapeDeactivates: true,
      })
    );
    
    focusTraps.forEach(trap => trap.activate());
    
    return () => {
      focusTraps.forEach(trap => trap.deactivate());
    };
  }, []);
  
  // Apply high contrast if needed
  useEffect(() => {
    if (accessibilityPreferences.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [accessibilityPreferences.highContrast]);
  
  // Set up screen reader announcements
  const announce = useCallback((message, priority = 'polite') => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.textContent = message;
      announcer.setAttribute('aria-live', priority);
    }
  }, []);
  
  return (
    <>
      {children}
      
      {/* Screen reader announcements */}
      <div 
        id="screen-reader-announcer" 
        className="sr-only" 
        aria-live="polite"
      ></div>
      
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
    </>
  );
}
```

## 6. Backend Implementation

### 6.1 Technology Stack

The backend is built on a modern, scalable architecture designed to support both the knowledge processing requirements and the interactive, real-time UI experience:

- **API Framework:** Node.js with Express.js (US) / Tencent Cloud SCF (China)
- **Runtime:** Node.js 18+ (US) / Node.js 18+ (China)
- **Database Layer:**
  - **Primary Data:** PostgreSQL 16+
  - **Graph Database:** Neo4j 5.13+
  - **Vector Database:** Weaviate 1.24+
  - **Cache & Queues:** Redis 7.2+
- **Message Queue:** Bull MQ (Redis-based)
- **AI/LLM Integration:**
  - **US Region:** Google Gemini API for LLM, PaLM 2 for embeddings
  - **China Region:** DeepSeek API for LLM, DeepSeek Embedding API
- **Authentication:** OAuth 2.0 / JWT with Redis session store
- **Real-time Communication:** Socket.IO
- **Monitoring & Logging:** OpenTelemetry, Prometheus, Grafana
- **Containerization:** Docker with Kubernetes for orchestration
- **Cloud Infrastructure:**
  - **US Region:** AWS (EKS, RDS, ElastiCache, S3)
  - **China Region:** Tencent Cloud (TKE, TencentDB, COS)

### 6.2 Core Backend Services

#### 6.2.1 API Gateway

The API Gateway serves as the entry point for all client requests and manages authentication, rate limiting, and request routing.

```typescript
// api-gateway/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { SocketServer } from './socket-server';
import config from './config';

// Create Express app
const app = express();

// Apply security middleware
app.use(helmet());
app.use(cors(config.corsOptions));
app.use(express.json({ limit: '5mb' }));

// Apply logging
app.use(loggerMiddleware);

// Public routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/health', require('./routes/health.routes'));

// Protected routes with auth and rate limiting
app.use('/api/*', authMiddleware, rateLimitMiddleware);

// Route to specific services
app.use('/api/dialogue', createProxyMiddleware({
  target: config.services.dialogueAgent,
  changeOrigin: true,
  pathRewrite: {'^/api/dialogue': '/'}
}));

app.use('/api/memory', createProxyMiddleware({
  target: config.services.memoryService,
  changeOrigin: true,
  pathRewrite: {'^/api/memory': '/'}
}));

app.use('/api/graph', createProxyMiddleware({
  target: config.services.graphService,
  changeOrigin: true,
  pathRewrite: {'^/api/graph': '/'}
}));

app.use('/api/cards', createProxyMiddleware({
  target: config.services.cardService,
  changeOrigin: true,
  pathRewrite: {'^/api/cards': '/'}
}));

// Error handling
app.use(errorHandlerMiddleware);

// Start server
const server = app.listen(config.port, () => {
  console.log(`API Gateway listening on port ${config.port}`);
});

// Set up Socket.IO server
const socketServer = new SocketServer(server);
socketServer.initialize();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
```

#### 6.2.2 Dialogue Agent Service

The Dialogue Agent Service manages conversations with users and coordinates the Orb's behavior.

```typescript
// dialogue-agent/src/server.ts
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { DialogueAgent } from './agent/dialogue-agent';
import { messageBroker } from './messaging/message-broker';
import { dialogueController } from './controllers/dialogue.controller';
import { SocketHandler } from './socket/socket-handler';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(loggerMiddleware);

// Initialize dialogue agent
const dialogueAgent = new DialogueAgent();

// Socket.IO setup for real-time communication
const socketHandler = new SocketHandler(io, dialogueAgent);
socketHandler.initialize();

// Routes
app.post('/message', dialogueController.sendMessage);
app.post('/focus', dialogueController.focusConcept);
app.post('/explain-connection', dialogueController.explainConnection);
app.post('/suggest-next', dialogueController.suggestNextActions);

// Listen for events from other agents
messageBroker.subscribe('insights.new', async (insight) => {
  await dialogueAgent.processNewInsight(insight);
});

messageBroker.subscribe('memory.ingested', async (memory) => {
  await dialogueAgent.processNewMemory(memory);
});

// Error handling
app.use(errorHandlerMiddleware);

// Start server
httpServer.listen(process.env.PORT || 3001, () => {
  console.log(`Dialogue Agent Service running on port ${process.env.PORT || 3001}`);
});
```

### 6.3 Agent Architecture

The cognitive agent architecture follows the Agent-Tool paradigm, where specialized agents use deterministic tools to accomplish their tasks.

#### 6.3.1 Agent Base Class

All agents extend a common base class that provides shared functionality:

```typescript
// packages/agent-framework/src/base-agent.ts
import { Tool } from '../tools/tool-interface';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected tools: Map<string, Tool>;
  protected logger: Logger;
  protected running: boolean = false;
  
  constructor(name: string) {
    super();
    this.id = uuidv4();
    this.name = name;
    this.tools = new Map();
    this.logger = new Logger(name);
  }
  
  /**
   * Register tools that this agent can use
   */
  public registerTool(tool: Tool): void {
    this.tools.set(tool.getName(), tool);
    this.logger.info(`Registered tool: ${tool.getName()}`);
  }
  
  /**
   * Execute a registered tool
   */
  protected async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    this.logger.debug(`Executing tool: ${toolName}`, { params });
    
    try {
      const result = await tool.execute(params);
      this.logger.debug(`Tool execution completed: ${toolName}`);
      return result;
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolName}`, { error });
      throw error;
    }
  }
  
  /**
   * Start the agent
   */
  public start(): void {
    this.running = true;
    this.logger.info(`Agent ${this.name} started`);
    this.emit('started', { agentId: this.id, timestamp: Date.now() });
  }
  
  /**
   * Stop the agent
   */
  public stop(): void {
    this.running = false;
    this.logger.info(`Agent ${this.name} stopped`);
    this.emit('stopped', { agentId: this.id, timestamp: Date.now() });
  }
  
  /**
   * Abstract method that every agent must implement
   */
  public abstract async process(input: any): Promise<any>;
}
```

#### 6.3.2 Dialogue Agent Implementation

The Dialogue Agent coordinates conversations and manages the Orb's behavior:

```typescript
// services/dialogue-agent/src/agent/dialogue-agent.ts
import { BaseAgent } from '@2dots1line/agent-framework';
import { RetrievalPlannerClient } from '../clients/retrieval-planner-client';
import { InsightEngineClient } from '../clients/insight-engine-client';
import { IngestionAnalystClient } from '../clients/ingestion-analyst-client';
import { UserRepository } from '../repositories/user-repository';
import { ConversationRepository } from '../repositories/conversation-repository';
import { OrbStateManager } from './orb-state-manager';
import { conversationPlanner } from './conversation-planner';
import { responseGenerator } from './response-generator';
import { emotionDetector } from '../tools/emotion-detector';
import { messageClassifier } from '../tools/message-classifier';
import { contextBuilder } from './context-builder';
import { LLMService } from '../services/llm-service';

export class DialogueAgent extends BaseAgent {
  private orbState: OrbStateManager;
  private retrievalPlanner: RetrievalPlannerClient;
  private insightEngine: InsightEngineClient;
  private ingestionAnalyst: IngestionAnalystClient;
  private userRepo: UserRepository;
  private conversationRepo: ConversationRepository;
  private llmService: LLMService;
  
  constructor() {
    super('DialogueAgent');
    
    // Initialize components
    this.orbState = new OrbStateManager();
    this.retrievalPlanner = new RetrievalPlannerClient();
    this.insightEngine = new InsightEngineClient();
    this.ingestionAnalyst = new IngestionAnalystClient();
    this.userRepo = new UserRepository();
    this.conversationRepo = new ConversationRepository();
    this.llmService = new LLMService();
    
    // Register tools
    this.registerTool(emotionDetector);
    this.registerTool(messageClassifier);
    
    // Listen for orb state changes
    this.orbState.on('stateChanged', (state) => {
      this.emit('orbStateChanged', state);
    });
  }
  
  /**
   * Process a user message
   */
  public async process(input: { userId: string, message: string, conversationId?: string }): Promise<any> {
    const { userId, message, conversationId } = input;
    
    try {
      // Start conversation or get existing one
      const conversation = conversationId
        ? await this.conversationRepo.getConversation(conversationId)
        : await this.conversationRepo.createConversation(userId);
      
      // Update Orb state to listening mode
      this.orbState.updateState({
        visualState: 'listening',
        emotionalTone: 'neutral',
        energyLevel: 0.6
      });
      
      // Detect emotion in user message
      const emotion = await this.executeTool('emotionDetector', { text: message });
      
      // Classify message intent/type
      const classification = await this.executeTool('messageClassifier', { text: message });
      
      // Update Orb state based on message classification
      this.updateOrbStateForClassification(classification, emotion);
      
      // Build context for response
      const context = await contextBuilder.build({
        userId,
        message,
        classification,
        conversationHistory: conversation.messages,
        retrievalPlanner: this.retrievalPlanner
      });
      
      // Update Orb to thinking state
      this.orbState.updateState({
        visualState: 'thinking',
        energyLevel: 0.8
      });
      
      // Plan conversation strategy
      const plan = await conversationPlanner.createPlan({
        userId,
        message,
        classification,
        context,
        emotion
      });
      
      // Generate response
      const response = await responseGenerator.generate({
        plan,
        context,
        llmService: this.llmService
      });
      
      // Save message pair to conversation
      await this.conversationRepo.addMessagePair(
        conversation.id,
        { role: 'user', content: message, metadata: { emotion, classification } },
        { role: 'assistant', content: response.text, metadata: { 
          orbState: response.orbState,
          retrievalSources: context.sources,
          suggestionButtons: response.suggestions
        }}
      );
      
      // Check if we should process this as a memory
      if (classification.shouldIngest) {
        await this.ingestionAnalyst.ingestConversation(conversation.id);
      }
      
      // Update Orb state for speaking
      this.orbState.updateState({
        visualState: 'speaking',
        emotionalTone: response.orbState.emotionalTone,
        energyLevel: response.orbState.energyLevel,
        effects: response.orbState.effects
      });
      
      // Return response and updated conversation
      return {
        response: response.text,
        conversationId: conversation.id,
        orbState: this.orbState.getCurrentState(),
        suggestions: response.suggestions
      };
    } catch (error) {
      this.logger.error('Error processing message', { error });
      
      // Set orb to concerned state
      this.orbState.updateState({
        visualState: 'default',
        emotionalTone: 'concerned',
        energyLevel: 0.4
      });
      
      throw error;
    }
  }
  
  /**
   * Update Orb state based on message classification
   */
  private updateOrbStateForClassification(classification: any, emotion: any): void {
    switch (classification.type) {
      case 'question':
        this.orbState.updateState({
          visualState: 'listening',
          emotionalTone: 'curious',
          energyLevel: 0.7
        });
        break;
        
      case 'reflection':
        this.orbState.updateState({
          visualState: 'listening',
          emotionalTone: 'reflective',
          energyLevel: 0.5
        });
        break;
        
      case 'request':
        this.orbState.updateState({
          visualState: 'listening',
          emotionalTone: 'focused',
          energyLevel: 0.8
        });
        break;
        
      default:
        // Default to matching user emotion
        this.orbState.updateState({
          visualState: 'listening',
          emotionalTone: this.mapEmotionToOrbTone(emotion.primaryEmotion),
          energyLevel: 0.6
        });
    }
  }
  
  /**
   * Map detected user emotion to Orb emotional tone
   */
  private mapEmotionToOrbTone(emotion: string): string {
    const emotionMap: Record<string, string> = {
      'joy': 'excited',
      'sadness': 'reflective',
      'anger': 'concerned',
      'fear': 'concerned',
      'surprise': 'curious',
      'disgust': 'concerned',
      'neutral': 'neutral'
    };
    
    return emotionMap[emotion] || 'neutral';
  }
  
  /**
   * Process a new insight generated by the Insight Engine
   */
  public async processNewInsight(insight: any): Promise<void> {
    // Check if this insight should be immediately shared
    if (insight.urgency === 'high') {
      // Add special effect for insight
      this.orbState.updateState({
        visualState: 'insight',
        emotionalTone: 'excited',
        energyLevel: 0.9,
        effects: [{
          id: `insight-${Date.now()}`,
          type: 'pulse',
          color: '#FFDD67',
          thickness: 0.2,
          duration: 3,
          startTime: Date.now()
        }]
      });
      
      // Emit insight notification
      this.emit('newInsight', {
        insight,
        orbState: this.orbState.getCurrentState()
      });
    }
    
    // Otherwise, store for later conversation
    await this.conversationRepo.storeInsightForUser(insight.userId, insight);
  }
  
  /**
   * Focus on a specific concept
   */
  public async focusConcept(input: { userId: string, conceptId: string }): Promise<any> {
    const { userId, conceptId } = input;
    
    // Update Orb state
    this.orbState.updateState({
      visualState: 'focusing',
      emotionalTone: 'focused',
      energyLevel: 0.8
    });
    
    // Get concept details from graph
    const conceptDetails = await this.retrievalPlanner.getConceptDetails(userId, conceptId);
    
    // Update Orb state with focus effect
    this.orbState.updateState({
      effects: [{
        id: `focus-${Date.now()}`,
        type: 'trail',
        target: conceptId,
        color: '#64DFDF',
        width: 0.1,
        duration: 2,
        startTime: Date.now()
      }]
    });
    
    return {
      conceptDetails,
      orbState: this.orbState.getCurrentState()
    };
  }
  
  /**
   * Explain connection between concepts
   */
  public async explainConnection(input: { userId: string, sourceId: string, targetId: string }): Promise<any> {
    const { userId, sourceId, targetId } = input;
    
    // Update Orb state
    this.orbState.updateState({
      visualState: 'analyzing',
      emotionalTone: 'reflective',
      energyLevel: 0.7
    });
    
    // Get connection details
    const connectionDetails = await this.retrievalPlanner.getConnectionDetails(userId, sourceId, targetId);
    
    // Generate explanation
    const explanation = await this.llmService.generateConnectionExplanation(connectionDetails);
    
    // Update Orb state
    this.orbState.updateState({
      visualState: 'speaking',
      emotionalTone: 'reflective',
      energyLevel: 0.6,
      effects: [{
        id: `connection-${Date.now()}`,
        type: 'trail',
        target: {
          source: sourceId,
          target: targetId
        },
        color: '#7B6FF0',
        width: 0.15,
        duration: 3,
        startTime: Date.now()
      }]
    });
    
    return {
      explanation,
      connectionDetails,
      orbState: this.orbState.getCurrentState()
    };
  }
}
```

#### 6.3.3 Orb State Manager

The Orb State Manager manages the Orb's visual state and synchronizes it with the frontend:

```typescript
// services/dialogue-agent/src/agent/orb-state-manager.ts
import { EventEmitter } from 'events';

export interface OrbState {
  visualState: string;
  emotionalTone: string;
  energyLevel: number;
  effects?: Array<OrbEffect>;
  isSpeaking?: boolean;
  position?: [number, number, number];
}

export interface OrbEffect {
  id: string;
  type: string;
  color: string;
  duration: number;
  startTime: number;
  [key: string]: any;
}

export class OrbStateManager extends EventEmitter {
  private currentState: OrbState;
  
  constructor() {
    super();
    
    // Initialize default state
    this.currentState = {
      visualState: 'default',
      emotionalTone: 'neutral',
      energyLevel: 0.5,
      effects: [],
      isSpeaking: false,
      position: [0, 2, 0]
    };
  }
  
  /**
   * Get current Orb state
   */
  public getCurrentState(): OrbState {
    return { ...this.currentState };
  }
  
  /**
   * Update Orb state
   */
  public updateState(newState: Partial<OrbState>): void {
    // Merge existing state with new state
    this.currentState = {
      ...this.currentState,
      ...newState,
      // If new effects, append them rather than replace
      effects: newState.effects 
        ? [...(this.currentState.effects || []), ...newState.effects]
        : this.currentState.effects
    };
    
    // Clean up expired effects
    this.cleanupExpiredEffects();
    
    // Emit state change event
    this.emit('stateChanged', this.getCurrentState());
  }
  
  /**
   * Remove a specific effect
   */
  public removeEffect(effectId: string): void {
    if (!this.currentState.effects) return;
    
    this.currentState.effects = this.currentState.effects.filter(
      effect => effect.id !== effectId
    );
    
    this.emit('stateChanged', this.getCurrentState());
  }
  
  /**
   * Clean up expired effects
   */
  private cleanupExpiredEffects(): void {
    if (!this.currentState.effects) return;
    
    const currentTime = Date.now();
    
    this.currentState.effects = this.currentState.effects.filter(effect => {
      const endTime = effect.startTime + (effect.duration * 1000);
      return currentTime < endTime;
    });
  }
  
  /**
   * Create a "speaking" animation state
   */
  public startSpeaking(): void {
    this.updateState({
      isSpeaking: true,
      visualState: 'speaking'
    });
  }
  
  /**
   * End the "speaking" animation state
   */
  public stopSpeaking(): void {
    this.updateState({
      isSpeaking: false,
      visualState: this.currentState.visualState === 'speaking' 
        ? 'default' 
        : this.currentState.visualState
    });
  }
  
  /**
   * Create a transition effect between visual states
   */
  public transitionTo(targetState: string, duration: number = 1.0): void {
    const transitionEffect: OrbEffect = {
      id: `transition-${Date.now()}`,
      type: 'transition',
      from: this.currentState.visualState,
      to: targetState,
      duration,
      startTime: Date.now(),
      color: this.getColorForState(targetState)
    };
    
    this.updateState({
      effects: [transitionEffect]
    });
    
    // Schedule the state change after transition
    setTimeout(() => {
      this.updateState({
        visualState: targetState
      });
      this.removeEffect(transitionEffect.id);
    }, duration * 1000);
  }
  
  /**
   * Get appropriate color for a visual state
   */
  private getColorForState(state: string): string {
    const stateColors: Record<string, string> = {
      'default': '#8ECAE6',
      'listening': '#7B6FF0',
      'thinking': '#5E60CE',
      'speaking': '#8ECAE6',
      'analyzing': '#5E60CE',
      'insight': '#F6BD60',
      'celebrating': '#F72585',
      'dormant': '#588157',
      'focusing': '#64DFDF',
      'transitioning': '#BC6C25'
    };
    
    return stateColors[state] || '#8ECAE6';
  }
}
```

### 6.4 Data Persistence Implementation

The data layer implementation uses a polyglot persistence approach with specialized databases for different aspects of the system.

#### 6.4.1 Database Integration Layer

The database integration layer provides unified access to the different databases:

```typescript
// packages/database/src/index.ts
import { PrismaClient } from '@prisma/client';
import { Neo4jClient } from './neo4j';
import { WeaviateClient } from './weaviate';
import { RedisClient } from './redis';
import { Logger } from '@2dots1line/utils';

export class DatabaseService {
  private prisma: PrismaClient;
  private neo4j: Neo4jClient;
  private weaviate: WeaviateClient;
  private redis: RedisClient;
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('DatabaseService');
    
    // Initialize PostgreSQL client
    this.prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
      ]
    });
    
    // Initialize Neo4j client
    this.neo4j = new Neo4jClient({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password'
    });
    
    // Initialize Weaviate client
    this.weaviate = new WeaviateClient({
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
      scheme: process.env.WEAVIATE_SCHEME || 'http'
    });
    
    // Initialize Redis client
    this.redis = new RedisClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
    
    // Set up error logging
    this.prisma.$on('error', (e) => {
      this.logger.error('Prisma Client error', e);
    });
    
    this.prisma.$on('warn', (e) => {
      this.logger.warn('Prisma Client warning', e);
    });
  }
  
  /**
   * Get PostgreSQL client
   */
  public getPrisma(): PrismaClient {
    return this.prisma;
  }
  
  /**
   * Get Neo4j client
   */
  public getNeo4j(): Neo4jClient {
    return this.neo4j;
  }
  
  /**
   * Get Weaviate client
   */
  public getWeaviate(): WeaviateClient {
    return this.weaviate;
  }
  
  /**
   * Get Redis client
   */
  public getRedis(): RedisClient {
    return this.redis;
  }
  
  /**
   * Begin a transaction that spans multiple databases
   */
  public async withTransaction<T>(
    callback: (tx: {
      prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
      neo4j: Neo4jClient,
      weaviate: WeaviateClient,
      redis: RedisClient
    }) => Promise<T>
  ): Promise<T> {
    // Start PostgreSQL transaction
    return this.prisma.$transaction(async (prismaTransaction) => {
      try {
        // Execute the callback with transaction clients
        const result = await callback({
          prisma: prismaTransaction,
          neo4j: this.neo4j,
          weaviate: this.weaviate,
          redis: this.redis
        });
        
        return result;
      } catch (error) {
        // Transaction will be rolled back automatically
        this.logger.error('Transaction failed', error);
        throw error;
      }
    }, {
      timeout: 10000 // 10 seconds timeout
    });
  }
  
  /**
   * Close all database connections
   */
  public async disconnect(): Promise<void> {
    await Promise.all([
      this.prisma.$disconnect(),
      this.neo4j.close(),
      this.redis.quit()
    ]);
  }
}
```

#### 6.4.2 Growth Model Data Repository

The Growth Model Repository provides access to the Six-Dimensional Growth Model data:

```typescript
// services/card-service/src/repositories/growth-model.repository.ts
import { DatabaseService } from '@2dots1line/database';
import { Logger } from '@2dots1line/utils';

export class GrowthModelRepository {
  private db: DatabaseService;
  private logger: Logger;
  
  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('GrowthModelRepository');
  }
  
  /**
   * Get all growth dimensions
   */
  public async getGrowthDimensions(): Promise<any[]> {
    try {
      return await this.db.getPrisma().growthDimensions.findMany({
        orderBy: { sequence_order: 'asc' }
      });
    } catch (error) {
      this.logger.error('Error fetching growth dimensions', error);
      throw error;
    }
  }
  
  /**
   * Get growth progress for an entity
   */
  public async getEntityGrowthProgress(
    userId: string,
    entityId: string,
    entityType: string
  ): Promise<any[]> {
    try {
      return await this.db.getPrisma().entityGrowthProgress.findMany({
        where: {
          user_id: userId,
          entity_id: entityId,
          entity_type: entityType
        },
        include: {
          growthDimension: true
        }
      });
    } catch (error) {
      this.logger.error('Error fetching entity growth progress', error);
      throw error;
    }
  }
  
  /**
   * Update growth progress for an entity dimension
   */
  public async updateGrowthProgress(
    userId: string,
    entityId: string,
    entityType: string,
    dimensionId: string,
    updates: {
      status?: string,
      progress_value?: number,
      evidence_annotation_id?: string,
      next_step_suggestion?: string
    }
  ): Promise<any> {
    try {
      return await this.db.getPrisma().entityGrowthProgress.upsert({
        where: {
          user_id_entity_id_dimension_id: {
            user_id: userId,
            entity_id: entityId,
            dimension_id: dimensionId
          }
        },
        update: {
          status: updates.status,
          progress_value: updates.progress_value,
          evidence_annotation_id: updates.evidence_annotation_id,
          next_step_suggestion: updates.next_step_suggestion,
          last_updated_ts: new Date()
        },
        create: {
          user_id: userId,
          entity_id: entityId,
          entity_type: entityType,
          dimension_id: dimensionId,
          status: updates.status || 'unactivated',
          progress_value: updates.progress_value || 0,
          evidence_annotation_id: updates.evidence_annotation_id,
          next_step_suggestion: updates.next_step_suggestion
        }
      });
    } catch (error) {
      this.logger.error('Error updating growth progress', error);
      throw error;
    }
  }
  
  /**
   * Get a user's overall growth summary
   */
  public async getUserGrowthSummary(userId: string): Promise<any> {
    try {
      const result = await this.db.getPrisma().$queryRaw`
        SELECT 
          u.user_id,
          gd.dimension_key,
          COUNT(CASE WHEN egp.status = 'activated' OR egp.status = 'mastered' THEN 1 END) AS activated_count,
          COUNT(CASE WHEN egp.status = 'in_progress' THEN 1 END) AS in_progress_count,
          COUNT(egp.entity_id) AS total_entities
        FROM "users" u
        /* Growth dimensions now defined in configuration */
        LEFT JOIN mv_entity_growth eg 
          ON u.user_id = eg.user_id
        WHERE u.user_id = ${userId}
        GROUP BY u.user_id, eg.dim_key
      `;
      
      // Transform into more usable structure
      const summary: Record<string, any> = {};
      for (const row of result as any[]) {
        summary[row.dimension_key] = {
          activatedCount: parseInt(row.activated_count),
          inProgressCount: parseInt(row.in_progress_count),
          totalEntities: parseInt(row.total_entities),
          completionPercentage: row.total_entities > 0 
            ? (parseInt(row.activated_count) / parseInt(row.total_entities)) * 100 
            : 0
        };
      }
      
      return summary;
    } catch (error) {
      this.logger.error('Error fetching user growth summary', error);
      throw error;
    }
  }
  
  /**
   * Update card evolution state
   */
  public async updateCardEvolutionState(
    userId: string,
    entityId: string,
    entityType: string,
    evolutionState: string,
    stats: {
      dimensions_activated: number,
      connection_count: number,
      interaction_count: number
    }
  ): Promise<any> {
    try {
      return await this.db.getPrisma().cardEvolutionStates.upsert({
        where: {
          user_id_entity_id: {
            user_id: userId,
            entity_id: entityId
          }
        },
        update: {
          evolution_state: evolutionState,
          dimensions_activated: stats.dimensions_activated,
          connection_count: stats.connection_count,
          interaction_count: stats.interaction_count,
          attained_date: new Date()
        },
        create: {
          user_id: userId,
          entity_id: entityId,
          entity_type: entityType,
          evolution_state: evolutionState,
          dimensions_activated: stats.dimensions_activated,
          connection_count: stats.connection_count,
          interaction_count: stats.interaction_count
        }
      });
    } catch (error) {
      this.logger.error('Error updating card evolution state', error);
      throw error;
    }
  }
}
```

### 6.5 Card Service Implementation

The Card Service manages the card gallery data and Six-Dimensional Growth Model:

#### 6.5.1 Card Data Models

```typescript
// services/card-service/src/models/card.model.ts
export interface Card {
  id: string;
  type: 'concept' | 'memory' | 'artifact';
  title: string;
  description?: string;
  preview?: string;
  mediaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  growthDimensions: GrowthDimension[];
  evolutionState: CardEvolutionState;
  connectionCount: number;
  lastInteractionAt?: Date;
  metadata: Record<string, any>;
}

export interface GrowthDimension {
  key: string;
  name: string;
  side: 'self' | 'world';
  actionType: 'know' | 'act' | 'show';
  status: 'unactivated' | 'in_progress' | 'activated' | 'mastered';
  progress: number;
  nextStepSuggestion?: string;
}

export type CardEvolutionState = 'seed' | 'sprout' | 'bloom' | 'constellation' | 'supernova';
```

#### 6.5.2 Card Service Implementation

```typescript
// services/card-service/src/services/card.service.ts
import { DatabaseService } from '@2dots1line/database';
import { GrowthModelRepository } from '../repositories/growth-model.repository';
import { CardRepository } from '../repositories/card.repository';
import { Card, GrowthDimension, CardEvolutionState } from '../models/card.model';
import { InsightEngineClient } from '../clients/insight-engine-client';
import { Logger } from '@2dots1line/utils';

export class CardService {
  private db: DatabaseService;
  private growthRepo: GrowthModelRepository;
  private cardRepo: CardRepository;
  private insightClient: InsightEngineClient;
  private logger: Logger;
  
  constructor() {
    this.db = new DatabaseService();
    this.growthRepo = new GrowthModelRepository();
    this.cardRepo = new CardRepository();
    this.insightClient = new InsightEngineClient();
    this.logger = new Logger('CardService');
  }
  
  /**
   * Get cards for a user with filters
   */
  public async getCards(
    userId: string,
    filters: {
      type?: string;
      timeRange?: string;
      growthDimension?: string;
      searchQuery?: string;
      status?: string;
      limit?: number;
      cursor?: string;
    }
  ): Promise<{ cards: Card[]; nextCursor?: string }> {
    try {
      // Get basic card data
      const { items, nextCursor } = await this.cardRepo.getCards(userId, filters);
      
      // Enhance with growth dimension data
      const enhancedCards = await Promise.all(
        items.map(async (item) => {
          const growthDimensions = await this.getCardGrowthDimensions(
            userId,
            item.id,
            item.type
          );
          
          const evolutionState = await this.getCardEvolutionState(
            userId,
            item.id
          );
          
          return {
            ...item,
            growthDimensions,
            evolutionState: evolutionState.state || 'seed',
            connectionCount: evolutionState.connectionCount || 0
          };
        })
      );
      
      return {
        cards: enhancedCards,
        nextCursor
      };
    } catch (error) {
      this.logger.error('Error fetching cards', error);
      throw error;
    }
  }
  
  /**
   * Get a single card's details
   */
  public async getCardDetails(userId: string, cardId: string, cardType: string): Promise<Card> {
    try {
      // Get basic card data
      const cardData = await this.cardRepo.getCardById(userId, cardId, cardType);
      
      if (!cardData) {
        throw new Error(`Card not found: ${cardId}`);
      }
      
      // Get growth dimensions
      const growthDimensions = await this.getCardGrowthDimensions(
        userId,
        cardId,
        cardType
      );
      
      // Get evolution state
      const evolutionState = await this.getCardEvolutionState(userId, cardId);
      
      // Get connections for this card
      const connections = await this.cardRepo.getCardConnections(userId, cardId, cardType);
      
      return {
        ...cardData,
        growthDimensions,
        evolutionState: evolutionState.state || 'seed',
        connectionCount: connections.length,
        connections: connections
      };
    } catch (error) {
      this.logger.error('Error fetching card details', error);
      throw error;
    }
  }
  
  /**
   * Get growth dimensions for a card
   */
  private async getCardGrowthDimensions(
    userId: string,
    entityId: string,
    entityType: string
  ): Promise<GrowthDimension[]> {
    // Get all growth dimensions
    const dimensions = await this.growthRepo.getGrowthDimensions();
    
    // Get entity's progress for these dimensions
    const progress = await this.growthRepo.getEntityGrowthProgress(
      userId,
      entityId,
      entityType
    );
    
    // Map dimensions with progress
    return dimensions.map(dimension => {
      const dimensionProgress = progress.find(
        p => p.dimension_id === dimension.dimension_id
      );
      
      return {
        key: dimension.dimension_key,
        name: dimension.name,
        side: dimension.side,
        actionType: dimension.action_type,
        status: dimensionProgress?.status || 'unactivated',
        progress: dimensionProgress?.progress_value || 0,
        nextStepSuggestion: dimensionProgress?.next_step_suggestion
      };
    });
  }
  
  /**
   * Get a card's evolution state
   */
  private async getCardEvolutionState(
    userId: string,
    entityId: string
  ): Promise<{ state: CardEvolutionState; connectionCount: number }> {
    try {
      const state = await this.db.getPrisma().cardEvolutionStates.findUnique({
        where: {
          user_id_entity_id: {
            user_id: userId,
            entity_id: entityId
          }
        }
      });
      
      if (!state) {
        return { state: 'seed', connectionCount: 0 };
      }
      
      return {
        state: state.evolution_state as CardEvolutionState,
        connectionCount: state.connection_count
      };
    } catch (error) {
      this.logger.error('Error fetching card evolution state', error);
      return { state: 'seed', connectionCount: 0 };
    }
  }
  
  /**
   * Complete a growth dimension challenge
   */
  public async completeGrowthChallenge(
    userId: string,
    cardId: string,
    dimensionKey: string,
    evidence: string
  ): Promise<Card> {
    try {
      // Start transaction
      return await this.db.withTransaction(async ({ prisma }) => {
        // Get the dimension
        const dimension = await prisma.growthDimensions.findUnique({
          where: { dimension_key: dimensionKey }
        });
        
        if (!dimension) {
          throw new Error(`Dimension not found: ${dimensionKey}`);
        }
        
        // Get card details to know its type
        const card = await this.cardRepo.getCardById(userId, cardId, null);
        
        if (!card) {
          throw new Error(`Card not found: ${cardId}`);
        }
        
        // Create an annotation for the evidence
        const annotation = await prisma.annotations.create({
          data: {
            aid: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            target_id: cardId,
            target_node_type: card.type === 'concept' ? 'Concept' : 
                              card.type === 'memory' ? 'MemoryUnit' : 'DerivedArtifact',
            annotation_type: `${dimension.action_type}_${dimension.side}_evidence`,
            text_content: evidence,
            source: 'user',
            creation_ts: new Date(),
            metadata: {
              dimensionKey: dimensionKey
            }
          }
        });
        
        // Update growth progress
        await this.growthRepo.updateGrowthProgress(
          userId,
          cardId,
          card.type,
          dimension.dimension_id,
          {
            status: 'activated',
            progress_value: 1.0,
            evidence_annotation_id: annotation.aid
          }
        );
        
        // Get updated growth dimensions
        const updatedDimensions = await this.getCardGrowthDimensions(
          userId,
          cardId,
          card.type
        );
        
        // Count activated dimensions
        const activatedCount = updatedDimensions.filter(
          d => d.status === 'activated' || d.status === 'mastered'
        ).length;
        
        // Update card evolution state based on activated dimensions
        let evolutionState: CardEvolutionState = 'seed';
        
        if (activatedCount >= 6) {
          evolutionState = 'supernova';
        } else if (activatedCount >= 4) {
          evolutionState = 'constellation';
        } else if (activatedCount >= 2) {
          evolutionState = 'bloom';
        } else if (activatedCount >= 1) {
          evolutionState = 'sprout';
        }
        
        // Get connection count
        const connections = await this.cardRepo.getCardConnections(userId, cardId, card.type);
        
        // Update evolution state
        await this.growthRepo.updateCardEvolutionState(
          userId,
          cardId,
          card.type,
          evolutionState,
          {
            dimensions_activated: activatedCount,
            connection_count: connections.length,
            interaction_count: (await this.getInteractionCount(userId, cardId)) + 1
          }
        );
        
        // When dimensions get activated, request new insights
        if (evolutionState === 'constellation' || evolutionState === 'supernova') {
          // Asynchronously request insights
          this.insightClient.requestInsightsForEntity(userId, cardId, card.type)
            .catch(error => this.logger.error('Error requesting insights', error));
        }
        
        // Return updated card
        return this.getCardDetails(userId, cardId, card.type);
      });
    } catch (error) {
      this.logger.error('Error completing growth challenge', error);
      throw error;
    }
  }
  
  /**
   * Get interaction count for a card
   */
  private async getInteractionCount(userId: string, cardId: string): Promise<number> {
    try {
      const count = await this.db.getPrisma().userActivityLog.count({
        where: {
          user_id: userId,
          details: {
            path: ['cardId'],
            equals: cardId
          }
        }
      });
      
      return count;
    } catch (error) {
      this.logger.error('Error getting interaction count', error);
      return 0;
    }
  }
  
  /**
   * Create a connection between two cards
   */
  public async createConnection(
    userId: string,
    sourceCardId: string,
    targetCardId: string,
    relationshipType: string,
    description: string
  ): Promise<any> {
    try {
      // Get card types
      const sourceCard = await this.cardRepo.getCardById(userId, sourceCardId, null);
      const targetCard = await this.cardRepo.getCardById(userId, targetCardId, null);
      
      if (!sourceCard || !targetCard) {
        throw new Error('Source or target card not found');
      }
      
      // Map card types to Neo4j node types
      const sourceNodeType = this.mapCardTypeToNodeType(sourceCard.type);
      const targetNodeType = this.mapCardTypeToNodeType(targetCard.type);
      
      // Create the relationship in Neo4j
      await this.db.getNeo4j().run(
        `
        MATCH (source:${sourceNodeType} {id: $sourceId, userId: $userId})
        MATCH (target:${targetNodeType} {id: $targetId, userId: $userId})
        MERGE (source)-[r:RELATED_TO {
          relationship_label: $relationshipType,
          weight: 1.0,
          source: 'user_stated',
          creation_ts: datetime(),
          description: $description
        }]->(target)
        RETURN r
        `,
        {
          sourceId: sourceCardId,
          targetId: targetCardId,
          userId: userId,
          relationshipType: relationshipType,
          description: description
        }
      );
      
      // Update evolution states for both cards
      await this.updateCardConnectionCount(userId, sourceCardId, sourceCard.type);
      await this.updateCardConnectionCount(userId, targetCardId, targetCard.type);
      
      // Request new insights based on this connection
      this.insightClient.requestInsightsForConnection(
        userId, 
        sourceCardId, 
        targetCardId,
        relationshipType
      ).catch(error => this.logger.error('Error requesting insights', error));
      
      return {
        success: true,
        sourceCardId,
        targetCardId,
        relationshipType
      };
    } catch (error) {
      this.logger.error('Error creating connection', error);
      throw error;
    }
  }
  
  /**
   * Update a card's connection count
   */
  private async updateCardConnectionCount(
    userId: string, 
    cardId: string, 
    cardType: string
  ): Promise<void> {
    // Get connections for this card
    const connections = await this.cardRepo.getCardConnections(userId, cardId, cardType);
    
    // Get current evolution state
    const currentState = await this.getCardEvolutionState(userId, cardId);
    
    // Get growth dimensions
    const dimensions = await this.getCardGrowthDimensions(userId, cardId, cardType);
    const activatedCount = dimensions.filter(
      d => d.status === 'activated' || d.status === 'mastered'
    ).length;
    
    // Determine evolution state based on connections and activated dimensions
    let evolutionState: CardEvolutionState = 'seed';
    
    if (activatedCount >= 6) {
      evolutionState = 'supernova';
    } else if (activatedCount >= 4 || connections.length >= 5) {
      evolutionState = 'constellation';
    } else if (activatedCount >= 2 || connections.length >= 3) {
      evolutionState = 'bloom';
    } else if (activatedCount >= 1 || connections.length >= 1) {
      evolutionState = 'sprout';
    }
    
    // Update evolution state
    await this.growthRepo.updateCardEvolutionState(
      userId,
      cardId,
      cardType,
      evolutionState,
      {
        dimensions_activated: activatedCount,
        connection_count: connections.length,
        interaction_count: await this.getInteractionCount(userId, cardId)
      }
    );
  }
  
  /**
   * Map card type to Neo4j node type
   */
  private mapCardTypeToNodeType(cardType: string): string {
    switch (cardType) {
      case 'concept':
        return 'Concept';
      case 'memory':
        return 'MemoryUnit';
      case 'artifact':
        return 'DerivedArtifact';
      default:
        throw new Error(`Unknown card type: ${cardType}`);
    }
  }
}
```

#### 6.5.3 Card API Controller

```typescript
// services/card-service/src/controllers/card.controller.ts
import { Request, Response } from 'express';
import { CardService } from '../services/card.service';
import { Logger } from '@2dots1line/utils';

export class CardController {
  private cardService: CardService;
  private logger: Logger;
  
  constructor() {
    this.cardService = new CardService();
    this.logger = new Logger('CardController');
  }
  
  /**
   * Get cards for a user
   */
  public getCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const filters = req.query as any;
      
      const result = await this.cardService.getCards(userId, filters);
      
      res.json(result);
    } catch (error) {
      this.logger.error('Error in getCards', error);
      res.status(500).json({ error: 'Failed to fetch cards' });
    }
  };
  
  /**
   * Get a single card's details
   */
  public getCardDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { cardId } = req.params;
      const { type } = req.query;
      
      const card = await this.cardService.getCardDetails(userId, cardId, type as string);
      
      if (!card) {
        res.status(404).json({ error: 'Card not found' });
        return;
      }
      
      res.json(card);
    } catch (error) {
      this.logger.error('Error in getCardDetails', error);
      res.status(500).json({ error: 'Failed to fetch card details' });
    }
  };
  
  /**
   * Complete a growth dimension challenge
   */
  public completeGrowthChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { cardId, dimensionKey } = req.params;
      const { evidence } = req.body;
      
      if (!evidence) {
        res.status(400).json({ error: 'Evidence is required' });
        return;
      }
      
      const updatedCard = await this.cardService.completeGrowthChallenge(
        userId,
        cardId,
        dimensionKey,
        evidence
      );
      
      res.json(updatedCard);
    } catch (error) {
      this.logger.error('Error in completeGrowthChallenge', error);
      res.status(500).json({ error: 'Failed to complete growth challenge' });
    }
  };
  
  /**
   * Create a connection between two cards
   */
  public createConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { sourceCardId, targetCardId, relationshipType, description } = req.body;
      
      if (!sourceCardId || !targetCardId || !relationshipType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      const result = await this.cardService.createConnection(
        userId,
        sourceCardId,
        targetCardId,
        relationshipType,
        description || ''
      );
      
      res.json(result);
    } catch (error) {
      this.logger.error('Error in createConnection', error);
      res.status(500).json({ error: 'Failed to create connection' });
    }
  };
}

export const cardController = new CardController();
```

## 7. Data Flow & Processing

This section details the end-to-end data flow through the system, following an event-driven architecture that aligns with the design principles of configuration over schema and clean separation of concerns.

### 7.1 Memory Ingestion Workflow

The memory ingestion pipeline is designed to be asynchronous and tiered, following the principle of "store quickly, enrich gradually" for optimal user experience.

#### 7.1.1 Capture & Storage (Frontend → Backend)

1. **User creates content** via journal entry, voice note, photo upload, etc.
   - Frontend immediately displays a "pending" card in the UI
   - Raw content is sent to backend via API endpoints

2. **Initial storage**
   - Creates a `memory_units` record with `processing_status='raw'`
   - Saves metadata: `source_type`, timestamps, user-provided title/tags
   - For non-text content (images, audio), stores S3/cloud storage reference
   - Returns `muid` to frontend for updating the local UI state
   - Enqueues processing job in Redis queue with appropriate priority

#### 7.1.2 Processing & Knowledge Extraction

1. **Content preprocessing**
   - For voice: Transcribes audio using Speech-to-Text services
   - For images: Performs captioning and optional OCR
   - For text: Proceeds directly to the next step

2. **Chunking & Embedding**
   - Splits content if needed (e.g., >512 tokens) into semantic chunks
   - Generates embeddings for each chunk via embedding API
   - Stores vectors in Weaviate with references in `entity_vectors` table
   - Updates `processing_status='chunked'` and then `'embedded'`

3. **Concept Extraction**
   - Identifies entities, themes, and concepts using NER and LLM analysis
   - Creates or updates `Concept` records as needed
   - Creates Neo4j relationships: `(MemoryUnit)-[:HIGHLIGHTS]->(Concept)`
   - Creates growth events for any relevant dimensions activated
   - Updates `processing_status='structured'`

#### 7.1.3 Finalization & Integration

1. **Notify frontend** of completed processing
   - WebSocket event or poll-based notification
   - Updates card UI with final state (no longer "processing")
   - May trigger Orb acknowledgment: "I've captured that memory"

2. **Graph integration**
   - New memory appears in GraphScene as a star 
   - Positioned near related concepts initially
   - Creates appropriate visual connections to linked concepts

3. **Growth dimension tracking**
   - Ingestion Analyst identifies which growth dimensions the content activates
   - For each dimension activated, creates a `growth_events` record
   - Refreshes materialized view `mv_entity_growth`
   - Updates user's growth profile JSON as needed

This pipeline implements a clean event-driven architecture where:
- Raw data is preserved for auditability and reprocessing
- Processing status is tracked explicitly for resilience
- Vector IDs are stored in a dedicated junction table
- Growth dimensions are updated through append-only events
- The knowledge graph (Neo4j) and vector database (Weaviate) are kept in sync

### 7.2 Conversational Dialogue & Retrieval

The dialogue system combines hybrid retrieval (vector + graph) with a consistent Orb persona to create meaningful interactions.

#### 7.2.1 User Query Processing

1. **Query reception** via chat interface or voice input
   - Raw query stored in `conversation_messages`
   - Context (current scene, focused concept, etc.) included

2. **Retrieval planning**
   - Dialogue Agent analyzes query intent and emotional tone
   - Formulates hybrid retrieval strategy combining:
     - Neo4j graph queries for concept-based retrieval
     - Weaviate vector search for semantic similarity
     - Filters based on recency, importance, or other criteria

3. **Knowledge assembly**
   - Combines retrieved memories, concepts, and insights
   - Formats context for LLM prompt with appropriate structure

#### 7.2.2 Response Generation

1. **LLM orchestration**
   - Constructs prompt with system instructions, context, and query
   - Calls Gemini API with appropriate parameters
   - Streams response to frontend for real-time display

2. **UI state management**
   - Response includes UI directives as structured metadata
   - Orb state (visual appearance, animation) driven by emotional tone
   - Optional scene transitions or UI highlights based on context

This dialogue flow ensures:
- User data privacy by passing context explicitly
- Consistent Orb persona through careful prompt engineering
- Real-time feedback through streaming and state updates
- Multi-modal input/output with voice and text

### 7.3 Insight Generation & Background Processing

The Insight Engine operates asynchronously to derive meaning from the knowledge graph.

#### 7.3.1 Pattern Discovery

1. **Scheduled analysis** runs during quiet periods
   - Community detection to identify concept clusters
   - Frequency and sentiment analysis for temporal trends
   - Connection analysis for emerging structures

2. **Insight creation**
   - Creates `DerivedArtifact` records for significant insights
   - Generates growth events for any dimension progress
   - Creates challenges based on observed patterns

#### 7.3.2 Integration

1. **Knowledge graph augmentation**
   - Adds new relationships to Neo4j
   - Updates community assignments
   - Refreshes materialized views

2. **User notification**
   - Updates Dashboard with new insights
   - Prepares Orb to introduce insights in next conversation
   - Optionally sends push notifications for significant discoveries

This approach aligns with the design principle of keeping the data layer lean while performing heavy computations in dedicated analytic processes.

## 8. Cognitive Agent Layer

The Cognitive Agent Layer implements the intelligence of the system through specialized agents that work with the event-sourced data architecture.

### 8.1 Dialogue Agent (Orb)

The Dialogue Agent serves as the primary conversational interface and is visually represented by the Orb.

#### 8.1.1 Key Responsibilities

- Orchestrates conversations with the user through the chat interface
- Constructs prompts for the LLM with appropriate context and history
- Manages Orb's visual/behavioral state through UI directives
- Interfaces with other agents to retrieve information and process user inputs

#### 8.1.2 Event Integration

- Consumes real-time events from Redis for UI state changes
- Publishes conversation events to the event stream
- Reacts to notifications from the Insight Engine
- Updates the user's growth profile through the growth_events stream when appropriate

### 8.2 Ingestion Analyst

The Ingestion Analyst processes raw user inputs into structured knowledge and maintains the event-driven growth model.

#### 8.2.1 Key Responsibilities

- Implements tiered analysis based on content significance
- Extracts entities, relationships, and updates the knowledge graph
- Identifies growth dimension activations in user content
- Creates growth events for the Six-Dimensional Growth Model

#### 6.2.2 Event Integration

- Writes to the append-only growth_events table rather than updating static tables
- Triggers materialized view refreshes when significant events occur
- Works with configuration-driven dimension definitions from Redis
- Publishes ingestion completion events for frontend notification

### 8.3 Retrieval Planner

The Retrieval Planner implements hybrid search strategies combining vector, graph, and relational queries.

#### 8.3.1 Key Responsibilities

- Plans optimal retrieval strategies based on query context
- Combines results from multiple data sources (Weaviate, Neo4j, Postgres)
- Reranks and scores results for relevance
- Formats context for the Dialogue Agent's LLM prompt

#### 8.3.2 Event Integration

- Queries materialized views for efficient data access
- Uses computed card evolution states from views rather than static tables
- Consumes configuration from Redis for retrieval strategies
- Adapts to real-time graph updates from ingestion events

### 8.4 Insight Engine

The Insight Engine works asynchronously to derive meaning from the knowledge graph using the event-sourced data.

#### 8.4.1 Key Responsibilities

- Discovers patterns, connections, and hypotheses in the knowledge graph
- Generates "Orb's Dream Cards" and suggests constellation completions
- Creates challenges and quests for the gamification system
- Identifies temporal patterns and sentiment shifts

#### 8.4.2 Event Integration

- Processes the growth_events stream to identify patterns over time
- Creates derived artifacts based on event analysis
- Triggers new growth events when insights lead to dimension activation
- Uses configuration-based rules rather than hard-coded criteria
- Publishes insight events to Redis for Orb to present to the user

### 8.5 Ontology Steward

The Ontology Steward manages controlled vocabularies and ensures consistency across the system.

#### 8.5.1 Key Responsibilities

- Manages and evolves the controlled vocabularies
- Ensures concept type consistency
- Maps visual properties to entity types
- Guides classification of user content

#### 8.5.2 Event Integration

- Maintains configuration in Redis rather than database tables
- Updates dimension definitions without requiring schema changes
- Publishes ontology updates as events for system-wide consistency
- Monitors entity creation events to enforce ontological rules

### 8.6 Agent Coordination

The agents communicate through an event-driven architecture:

1. **Message Queues:** Redis-based queues for asynchronous processing
2. **Event Streams:** Append-only event logs for tracking state changes
3. **Pub/Sub Channels:** Real-time notifications between agents
4. **Shared Configuration:** Redis-stored configuration for consistent behavior

This coordination ensures the system maintains the principles of:
- **Clean separation of concerns:** Each agent has well-defined responsibilities
- **Configuration over schema:** Behavior can be changed without migrations
- **Event sourcing for history:** All actions are tracked in append-only logs
- **Dynamic computation:** Derived data is computed from events, not stored statically

## 9. Design Principles Implementation

This section highlights how the key design principles outlined in the feedback have been systematically implemented throughout the V7 architecture.

### 9.1 Configuration Over Schema

The V7 system prioritizes configuration-based approaches over rigid database schema:

1. **Growth Dimensions as Configuration:**
   - Dimension definitions stored in Redis or configuration files
   - Parameters like scoring weights, display properties, and thresholds are configurable
   - Enables A/B testing without schema migrations

2. **Card Evolution Rules:**
   - Evolution state logic defined in configuration
   - Thresholds for state transitions (e.g., "5 connections = constellation") are adjustable
   - Visual representation mapping maintained in config rather than hardcoded

3. **Ontology Categories:**
   - Concept types and relationship types defined in configuration
   - New categories can be added without database schema changes
   - Visual mappings (colors, icons, effects) stored as configuration

### 9.2 Event-Sourcing for Growth & Analytics

The event-sourcing pattern provides historical tracking and flexible recalculation:

1. **Growth Events Stream:**
   - All dimension progress recorded as append-only events
   - Complete history preserved for analytics and debugging
   - Events include rich metadata (source, context, timestamp)

2. **Conversation History:**
   - User-Orb interactions recorded as events
   - Allows replaying conversations for training and improvement
   - Supports temporal analysis of user engagement

3. **Challenge Completion:**
   - Challenge progress tracked as events rather than state updates
   - Enables flexible reward calculation based on event history
   - Facilitates retroactive rewards for rule changes

### 9.3 Dynamic Computation Over Static Storage

Derived data is computed as needed rather than maintained in static tables:

1. **Materialized Views:**
   - `mv_entity_growth` provides efficient access to current growth state
   - Views refreshed on schedule or after significant updates
   - Queries use views rather than scanning event history each time

2. **Card Evolution State:**
   - Evolution states computed dynamically from current data
   - `v_card_state` view derives state from connections and dimensions
   - No separate table to maintain or update

3. **User Growth Profile:**
   - Aggregate dimension scores computed from events
   - Stored as JSONB in user record for efficient access
   - Updated through materialized view refresh

### 7.4 Distributed Storage By Domain

Data is stored in the most appropriate system for its access patterns:

1. **PostgreSQL:**
   - Core entities and event streams
   - Transactional data requiring ACID properties
   - Materialized views for derived data

2. **Neo4j:**
   - Graph relationships and traversal patterns
   - Community detection and clustering
   - Path-based queries for visualization

3. **Weaviate:**
   - Semantic embeddings for text and images
   - Similarity search and hybrid retrieval
   - Multimodal vector operations

4. **Redis:**
   - Configuration and ephemeral state
   - Real-time communication between components
   - Cache for frequently accessed data

### 7.5 Lean Data Layer

The core schema focuses on raw data while analytics happen in dedicated layers:

1. **Raw Storage First:**
   - Primary tables store only essential raw data
   - Content quickly stored then asynchronously processed
   - Minimal dependencies between core tables

2. **Tiered Processing:**
   - Light processing during initial capture
   - Deeper analysis through background jobs
   - Prioritization based on content significance

3. **Separated Concerns:**
   - Clean interfaces between storage systems
   - Well-defined contracts for data exchange
   - Agents interact through event streams and queues

These design principles create a system that is flexible, maintainable, and able to evolve without costly migrations. The event-sourcing approach preserves historical data for analytics, while computation-based derived data ensures consistency without redundant state management. The distributed storage strategy leverages the strengths of each database system while maintaining a coherent data model through configuration and events.
