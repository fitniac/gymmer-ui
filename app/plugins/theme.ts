import {
  ACCENT_COOKIE,
  CORNERS_COOKIE,
  COOKIE_MAX_AGE,
  DEFAULT_ACCENT,
  DEFAULT_CORNERS,
  THEME_COOKIE,
  isAccent,
  isCorners,
  resolveStoredTheme,
  type AccentId,
  type CornerId,
  type StoredTheme,
} from '../utils/theme'

/**
 * Seeds data-theme / data-accent into the SERVER response so the first byte is
 * already the right colour.
 *
 * Server-only on purpose. Since D6 there is nothing for the client to correct:
 * the preference is Dark or Light, both of which the server can resolve, and
 * an old stored `system` means "no preference" and takes the default. So the
 * first byte carries the final answer and no mechanism has to fix it up.
 *
 * Registering the same useHead entry on the client would still be wrong —
 * unhead re-applies its htmlAttrs after hydration, so any later correction
 * would be stamped over. Keep this guard.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.server) return

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

  // Collapses a missing, unknown or legacy `system` value to the default in
  // one place, so the attribute below is always a concrete dark|light.
  const pref = resolveStoredTheme(themeCookie.value)
  const accent = isAccent(accentCookie.value) ? accentCookie.value : DEFAULT_ACCENT
  const corners = isCorners(cornersCookie.value) ? cornersCookie.value : DEFAULT_CORNERS

  useHead({
    htmlAttrs: {
      'data-theme': pref,
      'data-accent': accent,
      // Unlike theme, corners needs no client correction: there is no OS
      // preference for it, so the cookie IS the answer and SSR can render the
      // final value. Written even when it is the default so the attribute is
      // present for anything selecting on it.
      'data-corners': corners,
    },
  })
})
