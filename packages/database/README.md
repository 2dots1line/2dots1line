# @2dots1line/database

Database access layer for 2dots1line V4 that provides client wrappers for PostgreSQL (via Prisma), Neo4j, Weaviate, and Redis.

## Features

- **Singleton client patterns** for consistent database access
- **Connection management** with automatic retries
- **Telemetry** for query monitoring and performance tracking
- **Health checks** for all database connections
- **Error handling** and graceful degradation
- **Circuit breaking** for preventing cascade failures
- **Type safety** with TypeScript interfaces

## Installation

```bash
npm install @2dots1line/database
```

## Usage

### Initialize all databases

```typescript
import { initializeDatabases } from '@2dots1line/database';

// Initialize with default config (from environment variables)
await initializeDatabases();

// Or with custom configuration
await initializeDatabases({
  prisma: {
    url: 'postgresql://user:password@localhost:5432/mydb',
  },
  neo4j: {
    uri: 'bolt://localhost:7687',
    username: 'neo4j',
    password: 'password',
    database: 'mydatabase',
  },
  weaviate: {
    scheme: 'http',
    host: 'localhost:8080',
  },
  redis: {
    host: 'localhost',
    port: 6379,
  },
});
```

### PostgreSQL (via Prisma)

```typescript
import { prisma } from '@2dots1line/database';

// Use Prisma client as usual
const users = await prisma.users.findMany();

// Disconnect when done
import { disconnectPrisma } from '@2dots1line/database';
await disconnectPrisma();

// Health check
import { prismaHealthCheck } from '@2dots1line/database';
const health = await prismaHealthCheck();
console.log(health);
```

### Neo4j

```typescript
import { neo4jDriver, recordToObject } from '@2dots1line/database';

// Execute a read query
const result = await neo4jDriver.executeRead(
  'MATCH (u:User {userId: $userId}) RETURN u',
  { userId: '123' }
);

// Convert Neo4j records to plain objects
const users = result.records.map(record => recordToObject(record));

// Execute a write query
await neo4jDriver.executeWrite(
  'CREATE (n:Concept {name: $name, type: $type})',
  { name: 'Patience', type: 'value' }
);
```

### Weaviate

```typescript
import { weaviateClient } from '@2dots1line/database';

// Perform a vector search
const results = await weaviateClient.vectorSearch(
  'ChunkEmbeddings', 
  vectorQuery, // Your vector array
  {
    limit: 10,
    fields: ['cid', 'text_preview', 'creation_ts'],
    withDistance: true,
  }
);

// Create a schema class
await weaviateClient.createSchemaClass({
  class: 'ConceptEmbeddings',
  properties: [
    { name: 'concept_id', dataType: ['string'] },
    { name: 'name', dataType: ['string'] },
    { name: 'type', dataType: ['string'] },
  ],
});

// Batch import objects
await weaviateClient.batchImport(
  'ChunkEmbeddings',
  objectsWithVectors,
  { batchSize: 100 }
);
```

### Redis

```typescript
import { redisClient, TTL } from '@2dots1line/database';

// Cache a value
await redisClient.set('my-key', { data: 'my-value' }, { ttl: TTL.MEDIUM });

// Retrieve a value
const value = await redisClient.get('my-key');

// Implement rate limiting
const rateLimitResult = await redisClient.rateLimit('user:123:api', {
  maxRequests: 100,
  windowSizeInSeconds: 60,
});

if (rateLimitResult.allowed) {
  // Handle the request
} else {
  // Return rate limit error
}

// Use distributed lock
const lockToken = await redisClient.acquireLock('my-resource', 30000);
if (lockToken) {
  try {
    // Perform exclusive operation
  } finally {
    await redisClient.releaseLock('my-resource', lockToken);
  }
}
```

## Health Checks

```typescript
import { checkDatabasesHealth } from '@2dots1line/database';

// Check the health of all database connections
const healthStatus = await checkDatabasesHealth();
console.log(healthStatus);
```

## Graceful Shutdown

```typescript
import { closeDatabases } from '@2dots1line/database';

// Close all database connections
await closeDatabases();
```

## Environment Variables

The package uses the following environment variables for configuration:

### PostgreSQL (Prisma)
- `DATABASE_URL`: PostgreSQL connection string
- `PRISMA_LOG_LEVEL`: Log level for Prisma (info, query, warn, error)

### Neo4j
- `NEO4J_URI`: Neo4j server URI
- `NEO4J_USERNAME`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `NEO4J_DATABASE`: Neo4j database name

### Weaviate
- `WEAVIATE_SCHEME`: Weaviate connection scheme (http or https)
- `WEAVIATE_HOST`: Weaviate host and port
- `WEAVIATE_API_KEY`: Weaviate API key (if required)

### Redis
- `REDIS_URI`: Redis connection URI
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_PASSWORD`: Redis password
- `REDIS_DB`: Redis database number
- `REDIS_KEY_PREFIX`: Prefix for Redis keys
- `REDIS_CLUSTER_NODES`: Comma-separated list of cluster nodes (host:port)

## Database Schema Setup

### PostgreSQL (Prisma)
Prisma migrations are automatically applied. The schema is defined in `apps/backend-api/prisma/schema.prisma`.

### Neo4j Schema (S2.T4)
Apply the Neo4j constraints and indexes using the provided schema file:

**Method 1: Neo4j Browser**
1. Open Neo4j Browser at http://localhost:7474
2. Connect with credentials (neo4j/password123)
3. Copy and execute statements from `src/neo4j/schema.cypher`

**Method 2: Cypher Shell**
```bash
cypher-shell -u neo4j -p password123 < packages/database/src/neo4j/schema.cypher
```

**Method 3: Programmatic Application**
```javascript
import { DatabaseService } from '@2dots1line/database';

const db = new DatabaseService();
const neo4j = db.neo4j;

// Execute schema creation
const session = neo4j.session();
// ... execute Cypher statements from schema.cypher
```

**Verification:**
```cypher
// In Neo4j Browser, verify schema was applied:
:schema
SHOW CONSTRAINTS
SHOW INDEXES
```

### Weaviate Schema (S2.T5)
Apply the Weaviate class definitions using the provided schema file:

**Method 1: Using Weaviate Client**
```javascript
import weaviate from 'weaviate-ts-client';
import schema from './src/weaviate/schema.json';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

// Apply schema
for (const classObj of schema.classes) {
  await client.schema.classCreator().withClass(classObj).do();
}
```

**Method 2: Using curl**
```bash
# Apply each class from schema.json
curl -X POST \
  http://localhost:8080/v1/schema \
  -H 'Content-Type: application/json' \
  -d @packages/database/src/weaviate/schema.json
```

**Method 3: Using DatabaseService**
```javascript
import { DatabaseService } from '@2dots1line/database';

const db = new DatabaseService();
const weaviate = db.weaviate;

// Apply schema programmatically
// (Implementation would read schema.json and apply classes)
```

**Verification:**
```bash
# Check if classes were created
curl http://localhost:8080/v1/schema

# Or in JavaScript
const schema = await client.schema.getter().do();
console.log(schema.classes);
```

## Usage Examples

### Basic Usage
```javascript
import { DatabaseService, UserRepository } from '@2dots1line/database';

const db = new DatabaseService();
await db.testConnections();

const userRepo = new UserRepository(db);
const user = await userRepo.createUser({
  email: 'test@example.com',
  name: 'Test User',
  region: 'us'
});
```

### Repository Pattern
```javascript
import { MemoryRepository, ConceptRepository } from '@2dots1line/database';

const memoryRepo = new MemoryRepository(db);
const conceptRepo = new ConceptRepository(db);

// Create a memory unit
const memory = await memoryRepo.createMemoryUnit({
  userId: user.user_id,
  title: 'My Journal Entry',
  content: 'Today I learned about graph databases...',
  sourceType: 'journal_entry'
});

// Extract and create concepts
const concept = await conceptRepo.createOrFindConcept({
  userId: user.user_id,
  name: 'Graph Databases',
  type: 'technology'
});
```

## Configuration

The `DatabaseService` class supports the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEO4J_URI`: Neo4j bolt connection URI  
- `NEO4J_USERNAME`: Neo4j username (default: neo4j)
- `NEO4J_PASSWORD`: Neo4j password
- `WEAVIATE_HOST`: Weaviate instance URL
- `REDIS_URL`: Redis connection string (optional)

## Development

### Running Tests
```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Building
```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode during development
```

### Database Operations
```bash
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Apply migrations
``` 