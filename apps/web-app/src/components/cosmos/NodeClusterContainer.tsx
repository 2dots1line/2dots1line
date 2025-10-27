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
  const [isPausedAfterReset, setIsPausedAfterReset] = useState(false);
  
  // Track initial rotation state for reset functionality
  const initialRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [isResetting, setIsResetting] = useState(false);
  const resetStartTimeRef = useRef<number>(0);
  const resetStartRotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  
  // Cache coordinateTransform module to avoid repeated imports
  const coordinateTransformRef = useRef<{ updateRawRotation: (rotation: { x: number; y: number; z: number }) => void } | null>(null);
  
  // Helper function to efficiently update raw rotation values (no heavy math)
  const updateRawRotationState = useCallback((rotation: { x: number; y: number; z: number }) => {
    // Use cached module or import if needed
    if (coordinateTransformRef.current) {
      coordinateTransformRef.current.updateRawRotation(rotation);
    } else {
      import('./coordinateTransform').then((module) => {
        coordinateTransformRef.current = module;
        module.updateRawRotation(rotation);
      }).catch(() => {
        // Silent fail - rotation updates are not critical
      });
    }
  }, []);

  // Store initial rotation when component mounts
  useEffect(() => {
    if (groupRef.current) {
      initialRotationRef.current = {
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
        z: groupRef.current.rotation.z
      };
      // Initialize raw rotation state
      updateRawRotationState(initialRotationRef.current);
    }
  }, [updateRawRotationState]);

  // Listen for pause/resume events from camera controller
  useEffect(() => {
    const handlePauseRotation = (event: CustomEvent) => {
      const { pause, reason } = event.detail || {};
      if (reason === 'entity-focus' || reason === 'entity-focus-complete' || reason === 'entity-click') {
        setIsPausedForFocus(pause);
        if (!pause) {
          setIsPausedAfterReset(false); // Resume rotation when user interacts
        }
        console.log('🔄 NodeClusterContainer: Auto rotation', pause ? 'paused' : 'resumed', 'for', reason);
      } else if (reason === 'camera-reset') {
        // Start reset animation
        if (groupRef.current) {
          setIsResetting(true);
          setIsPausedForFocus(true); // Pause normal rotation
          resetStartTimeRef.current = Date.now();
          resetStartRotationRef.current = {
            x: groupRef.current.rotation.x,
            y: groupRef.current.rotation.y,
            z: groupRef.current.rotation.z
          };
          console.log('🔄 NodeCluster: starting reset animation');
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
    
    if (isResetting) {
      // Animate back to initial rotation
      const elapsed = Date.now() - resetStartTimeRef.current;
      const duration = 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate rotation back to initial state
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        resetStartRotationRef.current.x,
        initialRotationRef.current.x,
        eased
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        resetStartRotationRef.current.y,
        initialRotationRef.current.y,
        eased
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        resetStartRotationRef.current.z,
        initialRotationRef.current.z,
        eased
      );
      
      // Update raw rotation state efficiently (no heavy math)
      updateRawRotationState({
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
        z: groupRef.current.rotation.z
      });
      
      if (progress >= 1) {
        setIsResetting(false);
        setIsPausedForFocus(false);
        setIsPausedAfterReset(true); // Keep paused after reset
        
        // Auto-resume rotation after 3 seconds if no user interaction
        setTimeout(() => {
          setIsPausedAfterReset(false);
        }, 3000);
        
        // Notify camera that rotation reset is complete
        window.dispatchEvent(new CustomEvent('rotation-reset-complete'));
      }
    } else if (enableRotation && !isHovered && !isPausedForFocus && !isPausedAfterReset) {
      // Normal rotation
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      
      // Update raw rotation state efficiently (no heavy math)
      updateRawRotationState({
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
        z: groupRef.current.rotation.z
      });
    }
  });

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};
