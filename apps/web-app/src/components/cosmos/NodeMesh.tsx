import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { NodeLabel } from './NodeLabel';



interface NodeMeshProps {
  node: any;
  onClick: (node: any) => void;
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

  // Use positions directly without scaling
  const position = useMemo(() => new THREE.Vector3(
    node.x, 
    node.y, 
    node.z
  ), [node.x, node.y, node.z]);

  // Calculate importance-based size and color
  const importance = node.importance || 0.5;
  const baseSize = 0.3 + importance * 1.2; // Size varies from 0.3 to 1.5
  const hoverSize = baseSize * (hovered ? 1.2 : 1.0);
  
  // Color scheme based on entity type
  const getNodeColor = () => {
    let baseColor;
    
    // Get entity type from node properties
    const entityType = node.entityType || node.type || node.category || 'unknown';
    
    // Debug logging for first few nodes
    if (node.id === 'mu-001' || node.id === 'concept-def' || node.id === 'community-def') {
      console.log(`🔍 NodeMesh ${node.id}:`, {
        entityType,
        nodeType: node.type,
        nodeCategory: node.category,
        nodeEntityType: node.entityType,
        finalEntityType: entityType
      });
    }
    
    // Color coding by entity type
    switch (entityType) {
      case 'MemoryUnit':
        baseColor = '#4488ff'; // Blue for memory units
        break;
      case 'Concept':
        baseColor = '#44ff44'; // Green for concepts
        break;
      case 'Community':
        baseColor = '#ff8844'; // Orange for communities
        break;
      case 'DerivedArtifact':
      case 'Artifact':
        baseColor = '#ff4488'; // Pink for derived artifacts
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
      
      <NodeLabel text={node.title || node.name} position={position} hovered={hovered} nodeId={node.id} modalOpen={modalOpen} />
    </group>
  );
};