# 2dots1line Memory System V4 Technical Specification

**Document Version:** 4.0  
**Date:** May 08, 2025  
**Authors:** AI Collaboration (Claude, Gemini, GPT) with Human Direction

## Executive Summary

The 2dots1line Memory System is a production-grade knowledge graph platform designed to transform a continuous stream of user inputs (conversations, journal entries, media, documents) into a rich, interconnected personal knowledge model. It not only accurately retrieves memories but proactively discovers patterns, connections, and insights across semantically and temporally distant data points. This specification integrates the strengths of previous designs (V2 and V3) into a comprehensive architecture that balances sophistication with practical implementation concerns.

**Core Capabilities:**
- Efficient multi-modal data ingestion and knowledge graph construction
- Hybrid retrieval combining vector, graph, and relational queries
- Proactive insight generation through pattern discovery and metaphorical reasoning
- Adaptive processing tiers for cost-efficient operation
- Cross-region deployment (AWS/US and Tencent/China)
- Coherent, beautiful user experience across web and mobile platforms

## 1. System Architecture Overview

### 1.1 Foundational Principles

1. **Tiered Processing Model:** Multi-level analysis pipeline (lightweight → deep) based on content significance
2. **Agent-Tool Paradigm:** Core cognitive agents with well-defined responsibilities + deterministic tool layer
3. **Polyglot Persistence:** Strategic use of specialized databases (relational, graph, vector, cache)
4. **Clear Data Flow Contracts:** Typed payloads and explicit schema contracts between components
5. **Regional Adaptability:** Architecture designed for deployment in both US (AWS/Google AI) and China (Tencent/DeepSeek)
6. **Progressive Enhancement:** System delivers value from day one, with knowledge graph enrichment improving over time

### 1.2 High-Level Architecture

The architecture combines the proven knowledge graph model from V2 with the agent-tool separation pattern from V3:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                   │
                  ┌───────────────▼───────────────┐
                  │      DIALOGUE AGENT (DOT)     │
                  └───────────────┬───────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                  COGNITIVE AGENT LAYER                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────────┐│
│  │   INGESTION   │  │   RETRIEVAL   │  │    INSIGHT    │  │  ONTOLOGY  ││
│  │    ANALYST    │  │    PLANNER    │  │    ENGINE     │  │  STEWARD   ││
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └─────┬──────┘│
└──────────┼─────────────────┼─────────────────┼───────────────────┼──────┘
           │                 │                 │                   │
┌──────────┼─────────────────┼─────────────────┼───────────────────┼──────┐
│                  DETERMINISTIC TOOLS LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ NER/Vision/Embedding/LLM/Reranking/Stats/Extraction/Summarize   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────┼─────────────────┼─────────────────┼───────────────────┼──────┘
           │                 │                 │                   │
┌──────────▼─────────────────▼─────────────────▼───────────────────▼──────┐
│                      PERSISTENCE LAYER                                  │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐      │
│  │ PostgreSQL │   │   Neo4j    │   │  Weaviate  │   │   Redis    │      │
│  │            │   │            │   │            │   │            │      │
│  └────────────┘   └────────────┘   └────────────┘   └────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Core Components

1. **Cognitive Agents:**
   - **Dialogue Agent (Dot):** The only agent directly communicating with users
   - **Ingestion Analyst:** Processes raw inputs into graph-ready entities and relations
   - **Retrieval Planner:** Plans and executes optimal hybrid retrieval strategies
   - **Insight Engine:** Discovers patterns, connections, and hypotheses
   - **Ontology Steward:** Manages knowledge graph schema evolution

2. **Deterministic Tools Layer:**
   - Specialized, stateless functions for specific tasks
   - Includes NER, vision analysis, embedding, graph operations, reranking, etc.
   - Discoverable through a tool registry with capability metadata

3. **Persistence Layer:**
   - **PostgreSQL:** Primary structured data, user information, raw content, metadata
   - **Neo4j:** Knowledge graph structure (entities, relationships, properties)
   - **Weaviate:** Vector embeddings for semantic search
   - **Redis:** Caching, temporary state, message queues, rate limiting

4. **Data Flow Orchestration:**
   - Well-defined message queues between components
   - Event-driven processing triggers
   - Policy layer for routing, rate limiting, and data residency

This architecture combines the knowledge graph richness of V2 with the clear agent separation and tooling approach of V3, resulting in a system that's both powerful and maintainable.

## 2. Knowledge Model

The Knowledge Model defines how user memories and insights are structured within the system. It builds on V2's rich graph model while incorporating V3's disciplined schema governance.

### 2.1 Core Knowledge Graph Schema

#### Node Types

1. **`User`**
   - Properties: `userId` (unique), `name`, `preferences`
   - Purpose: Central anchor point for a user's memory graph

2. **`MemoryUnit`**
   - Properties: `muid` (unique), `creation_ts`, `last_modified_ts`, `source_type` (e.g., "journal_entry", "conversation", "imported_document"), `title` (user or AI-generated), `processing_status`, `importance_score`
   - Purpose: Container for a distinct piece of user memory/input

3. **`Chunk`**
   - Properties: `cid` (unique), `muid` (parent link), `text`, `sequence_order`, `role` (e.g., "user_utterance", "dot_utterance", "question", "key_insight"), `embedding_id` (link to vector store)
   - Purpose: Granular, semantically searchable units of text extracted from MemoryUnits

4. **`Concept`**
   - Properties: `concept_id` (unique), `name`, `type`, `description`, `user_defined` (boolean), `confidence`, `last_updated_ts`, `community_id` (optional)
   - Purpose: Represents entities, themes, values, emotions, topics, or other significant abstract ideas in the user's life
   - The `type` property draws from a controlled vocabulary managed by the Ontology Steward:
     - **Self Domain:** "value", "personal_trait", "skill", "emotion", "interest", "struggle"
     - **Life Events Domain:** "life_event_theme", "achievement", "decision_point", "milestone" 
     - **Relationships Domain:** "person", "organization", "group", "relationship_dynamic"
     - **Future Orientation Domain:** "goal", "aspiration", "plan", "concern"
     - **General:** "location", "time_period", "activity", "artwork", "topic", "abstract_idea"

5. **`Media`**
   - Properties: `media_id` (unique), `muid` (parent link), `type` (e.g., "image", "audio", "document"), `url`, `caption`, `extraction_status`
   - Purpose: Represents non-text media associated with MemoryUnits

6. **`Annotation`**
   - Properties: `aid` (unique), `target_id`, `target_type` (e.g., "MemoryUnit", "Chunk", "Concept"), `annotation_type` (e.g., "user_reflection", "ai_significance", "user_correction"), `text`, `creation_ts`, `source` ("user" or "agent_name")
   - Purpose: Layer of interpretation or meta-commentary on graph elements

7. **`Community`**
   - Properties: `community_id` (unique), `name`, `description`, `creation_ts`, `detection_method`, `confidence_score`
   - Purpose: Represents detected concept clusters/communities, enabling higher-order organization

#### Relationship Types

1. **`(User)-[:AUTHORED]->(MemoryUnit)`**
   - Connects users to their memory units

2. **`(MemoryUnit)-[:CONTAINS]->(Chunk)`**
   - Connects memory units to their constituent chunks

3. **`(MemoryUnit)-[:HIGHLIGHTS]->(Concept)`**
   - Properties: `weight` (float), `significance` (string)
   - Indicates a memory unit prominently features a concept

4. **`(Chunk)-[:MENTIONS]->(Concept)`**
   - Properties: `weight` (float)
   - Indicates a chunk references a concept

5. **`(MemoryUnit)-[:INCLUDES]->(Media)`**
   - Links media assets to their parent memory units

6. **`(Concept)-[:RELATED_TO]->(Concept)`**
   - Properties: `relationship_label` (string), `weight` (float), `source` (string), `creation_ts` (timestamp)
   - The critical relationship for building the semantic web
   - The `relationship_label` is controlled by the Ontology Steward and includes:
     - Hierarchical: "is_a_type_of", "is_part_of", "is_instance_of"
     - Causal: "causes", "influences", "enables", "prevents", "contributes_to"
     - Temporal: "precedes", "follows", "co-occurs_with"
     - Association: "is_similar_to", "is_opposite_of", "is_analogous_to"
     - Domain-specific: "inspires", "supports_value", "exemplifies_trait", "is_milestone_for"
     - Metaphorical: "is_metaphor_for", "represents_symbolically"

7. **`(User)-[:PERCEIVES]->(Concept)`**
   - Properties: `perception_type` (string), `current_salience` (float), `start_date` (date), `end_date` (date)
   - Represents the user's relationship to concepts over time
   - The `perception_type` includes: "holds_value", "has_interest", "possesses_trait", "pursues_goal", "experiences_emotion", "struggles_with"

8. **`(MemoryUnit)-[:CONTINUES]->(MemoryUnit)`**
   - Properties: `reason` (string)
   - Links related memory units temporally or thematically

9. **`(Annotation)-[:ANNOTATES]->(MemoryUnit | Chunk | Concept)`**
   - Links annotations to their targets

10. **`(Concept)-[:BELONGS_TO]->(Community)`**
    - Indicates a concept is part of a detected community/cluster

### 2.2 The Four Domains of Understanding

These domains (from V2) are not explicit containers but emergent perspectives queried from the knowledge graph:

1. **SELF:** Queried through `(User)-[:PERCEIVES]->(Concept)` where `Concept.type` reflects aspects of identity, values, traits, emotions.

2. **LIFE EVENTS:** Accessed through `MemoryUnit`s that `:HIGHLIGHTS` concepts with types like "life_event_theme", "milestone", etc.

3. **RELATIONSHIPS:** Focused on `Concept`s of type "person", "group", etc., and the memory units mentioning them.

4. **FUTURE ORIENTATION:** Centered on `(User)-[:PERCEIVES {perception_type: "pursues_goal"}]->(Concept)` and concepts of type "goal", "aspiration", etc.

### 2.3 Schema Governance and Evolution

The Ontology Steward manages the controlled vocabularies for:
- `Concept.type`
- `relationship_label` on `RELATED_TO` edges
- `perception_type` on `PERCEIVES` edges

Schema changes follow a strict governance process:
1. New candidate terms are proposed (by agents or users)
2. Ontology Steward evaluates based on frequency, distinctiveness, and utility
3. Terms may be:
   - Promoted to the canonical vocabulary
   - Mapped to existing terms
   - Flagged for user review
   - Rejected (mapped to closest existing term)

This governance balances flexibility with consistency, allowing the schema to evolve while preventing "edge explosion" or semantic drift.

### 2.4 Vector Embedding Strategy

- **Chunk Embeddings:** Each `Chunk.text` is embedded using appropriate models:
  - US: Gemini embedding models
  - China: DeepSeek embedding models
  - Embeddings stored in Weaviate, indexed by `cid`

- **Concept Embeddings:** `Concept.name` + `Concept.description` embedded for concept similarity search

- **Multi-Modal Embeddings:** For images, audio, or other media, specialized embedding models generate embeddings stored in the same vector space

- **Embedding Model Selection:**
  - Default: 1536-dimensional models balancing quality and efficiency
  - Higher-dimensional models (1024+) for specific tasks requiring greater precision
  - Models will be version-tagged to allow for future upgrades without breaking existing embeddings 

## 3. Cognitive Agents: Implementation & Responsibilities

Each cognitive agent has clear responsibilities, input/output contracts, tool interactions, and LLM configurations. This section details their implementation, connecting the V2 agent roles with the V3 agent-tool paradigm.

### 3.1 Dialogue Agent (Dot)

**Purpose:** The sole user-facing agent, responsible for understanding user needs, formulating responses, and determining when to delegate to other agents.

#### Implementation Details:

**Input Payload:**
```json
{
  "user_id": "string",
  "message_text": "string",
  "message_media": [{"type": "string", "url": "string"}],
  "conversation_id": "string",
  "message_id": "string",
  "timestamp": "ISO8601"
}
```

**Output Payload:**
```json
{
  "response_text": "string",
  "response_media": [{"type": "string", "url": "string"}],
  "suggested_actions": [{"action": "string", "label": "string", "payload": "object"}],
  "proactive_insight": {"text": "string", "source": "string", "confidence": "float"},
  "metadata": {"processing_time": "float", "tool_calls": []}
}
```

**Cognitive Process:**
1. Classify input intent (factual retrieval, narrative generation, reflection prompt, general chat)
2. For retrieval/synthesis queries, call Retrieval Planner as a tool
3. For chat/reflection, may handle directly or with lightweight context retrieval
4. Determine if proactive insights are appropriate for inclusion
5. Format final response based on user preferences and platform context

**Tool Use:**
- `retrieval.plan_and_execute({query, user_id, retrieval_config})`
- `insight.get_relevant({message_text, user_id, max_insights})`
- `llm.chat({system_prompt, user_message, context, model_parameters})`
- `llm.critique({output, criteria})` (for self-evaluation)

**LLM Configuration:**
- **US:**
  - Model: Gemini 1.5 flash or Gemini 2.0 flash or Gemini 2.5 flash
  - Parameters: temperature=0.7, top_p=0.95, max_tokens=based on context
  
- **China:**
  - Model: DeepSeek v3 or equivalent
  - Parameters: Similar to US configuration

**State Handling:**
- Stateless operation with conversation context loaded from database
- Current assistant turn stored transiently in Redis for 24 hours
- All inputs and outputs logged to PostgreSQL

### 3.2 Ingestion Analyst

**Purpose:** Process raw user inputs into structured entities and relationships for the knowledge graph.

#### Implementation Details:

**Input Payload:**
```json
{
  "user_id": "string",
  "batch_id": "string",
  "content_items": [
    {
      "item_id": "string",
      "text": "string",
      "media": [{"type": "string", "url": "string"}],
      "source_type": "string",
      "timestamp": "ISO8601"
    }
  ],
  "processing_tier": "integer" // 1-3, where 3 is deepest analysis
}
```

**Output Payload:**
```json
{
  "memory_units": [
    {
      "muid": "string",
      "source_item_id": "string",
      "title": "string",
      "processing_status": "string",
      "importance_score": "float"
    }
  ],
  "chunks": [
    {
      "cid": "string",
      "muid": "string",
      "text": "string",
      "sequence_order": "integer",
      "role": "string"
    }
  ],
  "entities": [
    {
      "concept_id": "string",
      "name": "string",
      "type": "string",
      "confidence": "float",
      "description": "string"
    }
  ],
  "relations": [
    {
      "source_id": "string",
      "target_id": "string",
      "type": "string",
      "relationship_label": "string",
      "weight": "float"
    }
  ],
  "media_items": [],
  "embedding_jobs": []
}
```

**Cognitive Process:**
1. **Capture Decision:** Evaluate if content is "memory-worthy"
   - Brief acknowledgments or trivial messages may be filtered
   - User can override with explicit "remember this" flag
   
2. **Tiered Processing Strategy:**
   - **Tier 1** (All inputs): Create `MemoryUnit` → Basic chunking → Simple NER → Queue embedding jobs
   - **Tier 2** (Content meeting threshold): LLM entity extraction → Basic relationship inference → Importance assessment
   - **Tier 3** (High-value content): Deep semantic analysis → Extended relationship mapping → Pre-annotation with significance markers
   
3. **Content Chunking:**
   - Split by semantic boundaries (paragraphs, sentences)
   - Assign `sequence_order` and `role` if applicable (e.g., "user_utterance", "dot_utterance" for chat)
   
4. **Entity & Relationship Extraction:**
   - Basic NER for explicit entities (people, places, organizations)
   - LLM-assisted extraction for abstract concepts (values, emotions, themes)
   - Determine initial `Concept.type` classification
   - Create `MENTIONS`/`HIGHLIGHTS` relationships with confidence weights

**Tool Use:**
- `ner.extract({text})`
- `vision.caption({image_url})`
- `embed.queue_job({cid, text, model_id})` 
- `llm.extract_json({prompt, schema, text})`
- `dedupe.match({concept, existing_concepts})`

**LLM Configuration:**
- **Tier 1:** Minimal LLM use (basic NER tools only)
- **Tier 2:** 
  - US: Gemini Flash or similar efficient model
  - China: DeepSeek-Lite or equivalent
- **Tier 3:**
  - US: Gemini Pro
  - China: DeepSeek-Chat

**Optimization Strategy:**
- Asynchronous embedding queue to decouple ingestion from vectorization
- Batch processing for efficiency when multiple inputs arrive together
- Circuit breakers to downgrade to lower tiers under heavy load

### 3.3 Retrieval Planner

**Purpose:** Orchestrate hybrid retrieval strategies combining vector search, graph traversal, and structured queries.

#### Implementation Details:

**Input Payload:**
```json
{
  "user_id": "string",
  "query": "string",
  "query_type": "string", // "factual", "narrative", "exploratory", "temporal"
  "constraints": {
    "max_results": "integer",
    "recency_weight": "float",
    "temporal_filter": {"start": "ISO8601", "end": "ISO8601"},
    "concept_filters": ["string"]
  }
}
```

**Output Payload:**
```json
{
  "context_bundle": {
    "relevant_chunks": [{"cid": "string", "text": "string", "score": "float"}],
    "relevant_concepts": [{"concept_id": "string", "name": "string", "type": "string"}],
    "relevant_memory_units": [{"muid": "string", "title": "string", "source_type": "string"}],
    "graph_patterns": [{"description": "string", "path": "object", "confidence": "float"}]
  },
  "plan": {
    "strategy_description": "string",
    "retrieval_steps": [],
    "fallback_plan": "object"
  },
  "metadata": {"total_processing_time": "float", "vector_fetch_time": "float", "graph_query_time": "float"}
}
```

**Cognitive Process:**
1. **Query Analysis:**
   - Identify explicit entities/concepts in the query
   - Classify query type (factual lookup, thematic exploration, temporal, narrative)
   - Determine optimal retrieval strategy
   
2. **Retrieval Planning:**
   - **Vector Search:** Generate query embedding, search for similar chunks with appropriate filters
   - **Graph Traversal:** For entity-centric queries, plan graph traversal paths (e.g., starting from referenced concepts and expanding)
   - **Hybrid Approach:** Combine vector results with graph structure for context enrichment
   
3. **Execution & Reranking:**
   - Execute retrieval plan
   - Rerank results based on relevance, recency, importance scores
   - Package results into a context bundle for the Dialogue Agent

**Tool Use:**
- `embed.text({text, model_id})` - Embed query text
- `vector.similar({vector, k, filters})` - Search for similar vectors
- `graph.query({cypher_query})` - Execute graph database queries
- `rerank.cross_encode({query, candidates})` - Rerank results

**LLM Configuration:**
- **US:** Gemini Flash (for planning) with temperature=0.2
- **China:** DeepSeek-v3 with temperature=0.2

**Optimization Strategy:**
- Cache common query patterns and their retrieval plans in Redis
- Progressive retrieval: Start with faster methods, deepen only if needed
- Semantic query decomposition for complex queries

### 3.4 Insight Engine

**Purpose:** Discover non-obvious patterns, connections, and hypotheses across the knowledge graph.

#### Implementation Details:

**When Triggered:**
- Scheduled periodic runs (e.g., nightly)
- After significant new content ingestion
- User-requested insight generation
- During idle system times

**Output Payload:**
```json
{
  "insights": [
    {
      "insight_id": "string",
      "type": "string", // "pattern", "correlation", "metaphorical", "community"
      "description": "string",
      "supporting_evidence": [{"id": "string", "type": "string", "relevance": "float"}],
      "confidence": "float",
      "novelty_score": "float"
    }
  ],
  "updates": {
    "new_communities": [],
    "new_relationships": [],
    "salience_changes": []
  }
}
```

**Cognitive Process:**
1. **Community Detection:**
   - Run graph algorithms to detect concept clusters and thematic communities
   - Assign meaningful labels to detected communities
   - Track community evolution over time

2. **Pattern Mining:**
   - **Co-occurrence Analysis:** Find concepts frequently appearing together
   - **Temporal Patterns:** Identify cyclical behaviors or evolving themes
   - **Correlation Analysis:** For tracked metrics (if user opts in, e.g., mood, sleep quality)

3. **Metaphorical Connection Discovery:**
   - Identify structurally similar patterns across different domains
   - Look for concepts that could serve as metaphors for each other
   - Generate analogical connections between disparate experiences

4. **Hypothesis Generation & Testing:**
   - Propose hypotheses about user behaviors, preferences, or life patterns
   - Evaluate confidence based on supporting evidence
   - Flag high-confidence insights for proactive sharing

**Tool Use:**
- `graph.community_detect({user_id, algorithm, parameters})`
- `graph.pattern_match({pattern_template, parameters})`
- `stats.correlate({series_a, series_b})`
- `llm.hypothesize({context, existing_patterns})`
- `llm.evaluate_insight({insight, evidence, criteria})`

**LLM Configuration:**
- **US:** Gemini Advanced (for sophisticated pattern recognition)
- **China:** DeepSeek's most capable model
- Temperature settings vary by task (lower for evaluation, higher for creative connections)

**Optimization Strategy:**
- Incremental processing focused on new data and its connections to existing patterns
- Prioritize insights by novelty, confidence, and relevance to user's active interests
- Rate-limit insight generation to prevent overwhelming users

### 3.5 Ontology Steward

**Purpose:** Manage the controlled vocabularies and schema evolution of the knowledge graph.

#### Implementation Details:

**When Triggered:**
- New edge types or concept types suggested by agents
- Threshold of unmapped edge/concept types reached
- Explicit user feedback on ontology
- Periodic ontology health check (e.g., weekly)

**Input/Output Payloads:**
```json
// New term evaluation request
{
  "candidate_term": "string",
  "term_type": "string", // "concept_type", "relationship_label", "perception_type"
  "examples": [],
  "current_usage_count": "integer",
  "nearest_existing_terms": [{"term": "string", "semantic_distance": "float"}]
}

// Response
{
  "decision": "string", // "PROMOTE", "MAP", "REVIEW", "REJECT"
  "map_to": "string", // if decision is "MAP"
  "reason": "string",
  "suggested_definition": "string",
  "requires_user_confirmation": "boolean"
}
```

**Cognitive Process:**
1. **Terminology Governance:**
   - Evaluate new candidate terms (concept types, relationship labels)
   - Check for semantic overlap with existing terms
   - Assess frequency and importance of the new terminology

2. **Schema Evolution:**
   - Maintain controlled vocabularies for each aspect of the schema
   - Process batches of candidate terms in periodic reviews
   - Generate clear definitions for promoted terms

3. **Ambiguity Resolution:**
   - Detect potential entity duplicates or near-synonyms
   - Suggest merging or clarifying similar concepts
   - Route difficult decisions to users when confidence is low

**Tool Use:**
- `embed.text({text, model_id})` - Generate embedding for term comparison
- `graph.schema_ops({operation, parameters})` - Get or update schema definitions
- `llm.define({term, context, examples})` - Generate term definitions
- `llm.classify_similarity({term_a, term_b, examples})` - Evaluate term similarity

**LLM Configuration:**
- **US:** Gemini Pro with temperature=0.2 for consistent definition generation
- **China:** DeepSeek-Chat with temperature=0.2

**Decision Criteria:**
- Promote new terms when:
  - Usage count exceeds threshold (e.g., 25+ occurrences)
  - Semantic distance from nearest term exceeds threshold (e.g., 0.4 cosine distance)
  - Term has clear utility for knowledge organization
  
- Map to existing terms when:
  - Semantic similarity is high (e.g., <0.2 cosine distance)
  - New term provides no significant organizational advantage

- Request user review when:
  - Confidence is below threshold
  - Term appears significant but ambiguous
  - Term represents a potential new taxonomy branch 

## 4. Deterministic Tools Layer

The deterministic tools layer provides specialized, stateless functions that cognitive agents can invoke. This pattern separates complex but deterministic operations from agent reasoning, improving maintainability and allowing tools to evolve independently.

### 4.1 Core Tool Categories

#### Text Processing & NLP
- **`ner.extract({text, model_tier})`**
  - Named Entity Recognition using pre-trained models (BERT/RoBERTa-based)
  - Returns entities with positions, types, and confidence scores
  - Model tier options: 1 (fast, basic), 2 (balanced), 3 (comprehensive)
  - Implementation: Hugging Face Transformers (US), local models (China)

- **`llm.extract_json({prompt, schema, input_text, model_params})`**
  - Structured information extraction using LLMs with JSON output
  - Enforces schema compliance through validation
  - Model selection based on region and complexity
  - Implements retry logic and fallbacks

- **`llm.chat({system_prompt, user_message, context, model_params})`**
  - General purpose LLM interaction for dialogue and content generation
  - Regional routing to appropriate provider (Google/DeepSeek)
  - Supports function calling/tool use for more complex tasks

- **`llm.summarize({text, max_length, focus_aspects})`**
  - Generates concise summaries of content
  - Can target specific aspects (emotional, factual, etc.)

#### Visual Processing
- **`vision.caption({image_url, detail_level})`**
  - Generates detailed captions for images
  - Includes object detection, scene description, text OCR
  - Implementation: CLIP/BLIP models (US), local equivalents (China)

- **`vision.extract_entities({image_url})`**
  - Identifies entities in images (people, objects, text)
  - Returns structured entity information with bounding boxes

#### Embedding & Vectorization
- **`embed.text({text, model_id})`**
  - Transforms text into vector embeddings for semantic search
  - Supports multiple embedding models with version control
  - Returns vector with metadata (model, dimensions, version)

- **`embed.queue_job({id, content, model_id, priority})`**
  - Asynchronous embedding request for batch processing
  - Adds job to embedding queue (Redis-backed)
  - Returns job ID for status tracking

#### Vector Operations
- **`vector.similar({vector, k, filters, namespace})`**
  - K-nearest neighbor search in vector space
  - Optional filtering by metadata (e.g., time range, source type)
  - Implementation: Weaviate client wrapper

- **`rerank.cross_encode({query, candidates, model_id})`**
  - Re-ranks retrieved chunks using cross-encoder models
  - More accurate relevance scoring than pure vector similarity
  - Implementation: SentenceTransformers/cross-encoders

#### Graph Operations
- **`graph.query({cypher_query, parameters})`**
  - Executes Cypher queries against Neo4j
  - Parameter sanitization and query validation
  - Connection pooling and timeout handling

- **`graph.community_detect({user_id, algorithm, parameters})`**
  - Runs community detection algorithms on the knowledge graph
  - Algorithms: Louvain, Label Propagation, etc.
  - Returns communities with member concepts and metrics

- **`graph.schema_ops({operation, parameters})`**
  - Schema management operations (view/update types and relationships)
  - Access control to prevent unauthorized schema changes

#### Statistical Analysis
- **`stats.correlate({series_a, series_b, method})`**
  - Statistical correlation analysis between time series
  - Methods: Pearson, Spearman, etc.
  - Returns coefficient, p-value, and confidence interval

- **`stats.trend({series, window, method})`**
  - Time-series trend analysis for detecting patterns
  - Methods: Moving average, exponential smoothing, etc.

#### Utility Functions
- **`dedupe.match({item, candidates, threshold})`**
  - Entity matching and deduplication
  - Returns potential matches with confidence scores

- **`util.validate_json({json, schema})`**
  - JSON schema validation for payload integrity
  - Returns validation result with error details if invalid

### 4.2 Tool Registry & Discovery

All tools are registered in a central registry that provides:
- Tool name and description
- Input/output schemas (JSON Schema format)
- Capability tags (e.g., {"task": "embedding", "language": "en", "tier": 2})
- Regional availability (US/China)
- Performance metrics (average latency, error rate)

The registry enables:
1. **Dynamic Discovery:** Agents discover available tools at runtime
2. **Capability-Based Routing:** Request tools by capability rather than specific implementation
3. **Fallback Handling:** Specify alternative tools if preferred option is unavailable
4. **Regional Compliance:** Only tools legal in the current region are exposed

### 4.3 Implementation Pattern

Tools follow a consistent implementation pattern:
1. **Input Validation:** Schema validation of all inputs
2. **Error Handling:** Standardized error responses with helpful messages
3. **Logging & Metrics:** Performance and usage tracking
4. **Rate Limiting:** Prevent abuse through configurable limits
5. **Circuit Breaking:** Fail fast when underlying services are degraded

All tools are implemented as stateless HTTP/gRPC microservices or serverless functions, allowing independent scaling and management.

## 5. Persistence Layer Implementation

The persistence layer uses a polyglot approach, selecting specialized databases for different aspects of the system. This section details the schema, access patterns, and optimization strategies for each database.

### 5.1 PostgreSQL (Relational Database)

**Purpose:** Primary structured data storage for user information, raw content, metadata, and transactional records.

#### Key Tables & Schema

**Users Table:**
```sql
CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    region VARCHAR(10) -- 'us' or 'cn'
);
```

**MemoryUnits Table:**
```sql
CREATE TABLE memory_units (
    muid VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    source_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    creation_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    last_modified_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_status VARCHAR(20) NOT NULL,
    importance_score FLOAT,
    is_private BOOLEAN DEFAULT true,
    metadata JSONB
);

CREATE INDEX idx_memory_units_user_time ON memory_units(user_id, creation_ts);
CREATE INDEX idx_memory_units_status ON memory_units(user_id, processing_status);
```

**Chunks Table:**
```sql
CREATE TABLE chunks (
    cid VARCHAR(36) PRIMARY KEY,
    muid VARCHAR(36) REFERENCES memory_units(muid),
    text TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    role VARCHAR(50),
    embedding_id VARCHAR(36) -- Reference to vector in Weaviate
);

CREATE INDEX idx_chunks_muid ON chunks(muid);
```

**Concepts Table:**
```sql
CREATE TABLE concepts (
    concept_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    user_defined BOOLEAN DEFAULT false,
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    community_id VARCHAR(36)
);

CREATE INDEX idx_concepts_user_type ON concepts(user_id, type);
CREATE UNIQUE INDEX idx_concepts_user_name_type ON concepts(user_id, name, type);
```

**Annotations Table:**
```sql
CREATE TABLE annotations (
    aid VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    target_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    annotation_type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    creation_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) NOT NULL
);

CREATE INDEX idx_annotations_target ON annotations(target_id, target_type);
CREATE INDEX idx_annotations_user_type ON annotations(user_id, annotation_type);
```

**Media Table:**
```sql
CREATE TABLE media (
    media_id VARCHAR(36) PRIMARY KEY,
    muid VARCHAR(36) REFERENCES memory_units(muid),
    type VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    extraction_status VARCHAR(20) NOT NULL,
    metadata JSONB
);

CREATE INDEX idx_media_muid ON media(muid);
```

**ConversationLog Table:**
```sql
CREATE TABLE conversation_log (
    message_id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(user_id),
    sender VARCHAR(10) NOT NULL, -- 'user' or 'assistant'
    message_text TEXT NOT NULL,
    message_media JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processing_status VARCHAR(20) NOT NULL,
    muid VARCHAR(36) -- Associated memory unit if captured
);

CREATE INDEX idx_conversation_thread ON conversation_log(conversation_id, timestamp);
CREATE INDEX idx_conversation_user ON conversation_log(user_id, timestamp);
```

**InsightsTable:**
```sql
CREATE TABLE insights (
    insight_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    supporting_evidence JSONB NOT NULL,
    confidence FLOAT NOT NULL,
    novelty_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shared_at TIMESTAMP WITH TIME ZONE,
    user_feedback VARCHAR(20)
);

CREATE INDEX idx_insights_user ON insights(user_id, created_at);
CREATE INDEX idx_insights_unshared ON insights(user_id, confidence) 
    WHERE shared_at IS NULL;
```

#### Access Patterns

1. **CRUD Operations:** Standard create, read, update, delete operations for all entities
2. **User Context Loading:** Fetch user preferences, active conversations
3. **Recent Activity:** Temporal queries for recent memories, conversations
4. **Status-Based Queries:** Find memory units in specific processing states
5. **Metadata Searches:** JSON path queries on metadata fields

#### Optimization Strategies

1. **Partitioning:** User-based table partitioning for large tables
2. **JSONB Indexing:** GIN indexes on JSONB fields with common query paths
3. **Read Replicas:** For high-traffic deployments
4. **Caching Layer:** Redis-based caching for frequent queries
5. **Archiving:** Move older, infrequently accessed data to cold storage

### 5.2 Neo4j (Graph Database)

**Purpose:** Store and query the knowledge graph structure - entities, relationships, and their properties.

#### Node Labels & Properties

1. **(:User)** 
   - Properties: `userId`, `name`

2. **(:MemoryUnit)**
   - Properties: `muid`, `creation_ts`, `title`, `importance_score`

3. **(:Concept)**
   - Properties: `concept_id`, `name`, `type`, `description`, `user_defined`, `confidence`

4. **(:Chunk)**
   - Properties: `cid`, `text` (preview only), `sequence_order`, `role`

5. **(:Annotation)**
   - Properties: `aid`, `text`, `annotation_type`, `creation_ts`, `source`

6. **(:Community)**
   - Properties: `community_id`, `name`, `description`, `detection_method`, `confidence_score`

#### Relationship Types

As defined in Knowledge Model section, with properties.

#### Query Patterns

1. **Entity Navigation:** `(User)-[:PERCEIVES]->(Concept)`
2. **Concept Relationship Exploration:** `(Concept)-[:RELATED_TO]->(Concept)`
3. **Memory Context:** `(MemoryUnit)-[:HIGHLIGHTS]->(Concept)`, `(MemoryUnit)-[:CONTAINS]->(Chunk)`
4. **Temporal Patterns:** `(MemoryUnit {creation_ts: date1})-[:CONTINUES]->(MemoryUnit {creation_ts: date2})`
5. **Community Structure:** `(Concept)-[:BELONGS_TO]->(Community)`

#### Optimization Strategies

1. **Strategic Indexing:**
   ```cypher
   CREATE INDEX concept_name_idx FOR (c:Concept) ON (c.name);
   CREATE INDEX concept_type_idx FOR (c:Concept) ON (c.type);
   CREATE INDEX memory_unit_creation_idx FOR (m:MemoryUnit) ON (m.creation_ts);
   ```

2. **Query Caching:** Common patterns cached in Redis
3. **Batch Updates:** Efficient graph updates using batched operations
4. **Relationship Pruning:** Periodically evaluate and prune low-confidence relationships
5. **Read Replicas:** For high-volume query workloads

### 5.3 Weaviate (Vector Database)

**Purpose:** Store and query vector embeddings for semantic search.

#### Collections

1. **ChunkEmbeddings**
   - Vector field (768/1024 dimensions based on model)
   - Properties: `cid`, `muid`, `textPreview`, `creationTimestamp`, `modelVersion`

2. **ConceptEmbeddings**
   - Vector field (same dimensions)
   - Properties: `concept_id`, `name`, `type`, `descriptionPreview`

3. **MediaEmbeddings**
   - Vector field (for media captions and extracted features)
   - Properties: `media_id`, `muid`, `mediaType`, `captionPreview`

#### Query Patterns

1. **K-Nearest Neighbors:**
   ```
   Get k=20 most similar chunks to query vector
   with filter user_id = X and creation_ts > Y
   ```

2. **Hybrid Search:**
   ```
   Get k=20 most similar chunks containing keyword "vacation"
   with BM25 weight = 0.3 and vector weight = 0.7
   ```

#### Optimization Strategies

1. **HNSW Indexing:** Hierarchical Navigable Small World graph for efficient ANN search
2. **Vector Quantization:** For memory efficiency in large deployments
3. **Filtered Sharding:** User-based sharding strategy
4. **Batch Ingestion:** Efficient batch operations for embeddings
5. **Quality Monitoring:** Track recall/precision metrics for embedding models

### 5.4 Redis (Cache & Queues)

**Purpose:** Caching, temporary state, message queues, and rate limiting.

#### Key Caching Domains

1. **User Context Cache:**
   - Key pattern: `user:{user_id}:context`
   - TTL: 30 minutes
   - Content: User preferences, active conversations, recent memories

2. **Query Results Cache:**
   - Key pattern: `query:{query_hash}:results`
   - TTL: 5 minutes for vector search, 10 minutes for graph patterns
   - Content: Serialized query results with metadata

3. **LLM Response Cache:**
   - Key pattern: `llm:{prompt_hash}:{model_id}:response`
   - TTL: 24 hours
   - Content: Cached responses for identical prompts

#### Queue Structures

1. **Embedding Queue:**
   - Implementation: BullMQ
   - Jobs: Text/media embedding requests
   - Priority levels: 1-5 (higher for user-facing content)

2. **Ingestion Processing Queue:**
   - Tiers of processing jobs (1-3)
   - Job data includes batch IDs and processing instructions

3. **Insight Generation Queue:**
   - Scheduled and event-triggered jobs
   - Lower priority than user-facing operations

#### State Management

1. **Rate Limiting:**
   - Key pattern: `ratelimit:{user_id}:{endpoint}`
   - Sliding window counters for API limits

2. **Distributed Locks:**
   - Key pattern: `lock:{resource_id}`
   - Prevent race conditions in distributed operations

3. **Session Management:**
   - Key pattern: `session:{session_id}`
   - TTL: Configurable (default 24 hours)

#### Optimization Strategies

1. **Key Expiration Policies:** Appropriate TTLs for different types of data
2. **Memory Policies:** LRU eviction for caches
3. **Cluster Configuration:** Redis Cluster for high-availability
4. **Data Compression:** For larger cached values
5. **Monitoring:** Memory usage, hit/miss rates, queue depths

## 6. Data Flow & Processing

This section details the end-to-end data flow through the system, from user input to insights, addressing queuing, batching, and event-driven processing.

### 6.1 Ingestion Flow

The ingestion process transforms raw user inputs into structured knowledge graph elements:

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│   User    │    │  API /    │    │ Ingestion │    │ Embedding │    │  Ontology │
│  Input    │───►│ Gateway   │───►│  Analyst  │───►│  Worker   │───►│  Steward  │
└───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘
                                        │                                  │
                                        ▼                                  ▼
                                  ┌───────────┐                      ┌───────────┐
                                  │ PostgreSQL│                      │   Neo4j   │
                                  │ Weaviate  │◄─────────────────────┤ (Schema   │
                                  │ (Storage) │                      │ Updates)  │
                                  └───────────┘                      └───────────┘
```

**Process Steps:**

1. **Input Reception:**
   - User inputs text via chat, journal entry, or file import
   - API Gateway validates input and creates a job in the ingestion queue
   - Real-time acknowledgment sent to user

2. **Tier 1 Processing (Immediate):**
   - Ingestion Analyst processes job from queue
   - Performs capture decision (memory-worthy check)
   - Creates `MemoryUnit` record in PostgreSQL
   - Chunks content and performs basic NER
   - Queues embedding jobs for chunks
   - Updates `MemoryUnit.processing_status` to "chunked"

3. **Asynchronous Embedding:**
   - Embedding Worker processes jobs from embedding queue
   - Generates vectors for chunks
   - Stores vectors in Weaviate
   - Links embedding IDs back to chunk records in PostgreSQL

4. **Tier 2/3 Processing (Background):**
   - For content meeting importance thresholds:
     - Deeper entity extraction with LLM assistance
     - Relationship inference
     - More complex concept typing
   - Updates graph structure in Neo4j
   - Updates `MemoryUnit.processing_status` to "structured" or "enriched"

5. **Schema Management:**
   - New concept types or relationship labels are submitted to Ontology Steward
   - Ontology Steward evaluates and decides on schema evolution
   - Updates canonical vocabularies in Neo4j and PostgreSQL

### 6.2 Retrieval Flow

The retrieval process handles user queries and delivers contextualized answers:

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│   User    │    │  Dialogue │    │ Retrieval │    │ Weaviate  │
│  Query    │───►│   Agent   │───►│  Planner  │───►│ (Vector   │
└───────────┘    └───────────┘    └───────────┘    │  Search)  │
                       ▲                │          └───────────┘
                       │                │                 
                       │                ▼                 
                       │          ┌───────────┐    ┌───────────┐
                       │          │   Neo4j   │    │   Redis   │
                       └──────────┤ (Graph    │◄───┤ (Cache)   │
                                  │  Query)   │    │           │
                                  └───────────┘    └───────────┘
```

**Process Steps:**

1. **Query Reception:**
   - User submits query via chat interface
   - Dialogue Agent analyzes intent

2. **Retrieval Planning:**
   - Dialogue Agent delegates to Retrieval Planner
   - Retrieval Planner determines optimal strategy:
     - Vector search for semantic similarity
     - Graph traversal for concept-centric queries
     - Hybrid approach for complex questions

3. **Multi-Strategy Execution:**
   - Vector search in Weaviate for semantically similar chunks
   - Graph queries in Neo4j for structured relationships
   - Results combined and reranked

4. **Context Compilation:**
   - Retrieval Planner assembles a context bundle
   - Bundle includes chunks, concepts, graph patterns
   - Context prioritized based on relevance, recency, importance

5. **Response Generation:**
   - Dialogue Agent receives context bundle
   - Formulates response using LLM with context
   - May include relevant proactive insights

### 6.3 Insight Generation Flow

The insight discovery process runs periodically to find patterns and connections:

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ Scheduled │    │  Insight  │    │ Community │    │ Pattern   │
│ Trigger   │───►│  Engine   │───►│ Detection │───►│ Matching  │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                       │                                 │
                       │                                 ▼
                       │                          ┌───────────┐
                       │                          │ Hypothesis│
                       │                          │ Generation│
                       │                          └───────────┘
                       │                                 │
                       ▼                                 ▼
                  ┌───────────┐                   ┌───────────┐
                  │Insight DB │                   │  Neo4j    │
                  │ & Ranking │◄──────────────────┤ (Update   │
                  └───────────┘                   │ Graph)    │
                       │                          └───────────┘
                       ▼
                  ┌───────────┐
                  │ Proactive │
                  │ Delivery  │
                  └───────────┘
```

**Process Steps:**

1. **Trigger Mechanisms:**
   - Scheduled runs (e.g., nightly batch)
   - After significant new content ingestion
   - Explicit user request
   - During system idle periods

2. **Community Detection:**
   - Graph algorithms identify concept clusters
   - Louvain, Label Propagation, or similar methods
   - Communities labeled and added to graph

3. **Pattern Mining:**
   - Co-occurrence analysis across memory units
   - Temporal pattern detection
   - Statistical correlation analysis (if user opts in)

4. **Metaphorical Connection Finding:**
   - Structure-based similarity detection
   - Cross-domain pattern matching
   - LLM-assisted metaphor generation

5. **Hypothesis Generation & Evaluation:**
   - Formulate hypotheses about patterns
   - Evaluate confidence with supporting evidence
   - Rank by novelty, confidence, and relevance

6. **Storage & Delivery:**
   - Store insights in PostgreSQL
   - Update graph with new relationships
   - Surface high-value insights to user proactively
   - Rate-limit to prevent overwhelming user

## 7. Technical Implementation

This section covers implementation details including monorepo structure, API design, security considerations, and testing strategy.

### 7.1 Monorepo Structure

The system will be implemented as a monorepo using Nx or Turborepo for dependency management and build orchestration:

```
/2dots1line-monorepo/
├── apps/
│   ├── web-app/                      # Next.js (React) Frontend
│   ├── mobile-app/                   # React Native App
│   └── backend-api/                  # Express.js Backend API Server
│       ├── src/
│       │   ├── controllers/          # API endpoint handlers
│       │   ├── middlewares/          # Auth, logging, validation
│       │   ├── routes/               # API route definitions
│       │   └── services/             # Agent service interfaces
│       ├── prisma/                   # Prisma schema & migrations
│       └── Dockerfile
├── packages/
│   ├── shared-types/                 # TypeScript types shared across apps
│   ├── shared-utils/                 # Common utilities
│   ├── ui-components/                # Shared React components
│   └── llm-clients/                  # LLM API clients (Google, DeepSeek)
├── services/
│   ├── dialogue-agent/               # Dialogue Agent implementation
│   ├── ingestion-analyst/            # Ingestion Analyst implementation
│   ├── retrieval-planner/            # Retrieval Planner implementation
│   ├── insight-engine/               # Insight Engine implementation
│   ├── ontology-steward/             # Ontology Steward implementation
│   └── tools/                        # Deterministic tools implementations
│       ├── ner-service/              # NER tool service
│       ├── vision-service/           # Vision analysis tools
│       └── [other tool services]
├── workers/
│   ├── embedding-worker/             # Async embedding processor
│   └── processing-worker/            # Background processing tasks
├── infrastructure/
│   ├── aws/                          # AWS deployment templates
│   │   ├── cloudformation/           # CloudFormation templates
│   │   └── terraform/                # Terraform modules
│   └── tencent/                      # Tencent Cloud deployment
│       └── terraform/                # Terraform modules for Tencent
├── docs/                             # Documentation
└── scripts/                          # Build and deployment scripts
```

### 7.2 API Design

The system will expose a set of RESTful and GraphQL APIs:

#### Core REST API Endpoints

**Authentication & User Management:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/preferences` - Update user preferences

**Conversation & Memory Management:**
- `POST /api/conversation/message` - Send user message
- `GET /api/conversation/{id}` - Get conversation history
- `POST /api/journal/entry` - Create journal entry
- `GET /api/memory-units` - List memory units with filtering
- `GET /api/memory-units/{muid}` - Get memory unit details

**Exploration & Knowledge Graph:**
- `GET /api/concepts` - List concepts with filtering
- `GET /api/concepts/{id}` - Get concept details with related memories
- `GET /api/concepts/{id}/related` - Get concepts related to a concept
- `GET /api/insights` - Get user insights
- `POST /api/insights/generate` - Request insight generation

**Annotation & Feedback:**
- `POST /api/annotation` - Create user annotation
- `PUT /api/concepts/{id}/feedback` - Provide feedback on concept
- `PUT /api/insights/{id}/feedback` - Feedback on insight
- `POST /api/ontology/feedback` - Feedback on terminology

#### GraphQL API

For complex nested queries (especially for the UI), a GraphQL API will be provided:

```graphql
type Query {
  # Memory exploration
  memoryUnits(filter: MemoryUnitFilter): [MemoryUnit!]!
  memoryUnit(muid: ID!): MemoryUnit
  
  # Concept exploration
  concepts(filter: ConceptFilter): [Concept!]!
  concept(id: ID!): Concept
  
  # Knowledge graph exploration
  conceptGraph(rootConceptId: ID!, depth: Int): ConceptGraph
  community(id: ID!): Community
  communities: [Community!]!
  
  # User data
  userProfile: User
  userInsights(filter: InsightFilter): [Insight!]!
}

type Mutation {
  createAnnotation(input: AnnotationInput!): Annotation
  updateConceptFeedback(id: ID!, feedback: ConceptFeedbackInput!): Concept
  generateInsight(focus: InsightFocusInput): InsightGenerationResult
}
```

### 7.3 Security Considerations

**Authentication & Authorization:**
- JWT-based authentication with short-lived tokens
- OAuth2 integration for social login
- Role-based access control for admin functions
- User-specific data isolation via database constraints and application logic

**Data Protection:**
- All database connections secured with TLS
- API endpoints secured with HTTPS
- Sensitive data encrypted at rest
- User data stored in region-specific databases for compliance

**Privacy Controls:**
- Granular user control over data storage and processing
- Ability to export and delete personal data
- Clear privacy policy and consent management
- Memory units can be marked as private
- Opt-in/out controls for proactive insights

**AI Safeguards:**
- Prompt templates reviewed for security and bias
- LLM guardrails for potentially harmful content
- Rate limiting to prevent abuse
- Input validation on all AI-processed content
- Regular auditing of model outputs

### 7.4 Testing Strategy

**Unit Testing:**
- Agent services tested with mocked tools
- Tool implementations tested with known inputs/outputs
- Database models and operations tested with test database

**Integration Testing:**
- End-to-end agent pipeline tests
- Database interaction tests with test instances
- API integration tests

**Semantic Testing:**
- LLM tool behavior validation tests
- Embedding quality evaluation
- Insight generation quality checks
- Retrieval precision/recall evaluation

**Load & Performance Testing:**
- Simulated user load tests for API endpoints
- Embedding throughput testing
- Graph query performance benchmarking
- Response time monitoring for interactive endpoints

**CI/CD Pipeline:**
- Automated testing on PR submission
- Quality gate checks for code coverage
- Semantic test metrics tracked over time
- Canary deployments for gradual rollout

## 8. UI/UX Integration

The UI/UX implementation will leverage the "Empyrean Interface" design language from `UIDesignLanguage.md`, harmonized with "The Illuminated Journey" aesthetic from `UIUXDesignSpec.md`.

### 8.1 Unified Design System

The merged design system will integrate:
- **Glassmorphic Layers:** Frosted, translucent panels that float over dynamic backgrounds
- **Dynamic Skyscapes:** Backgrounds from classical/romantic paintings that shift by time of day or section
- **Color Palette:**
  - Primary: Sapphire Blue (`#0F4C81`) and Rose Gold (`#B76E79`)
  - Accent: Insight Gold (`#E6BE8A`), Growth Teal (`#48AAAD`), Reflection Amethyst (`#B28DFF`), Connection Coral (`#FF8C69`)
  - Neutral: Alabaster White (`#F2F0E6`), Charcoal Grey (`#36454F`)
- **Typography:**
  - Headings/UI: Montserrat (geometric sans-serif)
  - Body/Content: Lora (balanced serif)
- **Dot's Avatar:** Abstract, luminous orb with subtle animations reflecting state

### 8.2 Core User Journeys

**Onboarding Flow:**
1. Welcome/value proposition screens
2. Account creation
3. Initial preference setting
4. First interaction with Dot
5. Tour of key features

**Daily Engagement:**
1. "Today with Dot" dashboard with morning reflection
2. Quick capture for journaling
3. Proactive insights (limited to 2-3 per day)
4. Recent memory surfacing ("On this day...")

**Memory Exploration:**
1. Concept browsing through the Lifeweb
2. Temporal exploration via timeline
3. Search (natural language or structured)
4. Memory detail view with related concepts

**Insight Experience:**
1. Notification of new insight
2. Insight card with evidence
3. Confirmation/rejection flow
4. Follow-up reflection prompts

### 8.3 Mobile-Specific Considerations

The mobile app will implement the same design language with optimizations for smaller screens:

1. **Navigation:** Bottom tab bar instead of sidebar
2. **Gestures:** Swipe patterns for common actions
3. **Compact Views:** Tailored card layouts for mobile screens
4. **Offline Support:** Journal entry creation while offline
5. **Push Notifications:** For proactive insights (user-configurable)
6. **Voice Input:** Mobile-optimized voice-to-text for journaling

### 8.4 Real-time Collaboration with Dot

The chat interface will follow these principles:

1. **Transparent Processing:** Visible indicators for message processing stages
2. **Progressive Response:** Dot may provide initial quick response followed by deeper analysis
3. **Interactive Elements:** Suggested actions, inline concept exploration, annotation creation
4. **Context Awareness:** Visible indicators when Dot is using previous context
5. **Graceful Fallbacks:** If deep knowledge isn't available, Dot should communicate limitations honestly

### 8.5 3D Knowledge Visualization

For the ambitious 3D Lifeweb visualization:

1. **Entry Point:** Available from concept exploration or dedicated "Explore Lifeweb" section
2. **Technology:** WebGL via Three.js/React Three Fiber for web, SceneKit/ARKit for iOS, SceneForm for Android
3. **Performance Tiers:**
   - **Light Mode:** Limited node count, simplified physics
   - **Full Mode:** Rich interactive visualization with physics simulation
4. **Navigation:** Intuitive camera controls, focal points for key concepts
5. **Interaction Model:** Click/tap concepts to explore details, pinch/zoom to navigate
6. **Filtering Controls:** By time period, concept type, community, or recent activity

### 8.6 User Feedback & Control

Critical for system improvement and trust building:

1. **Inline Feedback:** Simple thumbs up/down on responses and insights
2. **Concept Review:** Ability to edit concept descriptions or relationships
3. **Privacy Controls:** Granular control over what's remembered and processed
4. **Proactivity Settings:** Adjust frequency and types of proactive insights
5. **Data Transparency:** Clear visibility into what data is stored and how it's used

## 9. Deployment Strategy

The deployment strategy addresses the dual-region requirement (US/AWS and China/Tencent) while ensuring consistency and compliance.

### 9.1 Infrastructure Architecture

**US Deployment (AWS):**
- **Compute:** AWS ECS (Fargate) for containerized services
- **Function-as-a-Service:** AWS Lambda for lightweight tools
- **Database Services:**
  - PostgreSQL: Amazon RDS PostgreSQL
  - Neo4j: Self-hosted on EC2 or Neo4j Aura DB
  - Weaviate: Self-hosted on EKS or EC2
  - Redis: Amazon ElastiCache
- **Storage:** S3 for media, backups, logs
- **Networking:** CloudFront CDN, API Gateway, VPC
- **AI Services:** Google AI API for LLM/embedding services

**China Deployment (Tencent Cloud):**
- **Compute:** Tencent CVM or TKE (Kubernetes)
- **Function-as-a-Service:** Tencent SCF
- **Database Services:**
  - PostgreSQL: TencentDB for PostgreSQL
  - Neo4j: Self-hosted on CVM
  - Weaviate: Self-hosted on TKE
  - Redis: Tencent Cloud Redis
- **Storage:** Tencent COS for media, backups, logs
- **Networking:** Tencent CDN, API Gateway
- **AI Services:** DeepSeek API for LLM/embedding services

**Shared Components:**
- Containerization strategy (Docker)
- Terraform modules for infrastructure as code
- Monitoring and logging standards
- CI/CD pipeline with region-specific deployment targets

### 9.2 Data Residency & Compliance

To maintain compliance with both US and Chinese regulations:

1. **Regional Data Isolation:**
   - User data stored only in their region's databases
   - No cross-region data transfer for user content
   - Separate database instances for each region

2. **Model Access Strategy:**
   - US users: Google AI models (Gemini)
   - China users: DeepSeek models
   - LLM clients designed for seamless switching based on region

3. **Codebase Adaptations:**
   - Shared core logic
   - Region-specific configurations and service connectors
   - Feature flags for region-specific features

4. **User Migration (if needed):**
   - Documented process for migrating users between regions (with their consent)
   - Data export/import tools that respect regional boundaries

### 9.3 Scaling Strategy

**Horizontal Scaling:**
- Agent services scale horizontally based on load
- Database read replicas for high-traffic periods
- Worker pools scale based on queue depth

**Resource Allocation:**
- Dialogue Agent: Priority scaling (user-facing)
- Retrieval Planner: Medium priority (interactive queries)
- Ingestion Analyst: Scales with input volume
- Embedding Workers: Background scaling based on queue
- Insight Engine: Lowest priority, runs in off-peak hours

**Cost Optimization:**
- Auto-scaling based on traffic patterns
- Scheduled scaling for predictable loads
- Spot instances for non-critical background processing
- Tiered storage for infrequently accessed data

### 9.4 Monitoring & Observability

**Key Metrics:**
- **System Health:** Service uptime, error rates, resource utilization
- **Performance:** Response times, queue depths, processing latency
- **User Engagement:** Active users, message volume, retention
- **AI Quality:** Model latency, token usage, error rates
- **Business Metrics:** User growth, premium conversions, core feature usage

**Monitoring Tools:**
- **US:** AWS CloudWatch, DataDog
- **China:** Tencent Cloud Monitor
- **Shared:** Prometheus, Grafana dashboards

**Alerting Strategy:**
- Critical service degradation alerts
- Abnormal error rate alerts
- Cost threshold alerts
- Model performance degradation alerts

### 9.5 Backup & Disaster Recovery

**Backup Strategy:**
- Daily incremental backups of all databases
- Weekly full backups
- Transaction log archiving for point-in-time recovery
- Cross-zone/region backups within compliance boundaries

**Disaster Recovery:**
- Automated failover for critical components
- Manual failover procedures documented for complex scenarios
- Regular DR testing and validation
- Maximum allowable downtime defined by service tier

**Business Continuity:**
- Multiple availability zone deployment
- Circuit breakers and graceful degradation
- Read-only mode capabilities during write service outages

## 10. Conclusion & Next Steps

### 10.1 Implementation Roadmap

**Phase 1: Foundation (Months 1-2)**
- Core knowledge model implementation (PostgreSQL, Neo4j, Weaviate)
- Basic Ingestion Analyst and tool layer
- Simple Dialogue Agent with basic retrieval
- Minimal viable UI with chat and journaling

**Phase 2: Core Capabilities (Months 3-4)**
- Enhanced Retrieval Planner with hybrid search
- Knowledge graph visualization (2D)
- Tier 1-3 processing pipeline complete
- Mobile app MVP

**Phase 3: Intelligence Layer (Months 5-6)**
- Insight Engine implementation
- Proactive engagement features
- Ontology Steward and schema evolution
- Advanced UI features and personalization

**Phase 4: Advanced Features (Months 7-8)**
- 3D knowledge visualization
- Deep metaphorical connections
- Performance optimization
- Cross-region deployment

### 10.2 Critical Success Factors

1. **User-Centered Development:**
   - Early user testing of core interactions
   - Regular feedback cycles on AI outputs
   - Balancing proactivity with user control

2. **Technical Excellence:**
   - Knowledge graph design optimization
   - Embedding strategy refinement
   - Query performance tuning
   - Agent prompt engineering and fine-tuning

3. **Product-Market Fit:**
   - Clear positioning against journaling apps
   - Value demonstration for target users
   - Pricing and go-to-market strategy

4. **Team Organization:**
   - Domain-focused teams (agents, persistence, UI)
   - Regular cross-team technical reviews
   - AI ethics and oversight committee

### 10.3 Open Questions & Research Areas

1. **Retrieval Optimization:**
   - Best hybrid search algorithms for complex queries
   - Graph traversal optimization for insight discovery
   - Caching strategies for common query patterns

2. **Knowledge Evolution:**
   - Long-term graph maintenance as user knowledge grows
   - Concept drift detection and management
   - Temporal vs. semantic organization tradeoffs

3. **Personalization:**
   - Adapting to individual user communication styles
   - Learning privacy preferences implicitly
   - Tuning proactivity based on engagement patterns

4. **Cross-Modal Understanding:**
   - Integration of images, voice, and text modalities
   - Multi-modal pattern recognition
   - Unified embedding space across modalities

This V4 Technical Specification combines the strengths of previous designs, introduces new capabilities, and provides a clear path to implementation. It balances technical sophistication with practical concerns, creating a knowledge graph system that can truly help users understand their lives in deeper, more meaningful ways.