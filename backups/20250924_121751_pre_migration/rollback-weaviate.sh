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
