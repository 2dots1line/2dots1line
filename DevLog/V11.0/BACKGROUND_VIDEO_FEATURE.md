# Background Video Selection Feature

## Overview

The background video selection feature allows users to customize the background video for each 2D view in the application. Users can choose from 5 different video options for each view: Dashboard, Chat, Cards, and Settings.

## Features

- **Per-View Customization**: Each 2D view can have a different background video
- **5 Video Options**: Cloud1.mp4, Cloud2.mp4, Cloud3.mp4, Cloud4.mp4, Star1.mp4
- **Persistent Settings**: User preferences are saved and restored across sessions
- **Settings Integration**: Video selection is available in the Settings modal
- **Cosmos View Excluded**: The 3D Cosmos view is not affected by these settings

## Implementation Details

### Files Modified/Created

1. **`packages/shared-types/src/entities/user.types.ts`**
   - Extended `TUserPreferences` interface to include `background_videos` field

2. **`apps/web-app/src/stores/BackgroundVideoStore.ts`** (NEW)
   - Zustand store for managing background video preferences
   - Handles loading/saving user preferences
   - Provides methods for getting/setting video for each view

3. **`apps/web-app/src/stores/UserStore.ts`**
   - Added `updateUserPreferences` method for updating user preferences

4. **`apps/web-app/src/components/BackgroundVideo.tsx`** (NEW)
   - Reusable component for rendering background videos
   - Automatically selects correct video based on current view

5. **`apps/web-app/src/components/modal/ModalContainer.tsx`**
   - Updated SettingsModal to include video selection controls
   - Added dropdown selectors for each view

6. **`apps/web-app/src/app/page.tsx`**
   - Updated to use BackgroundVideo component
   - Dynamically changes video based on active view

7. **`apps/web-app/src/app/providers.tsx`**
   - Updated loading screen to use BackgroundVideo component

### Video Options

| Video File | Display Name | Description |
|------------|--------------|-------------|
| Cloud1.mp4 | Cloud 1 | Default cloud scene |
| Cloud2.mp4 | Cloud 2 | Alternative cloud scene |
| Cloud3.mp4 | Cloud 3 | Different cloud pattern |
| Cloud4.mp4 | Cloud 4 | Another cloud variation |
| Star1.mp4 | Stars | Starfield background |

### Views Supported

- **Dashboard**: Main dashboard view
- **Chat**: Chat interface
- **Cards**: Card gallery view
- **Settings**: Settings modal (background shows through)

### Views Not Affected

- **Cosmos**: 3D graph view uses its own rendering system

## Usage

### For Users

1. Open the Settings modal by clicking the Settings button in the HUD
2. Scroll to the "Background Videos" section
3. Use the dropdown menus to select different videos for each view
4. Changes are automatically saved
5. Use "Reset to Defaults" to restore original settings

### For Developers

```typescript
import { useBackgroundVideoStore } from '../stores/BackgroundVideoStore';
import { BackgroundVideo } from '../components/BackgroundVideo';

// In a component
const { getVideoForView, setVideoForView } = useBackgroundVideoStore();

// Get current video for a view
const currentVideo = getVideoForView('dashboard');

// Set video for a view
setVideoForView('dashboard', 'Star1.mp4');

// Use the BackgroundVideo component
<BackgroundVideo view="dashboard" />
```

## Technical Architecture

### Data Flow

1. User selects video in Settings modal
2. `setVideoForView` is called on BackgroundVideoStore
3. Store updates local state and calls `saveUserPreferences`
4. User preferences are updated in UserStore
5. BackgroundVideo component reads current preference and renders video

### State Management

- **Local State**: BackgroundVideoStore manages current video preferences
- **Persistent State**: User preferences are stored in localStorage and user database
- **Synchronization**: Preferences are loaded on app initialization

### Component Hierarchy

```
HomePage
├── BackgroundVideo (view={activeView})
├── HUDContainer
├── ModalContainer
│   └── SettingsModal (video selection UI)
└── Other components
```

## Testing

A test file has been created at `apps/web-app/src/components/BackgroundVideo.test.tsx` to verify:

- Component renders correctly
- Video source is set properly
- CSS classes are applied
- Video attributes are set

## Future Enhancements

- Add video preview thumbnails in settings
- Support for custom video uploads
- Video transition animations between views
- Performance optimization for video loading
- Accessibility features for video controls

