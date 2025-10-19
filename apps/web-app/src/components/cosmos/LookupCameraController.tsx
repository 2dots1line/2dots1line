import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useRef, useEffect, useState } from 'react';
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
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false, shift: false, space: false });
  const initialTargetDistance = useRef<number>(initialDistance);
  
  // Camera animation ref for smooth transitions
  const cameraAnimationRef = useRef<{
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endPosition: THREE.Vector3;
    endTarget: THREE.Vector3;
    progress: number;
    duration: number;
    startTime: number;
  } | null>(null);
  
  // Camera mode state - this is the key to solving all issues holistically
  const [cameraMode, setCameraMode] = useState<'orbit' | 'free'>('orbit');
  const [freeCameraTarget, setFreeCameraTarget] = useState<THREE.Vector3 | null>(null);
  
  // Calculate if manual input is active
  const hasManualInput = keys.w || keys.a || keys.s || keys.d || keys.space;
  
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

  // Handle camera focus requests - works in both modes
  useEffect(() => {
    const handleCameraFocus = (event: CustomEvent) => {
      const { position, entity, entity_id } = (event.detail || {}) as {
        position?: { x: number; y: number; z: number };
        entity?: { id?: string; title?: string };
        entity_id?: string;
      };

      // Guard against malformed events
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        console.warn('🎥 LookupCameraController: Ignoring camera-focus-request without concrete position', { position, entity_id, entity });
        return;
      }

      console.log('🎥 LookupCameraController: Focusing on entity:', entity?.title || entity?.id || entity_id, 'at:', position);
      
      // Switch to orbit mode for entity focus (most reliable for positioning)
      setCameraMode('orbit');
      
      if (controlsRef.current) {
        const target = new THREE.Vector3(position.x, position.y, position.z);
        const offset = new THREE.Vector3(-10, 20, 50); // Slightly negative X to position entity left of center
        const newPosition = target.clone().add(offset);
        
        // Store animation target for smooth transition
        cameraAnimationRef.current = {
          startPosition: camera.position.clone(),
          startTarget: controlsRef.current.target.clone(),
          endPosition: newPosition,
          endTarget: target,
          progress: 0,
          duration: 1000, // 1 second
          startTime: Date.now()
        };
        
        console.log('🎥 LookupCameraController: Starting smooth camera animation to entity at:', position);
      }
    };

    window.addEventListener('camera-focus-request', handleCameraFocus as EventListener);

    return () => {
      window.removeEventListener('camera-focus-request', handleCameraFocus as EventListener);
    };
  }, [camera]);

  // Animation frame handler for smooth camera transitions
  useFrame(() => {
    if (cameraAnimationRef.current && controlsRef.current) {
      const elapsed = Date.now() - cameraAnimationRef.current.startTime;
      const progress = Math.min(elapsed / cameraAnimationRef.current.duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      // Interpolate camera position and target
      camera.position.lerpVectors(
        cameraAnimationRef.current.startPosition,
        cameraAnimationRef.current.endPosition,
        eased
      );
      
      controlsRef.current.target.lerpVectors(
        cameraAnimationRef.current.startTarget,
        cameraAnimationRef.current.endTarget,
        eased
      );
      
      controlsRef.current.update();
      
      // Clear animation when complete
      if (progress >= 1) {
        cameraAnimationRef.current = null;
      }
    }
  });

  // Keyboard event handlers for WASD controls with mode management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle WASD/space if user is not typing in an input field
      const activeElement = document.activeElement as HTMLElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );
      
      if (isTyping) {
        return; // Don't handle camera controls when typing in chat/inputs
      }
      
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setKeys((prev) => ({ ...prev, [event.key.toLowerCase()]: true, shift: event.shiftKey }));
        // Switch to free camera mode when WASD is pressed
        if (cameraMode === 'orbit') {
          setCameraMode('free');
          // Store current camera position as free camera target
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          const targetDistance = 50;
          const newTarget = camera.position.clone().add(direction.multiplyScalar(targetDistance));
          setFreeCameraTarget(newTarget);
        }
      } else if (event.key === ' ') {
        setKeys((prev) => ({ ...prev, space: true, shift: event.shiftKey }));
        // Switch to free camera mode when Space is pressed
        if (cameraMode === 'orbit') {
          setCameraMode('free');
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          const targetDistance = 50;
          const newTarget = camera.position.clone().add(direction.multiplyScalar(targetDistance));
          setFreeCameraTarget(newTarget);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Only handle WASD/space if user is not typing in an input field
      const activeElement = document.activeElement as HTMLElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );
      
      if (isTyping) {
        return; // Don't handle camera controls when typing in chat/inputs
      }
      
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setKeys((prev) => {
          const newKeys = { ...prev, [event.key.toLowerCase()]: false, shift: event.shiftKey };
          // Check if all keys are released after this update
          const allKeysReleased = !newKeys.w && !newKeys.a && !newKeys.s && !newKeys.d && !newKeys.space;
          if (allKeysReleased && cameraMode === 'free') {
            // Switch back to orbit mode
            setCameraMode('orbit');
            // Update OrbitControls target to current free camera target
            if (controlsRef.current && freeCameraTarget) {
              controlsRef.current.target.copy(freeCameraTarget);
              controlsRef.current.update();
            }
          }
          return newKeys;
        });
      } else if (event.key === ' ') {
        setKeys((prev) => {
          const newKeys = { ...prev, space: false, shift: event.shiftKey };
          // Check if all keys are released after this update
          const allKeysReleased = !newKeys.w && !newKeys.a && !newKeys.s && !newKeys.d && !newKeys.space;
          if (allKeysReleased && cameraMode === 'free') {
            // Switch back to orbit mode
            setCameraMode('orbit');
            // Update OrbitControls target to current free camera target
            if (controlsRef.current && freeCameraTarget) {
              controlsRef.current.target.copy(freeCameraTarget);
              controlsRef.current.update();
            }
          }
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode, hasManualInput, camera, freeCameraTarget]);

  // Handle camera movement based on mode
  useFrame(() => {
    if (cameraMode === 'free' && hasManualInput) {
      // FREE CAMERA MODE: Pure WASD movement with no constraints
      const moveSpeed = keys.shift ? 5 : 2.5;
      
      // Move in camera's local space for intuitive controls
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
      
      // Update free camera target for smooth transition back to orbit mode
      const targetDistance = 50;
      const newTarget = camera.position.clone().add(direction.multiplyScalar(targetDistance));
      setFreeCameraTarget(newTarget);
    }
    // ORBIT MODE: OrbitControls handles everything automatically
  });

  // Debug logging for mode changes
  useEffect(() => {
    console.log('🎥 LookupCameraController: Camera mode changed to:', cameraMode, 'OrbitControls enabled:', cameraMode === 'orbit');
  }, [cameraMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={cameraMode === 'orbit'} // Only enable in orbit mode
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
