// The theme registry — the one place a palette is declared.
//
// Lives in app/utils/ rather than shared/ on purpose: `#shared` resolves to the
// CONSUMING app's shared/ directory, so a layer that imported `#shared/theme`
// would look for the registry in the wrong repo. Layer-internal code imports
// this relatively; consumers get the values through useTheme().
//
// Adding an accent = one entry here + light and dark blocks in tokens.css +
// passing test/contrast.test.mjs.

export const ACCENTS = {
  orange: { label: 'Ember', light: '#ec3013', dark: '#ff563c' },
  green: { label: 'Field', light: '#16a34a', dark: '#22c55e' },
  cyan: { label: 'Current', light: '#0891b2', dark: '#22b8d6' },
} as const

export const THEMES = ['light', 'dark', 'system'] as const

/**
 * Corner roundness (D1) — the third <html> axis, beside theme and accent.
 *
 * `soft` is the shipped default and is the value already in :root, so the
 * attribute is absent for almost every visitor. That is deliberate: it keeps
 * the common case free of an extra attribute write on every navigation, and
 * it means a browser that never runs our script still gets the design's
 * intended corners rather than square ones.
 */
export const CORNERS = ['square', 'soft', 'round'] as const

export type AccentId = keyof typeof ACCENTS
export type CornerId = (typeof CORNERS)[number]
export type ThemePref = (typeof THEMES)[number] // what the user picks
export type ThemeMode = 'light' | 'dark' // what gets applied

export const DEFAULT_ACCENT: AccentId = 'orange'
export const DEFAULT_THEME: ThemePref = 'system'
export const DEFAULT_CORNERS: CornerId = 'soft'

export const isAccent = (v: unknown): v is AccentId =>
  typeof v === 'string' && v in ACCENTS

export const isThemePref = (v: unknown): v is ThemePref =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v)

export const isCorners = (v: unknown): v is CornerId =>
  typeof v === 'string' && (CORNERS as readonly string[]).includes(v)

// Offer three options in a settings UI, but always write a concrete light|dark
// into data-theme so the CSS never has to branch.
export const resolveTheme = (pref: ThemePref, systemDark: boolean): ThemeMode =>
  pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

// Cookie names are read by the SSR plugin; the localStorage keys are also
// hardcoded in the blocking no-flash script in nuxt.config.ts. Changing either
// means changing both.
export const THEME_COOKIE = 'gm_theme'
export const ACCENT_COOKIE = 'gm_accent'
export const CORNERS_COOKIE = 'gm_corners'
export const THEME_STORAGE_KEY = 'gymmer.theme'
export const ACCENT_STORAGE_KEY = 'gymmer.accent'
export const CORNERS_STORAGE_KEY = 'gymmer.corners'
export const COOKIE_MAX_AGE = 31536000 // 1 year
