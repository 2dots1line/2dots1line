/**
 * useStarfield3D - Hook for 3D starfield background
 * V11.0 - Manages starfield particles and effects
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { CosmosNode } from '@2dots1line/shared-types';

// Local types to avoid circular dependencies
interface SimpleCosmosNode {
  id: string;
  title: string;
  position: { x: number; y: number; z: number };
  is_selected: boolean;
  is_hovered: boolean;
}

interface StarfieldConfig {
  starCount: number;
  fieldRadius: number;
  animationSpeed: number;
  colorVariation: boolean;
  particleSize: number;
}

interface StarfieldState {
  stars: THREE.Points | null;
  isLoading: boolean;
  error: string | null;
}

interface UseStarfield3DOptions {
  config?: Partial<StarfieldConfig>;
  nodes?: CosmosNode[];
  enableAnimations?: boolean;
  debug?: boolean;
}

interface UseStarfield3DReturn {
  // State
  starfield: StarfieldState;
  
  // Generated starfield data
  starPositions: Float32Array;
  starColors: Float32Array;
  
  // Node management
  processedNodes: CosmosNode[];
  nodePositions: Map<string, THREE.Vector3>;
  
  // Animation controls
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  
  // Configuration
  config: StarfieldConfig;
  updateConfig: (updates: Partial<StarfieldConfig>) => void;
  
  // Utilities
  regenerateStarfield: () => void;
  getNodePosition: (nodeId: string) => THREE.Vector3 | null;
  addNode: (node: CosmosNode) => void;
  removeNode: (nodeId: string) => void;
  
  // Performance
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const DEFAULT_CONFIG: StarfieldConfig = {
  starCount: 3000,
  fieldRadius: 2000,
  animationSpeed: 0.0002,
  colorVariation: true,
  particleSize: 1.0,
};

export const useStarfield3D = (options: UseStarfield3DOptions = {}): UseStarfield3DReturn => {
  const {
    config: configOverrides = {},
    nodes = [],
    debug = false,
  } = options;

  // Configuration state
  const [config, setConfig] = useState<StarfieldConfig>({
    ...DEFAULT_CONFIG,
    ...configOverrides,
  });

  // Animation state
  const [animationSpeed, setAnimationSpeed] = useState(config.animationSpeed);
  const [visible, setVisible] = useState(true);

  // Starfield state
  const [starfield, setStarfield] = useState<StarfieldState>({
    stars: null,
    isLoading: false,
    error: null,
  });

  // Node management
  const [processedNodes, setProcessedNodes] = useState<CosmosNode[]>([]);
  const nodePositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Generate starfield data
  const { starPositions, starColors } = useMemo(() => {
    if (debug) console.log('🌟 useStarfield3D: Generating starfield data');
    
    const positions = new Float32Array(config.starCount * 3);
    const colors = new Float32Array(config.starCount * 3);
    
    for (let i = 0; i < config.starCount; i++) {
      // Distribute stars in a sphere
      const radius = config.fieldRadius * 0.5 + Math.random() * config.fieldRadius * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      if (config.colorVariation) {
        // Cosmic color palette
        const type = Math.random();
        if (type < 0.3) {
          // Blue-white stars
          colors[i * 3] = 0.8 + Math.random() * 0.2;
          colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
          colors[i * 3 + 2] = 1.0;
        } else if (type < 0.6) {
          // Golden stars
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
          colors[i * 3 + 2] = 0.3 + Math.random() * 0.3;
        } else {
          // White stars
          const brightness = 0.7 + Math.random() * 0.3;
          colors[i * 3] = brightness;
          colors[i * 3 + 1] = brightness;
          colors[i * 3 + 2] = brightness;
        }
      } else {
        // Uniform white stars
        const brightness = 0.8 + Math.random() * 0.2;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      }
    }
    
    return { starPositions: positions, starColors: colors };
  }, [config.starCount, config.fieldRadius, config.colorVariation, debug]);

  // Process nodes for 3D positioning
  useEffect(() => {
    if (nodes.length === 0) return;
    
    if (debug) console.log('🌟 useStarfield3D: Processing nodes', nodes.length);
    
    const processed = nodes.map((node, index) => {
      // Use node's position if available, otherwise generate spiral layout
      let position: THREE.Vector3;
      
      if (node.position) {
        position = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
      } else {
        // Generate spiral galaxy layout
        const radius = 200 + index * 50;
        const angle = index * 0.5;
        const height = (Math.random() - 0.5) * 100;
        
        position = new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
      }
      
      nodePositions.current.set(node.id, position);
      
      return {
        ...node,
        position: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
      };
    });
    
    setProcessedNodes(processed);
  }, [nodes, debug]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<StarfieldConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Regenerate starfield
  const regenerateStarfield = useCallback(() => {
    if (debug) console.log('🌟 useStarfield3D: Regenerating starfield');
    setStarfield(prev => ({ ...prev, isLoading: true }));
    
    // Trigger re-render by updating config
    setConfig(prev => ({ ...prev }));
    
    setTimeout(() => {
      setStarfield(prev => ({ ...prev, isLoading: false }));
    }, 100);
  }, [debug]);

  // Node utilities
  const getNodePosition = useCallback((nodeId: string) => {
    return nodePositions.current.get(nodeId) || null;
  }, []);

  const addNode = useCallback((node: CosmosNode) => {
    if (debug) console.log('🌟 useStarfield3D: Adding node', node.id);
    
    setProcessedNodes(prev => {
      if (prev.find(n => n.id === node.id)) return prev;
      return [...prev, node];
    });
  }, [debug]);

  const removeNode = useCallback((nodeId: string) => {
    if (debug) console.log('🌟 useStarfield3D: Removing node', nodeId);
    
    setProcessedNodes(prev => prev.filter(n => n.id !== nodeId));
    nodePositions.current.delete(nodeId);
  }, [debug]);

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('🌟 useStarfield3D: State update', {
        config,
        starCount: starPositions.length / 3,
        nodeCount: processedNodes.length,
        visible,
        animationSpeed,
      });
    }
  }, [config, starPositions.length, processedNodes.length, visible, animationSpeed, debug]);

  return {
    // State
    starfield,
    
    // Generated data
    starPositions,
    starColors,
    
    // Node management
    processedNodes,
    nodePositions: nodePositions.current,
    
    // Animation controls
    animationSpeed,
    setAnimationSpeed,
    
    // Configuration
    config,
    updateConfig,
    
    // Utilities
    regenerateStarfield,
    getNodePosition,
    addNode,
    removeNode,
    
    // Performance
    visible,
    setVisible,
  };
}; 