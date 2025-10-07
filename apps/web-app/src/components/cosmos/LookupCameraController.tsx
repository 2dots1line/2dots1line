import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface LookupCameraControllerProps {
  initialTarget?: { x: number; y: number; z: number };
  initialDistance?: number;
}

export const LookupCameraController: React.FC<LookupCameraControllerProps> = ({ 
  initialTarget = { x: 0, y: 0, z: 0 },
  initialDistance = 80
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const [isInitialized, setIsInitialized] = React.useState(false);
  
  // Initialize camera position and controls target
  useEffect(() => {
    if (controlsRef.current && !isInitialized) {
      // Set the target to the initial target
      controlsRef.current.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
      
      // Position camera at a good viewing distance
      camera.position.set(
        initialTarget.x + initialDistance * 0.7,
        initialTarget.y + initialDistance * 0.5,
        initialTarget.z + initialDistance * 0.7
      );
      
      controlsRef.current.update();
      setIsInitialized(true);
      
      console.log('🎥 LookupCameraController: Initialized with target:', initialTarget, 'distance:', initialDistance);
    }
  }, [controlsRef.current, initialTarget, initialDistance, isInitialized, camera]);

  // Handle camera focus requests - clean and simple
  useEffect(() => {
    const handleCameraFocus = (event: CustomEvent) => {
      const { position, entity, entity_id } = (event.detail || {}) as {
        position?: { x: number; y: number; z: number };
        entity?: { id?: string; title?: string };
        entity_id?: string;
      };

      // Guard against malformed events (e.g., quest stage directions that only include entity_id)
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        console.warn('🎥 LookupCameraController: Ignoring camera-focus-request without concrete position', { position, entity_id, entity });
        return;
      }

      console.log('🎥 LookupCameraController: Focusing on entity:', entity?.title || entity?.id || entity_id, 'at:', position);
      
      if (controlsRef.current) {
        // Smoothly animate to the new target
        const target = new THREE.Vector3(position.x, position.y, position.z);
        controlsRef.current.target.copy(target);
        
        // Position camera at a good viewing angle
        const offset = new THREE.Vector3(30, 20, 30);
        const newPosition = target.clone().add(offset);
        camera.position.copy(newPosition);
        
        controlsRef.current.update();
        
        console.log('🎥 LookupCameraController: Camera focused on entity at:', position);
      }
    };

    window.addEventListener('camera-focus-request', handleCameraFocus as EventListener);

    return () => {
      window.removeEventListener('camera-focus-request', handleCameraFocus as EventListener);
    };
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      enableRotate={true}  // Mouse drag for rotation
      enablePan={true}     // Mouse drag for panning
      enableZoom={true}    // Scroll/pinch for zoom
      zoomSpeed={1.0}
      rotateSpeed={0.5}
      panSpeed={0.8}
      minDistance={10}     // Prevent zooming too close
      maxDistance={500}    // Prevent zooming too far
    />
  );
};
