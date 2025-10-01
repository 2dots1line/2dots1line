import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface CameraControllerProps {
  flySpeed?: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({ flySpeed = 2.5 }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, shift: false, space: false });
  
  // Calculate if manual input is active (for OrbitControls enabled state)
  const hasManualInput = keys.w || keys.a || keys.s || keys.d || keys.space;

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
      const { position, entity } = event.detail;
      console.log('🎥 CameraController: Focusing camera on entity:', entity.title, 'at position:', position);
      
      // Position camera near the entity
      camera.position.set(
        position.x + 20, // Offset to view the entity
        position.y + 20,
        position.z + 20
      );
      
      // Look at the entity
      camera.lookAt(position.x, position.y, position.z);
      
      // Update camera controls if they exist
      if (controlsRef.current) {
        controlsRef.current.target.set(position.x, position.y, position.z);
        controlsRef.current.update();
      }
      
      console.log('🎥 Camera focused on entity at:', position);
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
      const moveSpeed = keys.shift ? flySpeed * 2 : flySpeed; // Use flySpeed from navigation controls
      
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
      
      // When using manual input, update OrbitControls target to current camera position
      // This prevents snapping when switching back to OrbitControls
      if (controlsRef.current) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const target = camera.position.clone().add(direction.multiplyScalar(50));
        controlsRef.current.target.copy(target);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
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