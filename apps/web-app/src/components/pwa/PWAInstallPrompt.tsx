'use client';

import { useState, useEffect } from 'react';
import { GlassButton } from '@2dots1line/ui-components';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Debug logging
  console.log('PWAInstallPrompt render:', { isInstalled, showPrompt, deferredPrompt: !!deferredPrompt });

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA installed successfully');
        } else {
          console.log('PWA installation dismissed');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else {
      // Manual install instructions
      alert('To install this app:\n\nChrome/Edge: Look for install icon in address bar or use Menu → Install\nSafari: Use Share button → Add to Home Screen\nChrome Mobile: Use Menu → Add to Home Screen');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  // Show manual install button if PWA is not installed
  if (isInstalled) {
    return null;
  }

  // Always show the install button for now (for testing)
  // TODO: Add proper authentication check later

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Install 2D1L</h3>
              <p className="text-white/70 text-xs">Get the full-screen cosmic experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={handleInstall}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium"
            >
              Install
            </GlassButton>
            <GlassButton
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 text-white/70"
            >
              <X size={16} />
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
