'use client';

import React, { useEffect } from 'react';
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
    </div>
  );
};

export default CosmosPage;