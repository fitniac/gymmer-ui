import {
  ACCENT_COOKIE,
  CORNERS_COOKIE,
  COOKIE_MAX_AGE,
  DEFAULT_ACCENT,
  DEFAULT_CORNERS,
  DEFAULT_THEME,
  THEME_COOKIE,
  isAccent,
  isCorners,
  isThemePref,
  type AccentId,
  type CornerId,
  type ThemePref,
} from '../utils/theme'

/**
 * Seeds data-theme / data-accent into the SERVER response so the first byte is
 * already the right colour.
 *
 * Server-only on purpose. `system` is the one preference the server cannot
 * resolve — it has no matchMedia — so SSR falls back to `light` and two client
 * mechanisms correct it: the blocking inline script this layer adds in
 * nuxt.config.ts (before first paint) and useTheme() (on hydration, and again
 * whenever the OS flips).
 *
 * Registering the same useHead entry on the client would undo both: unhead
 * re-applies its htmlAttrs after hydration, stamping the `light` fallback back
 * over the correction — a dark-OS visitor would land on the light theme and
 * stay there. Keep this guard.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.server) return

  const themeCookie = useCookie<ThemePref>(THEME_COOKIE, {
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

  const pref = isThemePref(themeCookie.value) ? themeCookie.value : DEFAULT_THEME
  const accent = isAccent(accentCookie.value) ? accentCookie.value : DEFAULT_ACCENT
  const corners = isCorners(cornersCookie.value) ? cornersCookie.value : DEFAULT_CORNERS

  useHead({
    htmlAttrs: {
      'data-theme': pref === 'system' ? 'light' : pref,
      'data-accent': accent,
      // Unlike theme, corners needs no client correction: there is no OS
      // preference for it, so the cookie IS the answer and SSR can render the
      // final value. Written even when it is the default so the attribute is
      // present for anything selecting on it.
      'data-corners': corners,
    },
  })
})
