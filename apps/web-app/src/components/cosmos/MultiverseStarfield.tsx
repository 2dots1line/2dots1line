import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * MultiverseStarfield - 1000 individual stars using multiverse approach
 * Based on the multiverse starfield system with PointsMaterial and star textures
 * Features realistic stellar classification colors and varied sizes
 */
export const MultiverseStarfield: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const [textures, setTextures] = React.useState<THREE.Texture[]>([]);

  // Load starfield textures (all varieties for 1000 stars)
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const texturePaths = [
      // All regular star textures
      '/textures/star1.png',
      '/textures/star2.png',
      '/textures/star3.png',
      '/textures/star4.png',
      '/textures/star5.png',
      '/textures/star6.png',
      '/textures/star7.png',
      '/textures/star8.png',
      '/textures/star9.png',
      '/textures/star10.png',
      '/textures/star11.png',
      // All bright star textures
      '/textures/brightstar1.png',
      '/textures/brightstar2.png',
      '/textures/brightstar3.png',
      '/textures/brightstar4.png',
    ];

    const loadTextures = async () => {
      const loadedTextures = await Promise.all(
        texturePaths.map(path => 
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              path,
              (texture) => {
                texture.magFilter = THREE.NearestFilter;
                resolve(texture);
              },
              undefined,
              reject
            );
          })
        )
      );
      setTextures(loadedTextures);
    };

    loadTextures();
  }, []);

  // Generate 1000 stars with randomized properties
  const { positions, colors, sizes, textureIndices } = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    const colors = new Float32Array(1000 * 3);
    const sizes = new Float32Array(1000);
    const textureIndices = new Float32Array(1000);

    for (let i = 0; i < 1000; i++) {
      // Random position in a larger sphere around the camera
      const radius = 15 + Math.random() * 120; // 15-135 units from center (expanded range)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Enhanced star color variety (realistic stellar classification)
      const colorVariation = Math.random();
      if (colorVariation < 0.1) {
        // O-type stars (blue-white, very hot)
        colors[i * 3] = 0.6 + Math.random() * 0.2;     // R
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 1.0;                       // B
      } else if (colorVariation < 0.25) {
        // B-type stars (blue-white, hot)
        colors[i * 3] = 0.7 + Math.random() * 0.2;     // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 1.0;                       // B
      } else if (colorVariation < 0.45) {
        // A-type stars (white, hot)
        const brightness = 0.8 + Math.random() * 0.2;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      } else if (colorVariation < 0.65) {
        // F-type stars (yellow-white, warm)
        colors[i * 3] = 1.0;                           // R
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1; // G
        colors[i * 3 + 2] = 0.7 + Math.random() * 0.2; // B
      } else if (colorVariation < 0.8) {
        // G-type stars (yellow, like our Sun)
        colors[i * 3] = 1.0;                           // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.5 + Math.random() * 0.2; // B
      } else if (colorVariation < 0.95) {
        // K-type stars (orange, cool)
        colors[i * 3] = 1.0;                           // R
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.3 + Math.random() * 0.2; // B
      } else {
        // M-type stars (red, very cool)
        colors[i * 3] = 1.0;                           // R
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.2 + Math.random() * 0.2; // B
      }

      // Enhanced size variety (0.2 to 5.0 for more dramatic range)
      const sizeVariation = Math.random();
      if (sizeVariation < 0.7) {
        // Most stars are small to medium
        sizes[i] = 0.2 + Math.random() * 1.8; // 0.2 to 2.0
      } else if (sizeVariation < 0.9) {
        // Some larger stars
        sizes[i] = 2.0 + Math.random() * 2.0; // 2.0 to 4.0
      } else {
        // Few giant stars
        sizes[i] = 4.0 + Math.random() * 1.0; // 4.0 to 5.0
      }

      // Random texture index (0-14, covering all loaded textures)
      textureIndices[i] = Math.floor(Math.random() * 15);
    }

    return { positions, colors, sizes, textureIndices };
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      // Gentle rotation for dynamic feel
      pointsRef.current.rotation.y += 0.0001;
      pointsRef.current.rotation.x += 0.00005;
    }
  });

  // Don't render until textures are loaded
  if (textures.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Render multiple star groups with different textures */}
      {textures.map((texture, textureIndex) => {
        // Filter stars that use this texture
        const starIndices = [];
        for (let i = 0; i < 1000; i++) {
          if (Math.floor(textureIndices[i]) === textureIndex) {
            starIndices.push(i);
          }
        }

        if (starIndices.length === 0) return null;

        // Create geometry for this texture group
        const groupPositions = new Float32Array(starIndices.length * 3);
        const groupColors = new Float32Array(starIndices.length * 3);
        const groupSizes = new Float32Array(starIndices.length);

        starIndices.forEach((starIndex, groupIndex) => {
          groupPositions[groupIndex * 3] = positions[starIndex * 3];
          groupPositions[groupIndex * 3 + 1] = positions[starIndex * 3 + 1];
          groupPositions[groupIndex * 3 + 2] = positions[starIndex * 3 + 2];

          groupColors[groupIndex * 3] = colors[starIndex * 3];
          groupColors[groupIndex * 3 + 1] = colors[starIndex * 3 + 1];
          groupColors[groupIndex * 3 + 2] = colors[starIndex * 3 + 2];

          groupSizes[groupIndex] = sizes[starIndex];
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(groupPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(groupColors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(groupSizes, 1));

        // Create material for this texture
        const material = new THREE.PointsMaterial({
          size: 1.0, // Base size, will be modified by size attribute
          map: texture,
          sizeAttenuation: true,
          depthWrite: false,
          transparent: true,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          opacity: 0.8
        });

        return (
          <points
            key={textureIndex}
            ref={textureIndex === 0 ? pointsRef : undefined}
            geometry={geometry}
            material={material}
          />
        );
      })}
    </group>
  );
};
