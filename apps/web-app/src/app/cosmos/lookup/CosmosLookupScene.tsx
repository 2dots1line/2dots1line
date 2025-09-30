'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Graph3D } from '../../../components/cosmos/Graph3D';
import { useCosmosStore } from '../../../stores/CosmosStore';
import { cosmosService } from '../../../services/cosmosService';
import CosmosInfoPanel from '../../../components/modal/CosmosInfoPanel';
import CosmosError from '../../../components/modal/CosmosError';
import CosmosLoading from '../../../components/modal/CosmosLoading';
import CosmosNodeModal from '../../../components/modal/CosmosNodeModal';
import { EdgeControls } from '../../../components/cosmos/EdgeControls';
import { NodeLabelControls } from '../../../components/cosmos/NodeLabelControls';

interface EntityLookupState {
  entityId: string;
  isLoading: boolean;
  error: string | null;
  foundEntity: any | null;
  similarEntities: any[];
  connectedEntities: any[];
  totalEntities: number;
}

interface LookupConfig {
  semanticSimilarLimit: number;
  totalEntityLimit: number;
  graphHops: number;
  similarityThreshold: number;
  enableGraphHops: boolean;
}

const CosmosLookupScene: React.FC = () => {
  const {
    graphData,
    isLoading,
    error,
    selectedNode,
    setGraphData,
    setLoading,
    setError,
    setSelectedNode,
  } = useCosmosStore();

  // Entity lookup state
  const [lookupState, setLookupState] = useState<EntityLookupState>({
    entityId: '',
    isLoading: false,
    error: null,
    foundEntity: null,
    similarEntities: [],
    connectedEntities: [],
    totalEntities: 0,
  });

  // Lookup configuration
  const [lookupConfig, setLookupConfig] = useState<LookupConfig>({
    semanticSimilarLimit: 20,
    totalEntityLimit: 100,
    graphHops: 1,
    similarityThreshold: 0.7,
    enableGraphHops: true,
  });

  // Edge control state
  const [showEdges, setShowEdges] = useState(false);
  const [edgeOpacity, setEdgeOpacity] = useState(0.8);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [animatedEdges, setAnimatedEdges] = useState(false);
  
  // Background loading state
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [backgroundLoadError, setBackgroundLoadError] = useState<string | null>(null);

  // Background loading handlers
  const handleBackgroundLoadStart = useCallback(() => {
    setIsBackgroundLoading(true);
    setBackgroundLoadError(null);
    console.log('🔍 CosmosLookupScene: Background loading started');
  }, []);

  const handleBackgroundLoadComplete = useCallback(() => {
    setIsBackgroundLoading(false);
    setBackgroundLoadError(null);
    console.log('🔍 CosmosLookupScene: Background loading completed');
  }, []);

  const handleBackgroundLoadError = useCallback((error: Error) => {
    setIsBackgroundLoading(false);
    setBackgroundLoadError(error.message);
    console.error('🔍 CosmosLookupScene: Background loading error:', error);
  }, []);

  // Helper function to create a proper UserGraphProjection object
  const createGraphProjection = useCallback((nodes: any[], edges: any[]) => {
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: nodes.map(node => ({
        id: node.id,
        type: (node.entityType || node.type || 'Concept') as 'Concept' | 'MemoryUnit' | 'DerivedArtifact',
        label: node.title || node.label || node.id,
        position: [node.x || 0, node.y || 0, node.z || 0] as [number, number, number],
        community_id: node.community_id || 'default',
        metadata: node.metadata || {}
      })),
      edges: edges.map(edge => ({
        id: edge.id || `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'related',
        weight: edge.weight || 1,
        metadata: edge.metadata || {}
      })),
      communities: [],
      metadata: {
        dimension_reduction_algorithm: 'lookup',
        vector_dimensionality: '3d',
        semantic_similarity_threshold: 0.7,
        communities: []
      }
    };
  }, []);

  // Load initial data (empty state)
  useEffect(() => {
    console.log('🔍 CosmosLookupScene: Initializing with empty state');
    setGraphData(createGraphProjection([], []));
  }, [setGraphData, createGraphProjection]);

  // HRT-style scoring function
  const scoreEntity = useCallback((entity: any, semanticScore: number, isConnected: boolean = false): number => {
    try {
      // HRT scoring weights (from HRTParametersLoader defaults)
      const alphaSemanticSimilarity = 0.5;
      const betaRecency = 0.3;
      const gammaImportanceScore = 0.2;

      // Calculate recency score (newer entities get higher scores)
      const now = new Date();
      const createdAt = new Date(entity.created_at || entity.createdAt || now);
      
      // Validate date and calculate recency score
      let recencyScore: number;
      if (isNaN(createdAt.getTime())) {
        console.warn('🔍 CosmosLookupScene: Invalid date for entity:', entity.id, entity.created_at);
        recencyScore = 0.5; // Default recency score for invalid dates
      } else {
        const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        recencyScore = Math.exp(-0.1 * daysSinceCreation); // Decay rate of 0.1
      }

      // Calculate importance score (from entity importance or default)
      const importanceScore = entity.importance || entity.importance_score || 1.0;

      // Calculate final score
      const finalScore = 
        (alphaSemanticSimilarity * semanticScore) +
        (betaRecency * recencyScore) +
        (gammaImportanceScore * importanceScore);

      // Boost connected entities slightly
      const connectedBoost = isConnected ? 0.1 : 0;

      const result = finalScore + connectedBoost;
      
      // Validate result
      if (isNaN(result) || !isFinite(result)) {
        console.warn('🔍 CosmosLookupScene: Invalid score calculated for entity:', entity.id, { semanticScore, recencyScore, importanceScore, finalScore, connectedBoost });
        return 0.5; // Default score for invalid calculations
      }

      return result;
    } catch (error) {
      console.error('🔍 CosmosLookupScene: Error scoring entity:', entity.id, error);
      return 0.5; // Default score on error
    }
  }, []);

  // Neo4j graph traversal function - returns both connected entities and relationships
  const findConnectedEntitiesAndRelationships = useCallback(async (entityIds: string[], userId: string = 'dev-user'): Promise<{connectedEntityIds: string[], relationships: any[]}> => {
    console.log('🔍 CosmosLookupScene: Finding connected entities and relationships via Neo4j graph traversal');
    
    try {
      // First, get connected entities
      const connectedEntitiesQuery = `
        UNWIND $seedEntities AS seed 
        MATCH (startNode) 
        WHERE startNode.id = seed.id 
        CALL { 
          WITH startNode 
          MATCH p=(startNode)-[*1..${lookupConfig.graphHops}]-(relatedNode) 
          WHERE relatedNode.userId = $userId 
          RETURN DISTINCT relatedNode.id AS nodeId, labels(relatedNode)[0] AS nodeType 
          LIMIT toInteger($limit) 
        } 
        RETURN COLLECT(DISTINCT {id: nodeId, type: nodeType}) + $seedEntities AS allRelevantEntities
      `;

      const seedEntities = entityIds.map(id => ({ id, type: 'Entity' }));
      
      const connectedResponse = await fetch('http://localhost:3001/api/v1/neo4j/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cypher: connectedEntitiesQuery,
          params: {
            seedEntities,
            userId,
            limit: lookupConfig.totalEntityLimit
          }
        }),
      });

      const connectedResult = await connectedResponse.json();
      console.log('🔍 CosmosLookupScene: Neo4j connected entities result:', connectedResult);

      if (!connectedResult.success || !connectedResult.data) {
        console.warn('🔍 CosmosLookupScene: Neo4j connected entities query failed');
        return { connectedEntityIds: [], relationships: [] };
      }

      // Extract connected entity IDs
      const allEntityIds: string[] = [];
      for (const record of connectedResult.data) {
        const entities = record.allRelevantEntities || [];
        for (const entity of entities) {
          if (entity.id) {
            allEntityIds.push(entity.id);
          }
        }
      }

      const connectedEntityIds = allEntityIds.filter(id => !entityIds.includes(id));

      // Now get relationships between all entities
      const relationshipsQuery = `
        UNWIND $entityIds AS entityId
        MATCH (a)-[r]->(b)
        WHERE a.id = entityId AND b.id IN $entityIds AND a.userId = $userId AND b.userId = $userId
        RETURN a.id as source, b.id as target, type(r) as type, r.weight as weight, r.created_at as created_at
        LIMIT 100
      `;

      const relationshipsResponse = await fetch('http://localhost:3001/api/v1/neo4j/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cypher: relationshipsQuery,
          params: {
            entityIds: allEntityIds,
            userId
          }
        }),
      });

      const relationshipsResult = await relationshipsResponse.json();
      console.log('🔍 CosmosLookupScene: Neo4j relationships result:', relationshipsResult);

      const relationships = relationshipsResult.success && relationshipsResult.data ? relationshipsResult.data : [];

      console.log('🔍 CosmosLookupScene: Found connected entities and relationships:', {
        originalCount: entityIds.length,
        connectedCount: connectedEntityIds.length,
        totalEntities: allEntityIds.length,
        relationshipCount: relationships.length,
        connectedIds: connectedEntityIds.slice(0, 10), // Log first 10
        relationships: relationships.slice(0, 5), // Log first 5 relationships
        success: connectedEntityIds.length > 0 ? 'Graph hops successful!' : 'No graph connections found'
      });

      return { connectedEntityIds, relationships };
    } catch (error) {
      console.error('🔍 CosmosLookupScene: Neo4j graph traversal error:', error);
      return { connectedEntityIds: [], relationships: [] };
    }
  }, [lookupConfig.graphHops, lookupConfig.totalEntityLimit]);

  // Entity lookup function
  const handleEntityLookup = useCallback(async () => {
    if (!lookupState.entityId.trim()) {
      setLookupState(prev => ({ ...prev, error: 'Please enter an entity ID' }));
      return;
    }

    console.log('🔍 CosmosLookupScene: Starting entity lookup for:', lookupState.entityId);
    
    setLookupState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      foundEntity: null,
      similarEntities: [],
      totalEntities: 0,
    }));

    try {
      // Step 1: Get the specific entity to verify it exists
      console.log('🔍 CosmosLookupScene: Step 1 - Fetching entity from PostgreSQL');
      const entityResponse = await fetch(`http://localhost:3001/api/v1/entities/${lookupState.entityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const entityResult = await entityResponse.json();
      console.log('🔍 CosmosLookupScene: Entity API response:', entityResult);

      if (!entityResult.success || !entityResult.data?.entity) {
        throw new Error(entityResult.error || 'Failed to fetch entity from API');
      }

      const foundEntity = entityResult.data.entity;
      console.log('🔍 CosmosLookupScene: Found entity:', {
        id: foundEntity.id,
        title: foundEntity.title,
        type: foundEntity.entity_type,
        position: { x: foundEntity.position_x, y: foundEntity.position_y, z: foundEntity.position_z }
      });

      // Step 2: Find semantically similar entities using Weaviate
      console.log('🔍 CosmosLookupScene: Step 2 - Finding similar entities in Weaviate');
      const similarityResponse = await fetch('http://localhost:8080/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            {
              Get {
                UserKnowledgeItem(
                  where: {
                    path: ["entity_id"]
                    operator: Equal
                    valueString: "${lookupState.entityId}"
                  }
                  limit: 1
                ) {
                  _additional {
                    id
                  }
                  entity_id
                  title
                  content
                  entity_type
                }
              }
            }
          `
        }),
      });

      const similarityResult = await similarityResponse.json();
      console.log('🔍 CosmosLookupScene: Weaviate similarity search result:', similarityResult);

      if (!similarityResponse.ok) {
        throw new Error(`Weaviate request failed: ${similarityResponse.status} ${similarityResponse.statusText}`);
      }

      if (!similarityResult.data?.Get?.UserKnowledgeItem?.length) {
        throw new Error(`Entity "${lookupState.entityId}" not found in Weaviate. Try one of the sample IDs below.`);
      }

      const targetEntity = similarityResult.data.Get.UserKnowledgeItem[0];
      const targetId = targetEntity._additional.id;
      console.log('🔍 CosmosLookupScene: Target entity in Weaviate:', {
        weaviateId: targetId,
        title: targetEntity.title,
        entityId: targetEntity.entity_id
      });

      // Step 3: Find semantically similar entities
      console.log('🔍 CosmosLookupScene: Step 3 - Finding semantically similar entities');
      const similarEntitiesResponse = await fetch('http://localhost:8080/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            {
              Get {
                UserKnowledgeItem(
                  nearObject: {
                    id: "${targetId}"
                    distance: ${lookupConfig.similarityThreshold}
                  }
                  limit: ${lookupConfig.semanticSimilarLimit}
                ) {
                  _additional {
                    id
                    distance
                  }
                  entity_id
                  title
                  content
                  entity_type
                }
              }
            }
          `
        }),
      });

      const similarEntitiesResult = await similarEntitiesResponse.json();
      console.log('🔍 CosmosLookupScene: Similar entities result:', similarEntitiesResult);

      if (!similarEntitiesResponse.ok) {
        throw new Error(`Weaviate similar entities request failed: ${similarEntitiesResponse.status} ${similarEntitiesResponse.statusText}`);
      }

      if (!similarEntitiesResult.data?.Get?.UserKnowledgeItem?.length) {
        throw new Error('No semantically similar entities found in Weaviate');
      }

      const similarEntities = similarEntitiesResult.data.Get.UserKnowledgeItem;
      const semanticEntityIds = similarEntities.map((entity: any) => entity.entity_id);
      
      console.log('🔍 CosmosLookupScene: Found similar entities:', {
        targetEntity: foundEntity.title,
        similarCount: similarEntities.length,
        entityIds: semanticEntityIds.slice(0, 5), // Log first 5 IDs
        similarEntities: similarEntities.slice(0, 3).map((e: any) => ({ 
          title: e.title, 
          distance: e._additional.distance,
          entity_id: e.entity_id 
        }))
      });

      // Step 4: Find connected entities and relationships via Neo4j graph traversal (if enabled)
      let connectedEntityIds: string[] = [];
      let neo4jRelationships: any[] = [];
      if (lookupConfig.enableGraphHops) {
        console.log('🔍 CosmosLookupScene: Step 4 - Finding connected entities and relationships via Neo4j graph traversal');
        const graphResult = await findConnectedEntitiesAndRelationships(semanticEntityIds);
        connectedEntityIds = graphResult.connectedEntityIds;
        neo4jRelationships = graphResult.relationships;
      } else {
        console.log('🔍 CosmosLookupScene: Step 4 - Skipping graph traversal (disabled)');
      }

      // Step 5: Combine all entity IDs and fetch full entity data
      const allEntityIds = [...new Set([...semanticEntityIds, ...connectedEntityIds])];
      console.log('🔍 CosmosLookupScene: Step 5 - Fetching full entity data from PostgreSQL', {
        semanticCount: semanticEntityIds.length,
        connectedCount: connectedEntityIds.length,
        totalCount: allEntityIds.length,
        allIds: allEntityIds.slice(0, 10) // Log first 10 IDs
      });

      const batchResponse = await fetch('http://localhost:3001/api/v1/cosmos/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setFilters: {
            nodeIds: allEntityIds
          },
          options: {
            limit: lookupConfig.totalEntityLimit,
            includeEdges: true,
          },
        }),
      });

      const batchResult = await batchResponse.json();
      console.log('🔍 CosmosLookupScene: Batch API response:', {
        success: batchResult.success,
        nodeCount: batchResult.data?.nodes?.length || 0,
        edgeCount: batchResult.data?.edges?.length || 0,
        firstNode: batchResult.data?.nodes?.[0] ? {
          id: batchResult.data.nodes[0].id,
          title: batchResult.data.nodes[0].title,
          position: { x: batchResult.data.nodes[0].position_x, y: batchResult.data.nodes[0].position_y, z: batchResult.data.nodes[0].position_z }
        } : null
      });

      if (!batchResult.success || !batchResult.data?.nodes) {
        throw new Error('Failed to fetch similar entities from API');
      }

      // Step 6: Score and rank entities using HRT-style scoring
      console.log('🔍 CosmosLookupScene: Step 6 - Scoring and ranking entities');
      const scoredEntities = batchResult.data.nodes.map((entity: any) => {
        try {
          // Find semantic similarity score for this entity
          const semanticEntity = similarEntities.find((se: any) => se.entity_id === entity.id);
          const semanticScore = semanticEntity ? (1.0 - semanticEntity._additional.distance) : 0;
          
          // Check if this entity is connected via graph hops
          const isConnected = connectedEntityIds.includes(entity.id);
          
          // Calculate final score
          const finalScore = scoreEntity(entity, semanticScore, isConnected);
          
          // Validate finalScore
          if (finalScore === undefined || finalScore === null || isNaN(finalScore)) {
            console.warn('🔍 CosmosLookupScene: Invalid finalScore for entity:', entity.id, { finalScore, semanticScore, isConnected });
            return {
              ...entity,
              semanticScore,
              isConnected,
              finalScore: 0.5, // Default score
              scoreBreakdown: {
                semantic: semanticScore,
                recency: 0.5,
                importance: entity.importance || entity.importance_score || 1.0,
                connected: isConnected ? 0.1 : 0
              }
            };
          }
          
          return {
            ...entity,
            semanticScore,
            isConnected,
            finalScore,
            scoreBreakdown: {
              semantic: semanticScore,
              recency: Math.exp(-0.1 * ((new Date().getTime() - new Date(entity.created_at || entity.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24))),
              importance: entity.importance || entity.importance_score || 1.0,
              connected: isConnected ? 0.1 : 0
            }
          };
        } catch (error) {
          console.error('🔍 CosmosLookupScene: Error scoring entity:', entity.id, error);
          return {
            ...entity,
            semanticScore: 0,
            isConnected: false,
            finalScore: 0.5, // Default score
            scoreBreakdown: {
              semantic: 0,
              recency: 0.5,
              importance: entity.importance || entity.importance_score || 1.0,
              connected: 0
            }
          };
        }
      });

      // Sort by final score and limit to totalEntityLimit
      const rankedEntities = scoredEntities
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
        .slice(0, lookupConfig.totalEntityLimit);

      console.log('🔍 CosmosLookupScene: Entity scoring completed:', {
        totalScored: scoredEntities.length,
        topRanked: rankedEntities.length,
        topScores: rankedEntities.slice(0, 5).map((e: any) => ({
          id: e.id,
          title: e.title,
          finalScore: e.finalScore.toFixed(3),
          semanticScore: e.semanticScore.toFixed(3),
          isConnected: e.isConnected
        }))
      });

      // Step 7: Update the graph data with the ranked entities and Neo4j relationships
      console.log('🔍 CosmosLookupScene: Step 7 - Updating graph data with ranked entities and relationships');
      
      // Combine PostgreSQL edges with Neo4j relationships
      const allEdges = [
        ...(batchResult.data.edges || []),
        ...neo4jRelationships.map((rel: any) => ({
          id: `${rel.source}-${rel.target}`,
          source: rel.source,
          target: rel.target,
          type: rel.type || 'related',
          weight: rel.weight || 1.0,
          created_at: rel.created_at
        }))
      ];

      const newGraphData = createGraphProjection(rankedEntities, allEdges);
      setGraphData(newGraphData);
      console.log('🔍 CosmosLookupScene: Graph data updated:', {
        nodeCount: newGraphData.nodes.length,
        edgeCount: newGraphData.edges.length,
        postgresEdges: batchResult.data.edges?.length || 0,
        neo4jRelationships: neo4jRelationships.length,
        nodes: newGraphData.nodes.slice(0, 3).map((n: any) => ({ id: n.id, title: n.title, score: n.finalScore.toFixed(3) })),
        edges: newGraphData.edges.slice(0, 3).map((e: any) => ({ id: e.id, source: e.source, target: e.target, type: e.type }))
      });

      // Step 8: Update lookup state
      setLookupState(prev => ({
        ...prev,
        isLoading: false,
        foundEntity: foundEntity,
        similarEntities: similarEntities,
        connectedEntities: connectedEntityIds.map(id => ({ id, type: 'connected' })),
        totalEntities: rankedEntities.length,
      }));

      console.log('🔍 CosmosLookupScene: Entity lookup completed successfully:', {
        targetEntity: foundEntity.title,
        semanticSimilarCount: similarEntities.length,
        connectedCount: connectedEntityIds.length,
        totalRankedEntities: rankedEntities.length,
        totalEdges: allEdges.length,
        neo4jRelationships: neo4jRelationships.length,
        config: lookupConfig
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('🔍 CosmosLookupScene: Entity lookup failed:', errorMessage);
      
      setLookupState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [lookupState.entityId, setGraphData, lookupConfig, findConnectedEntitiesAndRelationships, scoreEntity, createGraphProjection]);

  // Clear entity lookup
  const clearEntityLookup = useCallback(() => {
    console.log('🔍 CosmosLookupScene: Clearing entity lookup');
    setLookupState({
      entityId: '',
      isLoading: false,
      error: null,
      foundEntity: null,
      similarEntities: [],
      connectedEntities: [],
      totalEntities: 0,
    });
    setGraphData(createGraphProjection([], []));
  }, [setGraphData, createGraphProjection]);

  // Handle input change
  const handleEntityIdChange = useCallback((value: string) => {
    setLookupState(prev => ({ ...prev, entityId: value }));
  }, []);

  const POSITION_SCALE = 10;
  
  // Process graph data for display
  const safeGraphData = {
    ...graphData,
    nodes: (graphData.nodes ?? []).map((node, index) => {
      const nodeAny = node as any;
      const x = nodeAny.position_x || nodeAny.x || 0;
      const y = nodeAny.position_y || nodeAny.y || 0;
      const z = nodeAny.position_z || nodeAny.z || 0;
      
      const scaledNode = {
        ...node,
        x: x * POSITION_SCALE,
        y: y * POSITION_SCALE,
        z: z * POSITION_SCALE,
        name: nodeAny.title ?? nodeAny.label ?? node.id,
        type: node.type,
        properties: {
          title: nodeAny.title ?? nodeAny.label ?? node.id,
          type: node.type,
          content: nodeAny.content || '',
          importance: nodeAny.importance || 1,
          createdAt: nodeAny.metadata?.createdAt,
          lastUpdated: nodeAny.metadata?.lastUpdated
        }
      };
      
      // Debug logging for first few nodes
      if (index < 3) {
        console.log(`🔍 CosmosLookupScene: Node ${index}:`, {
          id: node.id,
          title: nodeAny.title,
          original: { x, y, z },
          scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z },
        });
      }
      
      return scaledNode;
    }),
    edges: (graphData.edges ?? []).map(edge => ({
      ...edge,
      source: String(edge.source),
      target: String(edge.target),
      weight: edge.weight || 1.0,
      color: getEdgeColor(edge.type),
    })),
    links: (graphData.edges ?? []).map(edge => ({
      ...edge,
      source: String(edge.source),
      target: String(edge.target),
      weight: edge.weight || 1.0,
      color: getEdgeColor(edge.type),
    })),
  };

  console.log('🔍 CosmosLookupScene: Current graph data:', {
    nodeCount: safeGraphData.nodes.length,
    edgeCount: safeGraphData.edges.length,
    showEdges,
    edgeOpacity,
    edgeWidth,
    animatedEdges
  });

  return (
    <div className="w-full h-full relative">
      {/* Entity Lookup Panel */}
      <div className="absolute top-4 left-4 z-10 w-96">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 text-white">
          <h3 className="text-lg font-semibold mb-3">🔍 Entity Lookup</h3>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="entityId" className="block text-sm font-medium text-white/70 mb-1">
                Entity ID
              </label>
              <input
                id="entityId"
                type="text"
                value={lookupState.entityId}
                onChange={(e) => handleEntityIdChange(e.target.value)}
                placeholder="Enter entity ID..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Configuration Panel */}
            <div className="border-t border-white/20 pt-3">
              <h4 className="text-sm font-medium text-white/80 mb-2">Configuration</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-white/60 mb-1">Semantic Similar Limit</label>
                  <input
                    type="number"
                    value={lookupConfig.semanticSimilarLimit}
                    onChange={(e) => setLookupConfig(prev => ({ ...prev, semanticSimilarLimit: parseInt(e.target.value) || 20 }))}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 mb-1">Total Entity Limit</label>
                  <input
                    type="number"
                    value={lookupConfig.totalEntityLimit}
                    onChange={(e) => setLookupConfig(prev => ({ ...prev, totalEntityLimit: parseInt(e.target.value) || 100 }))}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    min="1"
                    max="500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 mb-1">Graph Hops</label>
                  <input
                    type="number"
                    value={lookupConfig.graphHops}
                    onChange={(e) => setLookupConfig(prev => ({ ...prev, graphHops: parseInt(e.target.value) || 1 }))}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    min="1"
                    max="3"
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 mb-1">Similarity Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lookupConfig.similarityThreshold}
                    onChange={(e) => setLookupConfig(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) || 0.7 }))}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    min="0.1"
                    max="1.0"
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <label className="flex items-center space-x-2 text-white/70 text-xs">
                  <input
                    type="checkbox"
                    checked={lookupConfig.enableGraphHops}
                    onChange={(e) => setLookupConfig(prev => ({ ...prev, enableGraphHops: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Enable Graph Hops (Neo4j)</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleEntityLookup}
                disabled={lookupState.isLoading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {lookupState.isLoading ? 'Finding similar...' : 'Show Entity + Similar'}
              </button>
              
              <button
                onClick={clearEntityLookup}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Clear
              </button>
            </div>

            {lookupState.error && (
              <div className="p-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-md text-sm">
                {lookupState.error}
              </div>
            )}

            {lookupState.foundEntity && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-md">
                <h4 className="font-semibold text-green-300 mb-2">Found Entity + Similar + Connected:</h4>
                <div className="space-y-1 text-xs text-white/80">
                  <div><strong>Title:</strong> {lookupState.foundEntity.title}</div>
                  <div><strong>Type:</strong> {lookupState.foundEntity.entity_type} / {lookupState.foundEntity.type}</div>
                  <div><strong>Position:</strong> ({lookupState.foundEntity.position_x?.toFixed(2)}, {lookupState.foundEntity.position_y?.toFixed(2)}, {lookupState.foundEntity.position_z?.toFixed(2)})</div>
                  <div className="text-green-400 mt-2">
                    <strong>Results:</strong> {lookupState.totalEntities} total entities
                  </div>
                  <div className="text-blue-400">
                    • {lookupState.similarEntities.length} semantically similar (distance ≤ {lookupConfig.similarityThreshold})
                  </div>
                  {lookupConfig.enableGraphHops && (
                    <div className="text-purple-400">
                      • {lookupState.connectedEntities.length} connected via {lookupConfig.graphHops} graph hop(s)
                      {lookupState.connectedEntities.length === 0 && (
                        <span className="text-yellow-400 ml-1">(No graph connections found)</span>
                      )}
                    </div>
                  )}
                  <div className="text-yellow-400">
                    • Ranked by HRT-style scoring (semantic + recency + importance)
                  </div>
                  <div className="text-cyan-400">
                    • {safeGraphData.edges.length} total edges/relationships found
                  </div>
                </div>
              </div>
            )}

            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-md">
              <h4 className="font-semibold text-blue-300 mb-1 text-sm">Sample IDs (High Connectivity):</h4>
              <div className="text-xs text-white/70 space-y-1">
                <div>• <span className="text-yellow-400 font-semibold">606ba7ba-031e-4fa5-b88d-3dcccb01bf1b</span> (2dots1line - 9 edges!)</div>
                <div>• <span className="text-green-400 font-semibold">1a30fec7-7dfe-4a8c-97c2-31f5e066e075</span> (Home Cooking - 6 edges)</div>
                <div>• 620eff6f-da61-4795-b1bf-119a05712ba0 (McKinsey - 4 edges)</div>
              </div>
              <div className="text-xs text-white/50 mt-2">
                💡 Try the highlighted IDs for rich graph connections and edges
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-3 text-white">
          <button
            onClick={() => window.location.href = '/cosmos'}
            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 text-gray-400 rounded text-sm font-medium transition-colors"
          >
            ← Back to Legacy
          </button>
        </div>
      </div>

      <Graph3D
        graphData={safeGraphData}
        onNodeClick={(node) => setSelectedNode(node)}
        showEdges={showEdges}
        edgeOpacity={edgeOpacity}
        edgeWidth={edgeWidth}
        animatedEdges={animatedEdges}
        modalOpen={!!selectedNode}
        onBackgroundLoadStart={handleBackgroundLoadStart}
        onBackgroundLoadComplete={handleBackgroundLoadComplete}
        onBackgroundLoadError={handleBackgroundLoadError}
        isSearchResult={true} // Enable bright star textures for search results
      />
      
      {/* Edge Controls */}
      <div className="absolute bottom-4 right-4 z-10">
        <EdgeControls
          showEdges={showEdges}
          edgeOpacity={edgeOpacity}
          edgeWidth={edgeWidth}
          animatedEdges={animatedEdges}
          onToggleEdges={setShowEdges}
          onOpacityChange={setEdgeOpacity}
          onWidthChange={setEdgeWidth}
          onAnimatedChange={setAnimatedEdges}
        />
      </div>
      
      {/* Node Label Controls */}
      <NodeLabelControls />
      
      <CosmosInfoPanel />
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
      
      {/* Background Loading Overlay */}
      {isBackgroundLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/90 text-sm">Loading cosmic background...</p>
            <p className="text-white/60 text-xs mt-2">This may take a moment on first visit</p>
          </div>
        </div>
      )}
      
      {/* Background Error Overlay */}
      {backgroundLoadError && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-6 text-center max-w-md">
            <div className="text-red-400 text-2xl mb-4">⚠️</div>
            <p className="text-white/90 text-sm mb-2">Failed to load cosmic background</p>
            <p className="text-white/60 text-xs mb-4">{backgroundLoadError}</p>
            <button 
              onClick={() => {
                setBackgroundLoadError(null);
                window.location.reload();
              }}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get edge color based on type
function getEdgeColor(type: string): string {
  switch (type) {
    case 'related':
      return '#00ff88';
    case 'temporal':
      return '#ff8800';
    case 'semantic':
      return '#0088ff';
    case 'hierarchical':
      return '#ff0088';
    case 'causal':
      return '#ffff00';
    case 'similar':
      return '#00ffff';
    case 'opposite':
      return '#ff0080';
    default:
      return '#ffffff';
  }
}

export default CosmosLookupScene;
