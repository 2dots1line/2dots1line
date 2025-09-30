import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { StarfieldBackground } from './StarfieldBackground';
import { NASAStarfieldBackground } from './NASAStarfieldBackground';
import { CameraController } from './CameraController';
import { NodeMesh } from './NodeMesh';
import { EdgeMesh, AnimatedEdgeMesh } from './EdgeMesh';
import { EdgeLabel } from './EdgeLabel';
import { NodeClusterContainer } from './NodeClusterContainer';
import * as THREE from 'three';

// TODO: Define proper types for graph data
interface GraphData {
  nodes: any[];
  links?: any[];
  edges?: any[];
}

interface Graph3DProps {
  graphData: GraphData;
  onNodeClick: (node: any) => void;
  showEdges?: boolean;
  edgeOpacity?: number;
  edgeWidth?: number;
  animatedEdges?: boolean;
  modalOpen?: boolean;
  onBackgroundLoadStart?: () => void;
  onBackgroundLoadComplete?: () => void;
  onBackgroundLoadError?: (error: Error) => void;
  isSearchResult?: boolean; // New prop to indicate if nodes are search results (use bright star textures)
}

export const Graph3D: React.FC<Graph3DProps> = ({ 
  graphData, 
  onNodeClick,
  showEdges = false,
  edgeOpacity = 1.0,
  edgeWidth = 8,
  animatedEdges = false,
  modalOpen = false,
  onBackgroundLoadStart,
  onBackgroundLoadComplete,
  onBackgroundLoadError,
  isSearchResult = false
}) => {
  // State for hover management
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Normalize edge data - handle both 'links' and 'edges' properties
  const edges = graphData.links || graphData.edges || [];
  
  console.log('🔍 Graph3D: Received graph data:', {
    nodeCount: graphData.nodes.length,
    firstNode: graphData.nodes[0],
    edgeCount: edges.length,
    firstEdge: edges[0],
    showEdges,
    edgeOpacity,
    edgeWidth
  });

  // Debug: Log all unique entity types
  const entityTypes = [...new Set(graphData.nodes.map(node => 
    node.type || node.entityType || node.category || 'unknown'
  ))];
  console.log('🔍 Graph3D: Entity types found:', entityTypes);

  // Debug: Check if nodes have valid positions
  if (graphData.nodes.length > 0) {
    const firstNode = graphData.nodes[0];
    console.log('🔍 First node position:', {
      x: firstNode.x,
      y: firstNode.y,
      z: firstNode.z,
      scaledX: firstNode.x * 0.3,
      scaledY: firstNode.y * 0.3,
      scaledZ: firstNode.z * 0.3
    });
  }

  // Helper function to get edge color based on type
  const getEdgeColor = (edge: any): string => {
    if (edge.color) return edge.color;
    
    switch (edge.type) {
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
      default:
        return '#ffffff';
    }
  };

  // Helper function to get edge weight
  const getEdgeWeight = (edge: any): number => {
    return edge.weight || edge.strength || 1.0;
  };

  // Helper function to format edge label text
  const formatEdgeLabel = (text: string): string => {
    // Convert to lowercase and replace underscores with spaces
    return text
      .toLowerCase()
      .replace(/_/g, ' ')
      .trim();
  };

  // Helper function to get edge label text
  const getEdgeLabel = (edge: any): string => {
    let labelText = '';
    
    // Check for various possible label properties
    if (edge.label) labelText = edge.label;
    else if (edge.relationship) labelText = edge.relationship;
    else if (edge.type) labelText = edge.type;
    else if (edge.name) labelText = edge.name;
    else {
      // Default based on edge type
      switch (edge.type) {
        case 'related':
          labelText = 'related to';
          break;
        case 'temporal':
          labelText = 'follows';
          break;
        case 'semantic':
          labelText = 'similar to';
          break;
        case 'hierarchical':
          labelText = 'contains';
          break;
        case 'causal':
          labelText = 'causes';
          break;
        default:
          labelText = 'connects';
          break;
      }
    }
    
    // Format the label text
    return formatEdgeLabel(labelText);
  };

  // Helper function to find nodes connected to a given node
  const getConnectedNodes = (nodeId: string): string[] => {
    const connectedIds = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedIds.add(edge.target);
      } else if (edge.target === nodeId) {
        connectedIds.add(edge.source);
      }
    });
    
    return Array.from(connectedIds);
  };

  // Helper function to check if an edge should be visible
  const shouldShowEdge = (edge: any): boolean => {
    // If edges are globally disabled, only show edges connected to hovered node
    if (!showEdges) {
      return !!hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
    }
    
    // If edges are globally enabled, show all edges
    return true;
  };

  // Calculate node cluster center for better camera positioning
  const nodeClusterCenter = useMemo(() => {
    if (graphData.nodes.length === 0) return { x: 0, y: 0, z: 0 };
    
    const sum = graphData.nodes.reduce(
      (acc, node) => ({
        x: acc.x + node.x,
        y: acc.y + node.y,
        z: acc.z + node.z
      }),
      { x: 0, y: 0, z: 0 }
    );
    
    const center = {
      x: sum.x / graphData.nodes.length,
      y: sum.y / graphData.nodes.length,
      z: sum.z / graphData.nodes.length
    };
    
    console.log('🌌 Node cluster center:', center);
    console.log('🌌 Node positions sample:', graphData.nodes.slice(0, 5).map(n => ({ id: n.id, x: n.x, y: n.y, z: n.z })));
    
    return center;
  }, [graphData.nodes]);

  // Camera auto-positioning disabled - keeping manual camera control
  const positionCameraForNode = useCallback((nodeId: string) => {
    // Camera positioning disabled - keeping manual camera control
    console.log('🔍 Camera positioning disabled for node:', nodeId);
  }, []);

  return (
    <Canvas
      id="cosmos-canvas"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <PerspectiveCamera 
        makeDefault 
        position={[0, 0, 100]} 
        fov={75} 
        near={0.1} 
        far={50000} 
      />
      {/* NASA Deep Star Maps 2020 Background - Layer 1 (Distant) */}
      <NASAStarfieldBackground 
        resolution="4k" 
        onLoadStart={onBackgroundLoadStart}
        onLoadComplete={onBackgroundLoadComplete}
        onLoadError={onBackgroundLoadError}
      />
      
      {/* Procedural Starfield - Layer 2 (Nearby stars for depth) */}
      <StarfieldBackground />
      
      <CameraController />
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.2} />
      
      {/* Main directional light from upper right corner */}
      <directionalLight 
        position={[20, 20, 10]} 
        intensity={0.8} 
        castShadow={false}
      />
      
      {/* Secondary fill light from opposite direction */}
      <directionalLight 
        position={[-10, 10, 5]} 
        intensity={0.3} 
        castShadow={false}
      />
      
      {/* Render nodes and edges with 3D parallax rotation */}
      <NodeClusterContainer 
        rotationSpeed={0.0005} 
        enableRotation={true}
        isHovered={!!hoveredNodeId}
      >
        {graphData.nodes.map((node) => (
          <NodeMesh 
            key={node.id} 
            node={node} 
            onClick={onNodeClick} 
            modalOpen={modalOpen}
            onHover={(nodeId) => {
              setHoveredNodeId(nodeId);
              if (nodeId) {
                positionCameraForNode(nodeId);
              }
            }}
            isHighlighted={hoveredNodeId === node.id || 
              (!!hoveredNodeId && getConnectedNodes(hoveredNodeId).includes(node.id))}
            isSearchResult={isSearchResult} // Use prop to determine if nodes are search results
          />
        ))}

        {/* Render edges - controlled by showEdges prop and hover state */}
        {edges.map((edge, index) => {
          // Only show edge if it meets visibility criteria
          if (!shouldShowEdge(edge)) return null;
          
          const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
          const targetNode = graphData.nodes.find((n) => n.id === edge.target);
          
          if (!sourceNode || !targetNode) {
            console.warn('🔍 Graph3D: Missing source or target node for edge:', edge);
            return null;
          }
          
          // Use positions directly without additional scaling
          const points = [
            new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z),
            new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z),
          ];
          
          const edgeColor = getEdgeColor(edge);
          const edgeWeight = getEdgeWeight(edge);
          const edgeLabel = getEdgeLabel(edge);
          
          return (
            <group key={`edge-${index}`}>
              {animatedEdges ? (
                <AnimatedEdgeMesh 
                  points={points}
                  color={edgeColor}
                  width={edgeWidth}
                  opacity={edgeOpacity}
                  type={edge.type}
                  weight={edgeWeight}
                  animated={true}
                />
              ) : (
                <EdgeMesh 
                  points={points}
                  color={edgeColor}
                  width={edgeWidth}
                  opacity={edgeOpacity}
                  type={edge.type}
                  weight={edgeWeight}
                />
              )}
              
              {/* Edge label - only show when edges are in hover mode */}
              {!showEdges && (
                <EdgeLabel 
                  points={points}
                  label={edgeLabel}
                  color={edgeColor}
                  edgeId={`${edge.source}-${edge.target}`}
                />
              )}
            </group>
          );
        })}
      </NodeClusterContainer>
    </Canvas>
  );
};