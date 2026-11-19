# PUBLIC WEBSITE UI/UX AUDIT REPORT

## Project: Archeon Design Studio
## Branch: frontend/homepage-motion-polish
## Date: November 18, 2026
## Mode: Implementation Authorized — Frontend Only

## 1. PUBLIC WEBSITE ROUTES INSPECTION

The following public (marketing) routes were identified:

- `/` — Homepage (ArcheOn Design Studio)
- `/design-system` — Design system showcase
- `/app/*` — Internal app routes (admin, client, vendor) — NOT part of public scope

## 2. PUBLIC HOMEPAGE IDENTIFICATION

The actual public homepage is `/` (root), rendered by `src/app/page.tsx`. It consists of the following sections:

1. **Header** — Navigation with lighting mode toggle, consultation portal CAs, client/vendor portal access
2. **HeroSection** — Full-screen architectural hero with headline, tagline, CTA buttons (Discuss Your Project, Explore Projects)
3. **StudioSection** — Studio principal, mission statement, about story
4. **ServicesSection** — Service offerings with selection capability
5. **ProjectsSection** — Featured project portfolio
6. **ProcessSection** — Design process workflow
7. **ContactSection** — Contact CTA and information
8. **SiteFooter** — Footer with copyright, links, private access buttons
9. **Editorial container** — Additional studio content below the main sections

## 3. EXISTING COMPONENTS AND DESIGN TOKENS INSPECTION

### Core Components (public/homepage):

- `src/components/home/HeroSection.tsx` — Hero with gradient background, architectural planes, CTA buttons
- `src/components/home/ServicesSection.tsx` — Services with selection state
- `src/components/home/ProjectsSection.tsx` — Project gallery with filtering
- `src/components/home/ProcessSection.tsx` — Step-by-step process visualization
- `src/components/home/ContactSection.tsx` — Contact form and information
- `src/components/home/StudioSection.tsx` — Studio principal and values
- `src/components/home/StudioValuesSection.tsx` — Studio core values
- `src/components/home/StudioFAQSection.tsx` — Frequently asked questions
- `src/components/home/StudioLocationSection.tsx` — Location information
- `src/components/home/MaterialsSection.tsx` — Materials showcase
- `src/components/home/StudioExperienceSection.tsx` — Experience highlight
- `src/components/home/ConsultationCTASection.tsx` — Consultation invitation CTA
- `src/components/home/ContactSection.tsx` — Contact details
- `src/components/home/SiteFooter.tsx` — Footer navigation and information

### Shared Components:
- `src/components/shared/SectionHeading.tsx` — Section heading with divider
- `src/components/shared/Container.tsx` — Page container
- `src/components/shared/EditorialPageHero.tsx` — Editorial hero pattern
- `src/components/ui/ServiceModal.tsx` — Service enquiry modal
- `src/components/ui/ProjectDetailModal.tsx` — Project detail view modal
- `src/components/ui/ConsultationModal.tsx` — Consultation request modal
- `src/components/ui/Header.tsx` — Global header with navigation
- `src/components/ui/Header.tsx` — Global header
- `src/components/ui/AudioToggle.tsx` — Audio context toggle

### Global Design Tokens (in globals.css and Tailwind config):
- Color: `#F2F0EB` (background), `#111111` (text), `#191916` (hero bg), `#191916`, `#39372F`, `#25251F`, `#B68A4A` (accent gold), `#D0AD75`, `#777777`, `#33312D`
- Font: Cormorant Garamond (serif, 300-700 weights), IBM Plex Mono (mono), Inter (sans)
- Tailwind breakpoints: sm, md, lg, xl, 2xl

### Animation Libraries (package.json):
- `framer-motion`: ^14.14.0 — Primary animation engine
- `gsap`: ^3.15.1 — Additional animation capabilities
- `lenis`: ^1.3.27 — Smooth scroll library
- `lucide-react`: ^1.74.0 — Icon set

## 4. EXISTING ANIMATIONS AND PERFORMANCE PROBLEMS

### Current animations identified:

1. **HeroSection**: Gradient background movement, architectural plane shadows, CTA hover transitions (scale/color), arrow transform on hover
2. **ServicesSection**: Service card interactions, selection state transitions
3. **ProjectsSection**: Project card hover effects, filter interactions
4. **ProcessSection**: Step number animations, progression visualization
5. **ContactSection**: Form field focus states, CTA button interactions
6. **SiteFooter**: Link hover states, border animations
7. **Header**: Logo interaction, navigation link states
8. **Globals**: Reduced-motion media query support

### Performance considerations noted:
- Lenis smooth scroll is active (may create scroll event handler)
- Framer Motion present but currently used sparingly
- GSAP imported but not prominently in homepage components
- Several components use `document.getElementById().scrollIntoView()` for CTA navigation
- No explicit `prefers-reduced-motion` media query enforcement found in component code
- Image placeholders used in hero (gradient + architectural planes SVG-like divs)

## 5. IMPLEMENTATION STRUCTURE CAPTURE

### Current file hierarchy (relevant portions):

```
src/app/page.tsx          — Root homepage container
src/components/home/      — All homepage sections
src/components/home/HeroSection.tsx     — Hero (largest visual area)
src/components/home/ServicesSection.tsx — Services grid
src/components/home/ProjectsSection.tsx — Project portfolio
src/components/home/ProcessSection.tsx  — Design process
src/components/home/ContactSection.tsx  — Contact CTA
src/components/home/SiteFooter.tsx      — Footer
src/components/home/StudioSection.tsx   — Studio info

src/components/shared/      — Reusable shared patterns
src/components/ui/          — UI modals and global elements
src/providers/              — AudioProvider, SmoothScroll
src/config/siteConfig.ts      — Site configuration data

### Key dependencies:
- Next.js 16.4.6 (app router)
- Tailwind CSS 4.3.3
- Framer Motion 14.14.0
- GSAP 3.15.1
- Lenis 1.3.27 (smooth scroll)
- React 19.3.0, React DOM 19.3.0

## 6. COMPONENTS SUITABLE FOR ENHANCEMENT (without duplication)

The following components can be improved as part of this polish:

1. **HeroSection** — Primary cinematic entrance animation (full hero rewrite)
2. **ServicesSection** — Staggered service reveals, hover interactions
3. **ProjectsSection** — Filter animations, project card entrances
4. **ProcessSection** — Progress step animations, visual sequencing
5. **ContactSection** — Form interaction states, CTA animations
6. **SiteFooter** — Link hover reveals, copyright entrance
7. **Header** — Navigation transition, mobile menu enhancement
8. **StudioSection** — Value proposition reveals

### Components to avoid duplicating/modifying:
- Client/Vendor/Portal modals (already remediated for security)
- Admin portal routes (not public scope)
- Consultation/modal forms with backend dependencies
- Canvas/3D components (separate domain)
