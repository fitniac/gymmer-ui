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

export type AccentId = keyof typeof ACCENTS
export type ThemePref = (typeof THEMES)[number] // what the user picks
export type ThemeMode = 'light' | 'dark' // what gets applied

export const DEFAULT_ACCENT: AccentId = 'orange'
export const DEFAULT_THEME: ThemePref = 'system'

export const isAccent = (v: unknown): v is AccentId =>
  typeof v === 'string' && v in ACCENTS

export const isThemePref = (v: unknown): v is ThemePref =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v)

// Offer three options in a settings UI, but always write a concrete light|dark
// into data-theme so the CSS never has to branch.
export const resolveTheme = (pref: ThemePref, systemDark: boolean): ThemeMode =>
  pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

// Cookie names are read by the SSR plugin; the localStorage keys are also
// hardcoded in the blocking no-flash script in nuxt.config.ts. Changing either
// means changing both.
export const THEME_COOKIE = 'gm_theme'
export const ACCENT_COOKIE = 'gm_accent'
export const THEME_STORAGE_KEY = 'gymmer.theme'
export const ACCENT_STORAGE_KEY = 'gymmer.accent'
export const COOKIE_MAX_AGE = 31536000 // 1 year
