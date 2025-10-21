'use client';

import React from 'react';
import { DynamicBackground } from '../DynamicBackground';
import { useUserStore } from '../../stores/UserStore';

function MobileLayout() {
  const { isAuthenticated, hasHydrated } = useUserStore();

  // Don't render auth-dependent UI until hydration is complete
  if (!hasHydrated) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <DynamicBackground view="dashboard" />
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Verifying your session...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent">
      {/* Background Media */}
      <DynamicBackground view="dashboard" />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Mobile Layout</h1>
          <p className="text-lg">Mobile-optimized interface coming soon!</p>
          <p className="text-sm mt-2 opacity-70">
            Mobile Layout Active
          </p>
        </div>
      </main>
    </div>
  );
}

export default MobileLayout;
