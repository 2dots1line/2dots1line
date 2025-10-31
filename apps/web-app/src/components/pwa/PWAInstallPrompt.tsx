'use client';

import React, { useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const SNOOZE_KEY = 'pwa_install_snooze_until';
const INSTALLED_KEY = 'pwa_installed';
const SNOOZE_DAYS = 7;

function isStandalone(): boolean {
  // iOS: navigator.standalone; others: display-mode
  const dm = window.matchMedia?.('(display-mode: standalone)')?.matches;
  // @ts-expect-error - navigator.standalone is not in TypeScript types but exists on iOS Safari
  return !!(dm || window.navigator.standalone);
}

function isSafari(): boolean {
  // Edge/Chrome on iOS also say Safari in UA; refine:
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafariEngine = /^((?!chrome|crios|fxios|edgios|android).)*safari/.test(ua);
  return isSafariEngine || (isIOS && !/crios|fxios|edgios/.test(ua));
}

function isMacOS(): boolean {
  return /Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.platform);
}

function snoozed(): boolean {
  const until = localStorage.getItem(SNOOZE_KEY);
  if (!until) return false;
  const t = Number(until);
  return !Number.isNaN(t) && Date.now() < t;
}

function setSnooze(days: number) {
  const ms = days * 24 * 60 * 60 * 1000;
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + ms));
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // If installed, never show again
    if (isStandalone() || localStorage.getItem(INSTALLED_KEY) === '1') {
      return;
    }

    // Register SW (safe no-op if already registered)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    setIsSafariBrowser(isSafari());

    // Chrome/Edge path: capture beforeinstallprompt
    const onBIP = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      if (!snoozed()) {
        setTimeout(() => setVisible(true), 2000); // small delay
      }
    };

    window.addEventListener('beforeinstallprompt', onBIP as EventListener);

    // Safari path: show a guide (if not snoozed)
    if (isSafari() && !snoozed()) {
      setTimeout(() => setVisible(true), 2000);
    }

    // Detect install completion (Chrome fires appinstalled)
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setVisible(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (isSafariBrowser) {
      // Show quick inline guide
      if (isMacOS()) {
        alert('Install on Safari (macOS):\n\n1) Click the Share button\n2) Click "Add to Dock"\n3) Confirm with "Add"');
      } else {
        alert('Install on Safari (iOS):\n\n1) Tap the Share button\n2) Tap "Add to Home Screen"\n3) Tap "Add" to confirm');
      }
      return;
    }

    // Chrome/Edge prompt
    const ev = deferredPromptRef.current;
    if (!ev) {
      // Not eligible yet; give guidance
      alert('Install option isn\'t available yet. Keep browsing for a moment and watch for the install icon in your browser\'s address bar.');
      return;
    }

    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      if (choice?.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1');
        setVisible(false);
      } else {
        // User dismissed; snooze
        setSnooze(SNOOZE_DAYS);
        setVisible(false);
      }
    } catch {
      setSnooze(SNOOZE_DAYS);
      setVisible(false);
    } finally {
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    setSnooze(SNOOZE_DAYS);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center">📱</div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">Install 2D1L</div>
            <div className="text-white/70 text-xs mt-0.5">
              {isSafariBrowser ? 'Get the full-screen cosmic experience via "Add to Home Screen".' : 'Install the app for a full-screen, distraction-free experience.'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInstall} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg">
              {isSafariBrowser ? 'How to install' : 'Install'}
            </button>
            <button onClick={handleDismiss} className="px-2 py-1 hover:bg-white/20 text-white/70 rounded-lg">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}