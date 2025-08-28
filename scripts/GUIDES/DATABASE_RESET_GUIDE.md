# 🗄️ **DATABASE RESET GUIDE - 2D1L**
*Complete instructions for resetting PostgreSQL, Neo4j, and Weaviate databases*

---

## 📋 **OVERVIEW**

This guide provides comprehensive instructions for resetting all three databases in the 2D1L system while preserving their schemas. The reset process removes all data content but maintains the database structure, indexes, and constraints.

### **What Gets Reset**
- **PostgreSQL**: All user data, conversations, memory units, concepts, etc.
- **Neo4j**: All graph nodes and relationships
- **Weaviate**: All vector embeddings and knowledge items

### **What Gets Preserved**
- **Database schemas** and table structures
- **Indexes** and constraints
- **Database configurations**
- **User accounts** (if any system users exist)

---

## 🚀 **QUICK START**

### **Automated Reset (Recommended)**
```bash
# Make the script executable
chmod +x scripts/GUIDES/reset-databases.sh

# Reset all databases with confirmation
./scripts/GUIDES/reset-databases.sh

# Reset all databases without confirmation
./scripts/GUIDES/reset-databases.sh -y

# Check current status first
./scripts/GUIDES/reset-databases.sh -s
```

### **Manual Reset Commands**
```bash
# PostgreSQL
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "TRUNCATE TABLE cards, conversations, conversation_messages, memory_units, concepts, communities, derived_artifacts, growth_events, interaction_logs, media_items, proactive_prompts, user_challenges, user_graph_projections, user_sessions, llm_interactions CASCADE;"

# Neo4j
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) DETACH DELETE n;"

# Weaviate
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq -r '.objects[].id' | xargs -I {} curl -X DELETE "http://localhost:8080/v1/objects/{}"
```

---

## 🔧 **AUTOMATED SCRIPT USAGE**

### **Script Location**
```
scripts/GUIDES/reset-databases.sh
```

### **Command Line Options**

| Option | Description | Example |
|--------|-------------|---------|
| `-h, --help` | Show help message | `./reset-databases.sh --help` |
| `-y, --yes` | Skip confirmation prompts | `./reset-databases.sh -y` |
| `-p, --postgres` | Reset only PostgreSQL | `./reset-databases.sh -p` |
| `-n, --neo4j` | Reset only Neo4j | `./reset-databases.sh -n` |
| `-w, --weaviate` | Reset only Weaviate | `./reset-databases.sh -w` |
| `-a, --all` | Reset all databases (default) | `./reset-databases.sh -a` |
| `-v, --verify` | Verify reset results | `./reset-databases.sh -v` |
| `-s, --status` | Show current database status | `./reset-databases.sh -s` |

### **Usage Examples**

#### **Complete Reset with Confirmation**
```bash
./scripts/GUIDES/reset-databases.sh
```
**Output:**
```
🗄️  Database Reset Script for 2D1L
================================================
📋 Checking Prerequisites
✅ docker is available
✅ curl is available
✅ jq is available
✅ All prerequisites met

📋 Current Database Status
PostgreSQL Status:
✅ PostgreSQL container is running
  Users: 1
  Concepts: 67
  Memory Units: 45

Neo4j Status:
✅ Neo4j container is running
  Total Nodes: 13

Weaviate Status:
✅ Weaviate is accessible
  UserKnowledgeItem Objects: 156

⚠️  Preparing to reset databases...
This will DELETE ALL DATA from the databases.
Schemas will be preserved, but all content will be lost.
Are you sure you want to continue? (yes/no): yes

🔧 Resetting PostgreSQL Database
ℹ️  Executing: TRUNCATE TABLE cards conversations conversation_messages...
✅ PostgreSQL database reset completed
✅ PostgreSQL reset verified - all data cleared

🔧 Resetting Neo4j Database
ℹ️  Deleting all nodes and relationships
✅ Neo4j database reset completed
✅ Neo4j reset verified - all nodes deleted

🔧 Resetting Weaviate Database
ℹ️  Fetching all UserKnowledgeItem objects
ℹ️  Deleting 156 UserKnowledgeItem objects
  Progress: 156/156 objects deleted
✅ Weaviate database reset completed - deleted 156 objects
✅ Weaviate reset verified - all objects deleted

🎉 Database reset completed successfully!
Your databases are now clean and ready for fresh data.
```

#### **Quick Status Check**
```bash
./scripts/GUIDES/reset-databases.sh -s
```

#### **Reset Without Confirmation**
```bash
./scripts/GUIDES/reset-databases.sh -y
```

#### **Reset Only Specific Database**
```bash
# Reset only PostgreSQL
./scripts/GUIDES/reset-databases.sh -p

# Reset only Neo4j
./scripts/GUIDES/reset-databases.sh -n

# Reset only Weaviate
./scripts/GUIDES/reset-databases.sh -w
```

#### **Verify Reset Results**
```bash
./scripts/GUIDES/reset-databases.sh -v
```

---

## 🛠️ **MANUAL RESET PROCEDURES**

### **1. PostgreSQL Reset**

#### **Connect to PostgreSQL**
```bash
# Connect to the database
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line
```

#### **List All Tables**
```sql
-- View all tables in the database
\dt

-- Expected output:
-- cards, conversations, conversation_messages, memory_units, concepts, etc.
```

#### **Reset All Data Tables**
```sql
-- Truncate all data tables (preserves schema)
TRUNCATE TABLE 
  cards, 
  conversations, 
  conversation_messages, 
  memory_units, 
  concepts, 
  communities, 
  derived_artifacts, 
  growth_events, 
  interaction_logs, 
  media_items, 
  proactive_prompts, 
  user_challenges, 
  user_graph_projections, 
  user_sessions, 
  llm_interactions 
CASCADE;
```

#### **Verify Reset**
```sql
-- Check that tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'concepts', COUNT(*) FROM concepts
UNION ALL
SELECT 'memory_units', COUNT(*) FROM memory_units
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations;

-- Expected output: All counts should be 0
```

#### **Exit PostgreSQL**
```sql
\q
```

### **2. Neo4j Reset**

#### **Connect to Neo4j**
```bash
# Connect using cypher-shell
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123
```

#### **Check Current Data**
```cypher
// Count all nodes
MATCH (n) RETURN count(n) as total_nodes;

// Count nodes by type
MATCH (n) RETURN labels(n)[0] as node_type, count(n) as count;
```

#### **Delete All Nodes and Relationships**
```cypher
// Delete all nodes and their relationships
MATCH (n) DETACH DELETE n;
```

#### **Verify Reset**
```cypher
// Verify all nodes are deleted
MATCH (n) RETURN count(n) as remaining_nodes;

// Expected output: 0
```

#### **Exit Neo4j**
```cypher
:exit
```

### **3. Weaviate Reset**

#### **Check Current Objects**
```bash
# Get total count of objects
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults'

# List all object IDs
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq -r '.objects[].id'
```

#### **Delete All Objects**
```bash
# Get all object IDs and delete them
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | \
  jq -r '.objects[].id' | \
  xargs -I {} curl -X DELETE "http://localhost:8080/v1/objects/{}"
```

#### **Verify Reset**
```bash
# Check that no objects remain
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults'

# Expected output: 0
```

---

## 🔍 **VERIFICATION PROCEDURES**

### **Automated Verification**
```bash
# Use the script to verify
./scripts/GUIDES/reset-databases.sh -v
```

### **Manual Verification**

#### **PostgreSQL Verification**
```bash
# Check main tables
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'concepts', COUNT(*) FROM concepts
UNION ALL
SELECT 'memory_units', COUNT(*) FROM memory_units
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'cards', COUNT(*) FROM cards;"
```

**Expected Output:**
```
 table_name   | count 
--------------+-------
 users        |     0
 concepts     |     0
 memory_units |     0
 conversations|     0
 cards        |     0
```

#### **Neo4j Verification**
```bash
# Check node count
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n) as node_count;"
```

**Expected Output:**
```
+------------+
| node_count |
+------------+
| 0          |
+------------+
```

#### **Weaviate Verification**
```bash
# Check object count
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.totalResults'
```

**Expected Output:**
```json
0
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Issue 1: Script Permission Denied**
```bash
# Error: Permission denied
chmod +x scripts/GUIDES/reset-databases.sh
```

#### **Issue 2: Docker Containers Not Running**
```bash
# Error: Container not running
docker ps | grep -E "(postgres|neo4j|weaviate)"

# Start containers if needed
docker-compose -f docker-compose.dev.yml up -d
```

#### **Issue 3: PostgreSQL Connection Failed**
```bash
# Error: Connection refused
# Check if PostgreSQL is accessible
nc -z localhost 5433

# Restart PostgreSQL container
docker-compose -f docker-compose.dev.yml restart postgres-2d1l
```

#### **Issue 4: Neo4j Authentication Failed**
```bash
# Error: Authentication failed
# Verify credentials
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "RETURN 'Connected' as status;"
```

#### **Issue 5: Weaviate Not Accessible**
```bash
# Error: Connection refused
# Check Weaviate health
curl http://localhost:8080/v1/.well-known/ready

# Restart Weaviate container
docker-compose -f docker-compose.dev.yml restart weaviate-2d1l
```

### **Partial Reset Issues**

#### **Some Data Remains After Reset**
```bash
# Check what data remains
./scripts/GUIDES/reset-databases.sh -s

# Force reset specific database
./scripts/GUIDES/reset-databases.sh -p -y  # PostgreSQL only
./scripts/GUIDES/reset-databases.sh -n -y  # Neo4j only
./scripts/GUIDES/reset-databases.sh -w -y  # Weaviate only
```

#### **Schema Issues After Reset**
```bash
# Reapply schemas if needed
cd packages/database

# PostgreSQL schema
pnpm prisma db push

# Neo4j schema
cat schemas/neo4j.cypher | docker exec -i neo4j-2d1l cypher-shell -u neo4j -p password123

# Weaviate schema
curl -X POST "http://localhost:8080/v1/schema" -H "Content-Type: application/json" -d @schemas/weaviate.json
```

---

## 📊 **PRE-RESET BACKUP (Optional)**

### **PostgreSQL Backup**
```bash
# Create backup before reset
docker exec postgres-2d1l pg_dump -U danniwang twodots1line > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
docker exec -i postgres-2d1l psql -U danniwang -d twodots1line < backup_20250106_143022.sql
```

### **Neo4j Backup**
```bash
# Neo4j data is stored in Docker volumes
# To backup, copy the volume data
docker run --rm -v neo4j_data:/data -v $(pwd):/backup alpine tar czf /backup/neo4j_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### **Weaviate Backup**
```bash
# Weaviate data is stored in Docker volumes
# To backup, copy the volume data
docker run --rm -v weaviate_data:/data -v $(pwd):/backup alpine tar czf /backup/weaviate_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

---

## 🔄 **POST-RESET PROCEDURES**

### **1. Verify System Health**
```bash
# Check all services are running
pnpm services:status

# Test database connections
curl -f http://localhost:3001/api/health
```

### **2. Regenerate Prisma Client**
```bash
# Regenerate Prisma client after reset
cd packages/database
pnpm prisma generate
cd ../..
```

### **3. Test System Functionality**
```bash
# Test basic functionality
curl -X POST http://localhost:3001/api/v1/conversations/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{"message": "Test message after reset"}'
```

### **4. Monitor for Issues**
```bash
# Watch logs for any issues
pm2 logs --lines 20

# Check for errors
pm2 logs | grep -i error
```

---

## 📋 **RESET CHECKLIST**

### **Before Reset**
- [ ] Ensure all services are running
- [ ] Create backups if needed
- [ ] Stop any active development work
- [ ] Notify team members if working collaboratively

### **During Reset**
- [ ] Run the reset script or manual commands
- [ ] Monitor for any errors
- [ ] Verify each database is reset successfully

### **After Reset**
- [ ] Verify all databases are empty
- [ ] Test system functionality
- [ ] Regenerate Prisma client if needed
- [ ] Monitor logs for any issues
- [ ] Resume development work

---

## 🎯 **QUICK REFERENCE**

### **Essential Commands**
```bash
# Quick reset all databases
./scripts/GUIDES/reset-databases.sh -y

# Check status
./scripts/GUIDES/reset-databases.sh -s

# Verify reset
./scripts/GUIDES/reset-databases.sh -v

# Reset specific database
./scripts/GUIDES/reset-databases.sh -p -y  # PostgreSQL only
```

### **Manual Commands**
```bash
# PostgreSQL
docker exec -it postgres-2d1l psql -U danniwang -d twodots1line -c "TRUNCATE TABLE cards, conversations, conversation_messages, memory_units, concepts, communities, derived_artifacts, growth_events, interaction_logs, media_items, proactive_prompts, user_challenges, user_graph_projections, user_sessions, llm_interactions CASCADE;"

# Neo4j
docker exec -it neo4j-2d1l cypher-shell -u neo4j -p password123 "MATCH (n) DETACH DELETE n;"

# Weaviate
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1000" | jq -r '.objects[].id' | xargs -I {} curl -X DELETE "http://localhost:8080/v1/objects/{}"
```

---

## 🆘 **GETTING HELP**

### **If Reset Fails**
1. **Check the troubleshooting section** above
2. **Review error messages** carefully
3. **Verify Docker containers** are running
4. **Check database connectivity**
5. **Use manual commands** as fallback

### **Common Support Questions**
- **Q**: "Script permission denied" → Run `chmod +x scripts/GUIDES/reset-databases.sh`
- **Q**: "Container not running" → Start with `docker-compose -f docker-compose.dev.yml up -d`
- **Q**: "Some data remains" → Use `-y` flag to force reset or reset specific database
- **Q**: "Schema issues after reset" → Reapply schemas using the provided commands

---

**Last Updated**: January 6, 2025  
**Tested With**: 2D1L V11.0  
**Script Version**: 1.0.0

---

*This guide provides comprehensive coverage of database reset procedures in the 2D1L system. For advanced troubleshooting or specific requirements, refer to the individual database guides or the troubleshooting documentation.*
