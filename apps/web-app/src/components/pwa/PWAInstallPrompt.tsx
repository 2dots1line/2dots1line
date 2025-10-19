'use client';

import React from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  // Debug logging
  console.log('PWAInstallPrompt render: SIMPLE VERSION');
  
  const handleInstall = () => {
    console.log('Install button clicked!');
    alert('PWA Install clicked!');
  };
  
  const handleDismiss = () => {
    console.log('Dismiss button clicked!');
  };
  
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">📱</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Install 2D1L</h3>
              <p className="text-white/70 text-xs">Get the full-screen cosmic experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 text-white/70 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
