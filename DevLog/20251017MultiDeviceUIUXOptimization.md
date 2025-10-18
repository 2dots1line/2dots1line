Absolutely! Device detection is a powerful technique for providing optimized UX. Let me analyze the current codebase and show you how to implement comprehensive device detection and adaptive UI.


[1 tool called]

Perfect! I can see there's no current device detection implementation. Let me show you how to implement comprehensive device detection and adaptive UI. Here's a complete solution:

## **Device Detection & Adaptive UI Implementation**

### **1. Device Detection Hook**

First, create a comprehensive device detection hook:

```typescript
// apps/web-app/src/hooks/useDeviceDetection.ts
'use client';

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  // Device Types
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Platform Detection
  isIOS: boolean;
  isAndroid: boolean;
  isIPad: boolean;
  isIPhone: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  
  // Capabilities
  hasTouch: boolean;
  hasHover: boolean;
  hasKeyboard: boolean;
  
  // Screen Info
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  
  // Browser Info
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  isPWA: boolean;
  
  // Performance
  isLowEndDevice: boolean;
  connectionType: 'slow' | 'fast' | 'unknown';
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isIPad: false,
    isIPhone: false,
    isMac: false,
    isWindows: false,
    isLinux: false,
    hasTouch: false,
    hasHover: false,
    hasKeyboard: true,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'landscape',
    browser: 'unknown',
    isPWA: false,
    isLowEndDevice: false,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      // Screen dimensions
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
      
      // Device type detection
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
                      (screenWidth <= 768 && 'ontouchstart' in window);
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                      (screenWidth > 768 && screenWidth <= 1024 && 'ontouchstart' in window);
      const isDesktop = !isMobile && !isTablet;
      
      // Platform detection
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);
      const isIPad = /ipad/i.test(userAgent) || (platform === 'macintel' && 'ontouchstart' in window);
      const isIPhone = /iphone|ipod/i.test(userAgent);
      const isMac = /macintosh|mac os x/i.test(userAgent);
      const isWindows = /windows|win32|win64/i.test(userAgent);
      const isLinux = /linux/i.test(userAgent);
      
      // Capability detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasHover = window.matchMedia('(hover: hover)').matches;
      const hasKeyboard = !isMobile || (isMobile && 'keyboard' in navigator);
      
      // Browser detection
      let browser: DeviceInfo['browser'] = 'unknown';
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) browser = 'chrome';
      else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'safari';
      else if (userAgent.includes('firefox')) browser = 'firefox';
      else if (userAgent.includes('edg')) browser = 'edge';
      
      // PWA detection
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true;
      
      // Performance detection
      const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                            (navigator as any).deviceMemory <= 2;
      
      // Connection detection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let connectionType: DeviceInfo['connectionType'] = 'unknown';
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          connectionType = 'slow';
        } else if (connection.effectiveType === '3g' || connection.effectiveType === '4g') {
          connectionType = 'fast';
        }
      }
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isIPad,
        isIPhone,
        isMac,
        isWindows,
        isLinux,
        hasTouch,
        hasHover,
        hasKeyboard,
        screenWidth,
        screenHeight,
        orientation,
        browser,
        isPWA,
        isLowEndDevice,
        connectionType
      });
    };

    detectDevice();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100); // Small delay for orientation change
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};
```

### **2. Device-Aware Store**

Create a Zustand store for device state management:

```typescript
// apps/web-app/src/stores/DeviceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeviceInfo } from '../hooks/useDeviceDetection';

interface DeviceState {
  deviceInfo: DeviceInfo | null;
  setDeviceInfo: (info: DeviceInfo) => void;
  
  // UI Preferences based on device
  preferredChatSize: 'full' | 'medium' | 'mini';
  preferredNavigation: 'hud' | 'bottom-nav' | 'sidebar';
  preferredCosmosMode: 'orbit' | 'touch' | 'gesture';
  
  // Performance settings
  enableAnimations: boolean;
  enableParticles: boolean;
  enableShadows: boolean;
  
  // Update preferences based on device
  updatePreferencesForDevice: (deviceInfo: DeviceInfo) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceInfo: null,
      setDeviceInfo: (info) => set({ deviceInfo: info }),
      
      // Default preferences
      preferredChatSize: 'medium',
      preferredNavigation: 'hud',
      preferredCosmosMode: 'orbit',
      enableAnimations: true,
      enableParticles: true,
      enableShadows: true,
      
      updatePreferencesForDevice: (deviceInfo: DeviceInfo) => {
        const preferences = {
          // Chat size based on device
          preferredChatSize: deviceInfo.isMobile ? 'full' as const : 
                           deviceInfo.isTablet ? 'medium' as const : 'medium' as const,
          
          // Navigation based on device
          preferredNavigation: deviceInfo.isMobile ? 'bottom-nav' as const : 'hud' as const,
          
          // Cosmos mode based on device
          preferredCosmosMode: deviceInfo.hasTouch ? 'touch' as const : 'orbit' as const,
          
          // Performance settings based on device capabilities
          enableAnimations: !deviceInfo.isLowEndDevice,
          enableParticles: !deviceInfo.isLowEndDevice && deviceInfo.connectionType !== 'slow',
          enableShadows: !deviceInfo.isLowEndDevice && deviceInfo.connectionType !== 'slow',
        };
        
        set(preferences);
      }
    }),
    {
      name: 'device-preferences',
      partialize: (state) => ({
        preferredChatSize: state.preferredChatSize,
        preferredNavigation: state.preferredNavigation,
        preferredCosmosMode: state.preferredCosmosMode,
        enableAnimations: state.enableAnimations,
        enableParticles: state.enableParticles,
        enableShadows: state.enableShadows,
      })
    }
  )
);
```

### **3. Device-Aware Components**

Create adaptive components that respond to device type:

```typescript
// apps/web-app/src/components/adaptive/AdaptiveChatInterface.tsx
'use client';

import React from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useDeviceStore } from '../../stores/DeviceStore';
import { ChatInterface } from '../chat/ChatInterface';
import { MobileChatInterface } from './MobileChatInterface';

interface AdaptiveChatInterfaceProps {
  size: 'full' | 'medium' | 'mini';
  isOpen: boolean;
  onClose: () => void;
  onSizeChange?: (size: 'full' | 'medium' | 'mini') => void;
  embedded?: boolean;
}

export const AdaptiveChatInterface: React.FC<AdaptiveChatInterfaceProps> = (props) => {
  const deviceInfo = useDeviceDetection();
  const { preferredChatSize, enableAnimations } = useDeviceStore();
  
  // Use device-optimized size
  const effectiveSize = deviceInfo.isMobile ? 'full' : preferredChatSize;
  
  if (deviceInfo.isMobile) {
    return (
      <MobileChatInterface
        {...props}
        size={effectiveSize}
        enableAnimations={enableAnimations}
        deviceInfo={deviceInfo}
      />
    );
  }
  
  return (
    <ChatInterface
      {...props}
      size={effectiveSize}
    />
  );
};
```

### **4. Mobile-Optimized Chat Interface**

```typescript
// apps/web-app/src/components/adaptive/MobileChatInterface.tsx
'use client';

import React, { useState, useRef } from 'react';
import { DeviceInfo } from '../../hooks/useDeviceDetection';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { X, Send, Mic, Image } from 'lucide-react';

interface MobileChatInterfaceProps {
  size: 'full' | 'medium' | 'mini';
  isOpen: boolean;
  onClose: () => void;
  enableAnimations: boolean;
  deviceInfo: DeviceInfo;
}

export const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({
  isOpen,
  onClose,
  enableAnimations,
  deviceInfo
}) => {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className={`
        fixed inset-0 bg-background
        ${enableAnimations ? 'transition-transform duration-300' : ''}
        ${isExpanded ? 'translate-y-0' : 'translate-y-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline/20">
          <h2 className="text-lg font-brand text-onBackground">Chat</h2>
          <GlassButton onClick={onClose} size="sm">
            <X size={20} />
          </GlassButton>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Messages will go here */}
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-outline/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-3 rounded-lg bg-surface/50 border border-outline/20 text-onSurface placeholder-onSurface/50"
            />
            <GlassButton size="sm">
              <Send size={20} />
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **5. Device-Aware Navigation**

```typescript
// apps/web-app/src/components/adaptive/AdaptiveNavigation.tsx
'use client';

import React from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useDeviceStore } from '../../stores/DeviceStore';
import { HUDContainer } from '../hud/HUDContainer';
import { MobileBottomNav } from './MobileBottomNav';

export const AdaptiveNavigation: React.FC = () => {
  const deviceInfo = useDeviceDetection();
  const { preferredNavigation } = useDeviceStore();
  
  // Show mobile bottom nav on mobile devices
  if (deviceInfo.isMobile && preferredNavigation === 'bottom-nav') {
    return <MobileBottomNav />;
  }
  
  // Show HUD on desktop/tablet
  return <HUDContainer />;
};
```

### **6. Mobile Bottom Navigation**

```typescript
// apps/web-app/src/components/adaptive/MobileBottomNav.tsx
'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GlassmorphicPanel, GlassButton } from '@2dots1line/ui-components';
import { Home, MessageSquare, Layers, Globe } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Layers, label: 'Cards', path: '/cards' },
    { icon: Globe, label: 'Cosmos', path: '/cosmos' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <GlassmorphicPanel className="flex justify-around p-2 border-t border-outline/20">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <GlassButton
              key={path}
              onClick={() => router.push(path)}
              className={`
                flex flex-col items-center gap-1 p-2 min-w-0
                ${isActive ? 'text-primary' : 'text-onSurface/70'}
              `}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </GlassButton>
          );
        })}
      </GlassmorphicPanel>
    </div>
  );
};
```

### **7. Device-Aware 3D Controls**

```typescript
// apps/web-app/src/components/adaptive/AdaptiveCosmosControls.tsx
'use client';

import React from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useDeviceStore } from '../../stores/DeviceStore';
import { OrbitControls } from '@react-three/drei';
import { TouchControls } from './TouchControls';

interface AdaptiveCosmosControlsProps {
  // ... existing props
}

export const AdaptiveCosmosControls: React.FC<AdaptiveCosmosControlsProps> = (props) => {
  const deviceInfo = useDeviceDetection();
  const { preferredCosmosMode, enableAnimations } = useDeviceStore();
  
  if (deviceInfo.hasTouch && preferredCosmosMode === 'touch') {
    return <TouchControls {...props} />;
  }
  
  return (
    <OrbitControls
      {...props}
      enableDamping
      dampingFactor={0.05}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      // Adjust speeds based on device
      rotateSpeed={deviceInfo.isMobile ? 0.3 : 0.5}
      panSpeed={deviceInfo.isMobile ? 0.5 : 0.8}
      zoomSpeed={deviceInfo.isMobile ? 0.8 : 1.0}
    />
  );
};
```

### **8. Integration in Layout**

Update the main layout to use device-aware components:

```typescript
// apps/web-app/src/app/layout.tsx
import React from 'react';
import './globals.css';
import NotificationRoot from '../components/notifications/NotificationRoot';
import { ViewTracker } from '../components/engagement/ViewTracker';
import { DeviceDetectionProvider } from '../components/adaptive/DeviceDetectionProvider';
import { AdaptiveNavigation } from '../components/adaptive/AdaptiveNavigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DeviceDetectionProvider>
          {/* Engagement tracking */}
          <ViewTracker />
          {/* Adaptive navigation */}
          <AdaptiveNavigation />
          {/* Notification layer */}
          <NotificationRoot />
          {children}
        </DeviceDetectionProvider>
      </body>
    </html>
  );
}
```

### **9. Device Detection Provider**

```typescript
// apps/web-app/src/components/adaptive/DeviceDetectionProvider.tsx
'use client';

import React, { useEffect } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useDeviceStore } from '../../stores/DeviceStore';

interface DeviceDetectionProviderProps {
  children: React.ReactNode;
}

export const DeviceDetectionProvider: React.FC<DeviceDetectionProviderProps> = ({ children }) => {
  const deviceInfo = useDeviceDetection();
  const { setDeviceInfo, updatePreferencesForDevice } = useDeviceStore();
  
  useEffect(() => {
    if (deviceInfo) {
      setDeviceInfo(deviceInfo);
      updatePreferencesForDevice(deviceInfo);
    }
  }, [deviceInfo, setDeviceInfo, updatePreferencesForDevice]);
  
  return <>{children}</>;
};
```

### **10. CSS for Device-Specific Styles**

```css
/* apps/web-app/src/styles/device-specific.css */

/* Mobile-specific styles */
@media (max-width: 768px) {
  .mobile-optimized {
    /* Larger touch targets */
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Remove hover effects on touch devices */
  .no-hover:hover {
    transform: none;
  }
}

/* iOS-specific styles */
.ios-device {
  /* iOS-specific adjustments */
  -webkit-overflow-scrolling: touch;
}

/* Android-specific styles */
.android-device {
  /* Android-specific adjustments */
}

/* Low-end device optimizations */
.low-end-device {
  /* Disable expensive animations */
  animation: none !important;
  transition: none !important;
}

/* Slow connection optimizations */
.slow-connection {
  /* Reduce image quality, disable auto-loading */
}
```

## **Benefits of This Approach:**

1. **Automatic Detection**: Detects device type, capabilities, and performance
2. **Adaptive UI**: Different interfaces for mobile, tablet, and desktop
3. **Performance Optimization**: Adjusts features based on device capabilities
4. **User Preferences**: Remembers user's preferred settings
5. **Progressive Enhancement**: Works on all devices with appropriate fallbacks
6. **Future-Proof**: Easy to add new device types and optimizations

This implementation provides a comprehensive device detection system that automatically optimizes the UI/UX for each device type while maintaining a consistent core experience.