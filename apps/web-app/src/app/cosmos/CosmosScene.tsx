'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Graph3D } from '../../components/cosmos/Graph3D';
import { useCosmosStore } from '../../stores/CosmosStore';
import { cosmosService } from '../../services/cosmosService';
import CosmosInfoPanel from '../../components/modal/CosmosInfoPanel';
import CosmosError from '../../components/modal/CosmosError';
import CosmosLoading from '../../components/modal/CosmosLoading';
import CosmosNodeModal from '../../components/modal/CosmosNodeModal';
import { EdgeControls } from '../../components/cosmos/EdgeControls';
import { NodeLabelControls } from '../../components/cosmos/NodeLabelControls';

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
    console.log('🌌 Background loading started');
  }, []);

  const handleBackgroundLoadComplete = useCallback(() => {
    setIsBackgroundLoading(false);
    setBackgroundLoadError(null);
    console.log('🌌 Background loading completed');
  }, []);

  const handleBackgroundLoadError = useCallback((error: Error) => {
    setIsBackgroundLoading(false);
    setBackgroundLoadError(error.message);
    console.error('🌌 Background loading error:', error);
  }, []);

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

  // Listen for coordinates_updated notifications and refresh Cosmos data
  useEffect(() => {
    const handleCoordinatesUpdated = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🌌 CosmosScene: Coordinates updated, refreshing graph data', customEvent.detail);
      try {
        setLoading(true);
        const response = await cosmosService.getGraphProjection();
        if (response.success) {
          setGraphData(response.data);
          console.log('🌌 CosmosScene: Graph data refreshed successfully');
        } else {
          console.error('🌌 CosmosScene: Failed to refresh graph data:', response.error);
        }
      } catch (err) {
        console.error('🌌 CosmosScene: Error refreshing graph data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Listen for the custom event
    window.addEventListener('cosmos-coordinates-updated', handleCoordinatesUpdated);

    // Cleanup
    return () => {
      window.removeEventListener('cosmos-coordinates-updated', handleCoordinatesUpdated);
    };
  }, [setGraphData, setLoading]);

  if (isLoading) {
    return <CosmosLoading />;
  }

  if (error) {
    return <CosmosError message={error} />;
  }

  const POSITION_SCALE = 10; // Increased scale to spread nodes out
  
  // Check if all nodes have zero or very small positions
  const allNodesHaveSmallPositions = (graphData.nodes ?? []).every(node => {
    // Handle both flat structure (x, y, z) and nested structure (position array/object)
    let x = 0, y = 0, z = 0;
    
    // Check for flat structure first (what API actually returns)
    const nodeAny = node as any;
    if (typeof nodeAny.x === 'number' && typeof nodeAny.y === 'number' && typeof nodeAny.z === 'number') {
      x = nodeAny.x;
      y = nodeAny.y;
      z = nodeAny.z;
    } else if (Array.isArray(nodeAny.position)) {
      [x, y, z] = nodeAny.position;
    } else if (nodeAny.position && typeof nodeAny.position === 'object') {
      x = nodeAny.position.x || 0;
      y = nodeAny.position.y || 0;
      z = nodeAny.position.z || 0;
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
      // Handle both flat structure (x, y, z) and nested structure (position array/object)
      let x = 0, y = 0, z = 0;
      
      // Check for flat structure first (what API actually returns)
      const nodeAny = node as any;
      if (typeof nodeAny.x === 'number' && typeof nodeAny.y === 'number' && typeof nodeAny.z === 'number') {
        x = nodeAny.x;
        y = nodeAny.y;
        z = nodeAny.z;
      } else if (Array.isArray(nodeAny.position)) {
        [x, y, z] = nodeAny.position;
      } else if (nodeAny.position && typeof nodeAny.position === 'object') {
        x = nodeAny.position.x || 0;
        y = nodeAny.position.y || 0;
        z = nodeAny.position.z || 0;
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
        name: nodeAny.title ?? nodeAny.label ?? node.id, // Use title from API response
        type: node.type,
        // Add properties field for compatibility with the modal
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
      if (index === 0) {
        console.log('🔍 CosmosScene: First node data:', {
          original: { x, y, z },
          scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z },
          name: scaledNode.name,
          type: scaledNode.type,
          title: nodeAny.title
        });
      }
      
      // Log a few more nodes to understand distribution
      if (index === 1 || index === 2) {
        console.log(`🔍 CosmosScene: Node ${index} (${node.id}):`, {
          original: { x, y, z },
          scaled: { x: scaledNode.x, y: scaledNode.y, z: scaledNode.z },
          title: nodeAny.title
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
        onBackgroundLoadStart={handleBackgroundLoadStart}
        onBackgroundLoadComplete={handleBackgroundLoadComplete}
        onBackgroundLoadError={handleBackgroundLoadError}
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
                // Trigger reload by changing a dependency
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

export default CosmosScene;