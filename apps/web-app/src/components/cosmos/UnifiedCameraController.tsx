'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { computeClusterView } from './computeClusterView';
import * as THREE from 'three';

interface CameraState {
  mode: 'orbit' | 'free' | 'focusing' | 'animating';
  target: THREE.Vector3;
  position: THREE.Vector3;
  isTransitioning: boolean;
  lastInputType: 'mouse' | 'keyboard' | 'touch' | 'programmatic';
  orbitControlsEnabled: boolean;
  freeCameraTarget: THREE.Vector3 | null;
  initialTargetDistance: number;
  currentTargetDistance: number;
}

interface CameraTransition {
  startPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  endPosition: THREE.Vector3;
  endTarget: THREE.Vector3;
  duration: number;
  startTime: number;
  easing: (t: number) => number;
}

interface UnifiedCameraControllerProps {
  initialTarget?: { x: number; y: number; z: number };
  initialDistance?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  cameraMode?: 'immediate' | 'animated'; // Allow scene-specific behavior
}

export const UnifiedCameraController: React.FC<UnifiedCameraControllerProps> = ({
  initialTarget = { x: 0, y: 0, z: 0 },
  initialDistance = 80,
  isMobile = false,
  hasTouch = false,
  cameraMode = 'animated'
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const transitionRef = useRef<CameraTransition | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [state, setState] = useState<CameraState>({
    mode: 'orbit',
    target: new THREE.Vector3(initialTarget.x, initialTarget.y, initialTarget.z),
    position: camera.position.clone(),
    isTransitioning: false,
    lastInputType: 'mouse',
    orbitControlsEnabled: true,
    freeCameraTarget: null,
    initialTargetDistance: initialDistance,
    currentTargetDistance: initialDistance
  });

  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false
  });
  
  // Use ref for immediate key state tracking to prevent sticky keys
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false
  });

  // Initialize camera position
  useEffect(() => {
    if (!isInitialized && controlsRef.current) {
      const target = new THREE.Vector3(initialTarget.x, initialTarget.y, initialTarget.z);
      
      // Use computeClusterView for consistent initial positioning
      const clusterView = computeClusterView({
        nodes: [{ x: initialTarget.x, y: initialTarget.y, z: initialTarget.z }],
        customTargetDistance: initialDistance,
        isMobile
      });
      
      // Position camera directly at cluster center from optimal distance
      const cameraPosition = new THREE.Vector3(
        clusterView.center.x,
        clusterView.center.y,
        clusterView.center.z + clusterView.optimalDistance
      );
      
      camera.position.copy(cameraPosition);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
      
      setIsInitialized(true);
      setState(prev => ({
        ...prev,
        target: target.clone(),
        position: cameraPosition.clone(),
        currentTargetDistance: cameraPosition.distanceTo(target)
      }));
      
      console.log('🎥 UnifiedCameraController: Initialized with target:', initialTarget, 'distance:', clusterView.optimalDistance);
    }
  }, [controlsRef.current, initialTarget, initialDistance, isInitialized, camera, isMobile]);

  // Handle camera focus requests - the core functionality
  useEffect(() => {
    const handleCameraFocus = (event: CustomEvent) => {
      const { position, entity, entity_id } = (event.detail || {}) as {
        position?: { x: number; y: number; z: number };
        entity?: { id?: string; title?: string };
        entity_id?: string;
      };

      // Guard against malformed events
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
        console.warn('🎥 UnifiedCameraController: Ignoring camera-focus-request without concrete position', { position, entity_id, entity });
        return;
      }

      console.log('🎥 UnifiedCameraController: Focusing on entity:', entity?.title || entity?.id || entity_id, 'at:', position);
      
      // Cancel any ongoing transition
      if (transitionRef.current) {
        transitionRef.current = null;
        setState(prev => ({ ...prev, isTransitioning: false }));
      }
      
      // Switch to orbit mode for entity focus (most reliable for positioning)
      setState(prev => ({ ...prev, mode: 'orbit', lastInputType: 'programmatic' }));
      
      // Pause auto rotation during camera focusing
      window.dispatchEvent(new CustomEvent('pause-auto-rotation', {
        detail: { pause: true, reason: 'entity-focus' }
      }));
      
      if (controlsRef.current) {
        const target = new THREE.Vector3(position.x, position.y, position.z);
        
        // Use computeClusterView to calculate optimal positioning for single entity
        const clusterView = computeClusterView({
          nodes: [{ x: position.x, y: position.y, z: position.z }],
          customTargetDistance: 80,
          isMobile
        });
        
        // Position camera directly at cluster center from optimal distance
        // No artificial angling - camera stares straight at the target
        const newPosition = new THREE.Vector3(
          clusterView.center.x,
          clusterView.center.y,
          clusterView.center.z + clusterView.optimalDistance
        );
        
        if (cameraMode === 'immediate') {
          // Immediate positioning (CameraController behavior)
          controlsRef.current.target.copy(target);
          camera.position.copy(newPosition);
          controlsRef.current.update();
          console.log('🎥 UnifiedCameraController: Immediate camera focus on entity at:', position);
        } else {
          // Smooth transition (LookupCameraController behavior)
          transitionRef.current = {
            startPosition: camera.position.clone(),
            startTarget: controlsRef.current.target.clone(),
            endPosition: newPosition,
            endTarget: target,
            duration: 1000, // 1 second
            startTime: Date.now(),
            easing: (t: number) => 1 - Math.pow(1 - t, 3) // Cubic ease-out
          };
          
          setState(prev => ({ 
            ...prev, 
            isTransitioning: true,
            mode: 'focusing'
          }));
          
          console.log('🎥 UnifiedCameraController: Starting smooth camera animation to entity at:', position);
        }
      }
    };

    // Handle mobile navigation events
    const handleCameraZoomIn = (event: CustomEvent) => {
      const { amount = 0.8 } = event.detail || {};
      if (controlsRef.current) {
        const currentDistance = camera.position.distanceTo(controlsRef.current.target);
        const newDistance = currentDistance * amount;
        const direction = camera.position.clone().sub(controlsRef.current.target).normalize();
        const newPosition = controlsRef.current.target.clone().add(direction.multiplyScalar(newDistance));
        camera.position.copy(newPosition);
        controlsRef.current.update();
        setState(prev => ({ ...prev, position: newPosition }));
      }
    };

    const handleCameraZoomOut = (event: CustomEvent) => {
      const { amount = 1.2 } = event.detail || {};
      if (controlsRef.current) {
        const currentDistance = camera.position.distanceTo(controlsRef.current.target);
        const newDistance = currentDistance * amount;
        const direction = camera.position.clone().sub(controlsRef.current.target).normalize();
        const newPosition = controlsRef.current.target.clone().add(direction.multiplyScalar(newDistance));
        camera.position.copy(newPosition);
        controlsRef.current.update();
        setState(prev => ({ ...prev, position: newPosition }));
      }
    };

    const handleCameraReset = (event: CustomEvent) => {
      // Use initial values from props/state instead of hardcoded defaults
      const resetTarget = initialTarget;
      const resetDistance = state.initialTargetDistance;
      
      if (controlsRef.current) {
        // Use computeClusterView for consistent reset positioning
        const clusterView = computeClusterView({
          nodes: [{ x: resetTarget.x, y: resetTarget.y, z: resetTarget.z }],
          customTargetDistance: resetDistance,
          isMobile
        });
        
        controlsRef.current.target.set(resetTarget.x, resetTarget.y, resetTarget.z);
        const cameraPosition = new THREE.Vector3(
          clusterView.center.x,
          clusterView.center.y,
          clusterView.center.z + clusterView.optimalDistance
        );
        camera.position.copy(cameraPosition);
        controlsRef.current.update();
        setState(prev => ({
          ...prev,
          target: new THREE.Vector3(resetTarget.x, resetTarget.y, resetTarget.z),
          position: cameraPosition.clone(),
          currentTargetDistance: clusterView.optimalDistance
        }));
        
        console.log('🎥 UnifiedCameraController: Camera reset to initial position:', resetTarget, 'distance:', clusterView.optimalDistance);
      }
    };

    const handleCameraToggleMode = (event: CustomEvent) => {
      const { mode = 'orbit' } = event.detail || {};
      if (mode === 'orbit') {
        setState(prev => ({ ...prev, mode: 'orbit', orbitControlsEnabled: true }));
      } else {
        setState(prev => ({ ...prev, mode: 'free', orbitControlsEnabled: false }));
      }
    };

    window.addEventListener('camera-focus-request', handleCameraFocus as EventListener);
    window.addEventListener('camera-zoom-in', handleCameraZoomIn as EventListener);
    window.addEventListener('camera-zoom-out', handleCameraZoomOut as EventListener);
    window.addEventListener('camera-reset', handleCameraReset as EventListener);
    window.addEventListener('camera-toggle-mode', handleCameraToggleMode as EventListener);

    return () => {
      window.removeEventListener('camera-focus-request', handleCameraFocus as EventListener);
      window.removeEventListener('camera-zoom-in', handleCameraZoomIn as EventListener);
      window.removeEventListener('camera-zoom-out', handleCameraZoomOut as EventListener);
      window.removeEventListener('camera-reset', handleCameraReset as EventListener);
      window.removeEventListener('camera-toggle-mode', handleCameraToggleMode as EventListener);
    };
  }, [camera]);

  // Handle keyboard input with mode management
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
        const key = event.key.toLowerCase() as 'w' | 'a' | 's' | 'd';
        // Update both state and ref immediately
        keysRef.current[key] = true;
        keysRef.current.shift = event.shiftKey;
        setKeys((prev) => ({ ...prev, [key]: true, shift: event.shiftKey }));
        
        // Switch to free camera mode when WASD is pressed
        if (state.mode === 'orbit') {
          // Use current orbit target as free camera target for seamless transition
          const currentTarget = controlsRef.current?.target || new THREE.Vector3();
          
          setState(prev => ({ 
            ...prev, 
            mode: 'free',
            lastInputType: 'keyboard',
            orbitControlsEnabled: false,
            freeCameraTarget: currentTarget.clone()
          }));
        }
      } else if (event.key === ' ') {
        // Update both state and ref immediately
        keysRef.current.space = true;
        keysRef.current.shift = event.shiftKey;
        setKeys((prev) => ({ ...prev, space: true, shift: event.shiftKey }));
        
        // Switch to free camera mode when Space is pressed
        if (state.mode === 'orbit') {
          // Use current orbit target as free camera target for seamless transition
          const currentTarget = controlsRef.current?.target || new THREE.Vector3();
          
          setState(prev => ({ 
            ...prev, 
            mode: 'free',
            lastInputType: 'keyboard',
            orbitControlsEnabled: false,
            freeCameraTarget: currentTarget.clone()
          }));
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
        const key = event.key.toLowerCase() as 'w' | 'a' | 's' | 'd';
        // Update both state and ref immediately
        keysRef.current[key] = false;
        keysRef.current.shift = event.shiftKey;
        
        setKeys((prev) => {
          const newKeys = { ...prev, [key]: false, shift: event.shiftKey };
          // Check if all keys are released after this update
          const allKeysReleased = !keysRef.current.w && !keysRef.current.a && !keysRef.current.s && !keysRef.current.d && !keysRef.current.space;
          if (allKeysReleased && state.mode === 'free') {
            // Update OrbitControls target to current camera position for smooth transition
            if (controlsRef.current) {
              // Calculate a target point in front of the camera
              const direction = new THREE.Vector3();
              camera.getWorldDirection(direction);
              const targetPoint = camera.position.clone().add(direction.multiplyScalar(50));
              controlsRef.current.target.copy(targetPoint);
              controlsRef.current.update();
            }
            
            setState(prev => ({ 
              ...prev, 
              mode: 'orbit',
              orbitControlsEnabled: true
            }));
          }
          return newKeys;
        });
      } else if (event.key === ' ') {
        // Update both state and ref immediately
        keysRef.current.space = false;
        keysRef.current.shift = event.shiftKey;
        
        setKeys((prev) => {
          const newKeys = { ...prev, space: false, shift: event.shiftKey };
          // Check if all keys are released after this update
          const allKeysReleased = !keysRef.current.w && !keysRef.current.a && !keysRef.current.s && !keysRef.current.d && !keysRef.current.space;
          if (allKeysReleased && state.mode === 'free') {
            // Update OrbitControls target to current camera position for smooth transition
            if (controlsRef.current) {
              // Calculate a target point in front of the camera
              const direction = new THREE.Vector3();
              camera.getWorldDirection(direction);
              const targetPoint = camera.position.clone().add(direction.multiplyScalar(50));
              controlsRef.current.target.copy(targetPoint);
              controlsRef.current.update();
            }
            
            setState(prev => ({ 
              ...prev, 
              mode: 'orbit',
              orbitControlsEnabled: true
            }));
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
  }, [state.mode, camera]);

  // Main animation loop
  useFrame(() => {
    const hasManualInput = keysRef.current.w || keysRef.current.a || keysRef.current.s || keysRef.current.d || keysRef.current.space;
    
    // Handle smooth transitions
    if (transitionRef.current) {
      const elapsed = Date.now() - transitionRef.current.startTime;
      const progress = Math.min(elapsed / transitionRef.current.duration, 1);
      const eased = transitionRef.current.easing(progress);
      
      camera.position.lerpVectors(
        transitionRef.current.startPosition,
        transitionRef.current.endPosition,
        eased
      );
      
      controlsRef.current.target.lerpVectors(
        transitionRef.current.startTarget,
        transitionRef.current.endTarget,
        eased
      );
      
      controlsRef.current.update();
      
          // Complete transition
          if (progress >= 1) {
            transitionRef.current = null;
            setState(prev => ({ 
              ...prev, 
              isTransitioning: false,
              mode: 'orbit'
            }));
            
            // Resume auto rotation after focusing is complete
            window.dispatchEvent(new CustomEvent('pause-auto-rotation', {
              detail: { pause: false, reason: 'entity-focus-complete' }
            }));
          }
    }
    
    // Handle free camera movement
    if (state.mode === 'free' && hasManualInput) {
      // Progressive speed scaling for deep space travel
      const distanceFromOrigin = camera.position.length();
      const speedMultiplier = Math.max(1, Math.min(10, distanceFromOrigin / 100)); // Scale up to 10x at 1000+ units
      const baseSpeed = keysRef.current.shift ? 5 : 2.5;
      const moveSpeed = baseSpeed * speedMultiplier;
      
      // Move in camera's local space for intuitive controls
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      if (keysRef.current.w) camera.position.addScaledVector(direction, moveSpeed);
      if (keysRef.current.s) camera.position.addScaledVector(direction, -moveSpeed);
      
      if (keysRef.current.a || keysRef.current.d) {
        const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
        if (keysRef.current.a) camera.position.addScaledVector(right, -moveSpeed);
        if (keysRef.current.d) camera.position.addScaledVector(right, moveSpeed);
      }
      
      if (keysRef.current.space) camera.position.y += moveSpeed;
      
      // Update state position only during free movement
      // Don't interfere with OrbitControls target during free movement
      setState(prev => ({ ...prev, position: camera.position.clone() }));
    }
  });

  // Handle OrbitControls changes
  const handleOrbitControlsChange = useCallback(() => {
    if (controlsRef.current && state.mode === 'orbit') {
      setState(prev => ({
        ...prev,
        target: controlsRef.current.target.clone(),
        position: camera.position.clone(),
        lastInputType: 'mouse'
      }));
    }
  }, [state.mode, camera.position]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={state.orbitControlsEnabled && !state.isTransitioning}
      enableDamping
      dampingFactor={0.05}
      
      // Mobile-optimized speeds
      rotateSpeed={isMobile ? 0.3 : 0.5}
      panSpeed={isMobile ? 0.6 : 0.8}
      zoomSpeed={isMobile ? 0.8 : 1.0}
      
      // Touch gesture configuration - CRITICAL for mobile
      touches={{
        ONE: THREE.TOUCH.ROTATE,    // Single finger = rotate
        TWO: THREE.TOUCH.DOLLY_PAN  // Two fingers = zoom + pan
      }}
      
      // Distance limits - extended for deep space travel
      minDistance={1}
      maxDistance={10000}
      
      // Mouse buttons
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      
      onChange={handleOrbitControlsChange}
    />
  );
};