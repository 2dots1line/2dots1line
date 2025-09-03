// Fix Missing Neo4j Nodes - Based on Insight Worker Error Logs
// Run this script in Neo4j Browser to resolve data consistency issues

// ============================================================================
// STEP 1: Check Current State
// ============================================================================

// Check what ProactivePrompt nodes currently exist
MATCH (p:ProactivePrompt) 
RETURN p.prompt_id, p.title, p.created_at 
ORDER BY p.created_at DESC;

// Check what Concept nodes currently exist
MATCH (c:Concept) 
RETURN c.id, c.name, c.type, c.user_id 
ORDER BY c.created_at DESC 
LIMIT 10;

// Check for orphaned nodes (nodes without proper relationships)
MATCH (n) 
WHERE NOT (n)-[]-() 
RETURN labels(n), count(n) as orphaned_count;

// ============================================================================
// STEP 2: Create Missing ProactivePrompt Nodes
// ============================================================================

// Create the missing ProactivePrompt nodes that were causing errors
// These IDs were extracted from the error logs

// ProactivePrompt 1
CREATE (p1:ProactivePrompt {
    prompt_id: '55399dd3-02e6-4c4d-af1f-44c67ae716c9',
    title: 'Strategic Reflection Prompt',
    content: 'Based on your recent activities and growth patterns, consider reflecting on your strategic direction and long-term goals.',
    prompt_type: 'strategic_reflection',
    user_id: 'system', // or the actual user ID if known
    created_at: datetime(),
    status: 'active',
    priority: 'medium'
});

// ProactivePrompt 2
CREATE (p2:ProactivePrompt {
    prompt_id: '3daad168-afe4-4d7d-ba31-f61aa14d799f',
    title: 'Growth Pattern Analysis',
    content: 'Analyze your recent growth events and identify patterns that could inform your future development.',
    prompt_type: 'growth_analysis',
    user_id: 'system', // or the actual user ID if known
    created_at: datetime(),
    status: 'active',
    priority: 'medium'
});

// ProactivePrompt 3
CREATE (p3:ProactivePrompt {
    prompt_id: '9dca43e1-2e56-4819-8f7a-62befe4201ac',
    title: 'Knowledge Integration Prompt',
    content: 'Review your recent learning experiences and identify opportunities to integrate new knowledge with existing concepts.',
    prompt_type: 'knowledge_integration',
    user_id: 'system', // or the actual user ID if known
    created_at: datetime(),
    status: 'active',
    priority: 'medium'
});

// ============================================================================
// STEP 3: Create Missing Concept Nodes (if needed)
// ============================================================================

// Check if these concept IDs exist in PostgreSQL but not in Neo4j
// You may need to query PostgreSQL to get the actual concept data

// Example: Create a placeholder concept if needed
// CREATE (c:Concept {
//     id: 'missing-concept-id',
//     name: 'Placeholder Concept',
//     type: 'placeholder',
//     user_id: 'system',
//     created_at: datetime()
// });

// ============================================================================
// STEP 4: Create Relationships
// ============================================================================

// Create relationships between ProactivePrompt nodes and other entities
// This depends on your specific data model

// Example: Link prompts to users (if you have user nodes)
// MATCH (p:ProactivePrompt), (u:User {user_id: 'system'})
// CREATE (p)-[:BELONGS_TO]->(u);

// Example: Link prompts to concepts (if you have concept nodes)
// MATCH (p:ProactivePrompt), (c:Concept)
// WHERE c.type = 'strategic' AND p.prompt_type = 'strategic_reflection'
// CREATE (p)-[:RELATES_TO]->(c);

// ============================================================================
// STEP 5: Verify Fixes
// ============================================================================

// Verify that all previously missing nodes now exist
MATCH (p:ProactivePrompt) 
WHERE p.prompt_id IN [
    '55399dd3-02e6-4c4d-af1f-44c67ae716c9',
    '3daad168-afe4-4d7d-ba31-f61aa14d799f',
    '9dca43e1-2e56-4819-8f7a-62befe4201ac'
]
RETURN p.prompt_id, p.title, p.status, p.created_at;

// Check for any remaining orphaned nodes
MATCH (n) 
WHERE NOT (n)-[]-() 
RETURN labels(n), count(n) as orphaned_count;

// ============================================================================
// STEP 6: Cleanup and Maintenance
// ============================================================================

// Optional: Remove any test/placeholder nodes created during debugging
// MATCH (n) WHERE n.name = 'Placeholder Concept' DELETE n;

// ============================================================================
// NOTES:
// ============================================================================
// 1. Run this script section by section in Neo4j Browser
// 2. Check the results after each section
// 3. Modify the user_id values to match actual users in your system
// 4. Adjust the content and metadata based on your actual data model
// 5. After running this script, restart the insight worker to test
// 6. Monitor the logs to ensure the errors are resolved

