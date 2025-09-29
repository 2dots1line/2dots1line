import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, shift: false, space: false });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' '].includes(key)) {
        setKeys((prev) => ({ ...prev, [key]: true, space: event.key === ' ' ? true : prev.space, shift: event.shiftKey }));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' '].includes(key)) {
        setKeys((prev) => ({ ...prev, [key]: false, space: event.key === ' ' ? false : prev.space, shift: event.shiftKey }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const moveSpeed = keys.shift ? 20 : 10;
    const hasManualInput = keys.w || keys.a || keys.s || keys.d || keys.space;

    if (hasManualInput) {
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
    }
  });

  // Use OrbitControls with no distance constraints for free movement
  // This allows both free 3D movement AND preserves hover detection
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      zoomSpeed={3.0}
      rotateSpeed={0.5}
      panSpeed={0.8}
      // Remove distance constraints for free flight through all layers
      // minDistance and maxDistance removed to allow unlimited movement
    />
  );
};