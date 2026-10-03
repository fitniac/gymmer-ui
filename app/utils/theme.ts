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

/**
 * What a settings picker offers: **Dark or Light, and nothing else** (D6).
 *
 * `system` is deliberately absent. It is still accepted when READING a stored
 * value — see `isThemePref` — because it was written for the life of the
 * product and a visitor who picked it must not hit a validation error on their
 * next visit. It is simply never written again, and resolves to the default.
 */
export const THEMES = ['dark', 'light'] as const

/** Every value that may legitimately arrive from a cookie or localStorage. */
export const STORED_THEMES = ['dark', 'light', 'system'] as const

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
export type StoredTheme = (typeof STORED_THEMES)[number] // what may be read back
export type ThemeMode = 'light' | 'dark' // what gets applied

export const DEFAULT_ACCENT: AccentId = 'orange'
/**
 * Dark (D6).
 *
 * Not "whatever the OS says": the product has one intended look, the screens
 * are drawn for it, and a workout happens in a gym where the phone is the
 * brightest thing in reach. A visitor with no stored preference on a
 * light-mode OS therefore sees dark after this release — that is the
 * deliberate effect of the decision, not a side effect of it.
 */
export const DEFAULT_THEME: ThemePref = 'dark'
export const DEFAULT_CORNERS: CornerId = 'soft'

export const isAccent = (v: unknown): v is AccentId =>
  typeof v === 'string' && v in ACCENTS

/**
 * Accepts `system` on the way IN, so an old stored value is read rather than
 * rejected. `resolveStoredTheme` is what turns it into something applicable.
 */
export const isThemePref = (v: unknown): v is StoredTheme =>
  typeof v === 'string' && (STORED_THEMES as readonly string[]).includes(v)

/**
 * A stored value as a preference the product still offers.
 *
 * `system` means "no preference" now, so it collapses to the default rather
 * than to the OS setting. Doing this at the read edge is what lets every
 * other caller — the SSR plugin, the no-flash script, the settings picker —
 * stay a two-value world.
 */
export const resolveStoredTheme = (v: unknown): ThemePref =>
  (v === 'dark' || v === 'light') ? v : DEFAULT_THEME

export const isCorners = (v: unknown): v is CornerId =>
  typeof v === 'string' && (CORNERS as readonly string[]).includes(v)

/**
 * Always a concrete light|dark in `data-theme`, so the CSS never branches.
 *
 * `systemDark` is retained in the signature and ignored for a stored `system`,
 * which now means "no preference" and takes the default. Kept as a parameter
 * rather than removed because every call site passes it and a silently
 * changed arity is the kind of edit that compiles and then behaves
 * differently.
 */
export const resolveTheme = (pref: StoredTheme, _systemDark?: boolean): ThemeMode =>
  (pref === 'dark' || pref === 'light') ? pref : DEFAULT_THEME

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
