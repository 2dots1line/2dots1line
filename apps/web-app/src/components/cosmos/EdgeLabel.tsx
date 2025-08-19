import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface EdgeLabelProps {
  points: THREE.Vector3[];
  label: string;
  color?: string;
  edgeId: string;
}

/**
 * EdgeLabel
 * Renders a text label positioned along an edge to show the relationship type
 * Uses HTML overlay for consistent sizing with node labels
 */
export const EdgeLabel: React.FC<EdgeLabelProps> = ({ 
  points, 
  label, 
  color = '#ffffff',
  edgeId
}) => {
  const { camera, gl } = useThree();
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, visible: false });

  // Calculate the midpoint of the edge for label positioning
  const labelPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  
  useFrame(() => {
    if (points.length < 2) return;
    
    const start = points[0];
    const end = points[1];
    
    // Position label at the midpoint of the edge
    const midpoint = new THREE.Vector3();
    midpoint.addVectors(start, end);
    midpoint.multiplyScalar(0.5);
    
    // Add a small offset for better visibility
    midpoint.z += 0.5;
    
    labelPosition.current.copy(midpoint);
    
    // Convert 3D position to 2D screen coordinates
    const vector = midpoint.clone();
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (vector.y * -0.5 + 0.5) * gl.domElement.clientHeight;
    
    // Check if the point is in front of the camera
    const visible = vector.z < 1;
    
    setScreenPosition({ x, y, visible });
  });

  // Create HTML overlay element
  useEffect(() => {
    const labelElement = document.createElement('div');
    labelElement.id = `edge-label-${edgeId}`;
    labelElement.className = 'edge-label-overlay';
    labelElement.textContent = label;
    labelElement.style.cssText = `
      position: absolute;
      pointer-events: none;
      color: ${color};
      opacity: 0.4;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      white-space: nowrap;
      transform: translate(-50%, -50%);
      z-index: 999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: rgba(0,0,0,0.4);
      padding: 2px 6px;
      border-radius: 3px;
    `;
    
    document.body.appendChild(labelElement);
    
    return () => {
      const existingElement = document.getElementById(`edge-label-${edgeId}`);
      if (existingElement) {
        existingElement.remove();
      }
    };
  }, [edgeId, label, color]);

  // Update position of HTML element
  useEffect(() => {
    const labelElement = document.getElementById(`edge-label-${edgeId}`);
    if (labelElement) {
      if (screenPosition.visible) {
        labelElement.style.left = `${screenPosition.x}px`;
        labelElement.style.top = `${screenPosition.y}px`;
        labelElement.style.display = 'block';
      } else {
        labelElement.style.display = 'none';
      }
    }
  }, [screenPosition, edgeId]);

  // Return null since we're using HTML overlays
  return null;
}; 