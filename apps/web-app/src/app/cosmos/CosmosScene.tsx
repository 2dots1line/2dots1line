'use client';

import React, { useEffect, useState } from 'react';
import { Graph3D } from '@2dots1line/ui-components';
import { useCosmosStore } from '../../stores/CosmosStore';
import { cosmosService } from '../../services/cosmosService';
import CosmosInfoPanel from '../../components/modal/CosmosInfoPanel';
import CosmosError from '../../components/modal/CosmosError';
import CosmosLoading from '../../components/modal/CosmosLoading';
import CosmosNodeModal from '../../components/modal/CosmosNodeModal';
import { EdgeControls } from '../../components/cosmos/EdgeControls';

const CosmosScene: React.FC = () => {
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

  // Edge control state
  const [showEdges, setShowEdges] = useState(true);
  const [edgeOpacity, setEdgeOpacity] = useState(0.8);
  const [edgeWidth, setEdgeWidth] = useState(3);
  const [animatedEdges, setAnimatedEdges] = useState(false);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        const response = await cosmosService.getGraphProjection();
        if (response.success) {
          setGraphData(response.data);
        } else {
          setError(response.error.message || 'Failed to load graph data.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [setGraphData, setLoading, setError]);

  if (isLoading) {
    return <CosmosLoading />;
  }

  if (error) {
    return <CosmosError message={error} />;
  }

  const POSITION_SCALE = 10; // Increased scale to spread nodes out
  
  // Check if all nodes have zero or very small positions
  const allNodesHaveSmallPositions = (graphData.nodes ?? []).every(node => {
    // Handle position as array [x, y, z] or object {x, y, z}
    let x = 0, y = 0, z = 0;
    if (Array.isArray(node.position)) {
      [x, y, z] = node.position;
    } else {
      // Fallback to any properties that might exist
      const nodeAny = node as any;
      x = nodeAny.x || nodeAny.position?.x || 0;
      y = nodeAny.y || nodeAny.position?.y || 0;
      z = nodeAny.z || nodeAny.position?.z || 0;
    }
    return Math.abs(x) < 0.001 && Math.abs(y) < 0.001 && Math.abs(z) < 0.001;
  });
  
  // Generate fallback positions if all nodes have small positions
  const generateFallbackPositions = (nodeCount: number) => {
    const positions: Array<[number, number, number]> = [];
    const radius = Math.max(5, Math.sqrt(nodeCount));
    
    for (let i = 0; i < nodeCount; i++) {
      // Use golden ratio spiral for better distribution
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const angle = i * 2 * Math.PI / goldenRatio;
      const y = 1 - (i / (nodeCount - 1)) * 2; // [-1, 1]
      const radiusAtY = Math.sqrt(1 - y * y);
      
      const x = Math.cos(angle) * radiusAtY * radius;
      const z = Math.sin(angle) * radiusAtY * radius;
      
      positions.push([x, y * radius, z]);
    }
    
    return positions;
  };
  
  const fallbackPositions = allNodesHaveSmallPositions ? generateFallbackPositions(graphData.nodes?.length || 0) : null;
  
  if (allNodesHaveSmallPositions) {
    console.warn('⚠️ CosmosScene: All nodes have small positions, using fallback distribution');
  }
  
  const safeGraphData = {
    ...graphData,
    nodes: (graphData.nodes ?? []).map((node, index) => {
      // Handle position as array [x, y, z] or object {x, y, z}
      let x = 0, y = 0, z = 0;
      if (Array.isArray(node.position)) {
        [x, y, z] = node.position;
      } else {
        // Fallback to any properties that might exist
        const nodeAny = node as any;
        x = nodeAny.x || nodeAny.position?.x || 0;
        y = nodeAny.y || nodeAny.position?.y || 0;
        z = nodeAny.z || nodeAny.position?.z || 0;
      }
      
      // Use fallback positions if all nodes have small positions
      if (fallbackPositions && fallbackPositions[index]) {
        [x, y, z] = fallbackPositions[index];
      }
      
      const scaledNode = {
        ...node,
        x: x * POSITION_SCALE,
        y: y * POSITION_SCALE,
        z: z * POSITION_SCALE,
        name: node.label ?? node.id, // Use label from API response
        type: node.type,
        // Add properties field for compatibility with the modal
        properties: {
          title: node.label ?? node.id,
          type: node.type,
          content: node.metadata?.content || '',
          importance: node.metadata?.importance || 1,
          createdAt: node.metadata?.createdAt,
          lastUpdated: node.metadata?.lastUpdated
        }
      };
      
      // Debug logging for first few nodes
      if (node.id === graphData.nodes?.[0]?.id) {
        console.log('🔍 CosmosScene: First node data:', {
          original: { x, y, z },
          scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z },
          name: scaledNode.name,
          type: scaledNode.type
        });
      }
      
      // Log a few more nodes to understand distribution
      if (node.id === graphData.nodes?.[1]?.id || node.id === graphData.nodes?.[2]?.id) {
        console.log(`🔍 CosmosScene: Node ${node.id}:`, {
          original: { x, y, z },
          scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z }
        });
      }
      

      
      return scaledNode;
    }),
    // Map edges to both 'edges' and 'links' for compatibility
    edges: (graphData.edges ?? []).map(edge => ({
      ...edge,
      // Ensure source and target are strings
      source: String(edge.source),
      target: String(edge.target),
      // Add default weight if missing
      weight: edge.weight || 1.0,
      // Add color based on type
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

  // Debug logging for edges
  console.log('🔍 CosmosScene: Edge data:', {
    originalEdgeCount: graphData.edges?.length || 0,
    processedEdgeCount: safeGraphData.edges.length,
    firstEdge: safeGraphData.edges[0],
    edgeTypes: [...new Set(safeGraphData.edges.map(e => e.type))],
    showEdges,
    edgeOpacity,
    edgeWidth,
    animatedEdges
  });

  return (
    <div className="w-full h-full relative">
      <Graph3D
        graphData={safeGraphData}
        onNodeClick={(node) => setSelectedNode(node)}
        showEdges={showEdges}
        edgeOpacity={edgeOpacity}
        edgeWidth={edgeWidth}
        animatedEdges={animatedEdges}
        modalOpen={!!selectedNode}
      />
      
      {/* Edge Controls */}
      <div className="absolute top-4 right-4 z-10">
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
      
      <CosmosInfoPanel />
      {selectedNode && <CosmosNodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
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

export default CosmosScene;