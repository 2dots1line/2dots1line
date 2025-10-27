import * as THREE from 'three';

/**
 * Coordinate transformation utilities for camera positioning
 * 
 * Handles the "camera catching up with rotating cake stand" problem:
 * - Entity focus: Transform to current visual position (after rotation)
 * - Reset: Transform back to original position (before rotation)
 * 
 * Uses lazy evaluation - stores raw rotation values and computes matrices only when needed.
 */

let rawRotation = { x: 0, y: 0, z: 0 };

export const updateRawRotation = (rotation: { x: number; y: number; z: number }) => {
  rawRotation = { ...rotation };
};

export const getRawRotation = () => {
  return { ...rawRotation };
};

/**
 * Transform coordinates to current visual position (for entity focus)
 * Like adjusting camera angle to track a rotating cake
 * 
 * Lazy evaluation: Matrix computation happens only when this function is called
 */
export const transformCoordinatesByRotation = (position: { x: number; y: number; z: number }) => {
  try {
    const originalPosition = new THREE.Vector3(position.x, position.y, position.z);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(new THREE.Euler(rawRotation.x, rawRotation.y, rawRotation.z));
    
    const transformedPosition = originalPosition.clone().applyMatrix4(rotationMatrix);
    
    return {
      x: transformedPosition.x,
      y: transformedPosition.y,
      z: transformedPosition.z
    };
  } catch {
    return { x: position.x, y: position.y, z: position.z };
  }
};

/**
 * Transform coordinates back to initial state (for reset)
 * Like reversing camera tracking to return to original view
 * 
 * Lazy evaluation: Matrix computation happens only when this function is called
 */
export const transformCoordinatesToInitial = (position: { x: number; y: number; z: number }) => {
  try {
    const currentPosition = new THREE.Vector3(position.x, position.y, position.z);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(new THREE.Euler(-rawRotation.x, -rawRotation.y, -rawRotation.z));
    
    const initialPosition = currentPosition.clone().applyMatrix4(rotationMatrix);
    
    return {
      x: initialPosition.x,
      y: initialPosition.y,
      z: initialPosition.z
    };
  } catch {
    return { x: position.x, y: position.y, z: position.z };
  }
};
