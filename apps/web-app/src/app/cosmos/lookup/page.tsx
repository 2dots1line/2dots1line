'use client';

import React, { useEffect } from 'react';
import { HUDContainer } from '../../../components/hud/HUDContainer';
import CosmosLookupScene from './CosmosLookupScene';

const CosmosLookupPage: React.FC = () => {
  // Removed hardcoded dev-token setup - use actual user authentication

  return (
    <div className="w-screen h-screen bg-black">
      <CosmosLookupScene />
      {/* Navigation HUD - Consistent across 2D and 3D views */}
      <HUDContainer />
    </div>
  );
};

export default CosmosLookupPage;
