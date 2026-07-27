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
      { name: 'Archivo', provider: 'google', global: true },
      { name: 'Cormorant Infant', provider: 'google', global: true },
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
          // navigation. Keys must match app/utils/theme.ts.
          innerHTML:
            "try{var d=document.documentElement,t=localStorage.getItem('gymmer.theme')||'system';"
            + "var k=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);"
            + "d.dataset.theme=k?'dark':'light';"
            + "d.dataset.accent=localStorage.getItem('gymmer.accent')||'orange'}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
