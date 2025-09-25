# Database Backup Manifest

**Backup Date:** Wed Sep 24 12:17:59 EDT 2025
**Backup Directory:** ./backups/20250924_121751_pre_migration
**Migration:** V11.0 Field Naming Standardization

## PostgreSQL Backups
- `postgresql_schema.sql` - Schema only (tables, indexes, constraints)
- `postgresql_data.sql` - Data only (all table data)
- `postgresql_complete.sql` - Complete backup (schema + data)
- `postgresql_custom.dump` - Custom format backup (fastest restore)

## Neo4j Backups
- `neo4j_constraints.cypher` - All constraints
- `neo4j_indexes.cypher` - All indexes
- `neo4j_schema.cypher` - Complete schema export (if APOC available)
- `neo4j_database.dump` - Database dump (if neo4j-admin available)
- `neo4j_sample_data.cypher` - Sample data verification

## Weaviate Backups
- `weaviate_schema.json` - Complete schema definition
- `weaviate_data.json` - All objects from UserKnowledgeItem class

## Restore Instructions

### PostgreSQL Restore
```bash
# Restore complete database
psql -h localhost -U postgres -d 2d1l_dev -f postgresql_complete.sql

# Or restore from custom format (faster)
pg_restore -h localhost -U postgres -d 2d1l_dev postgresql_custom.dump
```

### Neo4j Restore
```bash
# Restore constraints and indexes
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_constraints.cypher
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_indexes.cypher

# Restore data (if available)
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_schema.cypher
```

### Weaviate Restore
```bash
# Restore schema
curl -X POST "http://localhost:8080/v1/schema" -H "Content-Type: application/json" -d @weaviate_schema.json

# Restore data (requires custom script)
# See restore-weaviate.sh for detailed instructions
```

## Verification Commands

### PostgreSQL
```sql
-- Check table counts
SELECT schemaname, tablename, n_tup_ins as row_count 
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;

-- Check database size
SELECT pg_size_pretty(pg_database_size('2d1l_dev'));
```

### Neo4j
```cypher
-- Check node counts by label
MATCH (n) RETURN labels(n) as label, count(n) as count ORDER BY count DESC;

-- Check relationship counts
MATCH ()-[r]->() RETURN type(r) as relationship_type, count(r) as count ORDER BY count DESC;
```

### Weaviate
```bash
# Check object count
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.objects | length'
```
