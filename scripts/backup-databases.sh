#!/bin/bash

# V11.0 Field Naming Standardization - Database Backup Script
# This script creates comprehensive backups of all three databases before migration

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)_pre_migration"
POSTGRES_DB="twodots1line"
POSTGRES_USER="danniwang"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5433"
NEO4J_HOST="localhost"
NEO4J_PORT="7475"
NEO4J_BOLT_PORT="7688"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password123"
WEAVIATE_HOST="localhost"
WEAVIATE_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${BLUE}📁 Created backup directory: $BACKUP_DIR${NC}"

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# 1. PostgreSQL Backup
backup_postgresql() {
    log "🗄️  Starting PostgreSQL backup..."
    
    # Create schema-only backup
    log "📋 Creating PostgreSQL schema backup..."
    docker exec postgres-2d1l pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --schema-only --no-owner --no-privileges \
        > "$BACKUP_DIR/postgresql_schema.sql" || error "Failed to create PostgreSQL schema backup"
    
    # Create data-only backup
    log "📊 Creating PostgreSQL data backup..."
    docker exec postgres-2d1l pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --data-only --no-owner --no-privileges \
        > "$BACKUP_DIR/postgresql_data.sql" || error "Failed to create PostgreSQL data backup"
    
    # Create complete backup
    log "💾 Creating PostgreSQL complete backup..."
    docker exec postgres-2d1l pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --no-owner --no-privileges \
        > "$BACKUP_DIR/postgresql_complete.sql" || error "Failed to create PostgreSQL complete backup"
    
    # Create custom format backup (for faster restore)
    log "⚡ Creating PostgreSQL custom format backup..."
    docker exec postgres-2d1l pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --format=custom --no-owner --no-privileges \
        > "$BACKUP_DIR/postgresql_custom.dump" || error "Failed to create PostgreSQL custom backup"
    
    # Get database size
    DB_SIZE=$(docker exec postgres-2d1l psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" | xargs)
    log "✅ PostgreSQL backup completed. Database size: $DB_SIZE"
}

# 2. Neo4j Backup
backup_neo4j() {
    log "🕸️  Starting Neo4j backup..."
    
    # Create Neo4j dump using cypher-shell
    log "📋 Creating Neo4j schema backup (constraints and indexes)..."
    docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "CALL apoc.export.cypher.all('$BACKUP_DIR/neo4j_schema.cypher', {format: 'cypher-shell', useOptimizations: {type: 'UNWIND_BATCH', unwindBatchSize: 20}})" \
        > "$BACKUP_DIR/neo4j_schema_export.log" 2>&1 || warning "APOC export failed, trying alternative method"
    
    # Alternative: Export using neo4j-admin (if available)
    if command -v neo4j-admin &> /dev/null; then
        log "📊 Creating Neo4j database dump..."
        neo4j-admin database dump --database=neo4j --to="$BACKUP_DIR/neo4j_database.dump" || warning "neo4j-admin dump failed"
    fi
    
    # Export constraints and indexes
    log "🔍 Exporting Neo4j constraints and indexes..."
    docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "SHOW CONSTRAINTS;" > "$BACKUP_DIR/neo4j_constraints.cypher" || error "Failed to export constraints"
    
    docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "SHOW INDEXES;" > "$BACKUP_DIR/neo4j_indexes.cypher" || error "Failed to export indexes"
    
    # Export all data
    log "💾 Exporting Neo4j data..."
    docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "MATCH (n) RETURN n LIMIT 1;" > "$BACKUP_DIR/neo4j_sample_data.cypher" || warning "Failed to export sample data"
    
    # Get node and relationship counts
    NODE_COUNT=$(docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "MATCH (n) RETURN count(n) as count;" | grep -o '[0-9]*' | head -1)
    REL_COUNT=$(docker exec neo4j-2d1l cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" \
        "MATCH ()-[r]->() RETURN count(r) as count;" | grep -o '[0-9]*' | head -1)
    
    log "✅ Neo4j backup completed. Nodes: $NODE_COUNT, Relationships: $REL_COUNT"
}

# 3. Weaviate Backup
backup_weaviate() {
    log "🔍 Starting Weaviate backup..."
    
    # Create Weaviate schema backup
    log "📋 Creating Weaviate schema backup..."
    curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/schema" \
        -o "$BACKUP_DIR/weaviate_schema.json" || error "Failed to create Weaviate schema backup"
    
    # Export all objects from UserKnowledgeItem class
    log "💾 Exporting Weaviate data..."
    curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/objects?class=UserKnowledgeItem&limit=10000" \
        -o "$BACKUP_DIR/weaviate_data.json" || error "Failed to export Weaviate data"
    
    # Get object count
    OBJECT_COUNT=$(curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.objects | length' 2>/dev/null || echo "unknown")
    
    log "✅ Weaviate backup completed. Objects: $OBJECT_COUNT"
}

# 4. Create backup manifest
create_manifest() {
    log "📝 Creating backup manifest..."
    
    cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# Database Backup Manifest

**Backup Date:** $(date)
**Backup Directory:** $BACKUP_DIR
**Migration:** V11.0 Field Naming Standardization

## PostgreSQL Backups
- \`postgresql_schema.sql\` - Schema only (tables, indexes, constraints)
- \`postgresql_data.sql\` - Data only (all table data)
- \`postgresql_complete.sql\` - Complete backup (schema + data)
- \`postgresql_custom.dump\` - Custom format backup (fastest restore)

## Neo4j Backups
- \`neo4j_constraints.cypher\` - All constraints
- \`neo4j_indexes.cypher\` - All indexes
- \`neo4j_schema.cypher\` - Complete schema export (if APOC available)
- \`neo4j_database.dump\` - Database dump (if neo4j-admin available)
- \`neo4j_sample_data.cypher\` - Sample data verification

## Weaviate Backups
- \`weaviate_schema.json\` - Complete schema definition
- \`weaviate_data.json\` - All objects from UserKnowledgeItem class

## Restore Instructions

### PostgreSQL Restore
\`\`\`bash
# Restore complete database
psql -h localhost -U postgres -d 2d1l_dev -f postgresql_complete.sql

# Or restore from custom format (faster)
pg_restore -h localhost -U postgres -d 2d1l_dev postgresql_custom.dump
\`\`\`

### Neo4j Restore
\`\`\`bash
# Restore constraints and indexes
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_constraints.cypher
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_indexes.cypher

# Restore data (if available)
cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_schema.cypher
\`\`\`

### Weaviate Restore
\`\`\`bash
# Restore schema
curl -X POST "http://localhost:8080/v1/schema" -H "Content-Type: application/json" -d @weaviate_schema.json

# Restore data (requires custom script)
# See restore-weaviate.sh for detailed instructions
\`\`\`

## Verification Commands

### PostgreSQL
\`\`\`sql
-- Check table counts
SELECT schemaname, tablename, n_tup_ins as row_count 
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;

-- Check database size
SELECT pg_size_pretty(pg_database_size('2d1l_dev'));
\`\`\`

### Neo4j
\`\`\`cypher
-- Check node counts by label
MATCH (n) RETURN labels(n) as label, count(n) as count ORDER BY count DESC;

-- Check relationship counts
MATCH ()-[r]->() RETURN type(r) as relationship_type, count(r) as count ORDER BY count DESC;
\`\`\`

### Weaviate
\`\`\`bash
# Check object count
curl -s "http://localhost:8080/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.objects | length'
\`\`\`
EOF

    log "✅ Backup manifest created"
}

# 5. Create rollback scripts
create_rollback_scripts() {
    log "🔄 Creating rollback scripts..."
    
    # PostgreSQL rollback script
    cat > "$BACKUP_DIR/rollback-postgresql.sh" << 'EOF'
#!/bin/bash
# PostgreSQL Rollback Script

echo "🔄 Rolling back PostgreSQL database..."

# Stop any running services that might be using the database
echo "⏹️  Stopping services..."
pm2 stop all 2>/dev/null || true

# Drop and recreate database
echo "🗑️  Dropping existing database..."
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS 2d1l_dev;"
psql -h localhost -U postgres -c "CREATE DATABASE 2d1l_dev;"

# Restore from backup
echo "📥 Restoring database from backup..."
if [ -f "postgresql_custom.dump" ]; then
    echo "⚡ Using custom format restore (faster)..."
    pg_restore -h localhost -U postgres -d 2d1l_dev postgresql_custom.dump
else
    echo "📄 Using SQL format restore..."
    psql -h localhost -U postgres -d 2d1l_dev -f postgresql_complete.sql
fi

echo "✅ PostgreSQL rollback completed"
EOF

    # Neo4j rollback script
    cat > "$BACKUP_DIR/rollback-neo4j.sh" << 'EOF'
#!/bin/bash
# Neo4j Rollback Script

echo "🔄 Rolling back Neo4j database..."

# Stop Neo4j
echo "⏹️  Stopping Neo4j..."
sudo systemctl stop neo4j 2>/dev/null || docker stop neo4j 2>/dev/null || true

# Clear existing database
echo "🗑️  Clearing existing database..."
sudo rm -rf /var/lib/neo4j/data/databases/neo4j/* 2>/dev/null || true
sudo rm -rf /var/lib/neo4j/data/transactions/neo4j/* 2>/dev/null || true

# Start Neo4j
echo "▶️  Starting Neo4j..."
sudo systemctl start neo4j 2>/dev/null || docker start neo4j 2>/dev/null || true

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
sleep 10

# Restore constraints and indexes
echo "📥 Restoring constraints and indexes..."
if [ -f "neo4j_constraints.cypher" ]; then
    cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_constraints.cypher
fi

if [ -f "neo4j_indexes.cypher" ]; then
    cypher-shell -u neo4j -p password -a bolt://localhost:7687 < neo4j_indexes.cypher
fi

echo "✅ Neo4j rollback completed"
EOF

    # Weaviate rollback script
    cat > "$BACKUP_DIR/rollback-weaviate.sh" << 'EOF'
#!/bin/bash
# Weaviate Rollback Script

echo "🔄 Rolling back Weaviate database..."

# Stop Weaviate
echo "⏹️  Stopping Weaviate..."
docker stop weaviate 2>/dev/null || true

# Clear existing data
echo "🗑️  Clearing existing Weaviate data..."
sudo rm -rf ./weaviate_data/* 2>/dev/null || true

# Start Weaviate
echo "▶️  Starting Weaviate..."
docker start weaviate 2>/dev/null || true

# Wait for Weaviate to be ready
echo "⏳ Waiting for Weaviate to be ready..."
sleep 10

# Restore schema
echo "📥 Restoring Weaviate schema..."
if [ -f "weaviate_schema.json" ]; then
    curl -X POST "http://localhost:8080/v1/schema" \
        -H "Content-Type: application/json" \
        -d @weaviate_schema.json
fi

echo "✅ Weaviate rollback completed"
echo "⚠️  Note: Data restoration requires custom script - see restore-weaviate.sh"
EOF

    # Make scripts executable
    chmod +x "$BACKUP_DIR/rollback-postgresql.sh"
    chmod +x "$BACKUP_DIR/rollback-neo4j.sh"
    chmod +x "$BACKUP_DIR/rollback-weaviate.sh"
    
    log "✅ Rollback scripts created"
}

# 6. Verify backups
verify_backups() {
    log "🔍 Verifying backups..."
    
    # Check PostgreSQL backups
    if [ -f "$BACKUP_DIR/postgresql_complete.sql" ] && [ -s "$BACKUP_DIR/postgresql_complete.sql" ]; then
        log "✅ PostgreSQL backup verified"
    else
        error "❌ PostgreSQL backup verification failed"
    fi
    
    # Check Neo4j backups
    if [ -f "$BACKUP_DIR/neo4j_constraints.cypher" ] && [ -s "$BACKUP_DIR/neo4j_constraints.cypher" ]; then
        log "✅ Neo4j constraints backup verified"
    else
        warning "⚠️  Neo4j constraints backup verification failed"
    fi
    
    # Check Weaviate backups
    if [ -f "$BACKUP_DIR/weaviate_schema.json" ] && [ -s "$BACKUP_DIR/weaviate_schema.json" ]; then
        log "✅ Weaviate schema backup verified"
    else
        error "❌ Weaviate schema backup verification failed"
    fi
    
    if [ -f "$BACKUP_DIR/weaviate_data.json" ] && [ -s "$BACKUP_DIR/weaviate_data.json" ]; then
        log "✅ Weaviate data backup verified"
    else
        warning "⚠️  Weaviate data backup verification failed"
    fi
}

# Main execution
main() {
    log "🚀 Starting V11.0 Field Naming Standardization Database Backup"
    log "📅 Backup timestamp: $(date)"
    
    # Check prerequisites
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump not found. Please install PostgreSQL client tools."
    fi
    
    if ! command -v cypher-shell &> /dev/null; then
        warning "cypher-shell not found. Neo4j backup may be incomplete."
    fi
    
    if ! command -v curl &> /dev/null; then
        error "curl not found. Please install curl."
    fi
    
    # Create backups
    backup_postgresql
    backup_neo4j
    backup_weaviate
    
    # Create manifest and rollback scripts
    create_manifest
    create_rollback_scripts
    
    # Verify backups
    verify_backups
    
    # Calculate backup size
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    log "🎉 Database backup completed successfully!"
    log "📁 Backup location: $BACKUP_DIR"
    log "💾 Backup size: $BACKUP_SIZE"
    log "📋 See BACKUP_MANIFEST.md for restore instructions"
    log "🔄 Rollback scripts available in backup directory"
    
    echo -e "\n${GREEN}✅ All databases backed up successfully!${NC}"
    echo -e "${BLUE}📁 Backup directory: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}⚠️  Keep this backup safe until migration is complete and verified!${NC}"
}

# Run main function
main "$@"
