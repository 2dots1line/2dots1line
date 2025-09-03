// Fix Concept Merging Issues - Based on Insight Worker Error Logs
// Run this script in Neo4j Browser to resolve concept consistency issues

// ============================================================================
// STEP 1: Check Current Concept State
// ============================================================================

// Check what concepts currently exist in Neo4j
MATCH (c:Concept) 
RETURN c.id, c.name, c.type, c.user_id, c.created_at 
ORDER BY c.created_at DESC 
LIMIT 20;

// Check for concepts that might be missing relationships
MATCH (c:Concept)
WHERE NOT (c)-[:MERGED_INTO]-() AND NOT (c)-[:MERGES_WITH]-()
RETURN c.id, c.name, c.type, c.user_id;

// Check for any existing concept merging relationships
MATCH (c1:Concept)-[r:MERGED_INTO]->(c2:Concept)
RETURN c1.id as source_concept, c2.id as target_concept, r.merged_at, r.reason;

// ============================================================================
// STEP 2: Create Missing Concept Nodes (if they don't exist)
// ============================================================================

// Based on the error logs, these concept IDs were causing issues
// You may need to create them if they don't exist in Neo4j

// Check if these specific concepts exist
MATCH (c:Concept) 
WHERE c.id IN [
    'd0fa158e-2acb-494c-987e-168b34341937',
    '37c0e727-504e-4880-aa84-5668ae85d75b'
]
RETURN c.id, c.name, c.type, c.user_id;

// If they don't exist, create placeholder concepts
// (You should replace these with actual concept data from PostgreSQL)

// CREATE (c1:Concept {
//     id: 'd0fa158e-2acb-494c-987e-168b34341937',
//     name: 'Placeholder Concept 1',
//     type: 'placeholder',
//     user_id: 'system', // replace with actual user ID
//     created_at: datetime(),
//     description: 'This concept was created to resolve data consistency issues'
// });

// CREATE (c2:Concept {
//     id: '37c0e727-504e-4880-aa84-5668ae85d75b',
//     name: 'Placeholder Concept 2',
//     type: 'placeholder',
//     user_id: 'system', // replace with actual user ID
//     created_at: datetime(),
//     description: 'This concept was created to resolve data consistency issues'
// });

// ============================================================================
// STEP 3: Fix Concept Merging Relationships
// ============================================================================

// Check for any broken or circular merging relationships
MATCH (c:Concept)-[r:MERGED_INTO]->(target:Concept)
WHERE c.id = target.id
RETURN c.id, target.id, r;

// Remove any circular relationships (if they exist)
// MATCH (c:Concept)-[r:MERGED_INTO]->(target:Concept)
// WHERE c.id = target.id
// DELETE r;

// ============================================================================
// STEP 4: Create Proper Concept Hierarchy
// ============================================================================

// Example: Create a proper concept hierarchy structure
// This depends on your specific concept merging logic

// Create a root concept for merged concepts
// CREATE (root:Concept {
//     id: 'root-concept-id',
//     name: 'Root Concept',
//     type: 'root',
//     user_id: 'system',
//     created_at: datetime()
// });

// Link merged concepts to the root
// MATCH (c:Concept), (root:Concept {id: 'root-concept-id'})
// WHERE c.id IN ['d0fa158e-2acb-494c-987e-168b34341937', '37c0e727-504e-4880-aa84-5668ae85d75b']
// CREATE (c)-[:MERGED_INTO]->(root);

// ============================================================================
// STEP 5: Verify Data Consistency
// ============================================================================

// Check that all concepts have proper relationships
MATCH (c:Concept)
RETURN c.id, c.name, 
       size((c)-[:MERGED_INTO]->()) as merged_into_count,
       size((c)<-[:MERGED_INTO]-()) as merged_from_count;

// Check for orphaned concepts (concepts without any relationships)
MATCH (c:Concept)
WHERE NOT (c)-[]-() AND NOT (c)<-[]-()
RETURN c.id, c.name, c.type;

// ============================================================================
// STEP 6: Cleanup and Validation
// ============================================================================

// Remove any test/placeholder concepts created during debugging
// MATCH (c:Concept) WHERE c.name CONTAINS 'Placeholder' DELETE c;

// Final verification
MATCH (c:Concept)
RETURN count(c) as total_concepts,
       count(DISTINCT c.user_id) as unique_users,
       count(DISTINCT c.type) as concept_types;

// ============================================================================
// NOTES:
// ============================================================================
// 1. Run this script section by section in Neo4j Browser
// 2. Check the results after each section
// 3. Replace placeholder data with actual concept information from PostgreSQL
// 4. Adjust the concept merging logic based on your business rules
// 5. After running this script, restart the insight worker to test
// 6. Monitor the logs to ensure concept merging errors are resolved
// 7. Consider implementing proper upsert logic in the insight worker code

