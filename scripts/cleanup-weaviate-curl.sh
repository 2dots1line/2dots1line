#!/bin/bash

echo "🧹 WEAVIATE DUPLICATE CLEANUP USING CURL"
echo "========================================"

# Function to make curl requests
curlRequest() {
    curl -s -X POST "http://localhost:8080/v1/graphql" \
        -H "Content-Type: application/json" \
        -d "$1"
}

# Step 1: Get all objects and identify duplicates
echo "📊 Step 1: Analyzing current state..."

# Get all objects with entity_id
QUERY='{
  "query": "query { Get { UserKnowledgeItem(limit: 2000) { _additional { id } entity_id entity_type } } }"
}'

RESPONSE=$(curlRequest "$QUERY")
echo "Response received, analyzing..."

# Extract entity_ids and count duplicates
echo "$RESPONSE" | jq -r '.data.Get.UserKnowledgeItem[] | .entity_id' | sort | uniq -c | sort -nr > /tmp/entity_id_counts.txt

echo "Entity ID frequency analysis:"
head -10 /tmp/entity_id_counts.txt

# Find duplicates (count > 1)
DUPLICATES=$(awk '$1 > 1 {print $2}' /tmp/entity_id_counts.txt)
DUPLICATE_COUNT=$(echo "$DUPLICATES" | wc -l)

echo ""
echo "Found $DUPLICATE_COUNT duplicate entity_ids"

if [ "$DUPLICATE_COUNT" -eq 0 ]; then
    echo "✅ No duplicates found!"
    exit 0
fi

# Step 2: For each duplicate, get all objects and delete all but the first
echo ""
echo "🗑️ Step 2: Removing duplicates..."

DELETED_COUNT=0
ERROR_COUNT=0

while IFS= read -r entity_id; do
    if [ -z "$entity_id" ]; then
        continue
    fi
    
    echo "Processing duplicate: $entity_id"
    
    # Get all objects with this entity_id
    QUERY="{
      \"query\": \"query { Get { UserKnowledgeItem(where: { path: [\\\"entity_id\\\"], operator: Equal, valueString: \\\"$entity_id\\\" }) { _additional { id } entity_id } } }\" 
    }"
    
    OBJECTS_RESPONSE=$(curlRequest "$QUERY")
    OBJECT_IDS=$(echo "$OBJECTS_RESPONSE" | jq -r '.data.Get.UserKnowledgeItem[] | ._additional.id')
    
    # Count objects
    OBJECT_COUNT=$(echo "$OBJECT_IDS" | wc -l)
    echo "  Found $OBJECT_COUNT objects with entity_id: $entity_id"
    
    # Delete all but the first object
    FIRST=true
    while IFS= read -r object_id; do
        if [ -z "$object_id" ]; then
            continue
        fi
        
        if [ "$FIRST" = true ]; then
            echo "  Keeping first object: $object_id"
            FIRST=false
        else
            echo "  Deleting object: $object_id"
            
            # Delete the object
            DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:8080/v1/objects/$object_id")
            
            if echo "$DELETE_RESPONSE" | jq -e '.error' > /dev/null; then
                echo "    ❌ Error deleting: $(echo "$DELETE_RESPONSE" | jq -r '.error[0].message')"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            else
                echo "    ✅ Deleted successfully"
                DELETED_COUNT=$((DELETED_COUNT + 1))
            fi
        fi
    done <<< "$OBJECT_IDS"
    
done <<< "$DUPLICATES"

echo ""
echo "📈 CLEANUP RESULTS:"
echo "Objects deleted: $DELETED_COUNT"
echo "Errors: $ERROR_COUNT"

# Step 3: Verify cleanup
echo ""
echo "🔍 Step 3: Verifying cleanup..."

FINAL_RESPONSE=$(curlRequest "$QUERY")
FINAL_OBJECTS=$(echo "$FINAL_RESPONSE" | jq -r '.data.Get.UserKnowledgeItem | length')
FINAL_ENTITY_IDS=$(echo "$FINAL_RESPONSE" | jq -r '.data.Get.UserKnowledgeItem[] | .entity_id' | sort | uniq | wc -l)

echo "Final object count: $FINAL_OBJECTS"
echo "Final unique entity_ids: $FINAL_ENTITY_IDS"
echo "Duplicates remaining: $((FINAL_OBJECTS - FINAL_ENTITY_IDS))"

if [ "$FINAL_OBJECTS" -eq "$FINAL_ENTITY_IDS" ]; then
    echo "✅ SUCCESS: All duplicates removed!"
else
    echo "❌ WARNING: Some duplicates may still exist"
fi
