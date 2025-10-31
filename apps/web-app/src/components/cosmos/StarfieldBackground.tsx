import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * StarfieldBackground
 * Renders the immersive 3D starfield background for the Cosmos scene.
 * Ported and adapted from BackgroundStars in the Starfield prototype.
 */
export const StarfieldBackground: React.FC = () => {
  // Use 'any' to avoid type errors between R3F and Three.js
  const pointsRef = useRef<any>(null);

  // Generate star positions and colors
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    const colors = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      // Distribute in a large sphere
      const radius = 2000 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      // Subtle color variation
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness * 0.8;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * 0.9;
    }
    return { positions, colors };
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0002;
      pointsRef.current.rotation.x += 0.0001;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.8}
      />
    </points>
  );
};