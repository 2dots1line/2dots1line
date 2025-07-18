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

  const POSITION_SCALE = 1; // Reduced from 10 to prevent overlapping
  const safeGraphData = {
    ...graphData,
    nodes: (graphData.nodes ?? []).map(node => {
      // Use x, y, z properties directly from API Gateway response
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const z = node.z ?? 0;
      
      const scaledNode = {
        ...node,
        x: x * POSITION_SCALE,
        y: y * POSITION_SCALE,
        z: z * POSITION_SCALE,
        name: node.title ?? node.id, // Use title from API response
        type: node.type,
        // Add properties field for compatibility with the modal
        properties: {
          title: node.title ?? node.id,
          type: node.type,
          content: node.content,
          importance: node.importance,
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