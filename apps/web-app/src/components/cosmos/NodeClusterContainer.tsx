import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { performanceMonitor } from './performanceMonitor';

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
 * RESET FUNCTIONALITY: Tracks initial rotation state and can animate back to original
 * position when camera reset is triggered.
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
  const [isPausedForFocus, setIsPausedForFocus] = useState(false);
  
  // Track initial rotation state for reset functionality
  const initialRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  
  // No more rotation tracking needed - we use reset-first approach

  // Store initial rotation when component mounts
  useEffect(() => {
    if (groupRef.current) {
      initialRotationRef.current = {
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
        z: groupRef.current.rotation.z
      };
      // No rotation tracking needed
    }
  }, []);

  // Listen for pause/resume events from camera controller
  useEffect(() => {
    const handlePauseRotation = (event: CustomEvent) => {
      const { pause, reason } = event.detail || {};
      if (reason === 'entity-focus' || reason === 'entity-focus-complete' || reason === 'entity-click') {
        setIsPausedForFocus(pause);
        console.log('🔄 NodeClusterContainer: Auto rotation', pause ? 'paused' : 'resumed', 'for', reason);
      } else if (reason === 'camera-reset') {
        // SIMPLE RESET: Just restore initial rotation like a page reload
        if (groupRef.current) {
          setIsPausedForFocus(true); // Pause normal rotation
          
          // Immediately restore initial rotation (no animation)
          groupRef.current.rotation.x = initialRotationRef.current.x;
          groupRef.current.rotation.y = initialRotationRef.current.y;
          groupRef.current.rotation.z = initialRotationRef.current.z;
          
          // No rotation tracking needed anymore
          
          console.log('🔄 NodeCluster: reset to initial rotation', initialRotationRef.current);
        }
      }
    };

    window.addEventListener('pause-auto-rotation', handlePauseRotation as EventListener);
    
    return () => {
      window.removeEventListener('pause-auto-rotation', handlePauseRotation as EventListener);
    };
  }, []);

  useFrame(() => {
    // Update performance monitoring
    performanceMonitor.updateFrame();
    
    if (!groupRef.current) return;
    
    if (enableRotation && !isHovered && !isPausedForFocus) {
      // Normal rotation - no tracking needed
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};
