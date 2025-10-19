'use client';

import React from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallButton, setShowInstallButton] = React.useState(false);
  
  // Debug logging
  console.log('PWAInstallPrompt render: FULL VERSION');
  
  React.useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    // Listen for beforeinstallprompt event (Chrome/Edge only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      console.log('beforeinstallprompt event fired - PWA is installable');
    };
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // For Safari, always show install button since there's no beforeinstallprompt
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      setShowInstallButton(true);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  const handleInstall = async () => {
    console.log('Install button clicked!');
    
    if (deferredPrompt) {
      // Chrome/Edge: Use the deferred prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice:', outcome);
      setDeferredPrompt(null);
    } else {
      // Safari: Show instructions
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMacOS = /Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.platform);
      
      if (isSafari && isMacOS) {
        alert('To install this app on Safari (macOS):\n\n1. Click the Share button (square with arrow up)\n2. Click "Add to Dock"\n3. Click "Add" to confirm\n\nThis will install the app in your Dock!');
      } else if (isSafari) {
        alert('To install this app on Safari (iOS):\n\n1. Tap the Share button (square with arrow up)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nThis will install the app on your home screen!');
      } else {
        alert('To install this app:\n\nLook for the install icon in your browser\'s address bar or use the browser menu to add to home screen.');
      }
    }
  };
  
  const handleDismiss = () => {
    console.log('Dismiss button clicked!');
    setShowInstallButton(false);
  };
  
  // Don't show if not installable
  if (!showInstallButton) {
    return null;
  }
  
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
