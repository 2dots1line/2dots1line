import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NodeClusterContainerProps {
  children: React.ReactNode;
  rotationSpeed?: number;
  enableRotation?: boolean;
  isHovered?: boolean; // Pause rotation when any node is hovered
}

/**
 * NodeClusterContainer - Rotates the entire node cluster for 3D parallax effect
 * 
 * This component wraps all nodes, edges, and labels and rotates them as a group, 
 * creating proper 3D depth perception when combined with the slower-rotating background layers.
 * 
 * IMPORTANT: This ensures all graph elements (visual star points, invisible click spheres,
 * edges, and labels) rotate together in perfect sync, maintaining proper interaction 
 * functionality and visual coherence.
 * 
 * HOVER PAUSE: Rotation automatically pauses when any node is hovered, making it easier
 * to interact with nodes and read labels.
 * 
 * Rotation speeds (rad/frame):
 * - NASA Background: 0.0001 (slowest - distant stars)
 * - Starfield: 0.0002 (medium - mid-distance stars)  
 * - Node Cluster: 0.0005 (fastest - foreground objects, pauses on hover)
 */
export const NodeClusterContainer: React.FC<NodeClusterContainerProps> = ({ 
  children, 
  rotationSpeed = 0.0005,
  enableRotation = true,
  isHovered = false
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && enableRotation && !isHovered) {
      // Rotate the entire node cluster for 3D parallax effect
      // Pause rotation when any node is hovered for better interaction
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
