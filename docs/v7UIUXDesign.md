# 2dots1line V7 UI/UX Design Specification

**Document Version:** 7.0  
**Date:** June 10, 2025  

## 1. Executive Summary & Design Philosophy

**2dots1line** is a self-evolving memory and growth system designed to help users define their identity, find their voice, gain creative agency, and build profound connections with their inner self and the world. The experience centers around a personal universe where memories, thoughts, and insights interconnect in a meaningful way.

### Core Philosophy: The Know → Act → Show Cycle

Our design is built upon an iterative cycle of personal growth:

1. **Know (Self & World):** Understand your inner landscape (needs, values, dreams) and your relationship with the external world.
2. **Act (For Self & World):** Take meaningful action, informed by self-knowledge and worldly understanding.
3. **Show (To Self & World):** Reflect on actions, integrate learnings, and articulate your evolving narrative.

### 3-Layer Modular Architecture

The 2dots1line user interface is built on a 3-layer modular architecture, with each layer independent in logic and rendering:

1. **3D Canvas Layer:** The immersive background scenes (cloudscape, ascension, cosmos graph). This layer is environmental and symbolic. It sets the emotional tone and provides context. In the cosmos graph scene, the celestial objects visualize the knowledge graph and are interactive.

2. **2D Modal Layer:** A structured UI plane hosting all modals, card galleries, dashboards, etc. These 2D panels float above the 3D canvas with glassmorphism effects.

3. **3D Orb (Top Layer):** A real-time 3D animated presence rendered in front of all interface elements. Orb is personal, responsive, and narrative. It proactively interacts with the user and can trigger scene changes, activate modals, and engage in conversation.

### Design Pillars

1. **Evocative Atmospheres:** Light, color, and amorphous forms create distinct moods for different interactions.
2. **Embodied Intelligence (Orb):** Orb is a perceptible presence that shifts states and expresses through visual transformations.
3. **Seamless Transitions:** Navigation and state changes are cinematic journeys that reinforce the metaphor of exploring a personal cosmos.
4. **Amorphous Design Principle:** UI elements use soft forms, light, and color to create a fluid, dreamlike experience.
5. **Unified Cosmic Graph:** The knowledge graph is consistently visualized as a celestial system, reinforcing its interconnected, expansive nature.
6. **Luxurious Minimalism:** Elegant typography, refined color palettes, and purposeful motion contribute to a premium feel.

## 2. Visual Design Language

### 2.1 Color System

The color system is designed to evoke emotional states and guide the user through different contexts. It consists of several interconnected palettes:

#### Interface Shell Atmospheric Palettes

These palettes are applied to background washes, light effects, and UI elements:

* **Dawn Haze:** Soft golds, peaches, ethereal whites (`#F8F0E3`, `#FDEBD0`, `#FFF8E7`)  
  *For gentle beginnings, morning reflections, new inputs*

* **Twilight Veil:** Muted lavenders, rose tints, deep blues (`#CEC8FF`, `#E0BBE4`, `#A2A2D0`)  
  *For introspection, connection, creative exploration*

* **Overcast Serenity:** Soft greys, muted teals, hints of silver (`#D1D1D1`, `#A0B2A6`, `#EAEAEA`)  
  *For focused work, calm states, analytical tasks*

#### Knowledge Graph Observatory (KGO) Palette

* **Deep Cosmos Black/Indigo:** (`#03001C`, `#10002B`, `#0B0E2D`)  
  *The canvas for the graph*

* **Starlight & Nebula Hues:** Vibrant blues, purples, pinks, golds for graph elements

#### Accent & Highlight Colors

* **Journey Gold:** (`#E6BE8A`)  
  *For key insights, user-created highlights, call-to-actions*

* **Connection Ember:** (`#FF6B6B`)  
  *For new connections, active links, relationship indicators*

* **Reflection Amethyst:** (`#B28DFF`)  
  *For annotations, reflective prompts, personal growth markers*

* **Growth Aurora:** (`#48AAAD`)  
  *For progress indicators, skill development, goal tracking*

#### Neutral & Text Colors

* **Nebula White:** (`#F0EBF4`)  
  *Primary text, UI elements on dark backgrounds*

* **Comet Tail Grey:** (`#A9A9A9`)  
  *Secondary text, subtle UI hints*

### 2.2 Typography

#### Primary Typefaces

* **Headings & Display:** *General Sans* (Sans-serif) – Modern, geometric with personality
* **Body Text & UI Elements:** *Inter* (Sans-serif) – Highly legible, excellent for UI

#### Type Scale (8pt Grid)

* Display: 32px / General Sans Medium
* H1: 28px / General Sans Medium
* H2: 24px / General Sans Medium 
* H3: 20px / General Sans Regular
* Body Large: 18px / Inter Regular
* Body Standard: 16px / Inter Regular
* Caption: 14px / Inter Light
* Micro: 12px / Inter Regular

#### Typographic Rules

* Generous line height (1.5x) for readability
* Text on dark backgrounds: Nebula White at 85-95% opacity
* Emphasis through weight and italic variants

### 2.3 Space & Layout System

* **8pt Grid:** Standard spacing (8, 16, 24, 32, 48, 64px)
* **Layered Depth:** Key interactive elements float above atmospheric backgrounds
* **Asymmetrical Balance:** Creating visual interest and natural focal points
* **Progressive Disclosure:** Complex UI elements emerge gradually
* **Glassmorphic UI:** Panels feature backdrop blur, subtle transparency, and gentle borders
* **Responsive Design:** Fluid adaptation across devices with consistent experience

### 2.4 Motion & Animation

#### Core Principles

* **Amorphous Transitions:** UI elements and backgrounds morph, dissolve, and coalesce
* **Natural Easing & Physics:** Custom curves, subtle spring physics for a responsive feel
* **Atmospheric Presence:** Orb's subtle breathing, background particle drifts
* **Purposeful Choreography:** Animations guide attention, explain relationships, and enhance discovery

#### Key Motion Patterns

* **Orb Expressions:** Shifts in Orb's form, glow, intensity
* **Panel Transitions:** Smooth revealing/hiding of UI elements with subtle scale and opacity shifts
* **Constellation Formation:** Lines drawing between memory stars, clusters forming
* **Warp & Glide:** Smooth, accelerated transitions between major views
* **Particle Flows:** Indicating data processing or energy transfer 

## 3. 3D Canvas Layer

The 3D canvas in 2dots1line is not decoration—it is the spatial story engine. It serves to evoke emotion through atmospheric immersion, visually externalize the user's growth, memory, and direction, and provide a non-linear interface for exploration and reflection.

### 3.1 Canvas Structure

```
<div className="relative w-screen h-screen">
  <Canvas camera={...} shadows>
    <SceneManager />         // conditionally renders active scene
    <Lights />
    <SharedAssets />
  </Canvas>

  <HUD />                    // pointer-events-enabled overlay layer
  <Modals />                 // glassmorphic floating cards
</div>
```

#### Main Components

| **Component** | **Role & Description** |
|---|---|
|`<Canvas>` | Root WebGL container (via @react-three/fiber) |
|`<SceneManager />` | State-driven switch between CloudScene, AscensionScene, GraphScene |
|`<Lights />` | Directional + ambient + optional bloom light rig |
|`<SharedAssets />` | Preloaded textures, fog shader, skybox, reusable meshes |
|`<HUD />` | Minimal heads-up interface (CTA buttons, emotional indicators) |
|`<Modals />` | Glassmorphic UI for journaling, memory capsule detail, etc. |

### 3.2 Scene Modules

#### 3.2.1 CloudScene — Flying Over Cloudscape & Snowy Peaks

**Conceptual Intention**

This scene is a continuous dreamlike flight, experienced from the vantage of a soaring camera. The visuals evoke a sacred transition—from groundedness to light, from opacity to perspective, from solitude to infinite possibility. It's a visual metaphor for hope, growth, and directionality.

**Visual Composition**

- **Sky (Epyréan Skyscape):** ~60% (upper 3/5 of the frame)
- **Cloudscape (Layered):** ~30% (lower-mid horizontal zone)
- **Snowy Peaks (Distant):** ~10% (bottom sliver, occasionally revealed through clouds)

**Camera & Movement**

- **Camera Path**: Diagonal drift from bottom-left to upper-right quadrant (approx. 30° vector)
- **Speed**: Slow, continuous, steady easing (easeInOutSine)
- **Looping Seamlessly**: Cloud and light layers tile gently; mountains pass without abruptness

**Clouds & Atmosphere**

- **Cloud Type**: Layered stratus + broken cumulus
- **Volume & Motion**: Multi-plane 3D layers using shaders or textured fog cards
- **Opacity**: Variable with light; soft edges, not harsh outlines
- **Light Scattering**: Volumetric light rays through cloud breaks
- **Color Variation**: Soft purples, pinks, golds, and subtle teal grays

**Lighting & Color**

- **Light Source**: Directional light from upper-right corner
- **Color Palette**: Gradient of deep violet → coral → amber → near-white sky
- **Golden Edge Rims**: Thin highlights on clouds and peaks

**Technical Implementation**

- **Clouds**: Volume shaders, alpha-blended cards, or three-volumetric-clouds
- **Mountains**: Parallaxed heightmap meshes or photogrammetry
- **Lighting**: THREE.DirectionalLight with volumetric plugin
- **Looping**: Animate offset tiles or camera path resets

#### 3.2.2 AscensionScene — Transition from Earth to Inner Cosmos

**Narrative Intent**

This is the threshold moment—the crossing from outer landscape into inner meaning space. The scene evokes a shift in gravity, a loss of friction and noise, and a rising presence of light and silence.

**Camera Movement**

- **Path**: Vertical diagonal vector: bottom-left → upper-center → still
- **Easing**: easeInOutExpo for ascent → easeOutCirc for zero-G deceleration
- **Speed Phases**: Slow drift → increasing acceleration → sudden stillness

**Transition Phases**

1. **Atmospheric Acceleration**
   - Layered clouds rush past the camera, alpha-blended and scrolling
   - Subtle turbulence as wind vectors swirl
   - Color palette: golden pinks and lavender blues

2. **Tunneling & Shear**
   - Clouds begin to thin and stretch like speed lines
   - Lens-like distortion appears near screen edge
   - Wind sounds fade, low frequency builds

3. **Boundary Break / Flash**
   - A final cloud veil tears open
   - Flash bloom white → immediate dark silence
   - Motion slows radically (visual zero-gravity effect)
   - Particle sparkles begin to fade in around the periphery

**Arrival into Cosmic Layer**

- **Starscape**: Begins faint, expands into soft parallax starfield
- **Fog**: Light fog at lower Z-depth to ground the arrival
- **Lighting**: Ambient-only, soft white and Reflection Amethyst tones

**Implementation Techniques**

- **Clouds**: Volumetric noise shaders or layered PlaneGeometry
- **Speed Ramp**: Control camera Z or Y vector + speed multiplier via useFrame
- **Flash / Fade**: Overlay `<div>` with opacity tween
- **Starlight Emergence**: Gradual increase in Points opacity + scale

#### 3.2.3 GraphScene — Cosmic Knowledge Graph

**Conceptual Metaphor**

The user's internal landscape becomes a cosmic map—an interactive starfield where each node represents a memory, insight, or self-constructed meaning. This is not a graph of data—it's a galaxy of lived experience.

**Visual Elements**

1. **Memory Star**
   - Spherical orb with glow aura and inner pulsing core
   - Visual properties mapped to data attributes (importance, recency, etc.)
   - On hover/select, expands to show preview

2. **Concept Nebula/Node**
   - Volumetric cloud-like structure with internal light sources
   - Size reflects centrality in the knowledge graph
   - Color-coded by concept type

3. **Connection Pathway**
   - Luminous lines with subtle directional flow
   - Thickness/pulsation indicating relationship strength
   - Color-coded by relationship type

4. **Constellation/Cluster**
   - Visual representation of detected communities
   - Distinctive patterns emerging from constituent concepts
   - Soft boundary visualization

**Environment**

- **Backdrop**: Deep cosmos gradient—black to indigo, with pockets of reflective light
- **Lighting**: Subtle ambient illumination + radiant glows from nearby nodes
- **Depth**: Parallax layering of stars and light particles creates a sense of infinite space

**Interaction**

- **Camera**: Subtle easing on zoom/orbit with dampened inertia
- **Input**: Click or tap to select nodes; long-press to anchor or reflect
- **Node Expansion**: Organic "bloom" effect as a selected node grows

**Technical Specifications**

- **Node Shape**: THREE.Mesh with SphereGeometry(1, 32, 32)
- **Base Radius**: 0.35 units (scales up to 0.6 on hover/active)
- **Glow Radius**: 1.2x outer shell using MeshBasicMaterial + additive blending
- **Material**: MeshStandardMaterial with emissive, metalness=0.2, roughness=0.5
- **Hover Animation**: Scale to 1.2x, glow pulse up, easeOutCubic, duration: 400ms

### 3.3 Technical Implementation

#### Framework & Libraries

- **Core**: React with TypeScript and Next.js
- **3D Engine**: Three.js with React Three Fiber
- **Helpers**: R3F-Drei for utilities, React Three Postprocessing for effects
- **State Management**: Zustand for atomic state

#### Performance Optimization

- **Rendering Strategy**:
  - Progressive level of detail for graph elements
  - Frustum culling for off-screen elements
  - Instance merging for similar elements
  - Web Workers for heavy computations

- **Asset Management**:
  - Dynamic loading of 3D assets
  - Texture atlasing and compression
  - Asset preloading for critical paths

- **Memory Management**:
  - Dispose unused Three.js objects
  - Virtualization for large datasets
  - Pagination for large graph visualization

#### Responsive Design & Accessibility

- **Device Adaptation**:
  - Fluid layout system adapting to all screen sizes
  - Touch-optimized controls on mobile
  - Alternative navigation for devices without gesture support

- **Performance Tiers**:
  - "Light Mode" for lower-end devices (simplified effects)
  - "Standard Mode" for mid-range devices (balanced visuals)
  - "Enhanced Mode" for high-end devices (full visual effects) 

## 4. 2D Modal Layer

The 2D modal layer consists of structured UI elements that float above the 3D canvas, providing intuitive access to information and interactions. These elements use a glassmorphic design language for a sense of lightness and elegance.

### 4.1 Card Gallery System

The infinite card gallery is a structured 2D field for all story and concept cards. Each card represents a node, cluster, or narrative artifact from the knowledge graph.

#### Card Design

Cards are the vehicle to show information about nodes, clusters, and their combinations into custom artifacts. Each card has two sides:

1. **Visual Side**: Contains image/icon representing the concept, visual state indicators, and connection previews
2. **Information Side**: Contains text, stats, interaction options, and growth indicators

#### Six-Dimensional Growth Model

The growth model works holistically across the user's entire knowledge graph rather than rigidly requiring all dimensions to be completed for each card. Each card contributes to the overall ecosystem:

| Self Side | World Side |
|---|---|
| Know Self | Know World |
| Act for Self | Act for World |
| Show Self | Show to World |

#### Card System Gamification

The card system uses several game mechanics to create an engaging, growth-oriented experience:

1. **Constellation Completion**
   - Cards naturally form into thematic constellations in the knowledge graph
   - Completing related cards within a constellation unlocks special insights and visual effects
   - Orb suggests "missing stars" that would complete meaningful patterns

2. **Card Evolution States**
   - Cards have multiple evolution states rather than simple "activated/unactivated" binaries
   - **Seed**: Initial concept capture, minimal information
   - **Sprout**: Basic reflection or context added, 1-2 dimensions engaged
   - **Bloom**: Rich content, multiple dimensions engaged, connections formed
   - **Constellation**: Part of a larger system of meaning, contributing to major insights
   - **Supernova**: Transformative concept that has led to significant personal change

3. **Growth Paths & Challenges**
   - Cards suggest personalized "next steps" based on their current state
   - **Reflection Prompts**: Deepen understanding (Know dimension)
   - **Action Challenges**: Experiment with concept in real world (Act dimension)
   - **Expression Quests**: Create and share related content (Show dimension)
   - **Connection Hunts**: Find and link to complementary concepts

4. **Reward Mechanics**
   - **Visual Evolution**: Cards become more vibrant, detailed, and animated as they grow
   - **Insight Unlocks**: Deeper engagement reveals hidden layers of meaning within cards
   - **Cosmic Events**: Milestone achievements trigger beautiful animations in the 3D cosmos
   - **Collection Bonuses**: Completing thematic sets unlocks special features or visualizations

5. **Playful Variability**
   - **Orb's Dream Cards**: Special cards generated during system downtime with unexpected connections
   - **Mystery Challenges**: Occasional real-world activities suggested by Orb that reveal their purpose only upon completion
   - **Serendipity Engine**: System occasionally surfaces forgotten or unusual cards with new context

#### Card Interaction Flow

1. **Discovery**: New concepts enter as faint "seed" cards in the gallery
2. **Activation**: Initial engagement brings the card into focus
3. **Nurturing**: Multiple interactions across different dimensions enrich the card
4. **Connection**: Linking to other cards creates constellation patterns
5. **Integration**: Fully developed cards contribute to larger insights and personal narratives

### 4.2 Dashboard

The dashboard is a landing modal for users to catch up on latest stats, updates, insights, and action items. It serves several goals:

- **Engagement**: Greet and re-engage users when they log back in
- **Narrative Continuity**: Orb might prompt the user with a question, share a "dream" it had while consolidating memory (ranging from profound insights to playful observations), or occasionally be silent, waiting for the user to initiate interaction
- **Insights**: Share new patterns, connections, and exploration opportunities
- **Growth Metrics**: Show multidimensional progress across the knowledge ecosystem

#### Dashboard Sections

1. **Greeting & Status**
   - Personalized welcome with time-of-day context
   - Orb's current "mood" or focus area
   - Brief summary of changes since last visit

2. **Cosmic Metrics**
   - **Star Count**: Total nodes above importance threshold
   - **Constellation Map**: Visual representation of concept clusters
   - **Dimensional Balance**: Radar chart showing engagement across the six dimensions
   - **Luminosity Index**: Measure of how many nodes have deep, rich connections versus shallow linkages
   - **Transformation Markers**: Highlighting concepts that have evolved significantly over time

3. **Active Journeys**
   - Ongoing constellations-in-progress
   - Recently active cards requiring attention
   - Recommended growth paths based on current patterns

4. **Insight Discoveries**
   - New patterns or connections discovered by Orb
   - Highlighted contradictions or growth opportunities
   - Unexpected connections between distant concepts

5. **Growth Invitations**
   - Contextual suggestions based on recent activity
   - Mini-challenges that can be completed in 5-15 minutes
   - "Cosmic quests" that invite deeper exploration or real-world actions

### 4.3 HUD (Heads-Up Display)

The HUD is a control hub for users to switch scenes or navigate across different activities or features through shortcuts. It can be expanded to reveal the full dashboard.

#### HUD Controls

- **Scene Toggle**: Switch between CloudScene and GraphScene
- **Ascension Trigger**: Initiate transition to knowledge graph
- **Card Gallery**: Access infinite card collection
- **Journal Mode**: Quick note capture without conversation
- **Dashboard Expansion**: Pull out to reveal full dashboard
- **Quest Log**: Quick access to current growth challenges
- **Celebration Marker**: Indicator when milestones have been reached

### 4.4 Chat Interface

The chat interface is a dedicated modal for conversations with Orb. It can either follow Orb in a corner or be anchored as a side panel for longer conversations.

#### Chat Features

- **Input Methods**: Text, voice, and media upload
- **Context Display**: Relevant cards, memories, or concepts appear above the chat
- **Orb Integration**: Visual cues in Orb's appearance correspond to chat context
- **Smart Suggestions**: Quick response options based on conversation flow
- **Growth Prompts**: Subtle nudges toward reflective thinking or card development

### 4.5 Modal Implementation

#### Technical Specifications

1. **Glassmorphism Effect**:
   ```css
   .glassmorphic {
     background: rgba(255, 255, 255, 0.1);
     backdrop-filter: blur(20px);
     border: 1px solid rgba(255, 255, 255, 0.2);
     border-radius: 16px;
     box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
   }
   ```

2. **Animation Parameters**:
   - **Entry**: Transform scale from 0.95 to 1.0, opacity from 0 to 1
   - **Timing**: 300-400ms duration, easeOutQuint
   - **Exit**: Reverse of entry animation, slightly faster (250ms)
   - **Achievement**: Special celebration animations (600-800ms) with particle effects

3. **Responsive Behavior**:
   - **Mobile**: Full screen modals with swipe gestures
   - **Tablet**: 80% width modals with positioning options
   - **Desktop**: Variable width depending on content, with flexible placement

4. **Accessibility**:
   - Keyboard navigation with focus trapping
   - Screen reader announcements for modal state changes
   - High contrast mode support
   - Alternative text-based representation of visual growth indicators

## 5. Orb Design & Behavior

Orb is the visual and emotional anchor of the 2dots1line experience. It is not a mascot or avatar, but a non-anthropomorphic presence that guides, mirrors, and responds to the user's state.

### 5.1 Visual Appearance

#### Shape & Structure

- **Form**: Perfect sphere (radius: 0.4–0.6 units)
- **Surface**: Smooth, slightly glossy
- **Geometry**: High-poly sphere (SphereGeometry(64, 64) or custom smooth mesh)

#### Material Layers

1. **Core Layer**
   - Subsurface glowing center
   - Soft volumetric light
   - Shader: emissive center with radial falloff
   - Color: animated gradient (Aurora Teal → Amethyst → Journey Gold)

2. **Outer Shell**
   - Transparent glassy skin with light-reflecting properties
   - Thin Fresnel edge glow
   - Slight iridescent sheen (optional subtle diffraction effect)

3. **Aura/Halo**
   - Faint bloom or glow around Orb
   - Optional animated particles or shimmer within the aura
   - Radius: 1.1–1.4x Orb size, based on engagement state

### 5.2 State Changes & Color Behavior

| State | Primary Color | Notes |
|---|---|---|
| Idle / Neutral | Nebula White (#F0EBF4) | Very faint glow |
| Listening / Engaged | Reflection Amethyst (#B28DFF) | Slow pulsing aura |
| Insight / Prompt | Journey Gold (#E6BE8A) | Spark pulse outward |
| Emotional Moment | Connection Ember (#FF6B6B) | Inner shimmer |
| Progress / Growth | Growth Aurora (#48AAAD) | Ring expansion animation |

### 5.3 Motion Specification

#### Idle State

- Slight floating (Y-axis: sine wave oscillation of ~0.05 units)
- Very slow rotation (Y-axis, 360° every 60s)
- Aura gently flickers (opacity noise from 0.02 to 0.06)

#### Hovered or Focused

- Scales up by 1.1x over 300ms (easeOutCubic)
- Glow pulse outward (radius expands then contracts)
- Slight camera-facing tilt (billboarding toward viewer)

#### Engaged (e.g., user clicks Orb or it's speaking)

- Color transitions over 500ms (easeInOutQuad)
- Inner core pulses brighter, sends out 2-3 spark trails
- Optional: quiet harmonic sound cue (120–160Hz)

#### Deep Reflection State

- Orb lowers slightly (weighted feeling)
- Glow dims slightly but becomes warmer in tone
- Minor rotation slows even further (~360° every 2 min)

### 5.4 Scene-Specific Behavior

#### CloudScene

**Visual Behavior**:
- Floats slowly near the bottom center, gently pulsing like a breathing orb
- Faint glow (Journey Gold or Nebula White) with soft atmospheric blur
- Subtle trailing mist or particle drift around it

**Role**:
- Whispers prompts like "Breathe in... breathe out..." or "Are you ready to begin?"
- Optional click or hover expands a gentle reflection prompt

#### AscensionScene

**Visual Behavior**:
- Transforms into a stream of light particles or elongates into a comet shape
- Stays just ahead of the camera, leading the viewer upward
- Accelerates, then slows with the scene

**Role**:
- Silent during the majority of the ascent
- As stars begin to appear, whispers transition prompts

#### GraphScene (Knowledge Graph)

**Visual Behavior**:
- Re-materializes as a luminous orb, orbiting nearby or following cursor gently
- Adapts glow color to user emotion/state
- Occasionally sends sparkles to nearby memory nodes to guide attention

**Role**:
- Active guide and responder
- Whispers insights as nodes are explored
- Suggests reflections or connections between memories

### 5.5 Technical Implementation

#### Environment

- **Framework**: three.js or @react-three/fiber
- **Lighting**: Ambient + soft directional (top-right)
- **Tone Mapping**: ACESFilmicToneMapping, exposure: 1.0–1.2

#### Shader Tips

- Use gl_FragCoord, distance, or radial gradient to calculate aura falloff
- Glow pass via UnrealBloomPass (threshold: 0.7, strength: 1.5, radius: 0.6)
- For core pulse: use sin(time * speed) * intensity for breathing effect
- Optionally use noise or simplex noise for aura flicker

#### Performance Consideration

- Optimize for mobile by using lower bloom resolution or texture-based fake glow
- Disable particle halo when out of focus 

## 6. User Journeys & Interactions

### 6.1 Core User Journeys

#### Daily Centering (Wake Up/Intention)

- **Starting Point**: Home screen with Dawn Haze atmosphere
- **Orb State**: Soft, gentle pulsing form
- **Content Focus**: A prominent "Daily Reflection" card appears as a floating panel
- **Visual**: Soft, warm golds and peaches in the background with subtle drift
- **User Action**: Journal entry or intention setting for the day

#### Focused Work (Get Things Done)

- **Starting Point**: Dashboard with task overview
- **Orb State**: More solid, focused form
- **Content Focus**: Task lists appear as interconnected light bubbles
- **User Action**: Organization, prioritization, and task completion

#### Creative Exploration (Ideas/Brainstorming)

- **Starting Point**: Card Gallery or GraphScene
- **Orb State**: Dynamic, energetic form
- **Content Focus**: Ideas appear as luminous motes that can be organized
- **User Action**: Capture thoughts, connect ideas, build concept maps

#### Mindful Pause (Break/Recharge)

- **Starting Point**: Any scene with a pause command
- **Content Focus**: Orb offers curated micro-content as floating cards
- **User Action**: Guided breathing, quick reflection, or micro-meditation

#### Integrative Reflection (Debrief)

- **Starting Point**: Begin in Chat Space, transition to GraphScene
- **Orb's Role**: Guides reflection, records key takeaways
- **User Action**: Review day/week/project, identify patterns, extract insights

### 6.2 Navigation Paradigms

#### Touch & Gesture (Mobile/Tablet)

- **Standard gestures**: Tap, long-press, pinch, drag, swipe
- **Signature navigation gestures**:
  - **Home ↔ Chat**: Horizontal Swipe
  - **Any Scene → GraphScene**: Two-Finger Swipe Down (Ascension)
  - **GraphScene → Home**: Two-Finger Swipe Up
- **Orb Interaction**: Tap to summon, long-press for options menu
- **Card Manipulation**: Drag & drop for organizing, pinch to expand/collapse

#### Mouse & Keyboard (Desktop)

- Standard point-and-click with hover states
- Scroll-wheel zoom in GraphScene
- Right-click context menus
- Keyboard shortcuts for navigation and common actions

#### Voice Input

- Natural language for memory capture and queries
- Commands prefixed with "Orb" for direct interaction

### 6.3 First-Time User Experience (Onboarding)

1. **Welcome (0:00-0:30)**
   - CloudScene fades in with Dawn Haze atmosphere
   - Text introduction to 2dots1line concept

2. **Orb Introduction (0:30-1:30)**
   - Orb materializes with gentle animation
   - Brief explanation of Orb's role as guide and companion

3. **First Memory Capture (1:30-2:30)**
   - Guided prompt to share a thought or memory
   - Visualization of the input as a light mote

4. **Adding Context (2:30-3:30)**
   - Brief explanation of tagging/annotation
   - User adds context to their first memory

5. **Creating Connections (3:30-4:30)**
   - Prompt to add a related memory
   - Visual demonstration of connection creation

6. **Ascension Introduction (4:30-5:30)**
   - Guided transition to GraphScene
   - Explanation of the Inner Cosmos concept

7. **Tour Completion (5:30+)**
   - Brief overview of available features
   - Next steps guidance

## 7. Design Tokens

Design tokens provide a centralized system of values for consistent styling across the entire 2dots1line platform.

### 7.1 Color Tokens

#### Brand & Functional Colors

| Token | Value | Description |
|---|---|---|
| `color.journeyGold` | `#E6BE8A` | Highlights, call-to-actions |
| `color.connectionEmber` | `#FF6B6B` | Active links, relationship cues |
| `color.reflectionAmethyst` | `#B28DFF` | Annotations, prompts, introspection |
| `color.growthAurora` | `#48AAAD` | Progress, motivation indicators |

#### Neutrals

| Token | Value | Use Case |
|---|---|---|
| `color.nebulaWhite` | `#F0EBF4` | Primary text, overlays |
| `color.cometGrey` | `#A9A9A9` | Secondary text, dividers |
| `color.voidBlack` | `#0B0E2D` | Background of graph scene |
| `color.overlayDark` | `rgba(0,0,0,0.4)` | Modals, backdrop filter |

#### Gradients

| Token | Stops | Use |
|---|---|---|
| `gradient.cosmicDawn` | Twilight Veil → Journey Gold → Nebula White | Onboarding, card activation |
| `gradient.galacticFlow` | Deep Cosmos → Amethyst → Ember | Active graph interactions |
| `gradient.atmosphericShell` | Dawn → Twilight → Overcast | Interface backgrounds |

### 7.2 Typography Tokens

| Token | Value | Usage |
|---|---|---|
| `font.family.base` | 'Inter', sans-serif | Default text |
| `font.family.display` | 'General Sans', sans-serif | Headlines, large numbers |

| Token | Value | Notes |
|---|---|---|
| `font.size.xs` | `12px` | UI labels |
| `font.size.sm` | `14px` | Descriptive text |
| `font.size.md` | `16px` | Body text |
| `font.size.lg` | `20px` | Modal headings |
| `font.size.xl` | `28px` | Card titles, section headers |
| `font.weight.regular` | `400` | Base text |
| `font.weight.bold` | `600` | Emphasis |

### 7.3 Spacing & Layout Tokens

| Token | Value | Description |
|---|---|---|
| `space.xs` | `4px` | Tight padding, icon spacing |
| `space.sm` | `8px` | Inline spacing |
| `space.md` | `16px` | Standard padding |
| `space.lg` | `24px` | Section spacing |
| `space.xl` | `32px` | Large layout breathing room |
| `container.width.max` | `1200px` | Max width for centered layout |

### 7.4 Radius & Shape Tokens

| Token | Value | Application |
|---|---|---|
| `radius.xs` | `4px` | Input fields, micro cards |
| `radius.md` | `12px` | Modals, standard cards |
| `radius.xl` | `32px` | Floating containers, HUD panels |
| `radius.full` | `9999px` | Orb, status pills, floating buttons |

### 7.5 Shadow & Elevation Tokens

| Token | Value | Use Case |
|---|---|---|
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.06)` | Cards, small elements |
| `shadow.md` | `0 4px 8px rgba(0,0,0,0.1)` | Modals, floating buttons |
| `shadow.lg` | `0 12px 24px rgba(0,0,0,0.15)` | Elevated HUD elements |
| `shadow.glow` | `0 0 12px rgba(178,141,255,0.6)` | Orb aura, activated cards |

### 7.6 Motion & Transition Tokens

| Token | Value | Description |
|---|---|---|
| `transition.default` | `all 300ms ease` | Standard UI transitions |
| `transition.modal` | `opacity 400ms ease-out` | Modal fade-ins |
| `motion.bounce` | Spring (0.4, 0.1, 0.2, 1) | Card or Orb response movement |
| `motion.slow` | `ease-in-out 800ms` | Used for camera or scene transitions |

### 7.7 Z-Index & Layering Tokens

| Layer | Token | Z-Index | Description |
|---|---|---|---|
| **Orb (3D)** | `z.orb` | `1000` | Always on top (3D to DOM projection) |
| **2D Modal Layer** | `z.modal` | `800` | Cards, HUD, dashboard |
| **3D Canvas** | `z.canvas` | `0` | Immersive background |

## 8. Technical Implementation

### 8.1 Architecture

#### Frontend Technology Stack

- **Core Framework**: React with TypeScript
- **Rendering**: Next.js for server-side rendering and routing
- **3D Graphics**: Three.js with React Three Fiber
- **State Management**: Zustand for atomic state management
- **API Communication**: GraphQL with Apollo Client
- **Animation**: Framer Motion for UI, GSAP for complex sequences
- **Styling**: Tailwind CSS with custom configuration, Emotion for complex components

#### 3D Implementation

1. **Scene Management**
   ```jsx
   // SceneManager.tsx
   function SceneManager() {
     const { currentScene } = useSceneStore()
     
     return (
       <>
         {currentScene === 'cloud' && <CloudScene />}
         {currentScene === 'ascension' && <AscensionScene />}
         {currentScene === 'graph' && <GraphScene />}
       </>
     )
   }
   ```

2. **Canvas Setup**
   ```jsx
   // Layout.tsx
   function Layout({ children }) {
     return (
       <div className="relative w-screen h-screen">
         <Canvas 
           camera={{ position: [0, 0, 5], fov: 60 }}
           dpr={[1, 2]}
           gl={{ antialias: true }}
           shadows
         >
           <SceneManager />
           <Lights />
           <SharedAssets />
           {/* Environment and post-processing effects */}
           <EffectComposer>
             <Bloom 
               intensity={0.5} 
               luminanceThreshold={0.8} 
               luminanceSmoothing={0.8} 
             />
           </EffectComposer>
         </Canvas>
         
         {/* DOM Overlay Layers */}
         <HUD />
         <ModalLayer />
         {children}
       </div>
     )
   }
   ```

3. **Orb Component**
   ```jsx
   // Orb.tsx
   function Orb({ state = 'idle', position = [0, 0, 0] }) {
     const orbRef = useRef()
     const { color, pulseIntensity } = useOrbState(state)
     
     useFrame((state, delta) => {
       // Breathing animation
       orbRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime) * 0.05
       
       // Color transitions
       orbRef.current.material.emissive.lerp(color, delta * 2)
     })
     
     return (
       <group position={position}>
         <mesh ref={orbRef}>
           <sphereGeometry args={[0.5, 64, 64]} />
           <meshStandardMaterial 
             color={color}
             emissive={color}
             emissiveIntensity={pulseIntensity}
             metalness={0.2}
             roughness={0.5}
             transparent
             opacity={0.9}
           />
         </mesh>
         {/* Outer glow effect */}
         <OrbGlow intensity={pulseIntensity} />
       </group>
     )
   }
   ```

### 8.2 Performance Optimization

- **Code Splitting**: Dynamic imports for scenes and heavy components
- **Asset Preloading**: Texture atlas, model compression, and preloading
- **Selective Rendering**: useMemo, memo, and React Three Fiber's performance optimizations
- **Worker Threads**: Offload heavy calculations to Web Workers
- **Device Detection**: Adaptive rendering based on device capabilities
- **GPU Instancing**: For multiple similar objects in the GraphScene

### 8.3 Accessibility

- **Screen Reader Support**: ARIA labels and roles for all interactive elements
- **Keyboard Navigation**: Complete keyboard control with focus management
- **Reduced Motion**: Alternative transitions for users with motion sensitivity
- **Alternative Text Views**: Text-based alternatives to 3D visualizations
- **Color Contrast**: Meeting WCAG AA standards for all text elements

### 8.4 Mobile Optimizations

- **Touch-First Design**: All interactions optimized for touch input
- **Progressive Enhancement**: Simplified 3D effects for lower-powered devices
- **Responsive Layouts**: Fluid adaptation to different screen sizes
- **Offline Support**: Progressive Web App capabilities with local storage
- **Battery Awareness**: Reduced animation and effects in low-power mode

### 8.5 Backend Integration

- **GraphQL API**: For efficient data fetching and mutations
- **Real-time Updates**: WebSockets for live updates to the knowledge graph
- **Caching Strategy**: Apollo Client caching for performance
- **Error Handling**: Graceful degradation with informative user feedback
- **Authentication**: Secure JWT-based authentication and authorization 

## 9. Conclusion & Implementation Roadmap

### 9.1 Key Implementation Priorities

The development of 2dots1line should follow these priority areas:

1. **Core Canvas Infrastructure**: Establish the fundamental 3D rendering pipeline with scene management
2. **Basic Orb Implementation**: Create the central visual presence with core state changes
3. **Foundational UI Components**: Develop the glassmorphic card and modal system
4. **Scene Development**: Implement the three main scenes (CloudScene, AscensionScene, GraphScene)
5. **Interaction Layer**: Connect user inputs to visual feedback across all layers
6. **Performance Optimization**: Ensure smooth experience across device types
7. **Accessibility Refinement**: Make all features accessible to diverse users

### 9.2 Engineering Recommendations

1. **Component Architecture**: Use a modular architecture with clear separation of concerns:
   - 3D Canvas Layer ↔ DOM UI Layer ↔ Application Logic
   - Abstract complex 3D operations behind intuitive APIs

2. **State Management Strategy**:
   - Zustand for application state with atomic updates
   - React Context for theme and UI preferences
   - Local component state for ephemeral UI interactions

3. **Testing Approach**:
   - Unit tests for logic components
   - Visual regression tests for UI elements
   - Performance benchmark tests for 3D elements

4. **Build Process**:
   - Next.js for SSR and optimized production builds
   - Module bundling optimization for 3D assets
   - Progressive loading strategy for mobile experiences

### 9.3 Future Explorations

Beyond the core implementation, these areas offer compelling opportunities:

1. **Enhanced Personalization**: Adaptive UI based on usage patterns and preferences
2. **Advanced Physics**: More natural motion and interactions in the 3D spaces
3. **Audio Layer**: Ambient soundscapes that enhance the emotional experience
4. **Collaborative Features**: Shared spaces and connection between users' Inner Cosmos
5. **ML-Enhanced Interactions**: Using machine learning to predict and enhance user interactions

### 9.4 Final Vision

2dots1line represents a new paradigm in personal growth applications—one where the interface itself becomes a reflection of the user's inner journey. By merging beautiful design with meaningful interaction, we create not just a tool, but a companion for self-discovery. The layered architecture of 3D canvas, 2D modals, and the ever-present Orb creates a space that feels both expansive and intimate, technical and emotional.

The implementation of this design should always prioritize emotional resonance and user agency, ensuring that technology serves human growth rather than dictating it. As development progresses, maintaining the balance between technical excellence and emotional intelligence will be paramount. 