# Memory Layer Design for 2dots1line

This document provides a comprehensive architecture of the memory layer for 2dots1line, which serves as both a semantic knowledge base and a structured representation of the user's world.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design Principles](#design-principles)
3. [Data Schema](#data-schema)
4. [Knowledge Extraction Flow](#knowledge-extraction-flow)
5. [Implementation Details](#implementation-details)
6. [API Reference](#api-reference)
7. [Testing & Monitoring](#testing--monitoring)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

The 2dots1line memory layer is a multi-layered system that processes user data through several stages:

```
Raw Data → Semantic Processing → Thoughts & Knowledge Graph → Application Layer
```

![Memory Architecture](https://mermaid.ink/img/pako:eNqNVE1v2zAM_SuETg2QFEGOPQxosGzA1mEYtqE7FD4YtpxEiC0Zkjy0Qf77KH-kaVJsqw-BKPLx8ZF80hdpbGckaWQvrWK43DiVXXDXuN_NnWuEZWC_F41xbXbP2wrcH1jUlm5OOtcLp5aNMAtwiruVvLmxwPcZX2U1KXUOrdQ7mRUODrbkBR9grV3gqbT9bLzHDPdYWOcspbzzKKMzK48HcVmz4iq1a4p3Vq7gGvzjUa6g19AxhdaQv5U5LKBzxjzRYFrYCBu4U6ZlimC7gPEMq8cAWEzOVY-NMZyMF2SBnzyvD2i94JzOyYbtNgTDSPVhvU7XmbbEVFWmFdCuJBpCrKH04HQWtdYZi1KiGOesaXRcV4tWmbxljXX1OVPx4lLEW8y7VfZLN65F8xOadQw_DCKQQ3LYI5XN9WNkHTwERoZVVsRzYmWoYc-dNTRCOuK23eE-n32YJ-l3-RHCqwS-_VZYRI6NQZG2hwPG4jrXM4onHmMaZ-kURCe9jtP7MUc4QGg5JqoMQcgj9xB0B9_MRVnGTyJvMZ60b4dA0iBYVFzJvxJ62NzMVG18t6OaUB70fF1uM1ItYapRxCdx2aKzJuKqDa6oKFEGdH1_hwzI7UGfjKZDZ1j5Qmz4n53GRbvyiDq4UcO_A4-3I_LsMH_-nEQcGHtbx9_X8JxZ_2FW1P7S5Z6KHs1J0ot76dbOpZHfOFhwUBrZS9fL5b6XFb9rZR_5QLv1_b6XxMcHSvbA-H1GDT_3-cT6FrYGNzzKXNgHHi3VIxdPm5QT6M9v4STm-PVJBYg-zJCb3Pzme_mf1k9T2dB9i4-HUX4rFWoMX1J1HH1pDZuU4ZO7T8vTG4Hvr6MJLmCf1S-bQhV8r9AXJHD-A3Vg1-Q?type=png)

### Key Components

1. **Raw Data Layer**: Prisma PostgreSQL models for user-generated content
   * RawData: User messages, document uploads, etc.
   * Metadata: Context, importance scoring

2. **Semantic Processing Layer**: Services that process raw data
   * Chunking Service: Splits content into semantic units
   * Embedding Service: Generates vector embeddings
   * Knowledge Extraction Service: Identifies entities and relationships

3. **Knowledge Representation Layer**:
   * Vector Database (Weaviate): Semantic search capability
   * Knowledge Graph (Neo4j): Structured entity relationships
   * Thought Layer (Prisma): Synthesized user insights

4. **Application Layer**:
   * Memory API: Unified interface for querying memory
   * Memory Broker: Event system for memory processes

### Technology Stack

* **Database**: PostgreSQL (via Prisma ORM)
* **Vector Database**: Weaviate
* **Knowledge Graph**: Neo4j
* **Embedding Models**: Gemini AI API
* **Backend**: Node.js/Express
* **API Layer**: RESTful endpoints

## Design Principles

1. **Semantic Memory**: Process and store information in semantically meaningful units
2. **Importance-Based Filtering**: Prioritize storing information with high relevance
3. **Multi-Perspective Storage**: Support different viewpoints on the same entity
4. **Contextual Enrichment**: Enhance memory with surrounding context
5. **Incremental Learning**: Continuously update and refine the knowledge base

## Data Schema

### Current Database Schema (Prisma)

```prisma
model RawData {
  id                 String   @id @default(cuid())
  content            String // The actual content
  contentType        String // 'user_chat', 'uploaded_file', 'image', etc.
  createdAt          DateTime @default(now())
  userId             String   @db.Uuid
  sessionId          String // To group related interactions
  perspectiveOwnerId String   @db.Uuid // Who provided this data
  subjectId          String? // Who this data is about
  importanceScore    Float? // Determined during processing
  processedFlag      Boolean  @default(false)

  // Relationships
  user       User            @relation(fields: [userId], references: [user_id])
  chunks     SemanticChunk[]
  thoughts   Thought[]
  embeddings Embedding[]

  @@index([userId])
  @@index([sessionId])
  @@index([perspectiveOwnerId])
}

model SemanticChunk {
  id                 String   @id @default(cuid())
  rawDataId          String
  content            String // The chunk content
  summary            String? // Optional summary
  chunkIndex         Int // Position in sequence
  importanceScore    Float? // Determined during processing
  createdAt          DateTime @default(now())
  perspectiveOwnerId String   @db.Uuid // Who provided this data
  subjectId          String? // Who this chunk is about

  // Relationships
  rawData    RawData     @relation(fields: [rawDataId], references: [id], onDelete: Cascade)
  embeddings Embedding[]
  thoughts   Thought[]

  @@unique([rawDataId, chunkIndex])
  @@index([rawDataId])
  @@index([perspectiveOwnerId])
}

model Embedding {
  id              String   @id @default(cuid())
  vector          Float[] // The actual embedding vector
  dimension       Int // Vector dimensions (e.g., 768, 1536)
  content         String // The text that was embedded
  summary         String // Summarized content
  importanceScore Float // Relevance score
  confidence      Float    @default(1.0)
  embeddingType   String // 'raw', 'chunk', 'thought', 'entity', etc.
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Source tracking
  rawDataId String?
  chunkId   String?

  // Context and perspective
  perspectiveOwnerId String  @db.Uuid // Who provided this data
  subjectId          String? // Who this embedding is about

  // Graph connectivity
  linkedNodeIds String[] // IDs of related knowledge graph nodes

  // Vector database metadata
  vectorCollection String // Collection name in vector DB
  vectorId         String // ID in vector database
  isIncremental    Boolean @default(false)

  // Relationships
  rawData       RawData?          @relation(fields: [rawDataId], references: [id])
  chunk         SemanticChunk?    @relation(fields: [chunkId], references: [id])
  thoughts      Thought[]
  updateHistory EmbeddingUpdate[]

  @@index([rawDataId])
  @@index([chunkId])
  @@index([perspectiveOwnerId])
}

model Thought {
  id         String   @id @default(cuid())
  title      String // Brief title
  content    String // The full thought content
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  confidence Float    @default(1.0)
  vector     Float[] // Embedding vector for the thought

  // Categorization
  subjectType String // 'user_trait', 'user_goal', etc.
  subjectName String // The specific subject

  // Source tracking
  rawDataId     String?
  chunkId       String?
  embeddingId   String?
  interactionId String? @db.Uuid

  // Context and perspective
  userId             String  @db.Uuid // User who owns this thought
  perspectiveOwnerId String? @db.Uuid // Who provided this thought
  subjectId          String? // Who this thought is about

  // Graph connectivity
  linkedNodeIds String[] // IDs of related knowledge graph nodes

  // Relationships
  user        User           @relation(fields: [userId], references: [user_id])
  rawData     RawData?       @relation(fields: [rawDataId], references: [id])
  chunk       SemanticChunk? @relation(fields: [chunkId], references: [id])
  embedding   Embedding?     @relation(fields: [embeddingId], references: [id])
  interaction Interaction?   @relation(fields: [interactionId], references: [interaction_id])

  @@index([userId])
  @@index([rawDataId])
  @@index([chunkId])
  @@index([embeddingId])
  @@index([interactionId])
  @@index([perspectiveOwnerId])
}

model MemoryMetrics {
  id                 String   @id @default(cuid())
  userId             String   @unique @db.Uuid
  user               User     @relation(fields: [userId], references: [user_id])
  rawDataProcessed   Int      @default(0)
  chunksCreated      Int      @default(0)
  thoughtsProcessed  Int      @default(0)
  thoughtsCreated    Int      @default(0)
  thoughtsSkipped    Int      @default(0)
  lastUpdated        DateTime @default(now())

  @@index([userId])
}
```

### Neo4j Knowledge Graph Schema

The knowledge graph uses the following core schema:

```cypher
// Node labels
:Person
:Event
:Place
:Object
:Concept
:Trait
:Emotion
:Goal
:Relationship

// Key relationship types
:PARTICIPATED_IN
:LOCATED_AT
:HAS_TRAIT
:FEELS
:KNOWS
:WANTS
:RELATED_TO
:PART_OF
```

Each node contains properties:
- `id`: Unique identifier
- `name`: Human-readable name
- `type`: Category of entity
- `properties`: JSON object with additional attributes
- `userId`: Owner of this knowledge
- `confidence`: Certainty level (0.0-1.0)
- `sourceIds`: Array of source references

### Weaviate Vector Schema

Main collections:
- `RawData`: Embeddings of raw data entries
- `SemanticChunk`: Embeddings of semantic chunks
- `Thought`: Embeddings of synthesized thoughts

## Knowledge Extraction Flow

![Data Flow](https://mermaid.ink/img/pako:eNqNVFFv0zAQ_itXnkpVtVLLJB4QQsPABkKTQGzqgyUfbdQ6duQ4FaXqf-dsJ2mb0q55iH3n793dd9-N78jo2gjSiFqaCnizdCq74G7tfmbvXCMM5d6f9dK1WU2bCtwfKGpDt0fd1wurlg3DGYOe3CxldaMY7gpGvmpS6hxaWexlVvQiIE-RcABr0ZJHkfazEe6z3EXROmdJ5NyjfhRO7g_iolbGVSrfFO-MXMEl-MeDXEGvoSOG1pI_lTnMoXPGPNFgHNjwCDdKt0wizjYcyDMU9xFhMXpXPTTGYH97X20IkMr1waYc25QDj4m-ynJQq9N1pi0xlPAIanUhWkKTrtSD01lctM6QFqVEOQrNmkbHnbJolck7LbGq3jnxCXoWcxbzapn9op3r0P0E7c6-pCgCGzRzj6Zsrh8jdeA-suHDKCvTOVhZRtgvnRWUIoY7LrBFv2t3cPY7e8Pfo8G7-IjwSybffsss4qqZVDhVp0NPVS8n7K_sFKQ4HJwuetBXlgxHR-KH2FpKVhlCcETv-9O11P2a-EnkLfBJ-3YIJBZZr3Kq_JdCY9fbmaoN6Y2qCeVBz9ddNm1oMjH0LlJTdR09K9KN1LwGD68jGcnAaFEdb23DSyHDl7dZ9Zde8TTRUzxr-rSo3cm5JPJbi4Z3Tg_yXrpe5kPLuTmVfeQT7Nb3-14SnzBkCY/4gxBh/5wK2FlEw5i4lzmPfQT2UBK7_ZwT6c8v4TjmOFqTAkzfZsjN3_wW_TP7aZs-dN_iMzIq34Qinbb_0gYGvjQlNilDknu4Gz4_Efh-OHJwQf6s_jMqVIH-wgFOKH7_AIZs-LU?type=png)

The process for extracting and storing knowledge follows these steps:

1. **Raw Data Capture**
   - User input via chat or file upload
   - Assigned unique ID, timestamp, session context

2. **Raw Data Processing**
   - Importance scoring (0.0-1.0)
   - Semantic chunking for longer content
   - Vector embedding generation

3. **Semantic Analysis**
   - Entity extraction (people, places, objects, etc.)
   - Relationship identification
   - Metadata enrichment

4. **Knowledge Storage**
   - Neo4j: Store entities and relationships
   - Weaviate: Store vector embeddings with metadata
   - PostgreSQL: Link everything together

5. **Thought Synthesis**
   - Extract high-level insights
   - Combine multiple raw data points
   - Create summarized "thoughts" about subjects

6. **Memory Augmentation**
   - Connect to conversation agent
   - Provide relevant context
   - Generate memory summaries

## Implementation Details

### Key Service Files

```
src/
  services/
    semanticMemoryService.js   # Core memory operations
    embeddingService.js        # Vector embedding logic
    neo4jService.js            # Knowledge graph operations
    weaviateService.js         # Vector database operations
    thoughtService.js          # Thought extraction logic
  memory/
    memoryBroker.js            # Event system for memory
```

### Core Memory Operations

```javascript
// Processing raw data
async function processRawData(userId, content, contentType, metadata) {
  // 1. Create raw data entry
  const rawData = await prisma.rawData.create({...});
  
  // 2. Calculate importance score
  const importanceScore = calculateImportanceScore(content);
  
  // 3. Generate chunks if content is long
  const chunks = createSemanticChunks(content);
  
  // 4. Process each chunk
  for (const chunk of chunks) {
    // Create chunk in database
    const semanticChunk = await prisma.semanticChunk.create({...});
    
    // Generate and store embedding
    await storeChunkEmbedding(userId, semanticChunk.id, chunk);
  }
  
  return { rawData, chunks };
}

// Creating a thought
async function createThought(userId, content, relatedChunkIds, metadata) {
  // 1. Generate embedding
  const vector = await generateEmbeddings(content);
  
  // 2. Create thought entry
  const thought = await prisma.thought.create({
    data: {
      content,
      title: metadata.title,
      subjectType: metadata.subjectType,
      subjectName: metadata.subjectName,
      confidence: metadata.confidence,
      // No direct vector storage
      user: { connect: { user_id: userId } },
      // Other relations
    }
  });
  
  // 3. Store in vector database
  await storeThoughtEmbedding(userId, thought.id, vector, content, metadata);
  
  return thought;
}

// Semantic search
async function semanticSearch(userId, query, options) {
  // 1. Generate query embedding
  const queryVector = await generateEmbeddings(query);
  
  // 2. Search in vector database
  const results = await weaviateService.semanticSearch(
    userId, queryVector, options
  );
  
  return results;
}
```

### Memory Broker System

The Memory Broker acts as an event system for memory operations:

```javascript
// Initialize memory broker
async function initialize() {
  console.log('[INFO] Initializing memory broker...');
  fs.ensureDirSync(EVENT_LOG_DIR);
  console.log('[INFO] Memory broker initialized successfully');
  return true;
}

// Notify when raw data is processed
async function notifyRawDataProcessing(data) {
  const eventData = {
    type: 'raw_data_processing',
    timestamp: new Date().toISOString(),
    ...data
  };
  
  await logMemoryEvent(eventData);
  return true;
}

// Notify when a new thought is created
async function notifyNewThought(data) {
  const eventData = {
    type: 'new_thought',
    timestamp: new Date().toISOString(),
    ...data
  };
  
  await logMemoryEvent(eventData);
  await updateMemoryProcessingMetrics(data.userId, {
    thoughtsCreated: 1
  });
  
  return true;
}
```

## API Reference

### Memory API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory/raw-data` | POST | Store new raw data |
| `/api/memory/search` | GET | Search semantic memory |
| `/api/memory/thoughts` | GET | Get user's thoughts |
| `/api/memory/thoughts` | POST | Create a new thought |
| `/api/memory/summary` | GET | Generate memory summary |
| `/api/memory/stats` | GET | Get memory usage statistics |
| `/api/interactions` | POST | Create interaction in memory |
| `/api/interactions/:id/process` | POST | Process an interaction |

### Key Service Functions

#### Semantic Memory Service

- `processRawData(userId, content, contentType, metadata)`: Process and store raw data
- `createSemanticChunks(content)`: Split content into semantic chunks
- `createThought(userId, content, relatedChunkIds, metadata)`: Create a thought
- `semanticSearch(userId, query, options)`: Search semantic memory
- `generateMemorySummary(userId, topic)`: Generate a summary on a topic
- `getUserMemoryStats(userId)`: Get memory usage statistics

#### Knowledge Graph Service

- `storeKnowledgeGraph(interactionId, extractedData)`: Store knowledge graph data
- `queryKnowledgeGraph(options)`: Query the knowledge graph
- `getEntityNeighborhood(entityName, depth)`: Get related entities
- `deleteByInteractionId(interactionId)`: Delete graph data for an interaction
- `queryEntitiesByName(namePattern, limit)`: Find entities by name

## Testing & Monitoring

### Integration Tests

Run integration tests to verify memory system functionality:

```bash
node scripts/test-memory-integration.js
```

This tests:
1. Raw data processing
2. Knowledge extraction
3. Thought creation
4. Semantic search
5. Memory summary generation
6. Memory statistics

### Monitoring

Memory events are logged to:
```
logs/memory_events/memory_events_YYYY-MM-DD.jsonl
```

Each event includes:
- Event type (raw_data_processing, semantic_chunk_creation, etc.)
- Timestamp
- User ID
- Content IDs
- Status information

### Health Metrics

Memory health metrics are stored in the MemoryMetrics model:
- Raw data processed count
- Chunks created count
- Thoughts processed count
- Thoughts created count
- Thoughts skipped count

## Troubleshooting

### Common Issues

1. **Vector Storage Errors**
   - Ensure Weaviate is running and accessible
   - Check vector dimensions match expectation (128/768/1536)
   - Verify proper schema initialization

2. **Knowledge Graph Issues**
   - Check Neo4j connection and credentials
   - Ensure proper node/relationship types
   - Look for missing properties in entity data

3. **Database Schema Mismatches**
   - Run `npx prisma db push` to sync schema
   - Check for migration conflicts
   - Verify field types match (especially UUID fields)

4. **Memory Processing Failures**
   - Check embedding service availability
   - Verify JSON format in interaction data
   - Look for missing user IDs or session IDs

### Debugging Steps

1. **Check service logs**
   ```bash
   # View memory event logs
   tail -f logs/memory_events/memory_events_*.jsonl
   ```

2. **Verify database state**
   ```bash
   # Open Prisma Studio
   npx prisma studio
   ```

3. **Test vector database**
   ```bash
   # Check if Weaviate is running
   curl http://localhost:8080/v1/.well-known/ready
   ```

4. **Test knowledge graph**
   ```bash
   # Run knowledge graph test
   node scripts/test-knowledge-graph.js
   ```

5. **Reset problematic components**
   ```bash
   # Reset vector collections
   node scripts/reset-weaviate-schema.js
   
   # Reset Neo4j database (caution: data loss)
   node scripts/reset-neo4j.js
   ```

### Logs to Check

1. **Application logs**: Terminal running `npm run dev`
2. **Memory events**: `logs/memory_events/memory_events_YYYY-MM-DD.jsonl`
3. **Neo4j logs**: Docker container logs for Neo4j
4. **Weaviate logs**: Docker container logs for Weaviate