# CLAUDE.md — @gymmer/ui

The Gymmer design system as a Nuxt 4 layer. Consumed by `gymmer-landing` (interim marketing site)
and `gymmer-nuxt` (the app, which will take over gymmer.com). Wiring and consumer setup:
[README.md](README.md).

**This repo is the single source of truth for the tokens.** If `tokens.css` or the `@theme` block
appears in a consuming repo, that is a bug — the whole reason this layer exists is that two copies
drift the first time a colour is retuned.

## Non-negotiables

These are not style preferences; they are what makes accent switching and dark mode work at all.

1. **Tokens only.** Never a colour literal in a component: no hex, no `rgba()`, no named colour.
   Grounds are `--gm-bg`, `--gm-surface`, `--gm-raised`, `--gm-stripe(2)`; ink and text are
   `--gm-ink`, `--gm-text-body`, `--gm-muted`, `--gm-faint`; borders are `--gm-border` (NOT
   `--gm-ink` — in dark mode borders sit well below text brightness); lines are `--gm-divider` /
   `--gm-hairline`; shadows are `--gm-sh*`; accent is `--acc*`. You should almost never need a
   `dark:` utility — if you reach for one, a token is missing.
2. **Two radii.** `0` for everything structural (cards, inputs, chips, rules, tables) and `999px`
   for primary actions and switches. Nothing in between. No `rounded-lg`.
3. **Rules, not shadows, do the organising.** 2px `--gm-divider` between sections and grid cells;
   1px `--gm-hairline` inside lists. Don't replace a rule with whitespace — including on mobile,
   where a collapsing grid's vertical rules should become horizontal ones.
4. **Flush left.** Headings, copy and button labels align left; the grid is visible.
5. **Offset shadows only.** `5px 5px 0` on buttons, `12px 12px 0` on framed cards, `-8px 8px 0` on
   corner badges. `--shadow-bubble` is the one soft ambient shadow in the system.
6. **Photography prints black and white** — `filter: grayscale(1) contrast(1.08)`; `tokens.css` adds
   `brightness(.86)` in dark so prints don't punch a hole in the page. Use the `photo` utility.
7. **Accent is sparing**: primary actions, small emphasis, one tinted band per screen at most.
8. **Type**: Archivo (400/600/800) for everything; Cormorant Infant italic for quotes and section
   lead lines only. Both must stay Latin-Extended — Gymmer targets most European languages, so never
   swap in a display font without full `latin-ext` coverage.
9. **Icons**: Lucide (`lucide-vue-next`), stroke `2.25`, sized 14–20px, `currentColor`. Don't mix
   icon sets.
10. **Motion**: reveals 0.7s `cubic-bezier(.2,.7,.2,1)`; button press 0.12s; `prefers-reduced-motion`
    is already handled globally in `tokens.css` and by `useReveal()`.
11. **The brand name is GYMMER, uppercase, always.** No lowercase or title-case form exists.
    `.logo-type` enforces it with `text-transform`, but write it uppercase in templates anyway.
    Lowercase `gymmer` is only ever an *identifier* — `@gymmer/ui`, `gymmer-nuxt`, the `--gm-*`
    prefix, filenames — never the brand.
12. **The mark is inlined SVG, never `<img src>`.** Its fill is a 45° gradient from `--acc` to
    `--acc-deep`; an external image is an isolated document that cannot read `html[data-accent]`,
    so it would freeze on light orange while the rest of the page retints. See "Brand assets" below.

## Accessibility

- Focus is always `outline: 2px solid currentColor; outline-offset: 2px`.
- Body-size accent text uses `--acc-deep`, never `--acc` (which only guarantees 3:1).
- Hit targets ≥44px on mobile.
- `--acc-soft` / `--acc-tint` are fills only, never text colours.

## Layer mechanics — things that will bite

- **No `css:` entry in `nuxt.config.ts`, ever.** A layer that imports Tailwind produces a second
  instance of the framework in a layered build. The consumer owns the single `@import 'tailwindcss'`
  and then imports `tokens.css` + `gymmer.css` after it. Order matters: tokens must land after
  Tailwind's preflight or `body` loses its ground colour.
- **No `exports` field in `package.json`.** Consumers deep-import
  `@gymmer/ui/app/assets/css/tokens.css`; an `exports` map silently breaks that.
- **`app/utils/theme.ts`, not `shared/theme.ts`.** `#shared` resolves to the *consuming* app's
  `shared/` directory, so a layer importing `#shared/theme` looks for the registry in the wrong
  repo. Layer-internal code imports it relatively.
- **`plugins/theme.ts` is server-only and must stay that way.** unhead re-applies `htmlAttrs` after
  hydration; registering it on the client stamps the SSR `light` fallback back over the client-side
  correction, leaving every dark-OS visitor on the light theme. There is a comment saying so — keep it.
- **`global: true` on each font family.** @nuxt/fonts injects `@font-face` only for families it can
  see in a `font-family` declaration, and every declaration here goes through `var(--gm-font-ui)`.
  Without the flag, production silently falls back to system fonts while dev looks correct on a
  machine that has Archivo installed.

## Changing tokens

`pnpm test:contrast` after any change to `tokens.css`. It parses the file directly — including a
`KNOWN_GAPS` table for four light-mode combinations that ship below spec and are ratcheted against
regression. If you tighten one, delete its entry; if a new combination fails, fix the colour rather
than adding an entry.

Adding an accent: one entry in `app/utils/theme.ts`, light **and** dark blocks in `tokens.css`, then
the contrast test. The derivation recipe (`deep` / `hover` / `soft` / `tint` from a base) is
documented in `tokens.css` under the accent palettes.

## Brand assets

`app/assets/img/logo.svg` is the only hand-authored artwork in the repo. `brand/` is 85 generated
rasters plus their manifests, built from that SVG and `tokens.css` by `pnpm brand`. Full reference:
[brand/README.md](brand/README.md).

- **Never edit a file under `brand/`.** The next `pnpm brand` overwrites it. Change the SVG or the
  token and re-run. The one exception is `brand/README.md`, which is why the generator deletes only
  the five generated subtrees rather than the directory.
- **Two sizing measurements, and they are not interchangeable.** The mark's real extent is its
  688×688 bounding box — the chamfered bar tip sits *inside* it, so square and superellipse canvases
  fit the box. A circular mask cuts that tip first, 465.8 out on the diagonal, so circular canvases
  (watchOS, Android round, maskables) must fit the *circumcircle* instead. Fitting a circular tile
  by bounding box silently shears the tip off.
- **iOS and Play reject an alpha channel outright** — fully opaque is not sufficient, the channel
  must be absent. `stripAlpha()` re-encodes those to PNG colour type 2.
- **`pnpm brand` verifies itself and fails the build on mismatch.** The generator writes
  `brand/geometry.json` declaring what each file should be; `verify-brand.mjs` decodes the pixels and
  checks span, centring, alpha and mask clearance against it. This exists because three separate
  wrong-icon bugs shipped past review looking completely normal in a file listing — including the
  word `undefined` rendered into all ten macOS icons. Do not weaken it into a file-existence check.

## Adding to the layer

Only things **both** consumers need. A marketing-only wash or an app-only widget belongs in its own
repo. Component classes here are CSS (`.pri`, `.gho`, `.bul`, `.rv`, `.row/.arw`) — there are
deliberately no Vue components yet, because the landing is all page sections and would never consume
them. Vue primitives get built in `gymmer-nuxt` and promoted here only once they've stopped moving
and a second consumer actually exists.
