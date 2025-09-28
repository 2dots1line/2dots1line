'use client';

/**
 * NASAStarfieldBackground - NASA Deep Star Maps 2020 Background
 * V11.0 - Reusable component for NASA OpenEXR starfield integration
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

interface NASAStarfieldBackgroundProps {
  resolution?: '8k' | '16k' | '32k';
  debug?: boolean;
}

export const NASAStarfieldBackground: React.FC<NASAStarfieldBackgroundProps> = ({ 
  resolution = '16k',
  debug = false 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new EXRLoader();
    const texturePath = `/NASA/starmap_2020_${resolution}.exr`;
    
    if (debug) {
      console.log(`🌌 Loading NASA star map: ${resolution}`);
    }
    
    loader.load(
      texturePath,
      (loadedTexture) => {
        if (debug) {
          console.log(`✅ NASA star map loaded`);
          console.log(`📐 Texture dimensions: ${loadedTexture.image?.width}x${loadedTexture.image?.height}`);
          console.log(`🎨 Texture format: ${loadedTexture.format}, type: ${loadedTexture.type}`);
        }
        
        // Configure texture for skybox
        loadedTexture.flipY = false;
        loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        
        setTexture(loadedTexture);
      },
      undefined,
      (err) => {
        console.error('❌ Failed to load NASA star map:', err);
      }
    );
  }, [resolution, debug]);

  useFrame(() => {
    if (meshRef.current && texture) {
      meshRef.current.rotation.y += 0.0001;
    }
  });

  if (!texture) {
    return null;
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5000, 64, 64]} />
      <meshBasicMaterial 
        map={texture}
        side={THREE.BackSide}
      />
    </mesh>
  );
};
