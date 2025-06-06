

# 2dots1line V7 - AI Agent Implementation Roadmap

## **Overall Product Vision:** To create 2dots1line V7, a personal knowledge graph and growth platform that transforms user inputs into a rich, interconnected model, presented through an immersive, emotionally resonant UI featuring a 3D Canvas, 2D Modals, and a responsive 3D Orb assistant. The system will support users in understanding themselves and the world, taking meaningful action, and articulating their evolving narrative.

## **Key for AI Agent Prompts:**
*   `@V7UltimateSpec`: Refers to the comprehensive V7 technical specification document.
*   `@V7DataSchemaDesign.md`: Refers to the specific data schema design document.
*   `@V7UIMockups` (Assumed): Refers to visual mockups or design system details for UI elements.
*   File paths will follow the structure in `@V7UltimateSpec Section 8.1` (Monorepo Design).

**Overall Goal:** Build the 2dots1line V7 product as specified in `@V7UltimateSpec`.

## **Workstreams (Concurrent):**

*   **W1: Core Backend & Data Models:** PostgreSQL, Neo4j, Weaviate schemas, repositories, core API entities.
*   **W2: Cognitive Agents & Tools:** Implementation of the 5 core agents and their deterministic tools.
*   **W3: API Gateway & Auth:** BFF implementation, authentication, authorization logic.
*   **W4: UI Foundation & 3D Canvas Core:** Next.js app setup, shared UI components, R3F canvas setup, `canvas-core`, `shader-lib`.
*   **W5: Orb Implementation (UI & Backend Link):** 3D Orb visuals, animations, and state synchronization with Dialogue Agent.
*   **W6: Card System (UI & Backend Link):** Card Gallery UI, Card components, backend Card Service, Growth Model integration.
*   **W7: GraphScene & Knowledge Visualization (UI & Backend Link):** GraphScene UI, data fetching from Neo4j, interaction logic.
*   **W8: DevOps & Infrastructure:** Monorepo setup, CI/CD, Docker, Terraform for AWS/Tencent.

Okay, this is a great question! Assigning workstreams to a team of three humans requires balancing skill sets, managing dependencies, and ensuring clear ownership while fostering collaboration. Given the workstreams we've outlined, here's a potential way to distribute the work for 2dots1line V7, keeping in mind that some tasks will require cross-team collaboration:

## **Team Structure & Roles (Suggested Focus Areas):**

*   **Human 1: Frontend & UI/UX Lead (Flora)**
    *   **Primary Workstreams:** W4 (UI Foundation & 3D Canvas Core), W5 (Orb UI), W6 (Card System UI), W7 (GraphScene UI).
    *   **Responsibilities:** Overall user experience, visual design implementation, React/Next.js development, R3F/Three.js implementation for scenes and Orb, state management (Zustand), component library (`ui-components`), Storybook, mobile UI development. Ensures visual consistency and adherence to `v7UIUXDesign.md`.
    *   **Collaboration:** Works closely with Human 2 on API integration and data display, and with Human 3 on ensuring backend states correctly drive UI behaviors (especially for Orb and dynamic content).

*   **Human 2: Backend & AI Lead (Ben)**
    *   **Primary Workstreams:** W1 (Core Backend & Data Models - especially DB logic & repositories), W2 (Cognitive Agents & Tools), W3 (API Gateway & Auth).
    *   **Responsibilities:** Designing and implementing agent logic (Dialogue, Ingestion, Retrieval, Insight, Ontology), developing deterministic tools, LLM integration, database schema management (PostgreSQL, Neo4j, Weaviate), API endpoint development in the API Gateway, core business logic for features like the Growth Model and Challenges.
    *   **Collaboration:** Works closely with Human 1 on API contracts and data needs for the UI. Works with Human 3 on deployment configurations and ensuring services run correctly in containerized environments.

*   **Human 3: DevOps, Infrastructure & Data Engineering Lead (Devon)**
    *   **Primary Workstreams:** W8 (DevOps & Infrastructure), W1 (Core Backend & Data Models - focusing on DB setup, migrations, performance, event stream management), aspects of W2 related to tool deployment and scaling.
    *   **Responsibilities:** Monorepo setup and maintenance, CI/CD pipelines, Dockerization, Terraform for cloud infrastructure (AWS/Tencent), database administration and optimization (PostgreSQL, Neo4j, Weaviate, Redis), logging, monitoring, alerting, security hardening (infrastructure level), data pipeline management (e.g., refreshing materialized views, data archiving).
    *   **Collaboration:** Works with Human 1 and Human 2 to ensure smooth local development environments and deployment processes. Supports Human 2 with database performance and scalability for agent operations.

## **Sprint-by-Sprint Workstream Focus for Human Team:**

This assumes AI agents are handling the granular task execution as prompted, and humans are guiding, reviewing, integrating, and tackling more complex architectural or problem-solving aspects.

**Sprint 0: Project Initialization & Foundation**
*   **Flora (W4, W8):** Oversee UI-related tooling setup (Storybook if applicable early), contribute to monorepo decisions from a frontend perspective.
*   **Ben (W1, W8):** Focus on initial DB schema thoughts, contribute to monorepo decisions from a backend perspective.
*   **Devon (W8, W1):** **LEAD** on monorepo setup, CI workflow, Docker Compose for databases. Drive S0.T1, S0.T2, S0.T3. Manages initial Prisma setup (S0.T4).

**Sprint 1: Core Backend - Authentication & API Gateway MVP**
*   **Flora (W4):** Start planning shared UI components (`packages/ui-components`), initial app shell for `apps/web-app`.
*   **Ben (W3, W1):** **LEAD** on API Gateway auth logic (S1.T2), `UserRepository` (S1.T4). Oversee core entity schema definition (S1.T1).
*   **Devon (W1, W8):** **LEAD** on `DatabaseService` implementation (S1.T3), ensure DBs are correctly configured for API Gateway. Dockerize API Gateway (S1.T5).

**Sprint 2: UI Shell, Agent Stubs & Basic Neo4j/Weaviate Setup**
*   **Flora (W4, W5):** **LEAD** on Next.js web app setup, basic R3F canvas (S2.T1), `GlassmorphicPanel` & Storybook (S2.T2), Orb UI MVP & Store (S2.T6).
*   **Ben (W2):** **LEAD** on creating `BaseAgent` and all agent stubs (S2.T3).
*   **Devon (W1):** **LEAD** on Neo4j and Weaviate schema definitions and application scripts (S2.T4, S2.T5).

**Sprint 3: Ingestion Pipeline MVP & Basic Card Display**
*   **Flora (W4, W6):** **LEAD** on `Card.tsx` and `CardGallery.tsx` UI (S3.T4).
*   **Ben (W2, W3, W6):** **LEAD** on `IngestionAnalyst` text processing & `GrowthEvent` creation (S3.T1), `DialogueAgent` basic flow (S3.T7). Implement `CardService` MVP (S3.T3). Implement API endpoints for ingestion & dialogue (S3.T2, S3.T8).
*   **Devon (W1):** **LEAD** on implementing PostgreSQL views (`mv_entity_growth_progress`, `v_card_evolution_state`) (S3.T5). Ensure data consistency from ingestion.

**Sprint 4: Retrieval Pipeline MVP, GraphScene Shell & Neo4j/Weaviate Integration**
*   **Flora (W4, W7):** **LEAD** on `GraphScene.tsx` shell and basic node rendering (S4.T4). Implement HUD for scene switching.
*   **Ben (W2, W7):** **LEAD** on `IngestionAnalyst` Neo4j integration (S4.T1), `RetrievalPlanner` MVP with stubbed tools (S4.T2), integrating retrieval into `DialogueAgent` (S4.T3). Implement `GraphService` node fetching endpoint (S4.T5). Guide AI on `embed.text` and `vector.similar` tool logic.
*   **Devon (W1, W2):** Oversee actual Weaviate client integration and embedding storage (S4.T7). Support `RetrievalPlanner` in implementing real vector search (S4.T8). Ensure DBs are performing.

**Sprint 5: Growth Model Backend, Insight Engine MVP & Enhanced UI Cards**
*   **Flora (W6, W5):** **LEAD** on enhancing `Card.tsx` to display full growth/evolution data (S5.T5). Implement Orb 'celebrating' state visuals (S5.T7 UI part).
*   **Ben (W1, W2, W6):** **LEAD** on `ChallengeService` logic (S5.T9). Enhance `IngestionAnalyst` for Growth Event accuracy (S5.T3). Implement `InsightEngine` MVP (S5.T6). Enhance `CardService` with full growth/evolution data (S5.T4). Trigger Orb celebration from backend (S5.T7 backend part).
*   **Devon (W1):** **LEAD** on implementing Growth/Challenge DB tables and views (S5.T1, S5.T2). Implement Challenge Repositories (S5.T8). Monitor DB performance with new views.

**Sprint 6: Insight Display, Advanced Card Features & Chat Enhancements**
*   **Flora (W4, W6):** **LEAD** on Dashboard UI structure (S6.T4), Card flipping animation & detail view (S6.T5), Dashboard challenge UI (S6.T6), Dashboard insight display (S6.T7), Chat Interface component (`ChatInterface.tsx`) (S6.T9).
*   **Ben (W1, W2, W3, W5):** **LEAD** on `DerivedArtifactRepository` (S6.T1), `InsightEngine` co-occurrence insights (S6.T2). Implement/refine API endpoints for insights & challenges (S6.T3). Implement Dialogue Agent logic for Orb contextual prompts for cards (S6.T8).
*   **Devon (W8):** Start reviewing logging and monitoring needs. Support Ben with any complex data queries for insights.

**Sprint 7: Full Scene Implementation & Advanced Orb Behavior**
*   **Flora (W4, W7, W5):** **LEAD** on full visual implementation of `CloudScene` (S7.T1), `AscensionScene` (S7.T2), and `GraphScene` node/link styling (S7.T3). Implement advanced Orb shaders and material layers (S7.T6) and connect Orb state-driven visual changes (S7.T7). Implement full HUD (S7.T8).
*   **Ben (W7, W2):** **LEAD** on `GraphService` link fetching API (S7.T4). Guide `GraphScene` data integration and basic layout logic (S7.T5).
*   **Devon (W8):** Monitor performance implications of new 3D scenes. Support frontend with asset optimization strategies.

**Sprint 8: Advanced Interactions, Polish & Initial Deployment Prep**
*   **Flora (W7, W4):** **LEAD** on GraphScene node expansion, contextual actions (S8.T1), and constellation visualization (S8.T2). Lead UI polish pass (S8.T6).
*   **Ben (W2):** **LEAD** on `InsightEngine` temporal/correlation analysis MVP (S8.T3) and basic `OntologySteward` backend for term suggestion (S8.T4).
*   **Devon (W5, W8):** **LEAD** on Orb scene-specific behaviors (S8.T5 backend triggers/logic). Implement basic logging/monitoring (S8.T7) and initial Terraform modules (S8.T8).

**Sprint 9: Advanced Graph Interactions, Refined Insights, & Mobile Foundation**
*   **Flora (W7, W4, W6):** **LEAD** on GraphScene interactive filtering/layout (S9.T1) and "Time Travel" (S9.T2 UI). Start mobile app shell & auth (S9.T6). Implement UI for card annotations & feedback (S9.T5).
*   **Ben (W2, W1):** **LEAD** on `InsightEngine` metaphorical connections MVP (S9.T3). Backend for `OntologySteward` term review (S9.T4). Backend for card annotations and feedback (S9.T5 API).
*   **Devon (W1, W8):** Refine user preferences schema and API (S13.T6 - *adjusted sprint based on flow*). Support mobile app backend connectivity.

**Sprint 10: UI Polish, Advanced Orb Interactions, & Initial Deployment Prep**
*   **Flora (W5, W4):** **LEAD** on advanced Orb motion & physics (S10.T1), Orb voice input/output UI (S10.T2).
*   **Ben (W2, W5):** **LEAD** on Dialogue Agent for Orb voice I/O backend logic (S10.T2).
*   **Devon (W1, W8):** **LEAD** on data archiving strategy design & stubs (S10.T5), enhanced logging & centralized management (S10.T6), basic admin API for Ontology (S10.T7).

**Sprint 11: Advanced AI, Multi-Modal Ingestion & Personalization MVP**
*   **Flora (W6):** **LEAD** on UI for displaying image previews on cards and annotations (S11.T3), UI for "For You" card suggestions on Dashboard (S11.T4).
*   **Ben (W2, W6):** **LEAD** on Dialogue Agent advanced context management & prompt engineering (S11.T1). `IngestionAnalyst` image ingestion & analysis (S11.T2). `CardService` for personalized card suggestions (S11.T4 backend).
*   **Devon (W1, W7):** Oversee `Media` table updates for image metadata. Refine `GraphService` to include `thumbnail_url` for nodes (S13.T3 backend - *adjusted sprint*). Implement Node Context Menu backend needs for `GraphService` (S11.T5 backend).

**Sprint 12: Advanced Orb Interactions, Mobile Card Display & Refinements**
*   **Flora (W5, W6):** **LEAD** on Orb scene-aware interaction UI triggers (S12.T1 frontend). Implement Mobile UI for Card Gallery display (S12.T3).
*   **Ben (W5, W2, W6):** **LEAD** on Dialogue Agent logic for Orb scene-aware interactions (S12.T1 backend) and visual feedback for AI processing states (S12.T2 backend). Implement backend for "On This Day" / Recent Memories for `CardService` (S12.T4).
*   **Devon (W8, W4):** Finalize local Docker dev environment (S14.T5 - *adjusted sprint*). Oversee UI performance profiling and optimization pass with Flora (S16.T4 - *adjusted sprint*).

**Sprint 13: Multi-Modal Deep Dive, Graph Interactivity & Ontology Refinement**
*   **Flora (W7, W4, W6):** **LEAD** on GraphScene node image thumbnails (S13.T3), advanced link styling (S13.T4). Implement UI for User Preference Settings page (S17.T4 - *adjusted sprint*).
*   **Ben (W2, W1):** **LEAD** on Ingestion Analyst advanced image analysis (S13.T1), Retrieval Planner multi-modal context (S13.T2).
*   **Devon (W1, W8):** Implement `entity_graph_connections_summary` table and update job (S17.T5 - *adjusted sprint*). Implement API versioning strategy (S15.T7 - *adjusted sprint*).

**Sprint 14: End-to-End User Journeys, Performance Tuning & Deployment Prep**
*   **Flora (W_ALL, W4):** **LEAD** on E2E UI flow implementation for core journeys (S14.T1), final UI polish and consistency check (S20.T2 - *adjusted sprint*).
*   **Ben (W_ALL):** Participate in E2E testing, focusing on agent logic and data flow.
*   **Devon (W8, W_ALL):** **LEAD** on preparing initial deployment scripts (S14.T6). Lead backend/DB performance optimization pass (S20.T3 - *adjusted sprint*). Lead security review & hardening (S20.T4 - *adjusted sprint*).

**Sprint 15: Beta Candidate Prep & Feedback Mechanisms**
*   **Flora (W6, W_ALL):** **LEAD** on Mobile UI for Card Detail View (S15.T6). Implement in-app feedback UI (S21.T2 frontend). Prepare Beta Tester Guide (S20.T5 - *final review and update*).
*   **Ben (W2, W_ALL):** **LEAD** on Insight Engine user-triggered generation (S15.T3). Backend for user feedback on ontology (S15.T4) and general feedback submission (S21.T2 backend).
*   **Devon (W8, W_ALL):** **LEAD** on preparing and executing Beta Release technical steps (S21.T1). Set up external feedback channels (S21.T2 backend/infra).

**Sprint 16: Beta Feedback Incorporation & Stability**
*   **Flora (W_ALL):** Focus on UI/UX bug fixes and refinements based on beta feedback (S21.T5).
*   **Ben (W_ALL):** Focus on backend bug fixes and AI logic refinements based on beta feedback.
*   **Devon (W_ALL):** **LEAD** on triaging beta feedback (S21.T3) and addressing critical infrastructure/performance bugs (part of S21.T4).

**Sprint 17: Advanced Personalization & Mobile Polish**
*   **Flora (W4, W6):** Implement UI for User Preference Settings page (S17.T4 - *ensure fully functional*). Polish mobile Card Creation/Editing UI (S19.T4 - *final polish*).
*   **Ben (W2):** **LEAD** on Dialogue Agent personalized conversation style (S17.T1). `IngestionAnalyst` audio memory ingestion (S17.T2).
*   **Devon (W1):** Ensure `entity_graph_connections_summary` job is robust and scheduled (S17.T5).

**Sprint 18: Advanced Insights & Cross-Platform Polish**
*   **Flora (W7, W6):** **LEAD** on Mobile UI for basic GraphScene (S18.T3). General UI polishing.
*   **Ben (W2):** **LEAD** on Insight Engine - Metaphorical Connection generation and ensure display path to Dashboard (S18.T1). Implement actual `stats.correlate` and `stats.trend` tools (S18.T2).
*   **Devon (W8, W4):** **LEAD** on UI Error Boundary implementation (S18.T4). Oversee CI/CD enhancements for full service builds and tests (S18.T5). Implement initial load testing strategy (S18.T6).

**Sprint 19: Feedback Iteration & Mobile Feature Parity**
*   **Flora (W_ALL, W6):** Address UI/UX feedback from beta (S21.T5). Implement Mobile UI for Card Creation & Editing (S19.T4).
*   **Ben (W2):** **LEAD** on Dialogue Agent LLM response evaluation/refinement (S19.T1). Refine Insight Engine relevance (S19.T2).
*   **Devon (W8):** Implement Staging Environment (S19.T6).

**Sprint 20 (Now Sprint 22 in original plan): Beta Candidate Polish & Final Prep**
*   **Flora (W_ALL):** **LEAD** on Comprehensive E2E testing of UI journeys (part of S20.T1). Final UI Polish & Consistency Check (S20.T2).
*   **Ben (W_ALL):** Participate in E2E testing (backend logic). Refine LLM Prompts based on earlier evaluations.
*   **Devon (W_ALL, W8):** **LEAD** on Backend Performance Optimization (S20.T3). Lead Security Review & Hardening (S20.T4). Finalize Beta Tester and Internal Documentation (S20.T5). Lead cross-browser/device testing (S22.T1) and mobile stability/performance testing (S22.T2).

**General Collaboration Notes:**

*   **Daily Stand-ups:** Essential for AI agents (simulated via human check-ins) and humans to sync, identify blockers, and adjust tasks.
*   **Shared Knowledge Base:** The `@V7UltimateSpec` is key. Any ambiguities found by AI should be clarified and updated in a shared document or wiki.
*   **Version Control:** AI agents must commit code frequently with clear messages. Human engineers review PRs.
*   **Modular Design:** The workstream breakdown helps, but interfaces between modules (API contracts, data schemas, store actions) need to be clearly defined and adhered to. Human leads should ensure this.
*   **Iterative Feedback:** Human engineers act as product owners/QA for the AI agents, providing feedback on generated code, UI, and functionality at the end of each task.

This structure aims to provide autonomy within workstreams while ensuring critical integration points are managed. The human leads would be responsible for guiding the AI, reviewing its output, handling complex problem-solving, and ensuring the overall product vision is met.

---
## Release schedule
### Functional MVP for internal testing

Based on the detailed roadmap, a **functional prototype suitable for internal testing** with core features could realistically be achieved by the **end of Sprint 6**.

Here's why and what that prototype would likely include:

**By the end of Sprint 6, we expect to have:**

*   **User Authentication:** Users can register and log in (S1.T2).
*   **Basic Text Ingestion:** Users can input text (e.g., journal entries), which are stored as `MemoryUnits` and basic `Concepts` (S3.T1, S3.T2, S4.T1).
*   **Growth Event Generation (MVP):** Initial `GrowthEvent`s are created for 'self_know' upon text ingestion (S5.T3).
*   **Materialized Views for Growth:** `mv_entity_growth_progress` and `v_card_evolution_state` are in place and calculating basic scores/states (S5.T2).
*   **Card Display (Web):**
    *   `CardGallery.tsx` can display cards fetched from the backend (S3.T4).
    *   `Card.tsx` can display basic card info (title, preview), their computed evolution state, and growth dimension scores (S5.T5).
    *   Cards are flippable to show more details (S6.T5).
*   **Basic Dialogue Agent (Orb):**
    *   Users can send messages to Dot via the `ChatInterface.tsx` (S6.T9).
    *   Dot provides responses, potentially incorporating very basic retrieved information (S4.T3 - though semantic search might still be rudimentary at this point depending on S4.T7/S4.T8 progress).
    *   Orb has basic visual states and can perform a 'celebrating' animation (S5.T7).
    *   Orb can provide contextual prompts for cards (S6.T8).
*   **Insight Engine (MVP):**
    *   Can generate simple 'potential_connection' or 'co_occurrence_insight' `DerivedArtifacts` (S5.T6, S6.T2).
    *   These insights can be displayed on a basic `Dashboard.tsx` (S6.T4, S6.T7).
*   **Challenge System (Backend MVP):**
    *   Challenge templates can be seeded.
    *   Users can start and complete challenges via API calls (UI for this comes in S6.T6, so might be testable via Postman or scripts first, then UI by end of sprint).
    *   Completion triggers `GrowthEvent`s and 'trophy' `DerivedArtifacts` (S5.T9).
*   **API Gateway:** Core endpoints for auth, ingestion, cards, dialogue, insights, and challenges are functional (S1.T2, S3.T2, S3.T3, S3.T8, S6.T1, S6.T3).
*   **Local Development Environment:** Dockerized backend services are runnable (S1.T5).

**What "Functional Prototype" Means at this Stage:**

*   **Core Loop:** Users can input memories, see them represented as cards, see initial growth model effects, and interact with Dot.
*   **Key Concepts Demonstrated:** The ideas of knowledge capture, card-based representation, basic AI interaction, and the growth model are tangible.
*   **Internal Testing Focus:**
    *   Validating the core data flow from input to storage to display.
    *   Testing the usability of the card system and basic chat.
    *   Identifying major bugs or conceptual flaws in the core loop.
    *   Gathering initial feedback on the growth model's clarity and engagement.
    *   Assessing the initial "feel" of interacting with Dot/Orb.

**What would likely be missing or very rudimentary:**

*   **Advanced 3D Scenes:** CloudScene, AscensionScene, and GraphScene will be very basic or just stubs. Full visual fidelity and interactivity come later.
*   **Sophisticated AI:** Insight generation will be simple. Dot's conversational abilities will be limited. Multi-modal processing will be minimal.
*   **Mobile App:** Likely not yet at a testable stage for these core features.
*   **UI Polish:** Many UI elements will be functional but not fully polished aesthetically or in terms of micro-interactions.
*   **Performance Optimization:** May not be optimized for many users or large data sets.
*   **Comprehensive Error Handling:** Basic error handling will be in place, but edge cases might not be fully covered.
*   **Full Ontology Management:** The Ontology Steward will be very basic.

**Therefore, the end of Sprint 6 provides a good milestone for an internal team to start using the system, test the fundamental concepts, and provide critical early feedback before more complex features are heavily built out.** This allows for course correction and validation of the core product direction.
---
### Presentable demo

That's a great question, looking beyond just "functional" to "impressive and engaging"! Based on the roadmap, you'd likely reach a point where you'd feel proud to showcase 2dots1line V7 to friends, family, and potentially investors around the **end of Sprint 12 to Sprint 14.**

Here's the reasoning:

**Key Milestones for a Showcase-Ready Product:**

1.  **Immersive 3D Experience (Core Differentiator):**
    *   **Sprint 7:** CloudScene, AscensionScene, and basic GraphScene visuals are implemented. Orb has advanced shaders and state-driven visuals. This is when the "wow" factor of the 3D environment starts to come alive.
    *   **Sprint 8:** GraphScene gets more interactive (node expansion, constellation stubs). Orb's scene-specific behaviors are implemented, making it feel more integrated.
    *   By the end of Sprint 8, the core visual and interactive elements of the 3D environment should be taking shape.

2.  **Intelligent & Responsive Orb:**
    *   **Sprint 7:** Orb's visual states are directly tied to backend logic.
    *   **Sprint 10:** Advanced Orb motion/physics and basic voice I/O make it feel much more like an "embodied intelligence."
    *   **Sprint 12:** Orb demonstrates scene-aware interactions and visual feedback for AI processing, significantly enhancing its perceived intelligence and responsiveness.

3.  **Meaningful Core Loop & Value Proposition:**
    *   **By Sprint 6:** Basic ingestion, card display with growth/evolution, and simple chat are working. This shows the *potential*.
    *   **Sprint 8-9:** Insight Engine starts producing more relevant insights (co-occurrence, temporal patterns, basic metaphorical connections). Card interactions become richer (annotations, linking).
    *   **Sprint 11:** Personalized card suggestions and advanced dialogue context management make the experience feel more tailored. Multi-modal (image) ingestion adds a new dimension.
    *   By Sprint 12, the loop of capturing information, seeing it organized, gaining insights, and feeling growth should be quite evident.

4.  **Polished User Interface:**
    *   **Sprint 8 & onwards:** UI polish passes begin.
    *   **Sprint 12 (S12.T5 specifically):** A dedicated UI polish task focusing on consistency and refinement of glassmorphic elements and design token application.
    *   While ongoing, significant polish will be visible by this stage.

5.  **Demonstrable "Magic":**
    *   **GraphScene Interactivity (S8, S11, S15):** Seeing your knowledge visualized and being able to explore it spatially is a key "aha!" moment.
    *   **Proactive Orb Insights (S14.T3):** When the Orb intelligently surfaces relevant information or connections, it demonstrates the system's unique value.
    *   **Card Evolution & Growth Model (Visible by S5/S6, more refined by S12):** Watching cards evolve and seeing the dimensional growth visually is engaging.

**Why Sprint 12-14 is the Sweet Spot:**

*   **Sprint 12:**
    *   Orb has scene-aware interactions and better visual feedback.
    *   "On This Day" / Recent memories feature adds a nice touch of serendipity and personal connection.
    *   Dedicated UI polish task.
    *   Mobile app will have basic card display, showing cross-platform potential.
*   **Sprint 13:**
    *   GraphScene becomes more interactive (filtering, LODs, image thumbnails).
    *   Advanced link styling makes the graph more informative.
    *   Insight Engine starts on metaphorical connections.
    *   User preferences for personalization are implemented.
*   **Sprint 14:**
    *   Core user journeys are explicitly tested and refined for UI flow.
    *   3D scene performance optimizations are done, making the experience smoother.
    *   Comprehensive error handling is in place, leading to a more stable feel.

**What to Expect by End of Sprint 14 (Showcase-Ready MVP):**

*   **Visually Stunning:** The 3D scenes (Cloud, Ascension, Graph) and the Orb itself should be impressive and unique.
*   **Core Functionality Solid:** Users can register, log in, ingest text and images, see these represented as evolving cards, interact with Dot via chat and basic voice, explore their knowledge graph visually, and receive some initial insights.
*   **Growth Model Tangible:** Users can see their cards evolve and their growth dimensions change based on their interactions and completed challenges (even if challenge UI is still basic).
*   **"Intelligent Companion" Feel:** The Orb should feel responsive, somewhat context-aware, and offer occasional proactive value.
*   **Good First Impression:** The application should feel polished enough not to be distracting due to bugs or clunky UI, allowing the core concepts to shine.

**Caveats:**

*   **AI Agent Efficiency:** This timeline assumes AI agents can execute tasks efficiently with reasonable human guidance.
*   **Complexity of 3D/Shaders:** Some advanced visual effects might take longer or require specialized human intervention if AI struggles with complex shader code or 3D art integration.
*   **LLM Integration Nuances:** The quality of AI-generated content (insights, dialogue) will heavily depend on prompt engineering and LLM capabilities, which might require more human iteration than other coding tasks.
*   **Mobile Parity:** The mobile app will still be significantly behind the web app in terms of features, especially 3D elements. The showcase would likely focus on the web experience.

Therefore, while an *internal functional prototype* is ready by Sprint 6, for something that creates a strong, positive **first impression suitable for friends, family, and potential investors**, aiming for the **end of Sprint 12 to Sprint 14** is a more realistic target. This period sees the convergence of the core backend logic, the unique 3D UI, and the initial layers of AI-driven personalization and insight.

---

## Sprint 0: Project Initialization & Foundation (1 AI-Week)

**Sprint Goal:** Establish the foundational codebase structure, development environment, and basic continuous integration pipeline. This sprint is about setting up the workshop so the AI team can start building efficiently.

---

### 0.1. Workstream 8: DevOps & Infrastructure

*This workstream focuses on setting up the project's backbone – how code is organized, built, and tested automatically.*

#### 0.1.1. Task S0.T1: Initialize Monorepo
*   **Significance:** Creates the central anized codebase where all project files will live, making it easier to manage dependencies and build different parts of the application (web, mobile, backend) together.
*   **Cursor Prompt:** "Initialize a new Turborepo monorepo named `2dots1line-v7-monorepo` as detailed in `@V7UltimateSpec Section 8.1` (Monorepo Structure, referencing `V7MonoRepoDesign.md`). Set up the root `package.json` with workspaces for `apps/*`, `packages/*`, `services/*`, `workers/*`, and `3d-assets/*`. Configure TypeScript, ESLint (including `eslint-plugin-glsl`), Prettier, Husky for pre-commit hooks, and lint-staged. Create the base `turbo.json` configuration. Lay out the top-level directory structure as specified in `@V7UltimateSpec Section 8.1`."
*   **Expected Outcome:** A functional Turborepo monorepo. Basic linting (`npm run lint`) and formatting (`npm run format`) commands work. The directory structure matches the specification.
*   **AI Tests:** Run `npm install`, `npm run lint`, `npm run format`, `turbo build` (should complete without errors, though it won't build much yet).
*   **Human Verification:** Clone the repo. Verify the directory structure (apps, packages, services, etc.). Check `package.json` for workspaces and dev dependencies. Check `turbo.json` for basic pipeline setup. Ensure `husky` and `lint-staged` are configured (e.g., by making a small, poorly formatted commit to test).
*   **Dependencies:** None

#### 0.1.2. Task S0.T2: Basic CI Workflow
*   **Significance:** Automates essential code quality checks (like formatting and linting) every time new code is proposed, helping to maintain consistency and catch errors early.
*   **Cursor Prompt:** "Set up a basic CI workflow in `.github/workflows/ci-pr.yml` for GitHub Actions. This workflow should trigger on pull requests to the `main` branch. It must: 1. Checkout code. 2. Set up Node.js (use version from root `package.json` engines, e.g., v18). 3. Install dependencies using `npm ci`. 4. Run the linter using `npm run lint`. 5. Run the formatter check using `prettier --check . --ignore-path ./.gitignore`. 6. Add a placeholder step for `npm run test` that currently just echoes 'Tests will run here'."
*   **Expected Outcome:** A GitHub Actions workflow file (`.github/workflows/ci-pr.yml`) that automatically runs checks on pull requests.
*   **AI Tests:** Create a test branch, make a small commit, push, and open a pull request. Observe the GitHub Actions run.
*   **Human Verification:** Review the generated `.yml` file for correctness. Create a test PR with a deliberate linting error to confirm the CI pipeline fails as expected. Then, fix the error and confirm the CI pipeline passes.
*   **Dependencies:** S0.T1

#### 0.1.3. Task S0.T3: Local Development Environment (Docker Compose)
*   **Significance:** Provides a consistent and easy-to-set-up local development environment for all developers (including AI agents) by containerizing necessary databases.
*   **Cursor Prompt:** "Create a Docker Compose setup in `infrastructure/docker/docker-compose.yml` as specified in `@V7UltimateSpec Section 8.1 (docker subdirectory)` and referencing `@V7UltimateSpec Section 2.4.4 (Persistence Layer)`. Include services for:
    *   PostgreSQL (official image, e.g., `postgres:16-alpine`): Expose port 5432. Set default user/password/db using environment variables. Define a named volume for data persistence.
    *   Neo4j (official image, e.g., `neo4j:5`): Expose ports 7474 (HTTP) and 7687 (Bolt). Set auth `NEO4J_AUTH=neo4j/password` (use a more secure default if preferred for dev). Define a named volume.
    *   Weaviate (official image, e.g., `semitechnologies/weaviate:latest`): Expose port 8080. Configure with `text2vec-transformers` or a suitable default vectorizer module if possible, otherwise basic setup. Define a named volume.
    *   Redis (official image, e.g., `redis:alpine`): Expose port 6379. Define a named volume."
*   **Expected Outcome:** A `docker-compose.yml` file that successfully starts PostgreSQL, Neo4j, Weaviate, and Redis containers with persistent data volumes.
*   **AI Tests:** Run `docker-compose up -d`. Check `docker ps` to ensure all containers are running. Run `docker-compose down -v` to stop and remove volumes (for testing, not regular use).
*   **Human Verification:** Run `docker-compose up -d`. Connect to each database using a local client (e.g., pgAdmin for PostgreSQL, Neo4j Browser, Redis CLI, Weaviate console/client) to verify they are accessible and operational. Check that data persists after `docker-compose down` and `docker-compose up -d` again.
*   **Dependencies:** S0.T1

#### 0.1.4. Task S0.T4: Initial User Auth Database Schema (PostgreSQL)
*   **Significance:** Sets up the foundational database tables required for user accounts and sessions, which is the first step towards allowing users to interact with the application.
*   **Cursor Prompt:** "In `packages/database/src/prisma/schema.prisma`, define the Prisma schema for the `User` and `UserSession` models. Refer to `@V7UltimateSpec Section 4.1 (PostgreSQL Schema - Users Table, User_Sessions Table)` and `V7DataSchemaDesign.md (User Data Model)`. Include all specified fields (e.g., `user_id UUID PRIMARY KEY`, `email VARCHAR(255) UNIQUE`, `password_hash`, `preferences JSONB`, `region VARCHAR(64)` for `User`; `session_id UUID PRIMARY KEY`, `user_id UUID REFERENCES users(user_id)`, `device_info JSONB` for `UserSession`). Add appropriate `@db.Uuid` and `@default(now())` attributes. Generate and apply the initial migration. Initialize the Prisma Client."
*   **Expected Outcome:** The `schema.prisma` file is updated with `User` and `UserSession` models. A new Prisma migration file is generated in `prisma/migrations/`. The Prisma Client is generated/updated. The tables are created in the PostgreSQL database.
*   **AI Tests:** Run `npx prisma migrate dev --name init_user_auth`. Run `npx prisma generate`.
*   **Human Verification:** Review the `schema.prisma` file and the generated SQL migration script. Use Prisma Studio or a SQL client to inspect the PostgreSQL database (running via Docker from S0.T3) and confirm the `users` and `user_sessions` tables exist with the correct columns and constraints.
*   **Dependencies:** S0.T3 (running PostgreSQL instance)

---

## **Sprint 1: Core Backend - Authentication & API Gateway MVP (2 AI-Weeks)**

**Sprint Goal:** Implement basic user registration and login functionality through the API Gateway, and define the core data models for knowledge entities, growth, and challenges in PostgreSQL. This enables the first user interactions and lays the groundwork for content creation.

---

### 1.1. Workstream 1: Core Backend & Data Models

#### 1.1.1. Task S1.T1: Define Core Entity Schemas (PostgreSQL)
*   **Significance:** Establishes the database structure for the main types of information users will create and interact with (memories, concepts, etc.) and how their growth will be tracked.
*   **Cursor Prompt:** "Extend `packages/database/src/prisma/schema.prisma` to include the following models as detailed in `@V7UltimateSpec Section 2.1.1, 2.2.2, 2.2.5, and 4.1` (referencing `V7DataSchemaDesign.md`):
    *   `Concept`
    *   `MemoryUnit`
    *   `DerivedArtifact`
    *   `Chunk`
    *   `Media`
    *   `Annotation`
    *   `Reflection`
    *   `Conversation`
    *   `ConversationMessage`
    *   `OrbState` (for logging historical states)
    *   `ChallengeTemplate`
    *   `UserChallenge`
    *   `GrowthEvent`
    Ensure all fields, types (e.g., `UUID`, `String`, `DateTime`, `Json`, `Float`), relations (e.g., `user_id` foreign keys), and constraints (e.g., `UNIQUE`, `CHECK`) are accurately implemented. Pay close attention to array types like `TEXT[]` or `JSONB[]`. Generate and apply the new migration."
*   **Expected Outcome:** `schema.prisma` file updated with all specified V7 core models. A new Prisma migration file is generated. The tables are created/updated in PostgreSQL.
*   **AI Tests:** Run `npx prisma migrate dev --name add_core_v7_models`. Run `npx prisma generate`.
*   **Human Verification:** Review the `schema.prisma` additions and the generated SQL migration script. Use Prisma Studio to inspect the PostgreSQL database and confirm all new tables exist with the correct columns, types, and relationships (especially foreign keys). Pay attention to the `GrowthEvent` table and `Challenge` tables.
*   **Dependencies:** S0.T4

#### 1.1.2. Task S1.T3: Implement DatabaseService
*   **Significance:** Creates a centralized way for backend services to access different databases (PostgreSQL, Neo4j, Weaviate, Redis), promoting cleaner code and easier database management.
*   **Cursor Prompt:** "Create the `DatabaseService` class in `packages/database/src/index.ts` as specified in `@V7UltimateSpec Section 6.4.1`. This class should initialize and provide getter methods for PrismaClient, Neo4jClient, WeaviateClient, and RedisClient. Implement basic connection logic within the constructor and a `disconnect` method. For Neo4j, Weaviate, and Redis, use their respective official Node.js client libraries (e.g., `neo4j-driver`, `weaviate-ts-client`, `ioredis`). Include basic error logging for connection attempts."
*   **Expected Outcome:** A `DatabaseService` class in `packages/database/` that can be instantiated and provides access to configured database clients. Basic connection attempts are logged.
*   **AI Tests:** Unit tests for `DatabaseService` instantiation, client getters, and the `disconnect` method. Mock the actual client library constructors to test initialization logic without live DB connections.
*   **Human Verification:** Review the `DatabaseService.ts` code. Ensure correct client libraries are imported and initialized using environment variables for connection strings/credentials (to be added later). Verify that the service can be instantiated in a test script.
*   **Dependencies:** S0.T3 (for knowing which DBs to connect to), S1.T1 (PrismaClient is available)

#### 1.1.3. Task S1.T4: Implement UserRepository
*   **Significance:** Provides a dedicated module for handling all user-related database operations, like creating users and finding them, which is essential for authentication.
*   **Cursor Prompt:** "Implement a `UserRepository` class in `packages/database/src/repositories/user.repository.ts`. This repository should use the Prisma client obtained from the `DatabaseService`. Implement the following methods:
    *   `async createUser(data: { email: string, password_hash: string, username: string, display_name?: string, region: string }): Promise<User>`
    *   `async findUserByEmail(email: string): Promise<User | null>`
    *   `async findUserById(id: string): Promise<User | null>`
    Ensure `createUser` correctly stores the hashed password. Refer to the `User` model in `@V7UltimateSpec Section 4.1.1`."
*   **Expected Outcome:** `UserRepository.ts` file with the specified methods, correctly interacting with the Prisma client to manage user data.
*   **AI Tests:** Unit tests for each `UserRepository` method using Jest and mocking the Prisma client (e.g., `prisma.user.create.mockResolvedValue(...)`). Test edge cases like user not found.
*   **Human Verification:** Review the repository code for correctness, especially password handling (ensure it *doesn't* hash here, expects pre-hashed password, or if it does hash, uses bcrypt). Manually test user creation and retrieval through a test script that uses the repository, checking the database directly with Prisma Studio.
*   **Dependencies:** S1.T1, S1.T3

### 1.2. Workstream 3: API Gateway & Auth

#### 1.2.1. Task S1.T2: API Gateway User Registration & Login
*   **Significance:** Implements the first functional endpoints of the application, allowing users to create accounts and log in, which is fundamental for any user-specific application.
*   **Cursor Prompt:** "In the `apps/api-gateway` Express.js application (from S0.T1 setup, if not done, use `@V7UltimateSpec Section 6.2.1` as a guide):
    1.  Implement authentication middleware (`src/middleware/auth.middleware.ts`) that verifies JWTs. It should attach user information to `req.user` if valid.
    2.  Create `src/controllers/auth.controller.ts`.
    3.  Implement a `/api/auth/register` POST endpoint. This should:
        *   Validate input (email, password, username, display_name, region).
        *   Check if user already exists using `UserRepository.findUserByEmail`.
        *   Hash the password using `bcrypt`.
        *   Create the user using `UserRepository.createUser`.
        *   Return a success message or user object (without password).
    4.  Implement an `/api/auth/login` POST endpoint. This should:
        *   Validate input (email, password).
        *   Find user by email using `UserRepository.findUserByEmail`.
        *   Compare hashed password using `bcrypt.compare`.
        *   If valid, generate a JWT (using `jsonwebtoken` library) containing `userId` and `region`.
        *   Return the JWT and user details (without password).
    5.  Create a dummy protected route `/api/me` that uses the `authMiddleware` and returns `req.user`.
    Use the `UserRepository` (from S1.T4) for database operations."
*   **Expected Outcome:** Functional `/register`, `/login`, and `/me` endpoints in the API Gateway. Users can register, log in to receive a JWT, and access protected routes using that JWT.
*   **AI Tests:**
    *   Unit tests for `auth.middleware.ts` (mocking `jsonwebtoken.verify`).
    *   Unit tests for `auth.controller.ts` methods (mocking `UserRepository` and `bcrypt`).
    *   API integration tests (e.g., using `supertest`):
        *   Register a new user.
        *   Attempt to register with an existing email (expect error).
        *   Login with correct credentials (expect JWT).
        *   Login with incorrect password (expect error).
        *   Access `/api/me` without token (expect 401).
        *   Access `/api/me` with valid token (expect user data).
*   **Human Verification:**
    *   Use Postman or a similar tool to test the `/register` endpoint. Verify a new user is created in the `users` table (check Prisma Studio), and the password is hashed.
    *   Test the `/login` endpoint with correct and incorrect credentials. Verify JWT is returned on success.
    *   Use the JWT from login to access the `/api/me` endpoint and verify user data is returned.
    *   Attempt to access `/api/me` without a token or with an invalid token and verify a 401 error.
*   **Dependencies:** S0.T1 (API Gateway base), S1.T1 (User model), S1.T4 (UserRepository)

#### 1.2.2. Task S1.T5: Dockerize API Gateway
*   **Significance:** Allows the API Gateway to be run consistently in different environments (local development, CI, production) using Docker.
*   **Cursor Prompt:** "Update `infrastructure/docker/docker-compose.yml` to include a service definition for `apps/api-gateway`. Create a `Dockerfile` in the `apps/api-gateway` directory. The Dockerfile should:
    1.  Use an appropriate Node.js base image (e.g., `node:18-alpine`).
    2.  Set the working directory.
    3.  Copy `package.json` and `package-lock.json` (or `yarn.lock`).
    4.  Install dependencies (`npm ci --only=production` or similar).
    5.  Copy the rest of the application code (ensure `.dockerignore` is set up to exclude `node_modules`, etc.).
    6.  Build TypeScript code if necessary (`npm run build`).
    7.  Expose the port the API gateway listens on (e.g., 3000 or from environment variable).
    8.  Define the `CMD` to start the application (e.g., `node dist/server.js`).
    Ensure environment variables for `PORT`, `JWT_SECRET`, and `DATABASE_URL` (pointing to the Dockerized PostgreSQL service) can be passed into the container via `docker-compose.yml`."
*   **Expected Outcome:** The `api-gateway` service can be built and started using `docker-compose up api-gateway`. It should connect to the PostgreSQL container and serve requests.
*   **AI Tests:** `docker-compose build api-gateway`. `docker-compose up api-gateway`. Test the `/api/health` endpoint of the Dockerized API gateway from the host machine.
*   **Human Verification:** Run `docker-compose up --build api-gateway`. Check logs for successful startup and connection to PostgreSQL. Test the `/api/auth/register` and `/api/auth/login` endpoints using Postman, ensuring they interact correctly with the Dockerized PostgreSQL.
*   **Dependencies:** S0.T3 (Docker Compose base), S1.T2 (API Gateway code)

---

## **Sprint 2: UI Shell, Agent Stubs & Basic Neo4j/Weaviate Setup (2 AI-Weeks)**

**Sprint Goal:** Establish the basic visual framework of the application with a Next.js frontend and a 3D canvas. Create placeholder structures for cognitive agents and define the initial schemas for graph and vector databases. This sprint focuses on the foundational elements of the user interface and the specialized data stores.

---

### 2.1. Workstream 4: UI Foundation & 3D Canvas Core

#### 2.1.1. Task S2.T1: Initialize Next.js Web App with Basic 3D Canvas
*   **Significance:** Sets up the main web application where users will interact with 2dots1line. Includes the initial integration of the 3D rendering environment.
*   **Cursor Prompt:** "In the `apps/web-app` directory, initialize a new Next.js application (using App Router and TypeScript). Configure Tailwind CSS according to `@V7UltimateSpec Section 7.7` (Design Tokens, ensure `tailwind.config.js` includes paths to `packages/ui-components`). Create a root layout (`app/layout.tsx`) that sets up the basic HTML structure. Within this layout, implement a `Canvas3D` client component (`components/canvas/Canvas3D.tsx`) as described in `@V7UltimateSpec Section 5.2.1`. This component should use `@react-three/fiber` to render a simple 3D cube inside a full-screen canvas. Ensure the canvas is responsive."
*   **Expected Outcome:** A Next.js application under `apps/web-app` that, when run, displays a full-page R3F canvas with a rotating 3D cube. Tailwind CSS should be correctly configured and usable.
*   **AI Tests:** `npm run dev` (or equivalent) in `apps/web-app`. Verify the app runs without errors. Check browser console for R3F/WebGL errors. Create a simple component using Tailwind classes to verify setup.
*   **Human Verification:** Navigate to the web app in a browser. Confirm a 3D cube is rendered and animates (if simple rotation is added). Inspect elements to ensure Tailwind classes are being applied correctly. Check responsiveness by resizing the browser window.
*   **Dependencies:** S0.T1

#### 2.1.2. Task S2.T2: Setup Shared UI/3D Packages & Storybook
*   **Significance:** Creates reusable UI components and 3D utilities, and sets up Storybook for isolated component development and documentation, improving consistency and development speed.
*   **Cursor Prompt:** "Initialize the following packages as per `@V7UltimateSpec Section 8.1`:
    1.  `packages/ui-components`: Create a `GlassmorphicPanel.tsx` component as specified in `@V7UltimateSpec Section 5.3.7`.
    2.  `packages/canvas-core`: Create placeholder files (e.g., `index.ts`, basic camera/lighting stubs).
    3.  `packages/shader-lib`: Create placeholder files.
    4.  Set up Storybook in `apps/storybook`. Configure it to find stories in `packages/ui-components`. Create a story for `GlassmorphicPanel.tsx`."
*   **Expected Outcome:** `ui-components`, `canvas-core`, `shader-lib` packages created. `GlassmorphicPanel` component implemented. Storybook setup functional and displaying the `GlassmorphicPanel` story.
*   **AI Tests:** `npm run build` in `packages/ui-components`. `npm run storybook` (from `apps/storybook` or root). Verify Storybook launches and the `GlassmorphicPanel` story renders correctly with blur and border effects.
*   **Human Verification:** Review the structure of the new packages. Check the `GlassmorphicPanel.tsx` code for correctness against the spec. Run Storybook and interact with the `GlassmorphicPanel` story to confirm its visual appearance.
*   **Dependencies:** S0.T1

### 2.2. Workstream 2: Cognitive Agents & Tools

#### 2.2.1. Task S2.T3: Create Agent Stubs
*   **Significance:** Establishes the basic structure for each cognitive agent, allowing other parts of the system (like the API Gateway) to begin integrating with them, even if their internal logic is not yet implemented.
*   **Cursor Prompt:** "Create the `BaseAgent` class in `packages/agent-framework/src/base-agent.ts` as detailed in `@V7UltimateSpec Section 6.3.1`. Then, within `services/cognitive-hub/src/agents/`, create subdirectories for `dialogue`, `ingestion`, `retrieval`, `insight`, and `ontology`. In each subdirectory, create a stub class for the respective agent (e.g., `DialogueAgent.ts`, `IngestionAnalyst.ts`, `RetrievalPlanner.ts`, `InsightEngine.ts`, `OntologySteward.ts`). Each agent class should extend `BaseAgent` and implement a placeholder `async process(input: any): Promise<any>` method that logs the input and returns a simple dummy response (e.g., `{ status: 'success', agent: this.name, received: input }`)."
*   **Expected Outcome:** A `BaseAgent.ts` file in `packages/agent-framework/`. Stub classes for all five cognitive agents created within `services/cognitive-hub/src/agents/`, each extending `BaseAgent`.
*   **AI Tests:** Unit tests for `BaseAgent` instantiation and `registerTool`/`executeTool` (with mock tools). Basic instantiation tests for each stub agent to ensure they can be created and their `process` method can be called.
*   **Human Verification:** Review the `BaseAgent.ts` file. Check that each agent stub class correctly extends `BaseAgent`, has a constructor calling `super()`, and implements the placeholder `process` method.
*   **Dependencies:** S0.T1

### 2.3. Workstream 1: Core Backend & Data Models

#### 2.3.1. Task S2.T4: Define Neo4j Schema (Constraints & Indexes)
*   **Significance:** Sets up the foundational structure within the Neo4j graph database, ensuring data integrity (e.g., unique IDs) and optimizing query performance for graph traversals.
*   **Cursor Prompt:** "Create a Cypher script file named `schema.cypher` in `packages/database/src/neo4j/`. This script should define constraints and indexes for the Neo4j database as specified in `@V7UltimateSpec Section 4.2 (Neo4j Schema)`. Include:
    *   Uniqueness constraints for `userId` on `:User` nodes.
    *   Uniqueness constraints for `id` on `:Concept`, `:MemoryUnit`, `:DerivedArtifact`, and `:Tag` nodes.
    *   Indexes on `Concept(name)`, `Concept(type)`, `MemoryUnit(creation_ts)`, `MemoryUnit(memory_type)`, `DerivedArtifact(artifact_type)`.
    Add comments explaining how to run this script against a Neo4j instance (e.g., using `cypher-shell` or Neo4j Browser)."
*   **Expected Outcome:** A `schema.cypher` file is created containing the specified Cypher DDL statements.
*   **AI Tests:** The script itself is the test (to be run manually). Ensure valid Cypher syntax.
*   **Human Verification:** Review the `schema.cypher` script for correctness. Manually connect to the Dockerized Neo4j instance (from S0.T3) using Neo4j Browser or `cypher-shell` and execute the script. Verify the constraints and indexes are created using `:schema` command in Neo4j Browser.
*   **Dependencies:** S0.T3 (running Neo4j instance)

#### 2.3.2. Task S2.T5: Define Weaviate Schema (Classes)
*   **Significance:** Configures the Weaviate vector database with the necessary data structures (classes) to store and search text embeddings, which is crucial for semantic search features.
*   **Cursor Prompt:** "Create a JSON file named `schema.json` in `packages/database/src/weaviate/`. Define the Weaviate schema with classes for `UserConcept`, `UserMemory`, `UserArtifact`, and `ConversationChunk` as detailed in `@V7UltimateSpec Section 4.3`. For each class:
    *   Specify the `class` name.
    *   Set `vectorizer` to `"text2vec-contextual"`.
    *   Configure `moduleConfig` for `text2vec-contextual` to use a placeholder model like `"text-embedding-ada-002-v2"` or a generic transformer (e.g., `sentence-transformers/all-MiniLM-L6-v2`) if a specific regional model isn't yet decided or available for local setup. For now, aim for a model that is generally available or can be stubbed.
    *   Define `properties` with correct `name`, `dataType` (e.g., `["string"]`, `["text"]`, `["date[]"]`, `["int"]`), and `indexInverted: true` for filterable properties.
    *   For text properties intended for vectorization, ensure `moduleConfig.text2vec-contextual.skip` is `false` and `vectorizePropertyName` is `false`.
    Add comments or a README on how to apply this schema to a Weaviate instance (e.g., using a Weaviate client script or curl commands)."
*   **Expected Outcome:** A `schema.json` file containing the Weaviate class definitions.
*   **AI Tests:** Validate the JSON structure. (Manual execution) Attempt to apply the schema to the Dockerized Weaviate instance using a Weaviate client or curl.
*   **Human Verification:** Review the `schema.json` file for correctness against the spec. Manually apply the schema to the Dockerized Weaviate instance. Use the Weaviate console or API (`GET /v1/schema`) to verify that the classes and their properties have been created as expected.
*   **Dependencies:** S0.T3 (running Weaviate instance)

### 2.4. Workstream 5: Orb Implementation (UI & Backend Link)

#### 2.4.1. Task S2.T6: Orb UI MVP & Basic State Management
*   **Significance:** Establishes the visual presence of the AI assistant (Orb) in the UI and connects it to a basic state management system, laying the groundwork for its interactive behaviors.
*   **Cursor Prompt:** "Implement a basic `OrbLayer.tsx` and `Orb.tsx` component within `apps/web-app/src/components/orb/` (following `V7MonoRepoDesign.md` structure for app-specific components if `orb-core` is for shared logic). Refer to `@V7UltimateSpec Section 5.6.1` for initial visual structure (simple sphere, basic material).
    Create an `OrbStore.ts` using Zustand in `apps/web-app/src/stores/` as per `@V7UltimateSpec Section 5.4`. The store should manage:
    *   `isVisible: boolean` (default true)
    *   `position: [number, number, number]` (e.g., `[0, 0, 0]`)
    *   `emotionalTone: string` (default 'neutral')
    *   `visualState: string` (default 'default')
    Integrate `OrbLayer` into the main `Canvas3D` component from S2.T1 so the Orb is rendered. The Orb's material color should change based on `emotionalTone` (e.g., 'neutral' -> grey, 'happy' -> yellow; use placeholder colors for now)."
*   **Expected Outcome:** A simple sphere representing the Orb is rendered within the 3D canvas. Its color can be changed by updating the `emotionalTone` in `OrbStore`.
*   **AI Tests:** Component test for `Orb.tsx` rendering a sphere. In the browser, use React DevTools to modify `OrbStore.emotionalTone` and verify the Orb's color changes.
*   **Human Verification:** Launch the web app. The Orb (as a simple sphere) should be visible. Use React DevTools to change `emotionalTone` in `OrbStore` and confirm the Orb's color updates in real-time.
*   **Dependencies:** S2.T1

---

## **Sprint 3: Ingestion Pipeline MVP & Basic Card Display (3 AI-Weeks)**

**Sprint Goal:** Implement the initial version of the content ingestion pipeline, allowing text to be processed and stored, including the creation of foundational `GrowthEvent`s. Display this ingested content as basic cards in the UI, showing the first link between backend data and frontend presentation. Establish basic chat interaction.

---

### 3.1. Workstream 2: Cognitive Agents & Tools

#### 3.1.1. Task S3.T1: Ingestion Analyst - Tier 1 Text Processing & Growth Event Creation
*   **Significance:** This is the first step in transforming user input into structured knowledge and tracking user growth. It establishes the core mechanism for how interactions contribute to the Six-Dimensional Growth Model.
*   **Cursor Prompt:** "Implement the `IngestionAnalyst` in `services/cognitive-hub/src/agents/ingestion/ingestion-analyst.ts`. Focus on Tier 1 processing for text inputs:
    1.  Receive `userId` and `text_content`.
    2.  Create a `MemoryUnit` record in PostgreSQL (via `DatabaseService` and a new `MemoryRepository`). Set `source_type` to 'journal_entry' (or similar), `processing_status` to 'chunked'.
    3.  Perform basic chunking (e.g., split by paragraph, or treat entire input as one chunk for now). For each chunk, create a `Chunk` record in PostgreSQL linked to the `MemoryUnit`.
    4.  Use a STUB tool for Named Entity Recognition (NER). For any identified 'person' entities (stub can just find capitalized words), create or find a `Concept` node in PostgreSQL (via a new `ConceptRepository`) of type 'person'.
    5.  For each `MemoryUnit` created, create a `GrowthEvent` record (via a new `GrowthEventRepository`). Set `entity_id` to the `MemoryUnit.id`, `entity_type` to 'memory_unit', `dim_key` to 'self_know' (as a default for journaling), `delta` to `0.1`, and `source` to 'journal_entry'.
    Refer to `@V7UltimateSpec Section 3.2 (Ingestion Analyst)` and `@V7UltimateSpec Section 2.2.2 (Growth Events Stream)`."
*   **Expected Outcome:** `IngestionAnalyst` can process a text input. This results in new `MemoryUnit`, `Chunk`, and `Concept` (if applicable) records in PostgreSQL. Crucially, a `GrowthEvent` record is created for the 'self_know' dimension associated with the new `MemoryUnit`.
*   **AI Tests:**
    *   Unit tests for `IngestionAnalyst.process` method, mocking `DatabaseService` and repositories.
    *   Integration test: Call `IngestionAnalyst.process` with sample text. Verify that `MemoryUnit`, `Chunk`, `Concept` (if keywords trigger stubbed NER), and `GrowthEvent` records are correctly created in the PostgreSQL database.
*   **Human Verification:** Use a test script or a temporary API endpoint to send a sample text (e.g., "Today I reflected on my goals. John helped me.") to the `IngestionAnalyst`.
    *   Check `memory_units` table: a new entry exists.
    *   Check `chunks` table: one or more chunks linked to the memory unit.
    *   Check `concepts` table: a concept for "John" (if stub NER works) might be created.
    *   Check `growth_events` table: a new event for `dim_key='self_know'`, `delta=0.1`, linked to the new `memory_unit.id`.
*   **Dependencies:** S1.T1 (DB models), S1.T3 (DatabaseService), S2.T3 (Agent stubs)

### 3.2. Workstream 3: API Gateway & Auth

#### 3.2.1. Task S3.T2: API Endpoint for Text Ingestion
*   **Significance:** Exposes the text ingestion functionality to the frontend, allowing users to actually save their thoughts and memories.
*   **Cursor Prompt:** "In `apps/api-gateway/src/routes/`, create a new route file for memory operations (e.g., `memory.routes.ts`). Add a protected POST endpoint `/api/memory/ingest/text`. This endpoint should:
    1.  Use the `authMiddleware` (from S1.T2) to ensure the user is authenticated.
    2.  Expect a JSON body with `text_content: string`.
    3.  Call the `IngestionAnalyst.process` method (from S3.T1), passing the `userId` from `req.user` and the `text_content`.
    4.  Return a success response (e.g., 201 Created with the new `MemoryUnit` ID) or an error response.
    Register this route in the main API Gateway server file. If `IngestionAnalyst` is part of a separate service (`cognitive-hub`), use `http-proxy-middleware` to forward the request."
*   **Expected Outcome:** A new, secured API endpoint `/api/memory/ingest/text` is available. Authenticated requests to this endpoint trigger the `IngestionAnalyst`.
*   **AI Tests:** API integration tests (e.g., using Jest with `supertest`):
    *   Call endpoint without a token (expect 401).
    *   Call endpoint with a valid token and valid payload (expect 201, and verify `IngestionAnalyst.process` was called - mock this for the test).
    *   Call endpoint with invalid payload (expect 400).
*   **Human Verification:** Use Postman or a similar tool.
    1.  Authenticate to get a JWT.
    2.  Send a POST request to `/api/memory/ingest/text` with the JWT in the header and a JSON body like `{"text_content": "My first journal entry."}`.
    3.  Verify a 201 response.
    4.  Check the database (as in S3.T1 human verification) to confirm the data was created by the `IngestionAnalyst`.
*   **Dependencies:** S1.T2 (authMiddleware), S3.T1 (IngestionAnalyst)

### 3.3. Workstream 6: Card System (UI & Backend Link)

#### 3.3.1. Task S3.T3: CardService MVP - Fetch Basic Cards
*   **Significance:** Creates the backend service responsible for preparing card data for the UI. This is the first step in visualizing the user's knowledge graph as cards.
*   **Cursor Prompt:** "Create `CardService.ts` within `services/card-service/src/services/` (or as a module in `cognitive-hub`).
    1.  Implement a `CardRepository.ts` in `packages/database/src/repositories/card.repository.ts` that uses Prisma to fetch `MemoryUnit` records for a given `userId`.
    2.  In `CardService.ts`, implement a method `async getCards(userId: string, filters: any): Promise<{ cards: Card[], nextCursor?: string }>` (see `Card` type in `@V7UltimateSpec Section 6.5.1`).
    3.  This method should use `CardRepository` to fetch `MemoryUnit`s.
    4.  For now, map `MemoryUnit.title` to `Card.title` and the first part of `MemoryUnit.content` to `Card.preview`.
    5.  The `growthDimensions` and `evolutionState` fields in the `Card` model can be stubbed with empty arrays or default values for now.
    Expose this `getCards` method via a new `/api/cards` GET endpoint in the API Gateway."
*   **Expected Outcome:** A `CardService` with a `getCards` method that can retrieve `MemoryUnit` data from PostgreSQL and transform it into a basic `Card` structure. An API endpoint `/api/cards` is available.
*   **AI Tests:**
    *   Unit tests for `CardRepository.getCards` (mock Prisma).
    *   Unit tests for `CardService.getCards` (mock `CardRepository`).
    *   API integration test for `/api/cards`: After ingesting data via S3.T2, call `/api/cards` and verify it returns an array of cards with `id`, `title`, and `preview`.
*   **Human Verification:**
    1.  Ingest a few text memories using the endpoint from S3.T2.
    2.  Use Postman to call the new `/api/cards` endpoint (with authentication).
    3.  Verify the response contains an array of card objects, matching the ingested memories (titles, previews).
*   **Dependencies:** S1.T1 (MemoryUnit model), S1.T3 (DatabaseService)

#### 3.3.2. Task S3.T4: UI - Basic Card Display in Card Gallery
*   **Significance:** The first visual representation of user data as cards in the UI, making the concept of the "Card Gallery" tangible.
*   **Cursor Prompt:** "In `apps/web-app`:
    1.  Create `stores/cardStore.ts` using Zustand. It should manage `cards: Card[]`, `isLoading: boolean`, and an action `fetchCards(userId)`.
    2.  Implement the `Card.tsx` component (`components/cards/Card.tsx`). For now, it should display `card.title` and `card.preview`. Style it using `GlassmorphicPanel` and basic Tailwind CSS for a card-like appearance (refer to `@V7UltimateSpec Section 5.3.3` for general card design ideas, but keep it simple).
    3.  Create a `CardGallery.tsx` page component (`app/gallery/page.tsx`). This page should:
        *   Use `CardStore` to get the list of cards and loading state.
        *   On mount, call an action in `CardStore` that fetches cards from the `/api/cards` endpoint and updates the store.
        *   Render a list/grid of `Card.tsx` components.
    4. Add navigation to this page."
*   **Expected Outcome:** A "Card Gallery" page in the web app that fetches `MemoryUnit`-based cards from the backend and displays them as simple cards showing title and preview.
*   **AI Tests:**
    *   Component tests for `Card.tsx` (React Testing Library).
    *   Integration test for `CardGallery.tsx` (mock API call for `/api/cards`, verify cards are rendered).
    *   `npm run dev`. Navigate to the card gallery page.
*   **Human Verification:**
    1.  Ingest several memories using the API.
    2.  Navigate to the Card Gallery page in the web app.
    3.  Verify that cards corresponding to the ingested memories are displayed, showing their titles and previews.
    4.  Check that the `GlassmorphicPanel` styling is applied to the cards.
*   **Dependencies:** S2.T2 (GlassmorphicPanel), S3.T3 (CardService and `/api/cards` endpoint)

#### 3.3.3. Task S3.T5: Implement Growth Model Views in PostgreSQL
*   **Significance:** Creates efficient ways to query aggregated growth data, which will be essential for displaying progress on cards and the dashboard without repeatedly querying the entire `growth_events` table.
*   **Cursor Prompt:** "In `packages/database/src/prisma/views.sql` (or a new migrations file if Prisma supports raw SQL for views better), define the SQL for:
    1.  Materialized View `mv_entity_growth_progress` as specified in `@V7UltimateSpec Section 2.2.3`. It should aggregate `delta` from `growth_events` grouped by `user_id`, `entity_id`, `entity_type`, and `dim_key` to get a `score`.
    2.  View `v_card_evolution_state` as specified in `@V7UltimateSpec Section 2.2.4`. This view should calculate `evolution_state` ('seed', 'sprout', etc.) based on `engaged_dimensions_count` (from `mv_entity_growth_progress`) and `connection_count`. For `connection_count`, use a placeholder value of 0 or a subquery that returns 0, as the `entity_graph_connections_summary` table is not yet available.
    Document how to apply/refresh these views."
*   **Expected Outcome:** SQL script (`views.sql` or a migration) created with definitions for `mv_entity_growth_progress` and `v_card_evolution_state`.
*   **AI Tests:** The primary test is applying the SQL script to the database. Write simple SQL queries against the views (after populating `growth_events`) to check if they return expected structures.
*   **Human Verification:**
    1.  Review the SQL for the views.
    2.  Apply the script to the PostgreSQL database.
    3.  Manually insert some `growth_events` for a test user and entity.
    4.  Manually refresh `mv_entity_growth_progress`.
    5.  Query `SELECT * FROM mv_entity_growth_progress` and `SELECT * FROM v_card_evolution_state` to verify they return data and the `evolution_state` is calculated based on the (currently 0) connection count and engaged dimensions.
*   **Dependencies:** S1.T1 (growth_events table definition)

#### 3.3.4. Task S3.T6: Enhance CardService & UI to Show Growth/Evolution
*   **Significance:** Connects the backend Growth Model calculations to the UI, allowing users to see the first signs of their "progress" on cards.
*   **Cursor Prompt:** "Enhance `CardService.ts` and `Card.tsx`:
    1.  In `CardService.getCards` and `getCardDetails` (create if not exists):
        *   Fetch `score` for each dimension for an entity from `mv_entity_growth_progress` (via `CardRepository`).
        *   Fetch `evolution_state` from `v_card_evolution_state` (via `CardRepository`).
        *   Populate the `card.growthDimensions` array (with `key`, `name` (from config), `score`) and `card.evolutionState` string.
    2.  In `Card.tsx`:
        *   Display the fetched `evolutionState` (e.g., "State: Sprout").
        *   For each dimension in `growthDimensions`, display its name and score (e.g., "Know Self: 0.1"). Use placeholder styling for now.
    Update the `Card` type in `shared-types` if necessary."
*   **Expected Outcome:** `CardService` returns cards with populated `growthDimensions` (scores) and `evolutionState`. The UI `Card.tsx` component displays this information textually.
*   **AI Tests:**
    *   Unit tests for `CardService` ensuring it correctly queries and maps data from the views.
    *   Component tests for `Card.tsx` to show the new data fields.
    *   `npm run dev`. Verify card gallery now displays scores and evolution state.
*   **Human Verification:**
    1.  Ensure some `growth_events` exist for a few `MemoryUnit`s. Refresh `mv_entity_growth_progress`.
    2.  Open the Card Gallery in the web app.
    3.  Verify that cards now display their calculated `evolutionState` (e.g., "Seed" or "Sprout") and the scores for each growth dimension (e.g., "self_know: 0.1").
*   **Dependencies:** S3.T3 (CardService), S3.T4 (Card.tsx), S5.T2 (SQL Views - renamed from S3.T5 for clarity)

### 3.4. Workstream 2: Cognitive Agents & Tools

#### 3.4.1. Task S3.T7: Dialogue Agent - Basic Conversation Flow
*   **Significance:** Enables the most basic form of interaction with Dot, the AI assistant, by allowing it to receive a message and provide a simple, canned response. This establishes the foundational request-response loop.
*   **Cursor Prompt:** "Implement a basic `process` method in `DialogueAgent.ts` (`services/cognitive-hub/src/agents/dialogue/dialogue-agent.ts`). This method should:
    1.  Accept `userId` and `messageText` as input.
    2.  Create a `ConversationMessage` record for the user's message (role: 'user') in PostgreSQL, linking it to a new or existing `Conversation` (create `ConversationRepository` and methods like `getOrCreateConversation(userId)` and `addMessage(conversationId, messageData)`).
    3.  Generate a fixed acknowledgment response (e.g., "Dot: I have received your message.").
    4.  Create another `ConversationMessage` record for Dot's response (role: 'assistant').
    5.  Return Dot's response text.
    Use the `DatabaseService` for DB operations."
*   **Expected Outcome:** `DialogueAgent.process` method correctly logs the user's message and Dot's fixed response to the `conversations` and `conversation_messages` tables. The fixed response is returned.
*   **AI Tests:**
    *   Unit tests for `DialogueAgent.process` mocking `ConversationRepository`.
    *   Integration test: Call `DialogueAgent.process` directly, then verify records in `conversations` and `conversation_messages` tables.
*   **Human Verification:**
    1.  Use a test script or temporary endpoint to call `DialogueAgent.process` with a sample message.
    2.  Check Prisma Studio:
        *   A new record in the `conversations` table for the user (if it's the first message).
        *   Two new records in `conversation_messages` table linked to that conversation: one for the user's message, one for Dot's fixed reply.
*   **Dependencies:** S1.T1 (DB models), S1.T3 (DatabaseService), S2.T3 (DialogueAgent stub)

### 3.5. Workstream 3: API Gateway & Auth

#### 3.5.1. Task S3.T8: API Endpoint for Dialogue
*   **Significance:** Makes the Dialogue Agent accessible to the frontend, allowing the user to send messages and receive responses through the UI.
*   **Cursor Prompt:** "In `apps/api-gateway`, create a new protected route POST `/api/dialogue/message`. This endpoint should:
    1.  Use the `authMiddleware`.
    2.  Expect a JSON body with `messageText: string` and optionally `conversationId: string`.
    3.  Call the `DialogueAgent.process` method (from S3.T7), passing `userId`, `messageText`, and `conversationId`.
    4.  Return the response from the `DialogueAgent` (e.g., `{ "responseText": "Dot's reply" }`).
    If `DialogueAgent` is in a separate service, use `http-proxy-middleware`."
*   **Expected Outcome:** A secured `/api/dialogue/message` endpoint that allows sending messages to the `DialogueAgent` and receiving its response.
*   **AI Tests:** API integration tests (e.g., `supertest`):
    *   Send a message without auth (expect 401).
    *   Send a message with auth (expect 200 and the fixed response from DialogueAgent).
*   **Human Verification:**
    1.  Use Postman with a valid JWT.
    2.  Send a POST request to `/api/dialogue/message` with `{"messageText": "Hello Dot"}`.
    3.  Verify the response is `{"responseText": "Dot: I have received your message."}` (or the current fixed response).
    4.  Verify database entries as in S3.T7.
*   **Dependencies:** S1.T2 (authMiddleware), S3.T7 (DialogueAgent.process)

---

## **Sprint 4: Retrieval Pipeline MVP, GraphScene Shell & Neo4j/Weaviate Integration (3 AI-Weeks)**

**Sprint Goal:** Implement the first version of the retrieval pipeline, allowing the Dialogue Agent to use context from Neo4j and Weaviate. Set up the basic UI for the GraphScene and connect it to backend data. This sprint focuses on making the knowledge graph searchable and starting its visualization.

---

### 4.1. Workstream 2: Cognitive Agents & Tools

#### 4.1.1. Task S4.T1: Ingestion Analyst - Neo4j Integration for Concepts & Memories
*   **Significance:** Begins building the actual knowledge graph by storing concepts and memories (and their relationships) in Neo4j, which is essential for graph-based retrieval and insights.
*   **Cursor Prompt:** "Enhance the `IngestionAnalyst` in `services/cognitive-hub/src/agents/ingestion/ingestion-analyst.ts`:
    1.  When a `MemoryUnit` is created (S3.T1), also create a corresponding `:MemoryUnit` node in Neo4j. Its properties should include `muid` (same as PostgreSQL `memory_id`), `title`, `creation_ts`, and `userId`.
    2.  When a `Concept` is identified (from stubbed NER or future real NER), create/update a `:Concept` node in Neo4j. Its properties should include `id` (same as PostgreSQL `concept_id`), `name`, `type` (from `Concept.attributes.type`), and `userId`. Use `MERGE` to avoid duplicates based on `(userId, name, type)`.
    3.  Create a `[:HIGHLIGHTS]` relationship from the `:MemoryUnit` node to each relevant `:Concept` node in Neo4j. Add properties like `weight` (default to 1.0 for now) and `significance` (default to 'mentioned').
    Use `DatabaseService.getNeo4j()` for these operations. Refer to `@V7UltimateSpec Section 2.1.1 & 2.1.2` for node/relationship details."
*   **Expected Outcome:** When text is ingested by `IngestionAnalyst`:
    *   Corresponding `:MemoryUnit` nodes are created in Neo4j.
    *   Corresponding `:Concept` nodes are created/updated in Neo4j.
    *   `[:HIGHLIGHTS]` relationships are created between these nodes in Neo4j.
*   **AI Tests:**
    *   Unit tests for the Neo4j interaction logic within `IngestionAnalyst` (mock Neo4j client).
    *   Integration test: Call `IngestionAnalyst.process` (or the `/api/memory/ingest/text` endpoint). Verify nodes and relationships are created in Neo4j using Cypher queries (e.g., `MATCH (m:MemoryUnit)-[r:HIGHLIGHTS]->(c:Concept) WHERE m.userId = 'testUser' RETURN m, r, c`).
*   **Human Verification:**
    1.  Ingest a sample text like "I love learning about AI with 2dots1line."
    2.  Open Neo4j Browser.
    3.  Query for the new `:MemoryUnit` node.
    4.  Query for `:Concept` nodes like "AI" and "2dots1line".
    5.  Verify `[:HIGHLIGHTS]` relationships exist between the MemoryUnit and these Concepts, all tagged with the correct `userId`.
*   **Dependencies:** S3.T1 (IngestionAnalyst basics), S2.T4 (Neo4j schema setup), S1.T3 (DatabaseService with Neo4j client)

#### 4.1.2. Task S4.T2: Retrieval Planner MVP - Basic Semantic Search Stub
*   **Significance:** Lays the groundwork for the Retrieval Planner, which will be responsible for finding relevant information from the user's knowledge graph. This task focuses on the initial structure and connection to Weaviate (even if stubbed).
*   **Cursor Prompt:** "Implement the `RetrievalPlanner` stub in `services/cognitive-hub/src/agents/retrieval/retrieval-planner.ts`. Create a method `async getSimilarMemoryUnits(userId: string, queryText: string, topK: number = 5): Promise<MemoryUnit[]>`:
    1.  (STUB) Call an `embed.text` tool (create a stub for this tool in `services/cognitive-hub/src/tools/embedding-tools/`) to get a dummy vector for `queryText`.
    2.  (STUB) Call a `vector.similar` tool (create a stub for this tool in `services/cognitive-hub/src/tools/vector-tools/`) with the dummy vector to get a list of dummy `cid`s (Chunk IDs from PostgreSQL).
    3.  Using these `cid`s, fetch the corresponding `MemoryUnit` details (e.g., title, preview) from PostgreSQL via `CardRepository` (or a new `ChunkRepository` if needed).
    4.  Return an array of these `MemoryUnit` objects (or a simplified version suitable for context).
    For now, the stubs can return predefined data to simulate the flow."
*   **Expected Outcome:** `RetrievalPlanner.getSimilarMemoryUnits` method exists. It simulates the embedding and vector search flow and returns a list of `MemoryUnit` data fetched from PostgreSQL based on (currently dummy) Chunk IDs.
*   **AI Tests:**
    *   Unit tests for `RetrievalPlanner.getSimilarMemoryUnits`, mocking the tool calls and repository.
    *   Ensure the data flow (text -> embed -> similar -> fetch details) is logically sound, even with stubs.
*   **Human Verification:**
    *   Review the `RetrievalPlanner.ts` and the stub tool implementations.
    *   If possible, write a small test script to call `getSimilarMemoryUnits` and verify it returns a list of memory units (even if the selection logic is hardcoded in stubs for now).
*   **Dependencies:** S2.T3 (Agent stubs), S1.T1 (PostgreSQL models), S3.T3 (CardRepository)

#### 4.1.3. Task S4.T3: Dialogue Agent - Integrate Basic Retrieval
*   **Significance:** Makes the Dialogue Agent (Orb) smarter by allowing it to use information retrieved by the `RetrievalPlanner` to formulate responses, moving beyond fixed replies.
*   **Cursor Prompt:** "Enhance the `DialogueAgent.process` method in `services/cognitive-hub/src/agents/dialogue/dialogue-agent.ts`:
    1.  After receiving the user's message, call `RetrievalPlanner.getSimilarMemoryUnits(userId, messageText)`.
    2.  Construct a context string from the titles of the retrieved memory units (e.g., "Found related memories: [Title1], [Title2]").
    3.  (STUB) Pass this context string along with the user's message to a very simple LLM call stub (e.g., a function that just concatenates: `User: ${messageText}\nContext: ${context}\nDot: Based on that, ...`).
    4.  Use the output from this stub as Dot's response.
    5.  Log the context used and the LLM response to the `ConversationMessage` (assistant's message) metadata."
*   **Expected Outcome:** The `DialogueAgent` now incorporates results from the (stubbed) `RetrievalPlanner` into its response generation process. The assistant's message in the database now contains metadata about the context used.
*   **AI Tests:**
    *   Unit tests for `DialogueAgent.process`, mocking `RetrievalPlanner` and the LLM stub.
    *   Integration test: Send a message to the Dialogue Agent. Verify that the response text indicates it used context from the (stubbed) retrieved memories. Check the `conversation_messages` table for the assistant's message and ensure its metadata includes the context.
*   **Human Verification:**
    1.  Ingest a few memories (e.g., "My trip to Paris", "My dog Sparky").
    2.  Send a message like "Tell me about my travels" to the `/api/dialogue/message` endpoint.
    3.  The response should now be something like "Dot: I found these related memories: My trip to Paris. Based on that, ..." (assuming the stubbed retrieval planner returns "My trip to Paris").
    4.  Check the `metadata` field of the assistant's `ConversationMessage` in Prisma Studio to see if the context was logged.
*   **Dependencies:** S3.T7 (Dialogue Agent basics), S4.T2 (RetrievalPlanner MVP)

#### 4.1.4. Task S4.T6: Ingestion - Integrate Stubbed Embedding
*   **Significance:** Wires up the embedding step in the ingestion pipeline, even if the actual embedding generation is still a placeholder. This prepares the system for real semantic processing.
*   **Cursor Prompt:** "1. Create a stub for the `embed.text` tool in `services/cognitive-hub/src/tools/embedding-tools/text.ts`. It should accept text and return a dummy vector ID (e.g., a UUID string).
    2. Create a stub for the `vector.similar` tool in `services/cognitive-hub/src/tools/vector-tools/similar.ts`. It should accept a vector and return a predefined list of dummy chunk IDs.
    3. Modify `IngestionAnalyst.process`: After creating `Chunk` records, for each chunk, call the stubbed `embed.text` tool with `Chunk.text_content`. Store the returned dummy vector ID in the `Chunk.embedding_id` field in PostgreSQL.
    4. Modify `RetrievalPlanner.getSimilarMemoryUnits`: It should now call the stubbed `embed.text` tool for the `queryText` and then pass the (dummy) vector to the stubbed `vector.similar` tool to get (dummy) chunk IDs."
*   **Expected Outcome:**
    *   `Chunk` records in PostgreSQL will have a value in their `embedding_id` field after ingestion (even if it's a dummy ID).
    *   `RetrievalPlanner` now follows the logical flow of embedding the query and then performing a similarity search, although the tools are still stubs.
*   **AI Tests:**
    *   Unit tests for the new stub tools.
    *   Modify `IngestionAnalyst` unit tests to verify `embed.text` is called and `embedding_id` is set.
    *   Modify `RetrievalPlanner` unit tests to verify it calls `embed.text` and then `vector.similar`.
*   **Human Verification:**
    1.  Ingest new text content.
    2.  Check the `chunks` table in Prisma Studio. The `embedding_id` column should now be populated with dummy IDs.
    3.  Sending a message to the `DialogueAgent` should still work, with the retrieval flow using these stubs. The actual *quality* of retrieval won't change yet.
*   **Dependencies:** S3.T1 (Ingestion Analyst), S4.T2 (Retrieval Planner)

#### 4.1.5. Task S4.T7: Integrate Real Weaviate Embedding and Storage
*   **Significance:** This is a major step, replacing stubs with actual vector embedding and storage. It enables true semantic search capabilities.
*   **Cursor Prompt:** "1. In `DatabaseService` (`packages/database/src/index.ts`), ensure the Weaviate client (`weaviate-ts-client`) is correctly initialized and can connect to the Dockerized Weaviate instance.
    2.  Implement the `embed.text` tool (`services/cognitive-hub/src/tools/embedding-tools/text.ts`) to use a real embedding model. Choose one based on regional availability (e.g., a small, fast sentence-transformer model from Hugging Face for local dev, or configure placeholders for Google/DeepSeek APIs if direct API calls are complex for the AI agent now). The tool should take text and return the actual vector.
    3.  In `IngestionAnalyst.process`:
        *   For each `Chunk`, call the real `embed.text` tool.
        *   Store the returned vector in Weaviate using the `DatabaseService.getWeaviate().data.creator()`. Use the `ChunkEmbeddings` class (or `ConversationChunk` if more appropriate). The Weaviate object ID should be the PostgreSQL `Chunk.cid`. Store `cid`, `muid`, and `textPreview` as properties in Weaviate.
        *   Update the `Chunk.embedding_id` in PostgreSQL with the Weaviate object ID (which is the `cid`).
    Refer to `@V7UltimateSpec Section 2.4 (Vector Embedding Strategy)` and `@V7UltimateSpec Section 4.3 (Weaviate Schema)`."
*   **Expected Outcome:** Text chunks generated during ingestion are now vectorized using a real embedding model, and these vectors are stored in Weaviate. The `Chunk.embedding_id` in PostgreSQL stores the corresponding Weaviate object ID.
*   **AI Tests:**
    *   Unit test for the `embed.text` tool (may require mocking the embedding model/API if it's external).
    *   Integration test: Ingest a piece of text.
        *   Verify `Chunk` records in PostgreSQL have `embedding_id`s.
        *   Query Weaviate (e.g., using its console or client library) for the object with that ID and verify its vector exists and properties (`cid`, `muid`, `textPreview`) are correct.
*   **Human Verification:**
    1.  Ingest several distinct text snippets.
    2.  Use the Weaviate console (e.g., `localhost:8080/v1/objects/{className}/{chunk_cid}?include=vector`) to inspect the created objects. Confirm that vectors are present and properties are correctly set.
    3.  Check the `chunks` table in Prisma Studio; `embedding_id` should now be the actual Weaviate object ID (which should be the same as `cid`).
*   **Dependencies:** S2.T5 (Weaviate schema), S4.T6 (Ingestion Analyst embedding flow), S1.T3 (DatabaseService)

#### 4.1.6. Task S4.T8: Implement Real Vector Similarity Search
*   **Significance:** Enables the `RetrievalPlanner` to perform actual semantic searches, finding memories and concepts based on meaning rather than just keywords. This is a cornerstone of the "intelligent memory" system.
*   **Cursor Prompt:** "Implement the `vector.similar` tool in `services/cognitive-hub/src/tools/vector-tools/similar.ts`. This tool should:
    1.  Accept a query vector, `k` (number of results), optional filters (e.g., `userId`), and `namespace` (Weaviate class name like `ChunkEmbeddings`).
    2.  Use `DatabaseService.getWeaviate().graphql.get()` with a `nearVector` or `nearText` (if providing text directly to Weaviate for embedding) query to find the `k` most similar vectors in the specified Weaviate class, applying any filters.
    3.  Return the `cid`s (or other relevant IDs stored in Weaviate) of the matching objects.
    Update `RetrievalPlanner.getSimilarMemoryUnits` to use this real `vector.similar` tool. The `DialogueAgent`'s responses should now be based on semantically relevant retrieved memories."
*   **Expected Outcome:** The `RetrievalPlanner` can perform semantic similarity searches against the vectors stored in Weaviate. The `DialogueAgent`'s responses are now informed by semantically relevant context.
*   **AI Tests:**
    *   Unit tests for the `vector.similar` tool (mock Weaviate client).
    *   Integration test for `RetrievalPlanner`: Ingest distinct pieces of content. Provide a query text semantically similar to one of them. Verify the `RetrievalPlanner` (through `vector.similar`) identifies the correct chunks/memory units.
*   **Human Verification:**
    1.  Ingest several distinct memories (e.g., "My cat loves tuna," "My dog enjoys walks in the park," "I am learning to code in Python.").
    2.  Send queries to the Dialogue Agent (via API Gateway) like "What do my pets like?" or "Tell me about programming."
    3.  The "related memories" part of Dot's response should now be genuinely relevant based on semantic similarity, not just keyword matching. Check retrieval planner logs to see which chunks were retrieved from Weaviate.
*   **Dependencies:** S4.T3 (Dialogue Agent using Retrieval Planner), S4.T7 (real embeddings in Weaviate)

### 4.2. Workstream 4: UI Foundation & 3D Canvas Core

#### 4.2.1. Task S4.T4: GraphScene UI Shell & Basic Node Rendering
*   **Significance:** Creates the initial visual container for the knowledge graph, allowing users to see a representation of their data in a 3D space for the first time.
*   **Cursor Prompt:** "Create the `GraphScene.tsx` component in `apps/web-app/src/canvas/scenes/GraphScene/`.
    1.  Implement a basic R3F setup within this component.
    2.  Fetch node data from a new API endpoint `/api/graph/nodes` (this endpoint will be created in S4.T5). The data will be a list of objects like `{ id: string, label: string, type: string }`.
    3.  For each node fetched, render a simple R3F `<mesh>` (e.g., a `<sphereGeometry>`) at a random or simple grid position for now. Display the `node.label` using `drei`'s `<Text>` component near each sphere.
    4.  Add basic `OrbitControls` from `drei` for camera manipulation.
    5.  Add `GraphScene` to the `SceneManager` in `Canvas3D.tsx` (from S2.T1).
    6.  Add a button or control in the `HUD.tsx` (create a basic stub `HUD.tsx` if it doesn't exist) to switch the `SceneStore.activeScene` to 'graph'."
*   **Expected Outcome:** A `GraphScene` component that fetches node data from a (to-be-created) backend endpoint and renders each node as a sphere with a label. Users can switch to this scene and navigate it with orbit controls.
*   **AI Tests:**
    *   Component test for `GraphScene.tsx` (mock API call, verify spheres and text are rendered).
    *   `npm run dev`. In the browser, click the button to switch to `GraphScene`. Verify spheres representing nodes appear. Check browser network tab for the `/api/graph/nodes` call. Test orbit controls.
*   **Human Verification:**
    1.  Ensure some data is ingested that creates Neo4j nodes (S4.T1).
    2.  Ensure the `/api/graph/nodes` endpoint (S4.T5) is working and returning data.
    3.  In the web app, navigate to the GraphScene. You should see spheres representing your concepts and memories. Labels should be visible. You should be able to rotate and zoom the view.
*   **Dependencies:** S2.T1 (Canvas3D setup), `SceneStore` (from S2.T6 or created now for scene switching), S4.T5 (backend endpoint for graph nodes).

### 4.3. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 4.3.1. Task S4.T5: GraphService - Fetch Nodes for GraphScene
*   **Significance:** Provides the data feed from the backend (Neo4j) to the frontend GraphScene, enabling the visualization of the user's actual knowledge graph nodes.
*   **Cursor Prompt:** "Create a `GraphService.ts` (in `services/graph-service/` or as a module in `cognitive-hub`). Implement a method `async getGraphNodes(userId: string): Promise<{id: string, label: string, type: string}[]>`. This method should:
    1.  Use `DatabaseService.getNeo4j()` to connect to Neo4j.
    2.  Execute a Cypher query to fetch all `:Concept` and `:MemoryUnit` nodes belonging to the `userId`.
    3.  For `:Concept` nodes, use `concept.name` as `label` and 'concept' as `type`.
    4.  For `:MemoryUnit` nodes, use `memoryUnit.title` as `label` and 'memory' as `type`.
    5.  Return an array of these objects.
    Expose this method via a new protected GET endpoint `/api/graph/nodes` in the API Gateway."
*   **Expected Outcome:** An API endpoint `/api/graph/nodes` that queries Neo4j and returns a list of the user's concepts and memory units formatted for the GraphScene.
*   **AI Tests:**
    *   Unit tests for `GraphService.getGraphNodes` (mock Neo4j client).
    *   API integration test: After ingesting data (S4.T1), call `/api/graph/nodes` and verify it returns the expected node data from Neo4j.
*   **Human Verification:**
    1.  Ingest some data (S4.T1) which creates nodes in Neo4j.
    2.  Use Postman to call the `/api/graph/nodes` endpoint (with authentication).
    3.  Verify the response is a JSON array where each object has `id`, `label`, and `type` (e.g., 'concept' or 'memory'), corresponding to the data in Neo4j.
*   **Dependencies:** S1.T3 (DatabaseService with Neo4j), S4.T1 (data in Neo4j)

---
*(Roadmap continues with Sprint 7, Sprint 8, etc., following the same detailed, hierarchical, and AI-prompt-friendly structure. Each subsequent sprint would build upon the previous ones, progressively implementing features from the `@V7UltimateSpec` across the different workstreams.)*

**Key principles for subsequent sprints:**

*   **UI-Backend Synchronization:** Tasks will often involve both frontend and backend components to enable new features (e.g., implementing a "complete challenge" button in UI and the backend service method it calls).
*   **Progressive Detail:** Initial implementations will be basic, with subsequent tasks refining visuals, adding more complex logic, and optimizing performance.
*   **Event-Driven & Configuration Focus:** Emphasize creating and reacting to events (e.g., `GrowthEvent`) and using configurable rules rather than hardcoding logic.
*   **Cross-Workstream Dependencies:** Clearly state when a task in one workstream depends on the completion of a task in another.
*   **Testing and Verification:** Maintain rigorous testing at each step.

This detailed, structured approach should enable multiple AI agents to work effectively in parallel, with clear instructions and expected outcomes for each task. Human oversight remains crucial for reviewing code, verifying functionality against the holistic vision, and guiding the AI agents when they encounter ambiguities or complex trade-offs.

Okay, I will continue generating the detailed implementation roadmap in the requested hierarchical bulleted format, starting with the completion of Sprint 4 and then proceeding through Sprints 5, 6, 7, and 8.

---

**Sprint 4: Retrieval Pipeline MVP, GraphScene Shell & Neo4j/Weaviate Integration (3 AI-Weeks) - Continued**

*Goal: Implement the first version of the retrieval pipeline, allowing the Dialogue Agent to use context from Neo4j and Weaviate. Set up the basic UI for the GraphScene and connect it to backend data. This sprint focuses on making the knowledge graph searchable and starting its visualization.*

*(Tasks S4.T1 to S4.T5 were detailed previously. Continuing with S4.T6)*

---

### 4.4. Workstream 2: Cognitive Agents & Tools (Continued)

#### 4.4.1. Task S4.T6: Ingestion - Integrate Stubbed Embedding Workflow
*   **Significance:** Wires up the conceptual embedding step in the ingestion pipeline and the corresponding similarity search in retrieval, even if the actual embedding/search logic is still a placeholder. This prepares the system for real semantic processing by establishing the data flow.
*   **Cursor Prompt:** "1. Create a stub for the `embed.text` tool in `services/cognitive-hub/src/tools/embedding-tools/text.ts`. It should accept text and return a dummy vector ID (e.g., a UUID string).
    2. Create a stub for the `vector.similar` tool in `services/cognitive-hub/src/tools/vector-tools/similar.ts`. It should accept a dummy vector ID and return a predefined list of dummy chunk IDs (e.g., `['chunk-id-1', 'chunk-id-2']`).
    3. Modify `IngestionAnalyst.process` (`services/cognitive-hub/src/agents/ingestion/ingestion-analyst.ts`): After creating `Chunk` records, for each chunk, call the stubbed `embed.text` tool with `Chunk.text_content`. Store the returned dummy vector ID in the `Chunk.embedding_id` field in PostgreSQL.
    4. Modify `RetrievalPlanner.getSimilarMemoryUnits` (`services/cognitive-hub/src/agents/retrieval/retrieval-planner.ts`): It should now call the stubbed `embed.text` tool for the `queryText` and then pass the (dummy) vector ID to the stubbed `vector.similar` tool to get (dummy) chunk IDs."
*   **Expected Outcome:**
    *   `Chunk` records in PostgreSQL will have a value in their `embedding_id` field after ingestion (even if it's a dummy ID).
    *   `RetrievalPlanner` now follows the logical flow of embedding the query and then performing a similarity search, using the newly created stub tools.
*   **AI Tests:**
    *   Unit tests for the new stub `embed.text` and `vector.similar` tools.
    *   Update `IngestionAnalyst` unit tests to verify `embed.text` is called and `embedding_id` is set on chunks.
    *   Update `RetrievalPlanner` unit tests to verify it calls `embed.text` and then `vector.similar`.
*   **Human Verification:**
    1.  Ingest new text content using the `/api/memory/ingest/text` endpoint.
    2.  Check the `chunks` table in Prisma Studio. The `embedding_id` column should now be populated with dummy IDs.
    3.  Sending a message to the `DialogueAgent` should still work, with the retrieval flow using these stubs. The actual *quality* of retrieval won't change yet, but the logs (if added) should show the stubbed tool calls.
*   **Dependencies:** S3.T1 (IngestionAnalyst), S4.T2 (RetrievalPlanner)

#### 4.4.2. Task S4.T7: Integrate Real Weaviate Embedding and Storage
*   **Significance:** This is a major step, replacing stubs with actual vector embedding and storage. It enables true semantic search capabilities by converting text into meaningful numerical representations.
*   **Cursor Prompt:** "1. In `DatabaseService` (`packages/database/src/index.ts`), ensure the Weaviate client (`weaviate-ts-client`) is correctly initialized using environment variables for `WEAVIATE_HOST` and `WEAVIATE_SCHEME` and can connect to the Dockerized Weaviate instance.
    2.  Implement the `embed.text` tool in `services/cognitive-hub/src/tools/embedding-tools/text.ts` to use a real embedding model API.
        *   Use `ai-clients` package (create if not existing: `packages/ai-clients/src/embedding.service.ts`) to abstract calls to Google Gemini/DeepSeek embedding APIs based on region (configurable via environment variables). For local development, if direct API access is complex, use a local sentence-transformer model via a small Python Flask service called by the tool, or temporarily use a mock that returns consistent dummy vectors of the correct dimension (e.g., 1536). The tool should take text and return the actual vector (array of numbers).
    3.  In `IngestionAnalyst.process`:
        *   For each `Chunk`, call the real `embed.text` tool to get the vector.
        *   Store this vector in Weaviate using `DatabaseService.getWeaviate().data.creator()`. Create objects in the `ChunkEmbeddings` class (ensure this class is defined in your Weaviate schema from S2.T5). The Weaviate object ID *must* be the PostgreSQL `Chunk.cid`. Store `cid`, `muid` (parent `memory_unit.id`), and `textPreview` (first N characters of chunk text) as properties in the Weaviate object.
        *   The `Chunk.embedding_id` in PostgreSQL should now store the Weaviate object ID (which is the `cid`).
    Refer to `@V7UltimateSpec Section 2.4 (Vector Embedding Strategy)` and `@V7UltimateSpec Section 4.3 (Weaviate Schema)`."
*   **Expected Outcome:** Text chunks generated during ingestion are vectorized using a real (or consistently mocked for dev) embedding model. These vectors are stored in Weaviate, retrievable by the `Chunk.cid`. The `Chunk.embedding_id` in PostgreSQL stores this `cid`.
*   **AI Tests:**
    *   Unit test for the `embed.text` tool (mocking the actual embedding API call if external).
    *   Integration test for `IngestionAnalyst`: Ingest text. Verify `Chunk` records in PostgreSQL have their `embedding_id` populated. Query Weaviate using the `cid` to retrieve the object and verify its vector and properties (`cid`, `muid`, `textPreview`).
*   **Human Verification:**
    1.  Ingest several distinct text snippets.
    2.  Use the Weaviate console (e.g., `localhost:8080/v1/objects/ChunkEmbeddings/{chunk_cid}?include=vector`) to inspect the created objects. Confirm that vectors (arrays of numbers) are present and properties are correctly set.
    3.  Check the `chunks` table in Prisma Studio; `embedding_id` should now be the `cid` itself, referencing the Weaviate object.
*   **Dependencies:** S2.T5 (Weaviate schema defined), S4.T6 (Ingestion Analyst embedding flow updated), S1.T3 (DatabaseService with Weaviate client connected)

#### 4.4.3. Task S4.T8: Implement Real Vector Similarity Search
*   **Significance:** Enables the `RetrievalPlanner` to perform actual semantic searches using the vectors stored in Weaviate, finding memories and concepts based on meaning rather than just keywords. This is a cornerstone of the "intelligent memory" system.
*   **Cursor Prompt:** "Implement the `vector.similar` tool in `services/cognitive-hub/src/tools/vector-tools/similar.ts`. This tool should:
    1.  Accept a query vector (array of numbers), `k` (number of results), optional filters (e.g., `userId`, `muid`), and `className` (e.g., `ChunkEmbeddings`).
    2.  Use `DatabaseService.getWeaviate().graphql.get()` with a `nearVector` search. Construct the query to search in the specified `className` using the provided vector. Include a `where` filter if filters are provided (e.g., filtering by `muid`).
    3.  The query should request the `cid` property and `_additional { distance }` from Weaviate.
    4.  Return an array of objects, each containing `cid` and `score` (derived from distance).
    Update `RetrievalPlanner.getSimilarMemoryUnits` to:
    1.  Call the real `embed.text` tool for the `queryText`.
    2.  Call this real `vector.similar` tool with the resulting query vector and `className: 'ChunkEmbeddings'`.
    3.  Use the returned `cid`s to fetch `MemoryUnit`s from PostgreSQL.
    The `DialogueAgent`'s responses should now be based on semantically relevant retrieved memories."
*   **Expected Outcome:** The `RetrievalPlanner` can perform semantic similarity searches against the vectors stored in Weaviate. The `DialogueAgent`'s responses are now informed by semantically relevant context.
*   **AI Tests:**
    *   Unit tests for the `vector.similar` tool (mock Weaviate client's GraphQL method).
    *   Integration test for `RetrievalPlanner`: Ingest distinct pieces of content. Provide a query text semantically similar to one of them. Verify the `RetrievalPlanner` (through `vector.similar`) identifies the correct chunks/memory units.
*   **Human Verification:**
    1.  Ingest several distinct memories (e.g., "My cat loves tuna," "My dog enjoys walks in the park," "I am learning to code in Python.").
    2.  Send queries to the Dialogue Agent (via `/api/dialogue/message`) like "What do my pets like?" or "Tell me about programming."
    3.  The "related memories" part of Dot's response (from S4.T3) should now list titles of genuinely relevant memories based on semantic similarity. Check logs for Weaviate queries and results if possible.
*   **Dependencies:** S4.T3 (Dialogue Agent using Retrieval Planner), S4.T7 (real embeddings in Weaviate)

### 4.5. Workstream 4: UI Foundation & 3D Canvas Core (Continued)

#### 4.5.1. Task S4.T4: GraphScene UI Shell & Basic Node Rendering
*   **Significance:** Creates the initial visual container for the knowledge graph, allowing users to see a representation of their data in a 3D space for the first time.
*   **Cursor Prompt:** "Create `GraphScene.tsx` in `apps/web-app/src/canvas/scenes/GraphScene/`.
    1.  Implement a basic R3F setup within this component.
    2.  Create `GraphStore.ts` (Zustand) in `apps/web-app/src/stores/` to manage `nodes: any[]`, `links: any[]`, `isLoading: boolean`, `focusedNodeId: string | null`.
    3.  In `GraphScene.tsx`, on mount, fetch node data from `/api/graph/nodes` (API endpoint from S4.T5) and store it in `GraphStore`.
    4.  Render each node from the store as a simple R3F `<mesh>` (e.g., a `<sphereGeometry>`) at a temporary random or grid position. Display the `node.label` using `drei`'s `<Text>` component near each sphere.
    5.  Add `OrbitControls` from `drei` for camera manipulation.
    6.  Add `GraphScene` to the `SceneManager` in `Canvas3D.tsx` (from S2.T1).
    7.  Create a basic `HUD.tsx` component in `apps/web-app/src/components/layout/HUD.tsx`. Add a button in the HUD to call an action in `SceneStore` (create if not exists, from S2.T6) to set `activeScene` to 'graph'."
*   **Expected Outcome:** A `GraphScene` component that fetches node data from the backend and renders each node as a sphere with a label. Users can switch to this scene via the HUD and navigate it with orbit controls. `GraphStore` manages graph data.
*   **AI Tests:**
    *   Component test for `GraphScene.tsx` (mock API call, verify spheres and text are rendered based on mock data).
    *   `npm run dev`. In the browser, click the HUD button to switch to `GraphScene`. Verify spheres representing nodes appear. Check browser network tab for the `/api/graph/nodes` call. Test orbit controls. Check React DevTools for `GraphStore` state.
*   **Human Verification:**
    1.  Ensure some data is ingested that creates Neo4j nodes (S4.T1).
    2.  Ensure the `/api/graph/nodes` endpoint (S4.T5) is working and returning data.
    3.  In the web app, click the HUD button to navigate to the GraphScene. You should see spheres representing your concepts and memories. Labels should be visible. You should be able to rotate and zoom the view.
*   **Dependencies:** S2.T1 (Canvas3D setup), S2.T6 (SceneStore for scene switching, OrbLayer for context), S4.T5 (backend endpoint for graph nodes)

### 4.6. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 4.6.1. Task S4.T5: GraphService - Fetch Nodes for GraphScene
*   **Significance:** Provides the data feed from the backend (Neo4j) to the frontend GraphScene, enabling the visualization of the user's actual knowledge graph nodes.
*   **Cursor Prompt:** "Create a `GraphService.ts` (e.g., in `services/cognitive-hub/src/services/graph.service.ts` or as a new microservice module if preferred for future scaling). Implement a method `async getGraphDisplayNodes(userId: string): Promise<{id: string, label: string, type: string}[]>`. This method should:
    1.  Use `DatabaseService.getNeo4j()` to connect to Neo4j.
    2.  Execute a Cypher query to fetch all `:Concept` and `:MemoryUnit` nodes belonging to the `userId`.
    3.  For `:Concept` nodes, use `concept.name` as `label` and the most specific label (e.g., 'person', 'value' if available from `Concept.type` which is stored in `attributes` in PG but should also be a property in Neo4j node if possible, otherwise default to 'Concept') as `type`.
    4.  For `:MemoryUnit` nodes, use `memoryUnit.title` as `label` and 'MemoryUnit' as `type`.
    5.  Return an array of these objects: `{id: string, label: string, type: string}`.
    Expose this method via a new protected GET endpoint `/api/graph/nodes` in the API Gateway (`apps/api-gateway`). Ensure it uses `authMiddleware`."
*   **Expected Outcome:** An API endpoint `/api/graph/nodes` that queries Neo4j and returns a list of the user's concepts and memory units formatted for the GraphScene, including a distinguishing `type`.
*   **AI Tests:**
    *   Unit tests for `GraphService.getGraphDisplayNodes` (mock Neo4j client).
    *   API integration test: After ingesting data that creates nodes in Neo4j (S4.T1), call `/api/graph/nodes` with a valid user token and verify it returns the expected node data.
*   **Human Verification:**
    1.  Ingest some data (S4.T1) which creates nodes in Neo4j (e.g., a MemoryUnit and a few Concepts it highlights).
    2.  Use Postman to call the `/api/graph/nodes` endpoint (with authentication for the correct user).
    3.  Verify the response is a JSON array where each object has `id`, `label`, and `type` (e.g., 'Concept' or 'MemoryUnit'), corresponding to the data in Neo4j.
*   **Dependencies:** S1.T3 (DatabaseService with Neo4j), S4.T1 (data in Neo4j), S1.T2 (API Gateway setup)

---

## **Sprint 5: Growth Model Backend, Insight Engine MVP & Enhanced UI Cards (3 AI-Weeks)**

**Sprint Goal:** Implement the backend for the Six-Dimensional Growth Model, including event sourcing and challenge system. Develop an MVP of the Insight Engine. Enhance UI cards to display growth and evolution state. Implement basic Orb state changes related to growth.

---

### 5.1. Workstream 1: Core Backend & Data Models

#### 5.1.1. Task S5.T1: Implement Growth and Challenge System Tables (PostgreSQL)
*   **Significance:** Creates the database tables necessary to track user growth events and manage challenges, forming the data foundation for the gamification and growth tracking features.
*   **Cursor Prompt:** "In `packages/database/src/prisma/schema.prisma`, implement the `GrowthEvent`, `ChallengeTemplate`, and `UserChallenge` tables as defined in `@V7UltimateSpec Section 2.2` (specifically sections 2.2.2 and 2.2.5, referencing `V7DataSchemaDesign.md`). Ensure all fields, types, foreign key relationships (e.g., `UserChallenge.user_id` to `User.user_id`, `UserChallenge.template_id` to `ChallengeTemplate.template_id`), and constraints (like `CHECK` constraints for `GrowthEvent.entity_type` and `ChallengeTemplate.difficulty`) are accurately implemented. Generate and apply the migration."
*   **Expected Outcome:** `GrowthEvent`, `ChallengeTemplate`, `UserChallenge` tables are created in PostgreSQL schema. Prisma client is updated.
*   **AI Tests:** `npx prisma migrate dev --name add_growth_challenge_models`. `npx prisma generate`.
*   **Human Verification:** Review the generated migration SQL. In Prisma Studio, verify the new tables exist with correct columns, types, and foreign key relationships. Pay special attention to `growth_events.dim_key` and constraints like `challenge_templates.difficulty ENUM`.
*   **Dependencies:** S1.T1 (Prisma setup)

#### 5.1.2. Task S5.T2: Implement Growth Model Views (PostgreSQL)
*   **Significance:** Creates pre-aggregated views of growth data. This significantly improves performance for UI components that need to display growth summaries, by avoiding complex queries on the raw event table.
*   **Cursor Prompt:** "Create a SQL script (e.g., `packages/database/src/prisma/migrations/ MIGRATION_ID_views/migration.sql` if adding to an existing migration, or a new manual script `packages/database/src/views/growth_views.sql`) to define:
    1.  The materialized view `mv_entity_growth_progress` as specified in `@V7UltimateSpec Section 2.2.3`. This view should sum `delta` from `growth_events` grouped by `user_id`, `entity_id`, `entity_type`, and `dim_key`. Include `event_count` and `last_event_ts`.
    2.  The view `v_card_evolution_state` as specified in `@V7UltimateSpec Section 2.2.4`. This view should calculate `evolution_state` ('seed', 'sprout', etc.) based on `engaged_dimensions_count` (derived from `mv_entity_growth_progress`) and `connection_count`. For `connection_count`, use a subquery against a placeholder table `entity_graph_connections_summary` (which will be populated later) or default to 0 if the table doesn't exist yet.
    Document how to apply/refresh these views. Ensure the `UNIQUE INDEX` for the materialized view is also created."
*   **Expected Outcome:** SQL script created with definitions for `mv_entity_growth_progress` and `v_card_evolution_state`. The views can be created in the database.
*   **AI Tests:** The primary test is applying the SQL script. Write simple SQL queries against the views (after populating `growth_events`) to check if they return data and basic logic works (e.g., `SUM(delta)` in `mv_entity_growth_progress`).
*   **Human Verification:** Review the SQL definitions. Manually apply to the DB. Insert sample `growth_events` for a user and entity. Manually refresh `mv_entity_growth_progress`. Query `mv_entity_growth_progress` to see aggregated scores. Query `v_card_evolution_state` to see initial evolution states (likely 'seed' or 'sprout' depending on `growth_events`).
*   **Dependencies:** S5.T1 (growth_events table)

#### 5.1.3. Task S5.T8: Implement Challenge Repositories
*   **Significance:** Provides structured access to challenge data, allowing services to create, read, update, and delete challenges and their templates. This is key for the gamification aspect.
*   **Cursor Prompt:** "Implement `ChallengeTemplateRepository.ts` and `UserChallengeRepository.ts` in `packages/database/src/repositories/`. These should use the Prisma client from `DatabaseService`.
    *   `ChallengeTemplateRepository`: Implement `createTemplate(data)`, `getTemplateById(id)`, `getAllTemplates()`, `updateTemplate(id, data)`, `deleteTemplate(id)`.
    *   `UserChallengeRepository`: Implement `create(data)`, `getById(id)`, `findByUserId(userId, status?: string)`, `updateProgress(id, progressData)`, `updateStatus(id, status, completedAt?)`.
    Refer to schema in `@V7UltimateSpec Section 2.2.5`."
*   **Expected Outcome:** Repositories for managing challenge templates and user challenges are functional, with methods to interact with the `challenge_templates` and `user_challenges` tables.
*   **AI Tests:** Unit tests for all repository methods (Jest, mock Prisma). Test different query scenarios (e.g., finding active challenges for a user).
*   **Human Verification:** Review code for correctness. Manually seed a `ChallengeTemplate` in the DB. Use a test script (or later, API endpoints) to call repository methods: create a `UserChallenge`, update its progress, update its status. Verify DB entries in Prisma Studio are as expected.
*   **Dependencies:** S1.T3 (DatabaseService), S5.T1 (Challenge tables schema)

### 5.2. Workstream 2: Cognitive Agents & Tools

#### 5.2.1. Task S5.T3: Ingestion Analyst - Basic Growth Event Creation
*   **Significance:** Connects the act of content creation (e.g., journaling) directly to the user's growth journey by automatically generating growth events. This is the first step in making the system "adaptive."
*   **Cursor Prompt:** "Enhance the `IngestionAnalyst` in `services/cognitive-hub/src/agents/ingestion/ingestion-analyst.ts`.
    1.  When a `MemoryUnit` is created (from S3.T1):
        *   Based on `MemoryUnit.source_type` (e.g., 'journal_entry', 'conversation_summary'), and potentially simple keyword analysis of the content, determine relevant `dim_key`(s) to credit. For now, if `source_type` is 'journal_entry', always credit 'self_know'.
        *   Create a `GrowthEvent` record via `DatabaseService` (or a new `GrowthEventRepository`). Populate `user_id`, `entity_id` (the `MemoryUnit.id`), `entity_type` ('memory_unit'), the determined `dim_key`(s), a default `delta` (e.g., 0.1), and `source` (e.g., 'journal_entry_ingestion').
    2.  If `Concept`s are extracted and linked via `HIGHLIGHTS`:
        *   For each linked `Concept`, also create a `GrowthEvent` record. Set `entity_id` to `Concept.id`, `entity_type` to 'concept', use the same `dim_key` as the parent `MemoryUnit`, a smaller `delta` (e.g., 0.05), and `source` like 'concept_highlighted_in_journal'.
    Refer to `@V7UltimateSpec Section 4.3.1` for activation logic ideas."
*   **Expected Outcome:** When `IngestionAnalyst` processes text, it creates `GrowthEvent` records for the `MemoryUnit` and associated `Concept`s, incrementing specified growth dimensions.
*   **AI Tests:**
    *   Unit tests for the growth event generation logic within `IngestionAnalyst` (mock DB calls).
    *   Integration test: Ingest text. Verify `GrowthEvent` records are created in PostgreSQL for the `MemoryUnit` and any extracted `Concept`s, with correct `dim_key`, `delta`, and `entity_id`/`entity_type`.
*   **Human Verification:**
    1.  Ingest a journal entry (e.g., via API from S3.T2).
    2.  Check the `growth_events` table in Prisma Studio. Verify new entries exist for `dim_key='self_know'` associated with the new `memory_unit.id`. If concepts were extracted and linked (from S4.T1), verify corresponding `growth_events` for those `concept.id`s.
    3.  Refresh and check `mv_entity_growth_progress` to see updated scores.
*   **Dependencies:** S3.T1 (IngestionAnalyst basics), S4.T1 (Concept extraction logic), S5.T1 (GrowthEvent table)

#### 5.2.2. Task S5.T6: Insight Engine MVP - Basic "Potential Connection"
*   **Significance:** The first step towards proactive insight generation. Even a simple version demonstrates the system's ability to find non-obvious links.
*   **Cursor Prompt:** "Implement the `InsightEngine` stub in `services/cognitive-hub/src/agents/insight/insight-engine.ts`.
    1.  Create a method `async discoverPotentialConnections(userId: string): Promise<DerivedArtifact[]>`
    2.  In this method, query PostgreSQL (via `DatabaseService` and `ConceptRepository`) to fetch, for example, two random `Concept` entities for the given `userId` that are *not* yet directly connected in Neo4j (this check can be a stub for now or a simple query if feasible).
    3.  If two such concepts are found, create a `DerivedArtifact` record in PostgreSQL (via `DerivedArtifactRepository` - create a stub if not existing from S1.T1).
        *   `artifact_type` = 'potential_connection'
        *   `title` = "Potential Connection: [Concept1Name] & [Concept2Name]"
        *   `description` = "These two concepts, [Concept1Name] and [Concept2Name], might be related. Explore how."
        *   `source_entities` = `[{ "type": "concept", "id": "concept1_uuid" }, { "type": "concept", "id": "concept2_uuid" }]`
    4.  Return the created `DerivedArtifact`(s).
    Refer to `@V7UltimateSpec Section 3.4` for insight output and `@V7DataSchemaDesign.md` for `DerivedArtifacts`."
*   **Expected Outcome:** `InsightEngine.discoverPotentialConnections` method can generate a `DerivedArtifact` of type 'potential_connection' in PostgreSQL, linking two concepts.
*   **AI Tests:**
    *   Unit test for `discoverPotentialConnections` (mock `DatabaseService` and repository calls).
    *   Manually trigger the method (via a test script or temporary API endpoint) after ensuring some concepts exist for a user. Verify a `DerivedArtifact` record is created in PostgreSQL.
*   **Human Verification:**
    1.  Ensure at least two `Concept` records exist for a test user (created via ingestion S4.T1).
    2.  Manually trigger the `discoverPotentialConnections` method for that user.
    3.  Check the `derived_artifacts` table in Prisma Studio. A new entry with `artifact_type = 'potential_connection'` should exist, and its `source_entities` field should correctly reference the IDs of two concepts belonging to the user.
*   **Dependencies:** S2.T3 (InsightEngine stub), S1.T1 (`DerivedArtifact` model, `Concept` model), S1.T3 (DatabaseService)

### 5.3. Workstream 5: Orb Implementation (UI & Backend Link)

#### 5.3.1. Task S5.T7: Implement Orb 'Celebrating' State for Growth
*   **Significance:** Provides positive reinforcement to the user when they achieve growth milestones, making the experience more engaging and rewarding. This connects backend growth events to tangible UI feedback.
*   **Cursor Prompt:** "1. In `OrbStateManager.ts` (`services/dialogue-agent/src/agent/orb-state-manager.ts`), add a 'celebrating' visual state. Define its properties (e.g., color `GrowthAurora`, particle effects) based on `@V7UltimateSpec Section 5.6.3 & 5.2.3`.
    2. In `Orb.tsx` (`apps/web-app/src/orb/Orb.tsx`), implement the visual rendering for this 'celebrating' state using custom shaders or particle effects from `packages/shader-lib` or `drei`.
    3. Modify `CardService.completeChallenge` (from S5.T9). After successfully completing a challenge and creating `GrowthEvent`s, publish an event (e.g., `challenge_completed_event` with `userId` and `challengeName`) via a message broker (e.g., Redis Pub/Sub, or a simple in-memory event emitter if broker not set up).
    4. In `DialogueAgent.ts`, subscribe to this `challenge_completed_event`. On receiving it, trigger the Orb's 'celebrating' state for a few seconds using `OrbStateManager.updateState` or a new `triggerTemporaryEffect` method. The Orb state change should be sent to the frontend via WebSocket.
    Reference `@V7UltimateSpec Section 5.1 (Orb Visual Appearance)` and `@V7UltimateSpec Section 5.2.3 (Orb State Changes)`."
*   **Expected Outcome:** When a user completes a challenge (triggering backend logic), the Orb in the UI enters a distinct 'celebrating' visual state for a short duration.
*   **AI Tests:**
    *   Unit tests for `OrbStateManager` to handle the 'celebrating' state.
    *   Component tests for `Orb.tsx` to verify the 'celebrating' visual.
    *   Integration test: Manually trigger the `challenge_completed_event` on the message broker (or call the `DialogueAgent` method directly). Observe `OrbStore` state changes and visual updates in the UI.
*   **Human Verification:**
    1.  (After S5.T9 is testable) Complete a challenge through the system (e.g., via a test script or eventually UI).
    2.  Observe the Orb in the web app. It should briefly display its 'celebrating' animation (e.g., sparkle with `GrowthAurora` color).
    3.  Check backend logs to confirm event flow from `CardService` to `DialogueAgent` to `OrbStateManager`.
*   **Dependencies:** S2.T6 (Orb MVP), S5.T9 (ChallengeService `completeChallenge` logic), Message Broker setup (or direct call for now).

### 5.4. Workstream 6: Card System (UI & Backend Link)

#### 5.4.1. Task S5.T4: Enhance CardService with Full Growth & Evolution Data
*   **Significance:** Enables the `CardService` to provide comprehensive data for each card, including its progress across all growth dimensions and its current evolutionary stage, making the card a true representation of a knowledge artifact's lifecycle.
*   **Cursor Prompt:** "Enhance `CardService.ts` (`services/card-service/src/services/card.service.ts`):
    1.  In `getCards` and `getCardDetails` (create/refine this method to fetch a single card by ID):
        *   Fetch `score` for *all* six growth dimensions for an entity from `mv_entity_growth_progress`. The `growthDimensions` array on the `Card` model should contain an entry for each of the six dimensions (from config), with the score populated if an event exists, otherwise score 0. Include `dim_key`, `name` (from config), `side`, `actionType`, `status` (derived from score or specific events), and `progress` (score mapped to 0-1).
        *   Fetch `evolution_state` from `v_card_evolution_state`.
        *   Fetch `connection_count` from `v_card_evolution_state` (or the underlying `entity_graph_connections_summary` once available, for now, the view's value is fine).
    2.  Update the `Card` type in `packages/shared-types/src/ui/index.ts` (or similar) to accurately reflect the `GrowthDimension` structure from `@V7UltimateSpec Section 6.5.1`.
    Ensure growth dimension configuration (names, keys, etc.) is loaded (e.g., from Redis or a config file) to map `dim_key` to `name`, `side`, `actionType`."
*   **Expected Outcome:** `CardService` methods return `Card` objects fully populated with detailed `growthDimensions` data (for all 6 dimensions) and the correct `evolutionState` and `connectionCount` derived from the database views.
*   **AI Tests:**
    *   Unit tests for `CardService` methods, mocking repository calls that return data from `mv_entity_growth_progress` and `v_card_evolution_state`.
    *   Verify that all six growth dimensions are present in the `growthDimensions` array for each card, even if some have a score of 0.
*   **Human Verification:**
    1.  Ingest data and create some `growth_events` for a `MemoryUnit` across a few dimensions. Refresh `mv_entity_growth_progress`.
    2.  Call the `/api/cards` or a new `/api/cards/:id` endpoint.
    3.  Verify the response for a specific card includes an array of 6 `growthDimensions`, each with `key`, `name`, `side`, `actionType`, `status` (e.g., 'unactivated', 'in_progress', 'activated'), and `progress`.
    4.  Verify the `evolutionState` matches the logic in `v_card_evolution_state`.
*   **Dependencies:** S3.T6 (CardService basics), S5.T2 (DB Views), Access to Growth Dimension configuration.

#### 5.4.2. Task S5.T5: Enhance UI Card with Full Growth & Evolution Display
*   **Significance:** Visually brings the Six-Dimensional Growth Model to life on each card, allowing users to see and interact with their progress directly.
*   **Cursor Prompt:** "Update `Card.tsx` (`apps/web-app/src/components/cards/Card.tsx`):
    1.  Display the `evolutionState` (e.g., 'Seed', 'Sprout', 'Bloom') prominently, perhaps with an icon or distinct visual style based on `@V7UltimateSpec Section 4.1.2 (Card Evolution States)` and associated V7 UI mockups if available.
    2.  Implement the `GrowthDimensionIndicator.tsx` component as per `@V7UltimateSpec Section 5.3.4`. This component should visually represent the `status` ('unactivated', 'in_progress', 'activated', 'mastered') and `progress` (0-1) of a single growth dimension. Use distinct colors/icons for each dimension based on design tokens (`@V7UltimateSpec Section 7.1`).
    3.  In `Card.tsx` (likely on the front/summary side), iterate over the `card.growthDimensions` array and render a `GrowthDimensionIndicator` for each of the six dimensions."
*   **Expected Outcome:** UI cards dynamically display their current evolution state and visually represent the progress/status for all six growth dimensions using distinct indicators.
*   **AI Tests:**
    *   Component tests for `GrowthDimensionIndicator.tsx` showing different states and progress levels.
    *   Component tests for `Card.tsx` ensuring it correctly renders the evolution state and all six dimension indicators based on mock card data.
*   **Human Verification:**
    1.  In the web app's Card Gallery, verify cards clearly display their `evolutionState` (e.g., "Bloom").
    2.  Each card should show indicators for all six growth dimensions. The visual representation (e.g., color, fill level of a bar, icon style) should clearly reflect the `status` and `progress` for each dimension. For example, an 'unactivated' dimension might be greyed out, 'in_progress' partially filled, 'activated' fully filled with its specific color.
*   **Dependencies:** S3.T4 (basic Card.tsx), S5.T4 (CardService providing full data)

#### 5.4.3. Task S5.T9: Implement Challenge Service Logic & Reward Creation
*   **Significance:** Fully implements the backend logic for the gamified challenge system, including starting, progressing, completing challenges, and awarding growth and tangible rewards (as Derived Artifacts).
*   **Cursor Prompt:** "Implement the `ChallengeService.ts` in `services/card-service/src/services/challenge.service.ts` (or as a new microservice module).
    1.  Implement `async startChallenge(userId: string, templateId: string): Promise<UserChallenge>`: Creates a `UserChallenge` record using `UserChallengeRepository`.
    2.  Implement `async updateChallengeProgress(userId: string, challengeInstanceId: string, progressData: object): Promise<UserChallenge>`: Updates `UserChallenge.progress` JSONB field. This method should also check if the progress meets completion criteria defined in `ChallengeTemplate.payload` and, if so, call `completeChallenge`.
    3.  Implement `async completeChallenge(userId: string, challengeInstanceId: string): Promise<{ challenge: UserChallenge, reward?: DerivedArtifact }>`:
        *   Sets `UserChallenge.status` to 'completed' and `completed_at` to `NOW()`.
        *   For each `dim_key` in the associated `ChallengeTemplate.dim_keys`, create a `GrowthEvent` (e.g., `delta = 0.5` or configurable per template).
        *   If `ChallengeTemplate.reward_description` is present, create a `DerivedArtifact` (type 'trophy' or 'poster') using `DerivedArtifactRepository`. The `DerivedArtifact.title` should be related to the challenge name/reward, and `source_entities` should link to the `UserChallenge` instance `[{ "type": "user_challenge", "id": "challenge_instance_id" }]`.
    4. Implement `async getActiveChallenges(userId: string): Promise<UserChallenge[]>` and `async getChallengeTemplates(): Promise<ChallengeTemplate[]>`.
    Use `DatabaseService` and repositories. Refer to `@V7UltimateSpec Section 4.2.5` for challenge system details and `V7DataSchemaDesign.md` for reward artifact creation."
*   **Expected Outcome:** `ChallengeService` with methods to manage the full lifecycle of user challenges. Completing a challenge correctly updates its status, generates `GrowthEvent`s, and creates a `DerivedArtifact` as a reward.
*   **AI Tests:**
    *   Unit tests for each `ChallengeService` method (mocking repositories and `DatabaseService`).
    *   Integration test: Seed a `ChallengeTemplate`. Call `startChallenge`, then `updateChallengeProgress` (if applicable), then `completeChallenge`. Verify:
        *   `UserChallenge` status is 'completed'.
        *   Correct `GrowthEvent`(s) are created.
        *   A 'trophy' `DerivedArtifact` is created, linked to the `UserChallenge`.
*   **Human Verification:**
    1.  Seed a `ChallengeTemplate` in the DB (e.g., "Journal for 3 days", `dim_keys: ['self_know']`, `reward_description: 'Journaling Novice Trophy'`).
    2.  Use test scripts or Postman (if S6.T4 API endpoints are ready) to:
        *   Start the challenge for a user.
        *   (If applicable) Update its progress.
        *   Complete the challenge.
    3.  Verify in Prisma Studio:
        *   `user_challenges` record status is 'completed'.
        *   `growth_events` table has new event(s) for 'self_know' for that user, linked to the challenge or user.
        *   `derived_artifacts` table has a new 'trophy' artifact titled 'Journaling Novice Trophy' linked to the `UserChallenge`.
*   **Dependencies:** S5.T1 (Challenge DB models), S5.T8 (Challenge Repositories), S6.T2 (DerivedArtifactRepository - ensure it exists even if from a previous task or create a basic one now), S5.T1 (`GrowthEvent` table).

---
*Continuation into Sprint 6, 7, and 8 would follow this detailed, hierarchical, and AI-prompt-friendly format, building upon the established foundations. Each task clearly states its significance for a product owner and provides a precise prompt for the AI agent, along with expected outcomes and verification steps.*

This detailed structure should significantly improve the clarity for both AI agents executing the tasks and human engineers reviewing the progress. Remember that prompts might need slight adjustments based on the specific capabilities and conversational style of the Cursor AI being used.

Okay, let's continue with Sprint 6, 7, and 8, maintaining the detailed, hierarchical, and AI-prompt-friendly format.

---

## **Sprint 6: Insight Display, Advanced Card Features & Chat Enhancements (3 AI-Weeks)**

**Sprint Goal:** Display AI-generated insights on the User Dashboard. Implement advanced card features like flipping for detail views and UI for challenge interactions. Enhance the chat interface with contextual awareness and suggestive actions. This sprint focuses on making the application more interactive and insightful.

---

### 6.1. Workstream 6: Card System (UI & Backend Link)

#### 6.1.1. Task S6.T1: Implement API for Card Details
*   **Significance:** Allows the frontend to fetch detailed information for a specific card, necessary for the "back" side of the flippable card UI and for focused interactions.
*   **Cursor Prompt:** "In `CardService.ts` (`services/card-service/src/services/card.service.ts`), implement the `async getCardDetails(userId: string, cardId: string, cardType: string): Promise<Card | null>` method. This method should:
    1.  Fetch the core entity (`MemoryUnit`, `Concept`, or `DerivedArtifact`) from PostgreSQL using `CardRepository` based on `cardId` and `cardType`.
    2.  Populate its `growthDimensions` using `mv_entity_growth_progress`.
    3.  Populate its `evolutionState` using `v_card_evolution_state`.
    4.  Fetch its direct connections from Neo4j (e.g., first-degree related nodes) and include a summary (e.g., connection count, types of connections).
    5.  Return the fully populated `Card` object.
    Expose this method via a new protected GET endpoint `/api/cards/:cardId` in the API Gateway, ensuring it accepts a `type` query parameter."
*   **Expected Outcome:** A `/api/cards/:cardId?type=<type>` endpoint that returns detailed information for a specific card, including its growth status, evolution, and basic connection info.
*   **AI Tests:**
    *   Unit tests for `CardService.getCardDetails` mocking repository calls.
    *   API integration test: After ingesting data and creating some growth events/connections, call `/api/cards/:cardId?type=concept` and verify the full card data is returned.
*   **Human Verification:**
    1.  Ingest a `MemoryUnit` and link it to a `Concept`. Add some `growth_events` for both. Refresh MVs.
    2.  Use Postman to call `/api/cards/{concept_id}?type=concept`.
    3.  Verify the response includes the concept's details, its growth dimension scores, evolution state, and a count or list of its connections.
*   **Dependencies:** S5.T4 (CardService can fetch basic card data), S5.T2 (DB Views), S4.T1 (Neo4j connections)

#### 6.1.2. Task S6.T5: UI - Card Flipping Animation & Detail View
*   **Significance:** Enhances user interaction with cards by allowing them to "flip" cards to see more detailed information, making the Card Gallery more engaging and informative.
*   **Cursor Prompt:** "In `apps/web-app/src/components/cards/Card.tsx`:
    1.  Implement the two-sided card design as per `@V7UltimateSpec Section 5.3.3` and `v7UIUXDesign.md Section 4.1`.
        *   **Front Side:** Displays `title`, `preview` (image/text snippet), and the `GrowthDimensionIndicator`s (from S5.T5).
        *   **Back Side (Information Side):** Displays detailed `description`, `metadata` (e.g., creation date, source type), and a more detailed breakdown of `GrowthDimension`s including `name`, `score`, `status`, and any `nextStepSuggestion` (if available from backend).
    2.  Implement a flip animation on card click (e.g., using `framer-motion` for `rotateY`).
    3.  When a card is focused or flipped to the back for the first time, if detailed data isn't already loaded, fetch full card details by calling the `/api/cards/:cardId?type=<type>` endpoint (from S6.T1) and update the card's state in `CardStore` or local component state."
*   **Expected Outcome:** Cards in the Card Gallery are interactive, flipping on click to reveal detailed information on their back side. The flip animation is smooth. Detailed data is loaded on demand.
*   **AI Tests:**
    *   Component tests for `Card.tsx` verifying front and back content rendering and flip animation trigger. Mock API calls for detail loading.
    *   In the UI (`npm run dev`), click cards. Verify they flip. Check network tab for the `/api/cards/:cardId` call when a card is flipped for the first time.
*   **Human Verification:**
    1.  In the Card Gallery, click on any card.
    2.  Verify the card smoothly flips.
    3.  Front: Check for title, preview, and the six growth dimension indicators.
    4.  Back: Check for detailed description, metadata, and a more elaborate display of each growth dimension.
    5.  Verify that data for the back is loaded when the card is first flipped (inspect network requests).
*   **Dependencies:** S5.T5 (Card UI with basic growth display), S6.T1 (API for card details)

#### 6.1.3. Task S6.T6: UI - Dashboard Challenge Display & Interaction
*   **Significance:** Allows users to see and interact with their active and available challenges directly from the dashboard, making the gamification aspect more prominent and actionable.
*   **Cursor Prompt:** "In `apps/web-app/src/components/dashboard/Dashboard.tsx`:
    1.  In the 'Growth Invitations' or 'Active Journeys' section, fetch and display active `UserChallenge`s by calling the `/api/challenges/active` endpoint (from S6.T4 API).
    2.  For each active challenge, display its template's `name` and `description`, and the `user_challenge.progress` (e.g., 'Days Logged: 5/7').
    3.  If a challenge is not yet completed, provide a 'Complete Challenge' button. Clicking this button should call the `/api/challenges/instances/:challengeInstanceId/complete` endpoint.
    4.  Fetch and display available `ChallengeTemplate`s using `/api/challenges/templates`. For each template, display its `name` and `description`, and a 'Start Challenge' button that calls `/api/challenges/:templateId/start`.
    5.  Update the UI optimistically or re-fetch challenge lists upon starting or completing a challenge.
    Refer to `@V7UltimateSpec Section 4.2.5` for challenge system details."
*   **Expected Outcome:** The dashboard displays lists of active and available challenges. Users can start new challenges and mark active ones as complete from the UI.
*   **AI Tests:**
    *   Component tests for rendering lists of active and available challenges, and for button interactions (mocking API calls).
    *   E2E test stub: Simulate starting a challenge from the UI, verify API call. Simulate completing a challenge, verify API call and UI update.
*   **Human Verification:**
    1.  Seed a few `ChallengeTemplate`s in the database.
    2.  Open the Dashboard in the UI. Verify available templates are listed.
    3.  Click "Start Challenge" for one. Verify it moves to an "Active Challenges" list (or the list updates). Check `user_challenges` table in DB.
    4.  Click "Complete Challenge" for an active one. Verify it's removed from active (or marked completed). Check DB for `status` update, `growth_events`, and a 'trophy' `DerivedArtifact`. The Orb should also perform its 'celebrating' animation (from S5.T7).
*   **Dependencies:** S6.T4 (API endpoints for challenges), S6.T4 (Dashboard structure), S5.T7 (Orb celebration for context)

### 6.2. Workstream 2: Cognitive Agents & Tools

#### 6.2.1. Task S6.T2: Enhance Insight Engine - Co-occurrence Insights
*   **Significance:** Moves the Insight Engine beyond random suggestions to generating more meaningful insights based on actual data patterns, like discovering concepts that frequently appear together.
*   **Cursor Prompt:** "Modify `InsightEngine.discoverPatterns(userId)` in `services/cognitive-hub/src/agents/insight/insight-engine.ts`.
    1.  Query Neo4j (via `DatabaseService`) to find pairs of `Concept` nodes that are frequently co-highlighted in the same `MemoryUnit`s for the given `userId`. For example: `MATCH (m:MemoryUnit)-[:HIGHLIGHTS]->(c1:Concept), (m)-[:HIGHLIGHTS]->(c2:Concept) WHERE m.userId = $userId AND id(c1) < id(c2) RETURN c1.id, c1.name, c2.id, c2.name, count(*) AS occurrences ORDER BY occurrences DESC LIMIT 5`.
    2.  For the top N (e.g., 3) co-occurring pairs, create `DerivedArtifact` records in PostgreSQL (via `DerivedArtifactRepository`).
        *   `artifact_type` = 'co_occurrence_insight'
        *   `title` = "Insight: '[Concept1Name]' and '[Concept2Name]' often appear together."
        *   `description` = "You frequently mention '[Concept1Name]' and '[Concept2Name]' in the same contexts. Exploring this connection might reveal deeper themes."
        *   `source_entities` = `[{ "type": "concept", "id": "concept1_uuid" }, { "type": "concept", "id": "concept2_uuid" }]`
        *   `attributes` = `{ "occurrences": numberOfOccurrences }`
    Refer to `@V7UltimateSpec Section 3.4` for insight output structure."
*   **Expected Outcome:** `InsightEngine` generates `DerivedArtifacts` of type 'co_occurrence_insight' based on analyzing concept co-occurrence in user's memories.
*   **AI Tests:**
    *   Unit tests for the co-occurrence logic (mock Neo4j and `DerivedArtifactRepository` calls).
    *   Integration test: Ingest data with deliberate co-occurring concepts. Run `discoverPatterns`. Verify `DerivedArtifact` records are created with correct type, title, description, and `source_entities`.
*   **Human Verification:**
    1.  Ingest several `MemoryUnit`s, ensuring some concepts are highlighted together multiple times (e.g., "Work" and "Stress", "Family" and "Joy").
    2.  Manually trigger `InsightEngine.discoverPatterns` for the user.
    3.  Check the `derived_artifacts` table in Prisma Studio for new 'co_occurrence_insight' entries. Verify their `title`, `description`, and `source_entities` accurately reflect the co-occurring concepts.
*   **Dependencies:** S5.T6 (Insight Engine stub), S4.T1 (Neo4j data), S6.T1 (DerivedArtifactRepository)

### 6.3. Workstream 3: API Gateway & Auth

#### 6.3.1. Task S6.T3: API Endpoints for Insights & Challenges (Refinement)
*   **Significance:** Ensures the frontend has robust and specific API endpoints to fetch and manage insights and challenges, enabling rich UI interactions.
*   **Cursor Prompt:** "In `apps/api-gateway` (and corresponding backend services/repositories if necessary):
    1.  Refine/implement `GET /api/dashboard/insights`:
        *   It should call a method in `InsightService` (or `InsightEngine`) that fetches `DerivedArtifacts` for the authenticated `userId`.
        *   Filter by `artifact_type` IN ('potential_connection', 'co_occurrence_insight', 'Orb_dream_card' -- add if planned).
        *   Order by `created_at` DESC. Add pagination support (e.g., `limit`, `offset` or cursor-based).
    2.  Refine/implement `GET /api/challenges/active`: Calls `ChallengeService.getActiveChallenges(userId)` which should use `UserChallengeRepository.findByUserId(userId, 'active')` and join with `ChallengeTemplate` to get template details.
    3.  Refine/implement `POST /api/challenges/:templateId/start`: Calls `ChallengeService.startChallenge(userId, templateId)`.
    4.  Refine/implement `POST /api/challenges/instances/:challengeInstanceId/complete`: Calls `ChallengeService.completeChallenge(userId, challengeInstanceId)`.
    5.  (New) Implement `GET /api/challenges/templates`: Calls `ChallengeTemplateRepository.getAllTemplates()`.
    6.  (New) Implement `POST /api/challenges/instances/:challengeInstanceId/progress`: Calls `ChallengeService.updateChallengeProgress(userId, challengeInstanceId, req.body.progressData)`.
    Ensure robust request validation (e.g., using Zod or similar) for all payloads and parameters."
*   **Expected Outcome:** API endpoints for insights and challenges are fully functional, secured, paginated where appropriate, and use proper validation.
*   **AI Tests:** Extend API tests (Postman/Newman/supertest) for each endpoint:
    *   Test pagination for `/api/dashboard/insights`.
    *   Test fetching active challenges and templates.
    *   Test starting, progressing, and completing challenges, verifying backend state changes.
    *   Test validation for incorrect payloads or parameters.
*   **Human Verification:**
    *   Use Postman to thoroughly test all listed endpoints.
    *   Verify pagination for insights.
    *   Seed various challenge templates. Use API to start challenges, update their progress (if `progressData` logic is simple), complete them. Check all DB tables (`user_challenges`, `growth_events`, `derived_artifacts`) for correctness.
*   **Dependencies:** S1.T2 (API Gateway base), S5.T9 (ChallengeService), S6.T2 (InsightEngine generating artifacts), S5.T8 (Challenge Repositories)

### 6.4. Workstream 4: UI Foundation & 3D Canvas Core

#### 6.4.1. Task S6.T4: UI - Dashboard Structure & Basic Data Display
*   **Significance:** Creates the central landing place for users, providing an overview of their activity, growth, and available actions.
*   **Cursor Prompt:** "In `apps/web-app/src/components/dashboard/Dashboard.tsx`, implement the UI structure based on `@V7UltimateSpec Section 4.2` and `v7UIUXDesign.md`.
    1.  Create sections: 'Greeting & Status', 'Cosmic Metrics', 'Active Journeys', 'Insight Discoveries', 'Growth Invitations'. Use `GlassmorphicPanel` for sections.
    2.  Greeting & Status: Display user's `display_name` (fetch from a user context/store if available, or a static greeting).
    3.  Cosmic Metrics: Display placeholders for 'Star Count', 'Constellation Map', 'Dimensional Balance', 'Luminosity Index', 'Transformation Markers'.
    4.  Data for 'Insight Discoveries' and 'Growth Invitations (Challenges)' will be populated by S6.T6 and S6.T7.
    5.  Ensure the dashboard modal can be opened/closed via `ModalStore` and is integrated into `ModalLayer.tsx`."
*   **Expected Outcome:** A `Dashboard.tsx` component is created with the specified sections and placeholder content. It can be opened as a modal.
*   **AI Tests:** Component tests for `Dashboard.tsx` to verify section structure and placeholder content. Test modal toggling.
*   **Human Verification:** Open the web app, trigger the dashboard modal (e.g., via HUD button if implemented, or dev tools). Verify all sections are present with placeholder text/graphics. Check glassmorphic styling.
*   **Dependencies:** S2.T2 (GlassmorphicPanel), UI State (`ModalStore`, `UserStore` stubs if needed).

### 6.5. Workstream 5: Orb Implementation (UI & Backend Link)

#### 6.5.1. Task S6.T8: Orb Contextual Prompts for Cards
*   **Significance:** Makes the Orb more interactive and helpful by providing context-aware suggestions related to the user's current focus, guiding them in their growth journey.
*   **Cursor Prompt:** "1. In `apps/web-app/src/components/cards/Card.tsx` (or `CardGallery.tsx` if focus is managed there): When a card gains focus (e.g., on click or significant hover), send an event or API call to the backend (e.g., `POST /api/dialogue/card-focus` with `cardId` and `cardType`).
    2.  In `DialogueAgent.ts` (`services/cognitive-hub/src/agents/dialogue/dialogue-agent.ts`):
        *   Implement a handler for this `card-focus` event/request.
        *   Call `CardService.getCardDetails(userId, cardId, cardType)`.
        *   Analyze the card's `growthDimensions`. If any dimension has `status` 'unactivated' or 'in_progress' and `progress < 1.0`, formulate a textual prompt related to that dimension (e.g., "This card is a Sprout. How about exploring its 'Know Self' dimension by reflecting on [a related question from config/template]?").
        *   Update the `OrbStateManager` to a new 'suggesting' or 'prompting' visual state (define this in `OrbStateManager` and implement visuals in `Orb.tsx` - e.g., Journey Gold highlights as per `@V7UltimateSpec Section 5.2.3`).
        *   Send the prompt text and the new Orb state back to the UI via WebSocket (preferred for real-time) or as part of the API response.
    3.  In the frontend (`apps/web-app`), display the received prompt. This could be in the `ChatInterface.tsx`, a temporary toast notification, or a dedicated UI element near the Orb or focused card."
*   **Expected Outcome:** When a user focuses on a card in the UI, the Orb changes its visual state, and a contextual prompt related to an underdeveloped growth dimension of that card is displayed.
*   **AI Tests:**
    *   Backend: Unit test the `DialogueAgent`'s focus handler logic (mock `CardService`).
    *   Frontend: Component test for displaying prompts.
    *   E2E stub: Simulate card focus event, mock backend response with a prompt and Orb state, verify UI updates.
*   **Human Verification:**
    1.  Ensure a card has some "unactivated" or "in_progress" dimensions.
    2.  In the Card Gallery, focus on/click such a card.
    3.  Observe the Orb: it should change its appearance (e.g., glow Journey Gold).
    4.  Observe the UI: a prompt related to one of the card's growth dimensions should appear (e.g., "This card about 'Creativity' is still a Sprout. Try adding a personal reflection to deepen your understanding in the 'Know Self' dimension.").
*   **Dependencies:** S6.T1 (CardService `getCardDetails`), S5.T7 (Orb state mechanism), S6.T9 (Chat UI, or create a new UI element for prompts)

### 6.6. Workstream 6: Card System (UI & Backend Link) - Continued

#### 6.6.1. Task S6.T7: UI - Display Insights on Dashboard
*   **Significance:** Makes the output of the Insight Engine visible to the user, providing them with potentially novel connections and patterns discovered in their data.
*   **Cursor Prompt:** "In `apps/web-app/src/components/dashboard/Dashboard.tsx`, within the 'Insight Discoveries' section:
    1.  Fetch insights by calling the `/api/dashboard/insights` endpoint (from S6.T3) when the dashboard is opened or refreshed.
    2.  Display each `DerivedArtifact` (insight) with its `title` and `description`.
    3.  Make each insight item clickable. For now, clicking can log to console or navigate to a placeholder page (e.g., `/insight/:artifactId`).
    Refer to `@V7UltimateSpec Section 4.2 (Dashboard)` for content ideas and `@V7UIUXDesign.md` for styling."
*   **Expected Outcome:** Recent insights generated by the `InsightEngine` are fetched from the API and displayed on the dashboard UI with their title and description.
*   **AI Tests:**
    *   Component tests for the insight display list, mocking the API response.
    *   `npm run dev`. After insights are generated (S6.T2), open the dashboard and verify insights are listed.
*   **Human Verification:**
    1.  Ensure the `InsightEngine` (S6.T2) has generated some `DerivedArtifacts` of type 'co_occurrence_insight' or 'potential_connection'.
    2.  Open the Dashboard in the web app.
    3.  Verify that the 'Insight Discoveries' section lists these insights, showing their titles and descriptions. Clicking them should log to console or go to a placeholder.
*   **Dependencies:** S6.T3 (API endpoint for insights), S6.T4 (Dashboard UI structure)

### 6.7. Workstream 4: UI Foundation & 3D Canvas Core

#### 6.7.1. Task S6.T9: UI - Chat Interface Component
*   **Significance:** Provides the primary text-based communication channel with Dot (the Dialogue Agent), enabling users to ask questions, provide input, and receive guidance.
*   **Cursor Prompt:** "Implement the `ChatInterface.tsx` component in `apps/web-app/src/components/chat/ChatInterface.tsx` as detailed in `@V7UltimateSpec Section 5.3.5`.
    1.  It should have a scrollable area for displaying messages and an input field with a send button.
    2.  Messages should be styled differently for 'user' and 'assistant' roles.
    3.  Create and use a `ChatStore.ts` (Zustand) to manage `messages: Message[]` (where `Message` includes `id`, `sender: 'user' | 'assistant'`, `content: string`, `timestamp`, `metadata?: any`), `chatStatus: 'idle' | 'thinking' | 'error'`, and `inputDisabled: boolean`.
    4.  When the user types and sends a message:
        *   Add the user's message to `ChatStore`.
        *   Set `chatStatus` to 'thinking', `inputDisabled` to `true`.
        *   Call the `/api/dialogue/message` endpoint (from S3.T8) with the message text.
    5.  On receiving a response from the API (or WebSocket in future):
        *   Add the assistant's message to `ChatStore`.
        *   Set `chatStatus` to 'idle', `inputDisabled` to `false`.
        *   If the response includes Orb state updates or suggestions, handle them (can be stubbed for now by logging).
    6.  Integrate `ChatInterface.tsx` into `ModalLayer.tsx` so it can be toggled visible/hidden."
*   **Expected Outcome:** A functional chat interface modal. Users can type messages, send them, and see their messages and Dot's responses displayed in a conversation format.
*   **AI Tests:**
    *   Component tests for `ChatInterface.tsx` (message rendering, input handling, mocking API calls and store interactions).
    *   `npm run dev`. Open chat modal, send messages, verify they appear, and responses from the (currently simple) Dialogue Agent are displayed. Check `ChatStore` state in React DevTools.
*   **Human Verification:**
    1.  Open the web app and show the chat modal.
    2.  Type a message and send it. Verify your message appears immediately.
    3.  Verify Dot's response (from S4.T3, which includes retrieved memory titles) appears after a short delay.
    4.  Check that the conversation history is maintained in the chat window.
*   **Dependencies:** S3.T8 (Dialogue API endpoint), `ModalLayer.tsx` (from `apps/web-app`), S4.T3 (Dialogue Agent providing dynamic responses)

---

## **Sprint 7: Full Scene Implementation & Advanced Orb Behavior (4 AI-Weeks)**

**Sprint Goal:** Bring the 3D environments to life with full visual fidelity and interactivity as per the UI/UX design. Implement advanced Orb shaders, animations, and context-aware behaviors. Refine UI interactions for a more polished experience.

---

### 7.1. Workstream 4: UI Foundation & 3D Canvas Core

#### 7.1.1. Task S7.T1: Implement CloudScene Visuals
*   **Significance:** Creates the first fully realized immersive environment, setting the reflective and calming tone for journaling and initial interactions.
*   **Cursor Prompt:** "Implement the full visual details of `CloudScene.tsx` in `apps/web-app/src/canvas/scenes/CloudScene/` as per `@V7UltimateSpec Section 3.2.1 & 5.2.2.1` and `v7UIUXDesign.md Section 3.2.1`. This includes:
    1.  Volumetric clouds: Implement using GPU-based ray marching shaders (refer to example in `@V7UltimateSpec Section 5.2.3`) or a library like `three-volumetric-clouds`. Ensure clouds are layered and have soft edges.
    2.  Dynamic Sky: Use `drei`'s `<Sky>` component, allowing parameters like `timeOfDay`, `turbidity`, `rayleigh` to be controlled by `SceneStore`.
    3.  Distant Mountains: Use parallaxed heightmap meshes or simple photogrammetry-like models.
    4.  Atmospheric Fog: Implement using `THREE.FogExp2` or a custom fog shader for more control.
    5.  Camera Path: Implement a slow, continuous diagonal drift (bottom-left to upper-right) with seamless looping.
    6.  Lighting: Directional light from upper-right, volumetric light rays through cloud breaks.
    7.  Color Palette: Implement Dawn Haze, Twilight Veil, Overcast Serenity palettes from `@V7UltimateSpec Section 3.2.1` and allow `SceneStore` to switch them.
    8.  (Optional) Floating Islands as described in `v7TechSpec.md Section 5.2.2.1` if time permits."
*   **Expected Outcome:** A visually rich and dynamic CloudScene that matches the design specification, with configurable time of day, weather (via cloud/fog params), and color palettes.
*   **AI Tests:** Visual inspection in Storybook (if a scene can be a story) or the main app. Test performance (FPS) across different quality settings if adaptive performance is partially implemented. Test changing time of day/palette via `SceneStore` (using React DevTools).
*   **Human Verification:** Launch the web app and navigate to the CloudScene. Verify:
    *   The visual fidelity of clouds, sky, and mountains.
    *   Smooth camera movement and looping.
    *   Correct atmospheric effects (fog, light scattering).
    *   Ability to (programmatically, via dev tools if no UI yet) change time of day/palette and see the scene update.
    *   Acceptable performance on target devices.
*   **Dependencies:** S2.T1 (basic R3F canvas), `SceneStore`

#### 7.1.2. Task S7.T2: Implement AscensionScene Visuals & Transition Logic
*   **Significance:** Creates a meaningful and visually engaging transition between the grounded CloudScene and the abstract GraphScene, reinforcing the journey into the user's "inner cosmos."
*   **Cursor Prompt:** "Implement `AscensionScene.tsx` in `apps/web-app/src/canvas/scenes/AscensionScene/` as per `@V7UltimateSpec Section 3.2.2 & 5.2.2.2` and `v7UIUXDesign.md Section 3.2.2`. Focus on:
    1.  **Transition Phases:**
        *   *Atmospheric Acceleration:* Layered, alpha-blended clouds rushing past.
        *   *Tunneling & Shear:* Clouds stretch, lens distortion effects.
        *   *Boundary Break / Flash:* Veil tear, bloom flash to white, then dark silence.
        *   *Arrival into Cosmic Layer:* Fading in parallax starfield and light fog.
    2.  **Camera Movement:** Vertical diagonal path with `easeInOutExpo` then `easeOutCirc` easing. Control camera Z/Y vector and speed multiplier.
    3.  **Visual Effects:** Volumetric noise shaders for clouds, speed line effects, lens distortion (e.g., using `ReactThreePostprocessing`), bloom effect for flash.
    4.  Update `SceneStore` to manage the `sceneTransitioning` state and potentially `transitionProgress` (0 to 1). The `SceneManager` should render `AscensionScene` when `sceneTransitioning` is true and the target is `graph` (or from `graph`)."
*   **Expected Outcome:** A smooth, visually compelling animated transition sequence when switching between CloudScene and GraphScene (and vice-versa). `SceneStore` correctly manages the transition state.
*   **AI Tests:** Visual inspection of the animation. Unit tests for `SceneStore` transition logic. Trigger transition programmatically and verify state changes and visual progression.
*   **Human Verification:** Implement temporary UI buttons to trigger transitions: "CloudScene -> GraphScene" and "GraphScene -> CloudScene". Click these buttons and observe:
    *   The distinct visual phases of the AscensionScene.
    *   Smooth camera movement and easing.
    *   Correct atmospheric and cosmic effects.
    *   Seamless hand-off to the target scene at the end of the transition.
*   **Dependencies:** S2.T1, S7.T1 (CloudScene elements might be reused/adapted for start of transition), S4.T4 (GraphScene shell for end of transition)

#### 7.1.3. Task S7.T3: Implement GraphScene Visuals - Node & Link Styling
*   **Significance:** Transforms the basic sphere-and-line graph into the "Cosmic Knowledge Graph" by applying distinct, meaningful visual styles to nodes and connections, making it more intuitive and aesthetically pleasing.
*   **Cursor Prompt:** "In `GraphScene.tsx` (`apps/web-app/src/canvas/scenes/GraphScene/`) and its sub-components (e.g., `ConceptNode.tsx`, `MemoryStar.tsx`, `ConnectionPathway.tsx`):
    1.  Implement distinct visual styles for different node types based on `@V7UltimateSpec Section 3.2.3 (GraphScene Visual Elements)` and `v7UIUXDesign.md Section 3.2.3`:
        *   **Memory Star:** Spherical orb with glow aura (e.g., using a combination of a core mesh and an outer, partially transparent shell with `THREE.AdditiveBlending`, or a post-processing bloom effect scoped to these nodes) and inner pulsing core (shader animation).
        *   **Concept Nebula/Node:** Volumetric cloud-like structure (e.g., using particle systems or volumetric shaders) with internal light sources.
    2.  Map node data attributes (fetched from `/api/graph/nodes`, e.g., `node.data.importance_score`, `node.data.creation_ts`, `node.type`) to visual properties like size, color (use design tokens from `@V7UltimateSpec Section 7.1`), glow intensity, and pulse speed.
    3.  Implement `ConnectionPathway`: Render links (fetched from `/api/graph/links` in S7.T4) as luminous lines/tubes with subtle directional flow (e.g., animated texture or shader). Thickness/pulsation should indicate relationship `weight`, and color should be based on `relationship_label` (map types to colors from design tokens)."
*   **Expected Outcome:** GraphScene displays nodes as "Memory Stars" or "Concept Nebulae" with varied appearances based on their data. Connections are rendered as luminous pathways with varying styles.
*   **AI Tests:** Component tests for individual node/link types with different data inputs. Visual inspection in GraphScene with sample data.
*   **Human Verification:** Ingest diverse data (different concept types, memories with varying importance). View GraphScene:
    *   Verify MemoryUnits look like "stars" and Concepts like "nebulae."
    *   Check if node size/color/glow varies based on attributes like importance or type.
    *   Observe connections: are they luminous? Do they vary (e.g., color) based on relationship type?
*   **Dependencies:** S4.T4 (basic GraphScene), S4.T5 (node data API), S7.T4 (link data API)

### 7.2. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 7.2.1. Task S7.T4: GraphService - Fetch Links for GraphScene
*   **Significance:** Provides the crucial relationship data from Neo4j that allows the GraphScene to draw connections between nodes, visualizing the structure of the knowledge graph.
*   **Cursor Prompt:** "In `GraphService.ts` (or cog-hub module), implement a method `async getGraphLinks(userId: string, visibleNodeIds?: string[]): Promise<{id: string, source: string, target: string, type: string, weight?: number, label?: string}[]>`. This method should:
    1.  Use `DatabaseService.getNeo4j()`.
    2.  Execute a Cypher query to fetch relationships (e.g., `:RELATED_TO`, `:HIGHLIGHTS`) between nodes visible to the user. If `visibleNodeIds` is provided, filter relationships to those connecting these nodes. Otherwise, fetch all relationships for the `userId`.
    3.  Map Neo4j relationship properties (`type(r)` as `type`, `r.weight` as `weight`, `r.relationship_label` as `label`) to the return structure. `source` and `target` should be node IDs.
    Expose this method via a new protected GET endpoint `/api/graph/links` in the API Gateway. Allow optional query parameters like `nodeIds`."
*   **Expected Outcome:** An API endpoint `/api/graph/links` that queries Neo4j and returns relationship data formatted for the GraphScene.
*   **AI Tests:**
    *   Unit tests for `GraphService.getGraphLinks` (mock Neo4j client).
    *   API integration test: After ingesting data with relationships (S4.T1), call `/api/graph/links` and verify it returns the expected link data.
*   **Human Verification:**
    1.  Ingest data that creates relationships in Neo4j (S4.T1).
    2.  Use Postman to call `/api/graph/links` (with authentication).
    3.  Verify the response is a JSON array of link objects, each with `id`, `source` (source node ID), `target` (target node ID), `type` (relationship type), and other relevant properties.
*   **Dependencies:** S1.T3 (DatabaseService with Neo4j), S4.T1 (data with relationships in Neo4j), S4.T5 (node data API, as links connect nodes)

#### 7.2.2. Task S7.T5: GraphScene - Force-Directed Layout & Basic Interaction
*   **Significance:** Implements the dynamic arrangement of nodes in the 3D space, making the graph understandable and navigable. Adds basic user interaction like selecting nodes.
*   **Cursor Prompt:** "In `GraphScene.tsx`:
    1.  Integrate a 3D force-directed layout engine (e.g., `d3-force-3d` adapted for R3F, or a physics engine like `react-three-rapier` or `use-cannon`). Initialize the simulation with nodes fetched from `/api/graph/nodes` and links from `/api/graph/links`.
    2.  Update node positions in the R3F scene on each tick of the simulation.
    3.  Implement basic node interaction:
        *   On hover: Highlight the node (e.g., increase glow, change color slightly).
        *   On click: Set the `focusedNodeId` in `GraphStore`. The `ConceptNode`/`MemoryStar` components should react to being focused (e.g., expand slightly, show more details or a label persistently)."
*   **Expected Outcome:** Nodes and links in GraphScene are dynamically arranged by a force-directed layout. Nodes respond to hover and click, with the clicked node being marked as 'focused' in the `GraphStore`.
*   **AI Tests:** Visual inspection: Nodes should spread out and not be perfectly static. Hovering and clicking nodes should produce visual feedback. Check `GraphStore.focusedNodeId` updates on click.
*   **Human Verification:**
    1.  Navigate to GraphScene. Nodes should arrange themselves in a spatial layout.
    2.  Hover over nodes: they should highlight.
    3.  Click a node: it should visually change to indicate focus (e.g., brighter, larger). Check React DevTools to see if `GraphStore.focusedNodeId` is updated.
*   **Dependencies:** S7.T3 (styled nodes/links), S7.T4 (link data API), S4.T4 (GraphStore)

### 7.3. Workstream 5: Orb Implementation (UI & Backend Link)

#### 7.3.1. Task S7.T6: Implement Advanced Orb Shaders & Material Layers
*   **Significance:** Transforms the Orb from a simple sphere into the complex, emotionally expressive entity described in the UI/UX specification, making it a central and engaging part of the user experience.
*   **Cursor Prompt:** "In `apps/web-app/src/orb/Orb.tsx` and associated GLSL shader files (e.g., `orbVertexShader.glsl`, `orbFragmentShader.glsl` in `apps/web-app/src/shaders/` or `packages/shader-lib/`):
    1.  Implement the material layers for the Orb as described in `@V7UltimateSpec Section 5.6.1` and `v7UIUXDesign.md Section 5.1`:
        *   **Core Layer:** Subsurface glowing center with volumetric light (use shader techniques like ray marching for inner glow or multiple blended layers).
        *   **Outer Shell:** Transparent/translucent glassy skin with Fresnel effect for edge glow and slight iridescence.
        *   **Aura/Halo:** Soft bloom/glow (can be post-processing or shader-based) with optional animated particles/shimmer.
    2.  Expose shader uniforms for dynamic control: `uTime`, `uEnergyLevel`, `uPulse`, `uBaseColor`, `uAccentColor`, `uNoiseScale`, `uNoiseIntensity`, `uGlowIntensity`, `uVoronoiScale` (as per `@V7UltimateSpec Section 5.6.2`).
    3.  Implement basic idle animations using `uTime` in shaders (e.g., gentle pulsing of core, slow swirling of aura).
    Refer to shader tips in `@V7UltimateSpec Section 5.6.2`."
*   **Expected Outcome:** The Orb in the UI has a visually rich, layered appearance with dynamic effects like pulsing, shimmering, and glowing, matching the design specification.
*   **AI Tests:** Visual inspection in Storybook or the app. Ensure shaders compile without errors. Test changing uniform values via React DevTools (if `OrbStore` is wired to these uniforms) to see visual changes.
*   **Human Verification:**
    1.  Observe the Orb in the UI. It should have a distinct core, shell, and aura.
    2.  Look for subtle idle animations (breathing, shimmering).
    3.  If possible, manually change shader uniform values (e.g., via dat.GUI or by modifying `OrbStore` values that control them) to test the range of visual effects.
*   **Dependencies:** S2.T6 (Orb MVP)

#### 7.3.2. Task S7.T7: Implement Orb State-Driven Visual Changes
*   **Significance:** Enables the Orb to visually communicate its current state and the AI's "emotions" or "intentions," making interactions more intuitive and engaging. This is a key part of the "Embodied Intelligence" design pillar.
*   **Cursor Prompt:** "In `Orb.tsx` and `OrbStateManager.ts`:
    1.  Map the logical Orb states (Idle, Listening, Insight, Emotional Moment, Progress/Growth, Thinking, Speaking, Analyzing, Dormant, Focusing, Transitioning, Celebrating – from `@V7UltimateSpec Section 5.6.3 & 5.6.4`) to specific sets of shader uniform values (colors, intensities, animation parameters for noise, pulse, glow, etc.). This mapping can be defined in `OrbStateManager` or a config file.
    2.  When `OrbStore.visualState` or `OrbStore.emotionalTone` changes, `Orb.tsx` should smoothly transition its shader uniforms to the new target values (e.g., using `react-spring` for interpolating uniform values or `gsap` if preferred, or direct `lerp` in `useFrame`).
    3.  Implement the specific motion patterns for Idle, Hovered/Focused, and Engaged states as per `@V7UltimateSpec Section 5.6.3` (e.g., Y-axis oscillation, scaling on hover, core pulse when engaged).
    The `DialogueAgent` should already be capable of setting these states via `OrbStateManager` (from S5.T7, S6.T8)."
*   **Expected Outcome:** The Orb's appearance (color, glow, material effects, motion) changes distinctly and smoothly when its state (e.g., `emotionalTone`, `visualState` in `OrbStore`) is updated by the backend `DialogueAgent`.
*   **AI Tests:**
    *   Unit tests for `OrbStateManager` state-to-visual-property mapping logic.
    *   In the UI, use React DevTools to change `OrbStore.visualState` and `OrbStore.emotionalTone`. Verify the Orb's visuals transition smoothly to reflect the new state as per the design specification.
*   **Human Verification:**
    1.  Trigger various interactions that change the Orb's state (e.g., start typing in chat, send a message, receive an insight if available).
    2.  Observe the Orb's visual transitions:
        *   **Idle:** Gentle pulsing, Nebula White.
        *   **Listening:** Reflection Amethyst, slow pulsing aura.
        *   **Thinking:** Internal swirling, concentrated energy.
        *   **Speaking:** Rhythmic pulsing synchronized with (mock) voice.
        *   **Insight:** Journey Gold, spark pulse.
    3.  Verify hover/focus interactions on the Orb itself.
*   **Dependencies:** S7.T6 (Advanced Orb Shaders), `DialogueAgent` capable of setting various states (S5.T7, S6.T8).

### 7.4. Workstream 4: UI Foundation & 3D Canvas Core

#### 7.4.1. Task S7.T8: Implement Full HUD Component
*   **Significance:** Provides the user with a consistent and accessible way to navigate main sections of the application and see key status information.
*   **Cursor Prompt:** "Fully implement the `HUD.tsx` component (`apps/web-app/src/components/layout/HUD.tsx`) as per `@V7UltimateSpec Section 5.3.6` and `v7UIUXDesign.md Section 4.3`.
    1.  **Top Nav:** Logo, Main Navigation (links to Dashboard, Card Gallery, GraphScene - these should trigger `SceneStore` or router actions), User Menu (placeholder for now).
    2.  **Side Nav:** Icon buttons for Card Gallery, Chat, Dashboard (toggle modals via `ModalStore`).
    3.  **Bottom HUD:** `GrowthDimensionSummary` component (displays a compact overview of user's 6D growth from `UserStore.growth_profile`), `SceneContext` (displays current scene name).
    4.  Ensure buttons trigger appropriate actions in `SceneStore` (for scene changes) or `ModalStore` (for opening modals)."
*   **Expected Outcome:** A fully functional HUD that allows navigation between scenes, toggling of modals (Chat, Dashboard, Card Gallery), and displays basic user/scene context.
*   **AI Tests:** Component tests for HUD elements and interactions (mocking store actions). E2E stubs: Click HUD buttons and verify `SceneStore` or `ModalStore` state changes.
*   **Human Verification:**
    *   Verify all HUD elements are present and styled according to design tokens.
    *   Clicking scene navigation buttons in HUD should transition to CloudScene/GraphScene (using AscensionScene if applicable).
    *   Clicking modal toggle buttons (Chat, Card Gallery, Dashboard) should open/close the respective modals.
    *   User's growth summary (even if basic from `users.growth_profile`) and current scene name should be visible.
*   **Dependencies:** S2.T1 (basic UI stores like SceneStore, ModalStore), S6.T4 (Dashboard modal), S6.T9 (Chat modal), S3.T4 (Card Gallery page/modal).

---

## **Sprint 8: Advanced Interactions, Polish & Initial Deployment Prep (4 AI-Weeks)**

*Goal: Refine interactions in GraphScene, implement more complex Insight Engine logic, polish UI animations and transitions, prepare for initial deployment with robust logging and basic admin functionalities.*

### 8.1. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 8.1.1. Task S8.T1: GraphScene - Node Expansion & Contextual Actions
*   **Significance:** Makes the GraphScene more interactive and useful by allowing users to delve deeper into individual nodes and perform actions directly from the graph.
*   **Cursor Prompt:** "Enhance `GraphScene.tsx` and its node components (`ConceptNode.tsx`, `MemoryStar.tsx`):
    1.  When a node is focused (clicked):
        *   The node should visually 'bloom' or expand slightly as per `@V7UltimateSpec Section 3.2.3 (Interaction)`.
        *   Display a small contextual panel or overlay near the focused node showing a brief summary (`description` or `preview`) and key attributes (e.g., `creation_ts`, `importance_score`).
        *   Provide contextual action buttons, e.g., 'View Details' (opens Card Modal for this node), 'Find Similar', 'Add Annotation'. (Stub these actions for now if backend isn't ready).
    2.  Implement highlighting of 1st and 2nd degree connections when a node is focused."
*   **Expected Outcome:** Focused nodes in GraphScene expand and show a contextual info panel with action buttons. Connected nodes are visually highlighted.
*   **AI Tests:** In GraphScene, click a node. Verify visual expansion, info panel display. Manually check if connected nodes are highlighted.
*   **Human Verification:** Click on a Memory Star or Concept Nebula in GraphScene.
    *   Verify it animates to a focused state (e.g., slight enlargement, brighter glow).
    *   A small panel should appear with its title/name, a snippet of its content/description.
    *   Buttons like "View Details" should be present (clicking might open the full Card Modal if S6.T5 is robust).
    *   Nodes directly connected to the focused node (and optionally 2nd-degree connections) should be visually highlighted (e.g., brighter links, highlighted nodes).
*   **Dependencies:** S7.T5 (GraphScene with basic interaction), S6.T5 (Card Modal for 'View Details')

#### 8.1.2. Task S8.T2: GraphScene - Constellation/Community Visualization
*   **Significance:** Visually represents higher-level structures (communities/clusters) within the knowledge graph, helping users see emergent themes and relationships.
*   **Cursor Prompt:** "Implement visualization for 'Constellations/Clusters' in `GraphScene.tsx` as per `@V7UltimateSpec Section 3.2.3`.
    1.  Modify `/api/graph/nodes` (or create a new endpoint `/api/graph/communities`) to include `community_id` for each node if it belongs to one (this data would come from `Concept.attributes.community_id` or a Neo4j community detection result).
    2.  In `GraphScene.tsx`, group nodes visually if they share the same `community_id`. This could be done by:
        *   Drawing a soft boundary/enclosure around nodes in the same community (e.g., using a transparent, glowing mesh that encompasses them).
        *   Applying a subtle shared visual treatment (e.g., a common background hue or particle effect) to nodes within the same community.
    The community detection itself (backend) can still be basic or stubbed by `InsightEngine` for now, but the UI should be ready to render based on `community_id`."
*   **Expected Outcome:** Nodes belonging to the same community are visually grouped or distinguished in the GraphScene.
*   **AI Tests:** Mock backend data to include `community_id` for several nodes. Verify these nodes are visually grouped in the GraphScene.
*   **Human Verification:**
    1.  Manually assign `community_id`s to some concept nodes in the database (via Prisma Studio or direct SQL/Cypher update on their attributes/properties).
    2.  Ensure the API (`/api/graph/nodes`) returns this `community_id`.
    3.  View GraphScene. Nodes with the same `community_id` should have some visual indication of their grouping (e.g., a faint colored aura around the group, or a subtle background highlight).
*   **Dependencies:** S7.T5 (GraphScene rendering nodes), API endpoint providing `community_id` per node.

### 8.2. Workstream 2: Cognitive Agents & Tools

#### 8.2.1. Task S8.T3: Insight Engine - Temporal & Correlation Analysis (Basic)
*   **Significance:** Expands the Insight Engine's capabilities to find time-based patterns and correlations, offering users deeper understanding of their evolving thoughts and behaviors.
*   **Cursor Prompt:** "Enhance `InsightEngine.ts`:
    1.  Add a new method `discoverTemporalPatterns(userId)`. This method should query `growth_events` for the user, looking for:
        *   Cyclical patterns: e.g., 'self_know' events frequently occurring on weekends (requires grouping events by day of week/month).
        *   Evolving themes: e.g., a `Concept` (like 'Project X') having increasing `growth_events` over the past month.
    2.  (If user opts-in to tracking simple metrics like mood): Add a method `discoverCorrelations(userId)`. This would require a new table like `user_metrics (user_id, metric_name, value, timestamp)`. If mood is high when `Concept` 'Exercise' related `MemoryUnit`s are created, generate an insight.
    3.  For any discovered patterns/correlations, create `DerivedArtifact`s of type 'temporal_pattern' or 'correlation_insight'.
    Use `stats.correlate` and `stats.trend` tool stubs for now (to be implemented later if complex)."
*   **Expected Outcome:** `InsightEngine` can identify basic temporal patterns and correlations from `growth_events` (and `user_metrics` if implemented) and store them as `DerivedArtifacts`.
*   **AI Tests:** Unit tests for pattern detection logic (mocking DB queries). Integration test: Seed `growth_events` with clear patterns, run engine, verify `DerivedArtifacts`.
*   **Human Verification:**
    1.  Seed `growth_events` data demonstrating a temporal pattern (e.g., many 'self_act' events on Mondays for a few weeks).
    2.  Manually trigger the `discoverTemporalPatterns` method.
    3.  Check `derived_artifacts` table for new insights describing these patterns.
*   **Dependencies:** S6.T2 (Insight Engine basics), S5.T1 (GrowthEvent table)

#### 8.2.2. Task S8.T4: Ontology Steward - Basic Schema Governance UI/API
*   **Significance:** Provides a mechanism (even if basic) for managing the controlled vocabularies (`Concept.type`, `relationship_label`), which is crucial for maintaining consistency and quality in the knowledge graph.
*   **Cursor Prompt:** "1. Create a new service/module for `OntologySteward`.
    2.  Implement API endpoints (e.g., in `api-gateway` under `/api/ontology`):
        *   `GET /types`: Returns current list of allowed `Concept.type` values (from config/Redis).
        *   `GET /relationship-labels`: Returns current list of allowed `relationship_label` values (from config/Redis).
        *   (Admin only) `POST /types/suggest`: Allows suggesting a new concept type. (For now, just log it).
    3.  The `IngestionAnalyst` and `InsightEngine`, when generating concepts or relationships, should validate types/labels against these lists (fetched on startup or periodically). If a new type/label is encountered, it can be temporarily used but flagged for review by the Ontology Steward (e.g., logged to a special table or queue)."
*   **Expected Outcome:** API endpoints to view ontology terms. Agents flag new/unrecognized terms for review. (Full UI for management is out of scope for this sprint).
*   **AI Tests:** API tests for GET endpoints. Unit tests for agent logic that flags new terms.
*   **Human Verification:**
    1.  Call `GET /api/ontology/types` and `/api/ontology/relationship-labels` via Postman; verify they return predefined lists.
    2.  Modify `IngestionAnalyst` temporarily to try and create a concept with a new, unlisted type. Check logs to see if it's flagged.
*   **Dependencies:** S2.T3 (OntologySteward stub), Configuration mechanism for vocabularies (e.g., Redis or config files).

### 8.3. Workstream 5: Orb Implementation (UI & Backend Link)

#### 8.3.1. Task S8.T5: Orb Scene-Specific Behaviors
*   **Significance:** Makes the Orb feel more integrated and responsive to the user's current context by adapting its behavior to different scenes (Cloud, Ascension, Graph).
*   **Cursor Prompt:** "Implement scene-specific behaviors for the Orb in `Orb.tsx` and `OrbStateManager.ts`, based on `@V7UltimateSpec Section 5.6.4`:
    *   **CloudScene:** Orb floats gently, soft glow, whispers reflective prompts (can be pre-defined, triggered randomly or by `DialogueAgent`).
    *   **AscensionScene:** Orb transforms (e.g., elongates to comet shape or dissolves into particles), leads camera, mostly silent.
    *   **GraphScene:** Re-materializes, orbits/follows cursor, adapts glow to user emotion (from `OrbStore`), whispers insights about focused nodes (triggered by `DialogueAgent`).
    The `SceneStore.activeScene` should influence `OrbStateManager` or be read by `Orb.tsx` to apply these behaviors."
*   **Expected Outcome:** The Orb's appearance and ambient behavior change noticeably and appropriately when the user transitions between CloudScene, AscensionScene, and GraphScene.
*   **AI Tests:** In the UI, switch between scenes. Observe Orb's visual changes and any ambient behaviors (e.g., movement patterns, idle animations) specific to each scene.
*   **Human Verification:**
    *   **CloudScene:** Orb should be serene, perhaps with gentle floating.
    *   **AscensionScene:** Orb should visually transform and appear to guide the ascent/descent.
    *   **GraphScene:** Orb should be more active, perhaps subtly reacting to cursor movement or graph interactions.
*   **Dependencies:** S7.T1, S7.T2, S7.T3 (Scene implementations), S7.T7 (Orb state-driven visuals)

### 8.4. Workstream 4: UI Foundation & 3D Canvas Core

#### 8.4.1. Task S8.T6: UI Polish - Transitions and Animations
*   **Significance:** Enhances the overall user experience by making UI interactions smoother, more intuitive, and visually appealing, reinforcing the "luxurious minimalism" and "amorphous design" principles.
*   **Cursor Prompt:** "Review and refine UI animations and transitions across the `apps/web-app` based on `@V7UltimateSpec Section 3.2 (Visual Design Language - Motion & Animation)` and `v7UIUXDesign.md Section 2.4`. Focus on:
    1.  **Modal Transitions:** Smooth entry/exit for Card Gallery, Dashboard, Chat modals (e.g., scale/opacity fades using Framer Motion).
    2.  **Card Animations:** Subtle hover effects, selection indication, and refine flip animation (S6.T5).
    3.  **HUD Interactions:** Smooth expansion/collapse of dashboard from HUD, subtle feedback on button clicks.
    4.  Ensure animations are interruptible and performant."
*   **Expected Outcome:** UI interactions feel more fluid and polished due to improved animations and transitions.
*   **AI Tests:** Visual inspection of animations. Performance profiling during animations.
*   **Human Verification:** Interact with various UI elements: open/close modals, hover/click cards, use HUD controls. Animations should be smooth, aesthetically pleasing, and not jarring.
*   **Dependencies:** S6.T5, S6.T4, S6.T9, S7.T8 (existing UI elements)

### 8.5. Workstream 8: DevOps & Infrastructure

#### 8.5.1. Task S8.T7: Basic Logging and Monitoring Setup
*   **Significance:** Implements foundational logging and monitoring, which is essential for debugging, understanding system behavior, and identifying performance bottlenecks as the system grows.
*   **Cursor Prompt:** "Integrate a basic logging solution (e.g., Pino or Winston) into the `api-gateway` and `cognitive-hub` (or individual agent services).
    1.  Ensure structured logging (JSON format).
    2.  Log key events: API requests/responses, errors, agent processing steps, database queries (if supported by ORM/drivers).
    3.  Set up basic application performance monitoring (APM) stubs. If using a cloud provider like AWS, explore initial setup for CloudWatch Logs and basic metrics. For local dev, log to console/file.
    Refer to `@V7UltimateSpec Section 9.4 (Monitoring & Observability)` for long-term goals."
*   **Expected Outcome:** Backend services produce structured logs. Basic error and request/response logging is in place.
*   **AI Tests:** Trigger API requests and agent actions. Verify logs are generated with relevant information. Induce an error and check error logging.
*   **Human Verification:** Start services locally. Make API calls. Check console output or log files for structured log entries. Intentionally cause an error (e.g., bad request) and verify it's logged with a stack trace.
*   **Dependencies:** S1.T2, S2.T3

#### 8.5.2. Task S8.T8: Initial Terraform Modules for Core Services
*   **Significance:** Begins the process of defining infrastructure as code, which is crucial for repeatable and reliable deployments to cloud environments.
*   **Cursor Prompt:** "In `infrastructure/modules/`, create basic Terraform modules for:
    1.  **VPC:** A simple VPC with public/private subnets.
    2.  **ECS Cluster (AWS) / TKE Cluster (Tencent):** Basic cluster definition.
    3.  **RDS PostgreSQL (AWS) / TencentDB for PostgreSQL (Tencent):** Basic instance definition.
    4.  **ElastiCache Redis (AWS) / Tencent Cloud Redis (Tencent):** Basic instance definition.
    These modules should be configurable via variables (e.g., region, instance size). Do not deploy yet, focus on defining the modules. Create separate directories for AWS (`infrastructure/env-aws`) and Tencent (`infrastructure/env-tencent`) that would eventually use these modules. Refer to `@V7UltimateSpec Section 9.1`."
*   **Expected Outcome:** Terraform module files (`.tf`) created in `infrastructure/modules/` for VPC, ECS/TKE, PostgreSQL, and Redis. Root configuration directories for AWS and Tencent created.
*   **AI Tests:** Run `terraform validate` in each module directory and in the `env-aws`/`env-tencent` directories (after creating minimal root configurations that use the modules).
*   **Human Verification:** Review the Terraform code for correctness and adherence to best practices for each cloud provider. Ensure variables are used for customization. The code should be logically sound, even if not yet deployed.
*   **Dependencies:** S0.T1

---

This roadmap now covers Sprints 0 through 8. Subsequent sprints would focus on:
*   **Full 3D Scene Interactivity:** Deep linking GraphScene nodes to Card Modals, advanced camera controls.
*   **Advanced Insight Engine Features:** Metaphorical connections, "Orb's Dream Cards," proactive insight delivery.
*   **Mobile App Development:** Starting with core features and adapting the UI.
*   **Refined AI & LLM Integration:** Fine-tuning prompts, implementing more sophisticated LLM tool use, regional model switching.
*   **Ontology Steward Full Implementation:** UI for managing vocabularies, automated term suggestion.
*   **User Personalization:** Adapting UI, prompts, and insights to individual user preferences and history.
*   **Comprehensive Testing:** End-to-end, performance, security, and usability testing.
*   **Deployment & Scaling:** Full CI/CD pipeline, deploying to AWS/Tencent, load testing, and scaling strategies.
*   **Multi-modal Input Processing:** Handling images, audio more deeply.
*   **Advanced Gamification:** More complex challenges, rewards, and progression systems.

Each new feature or refinement would be broken down into similar granular, AI-promptable tasks across the relevant workstreams.

Okay, let's continue with the detailed implementation roadmap for Sprints 9 and 10, focusing on advancing the UI/UX, deepening AI capabilities, and preparing for a more robust system.

---

## **Sprint 9: Advanced Graph Interactions, Refined Insights, & Mobile Foundation (4 AI-Weeks)**

**Sprint Goal:** Enhance GraphScene interactivity, improve the quality and presentation of insights, implement core data synchronization for a mobile MVP, and refine agent logic based on initial testing and feedback.

---

### 9.1. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 9.1.1. Task S9.T1: GraphScene - Dynamic Loading & LOD for Large Graphs
*   **Significance:** Ensures the GraphScene remains performant and usable even as the user's knowledge graph grows significantly by loading and rendering only necessary data.
*   **Cursor Prompt:** "Implement dynamic loading and Level of Detail (LOD) for `GraphScene.tsx`:
    1.  **Dynamic Loading:** Modify `GraphService.getGraphNodes` and `GraphService.getGraphLinks` (and their API endpoints `/api/graph/nodes`, `/api/graph/links`) to support fetching nodes/links within a certain distance of a 'focus' node or within the current camera frustum. The frontend `GraphScene` should request new data as the user pans/zooms to unexplored areas.
    2.  **LOD for Nodes:** In `ConceptNode.tsx`/`MemoryStar.tsx`, implement LODs. Faraway nodes should render as simpler geometries (e.g., sprites or billboards instead of full 3D meshes), or their details (like labels) should be culled. Use `drei`'s `<Detailed>` component or implement custom distance-based switching.
    3.  **LOD for Links:** Faraway or less important links could be thinner or have simpler materials.
    Refer to `@V7UltimateSpec Section 5.2.2.3 (GraphScene - Performance Optimization)`."
*   **Expected Outcome:** GraphScene performance is maintained with larger datasets. Nodes and links dynamically load/unload or change detail based on camera position and zoom.
*   **AI Tests:** Simulate a large graph (e.g., mock API to return thousands of nodes/links). Verify that only a subset is rendered initially and more load as the user navigates. Test FPS.
*   **Human Verification:**
    1.  Load a graph with a significant number of nodes (test with 1000+ if possible, potentially by scripting data generation).
    2.  Pan and zoom around the graph. Observe network requests to see if new data is fetched dynamically.
    3.  Verify that nodes in the distance are simplified or culled, and detail increases as you zoom in.
    4.  Performance should remain acceptable.
*   **Dependencies:** S7.T5 (GraphScene with basic layout), S7.T4 (GraphService for nodes/links)

#### 9.1.2. Task S9.T2: GraphScene - Search & Filter Functionality
*   **Significance:** Allows users to easily find specific nodes or types of nodes within their knowledge graph, enhancing discoverability.
*   **Cursor Prompt:** "Implement search and filtering capabilities in `GraphScene.tsx`:
    1.  Add UI elements (e.g., a search bar within the HUD or a floating panel) for text search and filters (e.g., by node type, date range, tag).
    2.  When a search/filter is applied, call a new API endpoint (e.g., `/api/graph/search`) in `GraphService`.
    3.  The backend `GraphService` method should query Neo4j (and potentially PostgreSQL for metadata) to find matching nodes. Consider using Neo4j's full-text search capabilities if applicable.
    4.  `GraphScene` should update to highlight matching nodes and dim non-matching ones, or filter the view to only show matches. The force-directed layout might need to be re-run or adjusted."
*   **Expected Outcome:** Users can search for nodes by text and apply filters in the GraphScene, with the visualization updating to reflect the results.
*   **AI Tests:** Unit tests for `GraphService` search logic. Component tests for search/filter UI. E2E stub: Input search term, mock API response, verify graph highlights/filters.
*   **Human Verification:**
    1.  Ingest diverse data.
    2.  Use the new search bar in GraphScene to search for a specific concept or memory by name/keyword. Verify matching nodes are highlighted or filtered.
    3.  Apply filters (e.g., "show only :Concept nodes"). Verify the display updates accordingly.
*   **Dependencies:** S7.T5, `GraphStore` for managing filter state.

### 9.2. Workstream 2: Cognitive Agents & Tools

#### 9.2.1. Task S9.T3: Insight Engine - Metaphorical Connection Discovery (MVP)
*   **Significance:** Introduces a more creative form of insight by attempting to find analogical relationships between different domains of the user's knowledge, as envisioned in `@V7UltimateSpec Section 3.4`.
*   **Cursor Prompt:** "Enhance `InsightEngine.ts`:
    1.  Add a new method `discoverMetaphoricalConnections(userId)`.
    2.  This method should (as an MVP):
        *   Fetch pairs of `Concept` nodes from different `Concept.attributes.type` domains (e.g., a 'personal_trait' and an 'artwork').
        *   For each pair, retrieve their descriptions and a few related `MemoryUnit` previews.
        *   Use an LLM tool (`llm.hypothesize` or `llm.generate_text` with a specific prompt) to evaluate if a metaphorical connection can be drawn and to generate a brief explanation of that metaphor. Prompt: 'Can [Concept A description] be a metaphor for [Concept B description]? If so, explain how in one sentence. Context for A: [Memory previews A]. Context for B: [Memory previews B].'
        *   If the LLM suggests a plausible metaphor with sufficient confidence (add simple confidence scoring based on LLM output keywords if possible), create a `DerivedArtifact` of type 'metaphorical_insight'.
    Refer to `@V7UltimateSpec Section 3.4 (Metaphorical Connection Discovery)`."
*   **Expected Outcome:** The Insight Engine can generate `DerivedArtifacts` representing potential metaphorical connections between disparate concepts.
*   **AI Tests:** Unit tests for the logic (mock LLM and DB calls). Integration test: Seed concepts from different domains, run the engine, verify `DerivedArtifact` creation for 'metaphorical_insight'.
*   **Human Verification:**
    1.  Ensure concepts from different domains exist (e.g., a 'personal_trait' like "Resilience" and an 'artwork' like "The Starry Night").
    2.  Trigger `discoverMetaphoricalConnections`.
    3.  Check `derived_artifacts` table. Look for insights suggesting metaphors, e.g., "Insight: 'Resilience' can be seen as a metaphor for 'The Starry Night' because both depict beauty emerging from turbulence."
*   **Dependencies:** S6.T3 (Insight Engine generating basic insights), S4.T8 (LLM integration for Dialogue Agent can be adapted/reused).

#### 9.2.2. Task S9.T4: Ontology Steward - Term Suggestion & Review Workflow (Backend)
*   **Significance:** Formalizes the process for evolving the knowledge graph's schema by allowing new terms to be suggested and reviewed, ensuring consistency.
*   **Cursor Prompt:** "Enhance `OntologySteward.ts` (or its service):
    1.  Implement a method `suggestTerm(userId, term, termType, examples, context)`:
        *   This method will be called by other agents (e.g., Ingestion Analyst) when they encounter a new potential `Concept.type` or `relationship_label`.
        *   It should store the suggestion in a new PostgreSQL table, e.g., `ontology_suggestions (suggestion_id UUID PK, term TEXT, term_type TEXT, suggested_by_user_id UUID, examples JSONB, context TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ)`.
    2.  Implement methods for an admin to review suggestions: `getPendingSuggestions()`, `approveSuggestion(suggestionId, officialTerm, definition)`, `rejectSuggestion(suggestionId, reason)`, `mapSuggestion(suggestionId, existingTermId)`.
    3.  Approved terms should be added to the canonical vocabulary (stored in Redis or a config file that agents reload).
    Refer to `@V7UltimateSpec Section 3.5 (Ontology Steward)`."
*   **Expected Outcome:** Backend mechanisms for suggesting, storing, and (stub) reviewing new ontological terms.
*   **AI Tests:** Unit tests for `OntologySteward` methods. Integration test: Simulate `IngestionAnalyst` suggesting a new term, verify it's stored in `ontology_suggestions`. Test approval/rejection logic (verify config/Redis update).
*   **Human Verification:**
    1.  Manually trigger (via test script) `suggestTerm` from a mock agent. Verify entry in `ontology_suggestions`.
    2.  Manually call (via test script) `approveSuggestion`. Verify the term is added to the vocabulary list (e.g., in Redis or a logged config file).
*   **Dependencies:** S8.T4 (Basic Ontology API/config)

### 9.3. Workstream 6: Card System (UI & Backend Link)

#### 9.3.1. Task S9.T5: UI - Advanced Card Interactions (Annotations, Linking)
*   **Significance:** Allows users to directly enrich their knowledge graph from the card interface by adding annotations and creating new relationships between cards.
*   **Cursor Prompt:** "Enhance `Card.tsx` (specifically the back/detail view):
    1.  Add an 'Add Annotation' feature:
        *   UI: A button/input field to add a textual annotation to the current card.
        *   API: Call a new endpoint `/api/annotations` (POST) in `api-gateway`, which routes to an `AnnotationService` (new or part of `CardService`) to create an `Annotation` record in PostgreSQL linked to the card (`target_id`, `target_node_type`).
        *   Display existing annotations for the card.
    2.  Add a 'Link to Another Card' feature:
        *   UI: A button that opens a simple search/picker for other cards.
        *   API: On selecting another card and specifying a relationship type (dropdown with types from `OntologySteward`), call `/api/cards/connect` (POST) endpoint (from S6.T5.3 in `v7TechSpec.md`, implemented in `CardService`).
    Reference `@V7UltimateSpec Section 7.2 (API - Annotation & Feedback)` for API design ideas."
*   **Expected Outcome:** Users can add text annotations to cards and create new relationships between cards directly from the card detail view.
*   **AI Tests:**
    *   Component tests for annotation input and display.
    *   E2E stub: Add an annotation, mock API call, verify UI updates. Attempt to link cards, mock API, verify selection.
*   **Human Verification:**
    1.  Open a card's detail view. Add an annotation. Verify it's saved (check `annotations` table) and displayed.
    2.  Use the 'Link to Another Card' feature. Search for another card, select a relationship type, and create the link. Verify the relationship is created in Neo4j and reflected in the `connection_count` on the card (after refresh/update).
*   **Dependencies:** S6.T5 (Card detail view), S1.T1 (Annotation model), `CardService.createConnection` (from V7TechSpec, may need explicit creation in CardService and API Gateway)

### 9.4. Workstream 4: UI Foundation & 3D Canvas Core

#### 9.4.1. Task S9.T6: Mobile - Basic App Shell & API Connectivity
*   **Significance:** Initiates the mobile application development, setting up the basic project structure and ensuring it can communicate with the backend API.
*   **Cursor Prompt:** "In `apps/mobile-app` (as per `@V7UltimateSpec Section 8.1`), initialize a new React Native project (e.g., using Expo or React Native CLI).
    1.  Set up basic navigation (e.g., React Navigation) with placeholder screens for Login, Dashboard, and Card Gallery.
    2.  Implement the API client (similar to `apps/web-app/src/lib/api/` from S5.T10 of original spec or create new) to connect to the `/api/auth/login` endpoint.
    3.  Implement a basic Login screen that allows users to authenticate. On successful login, store the JWT securely (e.g., `expo-secure-store`).
    4.  Create a placeholder Dashboard screen that attempts to fetch user profile data from `/api/me` using the stored JWT."
*   **Expected Outcome:** A basic React Native app shell with login functionality. Able to authenticate with the backend and fetch basic user data.
*   **AI Tests:** Build and run the app on an emulator/device. Test login. Verify JWT is stored. Verify dashboard screen attempts to fetch data.
*   **Human Verification:**
    1.  Build and run the mobile app.
    2.  Log in with existing user credentials. Verify successful login and navigation to a placeholder dashboard.
    3.  Check if the app can make authenticated requests to `/api/me`.
*   **Dependencies:** S1.T2 (Auth API endpoints)

---

## **Sprint 10: UI Polish, Advanced Orb Interactions, & Initial Deployment Prep (4 AI-Weeks)**

**Sprint Goal:** Focus on refining the user experience with polished UI, advanced Orb interactions including voice, and comprehensive error handling. Begin preparations for an initial deployment, including more robust logging and basic admin functionalities.

---

### 10.1. Workstream 5: Orb Implementation (UI & Backend Link)

#### 10.1.1. Task S10.T1: Orb - Advanced Motion & Physics
*   **Significance:** Makes the Orb feel more alive and responsive by incorporating natural, physics-based movements and more nuanced reactions to user interactions and scene context.
*   **Cursor Prompt:** "Enhance `Orb.tsx` and its associated animation logic:
    1.  Implement 'Natural Easing & Physics' for Orb movements as per `@V7UltimateSpec Section 3.2.4 (Motion & Animation)`. Use `react-spring` or `framer-motion`'s physics-based animations for smoother transitions between positions or states.
    2.  Implement subtle 'Atmospheric Presence' animations: Orb's gentle breathing (slow scale pulse), background particle drifts (if particles are part of Orb's aura).
    3.  Refine hover/focus animations from S7.T7: make them feel more responsive and organic.
    4.  Implement the 'Deep Reflection State' motion: Orb lowers slightly, glow dims but warms, rotation slows further, as per `@V7UltimateSpec Section 5.6.3`."
*   **Expected Outcome:** Orb's movements and state transitions are smoother, more natural, and more expressive.
*   **AI Tests:** Visual inspection of Orb animations in various states (idle, hover, engaged, deep reflection). Check for jank or unnatural movements.
*   **Human Verification:** Interact with the Orb and navigate the UI. Observe the Orb's movements. They should feel fluid and responsive, not jerky. The "deep reflection" state should be visually distinct when triggered by the `DialogueAgent`.
*   **Dependencies:** S7.T7 (Orb state-driven visuals)

#### 10.1.2. Task S10.T2: Orb - Basic Voice Input & Output Integration
*   **Significance:** Introduces voice interaction, a key modality for natural communication with Dot, making the system more accessible and intuitive.
*   **Cursor Prompt:** "Integrate basic voice input and output for the Orb:
    1.  **Input (Frontend):** In `ChatInterface.tsx` or a dedicated HUD button, add a microphone icon. On click, use the browser's Web Speech API (`SpeechRecognition`) to capture user voice input. Transcribe the speech to text and send it to the `/api/dialogue/message` endpoint.
    2.  **Output (Frontend):** When the `DialogueAgent` sends a text response, use the browser's Web Speech API (`SpeechSynthesis`) to speak Dot's response aloud. Add a UI toggle to enable/disable voice output.
    3.  **Orb Visuals:** When the Orb is 'speaking' (text-to-speech active), its `isSpeaking` state in `OrbStore` should be true, triggering appropriate visual cues in `Orb.tsx` (e.g., mouth-like animation or synchronized pulsing from S7.T7/S8.T5)."
*   **Expected Outcome:** User can speak to Dot, and Dot's text responses are spoken aloud. Orb visually indicates when it's speaking.
*   **AI Tests:** Unit tests for speech-to-text and text-to-speech utility functions. E2E: Click mic, speak, verify text sent to backend. Verify backend text response is spoken.
*   **Human Verification:**
    1.  Click the microphone icon, speak a query. Verify the transcribed text appears in the chat input and is sent.
    2.  Verify Dot's text response is also spoken by the browser.
    3.  Observe the Orb's visual changes when it's "speaking."
    4.  Test the toggle for enabling/disabling voice output.
*   **Dependencies:** S6.T9 (Chat Interface), `DialogueAgent` providing text responses.

### 10.2. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 10.2.1. Task S10.T3: GraphScene - Constellation Completion Visuals
*   **Significance:** Provides rewarding visual feedback when users complete meaningful clusters of related concepts, reinforcing the gamification and exploration aspects.
*   **Cursor Prompt:** "In `GraphScene.tsx`:
    1.  When a 'constellation' (a community of nodes) is deemed 'complete' by the `InsightEngine` (e.g., a `DerivedArtifact` of type 'constellation_completed' is created for that `community_id`), the frontend should be notified (e.g., via WebSocket event or by polling an insights endpoint).
    2.  On notification, trigger a special visual effect for that constellation in the `GraphScene` as per `@V7UltimateSpec Section 4.1.1 (Card System Gamification - Constellation Completion)`. This could involve:
        *   Temporarily highlighting all nodes in the constellation.
        *   Drawing more prominent or animated `ConnectionPathway`s between them.
        *   A subtle particle effect or glow around the constellation boundary.
    3.  The `InsightEngine` needs a method to determine 'constellation completion' (e.g., based on number of nodes, density of connections, or specific challenge completion related to the community). This can be a stub for now, manually triggerable for UI testing."
*   **Expected Outcome:** Completed constellations in the GraphScene are visually celebrated with special effects.
*   **AI Tests:** Manually trigger a 'constellation_completed' event/state for a known community ID. Verify the GraphScene applies the specified visual effects to that group of nodes.
*   **Human Verification:**
    1.  Identify or create a cluster of nodes that can be considered a "constellation."
    2.  Manually trigger the backend logic (or simulate the event) that marks this constellation as complete.
    3.  Observe the GraphScene: the nodes and links within that constellation should have a temporary, distinct visual celebration.
*   **Dependencies:** S8.T2 (Community visualization basics), `InsightEngine` able to identify/flag completed constellations.

### 10.3. Workstream 6: Card System (UI & Backend Link)

#### 10.3.1. Task S10.T4: Card System - "Orb's Dream Cards" & "Mystery Challenges" Display
*   **Significance:** Introduces elements of serendipity and playful discovery into the card system, making the experience more engaging and less predictable.
*   **Cursor Prompt:** "1. Modify `InsightEngine` to sometimes generate `DerivedArtifact`s with `artifact_type` 'orb_dream_card' (e.g., an unusual connection between two random concepts with a whimsical description) and 'mystery_challenge' (a challenge template with a vague description, where the true goal/reward is hidden until completion).
    2.  In `CardService.getCards` and `Card.tsx`:
        *   Ensure these new `DerivedArtifact` types are fetched and can be rendered as cards.
        *   'Orb's Dream Cards' should have a distinct visual style (e.g., more ethereal, different border).
        *   'Mystery Challenge' cards should clearly indicate their enigmatic nature.
    3.  When a 'Mystery Challenge' is completed (via `ChallengeService.completeChallenge`), the `DerivedArtifact` representing its reward should be revealed, and the original challenge card might update to show what was achieved."
*   **Expected Outcome:** The Card Gallery can display "Orb's Dream Cards" and "Mystery Challenges" with unique styling. Completing a mystery challenge reveals its purpose/reward.
*   **AI Tests:**
    *   Manually create `DerivedArtifacts` of these new types in the DB. Verify they are fetched and displayed correctly in the Card Gallery.
    *   Test the completion flow for a 'Mystery Challenge'.
*   **Human Verification:**
    1.  Have the `InsightEngine` (or manually create) an 'orb_dream_card' and a 'mystery_challenge' template.
    2.  View the Card Gallery: these special cards should be visually distinct.
    3.  Start and complete the 'Mystery Challenge'. Verify that any associated reward artifact is created/revealed and the challenge card updates appropriately.
*   **Dependencies:** S6.T3 (Insight API), S6.T6 (Challenge UI), S5.T9 (ChallengeService), `DerivedArtifactRepository`.

### 10.4. Workstream 1: Core Backend & Data Models

#### 10.4.1. Task S10.T5: Data Archiving & Pruning Strategy (Design & Stubs)
*   **Significance:** Plans for long-term data management by defining how older or less relevant data will be handled, ensuring the system remains performant and cost-effective over time.
*   **Cursor Prompt:** "Design and document a strategy for archiving and pruning data, particularly for `growth_events`, `conversation_messages`, and old `memory_units` that are not frequently accessed. Refer to `@V7UltimateSpec Section 5.1.5 (Archiving for PostgreSQL)`.
    1.  Define criteria for data to be archived (e.g., events older than 1 year, memories not accessed in 2 years).
    2.  Outline the process (e.g., moving to slower/cheaper storage like S3 Glacier, or a separate 'archive' database).
    3.  Create placeholder scripts or service stubs in `workers/scheduler/` for these archiving jobs. For now, these stubs can just log what they *would* do."
*   **Expected Outcome:** A document outlining the data archiving/pruning strategy. Placeholder scripts/stubs for the archiving jobs.
*   **AI Tests:** N/A for stubs, but the design document should be reviewed for completeness and feasibility.
*   **Human Verification:** Review the documented strategy. Check the placeholder scripts for logical structure.
*   **Dependencies:** Mature data models (S1.T1, S5.T1).

### 10.5. Workstream 8: DevOps & Infrastructure

#### 10.5.1. Task S10.T6: Enhanced Logging & Centralized Log Management Setup (Basic)
*   **Significance:** Improves observability and debuggability by centralizing logs from different services, making it easier to trace issues and understand system behavior.
*   **Cursor Prompt:** "Enhance the logging implemented in S8.T7:
    1.  Ensure all backend services (`api-gateway`, `cognitive-hub` modules/services, `workers`) use a consistent structured logging format (JSON).
    2.  Add more detailed logging: include request IDs for tracing, user IDs where relevant, key parameters for agent/tool calls, and timing for critical operations.
    3.  Set up a basic centralized logging solution for the local Docker environment. This could be as simple as configuring Docker Compose to use a logging driver that aggregates logs (e.g., `json-file` with options, or a simple ELK/Loki stack if feasible for AI setup).
    4.  For cloud deployment (AWS/Tencent), update Terraform modules (from S8.T8) to configure services to send logs to CloudWatch Logs (AWS) or CLS (Tencent Cloud Log Service)."
*   **Expected Outcome:** More detailed and consistent structured logging across services. Logs are viewable in a centralized manner locally. Terraform updated for cloud logging.
*   **AI Tests:** Trigger various operations. Inspect logs (local file, Docker logs, or CloudWatch/CLS if a dev deployment is made) to verify format and content.
*   **Human Verification:** Run the application locally. Perform various actions (login, ingest, chat, view graph). Check the aggregated logs. Verify that requests can be traced across services (if applicable) and key information is logged. Review Terraform changes for cloud logging.
*   **Dependencies:** S8.T7 (basic logging), S8.T8 (Terraform modules)

#### 10.5.2. Task S10.T7: Basic Admin Interface/API for Ontology Management
*   **Significance:** Provides a starting point for human oversight and management of the knowledge graph's ontology, allowing for curation and correction of AI-generated or suggested terms.
*   **Cursor Prompt:** "Create a very basic admin interface (can be a simple set of protected API endpoints in `api-gateway` for now, callable via Postman) for the `OntologySteward` functionalities developed in S9.T4. Implement:
    1.  Endpoint to list pending term suggestions (`GET /api/admin/ontology/suggestions`).
    2.  Endpoint to approve a suggestion (`POST /api/admin/ontology/suggestions/:suggestionId/approve` with payload `{ officialTerm: string, definition: string }`).
    3.  Endpoint to reject a suggestion (`POST /api/admin/ontology/suggestions/:suggestionId/reject` with payload `{ reason: string }`).
    These endpoints should call the respective methods on the `OntologySteward` service/module. Ensure these admin endpoints are protected by a separate admin role/permission (can be a hardcoded check for a specific user ID for now)."
*   **Expected Outcome:** Basic API endpoints for reviewing and actioning ontology suggestions.
*   **AI Tests:** API tests for the new admin endpoints. Test with/without admin privileges (stubbed).
*   **Human Verification:**
    1.  Simulate an agent suggesting a new term (which gets logged in `ontology_suggestions` table).
    2.  Use Postman (with admin privilege/token) to list pending suggestions.
    3.  Approve or reject a suggestion via the API. Verify the status change in the `ontology_suggestions` table and that the term is added/not added to the (Redis/config-based) vocabulary.
*   **Dependencies:** S9.T4 (Ontology Steward backend logic)

---

This concludes the detailed roadmap through Sprint 10. Further sprints would focus on:
*   **Mobile App Feature Parity:** Implementing 3D scenes, full card functionality, etc., on mobile.
*   **Advanced AI:** More sophisticated LLM prompting, fine-tuning models, multi-modal processing.
*   **Scalability & Reliability:** Load balancing, database optimization, advanced monitoring, automated recovery.
*   **Security Hardening:** Penetration testing, security audits.
*   **User Feedback & Iteration:** Incorporating feedback from beta users or early adopters.
*   **Full Multi-Region Deployment:** Finalizing and testing deployments in both US and China regions.

Remember that AI agents might need intermediate steps or clarifications. The "Human Verification" steps are crucial for course correction and ensuring the AI is building towards the intended product. Good luck with the development!

Okay, let's continue with Sprints 11 and 12, focusing on deepening AI capabilities, cross-modal understanding, personalization, and preparing for a wider release.

---

## **Sprint 11: Advanced AI, Multi-Modal Ingestion & Personalization MVP (4 AI-Weeks)**

**Sprint Goal:** Enhance AI capabilities with more sophisticated LLM usage and context handling. Introduce basic multi-modal ingestion (images). Implement initial personalization features for the Orb and content suggestions. Refine graph visualization with richer interactions.

---

### 11.1. Workstream 2: Cognitive Agents & Tools

#### 11.1.1. Task S11.T1: Dialogue Agent - Advanced Context Management & Prompt Engineering
*   **Significance:** Improves the Dialogue Agent's (Dot's) conversational abilities by enabling it to maintain longer, more coherent dialogues and utilize context more effectively, leading to more natural and helpful interactions.
*   **Cursor Prompt:** "Refactor `DialogueAgent.ts` (`services/cognitive-hub/src/agents/dialogue/dialogue-agent.ts`) for advanced context management:
    1.  Implement a more sophisticated conversation history summarization technique (e.g., LLM-based summarization of older turns) to keep the prompt context concise yet relevant.
    2.  Integrate `user.preferences.orbInteractionStyle` (from `users` table, see `@V7UltimateSpec Section 4.1.1`) into prompt engineering to tailor Dot's tone and verbosity.
    3.  Allow Dot to ask clarifying questions when user input is ambiguous, using an LLM to generate these questions based on context.
    4.  Implement a basic mechanism for Dot to remember key facts or preferences mentioned by the user within the current session (store in Redis session or `Conversation.context` JSONB field)."
*   **Expected Outcome:** Dialogue Agent can handle longer conversations more effectively, adapts its style slightly based on user preferences, and can ask clarifying questions. Session-specific memory improves continuity.
*   **AI Tests:**
    *   Unit tests for new context summarization and question generation logic (mock LLM calls).
    *   Simulate a long conversation with topic shifts and check if the agent maintains context.
    *   Test with different `orbInteractionStyle` preferences.
*   **Human Verification:**
    1.  Engage in longer conversations with Dot. Observe if it remembers earlier parts of the conversation better.
    2.  Try providing ambiguous queries to see if Dot asks clarifying questions.
    3.  (If UI for preferences exists or can be manually set in DB) Change `orbInteractionStyle` and observe if Dot's responses subtly change in tone/length.
    4.  Mention a simple preference (e.g., "I prefer short answers") and see if it's remembered later in the session.
*   **Dependencies:** S4.T3 (Dialogue Agent basics), S1.T1 (`users.preferences` field)

#### 11.1.2. Task S11.T2: Ingestion Analyst - Basic Image Ingestion & Analysis
*   **Significance:** Expands the system's capabilities beyond text by allowing users to ingest images, which can then be described and linked within their knowledge graph.
*   **Cursor Prompt:** "Enhance `IngestionAnalyst.ts` and create/use `vision.caption` tool:
    1.  Modify the `/api/memory/ingest/image` endpoint (create if not exists) to accept image uploads (e.g., multipart/form-data). Store the image in S3 (or configured object storage) and save the URL in `Media.url`.
    2.  Create a `Media` record in PostgreSQL linked to a new `MemoryUnit` (source_type: 'image_upload').
    3.  Implement the `vision.caption({image_url, detail_level})` tool in `services/cognitive-hub/src/tools/vision-tools/caption.ts`. This tool should call an image captioning API (e.g., Google Vision API, or a Hugging Face model via a microservice). For `detail_level='basic'`, get a short caption.
    4.  `IngestionAnalyst` calls `vision.caption` for the uploaded image URL. The returned caption is stored in `Media.caption`.
    5.  The caption text is then processed by the existing text ingestion pipeline (chunking, embedding, concept extraction, `growth_events` for the `MemoryUnit`).
    Refer to `@V7UltimateSpec Section 4.1.1 (Media node)` and `Section 4.1 (Vision Processing Tools)`."
*   **Expected Outcome:** Users can upload images. The system generates a caption, stores it, and processes the caption text like a journal entry, linking concepts to the new `MemoryUnit`.
*   **AI Tests:**
    *   Unit test for `vision.caption` tool (mock API call).
    *   Integration test: Upload an image. Verify `Media` record creation, S3 upload (mocked), caption generation, and subsequent text processing (chunk, concept, growth_event creation).
*   **Human Verification:**
    1.  Upload an image through a test UI or Postman to the new endpoint.
    2.  Check the `media` table for the new entry with its URL and generated caption.
    3.  Check the `memory_units` table for the corresponding memory.
    4.  Check `chunks`, `concepts`, `growth_events` related to the caption text.
    5.  Verify the image is accessible via its S3/storage URL.
*   **Dependencies:** S3.T1 (Ingestion Analyst text pipeline), S3.T2 (basic ingestion API endpoint), S1.T1 (Media model)

### 11.2. Workstream 6: Card System (UI & Backend Link)

#### 11.2.1. Task S11.T3: Card UI - Displaying Image Previews and Annotations
*   **Significance:** Enhances cards by allowing them to display associated images and user-added annotations, making them richer and more informative.
*   **Cursor Prompt:** "Update `Card.tsx` (`apps/web-app/src/components/cards/Card.tsx`):
    1.  If a `Card` (representing a `MemoryUnit`) has an associated `Media` item of type 'image' (from `card.mediaUrl` or a similar field populated by `CardService`), display the image as the card's preview on the front side.
    2.  On the back/detail side of the card, display any `Annotation`s associated with the card's entity. Fetch annotations via an updated `/api/cards/:cardId/annotations` endpoint (to be created in `CardService`).
    3.  Allow users to add new annotations directly on the card's back side, calling the `/api/annotations` POST endpoint (from S9.T5).
    Refer to `@V7UltimateSpec Section 2.1.1 (Media, Annotation)`."
*   **Expected Outcome:** Image-based memories display their image on the card. Card detail views show associated annotations and allow adding new ones.
*   **AI Tests:**
    *   Component tests for `Card.tsx` verifying image display and annotation rendering.
    *   E2E stub: Mock API responses for cards with images and annotations. Test adding a new annotation.
*   **Human Verification:**
    1.  Ingest an image memory (S11.T2). Verify its card in the gallery shows the image.
    2.  Manually add an annotation to a `MemoryUnit` or `Concept` in the DB. Verify it appears on the card's detail view.
    3.  Add a new annotation via the card's UI. Verify it's saved and displayed.
*   **Dependencies:** S6.T5 (Card detail view), S9.T5 (Annotation API/Service), S11.T2 (Image ingestion)

#### 11.2.2. Task S11.T4: Backend - Personalized Card Suggestions ("For You" Section)
*   **Significance:** Begins to personalize the user experience by suggesting cards that might be relevant or interesting to the user based on their recent activity or knowledge graph structure.
*   **Cursor Prompt:** "Enhance `CardService.ts`:
    1.  Create a new method `getSuggestedCards(userId: string, count: number = 5): Promise<Card[]>`.
    2.  Implement a simple suggestion logic:
        *   Option A: Recently created/updated cards by the user that haven't been interacted with much.
        *   Option B: Cards related to recently focused concepts (requires tracking focused concepts, perhaps via `user_activity_log` or Redis).
        *   Option C: Cards that are part of incomplete "constellations" or challenges.
    3.  Expose this via a new API endpoint `/api/cards/suggested` in the API Gateway.
    4.  The Dashboard UI (`Dashboard.tsx`) should have a section (e.g., 'Recommended for You' or 'Pick Up Where You Left Off') that fetches and displays these suggested cards."
*   **Expected Outcome:** The Dashboard displays a list of personalized card suggestions.
*   **AI Tests:** Unit tests for `CardService.getSuggestedCards` with various suggestion logic scenarios (mocking underlying data fetches). API test for `/api/cards/suggested`.
*   **Human Verification:**
    1.  Interact with the system: create memories, focus on concepts, start challenges.
    2.  Open the Dashboard. Verify the "Recommended for You" section shows relevant cards based on your recent activity or graph structure. The logic might be simple initially, but it should be somewhat personalized.
*   **Dependencies:** S6.T4 (Dashboard UI), S3.T3 (CardService), `user_activity_log` table (from `V7DataSchemaDesign.md`) for tracking interactions.

### 11.3. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 11.3.1. Task S11.T5: GraphScene - Node Context Menu & Basic Actions
*   **Significance:** Provides users with more direct ways to interact with and manage nodes within the GraphScene itself, reducing the need to switch to other views for common actions.
*   **Cursor Prompt:** "In `GraphScene.tsx` and its node components (`ConceptNode.tsx`, `MemoryStar.tsx`):
    1.  Implement a right-click context menu for focused nodes.
    2.  The context menu should offer actions like:
        *   'View Details' (opens the Card Modal for this node, similar to S8.T1).
        *   'Find Similar Nodes' (triggers a backend call, perhaps to `RetrievalPlanner`, to find and highlight similar nodes in the graph).
        *   'Create Connection' (initiates a UI flow to select another node and define a relationship - stub the UI flow for now, but log the intent).
        *   'Add Annotation' (opens a small input for an annotation, calls `/api/annotations`).
    Reference `@V7UltimateSpec Section 3.2.3 (Interaction)`."
*   **Expected Outcome:** Right-clicking a focused node in GraphScene opens a context menu with actionable items.
*   **AI Tests:** Component tests for context menu display and action triggers (mocking actions). In UI, right-click nodes, verify menu appears, and clicking actions logs intent or triggers stubs.
*   **Human Verification:**
    1.  In GraphScene, focus on a node and then right-click it.
    2.  Verify a context menu appears with options like "View Details," "Find Similar," etc.
    3.  "View Details" should ideally open the full card modal. "Add Annotation" should allow adding a quick note. Other actions can be stubbed for now.
*   **Dependencies:** S8.T1 (Node focusing and basic panel), S6.T5 (Card Modal), S9.T5 (Annotation API)

### 11.4. Workstream 8: DevOps & Infrastructure

#### 11.4.1. Task S11.T6: Implement Basic Health Checks for All Services
*   **Significance:** Adds essential monitoring capabilities to ensure all backend services are running and responsive, crucial for maintaining system reliability.
*   **Cursor Prompt:** "For each backend service/module (`api-gateway`, `cognitive-hub` components like `DialogueAgentService`, `CardService`, etc., and any `workers`):
    1.  Implement a standard `/health` endpoint (e.g., `GET /health`).
    2.  This endpoint should perform basic checks:
        *   Service is running.
        *   Can connect to its primary database(s) (e.g., PostgreSQL for `CardService`, Neo4j for `GraphService`).
        *   Can connect to Redis (if applicable).
    3.  Return a 200 OK if healthy, 503 Service Unavailable otherwise, with a JSON body indicating status of dependencies.
    Update Dockerfiles to expose these health check endpoints if necessary (e.g., for Kubernetes liveness/readiness probes)."
*   **Expected Outcome:** All backend services have a `/health` endpoint providing their operational status and dependency health.
*   **AI Tests:** For each service, unit test the health check logic (mock dependencies). Integration test: Run services locally (Docker Compose), hit `/health` endpoints, verify responses. Simulate a DB down and check if health status changes.
*   **Human Verification:**
    1.  With all services running via `docker-compose up`, access `http://localhost:PORT/health` for each service (find appropriate ports).
    2.  Verify a JSON response indicating health status (e.g., `{"status": "UP", "dependencies": {"postgres": "UP", "redis": "UP"}}`).
    3.  Temporarily stop the PostgreSQL container and re-check health for services depending on it; they should report unhealthy status for that dependency.
*   **Dependencies:** S0.T3 (Docker setup), All previously created backend services.

---

## **Sprint 12: Advanced Orb Interactions, Mobile Card Display & Refinements (4 AI-Weeks)**

**Sprint Goal:** Further enhance the Orb's interactivity and intelligence. Implement the display of cards on the mobile app. Focus on refining existing features, improving performance, and addressing any accumulated technical debt. Start end-to-end testing of core user journeys.

---

### 12.1. Workstream 5: Orb Implementation (UI & Backend Link)

#### 12.1.1. Task S12.T1: Orb - Scene-Aware Interactions & Guidance
*   **Significance:** Makes the Orb a more intelligent and context-aware guide by having it react specifically to the user's actions and context within each 3D scene.
*   **Cursor Prompt:** "Enhance `DialogueAgent.ts` and `OrbStateManager.ts` to enable more scene-aware Orb interactions based on `@V7UltimateSpec Section 5.6.4`:
    1.  **CloudScene:** If the user is idle for a period, Orb might whisper (via TTS and chat) a gentle reflection prompt (e.g., "What's on your mind?" or a pre-defined prompt from a list). Its visual state should become more 'inviting'.
    2.  **AscensionScene:** Orb's transformation (e.g., comet shape) should be more pronounced. It might whisper transition-related phrases at key moments (e.g., "Approaching the cosmos..." as stars appear).
    3.  **GraphScene:** When the user focuses on a `ConceptNode`, Orb could offer to find related memories or explain the concept further. If user is panning/zooming aimlessly, Orb might suggest focusing on a dense cluster or a recently active node. These actions would involve `DialogueAgent` calling `RetrievalPlanner` or `GraphService`.
    Frontend `SceneStore` changes should notify the backend `DialogueAgent` of current scene context."
*   **Expected Outcome:** Orb's behavior and suggestions become more tailored to the active 3D scene and user activity within it.
*   **AI Tests:**
    *   Simulate scene changes and user actions (idle, node focus) by sending events/API calls to `DialogueAgent`. Verify Orb state updates and proactive prompts are generated.
    *   In UI, test these scenarios.
*   **Human Verification:**
    *   **CloudScene:** Leave the app idle; Orb should eventually offer a prompt.
    *   **AscensionScene:** Observe Orb's visuals and listen for any contextual audio during the transition.
    *   **GraphScene:** Focus on a node; Orb might offer relevant actions. Pan around; Orb might suggest areas of interest.
*   **Dependencies:** S8.T5 (Orb scene-specific behaviors), S7.T2 (AscensionScene), S7.T5 (GraphScene interactions)

#### 12.1.2. Task S12.T2: Orb - Visual Feedback for AI Processing States
*   **Significance:** Provides users with clearer visual cues about what Dot (the Orb) is doing, especially during longer AI processing tasks, managing expectations and improving perceived responsiveness.
*   **Cursor Prompt:** "Define and implement distinct visual states/effects for the Orb in `Orb.tsx` and `OrbStateManager.ts` to represent different AI processing stages, beyond simple 'thinking':
    1.  **'Retrieving_Knowledge':** When `RetrievalPlanner` is active (e.g., subtle data-stream-like particles flowing towards Orb).
    2.  **'Synthesizing_Insight':** When `InsightEngine` is running in response to a user query or background task (e.g., internal core of Orb shows complex, evolving patterns).
    3.  **'Learning_New_Concept':** When `IngestionAnalyst` is processing new significant information (e.g., Orb gently pulses with a color associated with 'newness' or 'knowledge').
    The respective backend agents should trigger these state changes in `OrbStateManager` at the start and end of these operations."
*   **Expected Outcome:** The Orb visually communicates different types of background processing, making the system feel more transparent and alive.
*   **AI Tests:** Trigger backend processes (retrieval, insight generation, ingestion). Verify `OrbStateManager` receives and processes state changes, and `OrbStore` on the frontend updates.
*   **Human Verification:**
    *   Perform an action that triggers significant retrieval (e.g., a complex search). Observe Orb for 'Retrieving_Knowledge' visuals.
    *   Manually trigger insight generation. Observe Orb for 'Synthesizing_Insight' visuals.
    *   Ingest a new piece of content. Observe Orb for 'Learning_New_Concept' visuals.
*   **Dependencies:** S7.T7 (Orb state-driven visuals), backend agents able to emit these specific states.

### 12.2. Workstream 6: Card System (UI & Backend Link)

#### 12.2.1. Task S12.T3: Mobile UI - Basic Card Gallery Display
*   **Significance:** Brings the core Card Gallery experience to the mobile platform, allowing users to view their memories and concepts on the go.
*   **Cursor Prompt:** "In `apps/mobile-app`:
    1.  Create a `Card.tsx` component, adapting the web version (`apps/web-app/src/components/cards/Card.tsx`) for React Native. Initially, focus on displaying the front of the card: `title`, `preview`, and a simplified version of `GrowthDimensionIndicator`s. Use mobile-friendly styling.
    2.  Create a `CardGalleryScreen.tsx`. This screen should:
        *   Fetch card data from the `/api/cards` endpoint using the mobile API client.
        *   Display cards in a scrollable list or grid (e.g., using `FlatList`).
        *   Implement basic pull-to-refresh and infinite scroll/pagination for loading more cards.
    3.  Add navigation to this screen from the mobile app's main navigation."
*   **Expected Outcome:** Mobile app has a Card Gallery screen that displays a list of cards fetched from the backend, showing basic information.
*   **AI Tests:** Component tests for mobile `Card.tsx`. E2E test stub for `CardGalleryScreen` (mock API, verify list rendering). Run on emulator/device.
*   **Human Verification:**
    1.  Log in to the mobile app. Navigate to the Card Gallery.
    2.  Verify cards are displayed with titles and previews.
    3.  Test scrolling and pull-to-refresh.
    4.  Ensure basic styling is appropriate for mobile.
*   **Dependencies:** S9.T6 (Mobile app shell & API connectivity), S3.T3 (CardService and `/api/cards` endpoint)

#### 12.2.2. Task S12.T4: Backend - Personalized "On This Day" / Recent Memory Surfacing
*   **Significance:** Adds a "time capsule" feature, proactively surfacing relevant past memories to the user, enhancing reflection and rediscovery.
*   **Cursor Prompt:** "Enhance `CardService.ts` (or `InsightEngine.ts`):
    1.  Add a method `getMemoriesForToday(userId: string): Promise<Card[]>`. This method should query `MemoryUnit`s from PostgreSQL where `occurred_at` (or `created_at`) matches today's date in previous years.
    2.  Add a method `getRecentMemories(userId: string, limit: number = 5): Promise<Card[]>`. This method should fetch the most recently created or updated `MemoryUnit`s.
    3.  Expose these via new API endpoints in the API Gateway: `/api/memories/on-this-day` and `/api/memories/recent`.
    4.  The `Dashboard.tsx` (web) should have sections to display these (e.g., 'On This Day', 'Recently Added')."
*   **Expected Outcome:** API endpoints provide "On This Day" and "Recent" memories. Dashboard displays these.
*   **AI Tests:** Unit tests for the new `CardService` methods. API tests for the new endpoints (seed data with relevant dates).
*   **Human Verification:**
    1.  Seed `MemoryUnit`s with `occurred_at` dates matching today's date in past years.
    2.  Call `/api/memories/on-this-day`. Verify correct memories are returned.
    3.  Ingest new memories. Call `/api/memories/recent`. Verify they are returned.
    4.  Check the Dashboard UI for new sections displaying this information.
*   **Dependencies:** S1.T1 (MemoryUnit model), S6.T4 (Dashboard UI)

### 12.3. Workstream 4: UI Foundation & 3D Canvas Core

#### 12.3.1. Task S12.T5: UI - Refine Glassmorphic Elements & Design Token Application
*   **Significance:** Ensures a consistent and polished visual experience across all 2D UI elements by systematically applying the defined design tokens and refining the glassmorphic effect.
*   **Cursor Prompt:** "Review all major 2D UI components in `apps/web-app/src/components/` (e.g., `Card.tsx`, `Dashboard.tsx`, `ChatInterface.tsx`, `HUD.tsx`).
    1.  Ensure consistent application of the `GlassmorphicPanel` component or styles as defined in `@V7UltimateSpec Section 5.3.7`.
    2.  Verify that colors, typography, spacing, and radii are primarily sourced from the design tokens defined in `@V7UltimateSpec Section 7.7` (referencing `v7UIUXDesign.md`).
    3.  Refine any visual inconsistencies or areas where the glassmorphic effect can be improved (e.g., border styles, shadow intensity, blur radius adjustments based on context).
    4.  Ensure light/dark mode compatibility if planned (can be a stub for now)."
*   **Expected Outcome:** A more visually cohesive and polished 2D UI layer, with consistent glassmorphism and adherence to design tokens.
*   **AI Tests:** Visual regression tests (if set up) for key components. Linting for direct use of pixel values instead of design tokens (if ESLint rules are configured).
*   **Human Verification:** Visually inspect all modals, cards, and HUD elements. Check for consistency in appearance (blur, transparency, borders). Verify fonts, colors, and spacing match the design language. Test on different screen sizes.
*   **Dependencies:** S2.T2 (GlassmorphicPanel, Design Tokens initial setup), All existing UI components.

### 12.4. Workstream 8: DevOps & Infrastructure

#### 12.4.1. Task S12.T6: Implement Basic User Analytics Event Tracking
*   **Significance:** Starts capturing basic user interaction data, which is vital for understanding user behavior, identifying popular features, and making data-driven product decisions.
*   **Cursor Prompt:** "Implement basic client-side event tracking for key user actions.
    1.  Choose a simple analytics library (e.g., a lightweight self-hosted solution like Umami, or stubs for Amplitude/Mixpanel). Integrate its SDK into `apps/web-app`.
    2.  Track events like:
        *   `user_login`, `user_register`
        *   `memory_created` (with source type)
        *   `card_viewed` (with cardId, cardType)
        *   `card_flipped`
        *   `insight_viewed`
        *   `challenge_started`, `challenge_completed`
        *   `scene_changed` (to CloudScene, GraphScene)
        *   `orb_interaction` (e.g., voice command used)
    3.  Events should include `userId` and `timestamp`.
    4.  For now, events can be logged to the console or a simple backend endpoint that logs to a file/DB table (`user_activity_log` can be used or extended)."
*   **Expected Outcome:** Key user interactions in the web app are tracked as analytics events.
*   **AI Tests:** Use browser developer tools to monitor network requests or console logs for analytics events when performing actions.
*   **Human Verification:** Perform various actions in the web app (login, create memory, view card, complete challenge, switch scenes). Check the browser console or the designated backend log/table (`user_activity_log` in PostgreSQL) to ensure events are being logged with appropriate data.
*   **Dependencies:** Most UI components (S3.T4, S6.T4, S6.T9, S7.T1, S7.T2, S7.T3)

#### 12.4.2. Task S12.T7: Containerize Backend Services (Cognitive Hub, Workers)
*   **Significance:** Packages all backend services into Docker containers, making them portable, scalable, and ready for deployment to orchestrated environments like Kubernetes.
*   **Cursor Prompt:** "For each backend service module within `services/cognitive-hub/` (and standalone `workers/` if any):
    1.  Create a `Dockerfile`.
    2.  The Dockerfile should:
        *   Use an appropriate Node.js base image.
        *   Copy necessary `package.json` and install production dependencies.
        *   Copy compiled application code (e.g., from a `dist` folder if using TypeScript).
        *   Expose the service's port.
        *   Define the `CMD` to start the service.
    3.  Update `infrastructure/docker/docker-compose.yml` to include these new services, configuring necessary environment variables and dependencies (e.g., ensuring they wait for databases to be ready if needed, though health checks are better for this).
    Ensure shared packages (`packages/*`) are correctly built and accessible by these services within their Docker contexts (this might involve Turborepo's `dockerPrisma` or `docker` build outputs)."
*   **Expected Outcome:** All backend services can be built as Docker images and run via `docker-compose`.
*   **AI Tests:** `docker-compose build <service-name>` for each service. `docker-compose up`. Test basic functionality of each service by hitting its health check or a simple endpoint via the API Gateway.
*   **Human Verification:** Run `docker-compose up --build`. Check logs to ensure all backend services start correctly and can connect to databases. Test a full user flow (e.g., register, login, ingest memory, chat with Dot) to verify inter-service communication within the Docker network.
*   **Dependencies:** S0.T3 (Docker Compose base), All backend service implementations.

---

This completes the roadmap up to Sprint 12. The focus from here would shift more towards:
*   **Mobile App Development:** Building out features to match the web app, including 3D scenes.
*   **AI Refinement:** Improving LLM prompts, training custom models if necessary, enhancing insight quality.
*   **Advanced Features:** Implementing the more complex aspects of the UI/UX vision (e.g., detailed constellation visuals, nuanced Orb animations, richer interactions).
*   **Scalability & Reliability:** Stress testing, database optimization, setting up auto-scaling, robust error handling and recovery.
*   **Security Hardening:** Penetration testing, code audits, dependency vulnerability scanning.
*   **Full Cross-Region Deployment:** Finalizing and testing deployments in both US and China environments.
*   **User Feedback Cycles:** Incorporating feedback from alpha/beta testers to iterate on features and usability.

All right, let's continue with Sprints 13 and 14, focusing on maturing the AI, cross-modal features, full scene interactivity, and initial performance and security hardening.

---

## **Sprint 13: Multi-Modal Deep Dive, Graph Interactivity & Ontology Refinement (4 AI-Weeks)**

**Sprint Goal:** Significantly enhance multi-modal capabilities, particularly image understanding and its integration into the knowledge graph. Make the GraphScene highly interactive with deep linking and advanced data display. Refine the ontology system based on initial usage and agent needs.

---

### 13.1. Workstream 2: Cognitive Agents & Tools

#### 13.1.1. Task S13.T1: Ingestion Analyst - Advanced Image Analysis & Concept Linking
*   **Significance:** Goes beyond simple image captioning to extract richer semantic information from images, creating more meaningful connections in the knowledge graph.
*   **Cursor Prompt:** "Enhance the `IngestionAnalyst` and the `vision.extract_entities` tool (`services/cognitive-hub/src/tools/vision-tools/extract_entities.ts` - create if not exists):
    1.  Implement the `vision.extract_entities({image_url})` tool to use a more advanced vision API (e.g., Google Cloud Vision API, AWS Rekognition, or a powerful open-source model like DINOv2 or CLIP) to detect objects, scenes, landmarks, and potentially text (OCR) within images.
    2.  When an image is ingested (S11.T2), after captioning, `IngestionAnalyst` should also call `vision.extract_entities`.
    3.  For each significant entity detected in the image:
        *   Create/link a `Concept` node in PostgreSQL and Neo4j (e.g., `Concept` type: 'object', 'landmark').
        *   Create a `[:CONTAINS_ENTITY]` or `[:DEPICTS]` relationship from the `Media` node (or its parent `MemoryUnit`) to these `Concept` nodes in Neo4j.
        *   Store detected entities and their bounding boxes (if available) in `Media.metadata` JSONB field.
    4.  Create `GrowthEvent`s related to these new concepts, potentially for 'world_know' dimension."
*   **Expected Outcome:** Ingested images are analyzed for objects and scenes, leading to new `Concept` nodes and relationships in the knowledge graph. `Media` records store extracted visual metadata.
*   **AI Tests:**
    *   Unit tests for `vision.extract_entities` (mocking the vision API).
    *   Integration test: Upload an image with distinct objects/scenes. Verify new `Concept` nodes and relationships are created in PostgreSQL and Neo4j. Check `Media.metadata`. Verify `growth_events` are created.
*   **Human Verification:**
    1.  Upload an image (e.g., a cat in a park).
    2.  Check PostgreSQL: `media` table should have metadata (e.g., detected "cat", "tree", "grass"). New `Concept` records for these entities should exist.
    3.  Check Neo4j: The `MemoryUnit` (or `Media` node if you model it) should have relationships like `[:DEPICTS]` to `Concept` nodes for "cat", "tree", etc.
    4.  Check `growth_events` for potential 'world_know' contributions.
*   **Dependencies:** S11.T2 (basic image ingestion)

#### 13.1.2. Task S13.T2: Retrieval Planner - Multi-Modal Contextual Retrieval
*   **Significance:** Enables the system to use visual information from images as context for retrieval and responses, leading to richer and more accurate results when users query about image-related memories.
*   **Cursor Prompt:** "Enhance `RetrievalPlanner.getSimilarMemoryUnits` and related logic:
    1.  If the user's query refers to an image (e.g., "Tell me more about that photo I uploaded yesterday") or if the current context involves an image-based `MemoryUnit`:
        *   Retrieve the image's caption (`Media.caption`) and extracted entities (`Media.metadata`).
        *   Generate embeddings for this textual information (caption + entities).
        *   Use these image-derived embeddings in conjunction with text query embeddings for a hybrid semantic search in Weaviate (potentially weighting image-derived context higher).
    2.  (Advanced) Explore using multi-modal embedding models (if feasible with chosen AI services like Gemini or via a dedicated tool) to directly compare image queries with image content or text queries with image content."
*   **Expected Outcome:** Retrieval results are more relevant when queries involve images or image-based memories, as visual content contributes to the search context.
*   **AI Tests:**
    *   Unit tests for the new retrieval logic (mocking embedding and search).
    *   Integration test: Ingest an image with a specific theme. Query with text related to that theme. Verify the image-based memory is ranked highly.
*   **Human Verification:**
    1.  Upload an image, e.g., "a red car by the beach."
    2.  Later, ask Dot, "What do I remember about red vehicles?" or "Show me memories near the ocean."
    3.  The image memory should be retrieved with high relevance due to its caption and extracted entities.
*   **Dependencies:** S11.T2 (image ingestion and captioning), S13.T1 (image entity extraction), S4.T8 (vector search)

### 13.2. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 13.2.1. Task S13.T3: GraphScene - Display Image Thumbnails on Nodes
*   **Significance:** Visually enriches the GraphScene by showing image previews directly on relevant nodes, making it easier for users to identify and understand image-based memories.
*   **Cursor Prompt:** "Enhance `GraphScene.tsx` and its node components (e.g., `MemoryStar.tsx`):
    1.  Modify the `/api/graph/nodes` endpoint in `GraphService` to include a `thumbnail_url` (e.g., from `Media.url` if the `MemoryUnit` has a primary image) for `MemoryUnit` nodes.
    2.  In `MemoryStar.tsx` (or a generic node component), if a `thumbnail_url` is present for a node, render a small, interactive thumbnail as part of the node's visualization. This could be a texture on a plane attached to the node or a 2D overlay using `drei`'s `<Html>`.
    3.  Clicking the thumbnail could expand it or navigate to the full card view.
    Refer to `@V7UltimateSpec Section 2.1.1 (Media)` and `@V7UIUXDesign.md` for visual consistency."
*   **Expected Outcome:** `MemoryUnit` nodes in the GraphScene that represent image memories display a small thumbnail of the image.
*   **AI Tests:**
    *   Component test for `MemoryStar.tsx` displaying a thumbnail.
    *   In UI, ensure nodes representing image memories show their thumbnails correctly.
*   **Human Verification:**
    1.  Ingest several image memories.
    2.  Navigate to the GraphScene.
    3.  Verify that the "Memory Stars" corresponding to these image memories display a small preview of the image. Clicking it should ideally link to the card detail view.
*   **Dependencies:** S11.T2 (image ingestion with URL storage), S4.T5 (GraphService node data endpoint), S7.T3 (GraphScene node rendering)

#### 13.2.2. Task S13.T4: GraphScene - Advanced Link Styling & Information
*   **Significance:** Makes the relationships in the GraphScene more informative by visually encoding details about the connection type and strength, and allowing users to inspect them.
*   **Cursor Prompt:** "Enhance `ConnectionPathway.tsx` (or equivalent link rendering component) in `GraphScene.tsx`:
    1.  Style links based on `relationship_label` (fetched from `/api/graph/links`):
        *   Use different colors (from design tokens) for different categories of relationships (e.g., hierarchical, causal, associative).
        *   Vary thickness or opacity based on `weight`.
    2.  Implement an animation for link creation/discovery (e.g., a pulse traveling along the new link).
    3.  On hovering over a link, display a tooltip or small overlay showing the `relationship_label` and any `description` property of the relationship.
    4.  Consider adding subtle particle flows along links to indicate directionality or activity if appropriate for the relationship type.
    Refer to `@V7UltimateSpec Section 3.2.3 (Connection Pathway)` and `@V7UltimateSpec Section 7.1 (Color Tokens)`."
*   **Expected Outcome:** Links in GraphScene are visually differentiated by type and weight, show information on hover, and have an animation when newly created.
*   **AI Tests:** Visual inspection with diverse relationship types and weights. Test hover interaction on links.
*   **Human Verification:**
    1.  Create various types of relationships between concepts/memories in Neo4j (e.g., 'is_a_type_of', 'causes', 'is_similar_to') with different weights.
    2.  View the GraphScene. Verify links have different colors/styles based on their type/weight.
    3.  Hover over a link; a tooltip should show its label (e.g., "causes").
    4.  If possible, trigger a new link creation (e.g., via S9.T5 card linking) and observe if there's an animation.
*   **Dependencies:** S7.T3 (basic link rendering), S7.T4 (link data API)

### 13.3. Workstream 4: UI Foundation & 3D Canvas Core

#### 13.3.1. Task S13.T5: Implement Shared 3D Asset Loading & Management
*   **Significance:** Optimizes the loading of 3D assets (models, textures) by creating a centralized system, improving performance and reusability across different scenes and components.
*   **Cursor Prompt:** "In `packages/canvas-core/src/loaders/`, implement utility functions for loading 3D assets (GLTF models, textures) using `THREE.GLTFLoader`, `THREE.TextureLoader`, etc., with support for `useGLTF` and `useTexture` from `drei` for suspense-based loading.
    1.  Implement a simple asset manifest or registry (e.g., a JSON file or a TypeScript object) in `packages/canvas-core/src/assets.ts` that maps asset names to their URLs (potentially S3/CDN URLs).
    2.  Create a hook like `useManagedAsset(assetName)` that uses the manifest and Drei's loaders to load and cache assets.
    3.  Refactor `CloudScene.tsx`, `GraphScene.tsx`, and `Orb.tsx` to use this shared asset loading mechanism for any textures or simple models they might use.
    Follow principles from `@V7UltimateSpec Section 8.1 (Binary Asset Management)` for handling source vs. optimized assets (processing scripts are a later task)."
*   **Expected Outcome:** A centralized and efficient way to load 3D assets. Scenes and Orb use this system, reducing redundant loading code.
*   **AI Tests:** Unit tests for asset loading utilities (mocking Drei loaders). Verify scenes still render correctly after refactoring to use the new asset loader.
*   **Human Verification:**
    1.  Review the `canvas-core` loaders and asset manifest.
    2.  Verify that scenes and the Orb still load their assets correctly.
    3.  Check network tab to ensure assets are loaded efficiently (e.g., cached by the browser or the loader).
*   **Dependencies:** S7.T1, S7.T3, S7.T6 (scenes and Orb using assets)

### 13.4. Workstream 1: Core Backend & Data Models

#### 13.4.1. Task S13.T6: Refine User Preferences for Personalization
*   **Significance:** Expands the user preferences model to capture more granular settings, enabling finer control over personalization features like insight frequency and Orb interaction style.
*   **Cursor Prompt:** "Update the `preferences` JSONB column in the `users` table (Prisma schema `packages/database/src/prisma/schema.prisma`) and associated types in `packages/shared-types/`. Add new preference fields based on `@V7UltimateSpec Section 7.6 (User Feedback & Control)` and `@V7UltimateSpec Section 10.3 (Personalization Research Areas)`:
    *   `orbInteractionStyle`: ('concise', 'narrative', 'playful')
    *   `proactiveInsightFrequency`: ('low', 'medium', 'high', 'off')
    *   `preferredInsightTypes`: `string[]` (e.g., ['temporal_pattern', 'co_occurrence_insight'])
    *   `themePreference`: ('dawn', 'twilight', 'overcast', 'system')
    *   `enableVoiceOutput`: `boolean`
    Update the `/api/user/profile` (PUT) endpoint in `api-gateway` to allow users to update these preferences. Update `UserRepository` to fetch/save these."
*   **Expected Outcome:** User preferences schema updated. API endpoint allows modification of these new preferences.
*   **AI Tests:** Unit tests for `UserRepository` update/get preferences. API test for PUT `/api/user/profile` to update new preference fields.
*   **Human Verification:**
    1.  Use Postman to update a user's preferences with new values for `orbInteractionStyle`, `proactiveInsightFrequency`, etc.
    2.  Verify the `users.preferences` column in Prisma Studio reflects these changes.
    3.  Fetch user profile via API and confirm new preferences are returned.
*   **Dependencies:** S1.T1 (User model), S1.T2 (Auth and /api/me or similar profile endpoint)

---

## **Sprint 14: End-to-End User Journeys, Performance Tuning & Deployment Prep (4 AI-Weeks)**

**Sprint Goal:** Focus on complete user journeys, performance optimization of 3D scenes and data loading, robust error handling, and final preparations for an initial beta deployment. Implement more complex Orb interactions and refine insight delivery.

---

### 14.1. Workstream 4: UI Foundation & 3D Canvas Core

#### 14.1.1. Task S14.T1: Implement Core User Journeys (UI Flow)
*   **Significance:** Ensures key user flows like onboarding, daily engagement, and memory exploration are smooth and intuitive from a UI perspective, connecting different application parts.
*   **Cursor Prompt:** "Implement the UI flow for the following core user journeys as described in `@V7UltimateSpec Section 8.2`:
    1.  **Onboarding Flow:** Create placeholder screens for Welcome, Account Creation (links to S1.T2), Initial Preference Setting (linking to S13.T6 backend for preferences), First Interaction with Orb (simple canned dialogue), Tour of Key Features (simple modal popups).
    2.  **Daily Engagement (Dashboard):** Ensure the Dashboard (`Dashboard.tsx`) correctly displays 'Today with Dot' (placeholder), quick capture (stub journaling UI), proactive insights (from S6.T7), and recent memory surfacing (from S12.T4).
    3.  **Memory Exploration (Card Gallery & GraphScene):** Ensure seamless navigation between Card Gallery, individual Card Detail views (S6.T5), and the GraphScene. Clicking a node in GraphScene (S8.T1) should ideally allow navigation to its Card Detail view.
    Implement necessary routing (Next.js App Router) and state management (`SceneStore`, `ModalStore`) updates to support these flows."
*   **Expected Outcome:** Key user journeys are navigable in the web app, with placeholders for content yet to be fully implemented but the flow itself is demonstrable.
*   **AI Tests:** E2E test stubs (Cypress/Playwright) for each journey: e.g., navigate through onboarding, open dashboard and see sections, move from gallery to graph.
*   **Human Verification:**
    1.  Go through the Onboarding flow: can you create an account (if not logged in), set basic preferences, and see an intro to Orb?
    2.  Open the Dashboard: does it show sections for daily reflection, insights, recent memories?
    3.  Navigate from Card Gallery to a Card Detail view. From GraphScene, can you (e.g., via context menu) open a Card Detail view for a selected node?
*   **Dependencies:** All relevant UI components from previous sprints (Dashboard, Card Gallery, GraphScene, Chat, Orb).

#### 14.1.2. Task S14.T2: 3D Scene Performance Optimization
*   **Significance:** Critical for ensuring a smooth and enjoyable user experience, especially on less powerful devices, by optimizing the rendering of complex 3D scenes.
*   **Cursor Prompt:** "Apply performance optimization techniques to `CloudScene.tsx`, `AscensionScene.tsx`, and `GraphScene.tsx` based on `@V7UltimateSpec Section 5.2.4` and `v7UIUXDesign.md Section 3.3 (Performance Optimization)`:
    1.  **Geometry Instancing:** Use `THREE.InstancedMesh` for repeated elements in GraphScene (e.g., many similar stars or simple concept nodes).
    2.  **Texture Atlasing:** Combine small textures into larger atlases where appropriate (manual process or using tools, AI should identify candidates).
    3.  **Frustum Culling:** Ensure R3F/Three.js default frustum culling is effective; implement custom culling if needed for complex objects.
    4.  **Draw Call Reduction:** Analyze scenes for opportunities to merge geometries or materials.
    5.  **Shader Optimization:** Review complex shaders (Clouds, Orb) for performance bottlenecks (e.g., reduce texture lookups, simplify calculations for lower LODs).
    Implement `AdaptivePerformance.tsx` component (from `@V7UltimateSpec Section 5.2.4`) to dynamically adjust settings like pixel ratio, shadow quality, and effect intensity based on detected FPS or device tier."
*   **Expected Outcome:** Noticeable improvement in rendering performance (FPS) of 3D scenes, especially GraphScene with many nodes. Adaptive quality settings are functional.
*   **AI Tests:** Use browser performance profiling tools (e.g., Chrome DevTools Performance tab) to measure FPS and identify bottlenecks before and after optimizations. Test on different simulated device profiles.
*   **Human Verification:**
    1.  Navigate through all 3D scenes, especially the GraphScene with a moderate number of nodes.
    2.  Observe FPS (using browser developer tools or an in-app display if added). It should be smoother.
    3.  If `AdaptivePerformance` is testable, try on a less powerful device or simulate one; verify that visual quality might reduce slightly but performance remains acceptable.
*   **Dependencies:** S7.T1, S7.T2, S7.T3 (full scene implementations)

### 14.2. Workstream 5: Orb Implementation (UI & Backend Link)

#### 14.2.1. Task S14.T3: Orb - Contextual Awareness & Proactive Insight Delivery
*   **Significance:** Makes the Orb a truly intelligent companion by enabling it to proactively offer relevant insights or suggestions based on the user's current context or recent activity, rather than only responding to direct queries.
*   **Cursor Prompt:** "Enhance `DialogueAgent.ts` and `OrbStateManager.ts`:
    1.  Implement logic in `DialogueAgent` to periodically check for new, relevant insights for the user (from `DerivedArtifacts` fetched via `InsightService` or `CardService`).
    2.  If a high-priority/relevant insight is found AND the user is in an appropriate context (e.g., idle in CloudScene or Dashboard, not actively typing), the `DialogueAgent` should:
        *   Update `OrbStateManager` to an 'offering_insight' visual state (define this: e.g., gentle glow, specific particle effect).
        *   Send a prompt to the UI (via WebSocket) like, "I noticed something interesting, would you like to explore it?" or a snippet of the insight.
    3.  If the user accepts (e.g., clicks 'Yes' in a UI prompt), the Dialogue Agent then presents the full insight, potentially opening the relevant card or guiding them in the GraphScene.
    Refer to `@V7UltimateSpec Section 8.2 (Daily Engagement - Proactive Insights)` and `@V7UltimateSpec Section 7.6 (User Feedback & Control - Proactivity Settings)` (stub proactivity settings for now)."
*   **Expected Outcome:** The Orb can proactively offer insights to the user at appropriate times. The user can choose to engage with these insights.
*   **AI Tests:**
    *   Backend: Simulate new high-priority insights. Verify `DialogueAgent` detects them and attempts to notify (check logs, mock WebSocket emits).
    *   Frontend: Mock a WebSocket event for a proactive insight. Verify UI prompt appears and Orb state changes.
*   **Human Verification:**
    1.  Ensure some insights are present for the user (S6.T3).
    2.  Interact with the app, then leave it idle for a short period or navigate to the Dashboard.
    3.  Observe if the Orb changes state and if a prompt appears offering an insight.
    4.  If "Yes" is clicked, verify the insight is displayed (e.g., by opening the relevant card or showing text in chat).
*   **Dependencies:** S6.T3 (Insight API/Service), S5.T7 (Orb state mechanism), S10.T1 (Advanced Orb states)

### 14.3. Workstream 8: DevOps & Infrastructure

#### 14.3.1. Task S14.T4: Implement Comprehensive Error Handling & Reporting
*   **Significance:** Makes the application more robust and easier to maintain by ensuring errors are caught gracefully, reported effectively, and users are given helpful feedback.
*   **Cursor Prompt:** "Implement comprehensive error handling:
    1.  **Frontend (`apps/web-app`):**
        *   Use React Error Boundaries for critical UI sections.
        *   Implement global error handlers for API request failures (e.g., in `apiClient.ts` from `@V7UltimateSpec Section 5.5`) to show user-friendly toast notifications or error messages.
        *   Integrate a client-side error reporting service (e.g., Sentry, Bugsnag - configure with a test key).
    2.  **Backend (API Gateway, Cognitive Hub/Services):**
        *   Ensure all API endpoints have robust try-catch blocks and return standardized error responses (e.g., `{ "error": { "message": "...", "code": "..." } }`).
        *   Use the `errorHandlerMiddleware` (from S6.T2.1 in `v7TechSpec.md`) consistently.
        *   Integrate server-side error reporting (Sentry, Bugsnag, or ensure logs are well-structured for parsing by CloudWatch/CLS alarms).
    3.  Update logging (S10.T6) to include detailed error context (stack traces, request IDs)."
*   **Expected Outcome:** Graceful error handling in UI and backend. Errors are reported to a tracking service. Users see helpful messages instead of crashes.
*   **AI Tests:**
    *   Manually introduce errors in frontend components to test Error Boundaries.
    *   Simulate API errors (e.g., 500, 404) and verify UI handles them gracefully.
    *   Induce errors in backend services and verify standardized error responses and logging.
    *   Check Sentry/Bugsnag dashboard for reported errors.
*   **Human Verification:**
    *   Try actions that might fail (e.g., submitting invalid data, trying to access resources without permission, simulating network errors using browser dev tools).
    *   Verify that the UI displays a user-friendly error message instead of crashing.
    *   Check backend logs and error reporting service for detailed error information.
*   **Dependencies:** S10.T6 (Logging), S1.T2 (API Gateway structure)

#### 14.3.2. Task S14.T5: Finalize Local Docker Development Environment
*   **Significance:** Ensures the local development environment is stable, complete, and closely mirrors the production setup, facilitating smooth development and testing.
*   **Cursor Prompt:** "Review and finalize `infrastructure/docker/docker-compose.yml` and associated `Dockerfile`s for all services (`api-gateway`, `cognitive-hub` (or its constituent services if split), `workers`).
    1.  Ensure all necessary environment variables are configurable and documented (e.g., in a `.env.example` file).
    2.  Implement health checks in `docker-compose.yml` for services that depend on others (e.g., API gateway waits for backend services, backend services wait for databases).
    3.  Optimize Docker image build times (e.g., layer caching, multi-stage builds).
    4.  Ensure hot-reloading works for frontend (`web-app`) and backend Node.js services where appropriate for development.
    5.  Document the full local setup and run process in `README.md` at the monorepo root."
*   **Expected Outcome:** A robust, well-documented `docker-compose` setup that allows developers to easily spin up the entire application stack locally.
*   **AI Tests:** Run `docker-compose down -v && docker-compose up --build -d`. Verify all services start correctly and are interconnected. Test hot-reloading for a frontend and backend service.
*   **Human Verification:**
    1.  Follow the updated `README.md` to set up and run the project from scratch using Docker Compose.
    2.  Verify all services start, connect to each other, and the application is fully functional locally.
    3.  Test hot-reloading: make a small code change in `web-app` and a backend service, verify changes are reflected without a full restart.
*   **Dependencies:** S12.T7 (Containerization of all services)

#### 14.3.3. Task S14.T6: Prepare Initial Deployment Scripts (Shell for AWS/Tencent)
*   **Significance:** Lays the groundwork for deploying the application to cloud environments, a critical step towards making the product accessible to users.
*   **Cursor Prompt:** "Create initial deployment scripts/configurations:
    1.  In `infrastructure/env-aws/` and `infrastructure/env-tencent/`, create basic Terraform root configurations (`main.tf`, `variables.tf`, `outputs.tf`) that use the modules defined in S8.T8 (VPC, EKS/TKE, RDS/TencentDB, ElastiCache/Redis). Configure providers.
    2.  Create simple shell scripts (e.g., `deploy-aws.sh`, `deploy-tencent.sh`) in `scripts/deployment/` that would:
        *   (Placeholder) Build Docker images.
        *   (Placeholder) Push images to a container registry (ECR for AWS, TCR for Tencent).
        *   Run `terraform init` and `terraform apply` for the respective environment.
    3.  Focus on the structure and placeholder commands. Actual deployment is out of scope for this task, but the scripts should outline the steps."
*   **Expected Outcome:** Basic Terraform configurations for AWS and Tencent environments. Shell scripts outlining the deployment process.
*   **AI Tests:** Run `terraform init` and `terraform validate` in both `env-aws` and `env-tencent` directories. The shell scripts will mostly be for structure.
*   **Human Verification:** Review Terraform files for basic structural correctness and use of modules. Review shell scripts to ensure they capture the high-level deployment steps. It's not expected to actually deploy to the cloud with these initial scripts.
*   **Dependencies:** S8.T8 (Terraform modules)

---

This completes the detailed roadmap through Sprint 14. The subsequent sprints would focus on:
*   **Full Mobile App Implementation:** Bringing all V7 features to the mobile platform, including 3D scenes and Orb interactions.
*   **Advanced AI Capabilities:** Implementing more sophisticated NLP tools (e.g., for deeper summarization, contradiction detection), fine-tuning LLM interactions, and exploring multi-modal embeddings for search and insight generation.
*   **Ontology Steward Full UI:** Building an admin interface for managing the ontology terms and rules.
*   **User Feedback & Control UI:** Implementing UI elements for users to manage privacy settings, insight proactivity, and provide feedback on AI suggestions.
*   **Comprehensive Testing:** Rigorous end-to-end testing of all user journeys, performance load testing, security vulnerability assessments.
*   **Deployment Automation:** Fully fleshing out the CI/CD pipelines for automated builds, tests, and deployments to staging and production environments for both AWS and Tencent.
*   **Monitoring & Alerting:** Implementing comprehensive monitoring dashboards and alerting rules for production.
*   **Beta Program & Iteration:** Launching a beta program, gathering user feedback, and iterating on features and usability based on real-world usage.

Okay, let's forge ahead with Sprints 15 and 16, moving towards a more feature-complete, robust, and polished application, with a strong emphasis on the unique 3D and AI-driven aspects of 2dots1line.

---

## **Sprint 15: Advanced Orb/Scene Interactivity, Deeper Insights, & Mobile Parity Focus (4 AI-Weeks)**

**Sprint Goal:** Significantly enhance the interactivity within 3D scenes, particularly the GraphScene. Deepen the Insight Engine's capabilities for more nuanced discoveries. Advance mobile app development towards feature parity with key web functionalities. Implement more sophisticated Ontology Steward interactions.

---

### 15.1. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 15.1.1. Task S15.T1: GraphScene - Interactive Filtering and Layout Adjustments
*   **Significance:** Gives users more control over the GraphScene visualization, allowing them to tailor the view to their specific exploration needs and reduce visual clutter.
*   **Cursor Prompt:** "Enhance `GraphScene.tsx` interactivity:
    1.  **Live Filtering:** When filters are applied (from S9.T2 UI), instead of just highlighting/dimming, provide an option to dynamically re-layout the graph showing only the filtered nodes and their direct connections. This might involve re-running the force-directed layout on the subset or using a different layout algorithm.
    2.  **Layout Controls:** Add basic UI controls (perhaps in a GraphScene-specific HUD panel) to adjust force-directed layout parameters (e.g., link distance, charge strength). Store user preferences for these in `UserStore` and apply them.
    3.  **Expand/Collapse Clusters:** If community/constellation visualization (S8.T2) is implemented, allow users to click on a constellation to collapse it into a single meta-node or expand it to show individual nodes."
*   **Expected Outcome:** GraphScene allows users to dynamically filter the displayed nodes and adjust layout parameters. Clusters can be interactively expanded/collapsed.
*   **AI Tests:**
    *   In UI, apply various filters. Verify the graph updates correctly (nodes hide/show, layout re-adjusts).
    *   Test layout control changes – observe if the graph responds.
    *   If clusters are implemented, test expand/collapse functionality.
*   **Human Verification:**
    1.  Apply filters (e.g., by concept type). The graph should smoothly update to show only relevant nodes and their connections.
    2.  Adjust layout parameters (e.g., increase link distance). The graph should re-organize accordingly.
    3.  If constellations are visualized, clicking them should toggle between a collapsed (meta-node) and expanded view.
*   **Dependencies:** S9.T2 (GraphScene search/filter UI), S8.T2 (Community visualization)

#### 15.1.2. Task S15.T2: GraphScene - "Time Travel" or Temporal Exploration
*   **Significance:** Allows users to visualize how their knowledge graph has evolved over time, providing a powerful tool for understanding personal growth and the development of ideas.
*   **Cursor Prompt:** "Implement a 'time travel' or temporal exploration feature in `GraphScene.tsx`:
    1.  Add a date range slider or a timeline UI element to the GraphScene's HUD.
    2.  Modify `/api/graph/nodes` and `/api/graph/links` endpoints in `GraphService` to accept optional `startDate` and `endDate` parameters.
    3.  The backend should filter nodes and relationships based on their `creation_ts` (or `occurred_at` for memories) to only include items created/relevant within the selected time range.
    4.  When the user adjusts the timeline/date range in the UI, `GraphScene` re-fetches data and updates the visualization.
    5.  Consider visual cues for nodes/links appearing or disappearing as the time window changes (e.g., fade in/out animations)."
*   **Expected Outcome:** Users can filter the GraphScene to view their knowledge graph as it existed at different points in time or within specific date ranges.
*   **AI Tests:**
    *   API tests for `/api/graph/nodes` and `/api/graph/links` with date range parameters.
    *   In UI, adjust the time slider. Verify the graph updates to show only relevant nodes/links for that period. Test edge cases (e.g., empty range).
*   **Human Verification:**
    1.  Ensure `MemoryUnit`s and `Concept`s have varying `creation_ts` (or `occurred_at`).
    2.  Use the new timeline/date slider in GraphScene. As you move it, nodes and connections should appear/disappear based on their creation time, effectively showing the graph's evolution.
*   **Dependencies:** S7.T5 (GraphScene data display), S4.T5 (GraphService node fetching), S7.T4 (GraphService link fetching). All entities must have reliable timestamp fields.

### 15.2. Workstream 2: Cognitive Agents & Tools

#### 15.2.1. Task S15.T3: Insight Engine - User-Triggered Insight Generation
*   **Significance:** Empowers users to actively seek insights on specific topics or areas of interest, rather than only relying on proactive suggestions.
*   **Cursor Prompt:** "Enhance the `InsightEngine.ts`:
    1.  Implement a new method `generateInsightsOnDemand(userId: string, focus: { type: 'concept' | 'memory_unit' | 'theme_text', value: string }, insightTypes?: string[]): Promise<DerivedArtifact[]>`.
    2.  `focus` specifies the subject of insight generation.
    3.  If `type` is 'concept' or 'memory_unit', `value` is the ID. The engine should prioritize analyzing this entity and its neighbors.
    4.  If `type` is 'theme_text', `value` is a string provided by the user. The engine should first find related entities in the graph.
    5.  `insightTypes` (optional array like ['co_occurrence', 'temporal_pattern', 'metaphorical']) allows user to request specific types of insights.
    6.  The engine should run relevant discovery algorithms (co-occurrence, temporal, metaphorical from S6.T2, S8.T3, S9.T3) focused on the provided `focus`.
    7.  Create `DerivedArtifacts` for any new insights found.
    Expose this via a new POST endpoint `/api/insights/generate` in the API Gateway as per `@V7UltimateSpec Section 7.2`."
*   **Expected Outcome:** Users can request insights on specific topics or entities, and the Insight Engine will perform a focused analysis and generate relevant `DerivedArtifacts`.
*   **AI Tests:** API tests for `/api/insights/generate` with different focus types. Verify that created insights are relevant to the focus.
*   **Human Verification:**
    1.  Expose a simple UI element (e.g., in Dashboard or Card detail view) to trigger on-demand insight generation for a concept or theme.
    2.  Request insights for a specific concept. Check the `derived_artifacts` table for new insights related to that concept.
    3.  Verify these new insights appear on the Dashboard or are communicated by the Orb.
*   **Dependencies:** S6.T2, S8.T3, S9.T3 (existing insight generation logic), S6.T1 (DerivedArtifactRepository).

#### 15.2.2. Task S15.T4: Ontology Steward - User Feedback on Concepts/Relationships
*   **Significance:** Allows users to correct or refine the AI's understanding of their knowledge, improving the accuracy and personalization of the graph over time. This is a key feedback loop.
*   **Cursor Prompt:** "Implement functionality for user feedback on ontology elements:
    1.  **Backend (`OntologySteward` or a dedicated `FeedbackService`):**
        *   Create a new PostgreSQL table, e.g., `entity_feedback (feedback_id UUID PK, user_id UUID, entity_id UUID, entity_type TEXT, feedback_type TEXT, comment TEXT, suggested_correction JSONB, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ)`.
        *   Implement a method `submitFeedback(userId, entityId, entityType, feedbackType, comment, suggestedCorrection)` that saves feedback to this table. `feedbackType` could be 'incorrect_type', 'misleading_relationship', 'irrelevant_concept', etc. `suggestedCorrection` could hold new type, new relationship label, etc.
    2.  **API Gateway:** Expose this via a POST endpoint `/api/feedback/entity` (or similar, like `/api/concepts/:id/feedback` as in `@V7UltimateSpec Section 7.2`).
    3.  **Ingestion/Insight Agents:** (Future task) Consider how this feedback might be used to refine future processing. For now, focus on capturing it."
*   **Expected Outcome:** Users can submit feedback on concepts and relationships. This feedback is stored in the database for review or future automated learning.
*   **AI Tests:** API tests for the feedback submission endpoint. Verify data is saved correctly to the `entity_feedback` table.
*   **Human Verification:**
    1.  From a card detail view (to be implemented in UI in S15.T6), provide feedback (e.g., "This concept type is wrong").
    2.  Check the `entity_feedback` table in Prisma Studio to ensure the feedback is recorded with all relevant details.
*   **Dependencies:** S1.T1 (ability to create new tables), S1.T2 (API Gateway)

### 15.3. Workstream 6: Card System (UI & Backend Link)

#### 15.3.1. Task S15.T5: UI - Card Annotations & Feedback Integration
*   **Significance:** Provides users with the direct UI tools to annotate their cards and give feedback on AI-generated information, making the knowledge graph more personal and accurate.
*   **Cursor Prompt:** "Enhance `Card.tsx` (detail/back view):
    1.  **Annotations (from S9.T5):** Ensure users can view existing annotations and add new ones. New annotations should be saved via `/api/annotations` and displayed dynamically.
    2.  **Feedback on Concepts/Relationships:**
        *   If the card represents a `Concept`, add UI elements (e.g., a small 'feedback' icon or button) to allow users to:
            *   Suggest a different `Concept.type`.
            *   Report an incorrect or irrelevant concept.
        *   If the card detail view shows relationships to other concepts, allow feedback on those relationships (e.g., "this link is weak", "this link is incorrect").
        *   This UI should trigger calls to the `/api/feedback/entity` endpoint (from S15.T4).
    Refer to `@V7UltimateSpec Section 7.6 (User Feedback & Control)` and `@V7UltimateSpec Section 8.6`."
*   **Expected Outcome:** Card detail views allow users to add annotations and provide feedback on the card's content (e.g., concept type) or its relationships.
*   **AI Tests:** Component tests for feedback UI elements. E2E stub: Submit feedback from a card, mock API call, verify UI confirmation.
*   **Human Verification:**
    1.  Open a `Concept` card's detail view.
    2.  Add an annotation; verify it appears.
    3.  Find a UI element to provide feedback (e.g., "suggest new type"). Submit feedback. Verify an API call is made and check the `entity_feedback` table in the DB.
*   **Dependencies:** S9.T5 (basic annotation UI/API), S15.T4 (feedback API)

#### 15.3.2. Task S15.T6: Mobile UI - Card Detail View
*   **Significance:** Allows mobile users to view the full details of their memories and concepts, including growth dimensions and annotations, bringing mobile closer to web feature parity.
*   **Cursor Prompt:** "In `apps/mobile-app`:
    1.  Create a `CardDetailScreen.tsx`.
    2.  When a card is tapped in the `CardGalleryScreen` (from S12.T3), navigate to this screen, passing the `cardId` and `cardType`.
    3.  Fetch full card details using the `/api/cards/:cardId?type=<type>` endpoint (from S6.T1).
    4.  Display the card's `title`, `description`, `media` (if any), `growthDimensions` (using a mobile-friendly version of `GrowthDimensionIndicator`), and `evolutionState`.
    5.  Display associated `Annotation`s (fetch via `/api/cards/:cardId/annotations`).
    Adapt styling for mobile screens. Card flipping might be replaced by a tabbed view or scrollable sections for details."
*   **Expected Outcome:** Mobile app users can tap on a card in the gallery to see a detailed view with its content, growth dimensions, and annotations.
*   **AI Tests:** Component tests for `CardDetailScreen`. E2E stub on emulator: Tap card in gallery, mock API for details, verify screen displays data.
*   **Human Verification:**
    1.  On the mobile app, tap a card in the gallery.
    2.  Verify the detail screen shows the card's title, description, image (if any).
    3.  Verify growth dimensions are displayed in a readable format.
    4.  Verify any annotations are shown.
*   **Dependencies:** S12.T3 (Mobile Card Gallery), S6.T1 (Card detail API), S9.T5 (Annotation API for fetching)

### 15.4. Workstream 8: DevOps & Infrastructure

#### 15.4.1. Task S15.T7: Implement Backend API Versioning Strategy
*   **Significance:** Prepares the API for future changes without breaking existing clients (especially mobile apps), ensuring smoother updates and long-term maintainability.
*   **Cursor Prompt:** "Implement API versioning for the `apps/api-gateway`. Choose a strategy (e.g., URL path versioning like `/api/v1/...`, or header-based versioning).
    1.  Update API routes to include the version (e.g., `/api/v1/auth/login`).
    2.  Ensure existing API tests are updated to use the versioned endpoints.
    3.  Document the versioning strategy and how to introduce new versions.
    Refer to `@V7UltimateSpec Section 7.2 (API Design)` which implies RESTful, so path versioning is common."
*   **Expected Outcome:** All existing API endpoints are versioned (e.g., under `/api/v1/`). New endpoints will follow this pattern.
*   **AI Tests:** Update all existing API integration tests to use the new versioned paths. Verify they still pass.
*   **Human Verification:**
    1.  Update Postman collections or test scripts to use the versioned API endpoints (e.g., `http://localhost:PORT/api/v1/auth/login`).
    2.  Verify all existing API functionalities work correctly through the versioned paths.
*   **Dependencies:** All existing API endpoints.

---

## **Sprint 16: Cross-Modal Understanding, UI Polish, and Performance Optimization (4 AI-Weeks)**

**Sprint Goal:** Deepen cross-modal understanding by integrating image content more fully into search and insights. Polish the overall UI/UX with refined animations and transitions. Conduct initial performance profiling and optimization across the application.

---

### 16.1. Workstream 2: Cognitive Agents & Tools

#### 16.1.1. Task S16.T1: Ingestion Analyst - Multi-Modal Embeddings (Text + Image)
*   **Significance:** Enables the system to understand and relate text and images more deeply by representing them in a shared embedding space, improving cross-modal search and insight generation.
*   **Cursor Prompt:** "Enhance the embedding strategy:
    1.  Research and select (or stub if complex) a multi-modal embedding model (e.g., CLIP-based models, or models available via Google/DeepSeek AI services that can embed text and images into a compatible space). This might involve creating a new tool `embed.multimodal({text?, imageUrl?})` in `services/cognitive-hub/src/tools/embedding-tools/`.
    2.  When a `MemoryUnit` contains both text (e.g., user's own caption or journal entry) and an image, generate a combined or separate-but-related embedding that captures both modalities.
    3.  Store these multi-modal embeddings in Weaviate, potentially in a dedicated class or by adding a new vector to existing classes (Weaviate supports multiple named vectors per object).
    4.  Update `Chunk.embedding_id` or introduce a new field to reference this multi-modal embedding.
    Refer to `@V7UltimateSpec Section 2.4 (Vector Embedding Strategy - Multi-Modal Embeddings)`."
*   **Expected Outcome:** `MemoryUnit`s with images and text have embeddings that represent both modalities, stored in Weaviate.
*   **AI Tests:** Unit tests for the new multi-modal embedding tool/logic. Integration test: Ingest an image with text. Verify a multi-modal embedding is generated and stored in Weaviate.
*   **Human Verification:**
    1.  Ingest a memory with both an image and a descriptive text.
    2.  Inspect the Weaviate data for this memory/chunk. Verify that an embedding representing both modalities (or separate, clearly linked embeddings) is present.
*   **Dependencies:** S13.T1 (Image analysis), S4.T7 (Basic embedding)

#### 16.1.2. Task S16.T2: Retrieval Planner - Cross-Modal Search
*   **Significance:** Allows users to search using text to find relevant images, or (in the future) use images to find relevant text, significantly enhancing the search experience.
*   **Cursor Prompt:** "Enhance `RetrievalPlanner.getSimilarMemoryUnits`:
    1.  If the query is text and the system has multi-modal embeddings (from S16.T1), perform a vector search in Weaviate that considers both text-only embeddings and the text-part of multi-modal embeddings.
    2.  (Advanced/Stretch) If a query could be interpreted as image-seeking (e.g., "Show me pictures of sunsets"), prioritize results that are `MemoryUnit`s with `Media` of type 'image'.
    3.  The `vector.similar` tool might need an update to query across different Weaviate classes or use named vectors if that's how multi-modal embeddings are stored."
*   **Expected Outcome:** Text queries can now more effectively retrieve `MemoryUnit`s that are primarily image-based if their (generated) captions or multi-modal embeddings match the query.
*   **AI Tests:** Integration tests:
    *   Ingest an image with a distinct subject (e.g., "a photo of a specific mountain").
    *   Search with text describing the image ("show me that mountain picture").
    *   Verify the image memory is retrieved with high relevance.
*   **Human Verification:**
    1.  Ingest an image with a descriptive caption (e.g., "My cat Fluffy sleeping on a red blanket").
    2.  Search using text: "fluffy cat on red". The image memory should be a top result.
    3.  Search using text from the caption. The image memory should be retrieved.
*   **Dependencies:** S16.T1 (Multi-modal embeddings), S4.T8 (Vector similarity search tool)

### 16.2. Workstream 4: UI Foundation & 3D Canvas Core

#### 16.2.1. Task S16.T3: Implement All 3D Canvas Scenes with Full Interactivity
*   **Significance:** Brings the core 3D environments (Cloud, Ascension, Graph) to their full V7 specification, ensuring all designed interactions and visual elements are present and functional.
*   **Cursor Prompt:** "Review `@V7UltimateSpec Section 3 (3D Canvas Layer)` and `Section 5.2 (Frontend - 3D Canvas Layer Implementation)` and `v7UIUXDesign.md Section 3`. For each scene (`CloudScene`, `AscensionScene`, `GraphScene`):
    1.  Ensure all visual elements described (e.g., Memory Stars, Concept Nebulae, Connection Pathways, specific cloud types, atmospheric effects) are implemented with their intended behaviors (e.g., pulsing core for stars, volumetric look for nebulae).
    2.  Implement all specified interactions (e.g., GraphScene node expansion on hover/select from S8.T1, contextual actions from S11.T5).
    3.  Ensure seamless transitions between scenes via `AscensionScene` are polished.
    4.  Connect scene elements to real data from backend services and UI state stores (`SceneStore`, `GraphStore`)."
*   **Expected Outcome:** All three primary 3D scenes are fully implemented, visually rich, interactive as per spec, and data-driven.
*   **AI Tests:** Visual regression tests for key scene states if possible. E2E tests for navigation between scenes and interaction with elements within each scene.
*   **Human Verification:**
    *   Thoroughly explore CloudScene, AscensionScene, and GraphScene.
    *   Verify all visual elements from the design docs are present and look correct.
    *   Test all interactions: node selection, expansion, contextual menus in GraphScene; atmospheric changes in CloudScene; smoothness of AscensionScene.
    *   Ensure data from the backend correctly drives the visuals (e.g., node properties affecting appearance).
*   **Dependencies:** S7.T1, S7.T2, S7.T3, S7.T5, S8.T1, S8.T2, S13.T3, S13.T4, S15.T1, S15.T2

#### 16.2.2. Task S16.T4: UI Performance Profiling & Optimization Pass
*   **Significance:** Identifies and addresses performance bottlenecks in the UI, especially in complex 3D scenes and data-heavy 2D components, to ensure a smooth user experience.
*   **Cursor Prompt:** "Perform a comprehensive performance profiling and optimization pass on the `apps/web-app`:
    1.  Use browser developer tools (Performance tab, React Profiler) to identify bottlenecks in:
        *   `GraphScene` rendering with many nodes/links.
        *   `CloudScene` shader performance.
        *   `CardGallery` rendering with many cards (virtualization effectiveness).
        *   Modal open/close animations.
    2.  Apply optimization techniques: memoization (`React.memo`, `useMemo`, `useCallback`), code splitting (`React.lazy`, Next.js dynamic imports), reducing re-renders, optimizing Three.js object creation/disposal, shader optimization.
    3.  Implement or refine the `AdaptivePerformance` component (S14.T2) to more aggressively manage quality settings (e.g., shadow quality, post-processing effects, particle counts) based on FPS or device tier.
    Refer to `@V7UltimateSpec Section 8.8.2 (GPU Instancing, etc.)`."
*   **Expected Outcome:** Measurable improvements in UI responsiveness, FPS in 3D scenes, and faster load times for data-heavy components.
*   **AI Tests:** Re-run performance benchmarks (if any) and compare before/after. Automated Lighthouse scores for performance.
*   **Human Verification:**
    *   Use the application extensively, focusing on areas previously identified as potentially slow.
    *   Note improvements in fluidity, especially in GraphScene with many nodes and during scene transitions.
    *   Use browser developer tools to check FPS and CPU/GPU usage.
*   **Dependencies:** S14.T2 (Initial performance work)

### 16.3. Workstream 6: Card System (UI & Backend Link)

#### 16.3.1. Task S16.T5: Mobile UI - Card Detail & Basic Interaction
*   **Significance:** Enhances the mobile app by allowing users to not only view card details but also perform basic interactions like adding annotations, similar to the web experience.
*   **Cursor Prompt:** "Enhance the mobile `CardDetailScreen.tsx` in `apps/mobile-app`:
    1.  Allow users to add new annotations. This will involve creating a simple input form within the detail screen and calling the `/api/annotations` POST endpoint.
    2.  Display existing annotations in a scrollable list.
    3.  If feasible within the sprint, implement a simplified way to provide feedback on the concept/memory (e.g., a 'Suggest Correction' button that opens a simple form to call `/api/feedback/entity`).
    Ensure UI is touch-friendly and performs well on mobile devices."
*   **Expected Outcome:** Mobile users can view card details, see existing annotations, and add new annotations. Basic feedback mechanism might be present.
*   **AI Tests:** Component tests for annotation input and display on mobile. E2E stub on emulator: Add annotation, mock API, verify UI update.
*   **Human Verification:**
    1.  On the mobile app, navigate to a card's detail screen.
    2.  Verify existing annotations are displayed.
    3.  Add a new annotation. Verify it appears and is saved to the backend.
    4.  If feedback UI is implemented, test submitting feedback.
*   **Dependencies:** S15.T6 (Mobile Card Detail View), S9.T5 (Annotation API), S15.T4 (Feedback API)

### 16.4. Workstream 8: DevOps & Infrastructure

#### 16.4.1. Task S16.T6: Implement End-to-End Test Suite for Core Journeys
*   **Significance:** Creates an automated suite of tests covering the most critical user flows, ensuring that new changes don't break existing functionality and increasing confidence in releases.
*   **Cursor Prompt:** "Using Playwright (or Cypress), create an initial E2E test suite in `apps/web-app/e2e/` (or a root `e2e/` directory) covering these core user journeys:
    1.  User Registration and Login.
    2.  Creating a new text MemoryUnit (journal entry).
    3.  Viewing the created memory in the Card Gallery.
    4.  Opening the Card Detail view.
    5.  Sending a message to Dot and receiving a response.
    6.  Navigating to the GraphScene and verifying some nodes are displayed.
    The tests should interact with the UI, make assertions about visible content, and where possible, check for API call success/failure. Use page object models for maintainability."
*   **Expected Outcome:** An automated E2E test suite that can be run (e.g., in CI or locally) to validate core application functionality.
*   **AI Tests:** Run the E2E test suite against a local or staging environment. All tests should pass.
*   **Human Verification:** Review the E2E test scripts for clarity and coverage of the specified journeys. Run the suite locally and observe its execution. Ensure it correctly simulates user actions and validates outcomes.
*   **Dependencies:** All features involved in the core journeys must be reasonably stable. A testable environment (local or staging).

#### 16.4.2. Task S16.T7: Security Hardening - Basic Checks & Dependency Audit
*   **Significance:** Addresses common security vulnerabilities and ensures dependencies are up-to-date, reducing the risk of security breaches.
*   **Cursor Prompt:** "Perform basic security hardening:
    1.  **Dependency Audit:** Run `npm audit` (or `yarn audit`) in all relevant `package.json` directories (root, apps, packages, services) and address high/critical vulnerabilities by updating packages or finding alternatives.
    2.  **HTTP Headers:** Ensure `apps/api-gateway` and `apps/web-app` (via Next.js config) set appropriate security headers (e.g., X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Content-Security-Policy - start with a basic CSP). Use `helmet` for Express.
    3.  **Input Validation:** Review critical API endpoints in `api-gateway` and ensure robust input validation is in place for all user-supplied data (using Zod or similar, as started in S6.T3).
    4.  **Rate Limiting Review:** Check that rate limiting (S1.T2) is applied to sensitive endpoints.
    Refer to `@V7UltimateSpec Section 7.3 (Security Considerations)`."
*   **Expected Outcome:** Known critical vulnerabilities in dependencies are addressed. Basic security headers are implemented. Key API endpoints have input validation.
*   **AI Tests:** Run `npm audit --production`. Check HTTP response headers using `curl` or browser dev tools. Send malformed requests to key API endpoints to verify validation.
*   **Human Verification:**
    1.  Review `npm audit` reports and the changes made.
    2.  Use browser developer tools or `curl -I <your_app_url>` to check for security headers like `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and a basic `Content-Security-Policy`.
    3.  Attempt to send malicious or malformed input to critical API endpoints (e.g., login, ingest) and verify proper error handling and rejection.
*   **Dependencies:** All services with external dependencies or handling user input.

---

This roadmap now extends through Sprint 16. We are getting closer to a feature-rich application. The next sprints would likely focus on:
*   **Beta Release Preparation:** Final bug fixes, comprehensive testing, documentation for beta users.
*   **Advanced Personalization:** Using user feedback and interaction patterns to further tailor the experience.
*   **Refining AI Outputs:** Improving the quality, relevance, and coherence of insights and Dot's responses.
*   **Scaling Production Infrastructure:** Implementing auto-scaling, load balancing, and database replication for production.
*   **Full Mobile Feature Implementation:** Bringing the mobile app to parity with the web application.
*   **Admin Tools:** Building out more comprehensive admin interfaces for ontology management, user support, and system monitoring.

Okay, let's continue with Sprints 17 and 18, focusing on advanced personalization, polishing the user experience based on internal testing, and hardening the system for a potential beta release or wider internal testing.

---

## **Sprint 17: Advanced Personalization, UI/UX Polish & Cross-Modal Expansion (4 AI-Weeks)**

**Sprint Goal:** Implement more sophisticated personalization features, refine UI/UX based on internal testing and feedback, expand multi-modal capabilities (e.g., audio ingestion), and improve the depth of AI-generated content.

---

### 17.1. Workstream 2: Cognitive Agents & Tools

#### 17.1.1. Task S17.T1: Dialogue Agent - Personalized Conversation Style
*   **Significance:** Makes Dot's interactions feel more tailored to the individual user by adapting its communication style based on explicit preferences and implicitly learned patterns.
*   **Cursor Prompt:** "Further enhance `DialogueAgent.ts`:
    1.  Utilize the `user.preferences.orbInteractionStyle` ('concise', 'narrative', 'playful') from the `users` table (S13.T6). Modify LLM prompts for response generation to reflect the chosen style (e.g., add instructions like 'Respond concisely' or 'Respond in a more storytelling manner').
    2.  Implement a basic mechanism for the Dialogue Agent to learn from user feedback on its responses. If `Annotation.annotation_type` is 'user_correction' on a `ConversationMessage`, store this feedback (e.g., in `entity_feedback` or a dedicated table) and consider it for future prompt adjustments (this can be a simple heuristic for now, like avoiding similar phrasing if corrected).
    3.  Refine the session-specific memory (from S11.T1) to better recall key topics or user statements from the current conversation to improve coherence."
*   **Expected Outcome:** Dot's conversational style adapts based on user preferences. A basic feedback loop for response quality is in place.
*   **AI Tests:**
    *   Unit tests for prompt generation logic based on `orbInteractionStyle`.
    *   Integration test: Set different `orbInteractionStyle` for a user, send similar queries, and observe differences in Dot's response length/tone. Simulate user correction and check if subsequent similar interactions are handled differently (logging/heuristic check).
*   **Human Verification:**
    1.  Set `orbInteractionStyle` to 'concise', 'narrative', and 'playful' for test users (via API or DB update). Interact with Dot and observe if its responses change in style accordingly.
    2.  If UI for correcting Dot's responses is available (or simulated via API), provide a correction and see if Dot avoids making the same "mistake" in a similar immediate follow-up.
*   **Dependencies:** S11.T1 (advanced context management), S13.T6 (user preferences), S9.T5 (annotation system for feedback).

#### 17.1.2. Task S17.T2: Ingestion Analyst - Audio Memory Ingestion (Transcription)
*   **Significance:** Expands input modalities to include audio, allowing users to capture thoughts and memories via voice notes, which are then transcribed and integrated into the knowledge graph.
*   **Cursor Prompt:** "Enhance `IngestionAnalyst.ts` and introduce an audio processing tool:
    1.  Create a new API endpoint `/api/memory/ingest/audio` in `api-gateway` to accept audio file uploads (e.g., .wav, .mp3, .m4a). Store the audio file in S3/object storage and create a `Media` record with `type='audio'` and the URL. Link this to a new `MemoryUnit` (source_type: 'audio_note').
    2.  Implement an `audio.transcribe({audio_url})` tool in `services/cognitive-hub/src/tools/audio-tools/transcribe.ts`. This tool should use a speech-to-text API (e.g., Google Speech-to-Text, AWS Transcribe, or a robust open-source model like Whisper running as a separate service).
    3.  `IngestionAnalyst` calls `audio.transcribe` for the uploaded audio URL. The returned transcript is stored as the `content` of the parent `MemoryUnit`.
    4.  The transcript text is then processed by the existing text ingestion pipeline (chunking, embedding, concept extraction, `growth_events`).
    Refer to `@V7UltimateSpec Section 2.1.1 (Media)`."
*   **Expected Outcome:** Users can upload audio notes. The system transcribes the audio, stores the transcript, and processes it for knowledge extraction and growth tracking.
*   **AI Tests:**
    *   Unit tests for `audio.transcribe` tool (mocking STT API).
    *   Integration test: Upload an audio file. Verify `Media` and `MemoryUnit` records are created, S3 upload (mocked), transcription occurs (check `MemoryUnit.content`), and subsequent text processing pipeline is triggered.
*   **Human Verification:**
    1.  Upload a sample audio file via a test UI or Postman.
    2.  Check `media` table for the audio file URL.
    3.  Check `memory_units` table for the `MemoryUnit` with the transcript in its `content` field.
    4.  Verify that `concepts`, `chunks`, and `growth_events` are created based on the transcribed text.
*   **Dependencies:** S11.T2 (image ingestion can serve as a template), S3.T1 (text ingestion pipeline).

### 17.2. Workstream 4: UI Foundation & 3D Canvas Core

#### 17.2.1. Task S17.T3: Implement Scene Transitions (CloudScene, AscensionScene, GraphScene)
*   **Significance:** Creates a seamless and aesthetically pleasing flow between the different 3D environments, reinforcing the narrative of journey and exploration within the user's mind space.
*   **Cursor Prompt:** "Implement smooth visual transitions between `CloudScene`, `AscensionScene`, and `GraphScene` as outlined in `@V7UltimateSpec Section 3.2.2 (AscensionScene)` and `v7UIUXDesign.md Section 3.2.2`.
    1.  When transitioning from `CloudScene` to `GraphScene`: Trigger `AscensionScene` as the intermediate state. The camera should animate from the CloudScene perspective, through the AscensionScene's visual phases (acceleration, tunneling, boundary break), and settle into the GraphScene's default camera position.
    2.  When transitioning from `GraphScene` to `CloudScene`: Reverse the AscensionScene (descent), moving from starscape back through clouds to the CloudScene perspective.
    3.  Use `SceneStore` (Zustand) to manage `currentScene`, `targetScene`, and `transitionProgress`. The `SceneManager` should orchestrate the visibility and animation of these scenes during transitions.
    4.  Ensure Orb's scene-specific behavior (S8.T5) transitions smoothly with the scenes."
*   **Expected Outcome:** Smooth, animated transitions between the three main 3D scenes, using AscensionScene as the intermediary.
*   **AI Tests:** In the UI, trigger scene changes (e.g., via HUD buttons). Verify the transitions are visually smooth and follow the specified phases. Check `SceneStore` state during transitions.
*   **Human Verification:**
    1.  From CloudScene, trigger navigation to GraphScene. Observe the full AscensionScene sequence.
    2.  From GraphScene, trigger navigation back to CloudScene. Observe the reverse AscensionScene sequence.
    3.  Ensure Orb behavior changes appropriately during and after transitions.
    4.  Transitions should be visually appealing and not jarring.
*   **Dependencies:** S7.T1 (CloudScene), S7.T2 (AscensionScene), S7.T3 (GraphScene), S7.T8 (HUD for triggering), S8.T5 (Orb scene-specific behavior).

#### 17.2.2. Task S17.T4: UI - User Preference Settings Page
*   **Significance:** Provides users with control over their experience, allowing them to customize aspects like Orb interaction style, insight frequency, and theme, aligning with `@V7UltimateSpec Section 7.6`.
*   **Cursor Prompt:** "Create a 'Settings' page/modal (`apps/web-app/src/app/settings/page.tsx` or similar) accessible from the User Menu in the HUD. This page should allow users to configure preferences stored in `users.preferences` JSONB field:
    1.  Fetch current preferences via `/api/user/profile` (GET).
    2.  Provide UI controls (e.g., dropdowns, toggles) for:
        *   `orbInteractionStyle`: ('concise', 'narrative', 'playful')
        *   `proactiveInsightFrequency`: ('low', 'medium', 'high', 'off')
        *   `preferredInsightTypes`: (checkboxes or multi-select for types like 'temporal_pattern', 'co_occurrence_insight', etc. - fetch available types from a new config endpoint or hardcode for now).
        *   `themePreference`: ('dawn', 'twilight', 'overcast', 'system' - for UI themes if implemented).
        *   `enableVoiceOutput`: (boolean toggle for S10.T2).
    3.  On save, send updated preferences via `/api/user/profile` (PUT) endpoint (ensure this endpoint in `api-gateway` and `UserRepository` supports updating the `preferences` JSONB field - ref S13.T6)."
*   **Expected Outcome:** A settings page where users can view and modify their personalization preferences. Changes are saved to the backend.
*   **AI Tests:** Component tests for the settings form. E2E stub: Load settings page, change a preference, click save, verify API call is made with correct data. Fetch profile again to verify persistence.
*   **Human Verification:**
    1.  Navigate to the new Settings page.
    2.  Verify current preferences (if any) are displayed.
    3.  Change settings (e.g., Orb style, insight frequency). Save.
    4.  Refresh the page or re-login; verify settings persist.
    5.  Check the `users.preferences` field in Prisma Studio.
    6.  Observe if Dot's interaction style changes according to the preference (link to S17.T1).
*   **Dependencies:** S13.T6 (Backend for user preferences), S7.T8 (HUD with User Menu link).

### 17.3. Workstream 1: Core Backend & Data Models

#### 17.3.1. Task S17.T5: Implement `entity_graph_connections_summary` Table and Update Job
*   **Significance:** Provides an efficient way for PostgreSQL to access graph connectivity information (like node degree) without repeatedly querying Neo4j, which is crucial for the performance of the `v_card_evolution_state` view.
*   **Cursor Prompt:** "1. In `packages/database/src/prisma/schema.prisma`, define a new table `entity_graph_connections_summary` with columns: `user_id` (UUID, FK to users), `entity_id` (UUID), `entity_type` (TEXT), `connection_count` (INTEGER), `last_updated_ts` (TIMESTAMPTZ). Create a composite primary key or unique constraint on `(user_id, entity_id, entity_type)`.
    2.  Create a new worker/scheduler job in `workers/graph_sync_worker.ts` (or similar). This job, when run, should:
        *   For each user (or users active recently):
        *   Query Neo4j to get the count of relationships for each relevant node (`Concept`, `MemoryUnit`, `DerivedArtifact`).
        *   Upsert these counts into the `entity_graph_connections_summary` table in PostgreSQL.
    3.  Update the `v_card_evolution_state` view (from S5.T2) to join with this new table to get `connection_count` instead of using a placeholder.
    4.  The job should be runnable on a schedule (e.g., nightly) or triggered after significant graph changes."
*   **Expected Outcome:** A PostgreSQL table `entity_graph_connections_summary` stores node connection counts. A worker job can populate/update this table from Neo4j. The `v_card_evolution_state` view uses this data.
*   **AI Tests:**
    *   Unit test for the worker job logic (mock Neo4j and Prisma calls).
    *   Integration test: Create nodes/relationships in Neo4j. Run the worker job. Query `entity_graph_connections_summary` to verify counts. Query `v_card_evolution_state` to verify it uses the new counts.
*   **Human Verification:**
    1.  Add several nodes and relationships in Neo4j for a test user.
    2.  Manually run the new worker job.
    3.  Check the `entity_graph_connections_summary` table in Prisma Studio. It should contain rows for your test nodes with correct `connection_count`.
    4.  Query `v_card_evolution_state`. The `evolution_state` should now reflect the actual connection counts.
*   **Dependencies:** S5.T2 (v_card_evolution_state view), S4.T1 (Neo4j graph data)

### 17.4. Workstream 6: Card System (UI & Backend Link)

#### 17.4.1. Task S17.T6: UI - Dynamic "Next Step" Suggestions on Cards
*   **Significance:** Makes cards more actionable by providing context-aware suggestions for how the user can further develop or interact with a piece of knowledge, guided by the Six-Dimensional Growth Model.
*   **Cursor Prompt:** "Enhance `CardService.getCardDetails` and `Card.tsx` (back/detail view):
    1.  In `CardService`, when populating `growthDimensions` for a card, if a dimension is 'unactivated' or 'in_progress', generate a `nextStepSuggestion` string. This suggestion should be context-aware (e.g., if 'Know Self' is low for a 'MemoryUnit' card, suggest 'Add a reflection about how this memory made you feel.'). This logic can use simple heuristics or call a (stubbed) LLM tool for more creative suggestions.
    2.  In `Card.tsx` (back side), display these `nextStepSuggestion`s alongside each growth dimension. If a suggestion is actionable (e.g., 'Add a reflection'), make it a button that initiates that action (e.g., opens annotation input).
    Refer to `@V7UltimateSpec Section 4.1.1 (Card System Gamification - Growth Paths & Challenges)`."
*   **Expected Outcome:** The detail view of cards shows actionable suggestions for each growth dimension, guiding the user on how to enrich the card.
*   **AI Tests:** Unit tests for `CardService` suggestion generation logic. Component tests for `Card.tsx` displaying suggestions and action buttons.
*   **Human Verification:**
    1.  View a card in detail that has underdeveloped growth dimensions.
    2.  The UI should display specific suggestions next to those dimensions (e.g., "Reflect on this concept's impact on your values" for 'Know Self').
    3.  Clicking a suggestion (if it's an action like "Add annotation") should initiate the relevant UI flow.
*   **Dependencies:** S6.T5 (Card detail view), S5.T4 (CardService populating growth dimensions)

---

## **Sprint 18: Advanced Insights, Mobile Graph View & Pre-Release Polish (4 AI-Weeks)**

**Sprint Goal:** Implement more advanced insight generation, including metaphorical connections. Introduce a basic version of the GraphScene to the mobile app. Conduct thorough testing, performance tuning, and UI polishing across the application in preparation for a potential beta or internal release.

---

### 18.1. Workstream 2: Cognitive Agents & Tools

#### 18.1.1. Task S18.T1: Insight Engine - Metaphorical Connection Generation & Display
*   **Significance:** Fulfills a key aspect of the V7 vision by enabling the system to generate creative, metaphorical insights, offering users novel ways to understand their knowledge.
*   **Cursor Prompt:** "Fully implement the `InsightEngine.discoverMetaphoricalConnections(userId)` method (started in S9.T3).
    1.  Refine the LLM prompting to generate more compelling and relevant metaphors between concepts from different domains (e.g., from user's 'values' and 'artworks' they've noted). Prompt should ask LLM to explain *why* it's a metaphor.
    2.  Ensure `DerivedArtifacts` of type 'metaphorical_insight' are created with `title`, `description` (the metaphor explanation), and `source_entities`.
    3.  In `CardService`, ensure these 'metaphorical_insight' artifacts can be fetched (e.g., by `/api/dashboard/insights`).
    4.  In `Dashboard.tsx` (or a dedicated insights view), display these metaphorical insights clearly, perhaps with a distinct visual style.
    Refer to `@V7UltimateSpec Section 3.4`."
*   **Expected Outcome:** The Insight Engine generates and stores metaphorical insights. These insights are displayed to the user, for example, on their dashboard.
*   **AI Tests:** Unit tests for the LLM prompting and metaphor evaluation. Integration test: Seed data, run engine, verify `DerivedArtifact` creation and content. API test `/api/dashboard/insights` to fetch them.
*   **Human Verification:**
    1.  Ensure there are diverse concepts in the user's graph.
    2.  Trigger `discoverMetaphoricalConnections`.
    3.  Check `derived_artifacts` table for new 'metaphorical_insight' entries.
    4.  Verify these insights appear on the Dashboard UI, clearly presented as metaphorical connections (e.g., "Your 'Perseverance' is like a 'Sturdy Oak Tree' because...").
*   **Dependencies:** S9.T3 (Insight Engine MVP for metaphors), S6.T7 (Dashboard insight display)

#### 18.1.2. Task S18.T2: Tool Layer - Implement `stats.correlate` and `stats.trend`
*   **Significance:** Provides the Insight Engine with actual statistical tools to find correlations and trends, moving beyond stubbed functionality and enabling more data-driven insights.
*   **Cursor Prompt:** "In `services/cognitive-hub/src/tools/statistical-tools/`, implement:
    1.  `stats.correlate({series_a: number[], series_b: number[], method: 'pearson' | 'spearman'})`: Calculates correlation coefficient.
    2.  `stats.trend({series: number[], window?: number, method?: 'moving_average' | 'linear_regression'})`: Identifies trends.
    These tools should be well-tested. The `InsightEngine` (S8.T3) can then be updated to use these real tools instead of stubs when analyzing `growth_events` or other time-series data (e.g., user-tracked metrics if that feature is added)."
*   **Expected Outcome:** Functional statistical tools for correlation and trend analysis are available to agents.
*   **AI Tests:** Unit tests for `stats.correlate` and `stats.trend` with known datasets and expected outputs.
*   **Human Verification:** (Primarily through code review and unit tests). If the Insight Engine is updated to use them, verify that insights based on trends or correlations become more accurate.
*   **Dependencies:** S8.T3 (Insight Engine using stubs for these)

### 18.2. Workstream 7: GraphScene & Knowledge Visualization (UI & Backend Link)

#### 18.2.1. Task S18.T3: Mobile UI - Basic GraphScene View
*   **Significance:** Introduces the core knowledge graph visualization to the mobile platform, providing a consistent, albeit potentially simplified, exploratory experience.
*   **Cursor Prompt:** "Implement a basic version of `GraphScene.tsx` for `apps/mobile-app` using React Native Three (or a similar library if preferred for React Native + R3F compatibility).
    1.  Fetch node and link data from `/api/graph/nodes` and `/api/graph/links`.
    2.  Render nodes as simple 2D sprites or very basic 3D shapes (consider performance).
    3.  Render links as simple lines.
    4.  Implement basic pan and zoom touch gestures.
    5.  Focus on read-only display and basic navigation. Complex interactions and layouts from web version can be deferred.
    6.  Add navigation to this screen."
*   **Expected Outcome:** Mobile app has a basic, navigable GraphScene displaying nodes and links.
*   **AI Tests:** Run on emulator/device. Verify nodes and links are displayed. Test pan/zoom gestures.
*   **Human Verification:**
    1.  On the mobile app, navigate to the GraphScene.
    2.  Verify nodes and links are visible (they can be simpler than web).
    3.  Test pan and zoom using touch gestures.
    4.  Performance should be acceptable on target mobile devices.
*   **Dependencies:** S7.T5 (Web GraphScene for reference), S4.T5 (Node API), S7.T4 (Link API)

### 18.3. Workstream 4: UI Foundation & 3D Canvas Core

#### 18.3.1. Task S18.T4: UI - Consistent Error Boundary and "Something Went Wrong" Pages
*   **Significance:** Improves application robustness and user experience by providing consistent and user-friendly error handling across the application.
*   **Cursor Prompt:** "1. Create a generic React Error Boundary component in `apps/web-app/src/components/common/ErrorBoundary.tsx`. It should catch JavaScript errors in its child component tree and display a user-friendly "Something went wrong" message with an option to reload or report the issue.
    2.  Wrap major sections of the application (e.g., `Canvas3D`, `ModalLayer`, individual scenes, Dashboard, CardGallery) with this `ErrorBoundary`.
    3.  Create a global error page (e.g., Next.js `_error.js` or a custom error page for App Router) that provides a consistent message for unhandled server-side or client-side routing errors.
    4.  Ensure error reporting (S14.T4 - Sentry/Bugsnag) is triggered by these boundaries/pages."
*   **Expected Outcome:** Application gracefully handles unexpected errors in different parts of the UI, showing a consistent error message and reporting the error.
*   **AI Tests:** Manually introduce errors into different components to test if the Error Boundary catches them and displays the fallback UI. Test server errors or invalid routes.
*   **Human Verification:**
    1.  Temporarily introduce a runtime error in a component (e.g., accessing an undefined property). Verify the Error Boundary catches it and displays a friendly message.
    2.  Navigate to a non-existent route. Verify the global error page is shown.
    3.  Check Sentry/Bugsnag to see if these errors are reported.
*   **Dependencies:** S14.T4 (Error reporting setup)

### 18.4. Workstream 8: DevOps & Infrastructure

#### 18.4.1. Task S18.T5: CI/CD Pipeline - Add Build & Basic Test Stages for All Services
*   **Significance:** Automates the building and basic testing of all backend services and frontend applications, ensuring that code changes are validated before integration.
*   **Cursor Prompt:** "Enhance the GitHub Actions CI workflow (`.github/workflows/ci-pr.yml` from S0.T2):
    1.  Add steps to build all applications in `apps/*` (e.g., `turbo run build --filter=web-app`, `turbo run build --filter=api-gateway`).
    2.  Add steps to build all backend services in `services/*` (e.g., `turbo run build --filter=cognitive-hub`).
    3.  Add steps to run unit tests for all packages and services that have them (e.g., `turbo run test`).
    4.  Ensure the workflow correctly handles caching of dependencies (e.g., `node_modules`) to speed up builds.
    5.  The workflow should fail if any build or test step fails."
*   **Expected Outcome:** The CI pipeline now builds all applications/services and runs all available unit tests on every pull request.
*   **AI Tests:** (Manual trigger or PR) The CI workflow should run and pass if all code is correct. Introduce a failing test in one package and verify the CI run fails.
*   **Human Verification:** Make a small change in a backend service and a frontend app, then create a PR. Observe the GitHub Actions run. Verify that build steps for all relevant projects are executed and that unit tests are run.
*   **Dependencies:** S0.T2 (Basic CI), Unit tests written in previous sprints for various packages/services.

#### 18.4.2. Task S18.T6: Initial Load Testing Strategy & Basic Backend Test
*   **Significance:** Begins the process of understanding the system's performance characteristics under load, identifying potential bottlenecks before they impact users.
*   **Cursor Prompt:** "1. Document an initial load testing strategy: identify key API endpoints to test (e.g., login, memory ingest, card fetching, dialogue message). Define basic load parameters (e.g., number of virtual users, ramp-up time, duration).
    2.  Set up a simple load testing script using a tool like k6 or Artillery.
    3.  As a first test, target the `/api/health` and `/api/auth/login` endpoints of the locally running `api-gateway` (via Docker Compose).
    4.  Run a small load test (e.g., 10 virtual users for 1 minute) and record basic metrics like response time (avg, p95) and error rate."
*   **Expected Outcome:** A documented load testing strategy. A basic k6/Artillery script capable of testing a few endpoints. Initial baseline performance metrics for login.
*   **AI Tests:** Run the k6/Artillery script against the local environment. Verify it executes and reports metrics.
*   **Human Verification:** Review the load testing strategy document. Run the k6 script locally. Observe the output for average response times and any errors. This is more about setting up the capability than achieving specific performance targets at this stage.
*   **Dependencies:** S0.T3 (Local Docker environment), S1.T2 (Auth endpoints).

---

This concludes the roadmap through Sprint 18. The application should now be quite feature-rich, with core AI functionalities, immersive UI, and initial mobile presence. The focus will increasingly shift towards refinement, user feedback integration, mobile development, advanced AI, and operational readiness for a wider audience.

Okay, let's continue with Sprints 19 and 20, focusing on refining user experience based on feedback, improving AI accuracy, scaling considerations, and comprehensive testing for a stable beta release.

---

**Sprint 19: User Feedback Integration, AI Refinement & Mobile Polish (4 AI-Weeks)**

**Sprint Goal:** Incorporate early user/internal feedback. Refine AI agent responses and insight quality. Enhance mobile app features, particularly around card interaction and offline capabilities. Improve system stability and observability.

---

### 19.1. Workstream 2: Cognitive Agents & Tools

#### 19.1.1. Task S19.T1: Dialogue Agent - LLM Response Evaluation & Refinement
*   **Significance:** Improves the quality, relevance, and helpfulness of Dot's (Dialogue Agent) responses by establishing a feedback loop and iterative refinement process for LLM prompts and outputs.
*   **Cursor Prompt:** "Implement a basic LLM response evaluation mechanism for the `DialogueAgent`:
    1.  For a subset of user interactions (e.g., flagged by users or sampled), store the user query, context provided to LLM, and the LLM's raw response in a dedicated PostgreSQL table (e.g., `llm_interactions_log`).
    2.  Create a simple internal tool or script that allows a human reviewer to rate these logged interactions (e.g., on relevance, coherence, helpfulness) and provide corrections or suggestions.
    3.  `DialogueAgent` developers will use this feedback to iteratively refine system prompts, context-building strategies, and potentially explore fine-tuning smaller models for specific sub-tasks (long-term goal).
    4.  As a first step, add a 'thumbs up/down' feedback mechanism to chat messages in the UI (`ChatInterface.tsx`), sending this feedback to a new API endpoint (`POST /api/dialogue/feedback`) which logs it, associating with the specific `ConversationMessage`."
*   **Expected Outcome:** A system for logging and reviewing LLM interactions. UI allows users to give basic feedback on Dot's responses. This feedback is stored for analysis.
*   **AI Tests:**
    *   Unit tests for logging LLM interactions and user feedback.
    *   API test for the `/api/dialogue/feedback` endpoint.
    *   In UI, click thumbs up/down on a message; verify API call and DB log.
*   **Human Verification:**
    1.  Engage in several conversations with Dot.
    2.  Use the new thumbs up/down UI in the chat to provide feedback.
    3.  Check the `llm_interactions_log` (or similar) and the feedback table in Prisma Studio to see if interactions and feedback are being recorded correctly.
    4.  (Manual) Review some logged interactions and consider how prompts could be improved.
*   **Dependencies:** S11.T1 (Advanced context management), S6.T9 (Chat UI)

#### 19.1.2. Task S19.T2: Insight Engine - Insight Relevance Tuning
*   **Significance:** Improves the quality of proactive insights by incorporating user feedback and interaction data to better determine what users find valuable.
*   **Cursor Prompt:** "Enhance the `InsightEngine`:
    1.  Track user interactions with `DerivedArtifacts` (insights) displayed on the Dashboard (e.g., clicks, dismissals, explicit feedback like 'useful'/'not useful' if UI for this is added). Store this in `user_activity_log` or a dedicated `insight_feedback` table.
    2.  Modify the insight ranking/selection logic in `InsightEngine.discoverPatterns` (and other insight generation methods) to consider this feedback. For example, down-weight insight types or patterns that are frequently dismissed or rated poorly by a user.
    3.  Refine `novelty_score` calculation for insights (`@V7UltimateSpec Section 3.4`) to better reflect what the user hasn't engaged with recently.
    4.  Allow users to explicitly dismiss or "snooze" insights from the Dashboard UI. This action should be recorded and used to prevent showing similar insights too soon."
*   **Expected Outcome:** The Insight Engine starts learning from user feedback to provide more relevant and timely insights. Users can dismiss insights.
*   **AI Tests:**
    *   Unit tests for insight ranking logic incorporating feedback.
    *   Simulate user feedback on insights. Run insight generation. Verify that previously downvoted/dismissed insight types are less likely to be generated or are ranked lower.
*   **Human Verification:**
    1.  Interact with insights on the Dashboard: click some, ignore others. If a dismiss/feedback UI is present, use it.
    2.  Over time (or by manually adjusting feedback data), observe if the types of insights suggested by the Insight Engine begin to align better with positive interactions or avoid patterns similar to dismissed ones.
*   **Dependencies:** S6.T7 (Dashboard insight display), S12.T6 (User activity logging)

### 19.2. Workstream 6: Card System (UI & Backend Link)

#### 19.2.1. Task S19.T3: UI - Card Interaction Polish & Batch Actions
*   **Significance:** Enhances the usability of the Card Gallery by refining interactions and adding convenience features like batch operations.
*   **Cursor Prompt:** "In `CardGallery.tsx` and `Card.tsx`:
    1.  **Refine Hover/Focus States:** Ensure clear visual distinction for hovered vs. focused cards, consistent with `@V7UIUXDesign.md`. Implement smooth transitions for these states.
    2.  **Drag-and-Drop (Conceptual):** If cards can be organized into user-defined collections or if their order matters in some views, implement basic drag-and-drop reordering within the gallery (e.g., using `dnd-kit`). This is a stretch goal; at minimum, plan the data model changes needed for custom ordering (e.g., an order field in a junction table).
    3.  **Batch Actions (MVP):** Implement a selection mode for cards in the gallery. Allow users to select multiple cards and perform a basic batch action, e.g., 'Add Tag to Selected'. This requires UI for selection (checkboxes on cards) and an API endpoint to handle batch tagging."
*   **Expected Outcome:** Card interactions in the gallery are smoother. Users can select multiple cards and apply a common tag (MVP for batch actions).
*   **AI Tests:** Component tests for selection mode and batch action UI. E2E stub for selecting multiple cards and triggering a batch tag action.
*   **Human Verification:**
    1.  In Card Gallery, verify hover and focus states are clear and transitions are smooth.
    2.  Test selection mode: select multiple cards.
    3.  Test the 'Add Tag to Selected' action: apply a tag, verify it's added to the selected cards (check DB and card details UI if available).
*   **Dependencies:** S6.T5 (Card detail view), S3.T4 (Card Gallery UI)

#### 19.2.2. Task S19.T4: Mobile UI - Card Creation & Editing (Text-based Memories)
*   **Significance:** Enables users to create and edit basic text-based memories directly from the mobile app, a core functionality for on-the-go capture.
*   **Cursor Prompt:** "In `apps/mobile-app`:
    1.  Create a `MemoryEditScreen.tsx`. This screen should have input fields for `title` and `content` (multi-line text input).
    2.  Add a 'New Memory' button (e.g., in the Card Gallery or a global FAB) that navigates to `MemoryEditScreen`.
    3.  Implement a 'Save' button on `MemoryEditScreen` that calls the `/api/memory/ingest/text` endpoint (S3.T2) with the title and content.
    4.  Allow editing existing text-based `MemoryUnit`s: When viewing a text memory card in `CardDetailScreen` (S15.T6), add an 'Edit' button that navigates to `MemoryEditScreen` pre-filled with the memory's data. Saving should call a new `PUT /api/memory/:muid` endpoint (to be created in MemoryService) to update the `MemoryUnit` and re-trigger relevant parts of the ingestion/analysis pipeline for the updated content."
*   **Expected Outcome:** Mobile users can create new text-based memories and edit existing ones. Changes are synced with the backend.
*   **AI Tests:** Component tests for `MemoryEditScreen`. E2E test on emulator: create a new memory, save, verify it appears in gallery. Edit an existing memory, save, verify changes.
*   **Human Verification:**
    1.  On the mobile app, create a new text memory. Verify it's saved and appears in the card list.
    2.  Open an existing text memory, edit its content, and save. Verify the changes are reflected.
    3.  Check the PostgreSQL `memory_units` table for new/updated records.
*   **Dependencies:** S15.T6 (Mobile Card Detail View), S3.T2 (Text Ingestion API), Backend logic for updating memories and re-processing.

### 19.3. Workstream 1: Core Backend & Data Models

#### 19.3.1. Task S19.T5: Backend - API Endpoint for Updating MemoryUnit
*   **Significance:** Provides the necessary backend functionality to support editing memories from any client, including the mobile app.
*   **Cursor Prompt:** "In `MemoryService` (or `cognitive-hub`):
    1.  Implement a method `async updateMemoryUnit(userId: string, muid: string, data: { title?: string, content?: string, ...other_updatable_fields }): Promise<MemoryUnit>`.
    2.  This method should update the `MemoryUnit` in PostgreSQL.
    3.  If `content` is updated, it should re-trigger parts of the ingestion pipeline: re-chunking, re-embedding, re-extracting concepts, and generating new/adjusting existing `growth_events` for the updated content. This might involve deleting old chunks/embeddings/events related to the old content or marking them as outdated.
    4.  Expose this via a `PUT /api/memory/:muid` endpoint in the API Gateway."
*   **Expected Outcome:** An API endpoint to update existing `MemoryUnit`s. Content updates trigger re-analysis.
*   **AI Tests:** API tests for `PUT /api/memory/:muid`. Verify `MemoryUnit` is updated. If content changes, verify related chunks, embeddings, and growth events are updated/re-created.
*   **Human Verification:**
    1.  Ingest a memory.
    2.  Use Postman to call `PUT /api/memory/:muid` to change its title and content.
    3.  Verify the `memory_units` table is updated.
    4.  Check if `chunks`, `embeddings` (in Weaviate), `concepts` linked, and `growth_events` reflect the new content.
*   **Dependencies:** S3.T1 (Ingestion Analyst), S3.T2 (Ingestion API).

### 19.4. Workstream 8: DevOps & Infrastructure

#### 19.4.1. Task S19.T6: Implement Staging Environment Setup
*   **Significance:** Creates a pre-production environment that mirrors production, allowing for thorough testing of new features and changes before they go live to users.
*   **Cursor Prompt:** "Using the Terraform modules (from S8.T8 and S10.T6):
    1.  In `infrastructure/env-aws/` (or `env-tencent/`), create a new Terraform workspace or configuration directory for a 'staging' environment.
    2.  Configure this environment with smaller instance sizes and potentially fewer replicas than production, but with all the same services (PostgreSQL, Neo4j, Weaviate, Redis, API Gateway, Cognitive Hub, Workers).
    3.  Update CI/CD pipeline (`deployment.yml` from S0.T2, likely needing a new workflow) to allow deployment to this staging environment (e.g., on merge to a `develop` or `staging` branch).
    4.  Document how to deploy to and access the staging environment."
*   **Expected Outcome:** A functional staging environment can be provisioned using Terraform. CI/CD can deploy to staging.
*   **AI Tests:** `terraform plan` and `terraform apply` for the staging environment configuration. CI/CD successfully deploys a build to the staging environment.
*   **Human Verification:**
    1.  Review Terraform configurations for staging.
    2.  Attempt a deployment to the staging environment using the CI/CD pipeline (or manually running Terraform apply).
    3.  Verify all services are running in the staging environment and are accessible.
    4.  Perform a quick smoke test of the application on staging.
*   **Dependencies:** S14.T6 (Deployment scripts/Terraform basics), S12.T7 (Containerized services).

---

**Sprint 20: Beta Candidate Preparation & End-to-End Refinement (4 AI-Weeks)**

**Sprint Goal:** Achieve a feature-complete state for a beta release. Conduct thorough end-to-end testing of all core user journeys. Implement final UI polish, performance optimizations, and security checks. Prepare documentation for beta testers.

---

### 20.1. Workstream W_ALL: End-to-End Testing & Bug Fixing

#### 20.1.1. Task S20.T1: Comprehensive E2E Testing of Core Journeys
*   **Significance:** Ensures all critical user paths are working as expected from start to finish, catching integration issues and regressions before a wider release.
*   **Cursor Prompt:** "Expand and execute the E2E test suite (from S16.T6) to cover these user journeys comprehensively on a staging environment:
    1.  **Onboarding:** Registration, initial preference setting, first memory capture.
    2.  **Daily Engagement:** Logging in, viewing Dashboard (insights, recent memories, active challenges), quick journaling.
    3.  **Memory Management:** Creating text, image, and audio memories. Viewing them in Card Gallery and GraphScene. Editing and annotating memories.
    4.  **Concept Exploration:** Discovering concepts from memories, viewing concept cards, exploring related concepts in GraphScene.
    5.  **Insight Interaction:** Receiving proactive insights (Orb/Dashboard), requesting insights.
    6.  **Challenge Engagement:** Starting, progressing (if applicable), and completing challenges, receiving rewards.
    7.  **Orb Interaction:** Basic chat, voice commands (if S10.T2 is stable), contextual prompts from Orb.
    Identify and log all bugs found. Prioritize fixing critical and high-severity bugs."
*   **Expected Outcome:** A robust E2E test suite covering all main user flows. Identified bugs are triaged and addressed. The application is stable across these journeys.
*   **AI Tests:** The E2E test suite itself (`npm run test:e2e`). AI can be tasked to write new test cases for specific sub-flows.
*   **Human Verification:**
    1.  Manually execute all defined core user journeys on the staging environment.
    2.  Verify each step behaves as expected according to `@V7UltimateSpec`.
    3.  Cross-reference with AI-reported E2E test results.
    4.  Focus on flow, data consistency, and UI responsiveness.
*   **Dependencies:** S19.T6 (Staging environment), All previously implemented features.

### 20.2. Workstream 4: UI Foundation & 3D Canvas Core

#### 20.2.1. Task S20.T2: Final UI Polish & Consistency Check
*   **Significance:** Ensures the user interface is visually consistent, aesthetically pleasing, and free of minor UI bugs or inconsistencies, providing a professional and delightful user experience.
*   **Cursor Prompt:** "Conduct a thorough UI polish pass across the entire `apps/web-app`:
    1.  Review all screens and components against `v7UIUXDesign.md` and any provided mockups (@V7UIMockups).
    2.  Ensure consistent application of design tokens (colors, typography, spacing, radii, shadows - `@V7UltimateSpec Section 7.7`).
    3.  Refine all animations and transitions for smoothness and adherence to the 'Amorphous Design Principle' and 'Purposeful Choreography' (`@V7UltimateSpec Section 3.2.4`).
    4.  Check for responsive design issues on various screen sizes (desktop, tablet, mobile web).
    5.  Ensure all interactive elements have clear hover, focus, and active states.
    6.  Standardize empty states, loading indicators, and error messages."
*   **Expected Outcome:** A highly polished and visually consistent UI across the web application.
*   **AI Tests:** Visual regression tests (if implemented) should pass. Automated accessibility checks (e.g., Axe).
*   **Human Verification:**
    1.  Methodically go through every screen and interactive element of the web application.
    2.  Compare against design mockups and the UI/UX specification.
    3.  Check for consistent spacing, typography, color usage.
    4.  Test on different browsers and screen resolutions.
    5.  Pay attention to micro-interactions and animations.
*   **Dependencies:** All UI components from previous sprints.

### 20.3. Workstream 8: DevOps & Infrastructure

#### 20.3.1. Task S20.T3: Performance Optimization - Backend & Database
*   **Significance:** Optimizes backend services and database queries to ensure the application is responsive and can handle a reasonable load, crucial for a good user experience.
*   **Cursor Prompt:** "Identify and address backend performance bottlenecks:
    1.  Analyze logs (from S10.T6) and APM data (if basic APM setup) for slow API endpoints or agent processes.
    2.  Review critical database queries (PostgreSQL, Neo4j) for efficiency. Add indexes where necessary based on query plans (`EXPLAIN ANALYZE`).
    3.  Optimize `CardService` and `GraphService` data fetching logic, potentially introducing more caching layers (Redis) for frequently accessed, slowly changing data (e.g., aggregated growth stats, popular concepts).
    4.  Benchmark critical API endpoints identified in S18.T6 under moderate load and aim to improve p95 response times.
    Refer to PostgreSQL and Neo4j optimization sections in `@V7UltimateSpec Section 5`."
*   **Expected Outcome:** Improved response times for key backend APIs and more efficient database queries. Reduced server load under normal operation.
*   **AI Tests:** Re-run load tests from S18.T6 and compare metrics. Write specific benchmark tests for optimized queries/services.
*   **Human Verification:**
    1.  Review query execution plans for identified slow queries before and after optimization.
    2.  Use API testing tools (Postman) to measure response times of key endpoints after optimization.
    3.  Monitor CPU/memory usage of backend services and databases under simulated load.
*   **Dependencies:** S18.T6 (Load testing setup), S10.T6 (Logging/APM)

#### 20.3.2. Task S20.T4: Security Review and Hardening Pass
*   **Significance:** Conducts a focused security review to identify and mitigate potential vulnerabilities before a wider release.
*   **Cursor Prompt:** "Perform a security review and hardening pass based on `@V7UltimateSpec Section 7.3`:
    1.  **Input Validation:** Systematically review all API endpoints in `api-gateway` for comprehensive input sanitization and validation (e.g., against SQL injection, XSS for any data rendered as HTML).
    2.  **Authentication & Authorization:** Verify all protected resources correctly enforce authentication. Check for any potential authorization bypasses (e.g., ensuring users can only access/modify their own data).
    3.  **Session Management:** Review JWT handling, token expiration, and secure storage on the client-side.
    4.  **Dependency Vulnerabilities:** Run `npm audit fix --force` (with caution) or manually update any remaining medium/high severity vulnerabilities.
    5.  **Rate Limiting:** Ensure rate limits are appropriately configured on sensitive endpoints (login, registration, resource-intensive queries).
    6.  Check for common misconfigurations (e.g., overly permissive CORS, debug information in production)."
*   **Expected Outcome:** Identified security vulnerabilities are mitigated. Application follows security best practices.
*   **AI Tests:** Run automated security scanning tools if available (e.g., Snyk, Dependabot alerts). Write specific API tests for invalid/malicious inputs.
*   **Human Verification:**
    1.  Perform manual penetration testing attempts for common vulnerabilities (e.g., try XSS payloads in input fields, attempt to access other users' data by manipulating IDs in API calls).
    2.  Review JWT implementation for secure practices.
    3.  Verify CORS headers are restrictive.
    4.  Check if sensitive information is logged or exposed in error messages.
*   **Dependencies:** S16.T7 (Basic security checks)

### 20.4. Workstream W_ALL: Documentation

#### 20.4.1. Task S20.T5: Prepare Beta Tester Guide & Internal Documentation
*   **Significance:** Creates essential documentation to support beta testers in using the application and for internal teams to understand and maintain the system.
*   **Cursor Prompt:** "Create initial documentation:
    1.  **Beta Tester Guide:** A simple guide explaining core features, how to get started, key user journeys (from S20.T1), and how to report bugs or provide feedback. Focus on user-facing aspects.
    2.  **Internal Technical Documentation (High-Level):**
        *   Update `README.md` in the monorepo root with project overview, setup instructions (from S14.T5), and pointers to more detailed docs.
        *   Briefly document the purpose and API of each major service/agent in their respective `README.md` files.
        *   Document the core data models and their relationships (can reference `@V7UltimateSpec` but provide a concise summary).
        *   Outline the CI/CD and deployment process (referencing S19.T6).
    This is not exhaustive documentation but key information for initial users and ongoing development."
*   **Expected Outcome:** A user-friendly Beta Tester Guide. Core technical documentation available for the development team.
*   **AI Tests:** N/A (content generation).
*   **Human Verification:**
    1.  Review the Beta Tester Guide for clarity, accuracy, and completeness from a new user's perspective.
    2.  Review the internal technical documentation. Is it sufficient for a new developer to get an overview of the system? Are setup and deployment instructions clear?
*   **Dependencies:** All core features implemented.

---

This concludes Sprint 20. At this point, the 2dots1line V7 application should be approaching a feature-complete state for its core vision, with significant UI polish, performance considerations addressed, and initial security hardening. The next logical step would be a closed beta release, followed by sprints focused on bug fixing, incorporating beta feedback, further performance tuning, and scaling for a wider launch.

Okay, let's continue with Sprints 21 and 22, which will focus on a Beta Release, gathering user feedback, and iterating based on that feedback, along with further performance and scalability improvements.

---

## **Sprint 21: Beta Release, Feedback Collection & Initial Iteration (4 AI-Weeks)**

**Sprint Goal:** Launch a closed beta to a select group of users. Establish robust feedback collection mechanisms. Begin iterating on features and fixing bugs based on initial beta tester feedback. Focus on stability and usability.

---

### 21.1. Workstream W_ALL: Release Management & Feedback

#### 21.1.1. Task S21.T1: Prepare and Execute Beta Release
*   **Significance:** The first real-world deployment of 2dots1line V7 to actual users, providing invaluable feedback for future development.
*   **Cursor Prompt:** "Coordinate the beta release:
    1.  Finalize the build for deployment to the staging environment (or a dedicated beta environment if created).
    2.  Run a full regression test suite (E2E tests from S20.T1 and critical manual tests).
    3.  Prepare communication materials for beta testers (welcome email, link to Beta Tester Guide from S20.T5, instructions for reporting feedback).
    4.  Deploy the finalized build to the beta environment.
    5.  Onboard the initial set of beta testers.
    Ensure all logging and error reporting (S10.T6, S14.T4) are active and monitored."
*   **Expected Outcome:** 2dots1line V7 is deployed to a beta environment and accessible to a select group of users. Feedback channels are open.
*   **AI Tests:** N/A (this is a coordination and deployment task).
*   **Human Verification:**
    1.  Confirm the beta environment is stable and running the correct build.
    2.  Successfully onboard a few internal "beta testers" first.
    3.  Verify that beta testers can register, log in, and use core features.
    4.  Monitor logs and error reporting tools for any immediate issues.
*   **Dependencies:** S19.T6 (Staging environment), S20.T1 (E2E tests), S20.T5 (Beta Tester Guide)

#### 21.1.2. Task S21.T2: Implement Feedback Collection Mechanisms
*   **Significance:** Establishes clear channels for beta testers to report bugs, suggest features, and provide general feedback, which is crucial for iterative improvement.
*   **Cursor Prompt:** "Set up feedback collection mechanisms:
    1.  **In-App Feedback (Web & Mobile):** Add a simple 'Send Feedback' button/link in the UI (e.g., in HUD or settings page). This could open a modal with fields for feedback type (bug, suggestion, general), description, and optionally allow screenshot attachment. Submitting should send data to a dedicated API endpoint (e.g., `POST /api/feedback/submit`) which stores it in a `user_feedback` table in PostgreSQL.
    2.  **External Channels:** Set up a dedicated email address (e.g., beta-feedback@2dots1line.com) or a simple feedback forum/tool (e.g., UserVoice, Canny.io, or even a shared document/Discord channel for a small beta).
    3.  Ensure the Beta Tester Guide (S20.T5) clearly explains how to use these channels."
*   **Expected Outcome:** Beta testers have multiple clear ways to provide feedback. Feedback is collected and stored systematically.
*   **AI Tests:**
    *   Unit tests for the backend `/api/feedback/submit` endpoint and service logic.
    *   Component tests for the in-app feedback modal.
    *   E2E stub: Submit feedback through the in-app form, verify API call and data storage.
*   **Human Verification:**
    1.  Use the in-app feedback form to submit a test bug report and a feature suggestion. Verify it's received and stored (check `user_feedback` table).
    2.  Send a test email to the feedback address.
    3.  Confirm the Beta Tester Guide includes clear instructions for feedback.
*   **Dependencies:** S20.T5 (Beta Tester Guide), `users` table (for `user_id` in feedback)

### 21.2. Workstream W_ALL: Bug Fixing & Initial Iteration (Based on Feedback)

#### 21.2.1. Task S21.T3: Triage and Prioritize Beta Feedback
*   **Significance:** Systematically process incoming feedback to identify critical issues and valuable suggestions, guiding development efforts effectively.
*   **Cursor Prompt:** "Establish a process for triaging beta feedback:
    1.  Regularly review feedback from all channels (in-app, email, forum).
    2.  Categorize feedback (bug, feature request, usability issue, performance issue).
    3.  Prioritize bugs based on severity (critical, high, medium, low) and impact.
    4.  Log confirmed bugs and actionable feature requests into the project's issue tracker (e.g., GitHub Issues, Jira).
    This task is ongoing throughout the beta period."
*   **Expected Outcome:** A system for managing and prioritizing beta feedback is in place. Issues are tracked.
*   **AI Tests:** N/A (process-oriented).
*   **Human Verification:** Set up a shared spreadsheet or use an issue tracker. As sample feedback comes in (or is simulated), practice triaging, categorizing, and prioritizing it.
*   **Dependencies:** S21.T2 (Feedback mechanisms active)

#### 21.2.2. Task S21.T4: Address Critical & High-Priority Bugs from Beta Feedback
*   **Significance:** Quickly resolve issues that significantly impact the user experience or stability for beta testers, demonstrating responsiveness and improving the product.
*   **Cursor Prompt:** "Based on the prioritized bug list from S21.T3, assign AI agents to fix critical and high-priority bugs. For each bug:
    *   Provide the agent with the bug report details.
    *   Instruct the agent to identify the root cause in the relevant codebase area (e.g., `apps/web-app/src/components/cards/Card.tsx` or `services/cognitive-hub/src/agents/ingestion/ingestion-analyst.ts`).
    *   Instruct the agent to implement the fix and write corresponding unit or integration tests to prevent regressions.
    *   Example prompt for a bug: 'Bug Report: Card titles are not displaying special characters correctly in `Card.tsx`. The issue is likely in how the title string is rendered or sanitized. Please investigate `Card.tsx` and `CardService.ts`, ensure proper UTF-8 handling or HTML entity encoding/decoding if necessary, and add a test case with special characters.' "
*   **Expected Outcome:** Critical and high-priority bugs reported by beta testers are resolved and deployed to the beta environment.
*   **AI Tests:** Run existing E2E tests and any new tests written for the bug fixes.
*   **Human Verification:** For each fixed bug:
    1.  Review the code changes made by the AI.
    2.  Reproduce the original bug report steps on a build *before* the fix to confirm the bug.
    3.  Test the fix on a build *with* the fix to confirm the bug is resolved.
    4.  Verify that the new tests cover the bug scenario.
*   **Dependencies:** S21.T3 (Prioritized bug list)

### 21.3. Workstream 4: UI Foundation & 3D Canvas Core

#### 21.3.1. Task S21.T5: UI/UX Refinements Based on Beta Feedback
*   **Significance:** Improves the usability and intuitiveness of the application by addressing pain points and incorporating suggestions identified by beta testers.
*   **Cursor Prompt:** "Analyze beta feedback related to UI/UX (e.g., confusing navigation, unclear icons, difficult interactions). For selected high-impact feedback items:
    *   **Example Prompt 1:** 'Beta feedback indicates the transition between GraphScene and Card Detail view is not intuitive. In `GraphScene.tsx`, when a node is focused, ensure the 'View Details' action in the contextual menu (S11.T5) is prominent and clearly transitions to the `CardModal` (or dedicated Card Detail page). Consider adding a subtle animation or visual cue that links the graph node to the opening card.'
    *   **Example Prompt 2:** 'Users find the `GrowthDimensionIndicator.tsx` hard to understand. Revise its design to more clearly show `status` (unactivated, in_progress, activated, mastered) and `progress` percentage. Consider adding tooltips with dimension names on hover. Refer to `@V7UIUXDesign.md` for principles, propose a clearer visual representation.'
    Implement these UI/UX refinements."
*   **Expected Outcome:** Specific UI/UX pain points identified during beta testing are addressed, leading to a more user-friendly interface.
*   **AI Tests:** Update/create component tests or E2E tests for the refined UI elements/flows. Visual regression tests if available.
*   **Human Verification:** Review the changes in the UI. Compare before/after based on the beta feedback. Get feedback from original reporters if possible.
*   **Dependencies:** S21.T3 (Beta feedback), Existing UI components.

### 19.4. Workstream 6: Card System (UI & Backend Link)

#### 19.4.1. Task S19.T4 (Re-numbered for Sprint 21): Mobile UI - Card Creation & Editing (Text-based Memories)
*   **Significance:** Enables users to create and edit basic text-based memories directly from the mobile app, a core functionality for on-the-go capture.
*   **Cursor Prompt:** "In `apps/mobile-app`:
    1.  Create a `MemoryEditScreen.tsx`. This screen should have input fields for `title` and `content` (multi-line text input using `TextInput` from React Native).
    2.  Add a 'New Memory' button (e.g., in the Card Gallery or a global FAB) that navigates to `MemoryEditScreen`.
    3.  Implement a 'Save' button on `MemoryEditScreen` that calls the `/api/memory/ingest/text` endpoint (S3.T2) with the title and content.
    4.  Allow editing existing text-based `MemoryUnit`s: When viewing a text memory card in `CardDetailScreen` (S15.T6), add an 'Edit' button that navigates to `MemoryEditScreen` pre-filled with the memory's data. Saving should call the `PUT /api/memory/:muid` endpoint (S19.T5) to update the `MemoryUnit`."
*   **Expected Outcome:** Mobile users can create new text-based memories and edit existing ones. Changes are synced with the backend.
*   **AI Tests:** Component tests for `MemoryEditScreen`. E2E test on emulator: create a new memory, save, verify it appears in gallery. Edit an existing memory, save, verify changes.
*   **Human Verification:**
    1.  On the mobile app, use the 'New Memory' feature to create a text memory. Verify it's saved and appears in the card list (after pull-to-refresh or app restart if live updates not yet implemented).
    2.  Open an existing text memory, edit its content, and save. Verify the changes are reflected in the detail view and, after a refresh, in the gallery.
    3.  Check the PostgreSQL `memory_units` table for new/updated records from mobile actions.
*   **Dependencies:** S15.T6 (Mobile Card Detail View), S3.T2 (Text Ingestion API), S19.T5 (Update MemoryUnit API)

---

## **Sprint 22 (Re-numbered for Sprint 22): Advanced Interactions, Polish & Initial Deployment Prep (4 AI-Weeks)**

**Sprint Goal:** Focus on complete user journeys, performance optimization of 3D scenes and data loading, robust error handling, and final preparations for a wider internal release or public beta. Implement more complex Orb interactions and refine insight delivery.

*(Tasks S20.T1 to S20.T5 were the original S14 tasks. We'll assume they are completed or ongoing and add new tasks for Sprint 22 focusing on further polish and readiness.)*

---

### 22.1. Workstream W_ALL: Testing & Quality Assurance

#### 22.1.1. Task S22.T1: Comprehensive Cross-Browser & Cross-Device Testing (Web)
*   **Significance:** Ensures the web application provides a consistent and functional experience across major browsers and different device types (desktop, tablet).
*   **Cursor Prompt:** "Perform comprehensive testing of the `apps/web-app` on the latest stable versions of Chrome, Firefox, Safari, and Edge. Test on different screen resolutions representing desktop, tablet, and mobile web views. Focus on:
    1.  Layout and styling consistency.
    2.  Functionality of all core features (login, ingestion, card gallery, graph scene, chat, dashboard).
    3.  Performance of 3D scenes and complex UI interactions.
    4.  Responsiveness of the UI.
    Log any browser-specific or device-specific bugs in the issue tracker."
*   **Expected Outcome:** A list of identified cross-browser/device issues. Key functionalities are confirmed to work across targeted browsers.
*   **AI Tests:** (Difficult for AI alone) Potentially use services like BrowserStack/SauceLabs if integrated into CI for automated E2E tests on different browsers.
*   **Human Verification:** Manually test the application on the specified browsers and simulate different device viewports using browser developer tools. If physical devices are available, test on them. Report any visual or functional discrepancies.
*   **Dependencies:** S20.T1 (Stable core journeys)

#### 22.1.2. Task S22.T2: Mobile App Stability & Performance Testing (Native)
*   **Significance:** Ensures the mobile application is stable and performs adequately on target iOS and Android devices before wider distribution.
*   **Cursor Prompt:** "Conduct stability and performance testing for `apps/mobile-app` on representative iOS and Android emulators/devices:
    1.  Test core features: login, card gallery viewing, card detail viewing, text memory creation/editing (from S19.T4), basic GraphScene (S18.T3).
    2.  Monitor for crashes, UI freezes, excessive battery drain, or high memory usage.
    3.  Test performance of scrolling in lists, screen transitions, and any 3D elements.
    4.  Test offline capabilities if any were implemented (e.g., offline journal entry creation from `v7UIUXDesign.md Section 8.3`).
    Log any issues found."
*   **Expected Outcome:** Identification of stability and performance issues on mobile. Key mobile features are usable.
*   **AI Tests:** Run existing mobile E2E tests on emulators. (Difficult for AI to assess subjective performance/stability without tools).
*   **Human Verification:** Manually test the mobile app on a range of emulators and, if possible, physical devices. Perform common user actions repeatedly. Monitor for crashes, lag, and battery usage.
*   **Dependencies:** S19.T4 (Mobile memory editing), S18.T3 (Mobile GraphScene)

### 22.2. Workstream 2: Cognitive Agents & Tools

#### 22.2.1. Task S22.T3: Refine LLM Prompts for Dialogue Agent based on Evaluation
*   **Significance:** Improves the quality and consistency of Dot's responses by using insights from the LLM response evaluation process.
*   **Cursor Prompt:** "Based on the feedback and logs from the LLM response evaluation system (S19.T1), analyze patterns of suboptimal responses from the `DialogueAgent`.
    1.  Identify common issues (e.g., too verbose, not understanding nuance, incorrect information retrieval linkage).
    2.  Refine the system prompts and context construction logic in `DialogueAgent.ts` and its helper modules (e.g., `context_builder.ts`, `response_generator.ts`) to address these issues.
    3.  Implement A/B testing for prompt variations if feasible (can be a simple conditional logic for now, logging which prompt variant was used)."
*   **Expected Outcome:** Improved quality, relevance, and tone of Dialogue Agent responses.
*   **AI Tests:** Create test cases based on previously problematic interactions. Verify the refined prompts lead to better responses (may require manual evaluation of LLM output or automated semantic similarity checks if feasible).
*   **Human Verification:** Review changes to prompt engineering. Interact with Dot focusing on scenarios that previously yielded poor responses. Observe if the quality of conversation has improved.
*   **Dependencies:** S19.T1 (LLM response evaluation data)

### 22.3. Workstream 5: Orb Implementation (UI & Backend Link)

#### 22.3.1. Task S12.T1: Orb - Scene-Aware Interactions & Guidance
*   **Significance:** Makes the Orb a more intelligent and context-aware guide by having it react specifically to the user's actions and context within each 3D scene.
*   **Cursor Prompt:** "Enhance `DialogueAgent.ts` and `OrbStateManager.ts` to enable more scene-aware Orb interactions based on `@V7UltimateSpec Section 5.6.4`:
    1.  **CloudScene:** If the user is idle for a period, Orb might whisper (via TTS and chat) a gentle reflection prompt (e.g., "What's on your mind?" or a pre-defined prompt from a list). Its visual state should become more 'inviting'.
    2.  **AscensionScene:** Orb's transformation (e.g., comet shape) should be more pronounced. It might whisper transition-related phrases at key moments (e.g., "Approaching the cosmos..." as stars appear).
    3.  **GraphScene:** When the user focuses on a `ConceptNode`, Orb could offer to find related memories or explain the concept further. If user is panning/zooming aimlessly, Orb might suggest focusing on a dense cluster or a recently active node. These actions would involve `DialogueAgent` calling `RetrievalPlanner` or `GraphService`.
    Frontend `SceneStore` changes should notify the backend `DialogueAgent` of current scene context via WebSocket or a dedicated API call."
*   **Expected Outcome:** Orb's behavior and suggestions become more tailored to the active 3D scene and user activity within it. Orb feels more like an integrated guide.
*   **AI Tests:**
    *   Simulate scene changes and user actions (idle, node focus) by sending events/API calls to `DialogueAgent`. Verify Orb state updates (`OrbStore`) and proactive prompts are generated and sent to the client.
    *   In UI tests, verify Orb's visual state changes and prompts appear as expected in different scenes.
*   **Human Verification:**
    *   **CloudScene:** Leave the app idle; Orb should eventually offer a prompt.
    *   **AscensionScene:** Observe Orb's visuals and listen for any contextual audio during the transition.
    *   **GraphScene:** Focus on a node; Orb might offer relevant actions (e.g., "Explore connections for 'Creativity'?"). Pan around; Orb might suggest areas of interest if the graph is complex.
*   **Dependencies:** S8.T5 (Orb scene-specific behaviors MVP), S7.T2 (AscensionScene), S7.T5 (GraphScene interactions), S11.T1 (Dialogue Agent context management)

#### 22.3.2. Task S12.T2: Orb - Visual Feedback for AI Processing States
*   **Significance:** Provides users with clearer visual cues about what Dot (the Orb) is doing, especially during longer AI processing tasks, managing expectations and improving perceived responsiveness.
*   **Cursor Prompt:** "Define and implement distinct visual states/effects for the Orb in `Orb.tsx` and `OrbStateManager.ts` to represent different AI processing stages, beyond simple 'thinking', as per `@V7UltimateSpec Section 5.6.4`:
    1.  **'Retrieving_Knowledge':** When `RetrievalPlanner` is active (e.g., subtle data-stream-like particles flowing towards or around the Orb).
    2.  **'Synthesizing_Insight':** When `InsightEngine` is actively generating insights (e.g., inner core of Orb shows complex, evolving light patterns or a soft, pulsing computational glow).
    3.  **'Learning_New_Concept':** When `IngestionAnalyst` is processing new significant information (e.g., Orb gently pulses with a color associated with 'newness' like a soft cyan or green, or displays subtle data intake animations).
    The respective backend agents (`DialogueAgent` acting as a proxy for other agents' states, or the agents publishing events that `DialogueAgent` consumes) should trigger these state changes in `OrbStateManager` at the start and end of these operations. Ensure these visual states are distinct from the emotional/functional states (S7.T7)."
*   **Expected Outcome:** The Orb visually communicates different types of background AI processing, making the system feel more transparent and alive.
*   **AI Tests:**
    *   Trigger backend processes that involve retrieval, insight generation, or significant ingestion. Verify `OrbStateManager` receives and processes these specific state changes, and that `OrbStore` on the frontend updates accordingly.
    *   Visually confirm in UI tests (or manual inspection) that the Orb displays the intended distinct visual effects for each processing state.
*   **Human Verification:**
    *   Perform an action that triggers significant retrieval (e.g., a complex search or asking Dot a question requiring deep knowledge). Observe the Orb for 'Retrieving_Knowledge' visuals.
    *   Manually trigger insight generation (if a dev tool allows this) or wait for a scheduled run. Observe the Orb for 'Synthesizing_Insight' visuals if the system can indicate this.
    *   Ingest a new piece of content (text, image, or audio). Observe the Orb for 'Learning_New_Concept' visuals during the processing phase.
*   **Dependencies:** S7.T7 (Orb state-driven visuals), S10.T1 (Advanced Orb motion to combine with these states), backend agents capable of emitting these specific processing state events or having their status queryable by DialogueAgent.

### 22.4. Workstream 8: DevOps & Infrastructure

#### 22.4.1. Task S20.T3 (Renumbered for Sprint 22): Backend Performance Optimization
*   **Significance:** Optimizes backend services and database queries to ensure the application is responsive and can handle a reasonable load, crucial for a good user experience, especially as more features come online.
*   **Cursor Prompt:** "Review and optimize backend performance:
    1.  Analyze existing logs (S10.T6) and any APM data for slow API endpoints, agent processes, or database queries.
    2.  Specifically target PostgreSQL queries generated by Prisma for `CardService` (especially those involving `mv_entity_growth_progress`, `v_card_evolution_state`) and `GrowthEventRepository`. Use `EXPLAIN ANALYZE` to identify bottlenecks and add/optimize indexes on `growth_events` (e.g., on `(user_id, entity_id, entity_type, dim_key, created_at)`), `memory_units`, `concepts`, etc.
    3.  Review Neo4j queries used by `GraphService` and `InsightEngine` for efficiency. Ensure appropriate indexes are used (refer to S2.T4).
    4.  Optimize `CardService` and `GraphService` data fetching, potentially introducing caching with Redis (via `DatabaseService`) for data like `ChallengeTemplates` or frequently accessed user growth summaries if `users.growth_profile` isn't sufficient.
    5.  Re-run load tests (S18.T6) against key endpoints and document improvements."
*   **Expected Outcome:** Improved response times for key backend APIs. More efficient database queries. Reduced server load under normal operation. Documentation of optimizations made.
*   **AI Tests:**
    *   Write specific benchmark tests for previously slow queries or service methods before and after optimization.
    *   Re-run load tests from S18.T6 and compare metrics (avg response time, p95, error rate).
*   **Human Verification:**
    1.  Review query execution plans for identified slow queries before and after optimization using database tools.
    2.  Use API testing tools (Postman) to measure response times of critical endpoints (e.g., fetching cards, graph data, dashboard summary) and compare with previous sprints.
    3.  Monitor CPU/memory usage of backend services and databases under simulated load to see improvements.
*   **Dependencies:** S18.T6 (Load testing setup), S10.T6 (Logging/APM), All data-intensive services.

#### 22.4.2. Task S20.T4 (Renumbered for Sprint 22): Security Review & Hardening Pass
*   **Significance:** Conducts a focused security review to identify and mitigate potential vulnerabilities before a wider release, protecting user data and system integrity.
*   **Cursor Prompt:** "Perform a security review and hardening pass based on `@V7UltimateSpec Section 7.3`:
    1.  **Input Validation:** Systematically review all API endpoints in `api-gateway` and backend services for comprehensive input sanitization and validation (ensure Zod or similar is used consistently for request bodies, query params, path params). Pay attention to data used in DB queries to prevent injection.
    2.  **Authentication & Authorization:** Double-check all protected resources correctly enforce authentication. Verify that users can only access and modify their own data (e.g., `userId` checks in all repository queries). Test for Insecure Direct Object References (IDOR).
    3.  **Session Management:** Review JWT handling (expiration, refresh token strategy if any, secure storage on client).
    4.  **Dependency Vulnerabilities:** Run `npm audit` (or `yarn audit`) and address any new high/critical vulnerabilities.
    5.  **Rate Limiting:** Confirm rate limits on sensitive endpoints (login, registration, insight generation) are appropriately configured.
    6.  **Security Headers:** Verify `helmet` is used effectively in Express apps and Next.js app has appropriate security headers set (`Content-Security-Policy` should be more specific now, XSS protection, etc.).
    7.  **Error Handling:** Ensure detailed error messages/stack traces are not exposed to clients in production environments."
*   **Expected Outcome:** Identified security vulnerabilities are mitigated. Application follows security best practices.
*   **AI Tests:**
    *   Run automated security scanning tools if available (e.g., Snyk, GitHub Advanced Security code scanning).
    *   Write specific API tests for invalid/malicious inputs targeting common vulnerabilities (SQLi, XSS, IDOR attempts).
*   **Human Verification:**
    1.  Perform manual checks for OWASP Top 10 vulnerabilities, especially focusing on input validation and authorization logic.
    2.  Review JWT implementation details and token handling on the client-side.
    3.  Use browser developer tools and tools like `curl` to inspect HTTP headers for security configurations.
    4.  Verify that production-like error responses do not leak sensitive information.
*   **Dependencies:** S16.T7 (Basic security checks), All API endpoints and services.

#### 22.4.3. Task S20.T5 (Renumbered for Sprint 22): Documentation for Beta & Internal Teams
*   **Significance:** Creates essential documentation to support beta testers in using the application effectively and for internal teams to understand, maintain, and further develop the system.
*   **Cursor Prompt:** "Finalize and expand documentation:
    1.  **Beta Tester Guide (from S20.T5):** Review and update based on features completed up to this sprint. Add sections on new features like advanced graph interactions, multi-modal input (if image/audio is testable), and challenge completion. Emphasize how to provide detailed feedback.
    2.  **Internal Technical Documentation (expand from S20.T5):**
        *   Ensure `README.md` in the monorepo root is comprehensive for project setup, key architecture decisions, and how to run/test different parts of the system.
        *   For each service/agent in `services/cognitive-hub/` and major packages in `packages/`, create/update `README.md` detailing its purpose, key modules/classes, main APIs/methods, and any specific configurations.
        *   Add more detail to the data model documentation (`V7DataSchemaDesign.md` or a new `docs/data-model.md`), especially explaining the event-sourcing for `growth_events` and how views like `mv_entity_growth_progress` and `v_card_evolution_state` are used.
        *   Document the CI/CD pipeline (S18.T5) and the process for deploying to staging (S19.T6).
        *   Document the API endpoints provided by `api-gateway` (consider auto-generating from OpenAPI specs if controllers are well-annotated)."
*   **Expected Outcome:** A comprehensive Beta Tester Guide. Updated and more detailed internal technical documentation covering architecture, services, data models, and operational procedures.
*   **AI Tests:** N/A (content generation and review).
*   **Human Verification:**
    1.  Read through the Beta Tester Guide as if you were a new beta tester. Is it clear, comprehensive, and easy to follow?
    2.  Review internal technical documentation. Could a new developer understand the system architecture, set up their environment, and contribute effectively based on this documentation?
    3.  Check for consistency and accuracy across all documents.
*   **Dependencies:** S20.T5 (Initial documentation), All features implemented up to this point.

---

This structured approach, continuing through these later sprints, should guide the AI agents effectively. The emphasis on specific file paths, explicit references to specification documents, and clear verification steps for humans is key to making this collaborative AI-driven development process work.