import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeLabel } from './NodeLabel';

// Define the actual node structure being passed from CosmosScene
interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  z: number;
  entityType?: string;
  type?: string;
  category?: string;
  importance?: number;
  metadata?: {
    importance_score?: number;
  };
}

interface NodeMeshProps {
  node: GraphNode;
  onClick: (node: GraphNode) => void;
  modalOpen?: boolean;
  onHover?: (nodeId: string | null) => void;
  isHighlighted?: boolean;
}

export const NodeMesh: React.FC<NodeMeshProps> = ({ 
  node, 
  onClick, 
  modalOpen = false, 
  onHover,
  isHighlighted = false 
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Use positions directly from the node object
  const position = useMemo(() => new THREE.Vector3(
    node.x, 
    node.y, 
    node.z
  ), [node.x, node.y, node.z]);

  // Calculate importance-based size and color
  const importance = node.importance || node.metadata?.importance_score || 0.5;
  // Normalize importance from 1-10 scale to 0-1 scale for better visual balance
  // This prevents MemoryUnits from being massively oversized compared to other node types
  const normalizedImportance = Math.min(importance / 10, 1.0);
  
  // Increased sizing formula: base size 1.2 + normalized importance * 1.6
  // This creates sizes from 1.2 to 2.8, making all nodes much more visible and clickable
  // MemoryUnits (importance 7-10) will now be 2.32-2.8 instead of 0.96-1.2
  // Concepts (importance 1-5) will now be 1.36-2.0 instead of 0.48-0.8
  const baseSize = Math.max(1.2 + normalizedImportance * 1.6, 1.0); // Minimum size of 1.0
  const hoverSize = baseSize * (hovered ? 1.2 : 1.0);
  
  // Color scheme based on entity type
  const getNodeColor = () => {
    let baseColor;
    
    // Get entity type from node properties
    const entityType = node.type || node.entityType || node.category || 'unknown';
    
    // Color coding by entity type - handle both table names and display types
    switch (entityType) {
      // Table names (from database)
      case 'memory_units':
      case 'MemoryUnit':
        baseColor = '#4488ff'; // Blue for memory units
        break;
      case 'concepts':
      case 'Concept':
        baseColor = '#44ff44'; // Green for concepts
        break;
      case 'communities':
      case 'Community':
        baseColor = '#ff8844'; // Orange for communities
        break;
      case 'derived_artifacts':
      case 'DerivedArtifact':
      case 'Artifact':
        baseColor = '#ff4488'; // Pink for derived artifacts
        break;
      case 'proactive_prompts':
      case 'ProactivePrompt':
        baseColor = '#ffaa00'; // Orange-Yellow for proactive prompts
        break;
      case 'growth_events':
      case 'GrowthEvent':
        baseColor = '#aa44ff'; // Purple for growth events
        break;
      default:
        baseColor = '#888888'; // Gray for unknown types
        break;
    }
    
    // Only dim nodes if there's an active hover state
    if (isHighlighted) {
      return baseColor; // Keep original color for highlighted nodes
    } else if (hovered) {
      return baseColor; // Keep original color for hovered node
    } else {
      // Show all nodes normally when no hover is active
      return baseColor; // Keep original color for all nodes
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      // Simple, slow rotation
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group position={position}>
      {/* Simple 3D globe with proper lighting */}
      <mesh
        ref={meshRef}
        onPointerOver={() => {
          setHovered(true);
          onHover?.(node.id);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
        }}
        onClick={() => onClick(node)}
        scale={hoverSize}
      >
        <sphereGeometry args={[baseSize, 32, 32]} />
        <meshPhongMaterial 
          color={getNodeColor()} 
          shininess={100}
          specular={0x444444}
        />
      </mesh>
      
      <NodeLabel 
        text={node.title} 
        position={position} 
        hovered={hovered} 
        nodeId={node.id} 
        modalOpen={modalOpen}
        isHighlighted={isHighlighted}
      />
    </group>
  );
};