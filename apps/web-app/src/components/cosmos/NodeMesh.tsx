import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { NodeLabel } from './NodeLabel';
import { getStarTexture } from './StarTextureMapping';

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
  isSearchResult?: boolean; // New prop to indicate if this is a search result (use bright star textures)
  nodeSizeMultiplier?: number; // Node size multiplier for scaling
}

export const NodeMesh: React.FC<NodeMeshProps> = ({ 
  node, 
  onClick, 
  modalOpen = false, 
  onHover,
  isHighlighted = false,
  isSearchResult = false,
  nodeSizeMultiplier = 1.0
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [starTexture, setStarTexture] = useState<THREE.Texture | null>(null);

  // Use positions directly from the node object
  const position = useMemo(() => new THREE.Vector3(
    node.x, 
    node.y, 
    node.z
  ), [node.x, node.y, node.z]);

  // Load star texture for this node
  useEffect(() => {
    const loadTexture = async () => {
      let texturePath: string;
      
      if (isHighlighted) {
        // Use bright star textures for highlighted nodes (selected + connected)
        const highlightedTextures = [
          '/textures/brightstar1.png',
          '/textures/brightstar2.png', 
          '/textures/brightstar3.png',
          '/textures/brightstar4.png',
          '/textures/giant_star.png'
        ];
        const randomIndex = Math.floor(Math.random() * highlightedTextures.length);
        texturePath = highlightedTextures[randomIndex];
        console.log('🌟 NodeMesh: Highlighted node using bright texture:', texturePath);
      } else if (isSearchResult) {
        // Randomly assign from bright star textures and giant_star for search results
        const searchResultTextures = [
          '/textures/brightstar1.png',
          '/textures/brightstar2.png', 
          '/textures/brightstar3.png',
          '/textures/brightstar4.png',
          '/textures/giant_star.png'
        ];
        const randomIndex = Math.floor(Math.random() * searchResultTextures.length);
        texturePath = searchResultTextures[randomIndex];
        console.log('🌟 NodeMesh: Search result using random bright texture:', texturePath);
      } else {
        // Use regular entity type-based texture for non-search results
        texturePath = getStarTexture(node.entityType || 'default');
      }
      
      const loader = new THREE.TextureLoader();
      
      try {
        const texture = await loader.loadAsync(texturePath);
        texture.magFilter = THREE.NearestFilter;
        setStarTexture(texture);
      } catch (error) {
        console.warn(`Failed to load texture: ${texturePath}`, error);
        // Fallback to default texture
        try {
          const fallback = await loader.loadAsync('/textures/star1.png');
          fallback.magFilter = THREE.NearestFilter;
          setStarTexture(fallback);
        } catch (fallbackError) {
          console.error('Failed to load fallback texture:', fallbackError);
        }
      }
    };

    loadTexture();
  }, [node.entityType, isSearchResult, isHighlighted]);

  // Calculate importance-based size
  const importance = node.importance || node.metadata?.importance_score || 0.5;
  // Normalize importance from 1-10 scale to 0-1 scale for better visual balance
  const normalizedImportance = Math.min(importance / 10, 1.0);
  
  // Base sizing formula: keep original small size for regular CosmosScene
  let baseSize = Math.max(1.0 + normalizedImportance * 1.0, 0.8); // Original: minimum size of 0.8
  
  // Make highlighted nodes (selected + connected) larger and more prominent
  if (isHighlighted) {
    // For highlighted nodes: use much larger size
    baseSize = Math.max(3.0 + normalizedImportance * 2.0, 4.0); // 3.0-5.0 range, minimum 4.0
    console.log('🌟 NodeMesh: Highlighted entity detected:', {
      nodeId: node.id,
      title: node.title,
      importance,
      normalizedImportance,
      baseSize,
      isHighlighted
    });
  }
  
  // Make search results and quest entities larger and more prominent (for other views)
  if (isSearchResult && !isHighlighted) {
    // For quest/search results: use much larger size
    baseSize = Math.max(3.0 + normalizedImportance * 2.0, 4.0); // 3.0-5.0 range, minimum 4.0
    console.log('🌟 NodeMesh: Quest/search entity detected:', {
      nodeId: node.id,
      title: node.title,
      importance,
      normalizedImportance,
      baseSize,
      isSearchResult
    });
  }
  
  // Apply node size multiplier to all nodes
  baseSize = baseSize * nodeSizeMultiplier;
  
  // Celestial body color scheme based on entity type
  const getCelestialColor = useMemo(() => {
    // Get entity type from node properties (prioritize entityType, then type, then category)
    const entityType = node.entityType || node.type || node.category || 'unknown';
    
    // Celestial color coding - more realistic star/planet colors
    switch (entityType) {
      // Table names (from database)
      case 'memory_units':
      case 'MemoryUnit':
        return '#4a90e2'; // Blue-white star (like Sirius)
      case 'concepts':
      case 'Concept':
        return '#f5f5dc'; // Yellow-white star (like our Sun)
      case 'communities':
      case 'Community':
        return '#ff6b35'; // Orange-red star (like Betelgeuse)
      case 'derived_artifacts':
      case 'DerivedArtifact':
      case 'Artifact':
        return '#c77dff'; // Purple-blue star (like Vega)
      case 'proactive_prompts':
      case 'ProactivePrompt':
        return '#ffd700'; // Golden star (like Capella)
      case 'growth_events':
      case 'GrowthEvent':
        return '#e6e6fa'; // White-blue star (like Rigel)
      default:
        return '#b0b0b0'; // Neutral white star
    }
  }, [node.entityType, node.type, node.category]);

  // Generate star color with subtle variation
  const getStarColor = useMemo(() => {
    const baseColor = getCelestialColor;
    
    // Add subtle color variation for realism
    const colorVariation = 0.1;
    const r = Math.max(0, Math.min(1, parseInt(baseColor.slice(1, 3), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    const g = Math.max(0, Math.min(1, parseInt(baseColor.slice(3, 5), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    const b = Math.max(0, Math.min(1, parseInt(baseColor.slice(5, 7), 16) / 255 + (Math.random() - 0.5) * colorVariation));
    
    return new THREE.Color(r, g, b);
  }, [getCelestialColor]);

  // No individual node rotation - nodes are points and should remain static
  // The NodeClusterContainer handles all rotation for the entire cluster

  // Create star material with texture
  const starMaterial = useMemo(() => {
    if (!starTexture) return null;

    return new THREE.PointsMaterial({
      size: baseSize * 2, // Reduced scale for smaller appearance
      map: starTexture,
      sizeAttenuation: true,
      depthWrite: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      color: getStarColor,
      opacity: 0.6 // Reduced opacity to prevent overexposure
    });
  }, [starTexture, baseSize, getStarColor]);

  return (
    <group ref={groupRef} position={position}>
      {/* Visual: Star point with texture */}
      {starMaterial && (
        <points material={starMaterial}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={1}
              array={new Float32Array([0, 0, 0])}
              itemSize={3}
            />
          </bufferGeometry>
        </points>
      )}
      
      {/* Interaction: Invisible click sphere */}
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
        scale={hovered ? 1.2 : 1.0}
      >
        <sphereGeometry args={[baseSize * 1.5, 8, 8]} />
        <meshBasicMaterial 
          transparent 
          opacity={0}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      
      {/* Add very subtle glow effect for important nodes */}
      {importance > 8 && (
        <mesh scale={[baseSize * 1.1, baseSize * 1.1, baseSize * 1.1]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial 
            color={getStarColor}
            transparent={true}
            opacity={0.1} // Much more subtle glow
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
        nodeRef={groupRef}
      />
    </group>
  );
};