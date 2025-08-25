# 🕸️ **NEO4J BROWSER GUIDE - 2D1L**
*Complete instructions for using Neo4j Browser and common Cypher queries*

---

## 📋 **OVERVIEW**

This guide covers how to use Neo4j through the Neo4j Browser interface for your 2D1L system. Neo4j stores the knowledge graph structure with concepts, memory units, and their relationships.

### **What Neo4j Stores**
- **Concept nodes**: Knowledge concepts with properties like name, type, salience
- **MemoryUnit nodes**: User memories with properties like title, content, importance
- **Relationships**: Connections between concepts and memories (RELATED_TO, HIGHLIGHTS, OWNS)
- **User context**: All data is scoped to specific users

### **Key Use Cases**
- Explore knowledge graph structure
- Analyze concept relationships
- Query user-specific data
- Debug graph connections
- Perform graph analytics

---

## 🚀 **QUICK START**

### **1. Access Neo4j Browser**
```bash
# Open Neo4j Browser in your web browser
open http://localhost:7475
```

### **2. Connect to Database**
```
Username: neo4j
Password: password123
```

### **3. Verify Connection**
```cypher
// Test basic connection
RETURN 'Neo4j Connected Successfully!' as status
```

---

## 🔧 **NEO4J BROWSER INTERFACE**

### **Main Components**

#### **1. Command Bar**
- **Location**: Top of the browser
- **Purpose**: Enter Cypher queries
- **Features**: Auto-completion, syntax highlighting, query history

#### **2. Result Panel**
- **Graph View**: Visual representation of nodes and relationships
- **Table View**: Tabular data display
- **Text View**: Raw result text
- **Code View**: Cypher code with results

#### **3. Sidebar**
- **Database Info**: Current database, version, status
- **Favorites**: Saved queries
- **Documentation**: Built-in help and examples

### **Browser Navigation**
```
┌─────────────────────────────────────────────────────────┐
│                    Neo4j Browser                        │
├─────────────────────────────────────────────────────────┤
│  🔍 Command Bar: Enter Cypher queries here             │
├─────────────────────────────────────────────────────────┤
│  📊 Results Panel (Graph/Table/Text/Code views)        │
├─────────────────────────────────────────────────────────┤
│  📚 Sidebar: Database info, favorites, help            │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **COMMON CYPHER QUERIES**

### **1. Basic Data Exploration**

#### **View All Node Labels**
```cypher
// See what types of nodes exist
CALL db.labels() YIELD label 
RETURN label
```

#### **View All Relationship Types**
```cypher
// See what types of relationships exist
CALL db.relationshipTypes() YIELD relationshipType 
RETURN relationshipType
```

#### **Count All Nodes by Type**
```cypher
// Count nodes of each type
MATCH (n) 
RETURN labels(n)[0] as nodeType, count(n) as count 
ORDER BY count DESC
```

#### **Count All Relationships by Type**
```cypher
// Count relationships of each type
MATCH ()-[r]->() 
RETURN type(r) as relationshipType, count(r) as count 
ORDER BY count DESC
```

### **2. User-Specific Data Queries**

#### **View All Data for a Specific User**
```cypher
// Get all nodes and relationships for dev-user-123
MATCH (n {user_id: 'dev-user-123'})
OPTIONAL MATCH (n)-[r]-(m {user_id: 'dev-user-123'})
RETURN n, r, m
LIMIT 50
```

#### **Count User's Concepts and Memories**
```cypher
// Count concepts and memory units for a user
MATCH (n {user_id: 'dev-user-123'})
RETURN 
  labels(n)[0] as nodeType,
  count(n) as count
ORDER BY count DESC
```

#### **View User's Concept Hierarchy**
```cypher
// Show concepts and their relationships for a user
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(related {user_id: 'dev-user-123'})
RETURN c, r, related
LIMIT 30
```

### **3. Concept Analysis Queries**

#### **Find Concepts by Type**
```cypher
// Find concepts of a specific type
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.type = 'technology'
RETURN c.name, c.type, c.salience
ORDER BY c.salience DESC
```

#### **Find Related Concepts**
```cypher
// Find concepts related to a specific concept
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.name CONTAINS 'research'
MATCH (c)-[r]-(related:Concept {user_id: 'dev-user-123'})
RETURN c.name as source, type(r) as relationship, related.name as target
```

#### **Concept Connection Analysis**
```cypher
// Analyze how well connected concepts are
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(other {user_id: 'dev-user-123'})
RETURN 
  c.name as concept,
  c.type as type,
  count(r) as connections,
  c.salience as importance
ORDER BY connections DESC, c.salience DESC
LIMIT 20
```

### **4. Memory Unit Queries**

#### **Find Memory Units by Importance**
```cypher
// Get memory units ordered by importance
MATCH (mu:MemoryUnit {user_id: 'dev-user-123'})
RETURN 
  mu.title,
  mu.importance_score,
  mu.creation_ts
ORDER BY mu.importance_score DESC
LIMIT 20
```

#### **Find Memories Related to Concepts**
```cypher
// Find memories related to specific concepts
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.name CONTAINS 'autism'
MATCH (c)-[r]-(mu:MemoryUnit {user_id: 'dev-user-123'})
RETURN 
  c.name as concept,
  type(r) as relationship,
  mu.title as memory,
  mu.importance_score
ORDER BY mu.importance_score DESC
```

#### **Memory Content Analysis**
```cypher
// Analyze memory content patterns
MATCH (mu:MemoryUnit {user_id: 'dev-user-123'})
WHERE mu.content IS NOT NULL AND mu.content <> ''
RETURN 
  mu.title,
  length(mu.content) as content_length,
  mu.importance_score,
  mu.creation_ts
ORDER BY mu.importance_score DESC
LIMIT 15
```

### **5. Relationship Analysis**

#### **Analyze Relationship Patterns**
```cypher
// See what types of relationships exist between concepts
MATCH (c1:Concept {user_id: 'dev-user-123'})-[r]->(c2:Concept {user_id: 'dev-user-123'})
RETURN 
  type(r) as relationshipType,
  count(r) as count
ORDER BY count DESC
```

#### **Find Strong Connections**
```cypher
// Find concepts with strong connections
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(other {user_id: 'dev-user-123'})
WITH c, count(r) as connectionCount
WHERE connectionCount > 2
RETURN 
  c.name,
  c.type,
  connectionCount,
  c.salience
ORDER BY connectionCount DESC, c.salience DESC
```

#### **Path Analysis**
```cypher
// Find paths between two concepts
MATCH path = (start:Concept {user_id: 'dev-user-123'})
WHERE start.name CONTAINS 'research'
MATCH (end:Concept {user_id: 'dev-user-123'})
WHERE end.name CONTAINS 'health'
MATCH path = shortestPath((start)-[*..3]-(end))
RETURN path
```

### **6. Graph Analytics Queries**

#### **Community Detection (Simplified)**
```cypher
// Find concepts that form clusters
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(neighbor:Concept {user_id: 'dev-user-123'})
WITH c, count(r) as neighborCount
WHERE neighborCount > 1
RETURN 
  c.name,
  c.type,
  neighborCount,
  c.salience
ORDER BY neighborCount DESC
LIMIT 15
```

#### **Centrality Analysis**
```cypher
// Find the most central concepts (most connections)
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(other {user_id: 'dev-user-123'})
RETURN 
  c.name,
  c.type,
  count(r) as degree,
  c.salience
ORDER BY degree DESC, c.salience DESC
LIMIT 20
```

#### **Bridge Concepts**
```cypher
// Find concepts that connect different areas
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r1]-(area1 {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r2]-(area2 {user_id: 'dev_id: 'dev-user-123'})
WHERE area1 <> area2
WITH c, count(DISTINCT area1) as areas
WHERE areas > 1
RETURN 
  c.name,
  c.type,
  areas,
  c.salience
ORDER BY areas DESC, c.salience DESC
```

### **7. Data Quality and Validation**

#### **Find Orphaned Nodes**
```cypher
// Find concepts with no connections
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE NOT EXISTS((c)-[]-())
RETURN c.name, c.type, c.salience
```

#### **Find Duplicate Concepts**
```cypher
// Find concepts with similar names
MATCH (c1:Concept {user_id: 'dev-user-123'})
MATCH (c2:Concept {user_id: 'dev-user-123'})
WHERE c1.concept_id < c2.concept_id
  AND toLower(c1.name) = toLower(c2.name)
RETURN c1.name, c1.concept_id, c2.concept_id
```

#### **Validate Relationship Consistency**
```cypher
// Check for relationships to non-existent nodes
MATCH ()-[r]->(target)
WHERE NOT EXISTS((target))
RETURN type(r) as relationshipType, count(r) as count
```

---

## 🎯 **PRACTICAL QUERY EXAMPLES**

### **Example 1: User Knowledge Overview**
```cypher
// Get a complete overview of a user's knowledge graph
MATCH (n {user_id: 'dev-user-123'})
OPTIONAL MATCH (n)-[r]-(m {user_id: 'dev-user-123'})
RETURN 
  labels(n)[0] as nodeType,
  n.name as name,
  n.title as title,
  type(r) as relationship,
  m.name as relatedName,
  m.title as relatedTitle
ORDER BY nodeType, name
LIMIT 100
```

### **Example 2: Concept Evolution Analysis**
```cypher
// Analyze how concepts have evolved over time
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.created_at IS NOT NULL
OPTIONAL MATCH (c)-[r]-(related {user_id: 'dev-user-123'})
RETURN 
  c.name,
  c.type,
  c.created_at,
  count(r) as connections,
  c.salience
ORDER BY c.created_at DESC
LIMIT 20
```

### **Example 3: Memory-Concept Mapping**
```cypher
// See how memories map to concepts
MATCH (mu:MemoryUnit {user_id: 'dev-user-123'})
OPTIONAL MATCH (mu)-[r]-(c:Concept {user_id: 'dev-user-123'})
RETURN 
  mu.title as memory,
  mu.importance_score,
  collect(c.name) as related_concepts,
  count(c) as concept_count
ORDER BY mu.importance_score DESC
LIMIT 15
```

### **Example 4: Knowledge Gap Analysis**
```cypher
// Find areas with few connections (potential knowledge gaps)
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(other {user_id: 'dev-user-123'})
WITH c, count(r) as connectionCount
WHERE connectionCount <= 2
RETURN 
  c.name,
  c.type,
  connectionCount,
  c.salience
ORDER BY c.salience DESC, connectionCount ASC
LIMIT 20
```

---

## 🔍 **DATA EXPLORATION TECHNIQUES**

### **1. Interactive Graph Exploration**

#### **Start with a Seed Node**
```cypher
// Find a concept to start exploring from
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.name CONTAINS 'research'
RETURN c LIMIT 1
```

#### **Expand from Seed Node**
```cypher
// Explore connections from a specific concept
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.name = 'autism research'
MATCH (c)-[r]-(related {user_id: 'dev-user-123'})
RETURN c, r, related
```

#### **Follow Paths**
```cypher
// Follow paths of a certain length
MATCH path = (start:Concept {user_id: 'dev-user-123'})
WHERE start.name = 'autism research'
MATCH (end:Concept {user_id: 'dev-user-123'})
WHERE end.name = 'health issues'
MATCH path = (start)-[*..3]-(end)
RETURN path
```

### **2. Data Sampling Techniques**

#### **Random Sampling**
```cypher
// Get a random sample of concepts
MATCH (c:Concept {user_id: 'dev-user-123'})
RETURN c
ORDER BY rand()
LIMIT 10
```

#### **Stratified Sampling**
```cypher
// Sample from different concept types
MATCH (c:Concept {user_id: 'dev-user-123'})
WITH c, c.type as type
ORDER BY rand()
WITH type, collect(c) as concepts
UNWIND concepts[0..3] as sampled
RETURN sampled
```

### **3. Pattern Recognition**

#### **Find Similar Patterns**
```cypher
// Find concepts with similar connection patterns
MATCH (c:Concept {user_id: 'dev-user-123'})
OPTIONAL MATCH (c)-[r]-(other {user_id: 'dev-user-123'})
WITH c, collect(type(r)) as relationshipTypes
WITH c, size(relationshipTypes) as patternSize
WHERE patternSize > 2
RETURN c.name, c.type, patternSize
ORDER BY patternSize DESC
```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Issue 1: No Results Returned**

#### **Check User ID Filtering**
```cypher
// Verify user ID is correct
MATCH (n)
RETURN DISTINCT n.user_id
LIMIT 10
```

#### **Check Node Labels**
```cypher
// Verify node labels exist
CALL db.labels() YIELD label 
RETURN label
```

#### **Check Data Exists**
```cypher
// Check if any data exists at all
MATCH (n) 
RETURN count(n) as totalNodes
```

### **Issue 2: Performance Problems**

#### **Check Query Plan**
```cypher
// Use EXPLAIN to see query execution plan
EXPLAIN MATCH (c:Concept {user_id: 'dev-user-123'})
RETURN c.name, c.type
```

#### **Check Indexes**
```cypher
// See what indexes exist
SHOW INDEXES
```

#### **Limit Result Sets**
```cypher
// Always use LIMIT for large queries
MATCH (n {user_id: 'dev-user-123'})
RETURN n
LIMIT 50  // Add this to prevent overwhelming results
```

### **Issue 3: Relationship Issues**

#### **Check Relationship Direction**
```cypher
// Verify relationship direction
MATCH (a)-[r]->(b)
WHERE a.user_id = 'dev-user-123' AND b.user_id = 'dev-user-123'
RETURN type(r), count(r)
```

#### **Check for Bidirectional Relationships**
```cypher
// Look for relationships going both ways
MATCH (a)-[r1]->(b)
WHERE a.user_id = 'dev-user-123' AND b.user_id = 'dev-user-123'
MATCH (b)-[r2]->(a)
WHERE type(r1) = type(r2)
RETURN a.name, b.name, type(r1)
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **1. Query Optimization Tips**

#### **Use Specific Labels**
```cypher
// Good: Specific label
MATCH (c:Concept {user_id: 'dev-user-123'})
RETURN c

// Avoid: Generic pattern
MATCH (n {user_id: 'dev-user-123'})
RETURN n
```

#### **Limit Result Sets**
```cypher
// Always use LIMIT for exploration queries
MATCH (n {user_id: 'dev-user-123'})
RETURN n
LIMIT 100
```

#### **Use EXISTS for Existence Checks**
```cypher
// Good: Use EXISTS
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE EXISTS((c)-[:RELATED_TO]->())
RETURN c

// Avoid: Full pattern matching
MATCH (c:Concept {user_id: 'dev-user-123'})-[:RELATED_TO]->(other)
RETURN c
```

### **2. Indexing Strategy**

#### **Check Current Indexes**
```cypher
// See what indexes exist
SHOW INDEXES
```

#### **Create Useful Indexes**
```cypher
// Create index on user_id for better performance
CREATE INDEX user_id_index IF NOT EXISTS
FOR (n) ON (n.user_id)
```

#### **Monitor Index Usage**
```cypher
// Check index usage statistics
CALL db.indexes()
```

---

## 🔧 **MONITORING & MAINTENANCE**

### **1. Database Health Checks**

#### **Check Database Status**
```cypher
// Basic health check
CALL dbms.components() 
YIELD name, versions 
RETURN name, versions[0] as version
```

#### **Check Transaction Status**
```cypher
// Check for long-running transactions
CALL db.listTransactions()
```

#### **Check Memory Usage**
```cypher
// Check database memory usage
CALL dbms.queryJmx("java.lang:type=Memory")
```

### **2. Data Quality Monitoring**

#### **Check for Orphaned Data**
```cypher
// Find nodes with no relationships
MATCH (n {user_id: 'dev-user-123'})
WHERE NOT EXISTS((n)-[]-())
RETURN labels(n)[0] as nodeType, count(n) as count
```

#### **Check for Inconsistent Data**
```cypher
// Find nodes with missing required properties
MATCH (c:Concept {user_id: 'dev-user-123'})
WHERE c.name IS NULL OR c.type IS NULL
RETURN c.concept_id, c.name, c.type
```

### **3. Performance Monitoring**

#### **Check Query Performance**
```cypher
// Use PROFILE to see detailed execution
PROFILE MATCH (c:Concept {user_id: 'dev-user-123'})
RETURN c.name, c.type
LIMIT 10
```

#### **Monitor Slow Queries**
```cypher
// Check for queries taking longer than expected
CALL dbms.listQueries()
```

---

## 📚 **RELATED DOCUMENTATION**

### **Code References**
- **Neo4jService**: `packages/database/src/services/Neo4jService.ts`
- **DatabaseService**: `packages/database/src/DatabaseService.ts`
- **Schema**: `packages/database/schemas/neo4j.cypher`

### **Configuration Files**
- **Docker Compose**: `docker-compose.dev.yml`
- **Environment**: `.env` file
- **Schema Application**: `packages/database/scripts/apply-schemas.ts`

### **Related Guides**
- **Database Setup**: `scripts/GUIDES/INSTALLATION_GUIDE.md`
- **Troubleshooting**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`
- **Weaviate Guide**: `scripts/GUIDES/WEAVIATE_QUERY_GUIDE.md`

---

## 🎯 **QUICK REFERENCE COMMANDS**

### **Essential Queries**
```cypher
// Health check
CALL dbms.components() YIELD name, versions RETURN name, versions[0]

// Count nodes by type
MATCH (n) RETURN labels(n)[0] as type, count(n) as count

// View user data
MATCH (n {user_id: 'dev-user-123'}) RETURN n LIMIT 20

// Check relationships
MATCH ()-[r]->() RETURN type(r), count(r)
```

### **Troubleshooting Commands**
```cypher
// Check indexes
SHOW INDEXES

// Check constraints
SHOW CONSTRAINTS

// Profile query performance
PROFILE MATCH (n) RETURN n LIMIT 5

// Check for orphaned nodes
MATCH (n) WHERE NOT EXISTS((n)-[]-()) RETURN n
```

---

## 🆘 **GETTING HELP**

### **If This Guide Doesn't Help**
1. **Check the troubleshooting section** above
2. **Review Neo4j logs**: `docker logs neo4j-2d1l --tail 100`
3. **Check system health**: `pnpm health:check`
4. **Refer to emergency procedures**: `scripts/GUIDES/TROUBLESHOOTING_GUIDE.md`

### **Common Support Questions**
- **Q**: "No results returned" → Check user_id filtering and node labels
- **Q**: "Query is slow" → Use LIMIT, check indexes, use EXPLAIN
- **Q**: "Can't see relationships" → Check relationship direction and user_id filtering
- **Q**: "Browser not responding" → Check Neo4j container status

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Neo4j Version**: 5.x  
**Default Port**: 7475 (HTTP), 7688 (Bolt)

---

*This guide provides comprehensive coverage of Neo4j Browser usage and Cypher queries in the 2D1L system. For advanced graph algorithms or specific requirements, refer to the Neo4jService implementation or the official Neo4j documentation.*

