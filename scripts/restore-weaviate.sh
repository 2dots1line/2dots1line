#!/bin/bash

# Weaviate Data Restoration Script
# This script restores Weaviate data from JSON backup files

set -e

# Configuration
WEAVIATE_HOST="localhost"
WEAVIATE_PORT="8080"
BACKUP_DIR="${1:-./backups/latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Weaviate is running
check_weaviate() {
    log "🔍 Checking Weaviate connection..."
    if ! curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/meta" > /dev/null; then
        error "Weaviate is not running or not accessible at http://$WEAVIATE_HOST:$WEAVIATE_PORT"
    fi
    log "✅ Weaviate is accessible"
}

# Restore Weaviate data
restore_weaviate_data() {
    local data_file="$BACKUP_DIR/weaviate_data.json"
    
    if [ ! -f "$data_file" ]; then
        error "Weaviate data file not found: $data_file"
    fi
    
    log "📥 Restoring Weaviate data from $data_file..."
    
    # Parse JSON and restore objects
    jq -r '.objects[] | @base64' "$data_file" | while read -r object_b64; do
        # Decode base64 object
        object_json=$(echo "$object_b64" | base64 --decode)
        
        # Extract object properties
        object_id=$(echo "$object_json" | jq -r '.id // empty')
        object_class=$(echo "$object_json" | jq -r '.class // empty')
        object_properties=$(echo "$object_json" | jq -r '.properties // {}')
        
        if [ -n "$object_id" ] && [ -n "$object_class" ]; then
            # Create object in Weaviate
            response=$(curl -s -X POST "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/objects" \
                -H "Content-Type: application/json" \
                -d "{
                    \"id\": \"$object_id\",
                    \"class\": \"$object_class\",
                    \"properties\": $object_properties
                }")
            
            if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
                echo "✅ Restored object: $object_id"
            else
                warning "Failed to restore object: $object_id"
                echo "Response: $response"
            fi
        fi
    done
    
    log "✅ Weaviate data restoration completed"
}

# Verify restoration
verify_restoration() {
    log "🔍 Verifying Weaviate restoration..."
    
    # Get object count
    object_count=$(curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/objects?class=UserKnowledgeItem&limit=1" | jq '.objects | length' 2>/dev/null || echo "0")
    
    log "📊 Current object count: $object_count"
    
    # Get schema
    schema_response=$(curl -s "http://$WEAVIATE_HOST:$WEAVIATE_PORT/v1/schema")
    if echo "$schema_response" | jq -e '.classes' > /dev/null 2>&1; then
        log "✅ Schema verification passed"
    else
        warning "Schema verification failed"
    fi
}

# Main function
main() {
    log "🚀 Starting Weaviate data restoration"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory not found: $BACKUP_DIR"
    fi
    
    check_weaviate
    restore_weaviate_data
    verify_restoration
    
    log "🎉 Weaviate restoration completed successfully!"
}

# Run main function
main "$@"
