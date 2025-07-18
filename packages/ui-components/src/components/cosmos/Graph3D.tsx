import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { StarfieldBackground } from './StarfieldBackground';
import { CameraController } from './CameraController';
import { NodeMesh } from './NodeMesh';
import { EdgeMesh, AnimatedEdgeMesh } from './EdgeMesh';
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
}

export const Graph3D: React.FC<Graph3DProps> = ({ 
  graphData, 
  onNodeClick,
  showEdges = true,
  edgeOpacity = 1.0,
  edgeWidth = 8,
  animatedEdges = false
}) => {
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

  return (
    <Canvas
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
      <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={75} near={0.1} far={10000} />
      <StarfieldBackground />
      <CameraController />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={0.2} />
      
      {/* Render nodes */}
      {graphData.nodes.map((node) => (
        <NodeMesh key={node.id} node={node} onClick={onNodeClick} />
      ))}

      {/* Render edges */}
      {showEdges && edges.map((edge, index) => {
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
        
        return animatedEdges ? (
          <AnimatedEdgeMesh 
            key={`edge-${index}`}
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
            key={`edge-${index}`}
            points={points}
            color={edgeColor}
            width={edgeWidth}
            opacity={edgeOpacity}
            type={edge.type}
            weight={edgeWeight}
          />
        );
      })}
    </Canvas>
  );
};