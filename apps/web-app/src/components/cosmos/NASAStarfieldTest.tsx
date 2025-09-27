'use client';

/**
 * NASAStarfieldTest - Test component for NASA Deep Star Maps 2020
 * V11.0 - Isolated testing of OpenEXR integration
 */

import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CameraController } from './CameraController';

// EXRLoader import
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

interface NASAStarfieldProps {
  resolution?: '8k' | '16k' | '32k';
  debug?: boolean;
}

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
      <div className="text-lg">Loading NASA Star Map...</div>
      <div className="text-sm opacity-75 mt-2">Loading 8k OpenEXR texture</div>
    </div>
  </div>
);

// Simplified NASA Starfield Background Component
const NASAStarfieldBackground: React.FC<{ resolution: string }> = ({ resolution }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new EXRLoader();
    const texturePath = `/NASA/starmap_2020_${resolution}.exr`;
    
    console.log(`🌌 Loading NASA star map: ${resolution}`);
    
    loader.load(
      texturePath,
      (loadedTexture) => {
        console.log(`✅ NASA star map loaded`);
        console.log(`📐 Texture dimensions: ${loadedTexture.image?.width}x${loadedTexture.image?.height}`);
        console.log(`🎨 Texture format: ${loadedTexture.format}, type: ${loadedTexture.type}`);
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
  }, [resolution]);

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
      <sphereGeometry args={[10000, 64, 64]} />
      <meshBasicMaterial 
        map={texture}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Removed TestCameraController - using OrbitControls directly

// Performance Monitor - Must be inside Canvas
const PerformanceMonitor: React.FC<{ 
  loadTime: number; 
  resolution: string;
  onFpsUpdate?: (fps: number) => void;
}> = ({ 
  loadTime, 
  resolution,
  onFpsUpdate
}) => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  useFrame(() => {
    frameCount.current++;
    const now = Date.now();
    
    if (now - lastTime.current >= 1000) {
      const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      setFps(currentFps);
      onFpsUpdate?.(currentFps);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  // This component should not render UI - it's just for monitoring
  return null;
};

// Main Test Component
export const NASAStarfieldTest: React.FC<NASAStarfieldProps> = ({ 
  resolution = '8k',
  debug = true 
}) => {
  const [fps, setFps] = useState(0);

  return (
    <div className="w-full h-full relative">
      {/* Performance Monitor UI */}
      <div className="absolute bottom-4 left-4 z-10 text-white">
        <div className="bg-black/50 p-3 rounded-lg">
          <div className="text-sm font-semibold mb-2">Performance</div>
          <div className="text-xs space-y-1">
            <div>FPS: {fps}</div>
            <div>Resolution: {resolution}</div>
          </div>
        </div>
      </div>

      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]} // Limit device pixel ratio for performance
      >
        <PerspectiveCamera 
          makeDefault 
          position={[0, 0, 0]} 
          fov={75}
          near={0.1}
          far={100000}
        />
        
        {/* Simple test - just the NASA starfield background */}
        
        {/* NASA Starfield Background */}
        <Suspense fallback={null}>
          <NASAStarfieldBackground resolution={resolution} />
        </Suspense>
        
        {/* Camera Controls with WASD support */}
        <CameraController />
        
        {/* Performance Monitor */}
        <PerformanceMonitor 
          loadTime={0} 
          resolution={resolution}
          onFpsUpdate={setFps}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
};
