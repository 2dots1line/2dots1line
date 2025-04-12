/**
 * Graph Mapping Service
 * Maps thought analysis to Neo4j graph operations.
 * Takes the AI-generated analysis of entities and relationships
 * and creates the corresponding nodes and relationships in Neo4j.
 */

const neo4jService = require('./neo4j.service');

/**
 * Process a thought analysis result and create the corresponding graph elements
 * @param {object} thoughtAnalysis - AI analysis result for a single thought
 * @param {string} thoughtId - PostgreSQL Thought ID to link with graph elements
 * @returns {Promise<object>} - Results of the graph mapping operation
 */
async function mapThoughtToGraph(thoughtAnalysis, thoughtId) {
  try {
    console.log(`[INFO] Mapping thought ${thoughtId} to graph...`);

    const createdNodes = [];
    const createdRelationships = [];

    // Step 1: Create all nodes identified in the analysis
    for (const nodeSpec of thoughtAnalysis.nodes) {
      try {
        const node = await neo4jService.mergeNode(nodeSpec.label, nodeSpec.properties);
        createdNodes.push(node);
      } catch (nodeError) {
        console.error(`[ERROR] Failed to create node ${nodeSpec.label}:`, nodeError);
        // Continue with other nodes even if one fails
      }
    }

    // Step 2: Create all relationships identified in the analysis
    for (const relSpec of thoughtAnalysis.relationships) {
      try {
        const relationship = await neo4jService.mergeRelationship(
          relSpec.source,
          relSpec.type,
          relSpec.target
        );
        createdRelationships.push(relationship);
      } catch (relError) {
        console.error(`[ERROR] Failed to create relationship ${relSpec.type}:`, relError);
        // Continue with other relationships even if one fails
      }
    }

    // Step 3: Link the PostgreSQL Thought to the created graph elements
    const nodeIds = createdNodes.map(node => node.id);
    await neo4jService.linkThoughtToGraphElements(thoughtId, nodeIds);

    return {
      success: true,
      thoughtId,
      createdNodes: createdNodes.length,
      createdRelationships: createdRelationships.length
    };
  } catch (error) {
    console.error('[ERROR] Failed to map thought to graph:', error);
    throw new Error(`Failed to map thought to graph: ${error.message}`);
  }
}

/**
 * Process multiple thought analyses from a single interaction
 * @param {Array} thoughtResults - Array of {thought, analysis} objects
 * @returns {Promise<object>} - Summary of mapping operations
 */
async function mapThoughtsToGraph(thoughtResults) {
  try {
    console.log(`[INFO] Mapping ${thoughtResults.length} thoughts to graph...`);
    
    const results = [];
    
    // Process each thought analysis one at a time
    for (const result of thoughtResults) {
      try {
        const mappingResult = await mapThoughtToGraph(
          result.analysis,
          result.thought.id
        );
        
        results.push({
          thoughtId: result.thought.id,
          success: true,
          ...mappingResult
        });
      } catch (mappingError) {
        console.error(`[ERROR] Failed to map thought ${result.thought.id}:`, mappingError);
        
        results.push({
          thoughtId: result.thought.id,
          success: false,
          error: mappingError.message
        });
      }
    }
    
    // Generate a summary of the mapping operation
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return {
      success: failed === 0,
      total: results.length,
      successful,
      failed,
      details: results
    };
  } catch (error) {
    console.error('[ERROR] Failed to map thoughts to graph:', error);
    throw new Error(`Failed to map thoughts to graph: ${error.message}`);
  }
}

/**
 * Get the graph representation of a person and their connections
 * @param {string} personName - Name of the person to get graph for
 * @param {number} depth - Relationship depth to traverse
 * @returns {Promise<object>} - The subgraph data
 */
async function getPersonGraph(personName, depth = 2) {
  try {
    const subgraph = await neo4jService.getSubgraph('Person', { name: personName }, depth);
    
    // Transform for frontend visualization if needed
    return {
      success: true,
      nodes: subgraph.nodes,
      relationships: subgraph.relationships
    };
  } catch (error) {
    console.error('[ERROR] Failed to get person graph:', error);
    throw new Error(`Failed to get person graph: ${error.message}`);
  }
}

/**
 * Get the full user knowledge graph (including all known people)
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} - The entire user knowledge graph
 */
async function getUserKnowledgeGraph(userId) {
  try {
    // This is a placeholder. In practice, we'd need a more efficient query
    // that starts from a user node and follows specific patterns.
    
    // First get the user node in Neo4j
    const userQuery = `
      MATCH (user:Person {id: $userId})
      RETURN user
    `;
    
    const userResult = await neo4jService.runQuery(userQuery, { userId });
    
    if (userResult.records.length === 0) {
      throw new Error(`User ${userId} not found in graph database`);
    }
    
    // Now get the full subgraph
    const graphQuery = `
      MATCH (user:Person {id: $userId})
      CALL apoc.path.subgraphAll(user, {maxLevel: 3})
      YIELD nodes, relationships
      RETURN nodes, relationships
    `;
    
    const graphResult = await neo4jService.runQuery(graphQuery, { userId });
    
    if (graphResult.records.length === 0) {
      return { nodes: [], relationships: [] };
    }
    
    // Process the results
    const record = graphResult.records[0];
    const nodes = record.get('nodes').map(node => ({
      id: node.identity.toString(),
      labels: node.labels,
      properties: node.properties
    }));
    
    const relationships = record.get('relationships').map(rel => ({
      id: rel.identity.toString(),
      type: rel.type,
      properties: rel.properties,
      source: rel.start.toString(),
      target: rel.end.toString()
    }));
    
    return {
      success: true,
      nodes,
      relationships
    };
  } catch (error) {
    console.error('[ERROR] Failed to get user knowledge graph:', error);
    throw new Error(`Failed to get user knowledge graph: ${error.message}`);
  }
}

module.exports = {
  mapThoughtToGraph,
  mapThoughtsToGraph,
  getPersonGraph,
  getUserKnowledgeGraph
}; 