import {
  ACCENTS,
  ACCENT_COOKIE,
  ACCENT_STORAGE_KEY,
  COOKIE_MAX_AGE,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  resolveTheme,
  type AccentId,
  type ThemePref,
} from '../utils/theme'

/**
 * Theme + accent state, persisted to cookies (so SSR sees them on the first
 * byte) and localStorage (so the blocking no-flash script can read them).
 *
 * A consuming app needs no setup: call `useTheme()` once in a layout or page
 * and both axes are live. A settings UI only has to call setTheme / setAccent,
 * and can render swatches from `accents`.
 */
export function useTheme() {
  const themeCookie = useCookie<ThemePref>(THEME_COOKIE, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  const accentCookie = useCookie<AccentId>(ACCENT_COOKIE, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  const pref = useState<ThemePref>('gm-theme', () => themeCookie.value ?? DEFAULT_THEME)
  const accent = useState<AccentId>('gm-accent', () => accentCookie.value ?? DEFAULT_ACCENT)

  if (import.meta.client) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    // Re-resolve on OS change too — while the pref is `system` the page has to
    // follow the OS live, not only on reload.
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(pref.value, mq.matches)
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

    mq.addEventListener('change', apply)
    onScopeDispose(() => mq.removeEventListener('change', apply))
  }

  return {
    pref,
    accent,
    accents: ACCENTS,
    setTheme: (v: ThemePref) => (pref.value = v),
    setAccent: (v: AccentId) => (accent.value = v),
  }
}
