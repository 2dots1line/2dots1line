# Data Consistency Check Guide

This guide provides simple Docker commands to verify data consistency across PostgreSQL, Neo4j, and Weaviate databases.

## Prerequisites

- Docker containers running: `postgres-2d1l`, `neo4j-2d1l`, `weaviate-2d1l`
- Environment variables loaded (check `.env` file for credentials)

## Quick Reference: 3 Definitive Commands

For any entity, use these 3 commands to get the definitive answer across all databases:

```bash
# 1. PostgreSQL Check
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id, title, created_at FROM concepts WHERE entity_id = 'YOUR_ENTITY_ID';"

# 2. Neo4j Check  
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) WHERE n.entity_id = 'YOUR_ENTITY_ID' RETURN n.entity_id, n.title, labels(n);"

# 3. Weaviate Check (using entity_id directly)
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"entity_id\"], operator: Equal, valueString: \"YOUR_ENTITY_ID\" }) { _additional { id }, entity_id, title, entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type}'
```

**Example for entity `5f4c1612-cb67-4729-9e56-f8186ba340de`:**
```bash
# PostgreSQL: ✅ FOUND - "Creative Flow"
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id, title, created_at FROM concepts WHERE entity_id = '5f4c1612-cb67-4729-9e56-f8186ba340de';"

# Neo4j: ❌ MISSING - No results (empty output)
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) WHERE n.entity_id = '5f4c1612-cb67-4729-9e56-f8186ba340de' RETURN n.entity_id, n.title, labels(n);"

# Weaviate: ✅ FOUND - "Creative Flow"
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"entity_id\"], operator: Equal, valueString: \"5f4c1612-cb67-4729-9e56-f8186ba340de\" }) { _additional { id }, entity_id, title, entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type}'
```

## 1. PostgreSQL Database Checks

### Get Database Credentials
```bash
# Check your .env file for credentials
grep -E "POSTGRES|DATABASE" .env
```

### Check if Entity Exists in PostgreSQL
```bash
# Check specific entity by entity_id
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT entity_id, title, created_at 
FROM concepts 
WHERE entity_id = '5f4c1612-cb67-4729-9e56-f8186ba340de';"

# Check all entities created in a time range
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT entity_id, title, created_at 
FROM concepts 
WHERE created_at > '2025-09-27T11:42:00' 
ORDER BY created_at;"
```

### Check Multiple Entity Types
```bash
# Check concepts
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT entity_id, title, created_at FROM concepts 
WHERE created_at > '2025-09-27T11:42:00' 
ORDER BY created_at;"

# Check memory units
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT entity_id, title, created_at FROM memory_units 
WHERE created_at > '2025-09-27T11:42:00' 
ORDER BY created_at;"

# Check growth events
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT entity_id, title, created_at FROM growth_events 
WHERE created_at > '2025-09-27T11:42:00' 
ORDER BY created_at;"
```

## 2. Neo4j Database Checks

### Check if Entity Exists in Neo4j
```bash
# Check specific entity by entity_id
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n) 
WHERE n.entity_id = '5f4c1612-cb67-4729-9e56-f8186ba340de' 
RETURN n.entity_id, n.title, n.entity_type, labels(n);"

# Check all entities created around a specific time
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n) 
WHERE n.created_at > '2025-09-27T11:42:00' 
RETURN n.entity_id, n.title, n.entity_type, labels(n), n.created_at 
ORDER BY n.created_at;"
```

### Check Entity Types Separately
```bash
# Check Concept nodes
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n:Concept) 
WHERE n.created_at > '2025-09-27T11:42:00' 
RETURN n.entity_id, n.title, n.created_at 
ORDER BY n.created_at;"

# Check MemoryUnit nodes
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n:MemoryUnit) 
WHERE n.created_at > '2025-09-27T11:42:00' 
RETURN n.entity_id, n.title, n.created_at 
ORDER BY n.created_at;"

# Check GrowthEvent nodes
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n:GrowthEvent) 
WHERE n.created_at > '2025-09-27T11:42:00' 
RETURN n.entity_id, n.title, n.created_at 
ORDER BY n.created_at;"
```

## 3. Weaviate Database Checks

### Check if Entity Exists in Weaviate
```bash
# Search by entity_id (RECOMMENDED - works directly with entity_id)
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"entity_id\"], operator: Equal, valueString: \"5f4c1612-cb67-4729-9e56-f8186ba340de\" }) { _additional { id }, entity_id, title, entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type}'

# Alternative: Search by title
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"title\"], operator: Equal, valueString: \"Creative Flow\" }) { _additional { id }, entity_id, title, entity_type } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type}'
```

### Check All Recent Entities
```bash
# Get all entities created after a specific time (note: use valueDate for date fields)
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"created_at\"], operator: GreaterThan, valueDate: \"2025-09-27T11:42:00Z\" }) { _additional { id }, entity_id, title, entity_type, created_at } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type, created_at}'
```

### Check Specific Weaviate Object by Internal ID
```bash
# If you have the Weaviate internal ID (from logs)
curl -s "http://localhost:8080/v1/objects/1f6313c7-6870-4879-9eab-bb9a201064e0" | jq '.properties | {entity_id, title, entity_type}'
```

## 4. Cross-Database Consistency Verification

### Complete Consistency Check Script
```bash
#!/bin/bash
# save as check_consistency.sh

ENTITY_ID="5f4c1612-cb67-4729-9e56-f8186ba340de"
TIMESTAMP="2025-09-27T11:42:00"

echo "=== CHECKING ENTITY: $ENTITY_ID ==="
echo

echo "1. PostgreSQL Check:"
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 'concepts' as table_name, entity_id, title, created_at FROM concepts WHERE entity_id = '$ENTITY_ID'
UNION ALL
SELECT 'memory_units' as table_name, entity_id, title, created_at FROM memory_units WHERE entity_id = '$ENTITY_ID'
UNION ALL
SELECT 'growth_events' as table_name, entity_id, title, created_at FROM growth_events WHERE entity_id = '$ENTITY_ID';"

echo
echo "2. Neo4j Check:"
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
MATCH (n) 
WHERE n.entity_id = '$ENTITY_ID' 
RETURN n.entity_id, n.title, n.entity_type, labels(n), n.created_at;"

echo
echo "3. Weaviate Check:"
curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d "{\"query\": \"{ Get { UserKnowledgeItem(where: { path: [\\\"entity_id\\\"], operator: Equal, valueString: \\\"$ENTITY_ID\\\" }) { _additional { id }, entity_id, title, entity_type, created_at } } }\"}" | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type, created_at}'

echo
echo "=== CONSISTENCY CHECK COMPLETE ==="
```

### Batch Consistency Check
```bash
#!/bin/bash
# save as batch_consistency_check.sh

TIMESTAMP="2025-09-27T11:42:00"

echo "=== BATCH CONSISTENCY CHECK FOR ENTITIES CREATED AFTER $TIMESTAMP ==="
echo

echo "1. Getting all entity_ids from PostgreSQL:"
ENTITY_IDS=$(docker exec postgres-2d1l psql -U danniwang -d twodots1line -t -c "
SELECT entity_id FROM concepts WHERE created_at > '$TIMESTAMP'
UNION
SELECT entity_id FROM memory_units WHERE created_at > '$TIMESTAMP'
UNION
SELECT entity_id FROM growth_events WHERE created_at > '$TIMESTAMP'
ORDER BY entity_id;")

echo "Found entity_ids: $ENTITY_IDS"
echo

for entity_id in $ENTITY_IDS; do
    # Clean up the entity_id (remove whitespace)
    entity_id=$(echo $entity_id | xargs)
    
    if [ ! -z "$entity_id" ]; then
        echo "--- Checking entity: $entity_id ---"
        
        # PostgreSQL
        echo "PostgreSQL:"
        docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
        SELECT 'concepts' as table_name, entity_id, title FROM concepts WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'memory_units' as table_name, entity_id, title FROM memory_units WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'growth_events' as table_name, entity_id, title FROM growth_events WHERE entity_id = '$entity_id';" 2>/dev/null
        
        # Neo4j
        echo "Neo4j:"
        docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "
        MATCH (n) WHERE n.entity_id = '$entity_id' 
        RETURN n.entity_id, n.title, labels(n);" 2>/dev/null
        
        # Weaviate
        echo "Weaviate:"
        curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d "{\"query\": \"{ Get { UserKnowledgeItem(where: { path: [\\\"entity_id\\\"], operator: Equal, valueString: \\\"$entity_id\\\" }) { _additional { id }, entity_id, title, entity_type } } }\"}" | jq '.data.Get.UserKnowledgeItem[] | {id: ._additional.id, entity_id, title, entity_type}' 2>/dev/null
        
        echo
    fi
done

echo "=== BATCH CHECK COMPLETE ==="
```

## 5. Common Issues and Troubleshooting

### Issue: "No such container" Error
```bash
# Check which containers are running
docker ps | grep -E "(postgres|neo4j|weaviate)"

# Use the correct container names from the output above
```

### Issue: "Connection refused" for Weaviate
```bash
# Check if Weaviate is running and accessible
curl -s "http://localhost:8080/v1/meta" | jq '.version'

# If not accessible, check container status
docker logs weaviate-2d1l --tail 20
```

### Issue: "Role does not exist" for PostgreSQL
```bash
# Check your .env file for the correct username
grep POSTGRES_USER .env

# Use the correct username from your .env file
```

### Issue: "Authentication failed" for Neo4j
```bash
# Check your .env file for Neo4j credentials
grep NEO4J .env

# Use the correct password from your .env file
```

## 6. Quick Health Checks

### Database Health Status
```bash
# PostgreSQL health
docker exec postgres-2d1l pg_isready -U danniwang -d twodots1line

# Neo4j health
docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "RETURN 1;"

# Weaviate health
curl -s "http://localhost:8080/v1/meta" | jq '.version'
```

### Container Status
```bash
# Check all database containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|neo4j|weaviate)"
```

## 7. Performance Tips

### Use Specific Queries
- Always use `entity_id` for exact matches
- Use time ranges to limit results
- Use `LIMIT` clauses for large datasets

### Cache Results
```bash
# Save results to files for comparison
docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "SELECT entity_id, title FROM concepts WHERE created_at > '2025-09-27T11:42:00';" > postgres_results.txt

docker exec neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n:Concept) WHERE n.created_at > '2025-09-27T11:42:00' RETURN n.entity_id, n.title;" > neo4j_results.txt

curl -s -X POST "http://localhost:8080/v1/graphql" -H "Content-Type: application/json" -d '{"query": "{ Get { UserKnowledgeItem(where: { path: [\"created_at\"], operator: GreaterThan, valueDate: \"2025-09-27T11:42:00Z\" }) { _additional { id }, entity_id, title, entity_type, created_at } } }"}' | jq '.data.Get.UserKnowledgeItem[] | {entity_id, title, entity_type}' > weaviate_results.txt
```

This guide provides all the necessary commands to verify data consistency across your three-database architecture. Use the scripts for automated checking or individual commands for specific investigations.
