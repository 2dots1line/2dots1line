import React, { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCosmosStore } from '../../stores/CosmosStore';

interface NodeLabelProps {
  text: string;
  position: THREE.Vector3;
  hovered: boolean;
  nodeId: string;
  modalOpen?: boolean;
  isHighlighted?: boolean; // New prop to indicate if this node should show label when labels are off
  nodeRef?: React.RefObject<THREE.Group>; // Reference to the actual node for world position
}

export const NodeLabel: React.FC<NodeLabelProps> = ({ 
  text, 
  position, 
  hovered, 
  nodeId, 
  modalOpen = false,
  isHighlighted = false,
  nodeRef
}) => {
  const { camera, gl } = useThree();
  const { showNodeLabels } = useCosmosStore();
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, visible: false });
  const displayName = text && text.length > 25 ? text.substring(0, 25) + '...' : text || 'Unknown';

  // Determine if this label should be visible
  const shouldShowLabel = () => {
    if (modalOpen) return false;
    if (showNodeLabels) return true; // Show all labels when toggle is on
    if (hovered) return true; // Always show label for hovered node
    if (isHighlighted) return true; // Show label for connected nodes when hovered
    return false; // Hide label when toggle is off and not hovered/connected
  };

  // Convert 3D position to 2D screen coordinates
  useFrame(() => {
    let worldPosition: THREE.Vector3;
    
    // Get the actual world position of the node if nodeRef is provided
    if (nodeRef?.current) {
      // Get the world position of the node after all transformations
      worldPosition = new THREE.Vector3();
      nodeRef.current.getWorldPosition(worldPosition);
    } else {
      // Fallback to the static position (for backward compatibility)
      worldPosition = position.clone();
    }
    
    const vector = worldPosition.clone();
    vector.project(camera);
    
    // Debug logging for first few nodes
    if (nodeId === 'mu-001' || nodeId === 'concept-def') {
      console.log(`🔍 NodeLabel ${nodeId}:`, {
        staticPosition: { x: position.x, y: position.y, z: position.z },
        worldPosition: { x: worldPosition.x, y: worldPosition.y, z: worldPosition.z },
        projectedVector: { x: vector.x, y: vector.y, z: vector.z },
        screenCoords: { 
          x: (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth,
          y: (vector.y * -0.5 + 0.5) * gl.domElement.clientHeight
        },
        canvasSize: { width: gl.domElement.clientWidth, height: gl.domElement.clientHeight }
      });
    }
    
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * gl.domElement.clientHeight;
    
    // Check if the point is in front of the camera
    const visible = vector.z < 1;
    
    setScreenPosition({ x, y, visible });
  });

  // Create HTML overlay element
  useEffect(() => {
    const labelElement = document.createElement('div');
    labelElement.id = `node-label-${nodeId}`;
    labelElement.className = 'node-label-overlay';
    labelElement.textContent = displayName;
    labelElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      color: ${hovered ? '#00ffff' : '#ffffff'};
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      white-space: nowrap;
      transform: translate(-50%, -100%);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: ${hovered ? 1.0 : 0.8};
    `;
    
    document.body.appendChild(labelElement);
    
    return () => {
      const existingElement = document.getElementById(`node-label-${nodeId}`);
      if (existingElement) {
        existingElement.remove();
      }
    };
  }, [nodeId, displayName, hovered]);

  // Update position and visibility of HTML element
  useEffect(() => {
    const labelElement = document.getElementById(`node-label-${nodeId}`);
    if (labelElement) {
      if (screenPosition.visible && shouldShowLabel()) {
        labelElement.style.left = `${screenPosition.x}px`;
        labelElement.style.top = `${screenPosition.y}px`;
        labelElement.style.display = 'block';
        labelElement.style.zIndex = '1000';
      } else {
        labelElement.style.display = 'none';
      }
    }
  }, [screenPosition, nodeId, modalOpen, showNodeLabels, hovered, isHighlighted]);

  // Return null since we're using HTML overlays
  return null;
};