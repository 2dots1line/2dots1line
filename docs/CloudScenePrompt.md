

**Revised Task & Prompt for Cursor (Incorporating ChatGPT's Research):**

**Task LP1.T4.P1 (REVISED & EXPANDED): CloudScene - Polished Volumetric Cloud Layers for Landing Page Hero**

*   **Overall Artistic Vision (Reiterate):**
    *   Target: "Fabulous Cartier Journey" cloudscape – vastness, depth, soft/ethereal light, dreamlike atmosphere, subtle animation, golden hour/luminous dawn palette (soft golds/peaches like `#FFDA82`, `#EB6A8C`, `#DE956B`; muted lavender shadows like `#6E5A7B`; light peachy-cream fog like `#F7E7CE`).

*   **Prompt for Cursor:**
    ```
    "We are creating a polished, multi-layered, volumetric CloudScene for the landing page hero background in `apps/web-app/src/components/canvas/CloudScene.tsx`, using React Three Fiber (R3F) and GLSL shaders. This scene must be performant for modern desktops and evoke the aesthetic of the 'Fabulous Cartier Journey'.

    **1. Cloud Rendering Technique (Primary Approach - Ray Marching):**
        *   Implement volumetric clouds using a **ray-marching approach within a GLSL shader** (`cloudMaterial.vert`, `cloudMaterial.frag`).
        *   Reference techniques from Faraz Shaikh’s `three-volumetric-clouds` (Guerrilla Games' methods) or Anderson Mancini's R3F adaptation of Three.js volumetric clouds.
        *   The goal is true volumetric appearance with deep parallax.

    **2. Noise-Based Cloud Density & Shape:**
        *   Utilize **Perlin-Worley noise** (or a combination of Perlin FBM and Worley) to define cloud density.
        *   The noise should be **3D and tileable**.
            *   **Option A (Preferred for Quality):** If feasible within WebGL2 limits and landing page performance, attempt to load or generate a small (e.g., 128x128x128) tileable 3D noise texture (e.g., from a `.ktx` or `.dds` file if we prepare one, or programmatically if a simple method exists). Reference Guerrilla's Nubis system idea of repeating a smaller 3D noise at different scales in-shader for detail.
            *   **Option B (Fallback if 3D Texture is problematic):** Implement the technique of packing slices of 3D noise into a 2D texture atlas (as described by Maxime Heckel or thefrontdev) and reconstruct 3D noise sampling in the shader. Use `DataTexture` for this.
        *   The shader should sample this noise to create fluffy, evolving cloud formations. Refer to Guerrero et al.’s Shadertoy (3dVXDc) for Perlin-Worley generation ideas if needed.

    **3. Lighting Model & Scattering:**
        *   Implement a **Henyey-Greenstein phase function** in the cloud shader for anisotropic light scattering (g-factor ~0.7 to 0.8 for forward scattering). Reference Maxime Heckel or Sebastien Hillaire's work.
        *   The primary light source will be a directional light (soft sun) with a warm gold color (e.g., `#FFDA82`).
        *   Incorporate ambient light using soft peach/gold tones (e.g., `#F7E7CE`).
        *   Cloud self-shadowing: Implement adaptive shadow ray marching (limit distance, reduce samples for optically thin parts).
        *   **God Rays (Crepuscular Rays):** If performant, integrate a post-processing effect for god rays. Consider using `react-postprocessing` library with a `GodRays` effect, or a custom radial blur pass. The `@takram/three-clouds` library's approach can be a reference.

    **4. Color, Atmosphere & Soft Edges:**
        *   **Cloud Colors:**
            *   Sunlit highlights: Soft luminous gold (e.g., `#FFDA82`).
            *   Cloud body: Peachy pinks/warm apricots (e.g., `#EB6A8C`, `#DE956B`).
            *   Shadowed areas/undersides: Muted lavender-purple (e.g., `#6E5A7B`) or desaturated dawn colors.
        *   **Soft Edges:** Use `smoothstep` on the density field in the shader to achieve soft, feathered cloud boundaries.
        *   **Fog:** Implement scene fog (`THREE.FogExp2`) colored with a light peachy-cream (e.g., `#F7E7CE`) to blend distant clouds and enhance depth.

    **5. Subtle Animation & Evolution:**
        *   Animate clouds by treating time as a fourth noise dimension (e.g., `noise(x, y, z, time * speed)`) or by translating the noise sampling coordinates over time (`samplePos = p + vec3(windX, windY, windZ) * uTime`).
        *   The movement should be very slow and majestic.
        *   Consider morphing between two noise sets over a longer period to simulate cloud formation/dissipation if complexity allows.

    **6. Layering & Depth:**
        *   Ensure the ray-marching algorithm or scene setup creates a clear sense of multiple cloud layers at varying depths, producing noticeable parallax with subtle camera movements (which will be added later via scroll).

    **7. R3F Implementation Best Practices:**
        *   Use `<shaderMaterial>` for the custom cloud shaders.
        *   Manage uniforms effectively (e.g., `uTime`, `uCloudDensity`, `uLightDirection`, color uniforms) via React state/refs and update in `useFrame`.
        *   Use `useMemo` for expensive initializations (like noise textures if generated programmatically).
        *   The `CloudScene.tsx` component should be modular and accept props for dynamic control later (e.g., time of day affecting lighting).

    **8. Performance Optimization (Desktop Primary, Mobile Fallback Strategy):**
        *   Target smooth 45-60fps on mid-range desktops.
        *   Implement **adaptive ray-marching steps** (logarithmic depth distribution, early ray termination).
        *   Consider rendering clouds at a lower resolution and upscaling (if a good R3F-compatible upscaling technique like temporal upscaling can be found or implemented simply).
        *   Use **dithered sampling with blue noise** (provide a small, tileable blue noise texture, e.g., from Moments in Graphics, in `3d-assets/textures/noise/blue_noise_256.png`) to reduce banding artifacts when sample counts are low.
        *   Apply a gentle, edge-preserving **post-process blur (e.g., Kawase blur)** if dithering is prominent. This can be done with `react-postprocessing`.
        *   The component should allow for a "low quality" prop that significantly reduces raymarch steps, disables shadows, or simplifies noise for mobile fallback scenarios.

    Provide the complete updated code for `CloudScene.tsx`, new shader files (`cloud.vert`, `cloud.frag`), and any new utility functions for noise generation or sampling. List any new dependencies added (e.g., for post-processing).
    For initial testing, make the CloudScene the default active scene in `Canvas3D.tsx` by setting `useSceneStore.getState().setActiveScene('CloudScene')` in `HomePage.tsx`'s `useEffect`."
    ```

*   **Reference for Cursor (Reiterate):**
    *   Cartier Journey: [https://www.cartier.com/en-us/thefabulouscartierjourney.html](https://www.cartier.com/en-us/thefabulouscartierjourney.html)
    *   Mention key inspirations from ChatGPT's research: Faraz Shaikh's `three-volumetric-clouds`, Anderson Mancini's adaptation, Maxime Heckel's blog on Real-time Cloudscapes, Guerrilla Games' techniques (Perlin-Worley noise, Henyey-Greenstein).
*   **Assets to provide to Cursor (or have it generate placeholders):**
    *   Noise Textures:
        *   If we have pre-generated tileable 3D noise (e.g., `.ktx` format) or 2D noise atlas for slicing, specify paths in `3d-assets/textures/noise/`.
        *   If not, Cursor might need to implement a JS function to generate a basic procedural `DataTexture` for noise or use a simple flat noise texture as a starting point.
    *   Blue Noise Texture: `3d-assets/textures/noise/blue_noise_256.png` (Cursor will need to be told to assume this exists or use a fallback).
*   **Success Criteria (Reiterate & Enhance):**
    *   Renders a multi-layered, soft, volumetric cloudscape with convincing depth and parallax.
    *   Lighting and color achieve the desired ethereal golden hour/dawn aesthetic, with soft glows and dynamic shadows. Henyey-Greenstein scattering is evident.
    *   Clouds have soft edges and animate subtly.
    *   Fog enhances atmospheric depth.
    *   Performance is good on target desktops (45-60fps).
    *   Code is modular and uses R3F best practices.
    *   **Human Verification:** Critically compare to the Cartier Journey inspiration. Does it capture the *essence* of that visual quality and emotional impact? Does it use the specified color palette effectively?

**Incorporating Other ChatGPT Findings into the Broader Plan:**

*   **Plane Stacking / Drei `<Cloud>` (Fallback/Mobile):** If the full ray-marched volumetric clouds prove too heavy even after optimization, or for the mobile-specific fallback, the simpler plane-stacking method or Drei's `<Cloud>` component with our noise textures and color palette will be our go-to. This can be a separate task if needed.
*   **R3F + Scroll Interaction Demos (for LP2.T3):** The `r3f-scroll-rig` or Drei's `useScroll()` will be directly referenced when we implement the camera movement synchronized with scroll for the "Journey Inward" section.
*   **Shader Composition Libraries (glslify, shader-composer):** While we're asking Cursor to write GLSL directly for this core scene (to ensure fine-grained control), these libraries are excellent candidates for more experimental or rapidly prototyped shaders for *other* effects or scenes later in the main app.
*   **Node-Based Shader Editors (NodeToy):** This is more for human artists/developers to iterate quickly. We might use it offline to design a material and then translate the logic for Cursor.
*   **Atmospheric Sky Libraries (`@takram/three-atmosphere`, Drei `<Sky>`):** Useful for the skybox complementing the clouds. The `@takram` library is particularly interesting if it integrates well with their cloud solution (though ChatGPT noted it as a separate cloud library too, `@takram/three-clouds`).
*   **Debugging (Spector.js, Leva):** These are tools for *us* (human supervisors) to use when reviewing and refining Cursor's output, not for Cursor to implement directly.

**Components to Develop Outside Cursor (Reiterate - Human Art Direction is Key):**

*   **Final Artistic Polish:** Even with detailed prompts, the final "look and feel," the subtle balance of colors, light intensity, cloud density, animation speed – these will require human iteration and fine-tuning of shader parameters and scene composition. Cursor gets us 80-90% there with the code; the last 10-20% is art.
*   **Asset Creation/Curation:** If specific, high-quality, pre-baked 3D noise textures are needed, a human artist would typically create these using tools like Blender, Houdini, or specialized noise generation software.
*   **Complex Performance Bottlenecking:** If deep, unexpected performance issues arise, a human R3F expert might need to profile and debug.

This focused, art-directed approach for one scene should yield much better results and build the confidence we need. We're essentially using ChatGPT to gather the "art supplies" and "technique cookbook," and then we're directing Cursor as our highly skilled (but needing explicit instruction) "AI graphics programmer."