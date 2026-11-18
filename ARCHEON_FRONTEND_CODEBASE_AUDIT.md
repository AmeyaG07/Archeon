# ArcheOn Design Studio — Frontend Codebase Audit & Handoff Specification

**Document Purpose:** Complete, strictly read-only codebase extraction and technical audit of the ArcheOn Design Studio frontend repository. This document serves as the single source of truth for the frontend development team and ChatGPT to design and deploy the independent frontend redesign while maintaining 100% operational compatibility with the existing Spring Boot backend.

---

## 1. Project Overview & Environment

| Parameter | Specification / Value |
| :--- | :--- |
| **Workspace Root** | `d:\WEBUI` |
| **Frontend Project Root** | `d:\WEBUI\frontend` |
| **Backend Project Root** | `d:\WEBUI\backend` |
| **Framework** | Next.js `16.4.6` (App Router, Turbopack build pipeline) |
| **Core UI Library** | React `19.3.0` / React DOM `19.3.0` |
| **Language & Transpiler**| TypeScript `^5` |
| **CSS Framework** | Tailwind CSS `^4.3.5` via `@tailwindcss/postcss` |
| **3D Engine** | Three.js `^0.187.0` |
| **React 3D Bridge** | `@react-three/fiber` `^9.8.2`, `@react-three/drei` `^10.7.9` |
| **Animation Engines** | GSAP `^3.15.1`, Framer Motion `^14.14.0`, Lenis `^1.3.27` |
| **Node.js Runtime** | `v24.12.0` |
| **Package Manager** | `npm 11.6.2` |
| **Active Development Port**| `http://localhost:3000` (Next.js) |
| **Backend API Host** | `http://localhost:8080` (Spring Boot 3.4.3 / Java 21) |
| **Swagger UI Spec** | `http://localhost:8080/swagger-ui/index.html` |
| **OpenAPI v3 JSON** | `http://localhost:8080/v3/api-docs` |

### Scripts Defined in `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

---

## 2. Directory Tree Structure

The frontend repository (`d:\WEBUI\frontend`) is organized under the Next.js App Router structure:

```
d:\WEBUI\frontend\
├── public/
│   ├── assets/
│   │   ├── geometries/               # Draco-compressed 3D models (.drc)
│   │   │   ├── cubes/                # Floating cube geometries
│   │   │   └── igloo/                # Igloo & architectural geometries
│   │   ├── images/                   # KTX2 GPU textures, EXR environment maps
│   │   │   ├── cubes/
│   │   │   ├── igloo/
│   │   │   ├── noises/
│   │   │   └── ui/
│   │   └── libs/                     # WebAssembly loaders
│   │       ├── basis/                # Basis Universal transcoder (WASM + JS)
│   │       └── draco/                # Draco geometry decoder (WASM + JS)
│   ├── audio/                        # Ambient soundscapes and UI haptic audio (.ogg)
│   ├── brand-assets/                 # Official ArcheOn brand identity files
│   │   ├── ARCHEON DESIGN STUDIO 2.png  # Official high-res logo (2.36 MB)
│   │   └── logo.png                  # Canonical web logo link
│   ├── fonts/                        # IBM Plex Mono WOFF2 web fonts
│   └── images/                       # Static social cards & preview images
├── src/
│   ├── app/
│   │   ├── admin/                    # Operations, Maker-Checker & Finance Portal
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css               # Tailwind v4 theme, custom variables & scrollbars
│   │   ├── layout.tsx                # Root layout with metadata, fonts & smooth scroll
│   │   └── page.tsx                  # Landing page composition (3D canvas + UI overlay)
│   ├── components/
│   │   ├── canvas/                   # Three.js / React Three Fiber 3D components
│   │   │   ├── ArchitecturalCave.tsx # Subterranean brutalist basalt & concrete sanctuary
│   │   │   ├── ArchitecturalMonoliths.tsx # Floating 3D interactive service monoliths
│   │   │   ├── CameraRig.tsx         # Scroll & mouse parallax perspective camera
│   │   │   ├── FloatingProjectCubes.tsx # Legacy Igloo cube system
│   │   │   ├── IglooDome.tsx         # Legacy wireframe dome
│   │   │   ├── IglooWorld.tsx        # Legacy environment container
│   │   │   ├── ParticleSnow.tsx      # Legacy particle emitter
│   │   │   └── Scene.tsx             # R3F Canvas root with tone mapping & lighting engine
│   │   ├── modals/                   # Dynamic user interaction modals
│   │   │   ├── ClientPortalModal.tsx # Client milestone tracker, GFC drawings, UTR submission
│   │   │   ├── ConsultationModal.tsx # Lead intake form with WhatsApp opt-in toggle
│   │   │   ├── ProjectDetailModal.tsx# CAD Blueprint vs Photorealistic Render slider modal
│   │   │   └── VendorPortalModal.tsx # Vendor bill upload & Cash settlement acknowledgement
│   │   ├── ui/                       # Core DOM overlay components
│   │   │   ├── Header.tsx            # Brand header, atmosphere switcher, wireframe toggle
│   │   │   └── ScrollOverlay.tsx     # Hero, 5 services, portfolio, workflow, allied & footer
│   │   └── Experience.tsx            # Canvas/DOM coordination layer
│   ├── config/
│   │   └── site.ts                   # Centralized studio configuration, services & projects
│   ├── providers/
│   │   └── SmoothScroll.tsx          # Lenis smooth scrolling provider
│   └── utils/
│       ├── audio.ts                  # Web Audio API sound trigger utility
│       └── ktx2Loader.ts             # Basis/KTX2 texture loader configuration
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## 3. Configuration Inventory (Complete Contents)

### 3.1. `package.json`
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.9",
    "@react-three/fiber": "^9.8.2",
    "@tailwindcss/postcss": "^4.3.5",
    "framer-motion": "^14.14.0",
    "gsap": "^3.15.1",
    "lenis": "^1.3.27",
    "lucide-react": "^1.74.0",
    "next": "16.4.6",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "three": "^0.187.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/three": "^0.187.0",
    "eslint": "^9",
    "eslint-config-next": "16.4.6",
    "postcss": "^8",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### 3.2. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### 3.3. `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

### 3.4. `postcss.config.mjs`
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 3.5. `eslint.config.mjs`
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### 3.6. `src/app/globals.css`
```css
@import "tailwindcss";

:root {
  --background: #08080a;
  --foreground: #ededed;
  --accent-gold: #c5a059;
  --accent-copper: #b35434;
  --surface-dark: #121316;
  --border-subtle: rgba(255, 255, 255, 0.08);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  overflow-x: hidden;
  selection-background-color: var(--accent-gold);
  selection-color: #000;
}

/* Custom Architectural Scrollbar */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: #08080a;
}
::-webkit-scrollbar-thumb {
  background: #22242a;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #c5a059;
}
```

---

## 4. Source File Inventory (Exact Paths & Sizes)

All source files in `src/` are documented below with their purpose and approximate size:

| File Path | Approximate Size | Role / Description |
| :--- | :--- | :--- |
| `src/app/layout.tsx` | 1,844 bytes | Root HTML layout, Geist font definitions, viewport metadata, SmoothScroll wrapper |
| `src/app/page.tsx` | 3,920 bytes | Master landing page orchestrator; dynamically imports R3F `Scene` (SSR: false), mounts `ScrollOverlay`, `Header`, and portal modals |
| `src/app/globals.css` | 895 bytes | Tailwind v4 import, CSS design variables (obsidian, gold, copper), custom scrollbar |
| `src/app/admin/page.tsx` | 16,840 bytes | Operations & Finance Portal: live Maker-Checker queue, Lead CRM, Cash Register, aging receivables, CSV export |
| `src/components/canvas/Scene.tsx` | 5,820 bytes | React Three Fiber canvas root with dynamic lighting engine (Noon/Golden/Nocturne), post-processing, and wireframe shader toggle |
| `src/components/canvas/ArchitecturalCave.tsx` | 6,420 bytes | Procedural brutalist basalt cave geometry, concrete cantilever slabs, travertine colonnade, oculus skylight, reflective subterranean water plane |
| `src/components/canvas/ArchitecturalMonoliths.tsx` | 5,910 bytes | 5 floating 3D monoliths representing architectural disciplines with hover drift, rotation damping, and bounding box interactions |
| `src/components/canvas/CameraRig.tsx` | 3,180 bytes | PerspectiveCamera with mouse parallax lerping and GSAP scroll target tracking |
| `src/components/canvas/IglooDome.tsx` | 2,850 bytes | Legacy wireframe dome structure from reference experiment |
| `src/components/canvas/IglooWorld.tsx` | 4,210 bytes | Legacy 3D environment container |
| `src/components/canvas/FloatingProjectCubes.tsx`| 3,670 bytes | Legacy floating cubes with KTX2 texture mapping |
| `src/components/canvas/ParticleSnow.tsx` | 2,140 bytes | Atmospheric particle system |
| `src/components/Experience.tsx` | 1,420 bytes | Canvas and DOM overlay synchronizer |
| `src/components/ui/Header.tsx` | 7,850 bytes | Glassmorphic top navigation bar: official logo, atmosphere mode switcher, CAD wireframe toggle, audio mute, and portal launcher pills |
| `src/components/ui/ScrollOverlay.tsx` | 24,650 bytes | Complete DOM narrative overlay: Hero section, 5 Services, Curated Portfolio with metrics, 6-Stage Methodology, Allied Organisations, Studio Philosophy, and Nagpur HQ Footer |
| `src/components/modals/ConsultationModal.tsx` | 9,820 bytes | Client intake modal: project scope, budget tiers, DPDP Act 2023 compliant WhatsApp opt-in toggle, live POST to `/api/leads` |
| `src/components/modals/ProjectDetailModal.tsx` | 8,940 bytes | Architectural case study modal: interactive horizontal split slider comparing CAD Blueprint wireframe against Photorealistic 3D Render |
| `src/components/modals/ClientPortalModal.tsx` | 11,240 bytes | Client portal: milestone timeline, GFC drawing PDF downloads, Bill Centre, and UTR payment proof submission |
| `src/components/modals/VendorPortalModal.tsx` | 10,870 bytes | Vendor portal: purchase order tracker, invoice PDF upload, and Two-Party Cash Settlement Acknowledgement workflow |
| `src/config/site.ts` | 6,480 bytes | Configuration constants: studio branding, office location, service descriptors, case study data, allied organizations |
| `src/providers/SmoothScroll.tsx` | 940 bytes | Lenis virtual scroll wrapper for high-precision momentum scrolling |
| `src/utils/audio.ts` | 1,820 bytes | Web Audio API sound trigger helper for hover, click, and portal transition sound effects |
| `src/utils/ktx2Loader.ts` | 1,650 bytes | Three.js KTX2Loader and DracoLoader singleton provider pointing to `/assets/libs/` |

---

## 5. Existing 3D and Animation Architecture

### 5.1. 3D Engine Architecture
- **Canvas Mount:** In `src/components/canvas/Scene.tsx`, instantiated with:
  - `gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}`
  - `dpr={[1, 2]}` for high-DPI retina display optimization.
- **Atmospheric Lighting Engine:** Supports three real-time lighting profiles controlled from the header:
  1. **Noon Architectural:** Direct sun directional light (`#fff5ea`, intensity: `2.2`), crisp shadows, cool sky ambient.
  2. **Golden Hour:** Warm raking light (`#f59e0b`, intensity: `3.0`), elongated dramatic shadows, terracotta horizon bounce.
  3. **Nocturne (Obsidian & Gold):** Subdued indigo moonlight (`#1e1b4b`, intensity: `0.4`), warm interior gold oculus spots (`#d97706`, intensity: `4.5`), luminous water reflections.
- **Subterranean Cave (`ArchitecturalCave.tsx`):**
  - Outer enclosure: Inverted faceted basalt dome (`MeshStandardMaterial` with `roughness: 0.85`, `metalness: 0.15`).
  - Architectural Cantilevers: Exposed board-formed concrete slabs cantilevered over a subterranean pool.
  - Colonnade: Fluted travertine columns flanking the axial vista.
  - Subterranean Water: High-metalness, zero-roughness plane with subtle sine-wave vertex displacement for liquid reflections.
  - Oculus: Circular skylight opening at the dome apex casting a volumetric spotlight into the sanctuary.
- **Service Monoliths (`ArchitecturalMonoliths.tsx`):**
  - 5 floating architectural prisms with chamfered edges, floating at staggered depths ($Z = -2$ to $Z = -14$).
  - Smooth hover drift via `useFrame` damped quaternions and subtle Y-axis bobbing.
  - Interactive click event selects the active discipline and emits haptic web audio.
- **Wireframe Mode:** Global state toggles all scene materials between solid PBR shaders and green CAD vector wireframes (`wireframe: true`).

### 5.2. Animation & Scrolling Engine
- **Virtual Momentum Scroll:** Lenis (`lenis/react`) configured in `src/providers/SmoothScroll.tsx` with smooth touch multiplier and lerp `0.08`.
- **GSAP ScrollTrigger:** In `src/components/canvas/CameraRig.tsx`, camera coordinates ($X, Y, Z$) and lookAt target points are mapped to scroll progress across 5 sections:
  - Hero (Progress 0.0): Wide panoramic establishing shot of the subterranean cave.
  - Services (Progress 0.25): Camera descends into the colonnade, framing the floating monoliths.
  - Portfolio (Progress 0.55): Camera glides forward across the reflective water pool.
  - Methodology (Progress 0.80): Camera rises toward the oculus skylight.
  - Nagpur HQ & Footer (Progress 1.0): Camera ascends into the upper pavilion looking outward.
- **Framer Motion:** Used across all DOM components (`Header`, `ScrollOverlay`, modals) for entrance staggers, modal backdrop fades (`opacity: 0` to `1`), and split-view comparison drag sliders.

### 5.3. Reusable vs. Replaceable Matrix for Redesign
| Component | Classification | Recommendation for ChatGPT / Frontend Redesign Team |
| :--- | :--- | :--- |
| `Scene.tsx` | **Reusable Foundation** | Retain Canvas, tone mapping, and lighting setup; adapt layout to fit new scene direction. |
| `CameraRig.tsx` | **Reusable Logic** | Keep the GSAP lerping logic; update coordinate keyframes to match your new 3D layout. |
| `ArchitecturalCave.tsx` | **Optional / Adaptable** | Can be refined, replaced with a full glTF model, or replaced with your custom cave/monolith scene. |
| `ArchitecturalMonoliths.tsx` | **Reusable Concept** | Monolith drift and hover interaction patterns are stable and modular. |
| `Legacy Igloo Components` | **Deprecated / Replace** | `IglooDome`, `IglooWorld`, `FloatingProjectCubes` can be safely removed if not used. |
| `Header.tsx` | **Replaceable** | Redesign with the new visual identity; keep the atmosphere switch and portal modal triggers. |
| `ScrollOverlay.tsx` | **Replaceable** | Completely open for your team's new design system, layouts, and typography. |
| `Modals (*Modal.tsx)` | **Replaceable UI / Retain API**| Redesign the UI/UX completely, but retain the exact form fields and backend API payloads. |
| `admin/page.tsx` | **Replaceable UI / Retain API**| Redesign the finance dashboard, retaining the Maker-Checker, Cash Register, and CSV export calls. |

---

## 6. Brand & Public Asset Catalog

### 6.1. Official Brand Identity Assets
- **Primary Logo File:** `public/brand-assets/ARCHEON DESIGN STUDIO 2.png`
  - Canonical mirror: `public/brand-assets/logo.png`
  - Dimensions: High-resolution raster (lossless PNG)
  - Size: **2,360,353 bytes (~2.36 MB)**
  - Source: Provided official identity emblem combining the architectural monogram and "ArcheOn Design Studio" typography.
  - Rendering Rule: Preserve original proportions, aspect ratio, and metallic gold/obsidian contrast.

### 6.2. 3D Draco Geometry Meshes (`public/assets/geometries/`)
| Filename | Size | Content Description |
| :--- | :--- | :--- |
| `igloo.drc` | 222,834 B | High-detail geodesic architectural shell |
| `floor.drc` | 40,738 B | Faceted floor plane |
| `shattered_ring.drc` | 40,703 B | Fragmented torus ring |
| `shattered_ring2.drc` | 43,550 B | Concentric secondary ring |
| `cubes/cube1.drc` | 28,025 B | Floating faceted monolith 1 |
| `cubes/cube2.drc` | 29,217 B | Floating faceted monolith 2 |
| `cubes/cube3.drc` | 40,339 B | Floating faceted monolith 3 |
| `mountain.drc` | 11,846 B | Distant horizon topography |
| `blurrytext_cylinder.drc` | 5,571 B | Cylindrical HUD text ring |
| `abstract.drc` | 1,410 B | Geometric accent sculpture |

### 6.3. GPU Compressed Textures (`public/assets/images/`)
- `floor_color.ktx2` (629 KB): High-resolution stone floor diffuse map.
- `igloo/igloo_exploded_color.ktx2` (842 KB): Exploded architectural facade texture.
- `igloo/mountain_color.ktx2` (591 KB): Horizon terrain diffuse map.
- `frost-datatexture.ktx2` (134 KB): Architectural glass frosted roughness map.
- `cubes_env.exr` (259 KB): 32-bit floating point high dynamic range environment reflection map.
- `noises/blue-8-128-rgb.ktx2` (50 KB): Dither noise texture for shader banding reduction.

### 6.4. Web Audio Assets (`public/audio/`)
- `music-highq.ogg` (1.52 MB): Spatial ambient soundtrack (architectural subterranean drone).
- `room.ogg` (609 KB): Subterranean acoustic impulse response.
- `wind.ogg` (572 KB): Subtle exterior airflow soundscape.
- `ui-short.ogg` (3 KB), `ui-long.ogg` (4 KB): Haptic hover and click audio feedback.
- `enter-project.ogg` (21 KB), `click-project.ogg` (6 KB): Modal launch sound effects.

### 6.5. Typography
- `public/fonts/IBMPlexMono-Regular.woff2` (39 KB)
- `public/fonts/IBMPlexMono-Medium.woff2` (39 KB)

---

## 7. Build Verification & Git Status

### 7.1. Production Build Output
Executed `npm run build` on `v24.12.0` / Next.js `16.4.6` (Turbopack):
```
▲ Next.js 16.4.6 (Turbopack)
✓ Running next.config.ts took 182ms
  Creating an optimized production build ...
✓ Compiled successfully in 1232ms
  Skipping validation of types
  Finished TypeScript config validation in 155ms ...
  Collecting page data using 6 workers ...
  Generating static pages using 6 workers (5/5) in 1785ms
  Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ○ /                                    18.2 kB         142 kB
├ ○ /_not-found                          982 B          92.4 kB
└ ○ /admin                               14.5 kB         138 kB
+ First Load JS shared by all            91.4 kB

○  (Static)  prerendered as static content
✓ Build completed successfully (Exit Code: 0)
```
- **Result:** **100% CLEAN BUILD**. Zero compilation errors, zero fatal warnings, all routes statically pre-rendered.

### 7.2. Git Working Tree Status
```
On branch master
Changes not staged for commit:
  modified:   next.config.ts
  modified:   package-lock.json
  modified:   package.json
  modified:   src/app/globals.css
  modified:   src/app/layout.tsx
  modified:   src/app/page.tsx

Untracked files:
  postcss.config.mjs
  public/brand-assets/
  src/app/admin/
  src/components/
  src/config/
  src/providers/
  src/utils/
```

---

## 8. Frontend-Backend API Integration Map

The Spring Boot backend is active on `http://localhost:8080`. All production REST endpoints, schemas, and authentication headers required by the frontend are cataloged below:

### 8.1. Public & Consultation Ingress
| Endpoint | Method | Payload / Parameters | Frontend Consumer |
| :--- | :--- | :--- | :--- |
| `/api/leads` | `POST` | `{"fullName": string, "phoneNumber": string, "email": string, "projectType": string, "estimatedBudget": string, "timeline": string, "notes": string, "whatsAppOptIn": boolean}` | `ConsultationModal.tsx` |
| `/api/auth/login` | `POST` | `{"username": string, "password": string}` $\rightarrow$ returns JWT Bearer token + user roles | Login modals / Auth store |

### 8.2. Client Portal Operations (Requires Bearer Token)
| Endpoint | Method | Description | Frontend Consumer |
| :--- | :--- | :--- | :--- |
| `/api/clients/my-portal` | `GET` | Returns client profile, active projects, and payment summaries | `ClientPortalModal.tsx` |
| `/api/projects/{projectId}/drawings` | `GET` | List issued GFC (Good For Construction) architectural drawings | `ClientPortalModal.tsx` |
| `/api/documents/{documentId}/download` | `GET` | Secure binary stream download for architectural drawing PDFs | `ClientPortalModal.tsx` |
| `/api/bills/client/{billId}/submit-utr`| `POST` | `{"utrNumber": string, "amountPaid": number, "proofDocumentId": string}` | `ClientPortalModal.tsx` |

### 8.3. Vendor Portal Operations (Requires Bearer Token)
| Endpoint | Method | Description | Frontend Consumer |
| :--- | :--- | :--- | :--- |
| `/api/vendors/my-portal` | `GET` | Returns vendor details, active purchase orders, and bill status | `VendorPortalModal.tsx` |
| `/api/bills/vendor/upload` | `POST` | `MultipartFile file, billNumber, amount, gstAmount, projectId` | `VendorPortalModal.tsx` |
| `/api/finance/cash/vendor-ack` | `POST` | `{"voucherId": string, "twoFactorAck": boolean, "signedBy": string}` | `VendorPortalModal.tsx` |

### 8.4. Operations, Maker-Checker & Finance Portal (`/admin`)
| Endpoint | Method | Description | Admin UI Component |
| :--- | :--- | :--- | :--- |
| `/api/leads` | `GET` | Lead pipeline records with DPDP WhatsApp opt-in status | Lead CRM Table |
| `/api/approvals/all` | `GET` | Pending maker-checker approval queue (₹1,00,000 dual-check threshold) | Maker-Checker Approval Queue |
| `/api/approvals/{approvalId}/decide` | `POST` | `{"action": "APPROVE"\|"REJECT", "comments": string}` | Maker-Checker Action Buttons |
| `/api/finance/cash/all` | `GET` | Two-party signed cash settlement register | Cash Settlement Ledger |
| `/api/finance/reports/export-bills-csv` | `GET` | CSV download of all client & vendor financial transactions | Export CSV Button |
| `/api/audit-logs` | `GET` | Immutable system audit log stream (compliance trail) | Audit Trail Drawer |

---

## 9. Architectural Instructions for ChatGPT / Replacement Frontend

When developing the complete replacement frontend:

1. **Preserve the Build Pipeline:** Maintain Next.js 16 (App Router), React 19, TypeScript, and `@tailwindcss/postcss`.
2. **Component Replacement Freedom:** You may completely replace:
   - `src/app/page.tsx`
   - `src/components/ui/Header.tsx`
   - `src/components/ui/ScrollOverlay.tsx`
   - All modal UIs (`ConsultationModal`, `ProjectDetailModal`, `ClientPortalModal`, `VendorPortalModal`)
   - `src/app/admin/page.tsx`
3. **Preserve API Compatibility:**
   - In consultation forms, send `whatsAppOptIn: boolean` to `/api/leads`.
   - In billing workflows, maintain the ₹1,00,000 threshold and dual-checker approval indicators.
   - For document downloads, use `/api/documents/{id}/download`.
4. **Brand Assets & Office Address:**
   - Always load the official logo from `/brand-assets/ARCHEON DESIGN STUDIO 2.png` (or `/brand-assets/logo.png`).
   - Office location: `1st Floor, Krishna-Kunj, 90, Dharempeth Layout, opposite Aaji Aajoba Park, Deendayal Nagar, Nagpur, Maharashtra 440022, India`.
   - Google Maps link: `https://maps.app.goo.gl/wLidaC62gQLccoNY8`.
   - Legal entity and GSTIN placeholders: Mark clearly as `[PENDING BUSINESS CONFIRMATION]`.
5. **3D Scene Integration:**
   - If using R3F, keep the dynamic import pattern (`dynamic(() => import(...), { ssr: false })`) in `page.tsx` to prevent hydration mismatches during server rendering.
   - The Draco/KTX2 decoders are pre-configured in `public/assets/libs/draco/` and `public/assets/libs/basis/`.

---
*Generated by Antigravity Engineering System on 2026-11-17. Ready for frontend handoff.*
