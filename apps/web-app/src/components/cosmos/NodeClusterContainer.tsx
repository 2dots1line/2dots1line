import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NodeClusterContainerProps {
  children: React.ReactNode;
  rotationSpeed?: number;
  enableRotation?: boolean;
}

/**
 * NodeClusterContainer - Rotates the entire node cluster for 3D parallax effect
 * 
 * This component wraps all nodes and rotates them as a group, creating proper
 * 3D depth perception when combined with the slower-rotating background layers.
 * 
 * IMPORTANT: This ensures both the visual star points and invisible click spheres
 * rotate together in perfect sync, maintaining proper interaction functionality.
 * 
 * Rotation speeds (rad/frame):
 * - NASA Background: 0.0001 (slowest - distant stars)
 * - Starfield: 0.0002 (medium - mid-distance stars)  
 * - Node Cluster: 0.0005 (fastest - foreground objects)
 */
export const NodeClusterContainer: React.FC<NodeClusterContainerProps> = ({ 
  children, 
  rotationSpeed = 0.0005,
  enableRotation = true 
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && enableRotation) {
      // Rotate the entire node cluster for 3D parallax effect
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3; // Subtle X rotation for more dynamic feel
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};
