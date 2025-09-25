#!/bin/bash

echo "🔧 FIXING NULL ENTITY_TYPES IN WEAVIATE"
echo "======================================="

# Function to make curl requests
curlRequest() {
    curl -s -X POST "http://localhost:8080/v1/graphql" \
        -H "Content-Type: application/json" \
        -d "$1"
}

# Get all objects with null entity_type
echo "Getting objects with null entity_type..."
QUERY='{
  "query": "query { Get { UserKnowledgeItem(where: { path: [\"entity_type\"], operator: IsNull }, limit: 2000) { _additional { id } entity_id entity_type } } }"
}'

RESPONSE=$(curlRequest "$QUERY")
NULL_COUNT=$(echo "$RESPONSE" | jq -r '.data.Get.UserKnowledgeItem | length')

echo "Found $NULL_COUNT objects with null entity_type"

if [ "$NULL_COUNT" -eq 0 ]; then
    echo "✅ No null entity_type objects found!"
    exit 0
fi

# Process each null object
echo "$RESPONSE" | jq -r '.data.Get.UserKnowledgeItem[] | [._additional.id, .entity_id] | @csv' > /tmp/null_objects.csv

FIXED_COUNT=0
ERROR_COUNT=0

while IFS=',' read -r object_id entity_id; do
    # Remove quotes
    object_id=$(echo "$object_id" | tr -d '"')
    entity_id=$(echo "$entity_id" | tr -d '"')
    
    echo "Processing: $entity_id"
    
    # Check which table this entity_id belongs to in PostgreSQL
    TABLE_RESULT=$(psql -h localhost -p 5433 -U danniwang -d twodots1line -t -c "
        SELECT 'memory_units' as table_name FROM memory_units WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'concepts' as table_name FROM concepts WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'communities' as table_name FROM communities WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'derived_artifacts' as table_name FROM derived_artifacts WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'proactive_prompts' as table_name FROM proactive_prompts WHERE entity_id = '$entity_id'
        UNION ALL
        SELECT 'growth_events' as table_name FROM growth_events WHERE entity_id = '$entity_id'
        LIMIT 1;
    " | tr -d ' ')
    
    if [ -z "$TABLE_RESULT" ]; then
        echo "  ❌ Entity $entity_id not found in PostgreSQL"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        continue
    fi
    
    # Map table name to entity type
    case "$TABLE_RESULT" in
        "memory_units") ENTITY_TYPE="MemoryUnit" ;;
        "concepts") ENTITY_TYPE="Concept" ;;
        "communities") ENTITY_TYPE="Community" ;;
        "derived_artifacts") ENTITY_TYPE="DerivedArtifact" ;;
        "proactive_prompts") ENTITY_TYPE="ProactivePrompt" ;;
        "growth_events") ENTITY_TYPE="GrowthEvent" ;;
        *) 
            echo "  ❌ Unknown table name: $TABLE_RESULT"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            continue
            ;;
    esac
    
    # Update the object with the correct entity_type
    UPDATE_RESPONSE=$(curl -s -X PATCH "http://localhost:8080/v1/objects/$object_id" \
        -H "Content-Type: application/json" \
        -d "{\"entity_type\": \"$ENTITY_TYPE\"}")
    
    if echo "$UPDATE_RESPONSE" | jq -e '.error' > /dev/null; then
        echo "  ❌ Error updating: $(echo "$UPDATE_RESPONSE" | jq -r '.error[0].message')"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    else
        echo "  ✅ Fixed: $TABLE_RESULT -> $ENTITY_TYPE"
        FIXED_COUNT=$((FIXED_COUNT + 1))
    fi
    
done < /tmp/null_objects.csv

echo ""
echo "📈 FIX RESULTS:"
echo "Objects fixed: $FIXED_COUNT"
echo "Errors: $ERROR_COUNT"
