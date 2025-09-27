'use client';

/**
 * NASA Map Test Page
 * V11.0 - Testing NASA Deep Star Maps 2020 integration
 * Separate page to test OpenEXR loading without affecting main cosmos
 */

import React, { Suspense } from 'react';
import { NASAStarfieldTest } from '../../components/cosmos/NASAStarfieldTest';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function NASAMapPage() {
  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-2xl font-bold mb-2">NASA Deep Star Maps 2020 Test</h1>
        <p className="text-sm opacity-75">Testing Graph3D compatibility with 8k OpenEXR</p>
        <div className="mt-4 space-y-2">
          <div className="text-xs">
            <strong>Controls:</strong>
          </div>
          <div className="text-xs">
            • Mouse: Orbit around the starfield
          </div>
          <div className="text-xs">
            • Scroll: Zoom in/out
          </div>
          <div className="text-xs">
            • WASD: Move camera (W/S: forward/back, A/D: left/right)
          </div>
          <div className="text-xs">
            • Space: Move up
          </div>
          <div className="text-xs">
            • Shift: Faster movement
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 text-white">
        <div className="bg-black/50 p-3 rounded-lg">
          <div className="text-sm font-semibold mb-2">Performance Info</div>
          <div className="text-xs space-y-1">
            <div>Resolution: 8k (8,192 × 4,096)</div>
            <div>Format: OpenEXR HDR</div>
            <div>File Size: ~130MB</div>
            <div>Stars: 1.7 billion</div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Loading NASA Star Map...</div>
            <div className="text-sm opacity-75 mt-2">This may take a moment</div>
          </div>
        </div>
      }>
        <NASAStarfieldTest />
      </Suspense>
    </div>
  );
}
