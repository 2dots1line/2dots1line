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
  customCameraPosition?: [number, number, number]; // Custom camera position for lookup scenes
  customCameraTarget?: { x: number; y: number; z: number }; // Custom camera target
  customTargetDistance?: number; // Custom target distance
  rotationSpeed?: number; // Custom rotation speed for the node cluster
  enableNodeRotation?: boolean; // Enable/disable node cluster rotation
  customCameraController?: React.ComponentType<any>; // Custom camera controller component
  selectedEntityId?: string | null; // External entity selection for edge highlighting
}

export const Graph3D: React.FC<Graph3DProps> = ({ 
  graphData, 
  onNodeClick,
  showEdges = false,
  edgeOpacity = 0.7,
  edgeWidth = 5,
  animatedEdges = false,
  modalOpen = false,
  onBackgroundLoadStart,
  onBackgroundLoadComplete,
  onBackgroundLoadError,
  isSearchResult = false,
  customCameraPosition,
  customCameraTarget,
  customTargetDistance,
  rotationSpeed,
  enableNodeRotation = true,
  customCameraController,
  selectedEntityId
}) => {
  // State for hover management
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Normalize edge data - handle both 'links' and 'edges' properties
  const edges = graphData.links || graphData.edges || [];
  
  // Debug logging removed for cleaner console

  // Debug logging removed for cleaner console

  // Helper function to get edge color based on type
  const getEdgeColor = (edge: any): string => {
    if (edge.color) return edge.color;
    
    // Handle both uppercase Neo4j types and lowercase frontend types
    const edgeType = edge.type?.toLowerCase();
    
    switch (edgeType) {
      // Neo4j relationship types (uppercase with underscores)
      case 'related_to':
        return '#60a5fa'; // Light blue (matches backend)
      case 'member_of':
        return '#4ade80'; // Green (matches backend)
      case 'strategic_relationship':
        return '#8b5cf6'; // Purple (matches backend)
      case 'derived_from':
        return '#f59e0b'; // Orange (matches backend)
      case 'is_part_of':
        return '#ffff00'; // Yellow
      case 'is_instance_of':
        return '#ff00ff'; // Magenta
      case 'influences':
        return '#00ffff'; // Cyan
      case 'contributes_to':
        return '#ff6600'; // Dark Orange
      case 'co_occurs_with':
        return '#6600ff'; // Purple
      case 'exemplifies_trait':
        return '#00ff00'; // Bright Green
      case 'is_metaphor_for':
        return '#ff0066'; // Hot Pink
      case 'is_a_type_of':
        return '#0066ff'; // Royal Blue
      
      // Legacy lowercase types (for backward compatibility)
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
        console.warn('🔍 Graph3D: Unknown edge type:', edge.type, 'using default color');
        return '#ffffff'; // White fallback
    }
  };

  // Helper function to get edge strength
  const getEdgeStrength = (edge: any): number => {
    return (edge.strength !== undefined && edge.strength !== null) ? edge.strength : (edge.weight || 1.0); // Use strength as primary, fallback to weight
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
    // Show edges connected to selected entity
    if (selectedEntityId && (edge.source === selectedEntityId || edge.target === selectedEntityId)) {
      return true;
    }
    
    // Show edges connected to hovered node
    if (hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) {
      return true;
    }
    
    // If edges are globally enabled, show all edges
    if (showEdges) {
      return true;
    }
    
    return false;
  };

  // Calculate node cluster center for camera positioning
  const nodeClusterCenter = useMemo(() => {
    // Use custom target if provided (for lookup scenes)
    if (customCameraTarget) {
      console.log('🌌 Using custom camera target:', customCameraTarget);
      return customCameraTarget;
    }
    
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
    return center;
  }, [graphData.nodes, customCameraTarget]);

  // Camera positioning is handled by CameraController via camera-focus-request events

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
        position={customCameraPosition || [nodeClusterCenter.x + 50, nodeClusterCenter.y + 30, nodeClusterCenter.z + 50]} 
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
      
      {customCameraController ? (
        React.createElement(customCameraController, {
          initialTarget: nodeClusterCenter,
          initialDistance: customTargetDistance || 80
        })
      ) : (
        <CameraController 
          initialTarget={nodeClusterCenter}
          initialTargetDistance={customTargetDistance || 80}
        />
      )}
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
        rotationSpeed={rotationSpeed || 0.0005} 
        enableRotation={enableNodeRotation}
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
              // Camera positioning is handled by CameraController via camera-focus-request events
            }}
            isHighlighted={
              hoveredNodeId === node.id || 
              selectedEntityId === node.id ||
              (!!hoveredNodeId && getConnectedNodes(hoveredNodeId).includes(node.id)) ||
              (!!selectedEntityId && getConnectedNodes(selectedEntityId).includes(node.id))
            }
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
          const edgeStrength = getEdgeStrength(edge);
          const edgeLabel = getEdgeLabel(edge);
          
          return (
            <group key={`edge-${edge.id}-${index}`}>
              {animatedEdges ? (
                <AnimatedEdgeMesh 
                  points={points}
                  color={edgeColor}
                  width={edgeWidth}
                  opacity={edgeOpacity}
                  type={edge.type}
                  strength={edgeStrength}
                  weight={edge.weight} // Legacy fallback
                  animated={true}
                />
              ) : (
                <EdgeMesh 
                  points={points}
                  color={edgeColor}
                  width={edgeWidth}
                  opacity={edgeOpacity}
                  type={edge.type}
                  strength={edgeStrength}
                  weight={edge.weight} // Legacy fallback
                />
              )}
              
              {/* Edge label - hidden to reduce visual clutter */}
              {/* {!showEdges && (
                <EdgeLabel 
                  points={points}
                  label={edgeLabel}
                  color={edgeColor}
                  edgeId={`${edge.source}-${edge.target}`}
                />
              )} */}
            </group>
          );
        })}
      </NodeClusterContainer>
    </Canvas>
  );
};