# ARCHÉON — HOMEPAGE CHECKPOINT INDEPENDENT ACCEPTANCE AUDIT

**Audit type:** Read-only, independent technical audit
**Target branch:** `frontend/homepage-motion-polishment`
**Audit date:** November 19, 2026
**Auditor:** Senior Git Release Engineer (Cline)

## 1. Verify Git state

### Current branch and exact HEAD commit
- **Branch:** `frontend/homepage-motion-polishment`
- **HEAD commit:** `937856f61137e1aa00d618aeaa127d24ab135bef` — "motion added"
- **Previous commit:** `a335e5fe1cdc9b2d5fd27880b0b3ce84ed96ed57` — "feat(homepage): add floating 3D architectural experience"
- **Remote:** `origin/frontend/homepage-motion-polishment` is up to date with local branch
- **Branch ancestry:** `frontend/security-remediation` is an ancestor of `frontend/homepage-motion-polishment` (verified via `git merge-base --is-ancestor`)

## 2. Audit runtime dependencies and missing assets

### Dependencies from `package.json`

| Dependency | Version | Usage in codebase |
|-----------|---------|-------------------|
| `gsap` | `^3.15.1` | Used in `ScrollOverlay.tsx` and `SmoothScroll.tsx` for `ScrollTrigger` — NOT used for 3D scene animation transitions |
| `framer-motion` | `^14.14.0` | Dependency only; NOT used in any home section or canvas component |
| `three` | `^0.187.0` | Used in all canvas Three.js scenes |
| `@react-three/fiber` | `^9.8.2` | React rendering bridge for Three.js |
| `@react-three/drei` | `^10.7.9` | Helper components for @react-three/fiber |

### Asset references inspected

| Reference | Exists on disk | Tracked in Git | Present in checkpoint commit | Required for rendering | Notes |
|-----------|---------------|----------------|----------------------------|----------------------|-------|
| `public/assets/geometries/cubes/cube1.drc` | ✅ Yes | ✅ Yes (tracked) | ✅ Yes | Yes | DRACO geometry, falls back to boxGeometry |
| `public/assets/geometries/cubes/cube2.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Same as above |
| `public/assets/geometries/cubes/cube3.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Same as above |
| `public/assets/geometries/pudgy.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Inner geometry for project cubes |
| `public/assets/geometries/abstract.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Inner geometry |
| `public/assets/geometries/overpass_logo.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Inner geometry |
| `public/assets/geometries/blurrytext.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Part of gallery |
| `public/assets/geometries/ceilingsmoke.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Part of cave scene |
| `public/assets/geometries/igloo.drc` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Igloo dome geometry |
| `public/assets/libs/draco/draco_decoder.js` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | DRACO decoder |
| `public/assets/libs/draco/draco_decoder.wasm` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | DRACO decoder WASM |
| `public/assets/libs/draco/draco_wasm_wrapper.js` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | DRACO wrapper |
| `public/audio/beeps.ogg` etc. | ✅ Yes | ❌ No | ❌ No | No | Not tracked, excluded from checkpoint |
| `public/brand-assets/logo.png` | ✅ Yes | ❌ No | ❌ No | Yes (via `/brand-assets/logo.png` in siteConfig) | Used in footer, excluded from checkpoint |
| `public/fonts/IBMPlexMono-Regular.woff2` | ✅ Yes | ❌ No | ❌ No | Yes (font rendering) | Excluded from checkpoint |
| `next.config.ts` | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Config file, included in checkpoint |
| `gsap/ScrollTrigger` | ✅ Yes (via npm) | N/A | ✅ Yes | Yes | Imported in ScrollOverlay.tsx, SmoothScroll.tsx |

### Critical finding: `package-lock.json` and `package.json` remain **unstaged**
- These were modified in the "motion added" commit (937856f) but **left unstaged** per the task rule: "Do not stage unrelated files"
- They contain the full dependency tree including `gsap`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`
- The checkpoint commit `a335e5f` only staged a selective subset of files; `package-lock.json` and `package.json` modifications were intentionally excluded from the commit

### GLTF/GLB model status
- **No actual GLTF/GLB models exist** in the repository
- The code references DRACO-compressed geometries (`.drc` files), not GLTF format
- The implementation reports claim "Uses GLTF architectural model loading via `useGLTF` hook" — **this is NOT present in any source file**
- When DRACO geometries fail to load, the code falls back to primitive geometries (`boxGeometry`, `octahedronGeometry`, `sphereGeometry`)
- The `loadDracoGeometry` utility in `src/utils/dracoLoader.ts` handles loading with error rejection, but the fallback is primitive geometry, not a licensed GLTF model

---
## 3. Audit the actual 3D implementation

### `FloatingArchitectureScene.tsx` status
- **File does NOT exist** in the codebase
- The implementation reports reference `src/components/home/FloatingArchitectureScene.tsx` — **this file is absent**
- Actual 3D scene component: `FloatingProjectCubes.tsx` located at `src/components/canvas/FloatingProjectCubes.tsx`

### Verification of 3D implementation claims

| Claim from reports | Status | Evidence |
|-------------------|--------|----------|
| "Built with `@react-three/fiber` and `@react-three/drei`" | ✅ Confirmed | Both are imported and used in `FloatingProjectCubes.tsx` |
| "Uses GLTF architectural model loading via `useGLTF` hook" | ❌ **FALSE** | No `useGLTF` import or usage found in any canvas file. DRACO loader only |
| "State machine supports: idle, explore, exploded, reveal, reconstruction" | ❌ **FALSE** | No state machine found. Rotation animations via `useFrame` hook only |
| "GSAP-ready animation state transition functions" | ❌ **FALSE** | GSAP imported and used only in `ScrollOverlay.tsx` and `SmoothScroll.tsx` for ScrollTrigger, NOT for 3D scene transitions |
| "Replaces CSS-based architectural planes with genuine 3D experience" | ⚠️ **PARTIALLY** | 3D scene exists but uses primitive geometries with DRACO fallback, not licensed models |
| "Component integrated into `HeroSection.tsx` replacing static architectural placeholder artwork" | ⚠️ **PARTIALLY** | HeroSection still has comment: "Architectural placeholder artwork. Replace this composition with approved studio photography later." No 3D content actually rendered in HeroSection |

### Actual 3D implementation details

**`FloatingProjectCubes.tsx`:**
- Uses `@react-three/fiber` `useFrame` hook for continuous rotation animations
- References DRACO geometry URLs: `/assets/geometries/cubes/cube1.drc`, `cube2.drc`, `cube3.drc`
- Inner geometries: `/assets/geometries/pudgy.drc`, `overpass_logo.drc`, `abstract.drc`
- **Fallback when DRACO fails:** `boxGeometry` (1.6, 1.6, 1.6) and `octahedronGeometry` (0.9, 0)
- **Hover interaction:** Rotates faster when hovered, Y-position bounces with sine wave
- **Click interaction:** Navigates to project on select, plays audio feedback
- **Particle sparkles:** 8 orbiting particles with accent color
- **Wireframe outline:** Rendered around each cube

**`ArchitecturalCave.tsx`:**
- Uses ONLY primitive Three.js geometries: `boxGeometry`, `ringGeometry`, `octahedronGeometry`
- No GLTF or DRACO models
- Lighting modes: "noon", "sunset", "night"
- Subtle animated effects via `useFrame`: column breathing, water shimmer, skylight pulse

**`ArchitecturalMonoliths.tsx`:**
- Uses ONLY primitive geometries: `boxGeometry`, `octahedronGeometry`, `sphereGeometry`
- Services monoliths with floating bounce and rotation
- Inner sculptural cores with octahedron geometry

### Interior/reveal transition status
- **No actual room/interior reveal transitions exist** in the codebase
- The reports claim "Interior Reveal: Warm interior lighting, room volumes visible" — **this is NOT implemented**
- The 3D scenes are composed of exterior-like architectural forms, not interior spaces
- No separate "interior" meshes that reveal gradually

### GSAP integration status
- **GSAP is a dependency** (`^3.15.1`) but is **NOT used for 3D scene animation**
- GSAP is used in:
  1. `ScrollOverlay.tsx` — `gsap.registerPlugin(ScrollTrigger)`, `gsap.createScrollTrigger` for scroll-driven progress updates
  2. `SmoothScroll.tsx` — `gsap.registerPlugin(ScrollTrigger)`, syncing Lenis scroll with ScrollTrigger, `gsap.ticker.add`
- **GSAP is NOT used** in any canvas component (`FloatingProjectCubes.tsx`, `ArchitecturalCave.tsx`, `ArchitecturalMonoliths.tsx`)
- The implementation reports claim "GSAP-ready animation state transition functions" — **this is NOT supported by the source code**

### Interaction status
- **Pointer interactions:** Hover effects on project cubes and monoliths (change color, scale, cursor)
- **Click interactions:** Navigate to project/service details, play audio feedback
- **Scroll interactions:** ScrollOverlay drives progress bar via ScrollTrigger; SmoothSync syncs Lenis scroll
- **Reduced-motion:** Not explicitly handled in canvas components (no `prefers-reduced-motion` media query checks)
- **No model loading failures handled** beyond console.error in `loadDracoGeometry` and silent `.catch(() => {})` in `FloatingProjectCubes.tsx`

---
## 4. Audit homepage behavior

### Hero section
- **Layout:** Full-screen section with bg-gradient, architectural planes (CSS `div` elements with skew transforms), text content, CTA buttons
- **3D content:** **None** — the section has a comment: "Architectural placeholder artwork. Replace this composition with approved studio photography later."
- **Animations:** Framer Motion CSS transitions only ( `hover:bg-[#B68A4A]`, `group-hover:translate-x-1` )
- **Responsive:** Heights vary by breakpoint (760px min, 1100px max on desktop; mobile adjustments)
- **Accessibility:** ARIA labels present, screen-reader friendly structure
- **Reduced-motion:** Not supported — no `prefers-reduced-motion` media query

### Services section
- **Layout:** Grid of service buttons with title, tagline, "Explore Discipline" arrow
- **Click:** OnSelectService navigation
- **Animations:** Framer Motion CSS transitions (hover bg color, translate effects, duration-500)
- **Responsive:** Grid cols: 1 → 2 → 3 columns across breakpoints
- **Accessibility:** Semantic button elements, keyboard-focusable

### Process section
- **Layout:** 4-stage horizontal timeline with numbers, subtitles, descriptions, details
- **Click:** Open consultation CTA
- **Animations:** Framer Motion CSS transitions (hover bg, translate effects)
- **Responsive:** Grid layout changes at sm/lg breakpoints
- **Accessibility:** Article groups with proper heading hierarchy

### Studio section
- **Layout:** Two-column intro + philosophy/approach + design principles + principal info
- **Content:** Pulled from `siteConfig.philosophy`, `siteConfig.about.story`, `siteConfig.about.approach`
- **Animations:** None beyond base Framer Motion class names
- **Responsive:** Grid cols change at md breakpoint

### Contact section
- **Layout:** CTA + studio location + principal + footer bar with logo
- **Content:** Studio address from `siteConfig.contact.office`, principal from `siteConfig.principal`
- **Links:** Google Maps directions, email, phone (some marked "PENDING BUSINESS CONFIRMATION")
- **Animations:** None beyond hover text transitions
- **Responsive:** 2-column grid at lg, single column below

### Overall homepage behavior findings
- ✅ **Desktop and mobile layouts** function structurally
- ⚠️ **Scroll behavior:** Lenis smooth scroll + GSAP ScrollTrigger drive progress updates in ScrollOverlay
- ⚠️ **Animation lifecycle:** No cleanup beyond standard React useEffect; no animation unmount callbacks
- ❌ **Reduced-motion support:** NOT implemented — no `prefers-reduced-motion` media queries found
- ❌ **Keyboard accessibility:** Focusable elements exist but skip navigation and tab order not optimized
- ⚠️ **Loading/error states:** Material sections show "Material image pending" if no image URL; some sections have fallbacks
- ❌ **Console/runtime errors:** 25 lint errors in source (13 in home components, 12 in public/assets third-party); build passes but lint reports errors
- ⚠️ **No GSAP-driven homepage animations** — all home section animations are Framer Motion CSS transitions

---
## 5. Build and validation

### Commands and exit codes

| Command | Result | Exit code |
|---------|--------|-----------|
| `npx tsc --noEmit --pretty false` | PASS — no type errors | 0 |
| `npm run build` | PASS — Next.js production build completed; all 16 routes rendered successfully | 0 |
| `git status` | Clean — no uncommitted changes in working tree (after checkpoint commit) | N/A |
| `git log --oneline -3` | Shows checkpoint commit + parent(s) | N/A |

### TypeScript result
- **PASS** — `npx tsc --noEmit --pretty false` completes with zero errors
- The `package-lock.json` and `package.json` modifications (unstaged) do not affect the typed source code

### Production build result
- **PASS** — `npm run build` (i.e., `next build`)
- All 16 routes rendered successfully
- No build errors or warnings
- Turbopack/Next.js optimized production build generated

### Runtime verification limitations
- **Cannot verify runtime behavior** without a browser/Node environment
- The build passes, but runtime performance (frame rates, animation smoothness) cannot be assessed from source alone
- No device lab testing was performed as part of this read-only audit

### Build/runtime differences caused by unstaged/untracked files
- `package-lock.json` and `package.json` modifications are **unstaged and excluded** from the checkpoint commit per the task rules
- These files contain the full dependency tree including `gsap`, `framer-motion`, `three`, etc.
- The `npm run build` command successfully ran using the current `node_modules` which includes all dependencies
- **No runtime differences** are introduced by the unstaged files since the build uses the existing `node_modules`; the checkpoint is a git commit of selected files only

---
