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
