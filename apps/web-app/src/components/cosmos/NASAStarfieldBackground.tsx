'use client';

/**
 * NASAStarfieldBackground - NASA Deep Star Maps 2020 Background
 * V11.0 - Enhanced with loading states, caching, and fallbacks
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

interface NASAStarfieldBackgroundProps {
  resolution?: '4k' | '8k' | '16k' | '32k';
  debug?: boolean;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: Error) => void;
}

// Global texture cache to prevent reloading
const textureCache = new Map<string, THREE.Texture>();

// Loading state management
let isLoading = false;
const loadingCallbacks = new Set<() => void>();

export const NASAStarfieldBackground: React.FC<NASAStarfieldBackgroundProps> = ({ 
  resolution = '16k',
  debug = false,
  onLoadStart,
  onLoadComplete,
  onLoadError
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoadingTexture, setIsLoadingTexture] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const loadTexture = useCallback(async () => {
    const texturePath = `/NASA/starmap_2020_${resolution}.exr`;
    const cacheKey = `${texturePath}_${resolution}_v2`; // Add version to bust cache
    
    // Check cache first
    if (textureCache.has(cacheKey)) {
      if (debug) {
        console.log(`🌌 Using cached NASA star map: ${resolution}`);
      }
      setTexture(textureCache.get(cacheKey)!);
      onLoadComplete?.();
      return;
    }

    // If already loading, wait for it to complete
    if (isLoading) {
      if (debug) {
        console.log(`🌌 NASA star map already loading, waiting...`);
      }
      return new Promise<void>((resolve) => {
        loadingCallbacks.add(resolve);
      });
    }

    setIsLoadingTexture(true);
    isLoading = true;
    onLoadStart?.();

    if (debug) {
      console.log(`🌌 Loading NASA star map: ${resolution}`);
    }

    try {
      const loader = new EXRLoader();
      
      const loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          texturePath,
          (texture) => {
            if (debug) {
              console.log(`✅ NASA star map loaded`);
              console.log(`📐 Texture dimensions: ${texture.image?.width}x${texture.image?.height}`);
              console.log(`🎨 Texture format: ${texture.format}, type: ${texture.type}`);
            }
            
            // Configure texture for skybox
            texture.flipY = false;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            
            resolve(texture);
          },
          (progress) => {
            if (progress.lengthComputable) {
              const percent = (progress.loaded / progress.total) * 100;
              setLoadProgress(percent);
              if (debug) {
                console.log(`📊 Loading progress: ${percent.toFixed(1)}%`);
              }
            }
          },
          (err) => {
            console.error('❌ Failed to load NASA star map:', err);
            reject(err);
          }
        );
      });

      // Cache the texture
      textureCache.set(cacheKey, loadedTexture);
      setTexture(loadedTexture);
      setIsLoadingTexture(false);
      isLoading = false;
      onLoadComplete?.();

      // Notify waiting callbacks
      loadingCallbacks.forEach(callback => callback());
      loadingCallbacks.clear();

    } catch (error) {
      console.error('❌ Error loading NASA star map:', error);
      setIsLoadingTexture(false);
      isLoading = false;
      onLoadError?.(error as Error);
      
      // Notify waiting callbacks even on error
      loadingCallbacks.forEach(callback => callback());
      loadingCallbacks.clear();
    }
  }, [resolution, debug, onLoadStart, onLoadComplete, onLoadError]);

  useEffect(() => {
    loadTexture().catch(error => {
      console.error('Failed to load NASA background:', error);
      onLoadError?.(error);
    });
  }, [loadTexture]);

  useFrame(() => {
    if (meshRef.current && texture) {
      meshRef.current.rotation.y += 0.0001;
    }
  });

  // Return null while loading - no fallback background
  if (!texture) {
    return null;
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[15000, 64, 64]} />
      <meshBasicMaterial 
        map={texture}
        side={THREE.BackSide}
      />
    </mesh>
  );
};
