#!/bin/bash
# Export local data for VM migration

echo "🔄 Exporting local data for VM migration..."

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📊 Exporting PostgreSQL data..."
docker exec postgres-2d1l pg_dump -U postgres twodots1line > "$BACKUP_DIR/postgres_backup.sql"

echo "🕸️ Exporting Neo4j data..."
docker exec neo4j-2d1l neo4j-admin dump --database=neo4j --to=/tmp/neo4j_backup.dump
docker cp $(docker ps -q -f name=neo4j-2d1l):/tmp/neo4j_backup.dump "$BACKUP_DIR/neo4j_backup.dump"

echo "🔍 Exporting Weaviate data..."
curl -X GET "http://localhost:8080/v1/schema" > "$BACKUP_DIR/weaviate_schema.json"
curl -X GET "http://localhost:8080/v1/objects" > "$BACKUP_DIR/weaviate_data.json"

echo "📁 Exporting application files..."
cp -r apps/web-app/public/uploads "$BACKUP_DIR/" 2>/dev/null || echo "No uploads directory found"
cp -r apps/web-app/public/covers "$BACKUP_DIR/" 2>/dev/null || echo "No covers directory found"
cp -r apps/web-app/public/videos "$BACKUP_DIR/" 2>/dev/null || echo "No videos directory found"

echo "⚙️ Exporting configuration..."
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "No .env file found"
cp -r config "$BACKUP_DIR/" 2>/dev/null || echo "No config directory found"

echo "✅ Export complete! Data saved to: $BACKUP_DIR"
echo "📤 To upload to VM, run:"
echo "   gcloud compute scp --recurse $BACKUP_DIR twodots-vm:~/ --zone=us-central1-a"
