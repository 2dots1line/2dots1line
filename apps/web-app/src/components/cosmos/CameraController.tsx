import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface CameraControllerProps {
  initialTarget?: { x: number; y: number; z: number };
  initialTargetDistance?: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  initialTarget = { x: 0, y: 0, z: 0 },
  initialTargetDistance: propInitialDistance = 50
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<unknown>(null);
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, shift: false, space: false });
  const initialTargetDistance = useRef<number>(propInitialDistance);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const hasManualInput = keys.w || keys.a || keys.s || keys.d || keys.space;

  useEffect(() => {
    if (controlsRef.current && !isInitialized) {
      const controls = controlsRef.current as { target: THREE.Vector3; update: () => void };
      controls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
      controls.update();
      setIsInitialized(true);
      console.log('🎥 CameraController: Initialized with target:', initialTarget, 'distance:', propInitialDistance);
    }
  }, [initialTarget, propInitialDistance, isInitialized]);

  useEffect(() => {
    if (controlsRef.current && initialTargetDistance.current === propInitialDistance) {
      const controls = controlsRef.current as { target: THREE.Vector3; update: () => void };
      const currentTarget = controls.target;
      const actualDistance = camera.position.distanceTo(currentTarget);
      if (actualDistance > 0) {
        initialTargetDistance.current = actualDistance;
        console.log('🎥 CameraController: Captured actual target distance:', actualDistance);
      }
    }
  }, [camera, propInitialDistance]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys((prev) => ({ ...prev, [key]: true, shift: event.shiftKey }));
      } else if (event.key === ' ') {
        setKeys((prev) => ({ ...prev, space: true, shift: event.shiftKey }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys((prev) => ({ ...prev, [key]: false, shift: event.shiftKey }));
      } else if (event.key === ' ') {
        setKeys((prev) => ({ ...prev, space: false, shift: event.shiftKey }));
      }
    };

    const handleCameraFocus = (event: CustomEvent) => {
      console.log('🎥 CameraController: Received camera-focus-request event:', event.detail);
      
      const { position, entity, entity_id } = (event.detail || {}) as {
        position?: { x: number; y: number; z: number };
        entity?: { id?: string; title?: string };
        entity_id?: string;
      };

      // Guard against malformed events (same validation as LookupCameraController)
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        console.warn('🎥 CameraController: Ignoring camera-focus-request without concrete position', { position, entity_id, entity });
        return;
      }

      console.log('🎥 CameraController: Focusing on entity:', entity?.title || entity?.id || entity_id, 'at:', position);
      console.log('🎥 CameraController: Controls available:', !!controlsRef.current);
      
      if (controlsRef.current) {
        const controls = controlsRef.current as { target: THREE.Vector3; update: () => void };
        // Smoothly animate to the new target (same logic as LookupCameraController)
        const target = new THREE.Vector3(position.x, position.y, position.z);
        controls.target.copy(target);

        // Position camera at a good viewing angle (same offset as LookupCameraController)
        const offset = new THREE.Vector3(30, 20, 30);
        const newPosition = target.clone().add(offset);
        camera.position.copy(newPosition);

        controls.update();

        console.log('🎥 CameraController: Camera focused on entity at:', position);
      } else {
        console.warn('🎥 CameraController: Controls not available for camera focus');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('camera-focus-request', handleCameraFocus as EventListener);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('camera-focus-request', handleCameraFocus as EventListener);
    };
  }, [camera]);

  useFrame(() => {
    if (hasManualInput) {
      const moveSpeed = keys.shift ? 5 : 2.5; // Much slower movement
      
      // Free camera movement - move in camera's local space
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      if (keys.w) camera.position.addScaledVector(direction, moveSpeed);
      if (keys.s) camera.position.addScaledVector(direction, -moveSpeed);
      
      if (keys.a || keys.d) {
        const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
        if (keys.a) camera.position.addScaledVector(right, -moveSpeed);
        if (keys.d) camera.position.addScaledVector(right, moveSpeed);
      }
      
      if (keys.space) camera.position.y += moveSpeed;
      
      // When using manual input, update OrbitControls target to maintain seamless transition
      if (controlsRef.current) {
        const controls = controlsRef.current as { target: THREE.Vector3; update: () => void };
        // Calculate current distance from camera to target, fallback to initial distance
        const currentTarget = controls.target;
        const currentDistance = camera.position.distanceTo(currentTarget);
        const targetDistance = currentDistance > 0 ? currentDistance : initialTargetDistance.current;

        // Update target to maintain the same distance in camera's look direction
        const newTarget = camera.position.clone().add(direction.multiplyScalar(targetDistance));
        controls.target.copy(newTarget);

        // Pre-update the controls to prevent snapping
        controls.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={(instance) => { controlsRef.current = instance; }}
      enabled={!hasManualInput} // Only disable when WASD is active
      enableDamping
      dampingFactor={0.05}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      zoomSpeed={3.0}
      rotateSpeed={0.5}
      panSpeed={0.8}
    />
  );
};