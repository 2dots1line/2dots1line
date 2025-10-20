<!-- 345e3416-e1e2-45b4-b727-55d11086d071 8e6cc970-8797-4d03-be64-e483fa7bd9a5 -->
# Mobile Optimization: TikTok-Inspired Design

## Architecture Decision: Separate Mobile Components

**Why separate components instead of responsive CSS:**

1. Fundamentally different UX patterns (TikTok overlay vs desktop modals)
2. Cleaner code - no complex conditional rendering
3. Better performance - don't load desktop code on mobile  
4. Easier maintenance and A/B testing
5. Mobile-specific optimizations (touch gestures, gradients)

## Phase 1: Device Detection & Routing

### 1.1 Device Detection Hook

**File**: `apps/web-app/src/hooks/useDeviceDetection.ts` (NEW)

Based on `DevLog/20251017MultiDeviceUIUXOptimization.md`:

- Detect mobile/tablet/desktop
- Platform (iOS/Android)
- Capabilities (touch/hover)
- Screen orientation
- Performance (low-end device check)

### 1.2 Device Store  

**File**: `apps/web-app/src/stores/DeviceStore.ts` (NEW)

Zustand store for global device state.

### 1.3 Component Router Logic

**File**: `apps/web-app/src/app/page.tsx` (MODIFY)

Use device detection to render mobile vs desktop components:

```typescript
const { isMobile } = useDeviceStore();

return isMobile ? (
  <MobileLayout />
) : (
  <DesktopLayout /> // existing layout
);
```

## Phase 2: Mobile HUD - Touch-Activated Horizontal Row

### 2.1 Mobile HUD Component

**File**: `apps/web-app/src/components/hud/MobileHUDContainer.tsx` (NEW)

**Design:**

- Horizontal row of 5 icon buttons (Dashboard, Chat, Cards, Cosmos, Settings)
- Hidden by default
- Appears when user taps screen edge (top 10% or bottom 10%)
- Auto-hides after 3 seconds of inactivity
- Position: Bottom of screen (thumb zone)
- Height: 56px (exceeds 44px minimum)
- Background: Semi-transparent gradient, NOT full glassmorphic panel
- No hover effects

**Implementation:**

```typescript
// Gradient background instead of GlassmorphicPanel
<div className="fixed bottom-0 left-0 right-0 h-14
                bg-gradient-to-t from-black/50 to-transparent
                backdrop-blur-sm
                transform transition-transform duration-300
                ${isVisible ? 'translate-y-0' : 'translate-y-full'}">
  <div className="flex justify-around items-center h-full px-4">
    {buttons.map(btn => (
      <button className="w-12 h-12 rounded-full ...">
        <Icon />
      </button>
    ))}
  </div>
</div>
```

**Touch detection:**

- Listen for `touchstart` events
- Check if touch is in top/bottom 10% of screen
- Set `isVisible = true`, start 3-second timer
- Reset timer on any interaction

### 2.2 Update HUDStore for Mobile

**File**: `apps/web-app/src/stores/HUDStore.ts` (MODIFY)

Add mobile-specific state:

- `mobileHudVisible: boolean`
- `setMobileHudVisible()`
- Auto-hide timer management

## Phase 3: Mobile Chat - TikTok-Inspired Gradient Overlay

### 3.1 Mobile Chat Overlay Component

**File**: `apps/web-app/src/components/chat/MobileChatOverlay.tsx` (NEW)

**Design (inspired by TikTok):**

- Bottom-left position
- Messages stream upward
- Single gradient background (NO nested panels)
- Extends to ~50% screen height
- Natural fade with gradient
- Individual message bubbles get minimal glassmorphic treatment
- No avatars (space saving)
- Tap message area to expand input
- Swipe down to minimize

**Current problem** (ChatInterface.tsx):

```typescript
// 3 LAYERS - causes visual clutter:
<GlassmorphicPanel> {/* Container */}
  <div className="messages">
    <GlassmorphicPanel> {/* Each message */}
      <div> {/* Avatar container */}
```

**Mobile solution** - Single gradient:

```typescript
<div className="fixed bottom-0 left-0 w-full h-1/2 
                bg-gradient-to-t from-black/40 via-black/20 to-transparent
                backdrop-blur-sm pointer-events-none">
  <div className="absolute bottom-16 left-4 right-4 max-w-sm
                  space-y-2 pointer-events-auto">
    {messages.slice(-5).map(msg => (
      // Only message bubble gets glassmorphic background
      <div className={`
        backdrop-blur-md rounded-2xl px-3 py-2 text-sm
        max-w-[80%]
        ${msg.type === 'user' 
          ? 'ml-auto bg-blue-500/30' 
          : 'mr-auto bg-white/15'}
      `}>
        {msg.content}
      </div>
    ))}
  </div>
  
  {/* Input expands from bottom when tapped */}
  {isInputExpanded && (
    <div className="absolute bottom-0 left-0 right-0 p-4
                    bg-black/60 backdrop-blur-lg">
      <textarea className="w-full bg-white/10 ..." />
    </div>
  )}
</div>
```

**Key features:**

- Only shows last 5 messages
- Pointer-events-none on gradient container (allows interaction with content below)
- Pointer-events-auto on message bubbles
- Tap to expand input from bottom
- Swipe gesture to minimize

### 3.2 Chat for Different Views

**Usage**: Same `MobileChatOverlay` for Cards & Cosmos

- In Cards view: Overlays card grid
- In Cosmos view: Overlays 3D scene
- Messages don't block main content
- Always bottom-left position

### 3.3 Full Chat View (Chat tab)

**File**: `apps/web-app/src/components/chat/MobileChatView.tsx` (NEW)

When user navigates to Chat tab:

- Full-screen chat (no overlay)
- Message bubbles still use minimal glassmorphic style
- **Simplified input: Only mic button triggers native keyboard with voice input**
- No custom voice transcription UI (clutters view)
- Attachment buttons appear when keyboard is active

**Input design:**

```typescript
<div className="fixed bottom-0 left-0 right-0 p-4 mobile-safe-bottom
                bg-black/80 backdrop-blur-lg">
  {/* Mic button triggers keyboard focus, user can use native voice input */}
  <button 
    onClick={() => inputRef.current?.focus()}
    className="w-full h-14 flex items-center justify-center gap-2
               bg-white/10 rounded-full backdrop-blur-md"
  >
    <Mic size={20} />
    <span>Tap to chat or use voice</span>
  </button>
  
  {/* Hidden textarea - focuses on mic tap, shows native keyboard */}
  <textarea
    ref={inputRef}
    className="sr-only" // visually hidden but functional
    onFocus={() => setKeyboardActive(true)}
    onBlur={() => setKeyboardActive(false)}
  />
  
  {/* Attachment options appear when keyboard is active */}
  {keyboardActive && (
    <div className="flex gap-2 mt-2">
      <button><Image size={18} /></button>
      <button><Paperclip size={18} /></button>
    </div>
  )}
</div>
```

**Benefits:**

- Native iOS dictation (microphone button on keyboard)
- Native Android voice typing (Google voice keyboard)
- No custom transcription code to maintain
- More accurate than WebSpeech API
- Users already familiar with their native voice input
- Cleaner UI - just one button when inactive

## Phase 4: Mobile Dashboard - Horizontal Carousels

### 4.1 Mobile Dashboard Component

**File**: `apps/web-app/src/components/dashboard/MobileDashboard.tsx` (NEW)

**Design**: No modal container, just rows of carousels

**Current problem** (DashboardModal.tsx):

- Modal with `inset-4` wastes space
- Multi-column grid (`lg:columns-2 xl:columns-3`)
- Tabs wrap awkwardly

**Mobile solution**:

```typescript
<div className="min-h-screen pb-20"> {/* No modal */}
  {/* Greeting */}
  <div className="p-4 bg-gradient-to-b from-black/20 to-transparent">
    <h1>Good morning, User!</h1>
  </div>
  
  {/* Each section = horizontal carousel */}
  <div className="space-y-6 px-4">
    <DashboardCarousel 
      title="Opening Words"
      items={openingWords}
      type="large-card"
    />
    
    <DashboardCarousel 
      title="Recent Cards"
      items={recentCards}
      type="card-tile"
    />
    
    <DashboardCarousel 
      title="Dynamic Insights"
      items={insights}
      type="insight-card"
    />
    
    <DashboardCarousel 
      title="Growth Trajectory"
      items={growthEvents}
      type="growth-card"
    />
  </div>
</div>
```

### 4.2 Dashboard Carousel Component

**File**: `apps/web-app/src/components/dashboard/DashboardCarousel.tsx` (NEW)

Horizontal scrollable carousel:

- Snap scroll for each card
- Scroll indicators (dots)
- Touch-friendly (no buttons)
- CSS: `overflow-x-auto scroll-snap-x`
```typescript
<div className="space-y-3">
  <h2 className="text-lg font-medium">{title}</h2>
  <div className="flex gap-3 overflow-x-auto scroll-snap-x 
                  scrollbar-hide pb-4">
    {items.map(item => (
      <div className="flex-shrink-0 w-80 scroll-snap-start
                      backdrop-blur-md bg-white/10 rounded-xl p-4">
        {/* Item content */}
      </div>
    ))}
  </div>
</div>
```


## Phase 5: Mobile Cards View - Apple iPhone Homepage Style

### 5.1 Mobile Cards Layout

**File**: `apps/web-app/src/app/page.tsx` (MODIFY - mobile section)

**Design**: Apple iPhone homepage aesthetic

- **4-column grid** (exactly like iPhone app icons - 4 per row)
- Large, tappable cards with generous spacing
- Centered layout with symmetric padding
- Rounded corners (24px radius for premium feel)
- Smooth pull-to-refresh
- Minimalist toolbar

**Layout structure:**

```typescript
<div className="min-h-screen pb-24">
  {/* Minimal top toolbar - glassmorphic blur */}
  <div className="sticky top-0 z-40 bg-gradient-to-b from-black/80 to-black/20 
                  backdrop-blur-xl mobile-safe-top">
    <div className="px-6 py-4">
      {/* Simple title + search */}
      <h1 className="text-2xl font-semibold mb-3">Cards</h1>
      
      {/* Clean search bar */}
      <input 
        className="w-full bg-white/10 rounded-2xl px-5 py-3 text-base
                   placeholder:text-white/50 border border-white/10
                   focus:border-white/30 transition-colors"
        placeholder="Search cards..."
      />
    </div>
  </div>
  
  {/* Apple-style card grid */}
  <div className="px-4 py-6">
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
      {cards.map(card => (
        <div 
          className="aspect-square rounded-3xl overflow-hidden
                     backdrop-blur-xl bg-white/10 border border-white/10
                     shadow-2xl shadow-black/50
                     active:scale-95 transition-transform duration-150"
          onClick={() => handleCardSelect(card)}
        >
          {/* Card content - centered like app icons */}
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {card.background_image_url ? (
              <img 
                src={card.background_image_url}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">{card.icon || '📄'}</div>
                <h3 className="text-sm font-medium line-clamp-2">
                  {card.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Sort controls - bottom sheet (appears when needed) */}
  {showSortSheet && (
    <div className="fixed inset-x-0 bottom-0 z-50 mobile-safe-bottom
                    bg-black/90 backdrop-blur-2xl rounded-t-3xl
                    animate-slide-up">
      <div className="px-6 py-8">
        <h3 className="text-lg font-semibold mb-4">Sort by</h3>
        <div className="space-y-2">
          {['Newest', 'Oldest', 'Title A-Z', 'Title Z-A'].map(option => (
            <button 
              className="w-full text-left px-4 py-3 rounded-xl
                         bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => handleSort(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
```

**Key Apple-inspired design elements:**

1. **Grid spacing**: 16px gap (same as iPhone app spacing)
2. **Card size**: `aspect-square` (1:1 ratio like app icons)
3. **Corner radius**: 24px (rounded-3xl) for that premium Apple feel
4. **Shadow**: Deep shadow (`shadow-2xl shadow-black/50`) for depth
5. **Active state**: `active:scale-95` - subtle press animation
6. **Centered content**: Flex center alignment like app icons
7. **Minimal chrome**: Clean toolbar, no clutter
8. **Consistent padding**: Symmetric margins for visual balance
9. **Max width**: Constrain grid to `max-w-2xl` so cards don't get too large on tablets

### 5.2 Card Tile Optimization for Mobile

**File**: `packages/ui-components/src/components/CardTile.tsx` (MODIFY)

Add mobile variant optimized for Apple-style grid:

```typescript
// When rendering on mobile
<div className={`
  relative w-full h-full
  rounded-2xl overflow-hidden
  ${isMobile ? 'bg-gradient-to-br from-white/15 to-white/5' : ''}
`}>
  {/* Cover image fills entire square */}
  {card.background_image_url && (
    <img 
      src={card.background_image_url}
      className="absolute inset-0 w-full h-full object-cover"
    />
  )}
  
  {/* Title overlay at bottom (like App Store cards) */}
  <div className="absolute inset-x-0 bottom-0 p-3
                  bg-gradient-to-t from-black/80 to-transparent">
    <h3 className="text-sm font-medium line-clamp-2">
      {card.title}
    </h3>
  </div>
</div>
```

### 5.3 Pull-to-Refresh Integration

Use native-feeling pull-to-refresh:

- Drag threshold: 80px
- Loading indicator with Apple-style spinner
- Haptic feedback on refresh trigger
- Smooth bounce animation

## Phase 6: Mobile Cosmos - Touch Gestures

### 6.1 Touch Gesture Handlers

**File**: `apps/web-app/src/app/cosmos/CosmosScene.tsx` (MODIFY)

Implement in R3F camera controller:

- **Single-finger drag**: Rotate camera (orbit)
- **Two-finger pinch**: Zoom in/out
- **Two-finger drag**: Pan camera
- **Double-tap**: Focus on node
- **Long-press**: Show node details bottom sheet

Use `@use-gesture/react` library:

```typescript
import { useGesture } from '@use-gesture/react';

const bind = useGesture({
  onDrag: ({ movement: [mx, my], touches }) => {
    if (touches === 1) rotateCamera(mx, my);
    if (touches === 2) panCamera(mx, my);
  },
  onPinch: ({ offset: [scale] }) => {
    zoomCamera(scale);
  },
  onDoubleClick: ({ event }) => {
    focusOnNode(event);
  },
  onLongPress: ({ event }) => {
    showNodeDetails(event);
  }
});
```

### 6.2 Mobile Node Interactions

**Files**:

- `apps/web-app/src/components/cosmos/NodeMesh.tsx` (MODIFY)
- `apps/web-app/src/components/cosmos/NodeLabel.tsx` (MODIFY)

**Changes:**

- Increase node mesh scale by 1.5x on mobile
- Larger invisible touch hitbox (2x node size)
- Bigger labels (1.5x font size)
- Haptic feedback on selection

### 6.3 Node Details Bottom Sheet

**File**: `apps/web-app/src/components/cosmos/MobileNodeDetails.tsx` (NEW)

Replace side panel with bottom sheet:

- Swipe up from bottom
- 70% screen height
- Swipe down to dismiss
- Rounded top corners

## Phase 7: Video Background Optimization

### 7.1 Adaptive Video Quality

**File**: `apps/web-app/src/components/DynamicBackground.tsx` (MODIFY)

```typescript
const { isMobile, isLowEndDevice, connectionType } = useDeviceStore();

const getVideoQuality = () => {
  if (isLowEndDevice || connectionType === 'slow') return 'image'; // static fallback
  if (isMobile) return '720p';
  return '1080p';
};
```

### 7.2 Battery-Aware Playback

Use Battery API to pause video when battery < 20%:

```typescript
const battery = await navigator.getBattery();
if (battery.level < 0.2 && !battery.charging) {
  pauseVideo();
}
```

## Phase 8: Mobile-Specific Features

### 8.1 Safe Area Insets

**File**: `apps/web-app/src/app/globals.css` (ADD)

```css
.mobile-safe-top {
  padding-top: max(1rem, env(safe-area-inset-top));
}

.mobile-safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

Apply to HUD, chat input, fixed headers.

### 8.2 Haptic Feedback Utility

**File**: `apps/web-app/src/utils/haptics.ts` (NEW)

```typescript
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
  if ('vibrate' in navigator) {
    const duration = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(duration[type]);
  }
};
```

Use on: button taps, node selection, card swipe, etc.

### 8.3 Pull-to-Refresh

**File**: `apps/web-app/src/hooks/usePullToRefresh.ts` (NEW)

Implement for Cards and Dashboard views:

```typescript
const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  // Track touch events
  // Show loading indicator
  // Call onRefresh callback
};
```

## Phase 9: Performance & Polish

### 9.1 Lazy Loading

- Lazy load Cosmos components (heavy 3D)
- Progressive image loading for cards
- Defer non-critical JavaScript

### 9.2 Code Splitting

Configure Next.js to split mobile components into separate bundle:

```javascript
// next.config.js
experimental: {
  optimizePackageImports: ['@2dots1line/ui-components'],
}
```

### 9.3 Testing Checklist

- [ ] iPhone SE (small screen)
- [ ] iPhone 15 Pro (notch)
- [ ] iPhone 15 Pro Max (large)
- [ ] iPad (tablet)
- [ ] Android (Samsung, Pixel)
- [ ] Landscape orientation
- [ ] Low battery mode
- [ ] Slow 3G connection

## Implementation Priority

**Week 1 (Core Infrastructure):**

1. Device detection (Phase 1)
2. Mobile HUD (Phase 2)
3. Mobile chat overlay (Phase 3)
4. Safe area handling (Phase 8.1)

**Week 2 (Main Views):**

5. Mobile dashboard carousels (Phase 4)
6. Mobile cards layout (Phase 5)
7. Touch controls for Cosmos (Phase 6.1)

**Week 3 (Polish & Optimization):**

8. Video optimization (Phase 7)
9. Haptic feedback (Phase 8.2)
10. Pull-to-refresh (Phase 8.3)
11. Performance (Phase 9)
12. Testing (Phase 9.3)

## Key New Files

**Components:**

1. `apps/web-app/src/components/hud/MobileHUDContainer.tsx`
2. `apps/web-app/src/components/chat/MobileChatOverlay.tsx`
3. `apps/web-app/src/components/chat/MobileChatView.tsx`
4. `apps/web-app/src/components/dashboard/MobileDashboard.tsx`
5. `apps/web-app/src/components/dashboard/DashboardCarousel.tsx`
6. `apps/web-app/src/components/cosmos/MobileNodeDetails.tsx`

**Hooks & Utils:**

7. `apps/web-app/src/hooks/useDeviceDetection.ts`
8. `apps/web-app/src/hooks/usePullToRefresh.ts`
9. `apps/web-app/src/stores/DeviceStore.ts`
10. `apps/web-app/src/utils/haptics.ts`

**Modified Files:**

11. `apps/web-app/src/app/page.tsx` (add mobile routing)
12. `apps/web-app/src/app/cosmos/CosmosScene.tsx` (touch gestures)
13. `apps/web-app/src/components/DynamicBackground.tsx` (adaptive quality)
14. `apps/web-app/src/app/globals.css` (safe areas)

## Design Principles

- **Separate mobile components** - Not responsive bundling
- **Touch-first** - 56px buttons, generous spacing
- **Gradient overlays** - Not nested glassmorphic panels
- **TikTok-inspired chat** - Bottom-left, streaming messages
- **Horizontal carousels** - Native swipe gestures
- **Performance** - Lazy load, adaptive video, bundle splitting

### To-dos

- [ ] Create useDeviceDetection hook with comprehensive device/platform/capability detection
- [ ] Create DeviceStore (Zustand) for global device state management
- [ ] Add DeviceDetectionProvider to app layout.tsx
- [ ] Make HUDContainer mobile-responsive with bottom positioning and larger touch targets
- [ ] Optimize ChatInterface for mobile with bottom sheet layout and keyboard handling
- [ ] Implement mobile-friendly dashboard with full-screen modal and single-column layout
- [ ] Optimize cards view toolbar and grid for mobile screens
- [ ] Implement touch gesture handlers for 3D Cosmos navigation
- [ ] Increase touch hitboxes for nodes and optimize mobile interactions
- [ ] Add adaptive video quality based on device capabilities and connection
- [ ] Add CSS safe area handling for notches and home indicators
- [ ] Update GlassmorphicPanel with mobile-specific variants
- [ ] Add mobile-responsive typography scales to globals.css
- [ ] Update button components with larger mobile touch targets
- [ ] Create useOrientation hook for layout adjustments
- [ ] Add haptic feedback utility for touch interactions
- [ ] Implement performance optimizations (lazy loading, bundle splitting)
- [ ] Test on real devices and refine based on feedback