import { DatabaseService } from '../DatabaseService';
import { Driver, Session, Record as Neo4jRecord, Integer } from 'neo4j-driver';
import { v5 as uuidv5 } from 'uuid';

export interface GraphNode {
  entity_id: string;
  labels: string[];
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphStructure {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class Neo4jService {
  private driver: Driver;

  constructor(databaseService: DatabaseService) {
    this.driver = databaseService.neo4j;
  }

  /**
   * Executes a parameterized read query within a managed session.
   */
  private async runReadQuery(cypher: string, params: Record<string, any> = {}): Promise<Neo4jRecord[]> {
    const session: Session = this.driver.session({ defaultAccessMode: 'READ' });
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } catch (error) {
      console.error(`Neo4j Read Query Failed: ${cypher}`, { params, error });
      throw error;
    } finally {
      await session.close();
    }
  }
  
  /**
   * Get all relationships for a user
   */
  public async getRelationships(userId: string): Promise<any[]> {
    const cypher = `
      MATCH (a)-[r]->(b) 
      WHERE a.user_id = $userId AND b.user_id = $userId
      RETURN a.entity_id as source, b.entity_id as target, type(r) as type, 
             r.weight as weight, r.created_at as created_at
      ORDER BY r.created_at DESC
    `;
    
    try {
      const records = await this.runReadQuery(cypher, { userId });
      return records.map(record => ({
        source: record.get('source'),
        target: record.get('target'),
        type: record.get('type'),
        weight: record.get('weight') || 1.0,
        created_at: record.get('created_at')
      }));
    } catch (error) {
      console.error('Failed to fetch relationships from Neo4j:', error);
      return [];
    }
  }

  /**
   * Executes a parameterized write query within a managed transaction.
   */
  public async runWriteTransaction(cypher: string, params: Record<string, any> = {}): Promise<any[]> {
    const session: Session = this.driver.session({ defaultAccessMode: 'WRITE' });
    try {
      return await session.executeWrite(async tx => {
        const result = await tx.run(cypher, params);
        return result.records.map(r => r.toObject());
      });
    } catch (error) {
      console.error(`Neo4j Write Transaction Failed: ${cypher}`, { params, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Fetches the complete graph structure for a user, needed by GraphProjectionWorker.
   * This implementation handles the complex mapping from Neo4j internal IDs to external UUIDs.
   * 
   * IMPORTANT: Only fetches nodes with status 'active' or NULL to exclude merged/archived concepts.
   */
  public async fetchFullGraphStructure(userId: string): Promise<GraphStructure> {
    const cypher = `
      MATCH (n) WHERE n.user_id = $userId AND (n.status = 'active' OR n.status IS NULL)
      OPTIONAL MATCH (n)-[r]->(m) WHERE m.user_id = $userId AND (m.status = 'active' OR m.status IS NULL)
      RETURN n, r, m, 
             id(n) as nId, 
             id(m) as mId,
             n.entity_id as nEntityId,
             m.entity_id as mEntityId
    `;
    
    const records = await this.runReadQuery(cypher, { userId });

    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    const internalToExternalId = new Map<string, string>();

    // First pass: collect all nodes and build ID mapping
    records.forEach(record => {
      const nodeN = record.get('n');
      const nodeM = record.get('m');
      const nId = record.get('nId');
      const mId = record.get('mId');
      const nEntityId = record.get('nEntityId');
      const mEntityId = record.get('mEntityId');

      if (nodeN && nEntityId) {
        const internalId = nId instanceof Integer ? nId.toString() : nId.toString();
        internalToExternalId.set(internalId, nEntityId);
        
        if (!nodes.has(nEntityId)) {
          nodes.set(nEntityId, {
            entity_id: nEntityId,
            labels: nodeN.labels,
            properties: this.cleanProperties(nodeN.properties)
          });
        }
      }

      if (nodeM && mEntityId) {
        const internalId = mId instanceof Integer ? mId.toString() : mId.toString();
        internalToExternalId.set(internalId, mEntityId);
        
        if (!nodes.has(mEntityId)) {
          nodes.set(mEntityId, {
            entity_id: mEntityId,
            labels: nodeM.labels,
            properties: this.cleanProperties(nodeM.properties)
          });
        }
      }
    });

    // Second pass: collect relationships using the ID mapping
    records.forEach(record => {
      const relR = record.get('r');
      if (relR) {
        const startInternalId = relR.start instanceof Integer ? relR.start.toString() : relR.start.toString();
        const endInternalId = relR.end instanceof Integer ? relR.end.toString() : relR.end.toString();
        const sourceId = internalToExternalId.get(startInternalId);
        const targetId = internalToExternalId.get(endInternalId);
        
        if (sourceId && targetId) {
          const relationshipId = relR.identity instanceof Integer ? relR.identity.toString() : relR.identity.toString();
          
          if (!edges.has(relationshipId)) {
            edges.set(relationshipId, {
              id: relationshipId,
              source: sourceId,
              target: targetId,
              type: relR.type,
              properties: this.cleanProperties(relR.properties)
            });
          }
        }
      }
    });
    
    return { 
      nodes: Array.from(nodes.values()), 
      edges: Array.from(edges.values()) 
    };
  }

  /**
   * Creates or updates a knowledge entity node in the graph.
   */
  public async upsertKnowledgeEntity(entityData: {
    id: string;
    userId: string;
    type: string;
    properties: Record<string, any>;
  }): Promise<void> {
    const cypher = `
      MERGE (n:KnowledgeEntity {id: $id, userId: $userId})
      SET n.type = $type, n.updatedAt = datetime()
      SET n += $properties
      RETURN n
    `;
    
    await this.runWriteTransaction(cypher, {
      id: entityData.id,
      userId: entityData.userId,
      type: entityData.type,
      properties: entityData.properties
    });
  }

  /**
   * Creates a relationship between two knowledge entities.
   */
  public async createRelationship(relationshipData: {
    sourceId: string;
    targetId: string;
    userId: string;
    type: string;
    properties?: Record<string, any>;
  }): Promise<void> {
    const cypher = `
      MATCH (source:KnowledgeEntity {id: $sourceId, userId: $userId})
      MATCH (target:KnowledgeEntity {id: $targetId, userId: $userId})
      MERGE (source)-[r:\`${relationshipData.type}\`]->(target)
      SET r.createdAt = COALESCE(r.createdAt, datetime())
      SET r.updatedAt = datetime()
      ${relationshipData.properties ? 'SET r += $properties' : ''}
      RETURN r
    `;
    
    await this.runWriteTransaction(cypher, {
      sourceId: relationshipData.sourceId,
      targetId: relationshipData.targetId,
      userId: relationshipData.userId,
      properties: relationshipData.properties || {}
    });
  }

  /**
   * Finds entities by their semantic properties for memory retrieval.
   */
  public async findEntitiesBySemanticQuery(
    userId: string, 
    searchTerms: string[], 
    limit: number = 10
  ): Promise<GraphNode[]> {
    // Build a flexible search query that looks for entities containing any of the search terms
    const searchConditions = searchTerms.map((_, index) => 
      `toLower(n.title) CONTAINS toLower($term${index}) OR toLower(n.content) CONTAINS toLower($term${index})`
    ).join(' OR ');
    
    const cypher = `
      MATCH (n) WHERE n.userId = $userId AND (${searchConditions})
      RETURN n, id(n) as nodeId
      ORDER BY n.updatedAt DESC
      LIMIT $limit
    `;
    
    const params: Record<string, any> = { userId, limit };
    searchTerms.forEach((term, index) => {
      params[`term${index}`] = term;
    });
    
    const records = await this.runReadQuery(cypher, params);
    
    return records.map(record => {
      const node = record.get('n');
      const nodeId = record.get('nodeId');
      const externalId = node.properties.id || node.properties.muid || (nodeId instanceof Integer ? nodeId.toString() : nodeId.toString());
      
      return {
        entity_id: externalId,
        labels: node.labels,
        properties: this.cleanProperties(node.properties)
      };
    });
  }

  /**
   * V11.0: Find specific entities by their IDs (optimized for linear transformation)
   */
  public async findEntitiesByIds(userId: string, entityIds: string[]): Promise<GraphNode[]> {
    if (entityIds.length === 0) {
      return [];
    }

    const cypher = `
      MATCH (n) 
      WHERE n.userId = $userId AND n.entity_id IN $entityIds
      RETURN n.entity_id as entity_id, labels(n) as labels, properties(n) as properties
    `;

    const records = await this.runReadQuery(cypher, { 
      userId, 
      entityIds 
    });

    return records.map(record => ({
      entity_id: record.get('entity_id'),
      labels: record.get('labels'),
      properties: this.cleanProperties(record.get('properties'))
    }));
  }

  /**
   * Gets node statistics for a user's graph.
   */
  public async getGraphStatistics(userId: string): Promise<{
    nodeCount: number;
    relationshipCount: number;
    nodeTypes: Record<string, number>;
  }> {
    const nodeCountQuery = `
      MATCH (n) WHERE n.userId = $userId
      RETURN count(n) as nodeCount, labels(n) as nodeLabels
    `;
    
    const relationshipCountQuery = `
      MATCH (n)-[r]->(m) WHERE n.userId = $userId AND m.userId = $userId
      RETURN count(r) as relationshipCount
    `;
    
    const [nodeRecords, relationshipRecords] = await Promise.all([
      this.runReadQuery(nodeCountQuery, { userId }),
      this.runReadQuery(relationshipCountQuery, { userId })
    ]);
    
    const nodeTypes: Record<string, number> = {};
    let totalNodes = 0;
    
    nodeRecords.forEach(record => {
      const count = record.get('nodeCount').toNumber();
      const labels = record.get('nodeLabels') as string[];
      totalNodes += count;
      
      labels.forEach(label => {
        nodeTypes[label] = (nodeTypes[label] || 0) + count;
      });
    });
    
    const relationshipCount = relationshipRecords.length > 0 
      ? relationshipRecords[0].get('relationshipCount').toNumber() 
      : 0;
    
    return {
      nodeCount: totalNodes,
      relationshipCount,
      nodeTypes
    };
  }

  /**
   * Cleans Neo4j properties by converting Neo4j types to JavaScript types.
   */
  private cleanProperties(properties: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (value instanceof Integer) {
        cleaned[key] = value.toNumber();
      } else if (value && typeof value === 'object' && value.constructor.name === 'DateTime') {
        cleaned[key] = value.toString();
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * V11.0: Gets real-time connection count for a specific node
   * Used by API Gateway for on-demand UI queries (per tech lead directive)
   */
  public async getNodeMetrics(userId: string, nodeId: string): Promise<{ connectionCount: number }> {
    const cypher = `
      MATCH (n) WHERE (n.id = $nodeId OR n.muid = $nodeId OR n.concept_id = $nodeId) AND n.userId = $userId
      RETURN apoc.node.degree(n) AS connectionCount
    `;
    
    const records = await this.runReadQuery(cypher, { userId, nodeId });
    
    if (records.length === 0) {
      throw new Error('Node not found');
    }

    return {
      connectionCount: records[0].get('connectionCount').toNumber(),
    };
  }

  /**
   * V11.0: Gets connection counts for all nodes for a user
   * Used by InsightEngine for analytical purposes (per tech lead directive)
   */
  public async compileNodeMetrics(userId: string): Promise<Array<{ nodeId: string; connectionCount: number }>> {
    const cypher = `
      MATCH (n) WHERE n.userId = $userId AND (n:Concept OR n:MemoryUnit)
      WITH n, apoc.node.degree(n) AS connectionCount
      RETURN COALESCE(n.id, n.muid, n.concept_id) as nodeId, connectionCount
    `;
    
    const records = await this.runReadQuery(cypher, { userId });

    return records.map(record => ({
      nodeId: record.get('nodeId'),
      connectionCount: record.get('connectionCount').toNumber(),
    }));
  }

  /**
   * Health check for Neo4j connection.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const records = await this.runReadQuery('RETURN 1 as test');
      return records.length > 0 && records[0].get('test') === 1;
    } catch (error) {
      console.error('Neo4j health check failed:', error);
      return false;
    }
  }
} 