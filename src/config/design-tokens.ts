/**
 * ArcheOn Design Studio — Design Tokens
 * 
 * Approved Direction:
 * - Editorial Architecture
 * - Ivory-led luxury minimalism
 * - Restrained bronze accents
 * - Selective Three.js experiences & cinematic subtlety
 */

export const colors = {
  // Primary brand palette
  obsidian: "#111111",
  darkSurface: "#1C1C1C",
  ivory: "#F2F0EB",
  white: "#FFFFFF",
  concreteGrey: "#777777",
  darkBorder: "#343434",
  lightBorder: "#D8D6D0",
  bronze: "#B68A4A",

  // Semantic mappings
  background: {
    primary: "#F2F0EB",      // Architectural ivory
    surface: "#FFFFFF",       // Elevated ivory/white surface
    dark: "#111111",          // Obsidian for high-contrast sections & footer
    darkSurface: "#1C1C1C",   // Subdued dark cards
  },
  text: {
    primary: "#111111",       // Obsidian for high legibility on ivory
    secondary: "#777777",     // Concrete grey for subheadings / metadata
    inverse: "#F2F0EB",       // Ivory text on dark backgrounds
    inverseMuted: "#A3A3A3",  // Muted grey on dark backgrounds
    accent: "#B68A4A",        // Muted bronze for restrained emphasis
  },
  border: {
    light: "#D8D6D0",         // Subtle rule lines on ivory
    dark: "#343434",          // Subtle rule lines on obsidian
    accent: "#B68A4A",        // Bronze accent border
  },
} as const;

export const typography = {
  fonts: {
    serif: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
    sans: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sizes: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
    "6xl": "3.75rem",  // 60px
    "7xl": "4.5rem",   // 72px
    displayHero: "clamp(2.75rem, 6vw, 5.5rem)",
    displaySection: "clamp(2rem, 4vw, 3.75rem)",
  },
  weights: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  letterSpacing: {
    tighter: "-0.04em",
    tight: "-0.02em",
    normal: "0em",
    wide: "0.04em",
    wider: "0.08em",
    widest: "0.15em",
  },
} as const;

export const spacing = {
  scale: {
    0: "0",
    1: "0.25rem",  // 4px
    2: "0.5rem",   // 8px
    3: "0.75rem",  // 12px
    4: "1rem",     // 16px
    5: "1.25rem",  // 20px
    6: "1.5rem",   // 24px
    8: "2rem",     // 32px
    10: "2.5rem",  // 40px
    12: "3rem",    // 48px
    16: "4rem",    // 64px
    20: "5rem",    // 80px
    24: "6rem",    // 96px
    32: "8rem",    // 128px
  },
  section: {
    paddingY: "clamp(5rem, 10vw, 9rem)",
    paddingX: "clamp(1.25rem, 5vw, 4rem)",
    gap: "clamp(3rem, 6vw, 6rem)",
  },
} as const;

export const layout = {
  maxWidths: {
    content: "80rem",     // 1280px (Standard editorial container)
    narrow: "56rem",      // 896px (Longform reading / case studies)
    wide: "96rem",        // 1536px (Panoramic galleries / hero sections)
    full: "100%",
  },
  borderRadius: {
    none: "0",
    sm: "2px",
    md: "4px",
    lg: "8px",
    full: "9999px",
  },
} as const;

export const transitions = {
  durations: {
    fast: "150ms",
    normal: "280ms",
    slow: "500ms",
    cinematic: "850ms",
  },
  easings: {
    default: "cubic-bezier(0.16, 1, 0.3, 1)",        // Custom fluid ease-out
    cinematic: "cubic-bezier(0.25, 1, 0.5, 1)",      // Smooth architectural glide
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  layout,
  transitions,
} as const;

export type DesignTokens = typeof tokens;
