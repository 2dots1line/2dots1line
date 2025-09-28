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
  
  // Celestial body color scheme based on entity type
  const getCelestialColor = () => {
    let baseColor;
    
    // Get entity type from node properties
    const entityType = node.type || node.entityType || node.category || 'unknown';
    
    // Celestial color coding - more realistic star/planet colors
    switch (entityType) {
      // Table names (from database)
      case 'memory_units':
      case 'MemoryUnit':
        baseColor = '#4a90e2'; // Blue-white star (like Sirius)
        break;
      case 'concepts':
      case 'Concept':
        baseColor = '#f5f5dc'; // Yellow-white star (like our Sun)
        break;
      case 'communities':
      case 'Community':
        baseColor = '#ff6b35'; // Orange-red star (like Betelgeuse)
        break;
      case 'derived_artifacts':
      case 'DerivedArtifact':
      case 'Artifact':
        baseColor = '#c77dff'; // Purple-blue star (like Vega)
        break;
      case 'proactive_prompts':
      case 'ProactivePrompt':
        baseColor = '#ffd700'; // Golden star (like Capella)
        break;
      case 'growth_events':
      case 'GrowthEvent':
        baseColor = '#e6e6fa'; // White-blue star (like Rigel)
        break;
      default:
        baseColor = '#b0b0b0'; // Neutral white star
        break;
    }
    
    return baseColor;
  };

  // Generate realistic star properties
  const getStarProperties = () => {
    const baseColor = getCelestialColor();
    const importance = node.importance || node.metadata?.importance_score || 0.5;
    
    // Star luminosity based on importance (brighter = more important)
    const luminosity = Math.min(0.3 + (importance / 10) * 0.7, 1.0);
    
    // Add subtle color variation for realism
    const colorVariation = 0.1;
    const r = Math.max(0, Math.min(1, parseInt(baseColor.slice(1, 3), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    const g = Math.max(0, Math.min(1, parseInt(baseColor.slice(3, 5), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    const b = Math.max(0, Math.min(1, parseInt(baseColor.slice(5, 7), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    
    return {
      color: new THREE.Color(r, g, b),
      luminosity,
      emissive: new THREE.Color(r * luminosity * 0.3, g * luminosity * 0.3, b * luminosity * 0.3)
    };
  };

  useFrame(() => {
    if (meshRef.current) {
      // Gentle celestial rotation
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  const starProps = getStarProperties();

  return (
    <group position={position}>
      {/* Celestial body with realistic star rendering */}
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
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial 
          color={starProps.color}
          emissive={starProps.emissive}
          emissiveIntensity={starProps.luminosity * 0.4}
          roughness={0.8}
          metalness={0.1}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Add subtle glow effect for important nodes */}
      {importance > 7 && (
        <mesh scale={[baseSize * 1.5, baseSize * 1.5, baseSize * 1.5]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color={starProps.color}
            transparent={true}
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
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