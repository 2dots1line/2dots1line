# Card Cover Style Selector Implementation

**Date:** October 14, 2025  
**Feature:** Global & Per-Card Style Selection for AI Card Cover Generation  
**Status:** ✅ Complete

---

## Overview

Implemented a comprehensive style selection system for AI-generated card covers:
1. **Global Default Style** in Cards Settings panel (persisted across sessions)
2. **Per-Card Style Override** in individual card detail modals
3. **Enhanced Motif Generation** combining entity title + content for richer AI prompts

---

## Changes Made

### 1. **CardsViewStore** (`apps/web-app/src/stores/CardsViewStore.ts`)

#### Added Global Style Preference
- New state: `defaultCoverStyle: CoverStyle`
- New action: `setDefaultCoverStyle(style: CoverStyle)`
- Persisted in localStorage via Zustand persist middleware
- Default value: `'minimal'`

**Available Styles:**
```typescript
export type CoverStyle = 'minimal' | 'abstract' | 'nature' | 'cosmic' | 'photorealistic';
```

---

### 2. **CardsSettings Component** (`apps/web-app/src/components/settings/CardsSettings.tsx`)

#### Added Global Style Selector
- New dropdown selector in Cards Settings panel
- Label: "Default Cover Style" with Palette icon
- Shows all 5 available styles with descriptions
- Help text: "Applied when generating new card covers"
- Changes persist across sessions
- Accessible from Settings panel in Cards view

---

### 3. **EntityDetailModal Component** (`apps/web-app/src/components/modal/EntityDetailModal.tsx`)

#### Added Per-Card Style Selection UI
- **Style Dropdown**: Added a glassmorphic dropdown button with 5 predefined styles:
  - **Minimal**: Clean, minimalist design with negative space
  - **Abstract**: Geometric patterns, modern aesthetic
  - **Nature**: Organic forms inspired by nature
  - **Cosmic**: Ethereal, space-inspired, mystical colors
  - **Photorealistic**: Realistic photography style

- **UI Components**:
  - Palette icon button showing current selected style
  - Dropdown menu with style descriptions
  - Click-outside handler to close dropdown
  - Visual feedback for selected style (highlighted)

#### Improved Motif Generation
**Before:**
```typescript
const motif = entityDetails?.title || entityId;
```

**After:**
```typescript
const titlePart = entityDetails?.title || '';
const contentPart = entityDetails?.description || '';
const motif = titlePart && contentPart 
  ? `${titlePart}: ${contentPart}`
  : titlePart || contentPart || entityId;
```

Now the motif includes both the entity's title and description, providing richer context for AI image generation.

#### Syncs with Global Default
```typescript
const { defaultCoverStyle } = useCardsViewStore();
const [selectedStyle, setSelectedStyle] = useState<string>(defaultCoverStyle);

// Auto-sync when global default changes
useEffect(() => {
  setSelectedStyle(defaultCoverStyle);
}, [defaultCoverStyle]);
```

#### Updated API Call
**Before:**
```typescript
body: JSON.stringify({ motif })
```

**After:**
```typescript
body: JSON.stringify({ 
  motif,
  style_pack: selectedStyle 
})
```

---

### 4. **HomePage Component** (`apps/web-app/src/app/page.tsx`)

#### Updated Bulk Cover Generation Motif
Also updated the bulk cover generation function to use the same title + content pattern:

**Before:**
```typescript
const motif =
  card.title ||
  card.subtitle ||
  card.display_data?.preview ||
  card.type ||
  'abstract motif';
```

**After:**
```typescript
const titlePart = card.title?.trim() || card.subtitle?.trim() || '';
const contentPart = card.display_data?.preview?.trim() || '';
const motif = titlePart && contentPart 
  ? `${titlePart}: ${contentPart}`
  : titlePart || contentPart || card.type || 'abstract motif';
```

---

## How It Works

### Configuration Flow

1. **User selects style** from dropdown in EntityDetailModal
2. **User clicks "Generate Cover"** button
3. **Component builds motif** from entity title + description
4. **API receives** `style_pack` parameter (e.g., "minimal", "cosmic")
5. **API route** passes style to `MediaGenerationService`
6. **Service loads** style config from `/config/media_generation_prompts.json`
7. **Service builds prompt** using:
   - Base template
   - Style-specific suffix (from config)
   - Global constraints (from config)
8. **AI generates image** with the styled prompt

### Prompt Construction Example

**For style="cosmic" and motif="Project Alpha: Revolutionary AI system":**

```
Create a ethereal, space-inspired, mystical colors cover image for: "Project Alpha: Revolutionary AI system". Cosmic ethereal atmosphere, deep space colors, stars and nebulae, mystical and mysterious. No text or watermarks, High contrast, Clean background, Centered composition.
```

---

## Configuration Location

All style definitions are in:
**`/config/media_generation_prompts.json`**

### Structure:
```json
{
  "image_generation": {
    "base_template": "Create a {style} cover image for: \"{motif}\".",
    "styles": {
      "minimal": {
        "description": "Clean, minimalist design with negative space",
        "prompt_suffix": "Minimalist aesthetic, simple shapes...",
        "examples": [...]
      },
      // ... other styles
    },
    "constraints": [
      "No text or watermarks",
      "High contrast",
      "Clean background",
      "Centered composition"
    ]
  }
}
```

---

## User Experience

### Before:
- ❌ No style selection
- ❌ Always hardcoded to specific style
- ❌ Motif only used title (missing context)
- ❌ No persistence of user preferences

### After:
- ✅ **Global default style** in Cards Settings (persisted)
- ✅ **Per-card style override** in detail modal
- ✅ User can select from 5 different styles
- ✅ Visual dropdown with style descriptions
- ✅ Motif includes both title and description
- ✅ Real-time style preview in button label
- ✅ Smooth dropdown animations with glassmorphic design
- ✅ Settings persist across sessions via Zustand

---

## Testing

### Manual Testing Steps:

#### Test Global Default Style:
1. Go to Cards view
2. Open Settings panel (gear icon)
3. Scroll to "Default Cover Style" dropdown
4. Select a style (e.g., "Cosmic")
5. Open any card detail modal
6. Verify the style selector shows "Cosmic"
7. Generate a cover - should use Cosmic style
8. Refresh the page
9. Verify the style persists (still "Cosmic")

#### Test Per-Card Style Override:
1. Open a card detail modal
2. Click the style selector dropdown
3. Select a different style (e.g., "Nature")
4. Click "Generate Cover"
5. Verify cover uses the selected style, not global default
6. Open another card
7. Verify it uses the global default again

#### Test Motif Generation:
1. Open a card with both title and description
2. Check console logs when generating
3. Verify motif includes both: `"Title: Description"`

### Expected Logs:
```
[EntityDetailModal] Generating cover with style="cosmic", motif="My Entity: Detailed description"
```

---

## Future Enhancements

### Potential Improvements:
1. **Style Preview Thumbnails**: Show small preview images for each style
2. **Custom Style Editor**: Allow users to create custom style configs
3. **Quality Presets**: Add quality selector (low/medium/high)
4. **Recent Styles**: Remember last used style per user
5. **Style Recommendations**: AI-suggested styles based on entity type
6. **Batch Generation**: Generate covers for multiple cards at once
7. **A/B Preview**: Generate 2-3 variations and let user choose

---

## Technical Details

### State Management:
```typescript
const [selectedStyle, setSelectedStyle] = useState<string>('minimal');
const [showStyleDropdown, setShowStyleDropdown] = useState(false);
```

### Available Styles (from config):
- `minimal` (default)
- `abstract`
- `nature`
- `cosmic`
- `photorealistic`

### API Endpoint:
```
POST /api/cards/[cardId]/generate-cover
Body: {
  motif: string,
  style_pack: string
}
```

---

## Related Files

- `/apps/web-app/src/stores/CardsViewStore.ts` - Global style state management
- `/apps/web-app/src/components/settings/CardsSettings.tsx` - Global style selector UI
- `/apps/web-app/src/components/modal/EntityDetailModal.tsx` - Per-card style selector UI
- `/apps/web-app/src/app/page.tsx` - Bulk cover generation with improved motif
- `/config/media_generation_prompts.json` - Style configurations
- `/services/media-generation-service/src/MediaGenerationService.ts` - Prompt builder
- `/apps/web-app/src/app/api/cards/[cardId]/generate-cover/route.ts` - API endpoint

---

## Notes

- **Global + Per-Card Pattern**: Users set a default, but can override per card
- **Persistence**: Global style preference persists across sessions via Zustand
- **Configuration-Driven**: Styles defined in `/config/media_generation_prompts.json`
- **Rich Context**: Motif generation combines title + description for better AI results
- **Consistent UX**: Both selectors use the same style definitions
- **Auto-Sync**: Per-card selector automatically syncs with global default
- **Glassmorphic Design**: Matches V11.0 UI aesthetic
- **No Backend Changes**: Fully configuration-driven

---

**Implementation Status:** ✅ Complete and Ready for Testing

