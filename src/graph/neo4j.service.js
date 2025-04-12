/**
 * Neo4j Service
 * Manages connection and operations with the Neo4j graph database.
 * Enables creating nodes, relationships, and managing the knowledge graph.
 */

// This is a placeholder class for the moment. We will need to add the neo4j-driver 
// package to implement the actual connection.

const neo4j = require('neo4j-driver'); // This will require installing the neo4j-driver package

// Neo4j connection details - from environment variables
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password123'; // Should be secured in env

// Driver instance shared by the module
let driver;

/**
 * Initialize the Neo4j driver connection
 * @returns {object} - The initialized driver instance
 */
function initDriver() {
  try {
    // Create a driver instance
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { maxConnectionPoolSize: 50 }
    );
    
    console.log(`[INFO] Neo4j driver initialized for ${NEO4J_URI}`);
    return driver;
  } catch (error) {
    console.error('[ERROR] Failed to initialize Neo4j driver:', error);
    throw new Error(`Failed to initialize Neo4j driver: ${error.message}`);
  }
}

/**
 * Get the Neo4j driver instance, initializing if necessary
 * @returns {object} - The Neo4j driver instance
 */
function getDriver() {
  if (!driver) {
    return initDriver();
  }
  return driver;
}

/**
 * Close the Neo4j driver connection
 */
async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[INFO] Neo4j driver connection closed');
  }
}

/**
 * Run a Cypher query against the Neo4j database
 * @param {string} query - The Cypher query to execute
 * @param {object} params - Parameters for the query
 * @returns {Promise<object>} - The query result
 */
async function runQuery(query, params = {}) {
  const session = getDriver().session();
  try {
    console.log(`[DEBUG] Running Neo4j query: ${query.substring(0, 100)}...`);
    
    const result = await session.run(query, params);
    return result;
  } catch (error) {
    console.error('[ERROR] Neo4j query failed:', error);
    throw new Error(`Neo4j query failed: ${error.message}`);
  } finally {
    await session.close();
  }
}

/**
 * Create or merge a node in the graph
 * @param {string} label - The node label (e.g., Person, Trait)
 * @param {object} properties - Node properties
 * @returns {Promise<object>} - The created/merged node
 */
async function mergeNode(label, properties) {
  try {
    // Convert properties object to Cypher parameter map
    const paramKeys = Object.keys(properties);
    const paramMap = {};
    
    // Generate the properties string for the MERGE clause
    const propsString = paramKeys
      .map(key => `${key}: $${key}`)
      .join(', ');
    
    // Build the full Cypher query
    const query = `
      MERGE (n:${label} {${propsString}})
      RETURN n, id(n) as nodeId
    `;
    
    // Run the query with the properties as parameters
    const result = await runQuery(query, properties);
    
    // Extract the first node from the result
    if (result.records.length > 0) {
      const record = result.records[0];
      const node = record.get('n');
      const nodeId = record.get('nodeId');
      
      return {
        id: nodeId.toString(),
        labels: node.labels,
        properties: node.properties
      };
    }
    
    throw new Error(`No node returned when creating ${label}`);
  } catch (error) {
    console.error(`[ERROR] Failed to merge node with label ${label}:`, error);
    throw new Error(`Failed to merge node: ${error.message}`);
  }
}

/**
 * Create or merge a relationship between two nodes
 * @param {object} sourceNode - Source node specification {label, properties}
 * @param {string} relationshipType - Type of relationship (e.g., HAS_TRAIT)
 * @param {object} targetNode - Target node specification {label, properties}
 * @returns {Promise<object>} - The created relationship
 */
async function mergeRelationship(sourceNode, relationshipType, targetNode) {
  try {
    // Prepare parameters
    const params = {
      sourceProps: sourceNode.properties,
      targetProps: targetNode.properties
    };
    
    // Build the Cypher query
    const query = `
      MATCH (a:${sourceNode.label})
      WHERE a.name = $sourceProps.name
      MATCH (b:${targetNode.label})
      WHERE b.name = $targetProps.name
      MERGE (a)-[r:${relationshipType}]->(b)
      RETURN a, r, b, id(r) as relId
    `;
    
    // Run the query
    const result = await runQuery(query, params);
    
    // Extract the relationship from the result
    if (result.records.length > 0) {
      const record = result.records[0];
      const rel = record.get('r');
      const relId = record.get('relId');
      
      return {
        id: relId.toString(),
        type: rel.type,
        properties: rel.properties,
        source: {
          id: record.get('a').identity.toString(),
          labels: record.get('a').labels,
          properties: record.get('a').properties
        },
        target: {
          id: record.get('b').identity.toString(),
          labels: record.get('b').labels,
          properties: record.get('b').properties
        }
      };
    }
    
    throw new Error(`No relationship returned when creating ${relationshipType}`);
  } catch (error) {
    console.error(`[ERROR] Failed to merge relationship ${relationshipType}:`, error);
    throw new Error(`Failed to merge relationship: ${error.message}`);
  }
}

/**
 * Link a PostgreSQL Thought record to its corresponding Neo4j nodes and relationships
 * @param {string} thoughtId - UUID of the PostgreSQL Thought record
 * @param {array} nodeIds - Array of Neo4j node IDs related to this thought
 * @returns {Promise<object>} - Result of the linking operation
 */
async function linkThoughtToGraphElements(thoughtId, nodeIds) {
  try {
    // Create a ThoughtReference node if it doesn't exist
    const thoughtRefQuery = `
      MERGE (t:ThoughtReference {id: $thoughtId})
      RETURN t
    `;
    
    await runQuery(thoughtRefQuery, { thoughtId });
    
    // Create REFERENCES relationships from each node to the ThoughtReference
    for (const nodeId of nodeIds) {
      const linkQuery = `
        MATCH (n) WHERE id(n) = $nodeId
        MATCH (t:ThoughtReference {id: $thoughtId})
        MERGE (n)-[r:DERIVED_FROM]->(t)
        RETURN r
      `;
      
      await runQuery(linkQuery, { nodeId: parseInt(nodeId), thoughtId });
    }
    
    return { success: true, thoughtId, linkedNodes: nodeIds.length };
  } catch (error) {
    console.error('[ERROR] Failed to link thought to graph elements:', error);
    throw new Error(`Failed to link thought to graph elements: ${error.message}`);
  }
}

/**
 * Get a subgraph surrounding a node (e.g., a person)
 * @param {string} nodeLabel - The label of the central node
 * @param {object} nodeProperties - Properties to identify the node
 * @param {number} depth - How many relationship hops to include
 * @returns {Promise<object>} - Subgraph with nodes and relationships
 */
async function getSubgraph(nodeLabel, nodeProperties, depth = 2) {
  try {
    const params = { props: nodeProperties };
    
    // Build query to get the subgraph
    const query = `
      MATCH (center:${nodeLabel})
      WHERE center.name = $props.name
      CALL apoc.path.subgraphAll(center, {maxLevel: ${depth}})
      YIELD nodes, relationships
      RETURN nodes, relationships
    `;
    
    const result = await runQuery(query, params);
    
    if (result.records.length === 0) {
      return { nodes: [], relationships: [] };
    }
    
    // Process the results
    const record = result.records[0];
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
    
    return { nodes, relationships };
  } catch (error) {
    console.error('[ERROR] Failed to get subgraph:', error);
    throw new Error(`Failed to get subgraph: ${error.message}`);
  }
}

module.exports = {
  initDriver,
  closeDriver,
  runQuery,
  mergeNode,
  mergeRelationship,
  linkThoughtToGraphElements,
  getSubgraph
}; 