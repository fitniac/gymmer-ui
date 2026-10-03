// @gymmer/ui — the Gymmer design system, as a Nuxt 4 layer.
//
// Consumed via `extends`. See README.md for the wiring; the short version is
// that the consumer resolves this by REAL path (realpathSync of the
// node_modules entry), owns the single `@import 'tailwindcss'`, and points a
// Tailwind `@source` glob at node_modules/@gymmer/ui.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/fonts'],

  // Deliberately NO `css:` entry. A layer that loads its own stylesheet gets a
  // second Tailwind instance in a layered build (`@import "tailwindcss"`
  // resolves relative to the importing file), and the emitted CSS doubles.
  // The consumer imports tokens.css + gymmer.css from its own entry instead.

  fonts: {
    // Self-hosted at build time — no runtime request to fonts.googleapis.com.
    // Latin-Extended is NOT optional: Gymmer targets most European languages
    // and a subset without it drops diacritics.
    defaults: {
      weights: [400, 600, 800],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
    },
    // `global: true` is load-bearing. @nuxt/fonts injects @font-face for the
    // families it can SEE in a font-family declaration — and every declaration
    // in this system goes through a token (`font-family: var(--gm-font-ui)`),
    // so the literal names never appear and it would download nothing. The app
    // then falls back to system fonts in production while still looking correct
    // in dev on a machine that happens to have Archivo installed.
    families: [
      // The UI face (D2/D3).
      //
      // No `subsets` here, and that is measured rather than careless. Google
      // serves this family from the variable-font endpoint (/l/font?kit=…)
      // rather than as per-subset static files, and @nuxt/fonts cannot slice
      // that: passing subsets: ['latin','latin-ext'] produced a byte-identical
      // build (15 files, 343 KB, 8 scripts). An option that does nothing is
      // worse than none — it reads as a restriction that is in force.
      //
      // The 8 scripts are not a payload problem. 50 of the 55 emitted
      // @font-face blocks carry a unicode-range, so a browser fetches only the
      // subsets the text on the page actually needs; the Cherokee and Syriac
      // files sit in .output and are never requested. Build size, not user
      // bytes.
      //
      // What this family does NOT serve is cyrillic and greek — see O5 and
      // tokens.css. There is nothing to request for those.
      { name: 'Google Sans Flex', provider: 'google', global: true, weights: [400, 500, 600, 700, 800] },
      { name: 'Archivo', provider: 'google', global: true },
      { name: 'Cormorant Infant', provider: 'google', global: true },
      // The quote face for Russian, Ukrainian, Bulgarian and Greek (see the
      // html:lang rule in tokens.css): Cormorant's Cyrillic is italic-shaped
      // and it has no Greek at all.
      { name: 'EB Garamond', provider: 'google', global: true, weights: [400, 600], subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext'] },
    ],
  },

  app: {
    head: {
      meta: [
        // Lets form controls and scrollbars follow the theme.
        { name: 'color-scheme', content: 'light dark' },
      ],
      script: [
        {
          // Blocking, before first paint: the server cannot resolve a `system`
          // preference, so plugins/theme.ts renders `light` and this corrects
          // it. Without it a dark-mode visitor gets a white flash on every
          // navigation. Keys must match app/utils/theme.ts — THEME_STORAGE_KEY,
          // ACCENT_STORAGE_KEY, CORNERS_STORAGE_KEY and their defaults.
          innerHTML:
            "try{var d=document.documentElement,t=localStorage.getItem('gymmer.theme')||'system';"
            + "var k=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);"
            + "d.dataset.theme=k?'dark':'light';"
            + "d.dataset.accent=localStorage.getItem('gymmer.accent')||'orange';"
            // Corners (D1). Here as well as in plugins/theme.ts because the
            // native build has no server to set it: ssr:false means the cookie
            // is never read and this script is the only thing that applies the
            // preference before first paint.
            + "d.dataset.corners=localStorage.getItem('gymmer.corners')||'soft'}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
