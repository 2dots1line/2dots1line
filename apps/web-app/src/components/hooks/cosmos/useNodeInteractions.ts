/**
 * useNodeInteractions - Hook for node interaction management
 * V11.0 - Handles node selection, hover, and interaction events
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CosmosNode, NodeConnection } from '@2dots1line/shared-types';

// Local types to avoid circular dependencies
interface SimpleCosmosNode {
  id: string;
  title: string;
  position: { x: number; y: number; z: number };
  is_selected: boolean;
  is_hovered: boolean;
}

interface SimpleNodeConnection {
  id: string;
  target_node_id: string;
  connection_type: string;
  strength: number;
}

interface NodeInteractionState {
  hoveredNode: CosmosNode | null;
  selectedNodes: CosmosNode[];
  activeConnections: NodeConnection[];
  interactionMode: 'select' | 'connect' | 'navigate' | 'edit';
  draggedNode: CosmosNode | null;
  isMultiSelect: boolean;
}

interface NodeAnimationState {
  pulseNodes: Map<string, number>;
  glowNodes: Map<string, number>;
  scaleNodes: Map<string, number>;
}

interface UseNodeInteractionsOptions {
  enableHover?: boolean;
  enableSelection?: boolean;
  enableDrag?: boolean;
  enableMultiSelect?: boolean;
  maxSelections?: number;
  animationDuration?: number;
  debug?: boolean;
}

interface UseNodeInteractionsReturn {
  // State
  interactionState: NodeInteractionState;
  animationState: NodeAnimationState;
  
  // Node interactions
  onNodeHover: (node: CosmosNode | null) => void;
  onNodeClick: (node: CosmosNode, event?: MouseEvent) => void;
  onNodeDoubleClick: (node: CosmosNode) => void;
  onNodeDragStart: (node: CosmosNode) => void;
  onNodeDrag: (node: CosmosNode, position: THREE.Vector3) => void;
  onNodeDragEnd: (node: CosmosNode) => void;
  
  // Selection management
  selectNode: (node: CosmosNode) => void;
  deselectNode: (node: CosmosNode) => void;
  toggleNodeSelection: (node: CosmosNode) => void;
  selectAllNodes: (nodes: CosmosNode[]) => void;
  clearSelection: () => void;
  
  // Connection management
  createConnection: (fromNode: CosmosNode, toNode: CosmosNode) => void;
  removeConnection: (connection: NodeConnection) => void;
  toggleConnection: (fromNode: CosmosNode, toNode: CosmosNode) => void;
  
  // Animation controls
  pulseNode: (nodeId: string, duration?: number) => void;
  glowNode: (nodeId: string, intensity?: number) => void;
  scaleNode: (nodeId: string, scale?: number) => void;
  clearNodeAnimations: (nodeId: string) => void;
  
  // Utility functions
  getNodeInteractionData: (nodeId: string) => {
    isHovered: boolean;
    isSelected: boolean;
    isDragged: boolean;
    pulseValue: number;
    glowValue: number;
    scaleValue: number;
  };
  
  // Mode management
  setInteractionMode: (mode: NodeInteractionState['interactionMode']) => void;
  
  // Event handlers
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
}

export const useNodeInteractions = (options: UseNodeInteractionsOptions = {}): UseNodeInteractionsReturn => {
  const {
    enableHover = true,
    enableSelection = true,
    enableDrag = true,
    enableMultiSelect = true,
    maxSelections = 50,
    animationDuration = 1000,
    debug = false,
  } = options;

  // Interaction state
  const [interactionState, setInteractionState] = useState<NodeInteractionState>({
    hoveredNode: null,
    selectedNodes: [],
    activeConnections: [],
    interactionMode: 'select',
    draggedNode: null,
    isMultiSelect: false,
  });

  // Animation state
  const [animationState, setAnimationState] = useState<NodeAnimationState>({
    pulseNodes: new Map(),
    glowNodes: new Map(),
    scaleNodes: new Map(),
  });

  // Animation timers
  const animationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Node hover handler
  const onNodeHover = useCallback((node: CosmosNode | null) => {
    if (!enableHover) return;
    
    setInteractionState(prev => ({
      ...prev,
      hoveredNode: node,
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node hovered', node?.id);
  }, [enableHover, debug]);

  // Node click handler
  const onNodeClick = useCallback((node: CosmosNode, event?: MouseEvent) => {
    if (!enableSelection) return;
    
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;
    const isShiftPressed = event?.shiftKey;
    
    if (enableMultiSelect && (isCtrlPressed || isShiftPressed)) {
      toggleNodeSelection(node);
      setInteractionState(prev => ({ ...prev, isMultiSelect: true }));
    } else {
      // Single selection
      if (interactionState.selectedNodes.length === 1 && interactionState.selectedNodes[0].id === node.id) {
        // Deselect if clicking the same node
        clearSelection();
      } else {
        setInteractionState(prev => ({
          ...prev,
          selectedNodes: [node],
          isMultiSelect: false,
        }));
      }
    }
    
    // Pulse animation on click
    pulseNode(node.id);
    
    if (debug) console.log('🎯 useNodeInteractions: Node clicked', node.id);
  }, [enableSelection, enableMultiSelect, interactionState.selectedNodes, debug]);

  // Node double click handler
  const onNodeDoubleClick = useCallback((node: CosmosNode) => {
    // Double-click typically triggers navigation or focus
    if (debug) console.log('🎯 useNodeInteractions: Node double-clicked', node.id);
    
    // Enhanced glow animation for double-click
    glowNode(node.id, 2);
    
    // Custom event for navigation
    const event = new CustomEvent('nodeDoubleClick', { detail: node });
    window.dispatchEvent(event);
  }, [debug]);

  // Node drag handlers
  const onNodeDragStart = useCallback((node: CosmosNode) => {
    if (!enableDrag) return;
    
    setInteractionState(prev => ({
      ...prev,
      draggedNode: node,
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node drag started', node.id);
  }, [enableDrag, debug]);

  const onNodeDrag = useCallback((node: CosmosNode, position: THREE.Vector3) => {
    if (!enableDrag || interactionState.draggedNode?.id !== node.id) return;
    
    // Update node position
    const updatedNode = {
      ...node,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
    };
    
    // Custom event for position update
    const event = new CustomEvent('nodeDrag', { detail: { node: updatedNode, position } });
    window.dispatchEvent(event);
    
    if (debug) console.log('🎯 useNodeInteractions: Node dragged', node.id, position);
  }, [enableDrag, interactionState.draggedNode, debug]);

  const onNodeDragEnd = useCallback((node: CosmosNode) => {
    if (!enableDrag) return;
    
    setInteractionState(prev => ({
      ...prev,
      draggedNode: null,
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node drag ended', node.id);
  }, [enableDrag, debug]);

  // Selection management
  const selectNode = useCallback((node: CosmosNode) => {
    setInteractionState(prev => {
      const isAlreadySelected = prev.selectedNodes.some(n => n.id === node.id);
      if (isAlreadySelected) return prev;
      
      const newSelected = [...prev.selectedNodes, node];
      
      // Respect max selections
      if (newSelected.length > maxSelections) {
        newSelected.shift(); // Remove oldest selection
      }
      
      return {
        ...prev,
        selectedNodes: newSelected,
      };
    });
    
    if (debug) console.log('🎯 useNodeInteractions: Node selected', node.id);
  }, [maxSelections, debug]);

  const deselectNode = useCallback((node: CosmosNode) => {
    setInteractionState(prev => ({
      ...prev,
      selectedNodes: prev.selectedNodes.filter(n => n.id !== node.id),
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node deselected', node.id);
  }, [debug]);

  const toggleNodeSelection = useCallback((node: CosmosNode) => {
    const isSelected = interactionState.selectedNodes.some(n => n.id === node.id);
    
    if (isSelected) {
      deselectNode(node);
    } else {
      selectNode(node);
    }
  }, [interactionState.selectedNodes, selectNode, deselectNode]);

  const selectAllNodes = useCallback((nodes: CosmosNode[]) => {
    const limitedNodes = nodes.slice(0, maxSelections);
    
    setInteractionState(prev => ({
      ...prev,
      selectedNodes: limitedNodes,
      isMultiSelect: true,
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: All nodes selected', limitedNodes.length);
  }, [maxSelections, debug]);

  const clearSelection = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      selectedNodes: [],
      isMultiSelect: false,
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Selection cleared');
  }, [debug]);

  // Connection management
  const createConnection = useCallback((fromNode: CosmosNode, toNode: CosmosNode) => {
    const connection: NodeConnection = {
      id: `${fromNode.id}-${toNode.id}`,
      target_node_id: toNode.id,
      connection_type: 'related',
      strength: 1,
      metadata: {
        from_node_id: fromNode.id,
        color: '#00ff66'
      }
    };
    
    setInteractionState(prev => ({
      ...prev,
      activeConnections: [...prev.activeConnections, connection],
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Connection created', connection.id);
  }, [debug]);

  const removeConnection = useCallback((connection: NodeConnection) => {
    setInteractionState(prev => ({
      ...prev,
      activeConnections: prev.activeConnections.filter(c => c.id !== connection.id),
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Connection removed', connection.id);
  }, [debug]);

  const toggleConnection = useCallback((fromNode: CosmosNode, toNode: CosmosNode) => {
    const connectionId = `${fromNode.id}-${toNode.id}`;
    const existingConnection = interactionState.activeConnections.find(c => c.id === connectionId);
    
    if (existingConnection) {
      removeConnection(existingConnection);
    } else {
      createConnection(fromNode, toNode);
    }
  }, [interactionState.activeConnections, createConnection, removeConnection]);

  // Animation controls
  const pulseNode = useCallback((nodeId: string, duration = animationDuration) => {
    setAnimationState(prev => ({
      ...prev,
      pulseNodes: new Map(prev.pulseNodes).set(nodeId, 1),
    }));
    
    // Clear existing timer
    const existingTimer = animationTimers.current.get(`pulse-${nodeId}`);
    if (existingTimer) clearTimeout(existingTimer);
    
    // Set new timer
    const timer = setTimeout(() => {
      setAnimationState(prev => {
        const newPulseNodes = new Map(prev.pulseNodes);
        newPulseNodes.delete(nodeId);
        return { ...prev, pulseNodes: newPulseNodes };
      });
      animationTimers.current.delete(`pulse-${nodeId}`);
    }, duration);
    
    animationTimers.current.set(`pulse-${nodeId}`, timer);
    
    if (debug) console.log('🎯 useNodeInteractions: Node pulse started', nodeId);
  }, [animationDuration, debug]);

  const glowNode = useCallback((nodeId: string, intensity = 1) => {
    setAnimationState(prev => ({
      ...prev,
      glowNodes: new Map(prev.glowNodes).set(nodeId, intensity),
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node glow set', nodeId, intensity);
  }, [debug]);

  const scaleNode = useCallback((nodeId: string, scale = 1.5) => {
    setAnimationState(prev => ({
      ...prev,
      scaleNodes: new Map(prev.scaleNodes).set(nodeId, scale),
    }));
    
    if (debug) console.log('🎯 useNodeInteractions: Node scale set', nodeId, scale);
  }, [debug]);

  const clearNodeAnimations = useCallback((nodeId: string) => {
    setAnimationState(prev => {
      const newState = { ...prev };
      newState.pulseNodes = new Map(prev.pulseNodes);
      newState.glowNodes = new Map(prev.glowNodes);
      newState.scaleNodes = new Map(prev.scaleNodes);
      
      newState.pulseNodes.delete(nodeId);
      newState.glowNodes.delete(nodeId);
      newState.scaleNodes.delete(nodeId);
      
      return newState;
    });
    
    // Clear timers
    const pulseTimer = animationTimers.current.get(`pulse-${nodeId}`);
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      animationTimers.current.delete(`pulse-${nodeId}`);
    }
    
    if (debug) console.log('🎯 useNodeInteractions: Node animations cleared', nodeId);
  }, [debug]);

  // Utility function
  const getNodeInteractionData = useCallback((nodeId: string) => {
    return {
      isHovered: interactionState.hoveredNode?.id === nodeId,
      isSelected: interactionState.selectedNodes.some(n => n.id === nodeId),
      isDragged: interactionState.draggedNode?.id === nodeId,
      pulseValue: animationState.pulseNodes.get(nodeId) || 0,
      glowValue: animationState.glowNodes.get(nodeId) || 0,
      scaleValue: animationState.scaleNodes.get(nodeId) || 1,
    };
  }, [interactionState, animationState]);

  // Mode management
  const setInteractionMode = useCallback((mode: NodeInteractionState['interactionMode']) => {
    setInteractionState(prev => ({ ...prev, interactionMode: mode }));
    
    if (debug) console.log('🎯 useNodeInteractions: Interaction mode set', mode);
  }, [debug]);

  // Keyboard handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        clearSelection();
        break;
      case 'Delete':
      case 'Backspace':
        if (interactionState.selectedNodes.length > 0) {
          // Custom event for node deletion
          const event = new CustomEvent('deleteNodes', { detail: interactionState.selectedNodes });
          window.dispatchEvent(event);
        }
        break;
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Custom event for select all
          const selectAllEvent = new CustomEvent('selectAllNodes');
          window.dispatchEvent(selectAllEvent);
        }
        break;
    }
  }, [interactionState.selectedNodes, clearSelection]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setInteractionState(prev => ({ ...prev, isMultiSelect: false }));
    }
  }, []);

  // Animation frame updates
  useFrame((state, delta) => {
    // Update pulse animations
    setAnimationState(prev => {
      const newPulseNodes = new Map(prev.pulseNodes);
      let updated = false;
      
      for (const [nodeId, value] of newPulseNodes) {
        const newValue = Math.max(0, value - delta * 2); // Decay pulse
        if (newValue > 0) {
          newPulseNodes.set(nodeId, newValue);
          updated = true;
        } else {
          newPulseNodes.delete(nodeId);
          updated = true;
        }
      }
      
      return updated ? { ...prev, pulseNodes: newPulseNodes } : prev;
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationTimers.current.forEach(timer => clearTimeout(timer));
      animationTimers.current.clear();
    };
  }, []);

  return {
    // State
    interactionState,
    animationState,
    
    // Node interactions
    onNodeHover,
    onNodeClick,
    onNodeDoubleClick,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragEnd,
    
    // Selection management
    selectNode,
    deselectNode,
    toggleNodeSelection,
    selectAllNodes,
    clearSelection,
    
    // Connection management
    createConnection,
    removeConnection,
    toggleConnection,
    
    // Animation controls
    pulseNode,
    glowNode,
    scaleNode,
    clearNodeAnimations,
    
    // Utility functions
    getNodeInteractionData,
    
    // Mode management
    setInteractionMode,
    
    // Event handlers
    handleKeyDown,
    handleKeyUp,
  };
}; 