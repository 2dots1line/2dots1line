# 🧠 **WEAVIATE DATABASE QUERY GUIDE - 2D1L**
*Complete instructions for querying and managing the Weaviate vector database*

---

## 📋 **OVERVIEW**

This guide covers all methods for querying from your Weaviate database running at `http://127.0.0.1:8080/v1`. Weaviate is used for semantic search, vector storage, and knowledge retrieval in the 2D1L system.

### **What Weaviate Stores**
- **UserKnowledgeItem**: Unified searchable items representing textual content
- **Vector embeddings**: 768-dimensional vectors for semantic similarity
- **Metadata**: User IDs, source types, importance scores, tags

### **Key Use Cases**
- Semantic search across user knowledge
- Hybrid search (semantic + keyword)
- Vector similarity queries
- Knowledge item retrieval and management

---

## 🚀 **QUICK START**

### **1. Verify Weaviate is Running**
```bash
# Health check
curl http://127.0.0.1:8080/v1/.well-known/ready

# Expected: {"status":"ok"}
```

### **2. Check Current Schema**
```bash
# View all classes
curl http://127.0.0.1:8080/v1/schema

# View UserKnowledgeItem properties
curl http://127.0.0.1:8080/v1/schema/UserKnowledgeItem
```

### **3. Basic Query Test**
```bash
# Get first 5 objects
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&limit=5"
```

### **4. Interactive Content Viewer (Recommended)**
```bash
# Use the configurable Weaviate viewer script
node scripts/GUIDES/view-weaviate-content.js --help

# View all content in readable format
node scripts/GUIDES/view-weaviate-content.js

# Filter by type and limit results
node scripts/GUIDES/view-weaviate-content.js --type Concept --limit 10 --format table
```

---

## 🔧 **QUERY METHODS**

### **Method 1: Using WeaviateService (Recommended)**

The `WeaviateService` class provides a clean abstraction over the raw Weaviate client.

#### **Setup**
```typescript
import { DatabaseService } from '@2dots1line/database';
import { WeaviateService } from '@2dots1line/database';

// Initialize
const dbService = new DatabaseService();
const weaviateService = new WeaviateService(dbService);
```

#### **1. Semantic Search (Vector-based)**
```typescript
// Search using embedding vectors
const results = await weaviateService.semanticSearch(
  queryVector, // number[] - 768D embedding vector
  userId,      // string - user identifier
  {
    limit: 10,           // Number of results
    threshold: 0.7,      // Similarity threshold (0.0-1.0)
    includeVector: false // Whether to return vectors
  }
);

console.log(`Found ${results.length} semantically similar items`);
```

#### **2. Hybrid Search (Semantic + Keyword)**
```typescript
// Combine semantic and keyword search
const results = await weaviateService.hybridSearch(
  queryText,   // string - search text
  queryVector, // number[] - embedding vector
  userId,      // string - user identifier
  {
    limit: 10,
    hybridSearch: { 
      alpha: 0.7  // Balance: 0.0 = keyword only, 1.0 = semantic only
    }
  }
);
```

#### **3. Keyword Search (BM25)**
```typescript
// Traditional keyword search
const results = await weaviateService.keywordSearch(
  query,       // string - search query
  userId,      // string - user identifier
  10           // limit
);
```

#### **4. Get User Knowledge Items**
```typescript
// Retrieve all items for a user
const items = await weaviateService.getUserKnowledgeItems(
  userId,      // string - user identifier
  100,         // limit
  0            // offset for pagination
);
```

### **Method 2: Direct Weaviate Client Usage**

For advanced queries or custom logic, use the Weaviate client directly.

#### **Setup**
```typescript
import { DatabaseService } from '@2dots1line/database';

const dbService = new DatabaseService();
const client = dbService.weaviate;
```

#### **1. GraphQL Query - Get All Items for a User**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId userId sourceEntityType textContent title createdAt')
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .withLimit(10)
  .do();

if (result?.data?.Get?.UserKnowledgeItem) {
  const items = result.data.Get.UserKnowledgeItem;
  console.log(`Found ${items.length} items for user`);
}
```

#### **2. Vector Search with Similarity**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId title _additional { distance }')
  .withNearVector({
    vector: queryVector,    // 768D vector
    certainty: 0.7         // Similarity threshold
  })
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .withLimit(5)
  .do();
```

#### **3. Hybrid Search with Custom Alpha**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId title _additional { distance }')
  .withHybrid({
    query: 'search text',
    alpha: 0.7,           // Balance between semantic/keyword
    vector: queryVector
  })
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .withLimit(5)
  .do();
```

#### **4. Complex Filtering with Multiple Conditions**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId sourceEntityType title importanceScore createdAt')
  .withWhere({
    operator: 'And',
    operands: [
      {
        path: ['userId'],
        operator: 'Equal',
        valueString: 'dev-user-123'
      },
      {
        path: ['sourceEntityType'],
        operator: 'Equal',
        valueString: 'memory_unit'
      },
      {
        path: ['importanceScore'],
        operator: 'GreaterThan',
        valueNumber: 0.5
      }
    ]
  })
  .withLimit(20)
  .do();
```

### **Method 3: REST API Queries (Direct HTTP)**

For quick testing or external tools, use the REST API directly.

#### **1. Health Check**
```bash
curl http://127.0.0.1:8080/v1/.well-known/ready
```

#### **2. Get Schema**
```bash
curl http://127.0.0.1:8080/v1/schema
```

#### **3. Get Objects with Filtering**
```bash
# Get all objects
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&limit=10"

# Get objects for specific user
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22userId%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22dev-user-123%22%7D&limit=10"
```

#### **4. GraphQL Query via REST**
```bash
curl -X POST "http://127.0.0.1:8080/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { UserKnowledgeItem(where: {path: [\"userId\"], operator: Equal, valueString: \"dev-user-123\"}, limit: 5) { externalId sourceEntityType title } } }"
  }'
```

---

## 🛠️ **CONFIGURABLE CONTENT VIEWER SCRIPT**

The `view-weaviate-content.js` script provides an interactive, configurable way to explore your Weaviate database content without writing custom queries.

### **Script Location**
```bash
scripts/GUIDES/view-weaviate-content.js
```

### **Usage**
```bash
node scripts/GUIDES/view-weaviate-content.js [options]
```

### **Available Options**
| Option | Description | Example |
|--------|-------------|---------|
| `--user-id <id>` | Filter by specific user ID | `--user-id dev-user-123` |
| `--type <type>` | Filter by source entity type | `--type Concept` |
| `--after <date>` | Filter objects created after date | `--after 2025-08-20` |
| `--before <date>` | Filter objects created before date | `--before 2025-08-23` |
| `--limit <number>` | Limit number of results | `--limit 50` |
| `--content-length <n>` | Truncate content to N characters | `--content-length 300` |
| `--format <format>` | Output format: table, list, json | `--format table` |
| `--help` | Show help message | `--help` |

### **Output Formats**

#### **1. List Format (Default)**
```bash
node scripts/GUIDES/view-weaviate-content.js --type MemoryUnit --limit 5
```
**Output**: Human-readable list with titles, types, users, dates, and content previews.

#### **2. Table Format (Most Readable)**
```bash
node scripts/GUIDES/view-weaviate-content.js --format table --limit 10
```
**Output**: Organized table with columns for ID, Title, Type, User, Created, and Content Preview.

#### **3. JSON Format (Programmatic)**
```bash
node scripts/GUIDES/view-weaviate-content.js --format json --limit 5
```
**Output**: Structured JSON for use in scripts or APIs.

### **Practical Examples**

#### **Example 1: View All Concepts for a User**
```bash
node scripts/GUIDES/view-weaviate-content.js \
  --user-id dev-user-123 \
  --type Concept \
  --format table \
  --content-length 200
```

#### **Example 2: Recent Memory Units**
```bash
node scripts/GUIDES/view-weaviate-content.js \
  --after 2025-08-20 \
  --type MemoryUnit \
  --limit 20 \
  --format list
```

#### **Example 3: Specific Date Range Analysis**
```bash
node scripts/GUIDES/view-weaviate-content.js \
  --after 2025-08-19 \
  --before 2025-08-22 \
  --format table \
  --limit 50
```

#### **Example 4: Quick Overview**
```bash
# Get just 10 items in table format
node scripts/GUIDES/view-weaviate-content.js --limit 10 --format table

# Get all items for a specific type
node scripts/GUIDES/view-weaviate-content.js --type DerivedArtifact --format list
```

### **Script Features**
- **Automatic Pagination**: Fetches all available data using Weaviate's pagination
- **Smart Filtering**: Combines multiple filters with AND logic
- **Progress Tracking**: Shows fetching progress for large datasets
- **Error Handling**: Graceful fallbacks and helpful error messages
- **Configurable Display**: Adjust content length and output format

### **When to Use the Script vs. Custom Queries**
- **Use the Script For**: Quick exploration, data overview, debugging, content verification
- **Use Custom Queries For**: Programmatic access, specific business logic, integration with other systems

---

## 🎯 **PRACTICAL QUERY EXAMPLES**

### **Example 1: Find All Knowledge Items for a User**
```typescript
const items = await weaviateService.getUserKnowledgeItems('dev-user-123', 50);
console.log(`Found ${items.length} knowledge items for user`);

// Display summary
items.forEach(item => {
  console.log(`- ${item.title} (${item.sourceEntityType})`);
});
```

### **Example 2: Semantic Search for Related Content**
```typescript
// First, generate an embedding vector for your query
const queryText = "autism research";
const queryVector = await generateEmbedding(queryText); // You'll need an embedding service

const results = await weaviateService.semanticSearch(
  queryVector,
  'dev-user-123',
  { limit: 5, threshold: 0.6 }
);

console.log(`Found ${results.length} semantically similar items`);
results.forEach(result => {
  console.log(`- ${result.title} (similarity: ${result._additional?.distance})`);
});
```

### **Example 3: Keyword Search for Specific Terms**
```typescript
const results = await weaviateService.keywordSearch(
  "Columbia University research",
  'dev-user-123',
  10
);

console.log(`Found ${results.length} keyword matches`);
```

### **Example 4: Complex Filtering with GraphQL**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId sourceEntityType title importanceScore createdAt')
  .withWhere({
    operator: 'And',
    operands: [
      {
        path: ['userId'],
        operator: 'Equal',
        valueString: 'dev-user-123'
      },
      {
        path: ['sourceEntityType'],
        operator: 'Equal',
        valueString: 'memory_unit'
      },
      {
        path: ['importanceScore'],
        operator: 'GreaterThan',
        valueNumber: 0.5
      }
    ]
  })
  .withLimit(20)
  .do();
```

---

## 📊 **DATA MANAGEMENT OPERATIONS**

### **Inserting Knowledge Items**
```typescript
const items = [
  {
    id: 'item-1',
    externalId: 'ext-1',
    userId: 'dev-user-123',
    sourceEntityType: 'memory_unit',
    sourceEntityId: 'mu-001',
    textContent: 'Content about neural networks...',
    title: 'Introduction to Neural Networks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vector: [0.1, 0.2, 0.3, ...] // 768D vector
  }
];

await weaviateService.upsertKnowledgeItems(items);
console.log('Items inserted successfully');
```

### **Updating Knowledge Items**
```typescript
// Weaviate automatically handles updates when using upsert
// Just call upsertKnowledgeItems with the same ID and new data
const updatedItem = {
  ...existingItem,
  textContent: 'Updated content...',
  updatedAt: new Date().toISOString()
};

await weaviateService.upsertKnowledgeItems([updatedItem]);
```

### **Deleting Knowledge Items**
```typescript
const itemIds = ['item-1', 'item-2'];
await weaviateService.deleteKnowledgeItems(itemIds);
console.log('Items deleted successfully');
```

### **Getting Items by IDs**
```typescript
const itemIds = ['item-1', 'item-2'];
const items = await weaviateService.getKnowledgeItemsByIds(itemIds, true); // include vectors
console.log(`Retrieved ${items.length} items`);
```

---

## 🔍 **ADVANCED QUERY PATTERNS**

### **1. Pagination with Offset**
```typescript
const pageSize = 20;
const page = 2;
const offset = (page - 1) * pageSize;

const items = await weaviateService.getUserKnowledgeItems(
  'dev-user-123',
  pageSize,
  offset
);
```

### **2. Sorting by Importance Score**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId title importanceScore')
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .withLimit(10)
  .do();

// Sort by importance score (descending)
const sortedItems = result.data.Get.UserKnowledgeItem.sort(
  (a, b) => (b.importanceScore || 0) - (a.importanceScore || 0)
);
```

### **3. Aggregation Queries**
```typescript
// Count items by source type
const result = await client.graphql.aggregate()
  .withClassName('UserKnowledgeItem')
  .withFields('sourceEntityType { count }')
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .do();

console.log('Items by source type:', result.data.Aggregate.UserKnowledgeItem);
```

### **4. Text Search with Multiple Fields**
```typescript
const result = await client.graphql.get()
  .withClassName('UserKnowledgeItem')
  .withFields('externalId title textContent')
  .withBm25({
    query: 'research Columbia',
    properties: ['textContent', 'title']
  })
  .withWhere({
    path: ['userId'],
    operator: 'Equal',
    valueString: 'dev-user-123'
  })
  .withLimit(10)
  .do();
```

---

## 🧪 **TESTING YOUR QUERIES**

### **1. Test Weaviate Connection**
```bash
# Test basic connectivity
curl -f http://127.0.0.1:8080/v1/.well-known/ready

# Test schema access
curl -f http://127.0.0.1:8080/v1/schema
```

### **2. Test Data Retrieval**
```bash
# Check if you have data
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&limit=5"

# Test user-specific query
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22userId%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22dev-user-123%22%7D&limit=5"
```

### **3. Test GraphQL Queries**
```bash
# Simple GraphQL query
curl -X POST "http://127.0.0.1:8080/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { UserKnowledgeItem(limit: 3) { externalId title } } }"
  }'
```

### **4. Test with Node.js Script**
```typescript
// test-weaviate.js
import { DatabaseService } from '@2dots1line/database';
import { WeaviateService } from '@2dots1line/database';

async function testWeaviate() {
  try {
    const dbService = new DatabaseService();
    const weaviateService = new WeaviateService(dbService);
    
    // Test basic operations
    const items = await weaviateService.getUserKnowledgeItems('dev-user-123', 5);
    console.log(`Found ${items.length} items`);
    
    // Test health check
    const isHealthy = await weaviateService.healthCheck();
    console.log(`Weaviate healthy: ${isHealthy}`);
    
  } catch (error) {
    console.error('Weaviate test failed:', error);
  }
}

testWeaviate();
```

### **5. Test with Content Viewer Script**
```bash
# Test basic functionality
node scripts/GUIDES/view-weaviate-content.js --limit 5

# Test filtering
node scripts/GUIDES/view-weaviate-content.js --type Concept --limit 3 --format table

# Test date filtering
node scripts/GUIDES/view-weaviate-content.js --after 2025-08-20 --limit 5

# Test JSON output for programmatic use
node scripts/GUIDES/view-weaviate-content.js --format json --limit 3 | jq '.'
```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Issue 1: Connection Refused**
```bash
# Error: ECONNREFUSED
curl: (7) Failed to connect to 127.0.0.1 port 8080: Connection refused
```

**Solutions:**
```bash
# 1. Check if Weaviate container is running
docker ps | grep weaviate

# 2. Start Weaviate if stopped
docker-compose -f docker-compose.dev.yml up -d weaviate

# 3. Wait for startup (60 seconds)
sleep 60

# 4. Test connection
curl http://127.0.0.1:8080/v1/.well-known/ready
```

### **Issue 2: Schema Not Found**
```bash
# Error: Class UserKnowledgeItem not found
```

**Solutions:**
```bash
# 1. Check current schema
curl http://127.0.0.1:8080/v1/schema

# 2. Apply schema if missing
curl -X POST "http://127.0.0.1:8080/v1/schema" \
  -H "Content-Type: application/json" \
  -d @packages/database/schemas/weaviate.json

# 3. Or use the schema application script
cd packages/database && pnpm run apply-schemas
```

### **Issue 3: Authentication Errors**
```bash
# Error: 401 Unauthorized
```

**Solutions:**
```bash
# 1. Check Weaviate configuration
docker exec weaviate-2d1l env | grep AUTHENTICATION

# 2. Verify anonymous access is enabled
# Should show: AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true

# 3. Restart Weaviate if needed
docker-compose -f docker-compose.dev.yml restart weaviate
```

### **Issue 4: Vector Dimension Mismatch**
```bash
# Error: Vector dimension mismatch
```

**Solutions:**
```bash
# 1. Check expected vector dimensions
curl http://127.0.0.1:8080/v1/schema/UserKnowledgeItem

# 2. Ensure your vectors are 768-dimensional
# 3. Regenerate vectors if needed
```

### **Issue 5: Performance Issues**
```bash
# Queries taking too long
```

**Solutions:**
```bash
# 1. Check Weaviate logs
docker logs weaviate-2d1l --tail 50

# 2. Verify indexes are created
curl http://127.0.0.1:8080/v1/schema/UserKnowledgeItem

# 3. Check resource usage
docker stats weaviate-2d1l
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **1. Batch Operations**
```typescript
// Use batch operations for multiple items
const items = [/* large array of items */];
await weaviateService.upsertKnowledgeItems(items); // Handles batching automatically
```

### **2. Efficient Field Selection**
```typescript
// Only request needed fields
.withFields('externalId title importanceScore') // Minimal fields
// vs
.withFields('*') // All fields (slower)
```

### **3. Proper Pagination**
```typescript
// Use offset-based pagination for large datasets
const pageSize = 100;
for (let offset = 0; offset < totalItems; offset += pageSize) {
  const items = await weaviateService.getUserKnowledgeItems(userId, pageSize, offset);
  // Process items
}
```

### **4. Vector Caching**
```typescript
// Cache generated embeddings to avoid regenerating
const embeddingCache = new Map();

async function getCachedEmbedding(text: string): Promise<number[]> {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text);
  }
  
  const vector = await generateEmbedding(text);
  embeddingCache.set(text, vector);
  return vector;
}
```

---

## 🔧 **MONITORING & MAINTENANCE**

### **1. Health Monitoring**
```bash
# Daily health check
curl -f http://127.0.0.1:8080/v1/.well-known/ready || echo "Weaviate down"

# Check container status
docker ps | grep weaviate

# Monitor logs
docker logs weaviate-2d1l --tail 20
```

### **2. Performance Monitoring**
```bash
# Check query performance
curl -X POST "http://127.0.0.1:8080/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ Get { UserKnowledgeItem(limit: 1) { externalId } } }"
  }' -w "Response time: %{time_total}s\n"
```

### **3. Data Maintenance**
```bash
# Check data size
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults'

# Clean up old data if needed
# (Implement cleanup logic based on your requirements)
```

---

## 📚 **RELATED DOCUMENTATION**

### **Code References**
- **WeaviateService**: `packages/database/src/services/WeaviateService.ts`
- **DatabaseService**: `packages/database/src/DatabaseService.ts`
- **Schema**: `packages/database/schemas/weaviate.json`
- **Content Viewer Script**: `scripts/GUIDES/view-weaviate-content.js`

### **Configuration Files**
- **Docker Compose**: `docker-compose.dev.yml`
- **Environment**: `.env` file
- **Schema Application**: `packages/database/scripts/apply-schemas.ts`

### **Related Guides**
- **Database Setup**: `scripts/GUIDES/INSTALLATION_GUIDE.md`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`
- **Daily Workflow**: `scripts/GUIDES/DAILY_WORKFLOW.md`

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Essential Commands**
```bash
# Health check
curl http://127.0.0.1:8080/v1/.well-known/ready

# Get schema
curl http://127.0.0.1:8080/v1/schema

# Get objects
curl "http://127.0.0.1:8080/v1/objects?class=UserKnowledgeItem&limit=5"

# GraphQL query
curl -X POST "http://127.0.0.1:8080/v1/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ Get { UserKnowledgeItem(limit: 3) { externalId title } } }"}'
```

### **Content Viewer Script Commands**
```bash
# View all content (readable format)
node scripts/GUIDES/view-weaviate-content.js

# Quick overview with table format
node scripts/GUIDES/view-weaviate-content.js --format table --limit 10

# Filter by type
node scripts/GUIDES/view-weaviate-content.js --type Concept --limit 20

# Date range filtering
node scripts/GUIDES/view-weaviate-content.js --after 2025-08-20 --type MemoryUnit

# JSON output for scripts
node scripts/GUIDES/view-weaviate-content.js --format json --limit 5
```

### **Troubleshooting Commands**
```bash
# Check container status
docker ps | grep weaviate

# View logs
docker logs weaviate-2d1l --tail 50

# Restart service
docker-compose -f docker-compose.dev.yml restart weaviate

# Apply schema
cd packages/database && pnpm run apply-schemas
```

---

## 🆘 **GETTING HELP**

### **If This Guide Doesn't Help**
1. **Check the troubleshooting section** above
2. **Review Weaviate logs**: `docker logs weaviate-2d1l --tail 100`
3. **Check system health**: `pnpm health:check`
4. **Refer to emergency procedures**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

### **Common Support Questions**
- **Q**: "Connection refused" → Check if Weaviate container is running
- **Q**: "Class not found" → Apply the schema using the provided script
- **Q**: "Vector dimension mismatch" → Ensure vectors are 768-dimensional
- **Q**: "Slow queries" → Check indexes and use proper field selection

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Weaviate Version**: 1.26.0  
**Default Port**: 8080

---

*This guide provides comprehensive coverage of Weaviate querying in the 2D1L system. For advanced use cases or specific requirements, refer to the WeaviateService implementation or the official Weaviate documentation.*

