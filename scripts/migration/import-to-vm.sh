#!/bin/bash
# Import data to VM from local backup

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup-directory>"
    echo "   Example: $0 backup_20241018_143022"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory '$BACKUP_DIR' not found!"
    exit 1
fi

echo "🔄 Importing data to VM from: $BACKUP_DIR"

# Upload backup to VM
echo "📤 Uploading backup to VM..."
gcloud compute scp --recurse "$BACKUP_DIR" twodots-vm:~/ --zone=us-central1-a

# Import data on VM
echo "📥 Importing data on VM..."

# PostgreSQL import
if [ -f "$BACKUP_DIR/postgres_backup.sql" ]; then
    echo "📊 Importing PostgreSQL data..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="docker exec -i postgres-2d1l psql -U postgres twodots1line < ~/$BACKUP_DIR/postgres_backup.sql"
fi

# Neo4j import
if [ -f "$BACKUP_DIR/neo4j_backup.dump" ]; then
    echo "🕸️ Importing Neo4j data..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="docker cp ~/$BACKUP_DIR/neo4j_backup.dump \$(docker ps -q -f name=neo4j-2d1l):/tmp/ && docker exec neo4j-2d1l neo4j-admin load --database=neo4j --from=/tmp/neo4j_backup.dump --force"
fi

# Weaviate import
if [ -f "$BACKUP_DIR/weaviate_schema.json" ]; then
    echo "🔍 Importing Weaviate schema..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="curl -X POST 'http://localhost:8080/v1/schema' -H 'Content-Type: application/json' -d @~/$BACKUP_DIR/weaviate_schema.json"
fi

if [ -f "$BACKUP_DIR/weaviate_data.json" ]; then
    echo "🔍 Importing Weaviate data..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="curl -X POST 'http://localhost:8080/v1/batch/objects' -H 'Content-Type: application/json' -d @~/$BACKUP_DIR/weaviate_data.json"
fi

# Application files
if [ -d "$BACKUP_DIR/uploads" ]; then
    echo "📁 Importing uploads..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="mkdir -p ~/2D1L/apps/web-app/public && cp -r ~/$BACKUP_DIR/uploads ~/2D1L/apps/web-app/public/"
fi

if [ -d "$BACKUP_DIR/covers" ]; then
    echo "📁 Importing covers..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="mkdir -p ~/2D1L/apps/web-app/public && cp -r ~/$BACKUP_DIR/covers ~/2D1L/apps/web-app/public/"
fi

if [ -d "$BACKUP_DIR/videos" ]; then
    echo "📁 Importing videos..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="mkdir -p ~/2D1L/apps/web-app/public && cp -r ~/$BACKUP_DIR/videos ~/2D1L/apps/web-app/public/"
fi

# Configuration
if [ -f "$BACKUP_DIR/.env" ]; then
    echo "⚙️ Importing environment configuration..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="cp ~/$BACKUP_DIR/.env ~/2D1L/.env"
fi

if [ -d "$BACKUP_DIR/config" ]; then
    echo "⚙️ Importing configuration files..."
    gcloud compute ssh twodots-vm --zone=us-central1-a --command="cp -r ~/$BACKUP_DIR/config ~/2D1L/"
fi

echo "✅ Import complete!"
echo "🔄 Restart services on VM:"
echo "   gcloud compute ssh twodots-vm --zone=us-central1-a --command='cd ~/2D1L && pm2 restart all'"
