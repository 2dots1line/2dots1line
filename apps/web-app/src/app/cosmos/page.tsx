'use client';

import React, { useEffect } from 'react';
import { HUDContainer } from '../../components/hud/HUDContainer';
import CosmosScene from './CosmosScene';

const CosmosPage: React.FC = () => {
  useEffect(() => {
    // Ensure dev token is set for development
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('auth_token', 'dev-token');
    }
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      <CosmosScene />
      {/* Navigation HUD - Consistent across 2D and 3D views */}
      <HUDContainer />
    </div>
  );
};

export default CosmosPage;