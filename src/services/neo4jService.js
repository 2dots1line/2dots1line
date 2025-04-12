/**
 * Neo4j Database Service
 * Provides functionality to interact with the Neo4j graph database
 */

const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver = null;
let initialized = false;

/**
 * Initialize Neo4j connection
 */
async function init() {
  if (initialized) {
    console.log('Neo4j already initialized');
    return;
  }

  try {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    await driver.verifyConnectivity();
    initialized = true;
    console.log('Neo4j connection established successfully');
  } catch (error) {
    console.error('Error initializing Neo4j:', error);
    throw error;
  }
}

/**
 * Get a Neo4j session
 */
function getSession() {
  if (!initialized || !driver) {
    throw new Error('Neo4j driver not initialized. Call init() first.');
  }
  return driver.session();
}

/**
 * Close Neo4j connection
 */
async function close() {
  if (driver) {
    await driver.close();
    driver = null;
    initialized = false;
    console.log('Neo4j connection closed');
  }
}

/**
 * Create an entity node in Neo4j
 * @param {string} name - Entity name
 * @param {string} category - Entity category (becomes the node label)
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created entity
 */
async function createEntity(name, category, properties = {}) {
  if (!name || !category) {
    throw new Error('Entity name and category are required');
  }
  
  // Clean up the category name to ensure it's a valid Neo4j label
  const nodeLabel = category.trim().replace(/\s+/g, '');
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MERGE (e:${nodeLabel} {name: $name})
        ON CREATE SET e.createdAt = datetime()
        SET e += $properties
        RETURN e
        `,
        { name, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create ${nodeLabel} entity: ${name}`);
    }
    
    return {
      ...result.records[0].get('e').properties,
      category: nodeLabel
    };
  } catch (error) {
    console.error(`Error creating ${nodeLabel} entity:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Create a relationship between two entities
 * @param {string} sourceName - Source entity name
 * @param {string} targetName - Target entity name
 * @param {string} type - Relationship type
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created relationship
 */
async function createRelationship(sourceName, targetName, type, properties = {}) {
  if (!sourceName || !targetName || !type) {
    throw new Error('Source entity, target entity, and relationship type are required');
  }
  
  const session = getSession();
  try {
    // First try to find the source and target nodes with any label
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (source {name: $sourceName})
        MATCH (target {name: $targetName})
        MERGE (source)-[r:${type}]->(target)
        ON CREATE SET r.createdAt = datetime()
        SET r += $properties
        RETURN source, r, target, labels(source) as sourceLabels, labels(target) as targetLabels
        `,
        { sourceName, targetName, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create relationship from ${sourceName} to ${targetName}`);
    }
    
    return {
      source: {
        ...result.records[0].get('source').properties,
        labels: result.records[0].get('sourceLabels')
      },
      relationship: {
        type: type,
        ...result.records[0].get('r').properties
      },
      target: {
        ...result.records[0].get('target').properties,
        labels: result.records[0].get('targetLabels')
      }
    };
  } catch (error) {
    console.error(`Error creating relationship from ${sourceName} to ${targetName}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Query entities by name (with fuzzy matching)
 * @param {string} namePattern - Name pattern to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Matching entities
 */
async function queryEntitiesByName(namePattern, limit = 10) {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => {
      return tx.run(
        `
        MATCH (e)
        WHERE e.name CONTAINS $namePattern
        RETURN e, labels(e) as labels
        LIMIT $limit
        `,
        { namePattern, limit: neo4j.int(limit) }
      );
    });
    
    return result.records.map(record => ({
      ...record.get('e').properties,
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get neighborhood of an entity
 * @param {string} entityName - Name of the entity
 * @param {number} depth - Depth of neighborhood exploration
 * @returns {Promise<Object>} Entity neighborhood data
 */
async function getEntityNeighborhood(entityName, depth = 1) {
  const session = getSession();
  try {
    const result = await session.executeRead(tx => {
      return tx.run(
        `
        MATCH (e {name: $entityName})
        OPTIONAL MATCH path = (e)-[r*1..${depth}]-(connected)
        RETURN e AS entity, 
               labels(e) as entityLabels,
               collect(DISTINCT connected) AS connected, 
               collect(DISTINCT labels(connected)) AS connectedLabels,
               collect(DISTINCT r) AS relationships
        `,
        { entityName }
      );
    });
    
    if (result.records.length === 0) {
      return { entity: null, connections: [] };
    }
    
    const record = result.records[0];
    const entity = {
      ...record.get('entity').properties,
      labels: record.get('entityLabels')
    };
    
    const connected = record.get('connected');
    const connectedLabels = record.get('connectedLabels');
    
    const connections = connected.map((node, index) => ({
      ...node.properties,
      labels: connectedLabels[index]
    }));
    
    const relationships = record.get('relationships').flat().map(rel => ({
      type: rel.type,
      properties: rel.properties
    }));
    
    return {
      entity,
      connections,
      relationships
    };
  } finally {
    await session.close();
  }
}

/**
 * Delete entities and relationships by interactionId
 * @param {string} interactionId - ID of the interaction to delete
 * @returns {Promise<Object>} Results of the deletion
 */
async function deleteByInteractionId(interactionId) {
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (n)
        WHERE n.sourceInteractionId = $interactionId
        DETACH DELETE n
        RETURN count(n) AS deletedCount
        `,
        { interactionId }
      );
    });
    
    return {
      deletedCount: result.records[0].get('deletedCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * Create a custom entity node directly
 * @param {string} label - The entity label (node type)
 * @param {string} name - Entity name
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created entity
 */
async function createCustomEntity(label, name, properties = {}) {
  if (!name || !label) {
    throw new Error('Entity name and label are required');
  }
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MERGE (e:${label} {name: $name})
        ON CREATE SET e.createdAt = datetime()
        SET e += $properties
        RETURN e, labels(e) as labels
        `,
        { name, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create ${label} entity: ${name}`);
    }
    
    return {
      ...result.records[0].get('e').properties,
      labels: result.records[0].get('labels')
    };
  } finally {
    await session.close();
  }
}

/**
 * Create a custom relationship with a specific type
 * @param {string} sourceName - Source entity name 
 * @param {string} targetName - Target entity name
 * @param {string} type - Relationship type
 * @param {Object} properties - Additional properties
 * @returns {Promise<Object>} Created relationship
 */
async function createCustomRelationship(sourceName, targetName, type, properties = {}) {
  if (!sourceName || !targetName || !type) {
    throw new Error('Source name, target name, and relationship type are required');
  }
  
  const session = getSession();
  try {
    const result = await session.executeWrite(tx => {
      return tx.run(
        `
        MATCH (source {name: $sourceName})
        MATCH (target {name: $targetName})
        MERGE (source)-[r:${type}]->(target)
        ON CREATE SET r.createdAt = datetime(), r.manuallyCreated = true
        SET r += $properties
        RETURN source, r, target, labels(source) as sourceLabels, labels(target) as targetLabels
        `,
        { sourceName, targetName, properties }
      );
    });
    
    if (result.records.length === 0) {
      throw new Error(`Failed to create relationship from ${sourceName} to ${targetName}`);
    }
    
    return {
      source: {
        ...result.records[0].get('source').properties,
        labels: result.records[0].get('sourceLabels')
      },
      relationship: {
        type: type,
        ...result.records[0].get('r').properties
      },
      target: {
        ...result.records[0].get('target').properties,
        labels: result.records[0].get('targetLabels')
      }
    };
  } finally {
    await session.close();
  }
}

module.exports = {
  init,
  close,
  createEntity,
  createRelationship,
  queryEntitiesByName,
  getEntityNeighborhood,
  deleteByInteractionId,
  createCustomEntity,
  createCustomRelationship
}; 