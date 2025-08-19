'use client';

/**
 * CosmosCanvas - Main 3D cosmos visualization component
 * V11.0 - Cosmos Integration Phase 3.2
 */

import React, { useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CosmosNode, NodeConnection } from '@2dots1line/shared-types';
import { useStarfield3D, useCosmosNavigation, useNodeInteractions } from '../../hooks/cosmos';

// Shader material for glowing nodes
const GlowMaterial = React.forwardRef<THREE.ShaderMaterial, {
  color?: string;
  time?: number;
  hover?: boolean;
  selected?: boolean;
  pulse?: number;
  glow?: number;
}>((props, ref) => {
  const { color = '#00ff66', time = 0, hover = false, selected = false, pulse = 0, glow = 0 } = props;
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    uniform float pulse;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Add subtle vertex displacement for pulse effect
      vec3 pos = position;
      if (pulse > 0.0) {
        pos += normal * sin(time * 10.0) * pulse * 0.1;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float time;
    uniform vec3 color;
    uniform float hover;
    uniform float selected;
    uniform float pulse;
    uniform float glow;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      
      // Base glow
      float baseGlow = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Pulse effect
      float pulseEffect = 1.0 + sin(time * 8.0) * pulse * 0.5;
      
      // Hover enhancement
      float hoverEffect = hover > 0.5 ? 1.8 : 1.0;
      
      // Selection enhancement
      float selectionEffect = selected > 0.5 ? 1.5 : 1.0;
      
      // Glow intensity
      float glowEffect = 1.0 + glow;
      
      // Combine all effects
      float finalGlow = baseGlow * pulseEffect * hoverEffect * selectionEffect * glowEffect;
      finalGlow = pow(finalGlow, 1.5);
      
      gl_FragColor = vec4(color, finalGlow);
    }
  `;

  return (
    <shaderMaterial
      ref={ref}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={{
        time: { value: time },
        color: { value: new THREE.Color(color) },
        hover: { value: hover ? 1.0 : 0.0 },
        selected: { value: selected ? 1.0 : 0.0 },
        pulse: { value: pulse },
        glow: { value: glow },
      }}
      transparent
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
});

GlowMaterial.displayName = 'GlowMaterial';

// Individual node component
const CosmosNodeComponent: React.FC<{
  node: CosmosNode;
  onNodeHover: (node: CosmosNode | null) => void;
  onNodeClick: (node: CosmosNode, event?: MouseEvent) => void;
  onNodeDoubleClick: (node: CosmosNode) => void;
  getNodeInteractionData: (nodeId: string) => any;
}> = ({ node, onNodeHover, onNodeClick, onNodeDoubleClick, getNodeInteractionData }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const interactionData = getNodeInteractionData(node.id);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.pulse.value = interactionData.pulseValue;
      materialRef.current.uniforms.glow.value = interactionData.glowValue;
      materialRef.current.uniforms.hover.value = interactionData.isHovered ? 1.0 : 0.0;
      materialRef.current.uniforms.selected.value = interactionData.isSelected ? 1.0 : 0.0;
    }
    
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += 0.005;
      
      // Scale based on interaction
      const targetScale = interactionData.isHovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      
      // Floating animation
      const time = state.clock.elapsedTime;
      const floatOffset = Math.sin(time + parseFloat(node.id)) * 0.2;
      meshRef.current.position.y = (node.position?.y || 0) + floatOffset;
    }
  });

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    onNodeClick(node, event.nativeEvent);
  }, [node, onNodeClick]);

  const handleDoubleClick = useCallback((event: any) => {
    event.stopPropagation();
    onNodeDoubleClick(node);
  }, [node, onNodeDoubleClick]);

  const handlePointerOver = useCallback(() => {
    onNodeHover(node);
  }, [node, onNodeHover]);

  const handlePointerOut = useCallback(() => {
    onNodeHover(null);
  }, [onNodeHover]);

  if (!node.position) return null;

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[node.appearance?.size || 1, 16, 16]} />
        <meshBasicMaterial color={node.appearance?.color || '#00ff88'} />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef} scale={2}>
        <sphereGeometry args={[(node.appearance?.size || 1) * 1.5, 16, 16]} />
        <GlowMaterial
          ref={materialRef}
          color={node.appearance?.color || '#00ff66'}
          hover={interactionData.isHovered}
          selected={interactionData.isSelected}
          pulse={interactionData.pulseValue}
          glow={interactionData.glowValue}
        />
      </mesh>
      
      {/* Label - Using mesh-based approach instead of Html */}
      {interactionData.isHovered && (
        <mesh position={[0, (node.appearance?.size || 1) + 1, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Connection line component
const NodeConnection: React.FC<{
  connection: NodeConnection;
  fromNode: CosmosNode;
  toNode: CosmosNode;
}> = ({ connection, fromNode, toNode }) => {
  const lineRef = useRef<THREE.Line>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      // Animated opacity based on connection strength
      const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      if (lineRef.current.material instanceof THREE.LineBasicMaterial) {
        lineRef.current.material.opacity = opacity;
      }
    }
  });

  if (!fromNode.position || !toNode.position) return null;

  const points = [
    new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
    new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
  ];

  return (
    <line ref={lineRef as any}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={'#00ff66'} 
        transparent 
        opacity={0.3}
      />
    </line>
  );
};

// Background starfield component
const BackgroundStarfield: React.FC<{
  starPositions: Float32Array;
  starColors: Float32Array;
}> = ({ starPositions, starColors }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Gentle rotation
      pointsRef.current.rotation.y += 0.0001;
      pointsRef.current.rotation.x += 0.00005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starColors.length / 3}
          array={starColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={false}
      />
    </points>
  );
};

// Main scene component
const CosmosScene: React.FC<{
  nodes: CosmosNode[];
  connections: NodeConnection[];
  enableNavigation: boolean;
  onNodeSelect: (node: CosmosNode) => void;
  debug: boolean;
}> = ({ nodes, connections, enableNavigation, onNodeSelect, debug }) => {
  // Initialize hooks
  const starfield = useStarfield3D({
    nodes,
    debug,
    config: {
      starCount: 2000,
      fieldRadius: 3000,
      colorVariation: true,
    },
  });

  const navigation = useCosmosNavigation({
    enableKeyboardControls: enableNavigation,
    enableMouseControls: enableNavigation,
    debug,
  });

  const interactions = useNodeInteractions({
    enableHover: true,
    enableSelection: true,
    debug,
  });

  // Handle node selection
  const handleNodeClick = useCallback((node: CosmosNode, event?: MouseEvent) => {
    interactions.onNodeClick(node, event);
    onNodeSelect(node);
  }, [interactions, onNodeSelect]);

  const handleNodeDoubleClick = useCallback((node: CosmosNode) => {
    interactions.onNodeDoubleClick(node);
    navigation.flyToNode(node);
  }, [interactions, navigation]);

  return (
    <>
      {/* Background starfield */}
      <BackgroundStarfield 
        starPositions={starfield.starPositions}
        starColors={starfield.starColors}
      />
      
      {/* Nodes */}
      {starfield.processedNodes.map((node) => (
        <CosmosNodeComponent
          key={node.id}
          node={node}
          onNodeHover={interactions.onNodeHover}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          getNodeInteractionData={interactions.getNodeInteractionData}
        />
      ))}
      
      {/* Connections */}
      {connections.map((connection) => {
        const fromNode = starfield.processedNodes.find(n => n.id === connection.id);
        const toNode = starfield.processedNodes.find(n => n.id === connection.target_node_id);
        
        if (!fromNode || !toNode) return null;
        
        return (
          <NodeConnection
            key={connection.id}
            connection={connection}
            fromNode={fromNode}
            toNode={toNode}
          />
        );
      })}
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Camera controls */}
      {enableNavigation && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.3}
          maxDistance={5000}
          minDistance={50}
        />
      )}
    </>
  );
};

// Loading component - Using mesh-based approach instead of Html
const CosmosLoading: React.FC = () => (
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[0.1, 0.1, 0.1]} />
    <meshBasicMaterial color="#ffffff" />
  </mesh>
);

// Main component
interface CosmosCanvasProps {
  nodes?: CosmosNode[];
  connections?: NodeConnection[];
  enableNavigation?: boolean;
  onNodeSelect?: (node: CosmosNode) => void;
  className?: string;
  debug?: boolean;
}

export const CosmosCanvas: React.FC<CosmosCanvasProps> = ({
  nodes = [],
  connections = [],
  enableNavigation = true,
  onNodeSelect = () => {},
  className = '',
  debug = false,
}) => {
  if (debug) {
    console.log('🌌 CosmosCanvas: Rendering with', nodes.length, 'nodes and', connections.length, 'connections');
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 100, 500],
          fov: 60,
          near: 0.1,
          far: 10000,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Suspense fallback={<CosmosLoading />}>
          <CosmosScene
            nodes={nodes}
            connections={connections}
            enableNavigation={enableNavigation}
            onNodeSelect={onNodeSelect}
            debug={debug}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}; 