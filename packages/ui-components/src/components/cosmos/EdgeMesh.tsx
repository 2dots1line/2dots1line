import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * EdgeMesh
 * Renders a graph edge as a 3D line or curve, colored by type/community.
 * To be used in the Cosmos 3D graph scene.
 */
export const EdgeMesh: React.FC<{ points: THREE.Vector3[] }> = ({ points }) => {
  // Memoize the geometry so it's only created when points change
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setFromPoints(points);
    return geom;
  }, [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      {/* TODO: Add material, color, etc. */}
    </line>
  );
};