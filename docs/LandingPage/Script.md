
**Project Brief: 2dots1line V7 - Immersive Scroll-Driven Landing Page with User Authentication**

**1. Project Overview & Goal:**

The primary goal is to create a captivating, scroll-driven, single-page landing experience for the 2dots1line V7 product. This landing page will serve as an introduction to the product's core vision: helping users achieve deep self-discovery and personal growth by transforming their thoughts and memories into an interconnected "personal cosmos" guided by an AI companion, "Orb."

The landing page must be visually stunning, performant, and seamlessly guide the user through a narrative that explains the product's value. It must also include functional user **Sign Up** and **Login** capabilities to allow for early end-to-end testing of the user pipeline.

**2. Target Audience for this Landing Page:**

Potential early adopters, including individuals interested in personal growth, self-reflection, AI-assisted productivity, and users who appreciate sophisticated, immersive digital experiences. This includes AI-savvy users who may be skeptical of generic AI tools and are looking for unique value and control.

**3. Core Technologies & Monorepo Context:**

*   **Application:** This landing page will be built as a new route (e.g., `/welcome` or the root `/`) within the existing Next.js application located at `apps/web-app/src/app` in our Turborepo monorepo.
*   **Framework:** Next.js 15+ with React 19+ (App Router).
*   **Styling:** Tailwind CSS, strictly adhering to the design tokens defined in `apps/web-app/tailwind.config.ts`. Global styles and base component styles are in `apps/web-app/src/app/globals.css`.
*   **3D Rendering (for Orb):** React Three Fiber (R3F) / Three.js. The Orb component (`apps/web-app/src/components/orb/Orb.tsx`) and its layer (`OrbLayer.tsx`) already exist as stubs.
*   **Animation:** GSAP (GreenSock Animation Platform) with the ScrollTrigger plugin is the preferred library for scroll-driven animations and sequencing. Framer Motion can be used for component-level micro-interactions if suitable.
*   **State Management (Minimal for Landing Page, but for Orb/Modals):** Utilize existing Zustand stores (`ModalStore`, `OrbStore` located in `apps/web-app/src/stores/`) for controlling modal visibility and Orb state. A `UserStore` will manage authentication status.
*   **Assets:** Video files and images should be placed in `apps/web-app/public/videos/` and `apps/web-app/public/images/` respectively.

**4. Existing Relevant Files (Cursor MUST familiarize itself with these):**

```
apps/web-app/src/
├── app/
│   ├── globals.css       // CRITICAL: Global styles, Tailwind directives, V7 design system CSS classes (e.g., .glass-panel, .btn-primary)
│   ├── layout.tsx        // CRITICAL: Root layout, sets up 3-layer architecture (Canvas3D, HUDLayer, ModalLayer, OrbLayer)
│   └── page.tsx          // Current main app page (post-login home, landing page will be separate or replace this temporarily)
├── components/
│   ├── canvas/
│   │   └── Canvas3D.tsx   // Main R3F canvas host (may need slight modification to always be present for landing page background)
│   ├── hud/
│   │   └── HUDLayer.tsx     // CRITICAL: Exists, contains placeholder nav. Will need Sign Up/Login links.
│   ├── modal/
│   │   ├── CardGallery.tsx // Exists as stub, not primary for this landing page focus
│   │   ├── ChatInterface.tsx // Exists as stub, a version will be used by Orb
│   │   ├── Dashboard.tsx   // Exists as stub, not primary for this landing page focus
│   │   └── ModalLayer.tsx    // CRITICAL: Manages display of active modals
│   ├── orb/
│   │   ├── Orb.tsx         // CRITICAL: 3D Orb component stub
│   │   └── OrbLayer.tsx    // CRITICAL: R3F Canvas layer for the Orb
│   └── auth/              // NEW DIRECTORY: To be created for SignUpModal.tsx, LoginModal.tsx
└── stores/
    ├── ModalStore.ts     // CRITICAL: Zustand store for active modal management
    ├── OrbStore.ts       // CRITICAL: Zustand store for Orb state (visibility, emotion, etc.)
    ├── SceneStore.ts     // Zustand store for active 3D scene (might be used to control background video state)
    └── UserStore.ts      // CRITICAL (or create if basic stub): Zustand store for auth status & user data
```

**5. Detailed Landing Page Sections & Implementation Requirements:**

The landing page will be a single, continuous scrollable experience.

*   **Persistent UI Element (Top Right):**
    *   **Implementation:** Modify `apps/web-app/src/components/hud/HUDLayer.tsx`.
    *   Always display "Sign Up" and "Login" text links or minimalist buttons in the top-right corner of the viewport.
    *   These links should trigger the `SignUpModal` and `LoginModal` respectively using `useModalStore.setActiveModal()`.
    *   Once a user is logged in (handled by `UserStore`), these should change to "Dashboard" (linking to `/app/home` or similar) and "Logout."

*   **Section 1: Immersive Entry - "Life Moves Fast"**
    *   **Visuals:**
        *   **Background:** Fullscreen, high-quality, **continuously looping video** of a serene sunset cloud scene (e.g., `public/videos/cloud1.mp4`). The video plays at a constant speed, unaffected by user scrolling.
        *   No Orb visible initially.
    *   **Interaction & Content:**
        *   As the user scrolls down into this section:
            *   The following lines of text emerge sequentially (e.g., fade in and slightly up, one after the other) at the center of the screen, styled for readability against the video:
                1.  "Life moves fast."
                2.  "Memories fade,"
                3.  "insights get lost,"
                4.  "your best ideas feel disconnected"
            *   Use GSAP ScrollTrigger to time the appearance of each line based on scroll progress within this section.
    *   **Technical Notes:** Ensure video is optimized for web, auto-plays, is muted, and loops seamlessly. Text animation should be smooth.

*   **Section 2: Orb's Introduction - "Meet Orb"**
    *   **Visuals:**
        *   **Background:** The *same* sunset cloud scene looping video continues seamlessly from Section 1.
        *   **Orb:** As the user scrolls further into this section, the 3D Orb (from `Orb.tsx`) **gradually fades into view and settles in the bottom-left quadrant** of the screen.
        *   Orb should be in a gentle "breathing" and "pulsing" idle animation (this animation logic should be part of `Orb.tsx` and controlled via `OrbStore`'s `visualState`).
    *   **Interaction & Content:**
        *   As the Orb fully appears, the following text emerges (larger font than Section 1 text, fade in + slight scale up) at the center of the screen:
            *   "Meet Orb, your guide to a deeper understanding."
        *   Use GSAP ScrollTrigger for Orb appearance and text emergence.
        *   Control Orb visibility and initial state via `useOrbStore`.

*   **Section 3: Ascension & Orb's First Message - "Cultivate Your Inner World"**
    *   **Visuals:**
        *   **Background Video Transition (Scroll-Synced):**
            *   As the user scrolls into this section, the sunset cloud video background must **smoothly transition to an "ascension transition" video** (e.g., `public/videos/ascension_transition.mp4`). This video is approximately 5 seconds long.
            *   This ascension video starts with the cloud scene (matching the end of the previous video) and ends with the camera arriving at the beginning of a "GraphScene" (stars, nebulae).
            *   **Crucially, the playback of this ascension video MUST be directly synchronized with the user's scroll motion.** If the user scrolls fast, the video plays fast. If they scroll slow, it plays slow. If they stop scrolling, the video pauses. If they scroll back up, the video plays in reverse. Use GSAP ScrollTrigger's `scrub` property for this.
    *   **Interaction & Content:**
        *   **Orb's Action:** When the ascension video playback reaches approximately its 2-second mark (timed with scroll):
            *   The Orb (already visible from Section 2) should transition its `visualState` (via `OrbStore`) to "speaking" or "emitting."
            *   A **2D glassmorphism modal, styled like a chat bubble emanating from or near the Orb**, appears. This can be a new component `OrbChatBubble.tsx`.
            *   This chat bubble displays the text: "I help you capture, connect, and cultivate your inner world."
        *   Use GSAP ScrollTrigger to time the Orb state change and chat bubble appearance.

*   **Section 4: Interstellar Journey & Deeper Promise - "Discover & Grow"**
    *   **Visuals:**
        *   **Background Video Transition (Scroll-Synced):**
            *   As the user scrolls past the end of the ascension video, the background transitions to a new looping video: an **"interstellar travel scene"** (e.g., `public/videos/interstellar_travel_loop.mp4`).
            *   This scene should show an immersive journey among stars, with distant stars approaching and then passing behind/around the camera.
            *   The **forward motion/speed of travel in this video MUST be linked to the user's scrolling speed** (again, use GSAP ScrollTrigger `scrub`).
    *   **Interaction & Content:**
        *   The Orb's chat bubble (from Section 3) updates its message (or a new bubble appears) to:
            *   "Discover profound self-understanding, foster growth, and bring your unique wisdom to life."
        *   This message change should be triggered by scroll position.
    *   **Sub-Section 4.5: Graph Scene Tease**
        *   **Background Video Transition (Scroll-Synced or Auto-Loop):**
            *   As the user scrolls further, the interstellar travel video transitions to a looping video showcasing the **GraphScene** (e.g., `public/videos/graph_scene_loop.mp4`). This video should depict nodes (Memories, Concepts, Insights with distinct visual treatments) and luminous connections, with the entire graph gently rotating or evolving in 3D space.
        *   **Interaction & Content:**
            *   Orb's chat bubble updates to:
                *   "Your life's experiences, thoughts, and learnings, beautifully mapped and interconnected."

*   **Section 5: Co-Creation & Growth Framework - "Sculpt & Evolve"**
    *   **Visuals:**
        *   **Background Video (Scroll-Synced or Auto-Loop):**
            *   Transition to a "demo scene" video (e.g., `public/videos/artifact_demo_loop.mp4`). This video should visually depict:
                1.  A stylized representation of the personal cosmic graph.
                2.  Selected nodes lighting up.
                3.  Luminous lines connecting these lighted-up nodes.
                4.  These lines merging to form a new "gem-like" object (representing an artifact) appearing on the graph.
    *   **Interaction & Content:**
        *   Orb's chat bubble updates with new messages (can appear sequentially with scroll):
            1.  "Grow in understanding, take meaningful action, and express your unique voice – for yourself, and for the world."
            2.  "Co-create meaningful artifacts – essays, plans, personal philosophies – from the rich landscape of your own authenticated knowledge."
        *   Simultaneously, or slightly offset by scroll, **two `glass-panel` cards appear on screen:**
            *   **Card 1:** Text "Understanding Your Inner Landscape" (Know Self). Beside it, a small, elegant visual/animation of the Orb gently illuminating a part of a stylized GraphScene.
            *   **Card 2:** Text "Bringing Your Ideas to the World" (Show World). Beside it, a small, elegant visual/animation of an artifact ("Treasure") being formed.
            *   These cards use accent colors from the design system.

*   **Section 6: Call to Action - "Begin Your Journey"**
    *   **Visuals:**
        *   **Background Video Transition:** The background smoothly transitions back to the initial **sunset cloud scene looping video** (`public/videos/sunset_clouds_loop.mp4`).
    *   **Interaction & Content:**
        *   A prominent 2D modal (`glass-panel`) appears, dominating the center of the screen.
        *   **Content of Modal:**
            *   Headline: "Begin Your Journey of Self-Discovery"
            *   Primary CTA Button: "Join Waitlist" (triggers `SignUpModal`).
            *   Secondary Link: "Already have access? Login" (triggers `LoginModal`).
            *   This modal will contain the actual **Sign Up / Login forms** (components `SignUpModal.tsx` and `LoginModal.tsx` to be created in `apps/web-app/src/components/auth/`). These forms should handle input, client-side validation, and (eventually) API calls to the backend. For now, submission can `console.log` data.
    *   **Technical Notes:** This section should be the natural end of the scroll.

**6. General Implementation Notes for Cursor:**

*   **Responsive Design:** All sections and elements must be fully responsive for desktop, tablet, and mobile.
*   **Performance:** Prioritize smooth animations and fast load times. Optimize videos and images. Lazy load assets where appropriate.
*   **Accessibility:** While the experience is highly visual, ensure text is legible, keyboard navigation is considered, and ARIA attributes are used where appropriate.
*   **Error Handling (Client-Side):** Basic error handling for form submissions in auth modals.
*   **Code Structure:** Maintain clean, modular code. Place new page-specific components within the landing page's route directory structure (e.g., `apps/web-app/src/app/welcome/components/`). Reusable elements like `OrbChatBubble.tsx` could go into `apps/web-app/src/components/common/` or similar.
*   **Styling:** All styling via Tailwind CSS and `globals.css` design tokens.

**7. Success Criteria for the Entire Landing Page:**

*   The landing page is a single, smoothly scrollable experience.
*   All 6 sections are implemented with their specified content, visuals, and scroll-triggered animations.
*   Video backgrounds (looping and scroll-synced) function correctly and transition smoothly.
*   The 3D Orb appears and changes state as described.
*   Orb chat bubbles appear and update with the correct messages at the specified scroll points.
*   Glassmorphic modals and cards are styled correctly and appear as intended.
*   Sign Up and Login links in the persistent HUD and the final CTA section correctly open their respective functional (UI-wise) modals.
*   The page is responsive and performs well on modern desktop browsers.
*   The overall experience feels immersive, evocative, and clearly communicates the 2dots1line vision.

This brief provides a comprehensive roadmap. Please proceed by implementing these sections iteratively, starting with Section 1. We can review and refine after each major section is scaffolded. Focus on the GSAP ScrollTrigger integration for the scroll-synced video playback and animations.