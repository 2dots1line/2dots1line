import * as THREE from 'three';

/**
 * Coordinate transformation utilities for camera positioning
 * 
 * Handles the "camera catching up with rotating cake stand" problem:
 * - Entity focus: Transform to current visual position (after rotation)
 * - Reset: Transform back to original position (before rotation)
 */

let currentRotation = { x: 0, y: 0, z: 0 };

export const updateCurrentRotation = (rotation: { x: number; y: number; z: number }) => {
  currentRotation = { ...rotation };
};

export const getCurrentRotation = () => {
  return { ...currentRotation };
};

/**
 * Transform coordinates to current visual position (for entity focus)
 * Like adjusting camera angle to track a rotating cake
 */
export const transformCoordinatesByRotation = (position: { x: number; y: number; z: number }) => {
  const originalPosition = new THREE.Vector3(position.x, position.y, position.z);
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(currentRotation.x, currentRotation.y, currentRotation.z));
  
  const transformedPosition = originalPosition.clone().applyMatrix4(rotationMatrix);
  
  return {
    x: transformedPosition.x,
    y: transformedPosition.y,
    z: transformedPosition.z
  };
};

/**
 * Transform coordinates back to initial state (for reset)
 * Like reversing camera tracking to return to original view
 */
export const transformCoordinatesToInitial = (position: { x: number; y: number; z: number }) => {
  const currentPosition = new THREE.Vector3(position.x, position.y, position.z);
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(-currentRotation.x, -currentRotation.y, -currentRotation.z));
  
  const initialPosition = currentPosition.clone().applyMatrix4(rotationMatrix);
  
  return {
    x: initialPosition.x,
    y: initialPosition.y,
    z: initialPosition.z
  };
};
