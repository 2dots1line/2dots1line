/**
 * useCosmosNavigation - Hook for 3D cosmos navigation
 * V11.0 - Handles camera movement and navigation states
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Camera, Vector3 } from 'three';
import { CosmosNode, CosmosNavigationState } from '@2dots1line/shared-types';

// Local types to avoid circular dependencies
interface SimpleCosmosNode {
  id: string;
  title: string;
  position: { x: number; y: number; z: number };
  is_selected: boolean;
  is_hovered: boolean;
}

interface NavigationState {
  isFlying: boolean;
  isOrbiting: boolean;
  currentTarget: CosmosNode | null;
  cameraMode: 'free' | 'orbit' | 'follow' | 'cinematic';
  flySpeed: number;
  orbitSpeed: number;
}

interface FlightPath {
  start: THREE.Vector3;
  end: THREE.Vector3;
  duration: number;
  curve?: THREE.CatmullRomCurve3;
  onComplete?: () => void;
}

interface UseCosmosNavigationOptions {
  enableKeyboardControls?: boolean;
  enableMouseControls?: boolean;
  maxFlySpeed?: number;
  defaultCameraMode?: NavigationState['cameraMode'];
  autoOrbit?: boolean;
  debug?: boolean;
}

interface UseCosmosNavigationReturn {
  // State
  navigationState: NavigationState;
  
  // Camera controls
  flyToNode: (node: CosmosNode, duration?: number) => void;
  flyToPosition: (position: THREE.Vector3, duration?: number) => void;
  orbitNode: (node: CosmosNode, radius?: number) => void;
  followNode: (node: CosmosNode, distance?: number) => void;
  
  // Movement controls
  moveCamera: (direction: THREE.Vector3, speed?: number) => void;
  setCameraMode: (mode: NavigationState['cameraMode']) => void;
  setFlySpeed: (speed: number) => void;
  setOrbitSpeed: (speed: number) => void;
  
  // Utilities
  getCurrentCameraPosition: () => THREE.Vector3;
  getCurrentTarget: () => THREE.Vector3;
  resetCamera: () => void;
  stopAllMovement: () => void;
  
  // Path generation
  createFlightPath: (start: THREE.Vector3, end: THREE.Vector3, waypoints?: THREE.Vector3[]) => THREE.CatmullRomCurve3;
  
  // Keyboard/Mouse state
  keys: { [key: string]: boolean };
  mousePosition: { x: number; y: number };
}

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 100, 500);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const DEFAULT_FLY_SPEED = 2;
const DEFAULT_ORBIT_SPEED = 0.5;

export const useCosmosNavigation = (options: UseCosmosNavigationOptions = {}): UseCosmosNavigationReturn => {
  const {
    enableKeyboardControls = true,
    enableMouseControls = true,
    maxFlySpeed = 10,
    defaultCameraMode = 'free',
    autoOrbit = false,
    debug = false,
  } = options;

  // Three.js context
  const { camera, scene } = useThree();
  
  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isFlying: false,
    isOrbiting: false,
    currentTarget: null,
    cameraMode: defaultCameraMode,
    flySpeed: DEFAULT_FLY_SPEED,
    orbitSpeed: DEFAULT_ORBIT_SPEED,
  });

  // Animation state
  const currentFlight = useRef<FlightPath | null>(null);
  const flightProgress = useRef(0);
  const orbitCenter = useRef<THREE.Vector3>(new THREE.Vector3());
  const orbitRadius = useRef(300);
  const orbitAngle = useRef(0);
  
  // Control state
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Camera targets
  const cameraTarget = useRef<THREE.Vector3>(DEFAULT_CAMERA_TARGET.clone());
  const cameraVelocity = useRef<THREE.Vector3>(new THREE.Vector3());

  // Flight to node
  const flyToNode = useCallback((node: CosmosNode, duration = 2000) => {
    if (!node.position) return;
    
    const targetPosition = new THREE.Vector3(
      node.position.x + 100, // Offset to view the node
      node.position.y + 50,
      node.position.z + 100
    );
    
    flyToPosition(targetPosition, duration);
    
    setNavigationState(prev => ({
      ...prev,
      currentTarget: node,
      isFlying: true,
      cameraMode: 'follow',
    }));
    
    if (debug) console.log('🚀 useCosmosNavigation: Flying to node', node.id);
  }, [debug]);

  // Flight to position
  const flyToPosition = useCallback((position: THREE.Vector3, duration = 2000) => {
    const startPosition = camera.position.clone();
    
    currentFlight.current = {
      start: startPosition,
      end: position,
      duration,
      onComplete: () => {
        setNavigationState(prev => ({ ...prev, isFlying: false }));
        if (debug) console.log('🚀 useCosmosNavigation: Flight completed');
      },
    };
    
    flightProgress.current = 0;
    
    setNavigationState(prev => ({
      ...prev,
      isFlying: true,
    }));
    
    if (debug) console.log('🚀 useCosmosNavigation: Flying to position', position);
  }, [camera.position, debug]);

  // Orbit node
  const orbitNode = useCallback((node: CosmosNode, radius = 300) => {
    if (!node.position) return;
    
    orbitCenter.current.set(node.position.x, node.position.y, node.position.z);
    orbitRadius.current = radius;
    orbitAngle.current = 0;
    
    setNavigationState(prev => ({
      ...prev,
      currentTarget: node,
      isOrbiting: true,
      cameraMode: 'orbit',
    }));
    
    if (debug) console.log('🌀 useCosmosNavigation: Orbiting node', node.id);
  }, [debug]);

  // Follow node
  const followNode = useCallback((node: CosmosNode, distance = 200) => {
    if (!node.position) return;
    
    const followPosition = new THREE.Vector3(
      node.position.x,
      node.position.y + distance * 0.5,
      node.position.z + distance
    );
    
    cameraTarget.current.copy(followPosition);
    
    setNavigationState(prev => ({
      ...prev,
      currentTarget: node,
      cameraMode: 'follow',
    }));
    
    if (debug) console.log('👁️ useCosmosNavigation: Following node', node.id);
  }, [debug]);

  // Move camera
  const moveCamera = useCallback((direction: THREE.Vector3, speed = navigationState.flySpeed) => {
    const normalizedDirection = direction.clone().normalize();
    const velocity = normalizedDirection.multiplyScalar(speed);
    
    cameraVelocity.current.add(velocity);
    
    if (debug) console.log('🎮 useCosmosNavigation: Moving camera', direction);
  }, [navigationState.flySpeed, debug]);

  // Set camera mode
  const setCameraMode = useCallback((mode: NavigationState['cameraMode']) => {
    setNavigationState(prev => ({ ...prev, cameraMode: mode }));
    
    if (mode === 'free') {
      setNavigationState(prev => ({ 
        ...prev, 
        isFlying: false, 
        isOrbiting: false,
        currentTarget: null 
      }));
    }
    
    if (debug) console.log('📹 useCosmosNavigation: Camera mode changed to', mode);
  }, [debug]);

  // Speed controls
  const setFlySpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.1, Math.min(maxFlySpeed, speed));
    setNavigationState(prev => ({ ...prev, flySpeed: clampedSpeed }));
  }, [maxFlySpeed]);

  const setOrbitSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.1, Math.min(5, speed));
    setNavigationState(prev => ({ ...prev, orbitSpeed: clampedSpeed }));
  }, []);

  // Utilities
  const getCurrentCameraPosition = useCallback(() => {
    return camera.position.clone();
  }, [camera.position]);

  const getCurrentTarget = useCallback(() => {
    return cameraTarget.current.clone();
  }, []);

  const resetCamera = useCallback(() => {
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    cameraTarget.current.copy(DEFAULT_CAMERA_TARGET);
    camera.lookAt(cameraTarget.current);
    
    setNavigationState(prev => ({
      ...prev,
      isFlying: false,
      isOrbiting: false,
      currentTarget: null,
      cameraMode: 'free',
    }));
    
    if (debug) console.log('🔄 useCosmosNavigation: Camera reset');
  }, [camera, debug]);

  const stopAllMovement = useCallback(() => {
    currentFlight.current = null;
    cameraVelocity.current.set(0, 0, 0);
    
    setNavigationState(prev => ({
      ...prev,
      isFlying: false,
      isOrbiting: false,
    }));
    
    if (debug) console.log('⏹️ useCosmosNavigation: All movement stopped');
  }, [debug]);

  // Create flight path
  const createFlightPath = useCallback((start: THREE.Vector3, end: THREE.Vector3, waypoints?: THREE.Vector3[]) => {
    const points = [start];
    
    if (waypoints) {
      points.push(...waypoints);
    }
    
    points.push(end);
    
    return new THREE.CatmullRomCurve3(points);
  }, []);

  // Animation frame
  useFrame((state, delta) => {
    // Handle flight animations
    if (currentFlight.current && navigationState.isFlying) {
      flightProgress.current += delta * 1000 / currentFlight.current.duration;
      
      if (flightProgress.current >= 1) {
        camera.position.copy(currentFlight.current.end);
        currentFlight.current.onComplete?.();
        currentFlight.current = null;
        flightProgress.current = 0;
      } else {
        // Smooth interpolation
        const t = flightProgress.current;
        const smoothT = t * t * (3 - 2 * t); // Smoothstep
        
        camera.position.lerpVectors(
          currentFlight.current.start,
          currentFlight.current.end,
          smoothT
        );
      }
    }
    
    // Handle orbit animations
    if (navigationState.isOrbiting && navigationState.currentTarget) {
      orbitAngle.current += delta * navigationState.orbitSpeed;
      
      const x = orbitCenter.current.x + Math.cos(orbitAngle.current) * orbitRadius.current;
      const z = orbitCenter.current.z + Math.sin(orbitAngle.current) * orbitRadius.current;
      const y = orbitCenter.current.y + Math.sin(orbitAngle.current * 0.5) * 50;
      
      camera.position.set(x, y, z);
      camera.lookAt(orbitCenter.current);
    }
    
    // Handle free movement
    if (navigationState.cameraMode === 'free' && !navigationState.isFlying) {
      // Apply velocity
      if (cameraVelocity.current.length() > 0) {
        camera.position.add(cameraVelocity.current.multiplyScalar(delta));
        cameraVelocity.current.multiplyScalar(0.95); // Damping
      }
      
      // Handle keyboard controls
      if (enableKeyboardControls) {
        const moveSpeed = navigationState.flySpeed * delta * 60;
        
        if (keys['w'] || keys['ArrowUp']) {
          camera.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(moveSpeed));
        }
        if (keys['s'] || keys['ArrowDown']) {
          camera.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-moveSpeed));
        }
        if (keys['a'] || keys['ArrowLeft']) {
          camera.position.add(new THREE.Vector3().crossVectors(camera.up, camera.getWorldDirection(new THREE.Vector3())).multiplyScalar(moveSpeed));
        }
        if (keys['d'] || keys['ArrowRight']) {
          camera.position.add(new THREE.Vector3().crossVectors(camera.getWorldDirection(new THREE.Vector3()), camera.up).multiplyScalar(moveSpeed));
        }
        if (keys['q']) {
          camera.position.y += moveSpeed;
        }
        if (keys['e']) {
          camera.position.y -= moveSpeed;
        }
      }
    }
    
    // Handle follow mode
    if (navigationState.cameraMode === 'follow' && navigationState.currentTarget && !navigationState.isFlying) {
      const targetPos = new THREE.Vector3(
        navigationState.currentTarget.position?.x || 0,
        navigationState.currentTarget.position?.y || 0,
        navigationState.currentTarget.position?.z || 0
      );
      
      camera.position.lerp(targetPos.clone().add(new THREE.Vector3(100, 50, 100)), delta * 2);
      camera.lookAt(targetPos);
    }
  });

  // Keyboard event handlers
  useEffect(() => {
    if (!enableKeyboardControls) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.key.toLowerCase()]: true }));
      
      // Special key handlers
      if (event.key === 'Escape') {
        stopAllMovement();
      }
      if (event.key === 'r') {
        resetCamera();
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.key.toLowerCase()]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableKeyboardControls, stopAllMovement, resetCamera]);

  // Mouse event handlers
  useEffect(() => {
    if (!enableMouseControls) return;
    
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableMouseControls]);

  // Auto-orbit setup
  useEffect(() => {
    if (autoOrbit && navigationState.currentTarget) {
      orbitNode(navigationState.currentTarget);
    }
  }, [autoOrbit, navigationState.currentTarget, orbitNode]);

  return {
    // State
    navigationState,
    
    // Camera controls
    flyToNode,
    flyToPosition,
    orbitNode,
    followNode,
    
    // Movement controls
    moveCamera,
    setCameraMode,
    setFlySpeed,
    setOrbitSpeed,
    
    // Utilities
    getCurrentCameraPosition,
    getCurrentTarget,
    resetCamera,
    stopAllMovement,
    
    // Path generation
    createFlightPath,
    
    // Input state
    keys,
    mousePosition,
  };
}; 