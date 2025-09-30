import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EdgeMeshProps {
  points: THREE.Vector3[];
  color?: string;
  width?: number;
  opacity?: number;
  type?: string;
  strength?: number; // Primary property for relationship intensity
  weight?: number; // Legacy fallback
}

/**
 * EdgeMesh
 * Renders a graph edge as a 3D line with proper materials and styling
 */
export const EdgeMesh: React.FC<EdgeMeshProps> = ({ 
  points, 
  color = '#00ff88', 
  width = 2, 
  opacity = 0.6,
  type = 'default',
  strength = 1.0, // Primary property
  weight // Legacy fallback
}) => {
  // Use strength as primary, fallback to weight for legacy data
  const effectiveStrength = strength !== undefined && strength !== null ? strength : (weight || 1.0);
  // Memoize the geometry so it's only created when points change
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setFromPoints(points);
    return geom;
  }, [points]);

  // Memoize the material with proper settings
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity * effectiveStrength, // Use strength for opacity
      linewidth: width,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color, opacity, width, effectiveStrength]);

  // Add glow effect for better visibility
  const glowMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: (opacity * effectiveStrength * 0.3), // Subtle glow using strength
      linewidth: width * 3, // Wider glow
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color, opacity, width, effectiveStrength]);

  return (
    <group>
      {/* Glow effect */}
      <line>
        <primitive object={geometry} attach="geometry" />
        <primitive object={glowMaterial} attach="material" />
      </line>
      
      {/* Main line */}
      <line>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" />
      </line>
    </group>
  );
};

// Enhanced version with animated effects
export const AnimatedEdgeMesh: React.FC<EdgeMeshProps & { animated?: boolean }> = ({ 
  points, 
  color = '#00ff88', 
  width = 2, 
  opacity = 0.6,
  type = 'default',
  strength = 1.0, // Primary property
  weight, // Legacy fallback
  animated = false
}) => {
  // Use strength as primary, fallback to weight for legacy data
  const effectiveStrength = strength !== undefined && strength !== null ? strength : (weight || 1.0);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setFromPoints(points);
    return geom;
  }, [points]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity * effectiveStrength,
      linewidth: width,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color, opacity, width, effectiveStrength]);

  // Animated material for flowing effect
  const animatedMaterial = useMemo(() => {
    if (!animated) return material;
    
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        opacity: { value: opacity * effectiveStrength }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
          float flow = fract(vUv.x - time * 0.5);
          float alpha = opacity * (0.5 + 0.5 * sin(flow * 6.28));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Store reference for animation updates
    materialRef.current = shaderMaterial;
    return shaderMaterial;
  }, [animated, color, opacity, effectiveStrength, material]);

  // Update time uniform for animation
  useFrame((state) => {
    if (animated && materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <primitive object={animated ? animatedMaterial : material} attach="material" />
    </line>
  );
};