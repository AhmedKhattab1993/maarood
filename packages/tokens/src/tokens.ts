/**
 * Maarood design tokens.
 *
 * Color values are locked by `03_VISUAL_IDENTITY.md`. Spacing and type scales are
 * implementation decisions (the visual-identity doc locks color only) chosen to
 * express the editorial, restrained SSENSE/Aritzia direction: tight 4px base
 * spacing, a modest modular type scale, calm radii.
 *
 * Values are raw JS so they can be ported to any platform. `cssVariables`
 * exposes them as CSS custom properties for the web app; a future React Native
 * consumer reads the same `tokens` object directly.
 */

export const color = {
  // Locked — 03_VISUAL_IDENTITY.md
  maaroudBlue: "#1D4ED8",
  warmIvory: "#FAF7F0",
  inkBlack: "#111111",
  stoneGrey: "#E6E3DE",
  coolGrey: "#8B9099",
  successGreen: "#22C55E",
  alertRed: "#EF4444",
  warmSand: "#DBC4A3",
  // Optional marketing gradient endpoint — 03_VISUAL_IDENTITY.md
  indigo: "#6366F1",
} as const;

/**
 * 4px-base spacing scale. Editorial restraint: small, even steps.
 * Keys mirror CSS variable names so `--space-2` etc. stay unambiguous.
 */
export const space = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

/** Container widths for responsive gallery layout. */
export const container = {
  max: "1280px",
  prose: "720px",
} as const;

/**
 * Restrained modular type scale (ratio ~1.2). Arabic-first: sizes are set for
 * legibility of Arabic glyphs, which generally read better slightly larger.
 */
export const fontSize = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
} as const;

export const lineHeight = {
  tight: "1.15",
  snug: "1.3",
  normal: "1.5",
  relaxed: "1.7",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
} as const;

/** Calm radii — minimal, to keep the neutral-gallery feel. */
export const radius = {
  none: "0px",
  sm: "2px",
  DEFAULT: "4px",
  md: "6px",
  lg: "10px",
  pill: "9999px",
} as const;

export const fontFamily = {
  // Arabic-first pairing (see apps/web README). Latin fallback inline.
  sans: '"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif',
  latin: '"Inter", system-ui, sans-serif',
} as const;

/** Breakpoints — mobile-first. */
export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const tokens = {
  color,
  space,
  container,
  fontSize,
  lineHeight,
  fontWeight,
  radius,
  fontFamily,
  breakpoint,
} as const;

type CssVarEntries = Record<string, string>;

const toCssName = (group: string, key: string) =>
  `--${group}${key === "DEFAULT" ? "" : `-${key}`}`.toLowerCase();

const flat = (group: string, values: CssVarEntries): Array<[string, string]> =>
  Object.entries(values).map(([key, value]) => [toCssName(group, key), value]);

/**
 * CSS custom-property declarations for the web app's `:root`.
 * Consumed by Tailwind v4's `@theme` via `@import`.
 */
export const cssVariables: string = [
  ...flat("color", color),
  ...flat("space", space),
  ...flat("radius", radius),
  ...flat("font-size", fontSize),
  ...flat("line-height", lineHeight),
  ...flat("font-weight", fontWeight),
  ...flat("container", container),
  [`--font-sans`, fontFamily.sans],
  [`--font-latin`, fontFamily.latin],
]
  .map(([name, value]) => `  ${name}: ${value};`)
  .join("\n");
