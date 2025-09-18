# Database Query Guide for 2D1L Agents

This guide provides quick and correct methods to query all three databases in the 2D1L system.

## Overview

The 2D1L system uses three databases:
- **PostgreSQL**: Relational database for core entities (concepts, memory_units, growth_events, etc.)
- **Weaviate**: Vector database for semantic search and embeddings
- **Neo4j**: Graph database for relationships between entities

## PostgreSQL Queries

### Connection
```bash
# Using Docker (RECOMMENDED - works with your setup)
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line

# Using psql command line (if not using Docker)
psql -h localhost -p 5433 -U danniwang -d twodots1line
```

### Key Tables and Quick Queries

#### Concepts Table
```sql
-- Count all concepts
SELECT COUNT(*) FROM concepts;

-- Count active concepts only
SELECT COUNT(*) FROM concepts WHERE status = 'active';

-- Get concepts with descriptions
SELECT concept_id, name, description, status FROM concepts WHERE description IS NOT NULL LIMIT 10;

-- Find merged concepts
SELECT concept_id, name, merged_into_concept_id FROM concepts WHERE merged_into_concept_id IS NOT NULL;
```

#### Memory Units Table
```sql
-- Count all memory units
SELECT COUNT(*) FROM memory_units;

-- Get recent memory units
SELECT muid, title, content, creation_ts FROM memory_units ORDER BY creation_ts DESC LIMIT 10;

-- Memory units by user
SELECT COUNT(*) FROM memory_units WHERE user_id = 'dev-user-123';
```

#### Growth Events Table
```sql
-- Count growth events
SELECT COUNT(*) FROM growth_events;

-- Get growth events by dimension
SELECT event_id, dimension, description FROM growth_events WHERE dimension = 'know_self' LIMIT 5;
```

### Common Patterns
```sql
-- Check entity counts by user
SELECT 
  'concepts' as entity_type, COUNT(*) as count FROM concepts WHERE user_id = 'dev-user-123'
UNION ALL
SELECT 
  'memory_units' as entity_type, COUNT(*) as count FROM memory_units WHERE user_id = 'dev-user-123'
UNION ALL
SELECT 
  'growth_events' as entity_type, COUNT(*) as count FROM growth_events WHERE user_id = 'dev-user-123';
```

## Weaviate Queries

### Connection
```bash
# Weaviate runs on localhost:8080
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=10"
```

### Key Query Patterns

#### Get Total Count
```bash
# Get total number of entities (IMPORTANT: Use limit=1000 to avoid pagination issues)
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects | length'
```

#### Count by Entity Type
```bash
# Count entities by sourceEntityType
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects[] | .properties.sourceEntityType' | sort | uniq -c
```

#### Filter by Entity Type
```bash
# Get all MemoryUnit entities
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22sourceEntityType%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22MemoryUnit%22%7D" | jq '.objects[] | {weaviateId: .id, sourceEntityId: .properties.sourceEntityId, textContent: .properties.textContent}'

# Get all Concept entities
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22sourceEntityType%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22Concept%22%7D" | jq '.objects[] | {weaviateId: .id, sourceEntityId: .properties.sourceEntityId, textContent: .properties.textContent}'
```

#### Filter by User
```bash
# Get entities for specific user
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22userId%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22dev-user-123%22%7D" | jq '.objects | length'
```

#### Check Status Field
```bash
# Check which entities have status field
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects[] | select(.properties.status != null) | .properties.status' | sort | uniq -c

# Check entities with null status
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects[] | select(.properties.status == null) | .properties.sourceEntityType' | sort | uniq -c
```

### Important Notes
- **Always use `limit=1000`** to avoid pagination issues
- **URL encoding**: Use `%7B` for `{`, `%22` for `"`, `%5B` for `[`, `%5D` for `]`
- **Status filtering**: Memory units don't have status in PostgreSQL, so don't filter by status for MemoryUnit queries
- **Concepts**: Filter by `status: 'active'` to exclude merged concepts

## Neo4j Queries

### Connection
```bash
# Using Docker (RECOMMENDED - works with your setup)
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123

# Using cypher-shell (if not using Docker)
cypher-shell -u neo4j -p password123

# Using curl
curl -X POST "http://localhost:7475/db/data/transaction/commit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic bmVvNGo6cGFzc3dvcmQxMjM=" \
  -d '{"statements": [{"statement": "MATCH (n) RETURN count(n) as total_nodes"}]}'
```

### Key Query Patterns

#### Count Nodes
```cypher
// Count all nodes
MATCH (n) RETURN count(n) as total_nodes;

// Count by label
MATCH (n) RETURN labels(n) as label, count(n) as count ORDER BY count DESC;
```

#### Count Relationships
```cypher
// Count all relationships
MATCH ()-[r]->() RETURN count(r) as total_relationships;

// Count by relationship type
MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count ORDER BY count DESC;
```

#### User-Specific Queries
```cypher
// Find all nodes for a specific user
MATCH (n {userId: 'dev-user-123'}) RETURN labels(n) as label, count(n) as count;

// Find relationships for a specific user
MATCH (n {userId: 'dev-user-123'})-[r]->(m {userId: 'dev-user-123'}) 
RETURN type(r) as rel_type, count(r) as count;
```

#### Entity Type Queries
```cypher
// Find concepts
MATCH (c:Concept {userId: 'dev-user-123'}) RETURN count(c) as concept_count;

// Find memory units
MATCH (m:MemoryUnit {userId: 'dev-user-123'}) RETURN count(m) as memory_unit_count;

// Find growth events
MATCH (g:GrowthEvent {userId: 'dev-user-123'}) RETURN count(g) as growth_event_count;
```

## Cross-Database Validation

### Verify Data Consistency
```bash
#!/bin/bash
# Script to check entity counts across all databases

echo "=== PostgreSQL Counts ==="
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  'concepts' as entity_type, COUNT(*) as count FROM concepts WHERE user_id = 'dev-user-123'
UNION ALL
SELECT 
  'memory_units' as entity_type, COUNT(*) as count FROM memory_units WHERE user_id = 'dev-user-123'
UNION ALL
SELECT 
  'growth_events' as entity_type, COUNT(*) as count FROM growth_events WHERE user_id = 'dev-user-123';
"

echo -e "\n=== Weaviate Counts ==="
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&where=%7B%22path%22%3A%5B%22userId%22%5D%2C%22operator%22%3A%22Equal%22%2C%22valueString%22%3A%22dev-user-123%22%7D&limit=1000" | jq '.objects[] | .properties.sourceEntityType' | sort | uniq -c

echo -e "\n=== Neo4j Counts ==="
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n {userId: 'dev-user-123'}) RETURN labels(n) as label, count(n) as count ORDER BY count DESC;"
```

## Working Examples from Your Setup

### PostgreSQL Examples (Working Commands)
```bash
# Get specific entities by ID
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 'memory_units' as table_name, muid as id, title, content 
FROM memory_units WHERE muid = '5de43f0a-00bc-4a6b-96eb-eef8b2230020' 
UNION ALL 
SELECT 'concepts' as table_name, concept_id as id, name as title, description as content 
FROM concepts WHERE concept_id IN ('e375f554-7cec-459c-9081-bb795366163e', '5ca94481-a9f4-4c4e-9471-de1d8f08230e');"

# Get cards with entity details
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT c.*, mu.title as memory_title, mu.content as memory_content, 
       co.name as concept_name, co.description as concept_description 
FROM cards c 
LEFT JOIN memory_units mu ON c.source_entity_id = mu.muid 
LEFT JOIN concepts co ON c.source_entity_id = co.concept_id 
WHERE c.source_entity_id = 'f06abd49-ce97-4ae1-9758-a12ececb92c7';"
```

### Neo4j Examples (Working Commands)
```bash
# Get specific entities by ID
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n) WHERE n.id IN ['5de43f0a-00bc-4a6b-96eb-eef8b2230020', 'e375f554-7cec-459c-9081-bb795366163e', '5ca94481-a9f4-4c4e-9471-de1d8f08230e', 'cbb6a73f-924f-4afa-8509-ce6394946076', '63b5f80f-5224-432f-b2ea-21ec6f927415'] 
RETURN labels(n)[0] as type, n.id as id, n.name as name, n.title as title;"
```

### Weaviate Examples (Working Commands)
```bash
# Get recent entities from specific date
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=200" | jq '.objects[] | select(.properties.createdAt | startswith("2025-08-26")) | {weaviateId: .id, sourceEntityId: .properties.sourceEntityId, createdAt: .properties.createdAt, title: .properties.title}'

# Get all UserMemory entities (legacy schema)
curl -s "http://localhost:8080/v1/objects?class=UserMemory&limit=500" | jq '.objects[] | {id: .id, properties: .properties}'
```

## Common Issues and Solutions

### 1. Weaviate Pagination
**Problem**: Getting only 25 results instead of all
**Solution**: Always use `limit=1000` parameter

### 2. Status Filtering
**Problem**: Memory units not found due to status filtering
**Solution**: Don't filter by status for MemoryUnit entities (they don't have status in PostgreSQL)

### 3. URL Encoding
**Problem**: Complex WHERE clauses fail
**Solution**: Use proper URL encoding or online URL encoders

### 4. Entity Type Mismatches
**Problem**: Different entity types between databases
**Solution**: Check the mapping:
- PostgreSQL: `concepts`, `memory_units`, `growth_events`
- Weaviate: `Concept`, `MemoryUnit`, `GrowthEvent`
- Neo4j: `Concept`, `MemoryUnit`, `GrowthEvent`

## Quick Reference Commands

```bash
# PostgreSQL - Count all entities (Docker)
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT 'concepts' as type, COUNT(*) FROM concepts UNION ALL SELECT 'memory_units', COUNT(*) FROM memory_units UNION ALL SELECT 'growth_events', COUNT(*) FROM growth_events;"

# PostgreSQL - Count all entities (Direct)
psql -h localhost -p 5433 -U danniwang -d twodots1line -c "SELECT 'concepts' as type, COUNT(*) FROM concepts UNION ALL SELECT 'memory_units', COUNT(*) FROM memory_units UNION ALL SELECT 'growth_events', COUNT(*) FROM growth_events;"

# Weaviate - Count all entities
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects | length'

# Weaviate - Count by type
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq '.objects[] | .properties.sourceEntityType' | sort | uniq -c

# Neo4j - Count all nodes (Docker)
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n) as total_nodes;"

# Neo4j - Count all nodes (Direct)
cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n) as total_nodes;"

# Neo4j - Count by label (Docker)
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN labels(n) as label, count(n) as count ORDER BY count DESC;"
```

## Troubleshooting

### Check if services are running
```bash
# PostgreSQL (Docker)
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line

# PostgreSQL (Direct)
pg_isready -h localhost -p 5433

# Weaviate
curl -s "http://localhost:8080/v1/meta" | jq '.version'

# Neo4j (Docker)
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "RETURN 'Neo4j is running' as status;"

# Neo4j (Direct)
curl -s "http://localhost:7475/db/data/" | jq '.neo4j_version'
```

### Check logs
```bash
# Ingestion worker logs
tail -f logs/ingestion-worker-out-1.log

# Insight worker logs  
tail -f logs/insight-worker-out-2.log

# Embedding worker logs
tail -f logs/embedding-worker-out-3.log
```

---

**Remember**: Always use `limit=1000` for Weaviate queries to avoid pagination issues, and don't filter MemoryUnit entities by status since they don't have a status field in PostgreSQL.
