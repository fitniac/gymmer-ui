import {
  ACCENTS,
  THEMES,
  ACCENT_COOKIE,
  ACCENT_STORAGE_KEY,
  CORNERS,
  CORNERS_COOKIE,
  CORNERS_STORAGE_KEY,
  COOKIE_MAX_AGE,
  resolveAccent,
  DEFAULT_CORNERS,
  resolveStoredTheme,
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  resolveTheme,
  type AccentId,
  type CornerId,
  type StoredTheme,
  type ThemePref,
} from '../utils/theme'

/**
 * Theme + accent + corner state, persisted to cookies (so SSR sees them on the
 * first byte) and localStorage (so the blocking no-flash script can read them).
 *
 * A consuming app needs no setup: call `useTheme()` once in a layout or page
 * and all three axes are live. A settings UI only has to call setTheme /
 * setAccent / setCorners, and can render swatches from `accents` and the
 * corner options from `corners`.
 */
export function useTheme() {
  const themeCookie = useCookie<StoredTheme>(THEME_COOKIE, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  const accentCookie = useCookie<AccentId>(ACCENT_COOKIE, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  const cornersCookie = useCookie<CornerId>(CORNERS_COOKIE, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const pref = useState<ThemePref>('gm-theme', () => resolveStoredTheme(themeCookie.value))
  const accent = useState<AccentId>('gm-accent', () => resolveAccent(accentCookie.value))
  const cornerPref = useState<CornerId>('gm-corners', () => cornersCookie.value ?? DEFAULT_CORNERS)

  if (import.meta.client) {
    // No OS listener any more. The preference is Dark or Light (D6), so there
    // is nothing for `prefers-color-scheme` to change mid-session; an old
    // stored `system` resolves to the default like any other absent value.
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(pref.value)
    }

    watch(
      pref,
      (v) => {
        themeCookie.value = v
        try {
          localStorage.setItem(THEME_STORAGE_KEY, v)
        }
        catch {
          // Safari in private mode throws on write; the cookie still carries it.
        }
        apply()
      },
      { immediate: true },
    )

    watch(
      accent,
      (v) => {
        accentCookie.value = v
        document.documentElement.dataset.accent = v
        try {
          localStorage.setItem(ACCENT_STORAGE_KEY, v)
        }
        catch {
          // as above
        }
      },
      { immediate: true },
    )

    // Corners has no OS signal to follow, so unlike theme it is a plain
    // write-through: state -> cookie + storage + attribute.
    watch(
      cornerPref,
      (v) => {
        cornersCookie.value = v
        document.documentElement.dataset.corners = v
        try {
          localStorage.setItem(CORNERS_STORAGE_KEY, v)
        }
        catch {
          // as above
        }
      },
      { immediate: true },
    )


  }

  return {
    pref,
    accent,
    cornerPref,
    // The list a settings picker renders. Exposed so a consumer cannot invent
    // a third option: Dark and Light are the product's answer (D6), and the
    // one place that is true is here.
    themes: THEMES,
    accents: ACCENTS,
    corners: CORNERS,
    setTheme: (v: ThemePref) => (pref.value = v),
    setAccent: (v: AccentId) => (accent.value = v),
    setCorners: (v: CornerId) => (cornerPref.value = v),
  }
}
