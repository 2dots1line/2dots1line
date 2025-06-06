Okay, let's define a set of design tokens for 2dots1line V7, drawing inspiration from Material 3 principles while ensuring they align with the described product vibe: **evocative, immersive, sophisticated, personal, and growth-oriented.**

We'll focus on creating a system that feels modern, accessible, and allows for the beautiful atmospheric and cosmic themes described in the UI/UX specification.

---

## 2dots1line V7 - Design Tokens (Material 3 Inspired)

This token system will be organized by category, making it easier to manage and apply. We'll use a `sys` (system), `ref` (reference), and potentially `comp` (component-specific) naming convention where applicable, similar to Material Design.

### 1. Color System

The V7 UI/UX spec already provides a good foundation. We'll structure it into Material 3's conceptual color roles, focusing on a dynamic and adaptive system. We'll define both Light and Dark theme palettes.

**Core Idea:** The "Atmospheric Palettes" (Dawn, Twilight, Overcast) and "KGO Palette" will influence the primary, secondary, tertiary, and surface colors depending on the active scene or user state. Accent colors will be used for specific calls to action and highlighting growth elements.

**Reference Palette (Conceptual - these are base colors that roles will map to):**

*   `ref.palette.primary.dawn`: `#F8F0E3` (Soft Gold/Peach Base)
*   `ref.palette.primary.twilight`: `#CEC8FF` (Muted Lavender Base)
*   `ref.palette.primary.overcast`: `#D1D1D1` (Soft Grey Base)
*   `ref.palette.primary.kgo`: `#10002B` (Deep Indigo Base)

*   `ref.palette.secondary.dawn`: `#FDEBD0`
*   `ref.palette.secondary.twilight`: `#E0BBE4`
*   `ref.palette.secondary.overcast`: `#A0B2A6`
*   `ref.palette.secondary.kgo`: `#301E67` (A slightly lighter cosmic purple)

*   `ref.palette.tertiary.dawn`: `#FFF8E7`
*   `ref.palette.tertiary.twilight`: `#A2A2D0`
*   `ref.palette.tertiary.overcast`: `#EAEAEA`
*   `ref.palette.tertiary.kgo`: `#5B8FB9` (Nebula Blue)

*   `ref.palette.neutral.white`: `#FFFFFF`
*   `ref.palette.neutral.alabaster`: `#F0EBF4` (Nebula White from spec)
*   `ref.palette.neutral.lightGray`: `#EAEAEA`
*   `ref.palette.neutral.midGray`: `#A9A9A9` (Comet Tail Grey)
*   `ref.palette.neutral.darkGray`: `#36454F` (Charcoal Grey)
*   `ref.palette.neutral.deepCosmos`: `#03001C`

*   `ref.palette.accent.journeyGold`: `#E6BE8A`
*   `ref.palette.accent.connectionEmber`: `#FF6B6B`
*   `ref.palette.accent.reflectionAmethyst`: `#B28DFF`
*   `ref.palette.accent.growthAurora`: `#48AAAD`

*   `ref.palette.error`: `#B00020`
*   `ref.palette.onError`: `#FFFFFF`
*   `ref.palette.success`: `#38A169` (A calm green)
*   `ref.palette.onSuccess`: `#FFFFFF`

**System Color Roles (Tokens to be used in components):**

These would be dynamically assigned based on the current theme (Light/Dark) and potentially the active scene (CloudScene, GraphScene, etc.).

*   **Primary:**
    *   `sys.color.primary`: The main interactive color.
    *   `sys.color.onPrimary`: Color for text/icons on `sys.color.primary`.
    *   `sys.color.primaryContainer`: A less prominent container color related to primary.
    *   `sys.color.onPrimaryContainer`: Color for text/icons on `sys.color.primaryContainer`.
*   **Secondary:**
    *   `sys.color.secondary`: For less prominent components.
    *   `sys.color.onSecondary`: Color for text/icons on `sys.color.secondary`.
    *   `sys.color.secondaryContainer`: A less prominent container color related to secondary.
    *   `sys.color.onSecondaryContainer`: Color for text/icons on `sys.color.secondaryContainer`.
*   **Tertiary:**
    *   `sys.color.tertiary`: For contrasting accents.
    *   `sys.color.onTertiary`: Color for text/icons on `sys.color.tertiary`.
    *   `sys.color.tertiaryContainer`: A less prominent container color related to tertiary.
    *   `sys.color.onTertiaryContainer`: Color for text/icons on `sys.color.tertiaryContainer`.
*   **Error:**
    *   `sys.color.error`: For error states.
    *   `sys.color.onError`: Color for text/icons on `sys.color.error`.
    *   `sys.color.errorContainer`: A less prominent container color for errors.
    *   `sys.color.onErrorContainer`: Color for text/icons on `sys.color.errorContainer`.
*   **Surface & Background:**
    *   `sys.color.background`: The underlying color of the app.
    *   `sys.color.onBackground`: Color for text/icons on `sys.color.background`.
    *   `sys.color.surface`: Color for surfaces of components like cards, sheets, menus.
    *   `sys.color.onSurface`: Color for text/icons on `sys.color.surface`.
    *   `sys.color.surfaceVariant`: A slightly different surface color for contrast.
    *   `sys.color.onSurfaceVariant`: Color for text/icons on `sys.color.surfaceVariant`.
    *   `sys.color.surfaceContainerLowest`: New Material 3 token for subtle backgrounds.
    *   `sys.color.surfaceContainerLow`:
    *   `sys.color.surfaceContainer`:
    *   `sys.color.surfaceContainerHigh`:
    *   `sys.color.surfaceContainerHighest`:
    *   `sys.color.inverseSurface`: For elements needing high contrast against the surface.
    *   `sys.color.inverseOnSurface`: Color for text/icons on `sys.color.inverseSurface`.
    *   `sys.color.inversePrimary`: An inverse primary color, often used for primary actions on dark surfaces in light themes.
*   **Outline:**
    *   `sys.color.outline`: For borders and dividers.
    *   `sys.color.outlineVariant`: A subtler border.
*   **Scrim:**
    *   `sys.color.scrim`: For overlays that obscure content (e.g., behind dialogs). Typically black with alpha.
*   **Shadow:**
    *   `sys.color.shadow`: Color for shadows (often black with alpha).

**Example Mapping (Light Theme - Dawn Haze inspired for general UI):**

*   `sys.color.primary`: `ref.palette.accent.journeyGold`
*   `sys.color.onPrimary`: `ref.palette.neutral.deepCosmos`
*   `sys.color.primaryContainer`: `ref.palette.primary.dawn` (lighter variant)
*   `sys.color.onPrimaryContainer`: A darker shade of `ref.palette.accent.journeyGold`
*   `sys.color.secondary`: `ref.palette.accent.reflectionAmethyst`
*   `sys.color.onSecondary`: `ref.palette.neutral.white`
*   `sys.color.background`: `ref.palette.primary.dawn` (e.g., `#F8F0E3`)
*   `sys.color.onBackground`: `ref.palette.neutral.darkGray`
*   `sys.color.surface`: `ref.palette.neutral.alabaster` (for cards, modals)
*   `sys.color.onSurface`: `ref.palette.neutral.darkGray`
*   `sys.color.surfaceVariant`: A slightly darker/cooler variant of `ref.palette.neutral.alabaster`
*   `sys.color.onSurfaceVariant`: `ref.palette.neutral.midGray`
*   `sys.color.outline`: `ref.palette.neutral.midGray` (with some transparency)

**Example Mapping (Dark Theme - KGO Palette inspired for GraphScene):**

*   `sys.color.primary`: `ref.palette.accent.journeyGold`
*   `sys.color.onPrimary`: `ref.palette.neutral.deepCosmos`
*   `sys.color.primaryContainer`: A darker, desaturated `ref.palette.accent.journeyGold`
*   `sys.color.onPrimaryContainer`: `ref.palette.accent.journeyGold` (lighter tint)
*   `sys.color.secondary`: `ref.palette.accent.reflectionAmethyst`
*   `sys.color.onSecondary`: `ref.palette.neutral.deepCosmos`
*   `sys.color.background`: `ref.palette.neutral.deepCosmos` (e.g., `#03001C`)
*   `sys.color.onBackground`: `ref.palette.neutral.alabaster`
*   `sys.color.surface`: `ref.palette.primary.kgo` (e.g., `#10002B`, slightly lighter than background)
*   `sys.color.onSurface`: `ref.palette.neutral.alabaster`
*   `sys.color.surfaceVariant`: A slightly lighter variant of `ref.palette.primary.kgo`
*   `sys.color.onSurfaceVariant`: `ref.palette.neutral.midGray`
*   `sys.color.outline`: `ref.palette.neutral.midGray` (with some transparency)

**Glassmorphism Specific:**

*   `sys.color.glass.background`: `rgba(255, 255, 255, 0.1)` (Light mode base) or `rgba(30, 30, 40, 0.1)` (Dark mode base) - to be tinted by scene.
*   `sys.color.glass.border`: `rgba(255, 255, 255, 0.2)` (Light) or `rgba(80, 80, 100, 0.2)` (Dark).

*The actual dynamic assignment would happen in the theme provider based on current scene/mode.*

### 2. Typography System

Based on `v7UIUXDesign.md`, using Material 3 type scale roles.

*   **Font Families:**
    *   `sys.typescale.brand-font-family`: 'General Sans', sans-serif
    *   `sys.typescale.plain-font-family`: 'Inter', sans-serif

*   **Type Roles (examples, full scale needed):**
    *   **Display:**
        *   `sys.typescale.display-large.font-family`: `sys.typescale.brand-font-family`
        *   `sys.typescale.display-large.font-weight`: `Medium` (e.g., 500)
        *   `sys.typescale.display-large.font-size`: `57px` (Material 3 default)
        *   `sys.typescale.display-large.line-height`: `64px`
        *   `sys.typescale.display-large.letter-spacing`: `-0.25px`
        *   *(Similarly for `display-medium`, `display-small`)*
    *   **Headline:**
        *   `sys.typescale.headline-large.font-family`: `sys.typescale.brand-font-family`
        *   `sys.typescale.headline-large.font-size`: `32px` (Matches "Display" from V7 spec)
        *   `sys.typescale.headline-large.line-height`: `40px`
        *   `sys.typescale.headline-large.font-weight`: `Medium`
        *   *(Similarly for `headline-medium` (28px), `headline-small` (24px))*
    *   **Title:**
        *   `sys.typescale.title-large.font-family`: `sys.typescale.brand-font-family`
        *   `sys.typescale.title-large.font-size`: `22px` (Close to H3 from V7 spec)
        *   `sys.typescale.title-large.line-height`: `28px`
        *   `sys.typescale.title-large.font-weight`: `Regular`
        *   *(Similarly for `title-medium`, `title-small`)*
    *   **Body:**
        *   `sys.typescale.body-large.font-family`: `sys.typescale.plain-font-family`
        *   `sys.typescale.body-large.font-size`: `16px` (V7 Spec Body Standard = 16px, M3 Body Large = 16px)
        *   `sys.typescale.body-large.line-height`: `24px` (1.5x)
        *   `sys.typescale.body-large.font-weight`: `Regular`
        *   *(Similarly for `body-medium` (14px), `body-small` (12px))*
    *   **Label:**
        *   `sys.typescale.label-large.font-family`: `sys.typescale.plain-font-family`
        *   `sys.typescale.label-large.font-size`: `14px` (V7 Spec Caption)
        *   `sys.typescale.label-large.line-height`: `20px`
        *   `sys.typescale.label-large.font-weight`: `Medium`
        *   *(Similarly for `label-medium` (12px), `label-small` (11px))*

### 3. Shape System (Corner Radius)

Material 3 emphasizes distinct corner radius scales.

*   `sys.shape.corner.none`: `0dp`
*   `sys.shape.corner.extra-small`: `4dp` (e.g., chips, small buttons)
*   `sys.shape.corner.small`: `8dp` (e.g., text fields, standard buttons)
*   `sys.shape.corner.medium`: `12dp` (e.g., cards, dialogs - matches V7 spec `radius.md`)
*   `sys.shape.corner.large`: `16dp` (e.g., larger cards, sheets)
*   `sys.shape.corner.extra-large`: `28dp` (e.g., floating action buttons, HUD panels - close to V7 spec `radius.xl` of 32px)
*   `sys.shape.corner.full`: `9999px` (for circular elements like Orb, pills)

### 4. Elevation System (Shadows)

Material 3 uses tinted layers and subtle shadows. The glassmorphism will play a significant role here too.

*   **Light Theme:**
    *   `sys.elevation.level0`: `none` (surface rests on background)
    *   `sys.elevation.level1`: `box-shadow: 0 1px 2px 0 sys.color.shadow(0.3);` (subtle, for cards)
    *   `sys.elevation.level2`: `box-shadow: 0 2px 6px 2px sys.color.shadow(0.15), 0 1px 2px 0 sys.color.shadow(0.3);` (standard elevation)
    *   `sys.elevation.level3`: `box-shadow: 0 4px 8px 3px sys.color.shadow(0.15), 0 1px 3px 0 sys.color.shadow(0.3);` (modals, dialogs)
    *   `sys.elevation.level4`: `box-shadow: 0 6px 10px 4px sys.color.shadow(0.15), 0 2px 3px 0 sys.color.shadow(0.3);`
    *   `sys.elevation.level5`: `box-shadow: 0 8px 12px 6px sys.color.shadow(0.15), 0 4px 4px 0 sys.color.shadow(0.3);` (e.g., elevated HUD)
*   **Dark Theme:** Shadows are often less pronounced, relying more on surface color changes.
    *   `sys.elevation.level0`: `none`
    *   `sys.elevation.level1`: `box-shadow: 0 1px 2px 0 sys.color.shadow(0.15);`
    *   `sys.elevation.level2`: `box-shadow: 0 3px 4px 2px sys.color.shadow(0.15), 0 1px 4px 0 sys.color.shadow(0.3);`
    *   ... (adjust alpha values to be more subtle)
*   **Glassmorphism Shadow (V7 specific):**
    *   `sys.shadow.glass`: `0 8px 32px rgba(0, 0, 0, 0.1)` (from V7 spec, can be adjusted based on theme)

### 5. Spacing System (8pt Grid)

Consistent with `v7UIUXDesign.md`.

*   `sys.spacing.xxs`: `4px`
*   `sys.spacing.xs`: `8px`
*   `sys.spacing.sm`: `12px` (added for finer control if needed)
*   `sys.spacing.md`: `16px`
*   `sys.spacing.lg`: `24px`
*   `sys.spacing.xl`: `32px`
*   `sys.spacing.xxl`: `48px`
*   `sys.spacing.xxxl`: `64px`

### 6. Motion & Transition Tokens

(From `v7UIUXDesign.md` and Material 3 motion principles)

*   **Easing Curves:**
    *   `sys.motion.easing.emphasized`: `cubic-bezier(0.2, 0, 0, 1)` (for elements entering/exiting screen)
    *   `sys.motion.easing.standard`: `cubic-bezier(0.4, 0, 0.2, 1)` (for standard transitions within screen)
    *   `sys.motion.easing.decelerated`: `cubic-bezier(0.0, 0.0, 0.2, 1)` (for elements coming to a stop)
    *   `sys.motion.easing.accelerated`: `cubic-bezier(0.4, 0.0, 1, 1)` (for elements picking up speed)
*   **Durations:**
    *   `sys.motion.duration.short1`: `100ms` (e.g., icon state changes)
    *   `sys.motion.duration.short2`: `150ms`
    *   `sys.motion.duration.medium1`: `250ms` (e.g., standard fades, small expansions)
    *   `sys.motion.duration.medium2`: `300ms` (default UI transitions from V7 spec)
    *   `sys.motion.duration.long1`: `400ms` (e.g., modal fade-ins from V7 spec)
    *   `sys.motion.duration.long2`: `500ms`
    *   `sys.motion.duration.extraLong1`: `800ms` (e.g., scene transitions from V7 spec)

### 7. State Layer Tokens (Opacity for Hover, Focus, Pressed, Dragged)

Material 3 uses semi-transparent overlays to indicate states.

*   `sys.state.hover.state-layer-opacity`: `0.08` (8%)
*   `sys.state.focus.state-layer-opacity`: `0.12` (12%)
*   `sys.state.pressed.state-layer-opacity`: `0.12` (12%)
*   `sys.state.dragged.state-layer-opacity`: `0.16` (16%)

The color of the state layer is typically derived from `sys.color.onSurface` or `sys.color.primary`.

### 8. Z-Index & Layering Tokens

(From `v7UIUXDesign.md`)
*   `sys.zIndex.canvas`: `0`
*   `sys.zIndex.modalBackdrop`: `700` (if needed for modal scrim)
*   `sys.zIndex.modal`: `800`
*   `sys.zIndex.hud`: `900` (assuming HUD can overlay modals sometimes or is separate)
*   `sys.zIndex.orb`: `1000`

**Implementation Notes for AI Agents:**

*   **CSS Custom Properties / Theme Variables:** These tokens should be implemented as CSS custom properties (variables) or within a theme object in JavaScript (e.g., for Styled Components, Emotion, or Tailwind theme configuration).
*   **Dynamic Theming:** The `sys.color.*` roles will need a mechanism to switch between Light, Dark, and potentially scene-specific palettes (Dawn, Twilight, Overcast, KGO). This could be managed via a theme provider in React.
*   **Referencing:** When prompting AI to style a component, refer to these system tokens (e.g., "Style the button background using `sys.color.primary` and text color `sys.color.onPrimary`. Use `sys.shape.corner.small` for border radius.").

This set of design tokens provides a robust foundation that respects the Material 3 guidelines while adapting to the unique aesthetic and functional requirements of 2dots1line V7. It emphasizes dynamic color themes and provides clear guidance for typography, shape, elevation, and motion.