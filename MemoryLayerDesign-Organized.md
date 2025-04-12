# Memory Layer Design for 2dots1line

This document provides a comprehensive architecture for the memory layer of 2dots1line, which serves as both a semantic knowledge base and a structured representation of the user's world.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Principles](#design-principles)
3. [Data Schema](#data-schema)
4. [Knowledge Extraction Flow](#knowledge-extraction-flow)
5. [Implementation Details](#implementation-details)
6. [Evaluation Metrics](#evaluation-metrics)
7. [Current Architecture Review](#current-architecture-review)
8. [Improvement Roadmap](#improvement-roadmap)

## Architecture Overview

The memory layer is designed as a multi-layered system that captures, processes, and structures user-provided information into useful knowledge:

```
Raw Data Layer → Semantic Processing → Knowledge Graph + Embedding Layer → Application Layer
```

### Key Components

1. **Raw Data Storage**: Captures and stores all user inputs (conversation, documents, images)
2. **Semantic Processing Layer**: Processes raw data to extract meaningful entities, relationships, and semantic insights
3. **Knowledge Representation Layer**: 
   - **Knowledge Graph**: Structured representation of entities and relationships
   - **Vector Embeddings**: Semantic representation for fuzzy matching and retrieval
4. **Application Layer**: Interfaces for querying, visualization, and insight generation

### Recommended Technology Stack

- **Vector Database**: Pinecone / Weaviate / Qdrant
- **Knowledge Graph Database**: Neo4j / Memgraph
- **Relational Database**: PostgreSQL
- **Embedding Model**: OpenAI/Google Embedding APIs

## Design Principles

| Principle | Description |
|-----------|-------------|
| Semantic Chunking | Split content into meaningful semantic units rather than arbitrary chunks |
| Importance Filtering | Only store information that has meaningful value for understanding the user |
| Incremental Embedding | Update existing embeddings with new information rather than creating duplicates |
| Knowledge Graph-first Embedding | Base embeddings on graph structure for contextual richness |
| Automatic Ontology Expansion | Dynamically extend the knowledge graph schema as new concepts emerge |
| Incremental Graph Migration | Evolve the graph structure without requiring complete rebuilds |
| Two-layer Structure | Maintain stable core ontology with flexible extension layer |
| Contextual Embedding | Include relevant context when generating embeddings |
| Comprehensive Context | Combine raw data context with graph structure context |
| Human-in-the-loop | Allow for user verification of important knowledge additions |
| Semantic Similarity Threshold | Use similarity thresholds to determine update vs. creation |

## Data Schema

### 1. Raw Data Table (PostgreSQL)

```sql
CREATE TABLE raw_data (
  source_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- e.g., 'user_chat', 'uploaded_file'
  created_at TIMESTAMP NOT NULL,
  perspective_owner_id TEXT, -- who narrated the data
  subject_id TEXT -- whom the data is about
);
```

### 2. Embedding Database Schema (Pinecone/Weaviate)

```json
{
  "embedding_id": "emb_0001",
  "vector": [0.0134, -0.2356, ..., 0.1234],
  "metadata": {
    "summary": "User's daughter fluctuating interest in piano practice",
    "importance_score": 0.92,
    "source_ids": ["raw_001", "raw_002"],
    "linked_node_ids": ["event_001", "emotion_002", "object_piano"],
    "subject_id": "child_001",
    "perspective_owner_id": "user_001",
    "last_updated_at": "2025-05-05T12:00:00Z"
  }
}
```

### 3. Knowledge Graph Schema (Neo4j)

#### Node Types:
- **Person**: People mentioned (user, family members, friends)
- **Event**: Specific occurrences or happenings
- **Emotion**: Feelings and emotional states
- **Object**: Physical items (piano, books, etc.)
- **Place**: Locations and geographic entities
- **Identity**: Roles and identities of people
- **Hobby**: Activities and interests
- **Trait**: Character attributes and personality traits
- **Value**: Personal values and beliefs
- **Goal**: Objectives and aspirations
- **Challenge**: Problems, obstacles, difficulties
- **System**: Contexts or environments (family, work)

#### Edge Types:
- **PARTICIPATED_IN**: Links Person to Event
- **FELT_DURING**: Links Event to Emotion
- **OBSERVED_BY**: Links Event to Person (observer)
- **USES_OBJECT**: Links Person to Object
- **HAS_HOBBY**: Links Person to Hobby
- **OCCURRED_AT**: Links Event to Place
- **HAS_TRAIT**: Links Person to Trait
- **MOTIVATED_BY**: Links Person/Action to Value
- **PURSUES_GOAL**: Links Person to Goal
- **FACES_CHALLENGE**: Links Person to Challenge
- **EMBEDS_INTO**: Links Person to System

#### Node Schema Example:

```cypher
// Person node
CREATE (p:Person {
  id: 'person_001',
  name: 'Daughter',
  role: 'Child',
  subject_id: 'child_001',
  perspective_owner_id: 'user_001' // whose perspective this is from
});

// Event node
CREATE (e:Event {
  id: 'event_001',
  title: 'Piano Recital',
  timestamp: date('2023-05-10'),
  subject_id: 'child_001',
  perspective_owner_id: 'user_001',
  source_type: 'direct_observation'
});
```

#### Edge Schema Example:

```cypher
// Create relationship
MATCH (c:Person {id:'child_001'}), (e:Event {id:'event_001'})
CREATE (c)-[:PARTICIPATED_IN]->(e);

MATCH (e:Event {id:'event_001'}), (em:Emotion {id:'emotion_001'})
CREATE (e)-[:FELT_DURING]->(em);
```

## Knowledge Extraction Flow

The process for extracting, analyzing, and storing knowledge follows this flow:

1. **Raw Data Input** → User messages, uploaded files, or other inputs
2. **Content Processing**:
   - For long texts: Semantic chunking into meaningful units
   - For all inputs: Importance filtering to identify valuable information
3. **Decision Point**: Is this information important enough to store?
   - If no → Archive only in raw storage
   - If yes → Continue to knowledge extraction
4. **Knowledge Graph Generation**:
   - Extract entities and relationships
   - Create or update nodes and edges in the knowledge graph
5. **Embedding Generation**:
   - Check semantic similarity with existing embeddings
   - If similarity > 0.9: Update metadata only
   - If similarity 0.7-0.9: Incremental embedding update
   - If similarity < 0.7: Create new embedding
6. **Linking**: Connect embeddings to knowledge graph nodes via `linked_node_ids`

### Example Flow:

User input: "My daughter had her piano recital yesterday. She was nervous at first but ended up playing beautifully."

1. **Raw Storage**: Save to raw_data table with unique source_id
2. **Entity Extraction**:
   - Entities: Daughter (Person), Piano Recital (Event), Nervousness (Emotion), Successful Performance (Event)
   - Relationships: Daughter PARTICIPATED_IN Piano Recital, Piano Recital FELT_DURING Nervousness
3. **Knowledge Graph Update**:
   - Create/update nodes for each entity
   - Create relationships between entities
4. **Embedding Generation**:
   - Generate embedding for the processed content
   - Link embedding to relevant knowledge graph nodes

## Implementation Details

### 1. Semantic Chunking Strategy

Split content into semantic units based on:
- Thematic consistency (same topic/subject)
- Reasonable size (200-500 tokens)
- Preservation of contextual meaning

Implementation approach:
```python
def semantic_chunk(content):
    # Use sliding window with overlap
    chunks = []
    for i in range(0, len(content), CHUNK_SIZE - OVERLAP):
        chunk = content[i:i + CHUNK_SIZE]
        # Check if chunk is semantically complete
        if is_semantically_complete(chunk):
            chunks.append(chunk)
        else:
            # Adjust chunk boundaries to maintain semantic integrity
            adjusted_chunk = adjust_boundaries(chunk)
            chunks.append(adjusted_chunk)
    return chunks
```

### 2. Importance Filtering Algorithm

Two-stage filtering process:
1. **Coarse filtering**: Keyword-based and rule-based initial screening
2. **Fine filtering**: AI-based relevance scoring for detailed assessment

Example of importance criteria:
- Mentions of people, relationships, events
- Expressions of values, preferences, beliefs
- Descriptions of emotional responses
- Information about decisions, goals, challenges

### 3. Incremental Embedding Strategy

When new information is related to existing knowledge:

```python
def update_embedding(existing_embedding, new_content):
    new_embedding = generate_embedding(new_content)
    
    # Weighted average approach
    updated_embedding = (
        existing_embedding * (1 - ALPHA) + 
        new_embedding * ALPHA
    )
    
    # Normalize
    updated_embedding = updated_embedding / np.linalg.norm(updated_embedding)
    
    return updated_embedding
```

### 4. Perspective and Subject Management

For handling multi-subject content (e.g., user talking about their child):

```json
{
  "event_id": "evt_872",
  "title": "Piano practice reluctance",
  "subject_id": "child_001",
  "perspective_owner": "user_001",
  "source_type": "proxy_subjective",
  "emotion": {
    "label": "frustration",
    "intensity": "moderate"
  },
  "linked_thought": {
    "text": "Piano practice feels like a chore",
    "confidence": "high"
  }
}
```

### 5. Dynamic Ontology Expansion

Process for adding new node/edge types:
1. Monitor entity patterns that don't match existing types
2. When pattern frequency exceeds threshold, propose new type
3. Initially apply new type to recent data
4. Optionally backfill historical data as needed

## Evaluation Metrics

Measure the effectiveness of the memory layer using:

1. **Retrieval Accuracy**: Ability to retrieve relevant information
2. **Semantic Coherence**: Logical consistency of extracted knowledge
3. **Duplication Rate**: Percentage of redundant knowledge stored
4. **Coverage**: Percentage of important information successfully captured
5. **Contextual Relevance**: Appropriateness of information retrieved for specific contexts

## Current Architecture Review

The current implementation in 2dots1line has several components related to the memory layer:

1. **Database Schema**: 
   - `Thought` model in PostgreSQL for storing extracted insights
   - Basic support for vector embeddings (Float[] array)
   - Links to source interactions

2. **Vector Storage**:
   - Preliminary implementation of Milvus integration
   - Basic embedding generation via external APIs

3. **Knowledge Graph**:
   - Neo4j integration for storing entities and relationships
   - Basic knowledge extraction from messages

4. **Processing Pipeline**:
   - Basic extraction of thoughts from interactions
   - Limited semantic processing of content

### Limitations in Current Implementation

1. **Limited Semantic Chunking**: The current implementation lacks sophisticated semantic chunking for long-form content.

2. **Basic Importance Filtering**: All content is processed similarly without clear importance criteria.

3. **Simplistic Embedding Strategy**: No clear incremental embedding updates or deduplication strategy.

4. **Limited Knowledge Structure**: Current knowledge graph lacks the rich ontology needed for comprehensive user modeling.

5. **No Multi-subject Support**: Cannot properly model different perspectives or subjects (e.g., user vs. child).

6. **No Ontology Expansion**: Schema is static rather than dynamically evolving.

## Improvement Roadmap

### Phase 1: Foundation Enhancements (1-2 months)

1. **Improve Semantic Chunking**:
   - Implement sliding window with overlap technique
   - Add semantic boundary detection
   - Support varying chunk sizes based on content cohesiveness

2. **Upgrade Importance Filtering**:
   - Implement two-stage filtering (coarse + fine)
   - Train a classifier for identifying valuable content
   - Add confidence scoring to all extracted information

3. **Enhance Knowledge Graph Schema**:
   - Expand node and edge types according to schema design
   - Add support for properties and metadata
   - Implement proper entity linking across database systems

### Phase 2: Advanced Capabilities (2-3 months)

4. **Implement Perspective Management**:
   - Add subject_id and perspective_owner tracking
   - Support multiple perspectives on same entities
   - Enable filtering/views based on perspective

5. **Develop Incremental Updates**:
   - Implement similarity-based embedding updates
   - Add deduplication with semantic similarity checking
   - Create incremental graph migration tools

6. **Create Query Interfaces**:
   - Develop comprehensive API for knowledge retrieval
   - Support multi-modal queries (text, semantic, structural)
   - Add filtering and relevance ranking options

### Phase 3: Intelligence Layer (3-4 months)

7. **Implement Ontology Expansion**:
   - Create dynamic type detection system
   - Add schema evolution capabilities
   - Build migration tools for evolving schemas

8. **Develop Intelligent Summarization**:
   - Add automatic insight generation
   - Implement topic clustering and trend detection
   - Build personalized knowledge summaries

9. **Create Visualization Tools**:
   - Develop graph visualization interface
   - Add interactive exploration tools
   - Support custom views and filters

### Phase 4: Integration & Optimization (Ongoing)

10. **Performance Optimization**:
    - Implement caching strategies
    - Optimize query patterns
    - Add batch processing for large updates

11. **User Feedback Loop**:
    - Add human-in-the-loop confirmation
    - Implement correction mechanisms
    - Build feedback-based learning system

12. **Cross-platform Integration**:
    - Ensure memory layer works across all interfaces
    - Support API access for external tools
    - Develop SDK for third-party integration

## Enhanced Implementation Plan (2025)

Based on the architecture review and implementation details, the following enhanced approach has been developed to better leverage the dual-agent memory system.

### Dot and Memory Manager Agent Collaboration

The revised architecture implements a two-agent system with a broker middleware:

1. **Dot (Conversational Agent)**
   - User-facing AI companion focused on engaging conversations
   - Detects important information worthy of long-term retention
   - Communicates with Memory Manager via broker service
   - Utilizes retrieved memories to provide context-aware responses

2. **Memory Manager (Silent Agent)**
   - Background processing agent that structures and organizes memory
   - Handles semantic chunking, importance filtering, and knowledge extraction
   - Manages the memory layer without direct user interaction
   - Provides contextual information back to Dot when needed

3. **Memory Broker Service**
   - Middleware layer facilitating communication between agents
   - Handles event logging and metrics tracking
   - Ensures consistent data flow through memory processing pipeline
   - Implements importance scoring to filter trivial content

### Updated Memory Processing Pipeline

The enhanced processing pipeline implements a more structured flow:

1. **Raw Data Ingestion**
   - User messages and significant AI responses are captured as raw data
   - Initial importance scoring determines processing priority
   - Memory broker notifies the system about new content
   - Each raw data entry is linked to user, session, and perspective metadata

2. **Importance-Based Processing**
   - Content is scored based on multiple factors:
     - Presence of important topics (relationships, goals, values, emotions)
     - Content length and complexity
     - Interaction type (user messages score higher than AI responses)
   - Only content exceeding importance thresholds proceeds for deeper processing
   - Metrics track processing decisions for system optimization

3. **Semantic Chunking With Context**
   - Longer content is broken into meaningful units using sentence boundaries
   - Each chunk maintains overlap with adjacent chunks to preserve context
   - Natural language boundaries are respected to maintain semantic integrity
   - Memory broker tracks chunk creation and relationships to parent content

4. **Thought Extraction**
   - High-importance content is processed to extract meaningful thoughts
   - Each thought represents a substantive insight about the user's world
   - Thoughts include subject types (user_trait, user_experience, etc.)
   - Deduplication logic prevents redundant thoughts

5. **Integration with Knowledge Graph**
   - Thoughts connect to the knowledge graph structure
   - Entity and relationship extraction builds structured representations
   - Graph connections enhance retrieval relevance

### Automated Memory Testing

The implementation includes a comprehensive testing framework:

1. **End-to-End Pipeline Tests**
   - Verify data flow from raw input to thought creation
   - Confirm proper filtering of trivial content
   - Validate semantic chunking boundaries and context preservation

2. **Importance Scoring Validation**
   - Test threshold behavior for different content types
   - Verify that significant content is properly identified
   - Ensure trivial messages are filtered appropriately

3. **Memory Retrieval Accuracy**
   - Test contextual memory retrieval using known patterns
   - Validate semantic search functionality
   - Measure retrieval precision and recall

4. **Metrics Tracking**
   - Monitor system performance through processing metrics
   - Track volume of data at each pipeline stage
   - Identify potential bottlenecks or filter issues

This enhanced implementation delivers a more psychologically realistic memory system, ensuring that important information is captured, structured, and made available for contextual retrieval while filtering out conversational noise.

### Memory Broker Implementation

The Memory Broker service acts as a central communication hub with these components:

1. **Event-Based Architecture**
   - Notifications for each memory processing event
   - Standardized event schema for consistency
   - Audit trail of memory system activity

2. **Metrics Collection**
   - Per-user tracking of memory processing statistics
   - Measurement of pipeline efficiency and effectiveness
   - Data for system optimization and fine-tuning

3. **Memory Retrieval Interface**
   - Unified API for Dot to query memory context
   - Integrated retrieval across memory types
   - Contextual relevance scoring

4. **Importance Calculation**
   - Rule-based scoring algorithm
   - Content type weighting
   - Keyword and pattern matching

The implementation of this broker service enables the seamless operation of the dual-agent architecture while providing valuable insights into system performance and enabling future enhancements to memory quality and relevance. 