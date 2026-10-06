# CLAUDE.md — @gymmer/ui

The Gymmer design system as a Nuxt 4 layer. Consumed by `gymmer-landing` (interim marketing site)
and `gymmer-nuxt` (the app, which will take over gymmer.com). Wiring and consumer setup:
[README.md](README.md).

**This repo is the single source of truth for the tokens.** If `tokens.css` or the `@theme` block
appears in a consuming repo, that is a bug — the whole reason this layer exists is that two copies
drift the first time a colour is retuned.

## Redesign in progress — read before changing tokens, fonts or components

`docs/redesign/` is the handoff for the GYMMER redesign. Start at
[`docs/redesign/README.md`](docs/redesign/README.md): build order, the screen → file map for
`gymmer-nuxt`, and **§3, the decisions (D1–D10) that change rules in this file** — radius (D1),
Google Sans Flex UI text (D2/D3), colour photography (D4), no offset shadows on app surfaces (D5),
closed accent list kept (D7), 5-tab bar with `gymmer-g` and `barbell` glyphs (D8), pre-launch CTAs (D9),
guest nav grouped as Library (Exercises | Programs | Goals) + Learn (articles) with a centre "Join free" button (D10).

- **Signed off 2026-10-03: D1, D2, D3, D5, D6, D7, D8, D9, D10.** The Non-negotiables below are
  updated to match (rules 2, 5 and 8). **Only D4 (colour photography) is still open** — keep rule 6
  as written and build the redesign value behind a token.
- Token work for the redesign lands here first (`00-foundations.md`): new `--gm-radius-card`,
  `--gm-radius-ctl`, `--gm-radius-sheet`, `--gm-font-display`, motion tokens, `data-corners`.
  `pnpm test:contrast` still gates every accent change.
- New public content — **Goals** (categories on programs, exercises and articles), public
  **Programs** and **Articles** with embedded program/workout/exercise widgets — is specified in
  `docs/redesign/screens/18-content-model.md`. It is app/backend work (`gymmer-nuxt`, `gobackend`);
  nothing from it belongs in this layer unless both consumers need it.
- `docs/redesign/design/*.dc.html` are design-canvas snapshots (need the canvas runtime to render).
  Read them as markup reference; never import them.

## Non-negotiables

These are not style preferences; they are what makes accent switching and dark mode work at all.

1. **Tokens only.** Never a colour literal in a component: no hex, no `rgba()`, no named colour.
   Grounds are `--gm-bg`, `--gm-surface`, `--gm-raised`, `--gm-stripe(2)`; ink and text are
   `--gm-ink`, `--gm-text-body`, `--gm-muted`, `--gm-faint`; borders are `--gm-border` (NOT
   `--gm-ink` — in dark mode borders sit well below text brightness); lines are `--gm-divider` /
   `--gm-hairline`; shadows are `--gm-sh*`; accent is `--acc*`. You should almost never need a
   `dark:` utility — if you reach for one, a token is missing.
2. **Four radii, and they are tokens — never a literal or a `rounded-*` utility.** D1, approved
   2026-10-03. `--gm-radius-card` (12px) for cards, media and sheet panels; `--gm-radius-ctl` (7px)
   for inputs, small tiles and thumbnails; `--gm-radius-sheet` (22px) for the top corners of bottom
   sheets; `--gm-radius-pill` (999px) for buttons, chips and segmented controls.
   The first three move with the user's `data-corners` preference (square → 0, round → 20/12/28);
   the pill never does, because a pill at radius 0 stops reading as a control.
   `--gm-radius: 0` is the pre-redesign token. Everything written before this still reads it and
   keeps working — do not add new uses, and do not "migrate" a component to the new tokens as a
   drive-by: that is a restyle, and it belongs in the screen's own PR with its screenshots.
3. **Rules, not shadows, do the organising.** 2px `--gm-divider` between sections and grid cells;
   1px `--gm-hairline` inside lists. Don't replace a rule with whitespace — including on mobile,
   where a collapsing grid's vertical rules should become horizontal ones.
4. **Flush left.** Headings, copy and button labels align left; the grid is visible.
5. **Offset shadows are marketing-only.** D5, approved 2026-10-03. On the **marketing** site they
   stay exactly as they were — `5px 5px 0` on buttons, `12px 12px 0` on framed cards, `-8px 8px 0` on
   corner badges — because that hard-edged offset *is* the brand's print echo and the landing is
   where it earns its keep.
   On **app** surfaces they are gone: cards separate by surface tone plus a 1px `--gm-hairline`
   instead. The only soft shadow an app screen keeps is on the selected segment of a segmented
   control (`0 1px 3px` of `--gm-sh`), which is doing a different job — saying which segment is on
   top, not framing a card.
   The `--gm-sh*` tokens are unchanged and are not deprecated; what changed is where they are used.
6. **Photography prints black and white** — `filter: grayscale(1) contrast(1.08)`; `tokens.css` adds
   `brightness(.86)` in dark so prints don't punch a hole in the page. Use the `photo` utility.
7. **Accent is sparing**: primary actions, small emphasis, one tinted band per screen at most.
8. **Type**: two faces, both tokens. `--gm-font-display` (Archivo) is applied by the `h1, h2, h3,
   .display` rule; `--gm-font-ui` (Google Sans Flex, falling back to Archivo) is inherited from
   `body` by everything else. D2/D3, approved 2026-10-03. Cormorant Infant italic stays for quotes
   and section lead lines only; there is no mono face.
   Small uppercase labels take the **UI** face with letter-spacing, never the display face — they
   are spans and divs, so the element-scoped rule already does the right thing.
   `latin-ext` is still mandatory and still not enough: **neither face ships Cyrillic or Greek**
   (measured, `docs/redesign/README.md` §3a), so in ru/uk/bg/el every such character falls back.
   Naming Archivo inside the UI stack keeps a mixed line on two related faces instead of one brand
   face and one system face. Fixing it properly is open question O5. Never add a face here without
   checking what it actually serves — ask the Google Fonts CSS API, do not assume.
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
- **Web assets live in `public/`, platform bundles in `brand/`.** Nuxt merges every layer's `public/`
  into the consuming app's served root, so `/favicon.ico`, `/icon-192x192.png` and
  `/site.webmanifest` resolve in gymmer-landing AND gymmer-nuxt with no config in either and no
  second copy of the bytes. The Go API's email shell points `EMAIL_LOGO_URL` at the same
  `/icon-192x192.png`. Do not copy these into a consumer's own `public/` — that is the fork this
  layer exists to prevent. Cleanup between runs is file-by-file from the previous
  `geometry.json.generated`, never `rm -rf public/`.

## The one Vue component

`app/components/GmLogo.vue` is the exception to "no Vue components here", and the bar it cleared is
the one stated below: both consumers needed it at the same time. Nuxt auto-registers layer
components, so `<GmLogo />` works in gymmer-landing and gymmer-nuxt with no import and no config.

- **It `v-html`s the mark from `logo.svg?raw`** rather than carrying a copy of the path. The SVG has
  to be inline for the gradient to read the accent tokens, and pasting the geometry into a `.vue`
  file would make a second copy of the artwork that `pnpm brand` could not see.
- **Omit the `size` prop to make it responsive.** `size` renders an inline style, and an inline
  style beats any utility class — `<GmLogo class="[--logo-size:26px] md:[--logo-size:32px]" />` only
  works with `size` unset. `.logo` falls back to 32px.
- **`.logo svg` is a descendant selector, not a child one**, because the mark arrives inside a
  `v-html` wrapper span.

## Adding to the layer

Only things **both** consumers need. A marketing-only wash or an app-only widget belongs in its own
repo. Component classes here are CSS (`.pri`, `.gho`, `.bul`, `.rv`, `.row/.arw`) — there are
deliberately no Vue components yet, because the landing is all page sections and would never consume
them. Vue primitives get built in `gymmer-nuxt` and promoted here only once they've stopped moving
and a second consumer actually exists.

### A layer change is not done until the pin moves

`@gymmer/ui` is consumed by a pinned tag — `github:fitniac/gymmer-ui#vX.Y.Z` —
so the app never sees the layer's `main`. A change there ships as one sequence,
inside the same work item:

> **ui PR merged → tag → bump the pin in gymmer-nuxt.**

Never leave the layer's `main` ahead of the pin across work items. Thirteen
commits accumulated that way once, none of them ever built against the app; the
bump that eventually collects them is then a change nobody reviewed as a change.

The nightly `layer drift` workflow in gymmer-nuxt builds the app against the
layer's `main` and keeps one issue labelled `layer-drift` open while it fails.
It is a safety net for the gap between merge and tag, not permission to live in
it.


## Before reporting something shipped or deployed

Three checks, every time, in every repo the change touched. Each exists because
a report was wrong in exactly this way.

1. **`git status` is clean in every touched repo.** A fix sitting uncommitted in
   the working tree is not shipped, however green the tests were when you ran
   them. The rest-picker's programme write was reported live while its fix was
   still unstaged — production ran the version with the bug.
2. **The SHA you report equals `origin/production`.** Not `main`, not HEAD:
   pushing `main` deploys nothing here.
3. **Every running task's image tag equals that SHA.**

   ```bash
   docker service ps <stack>_<service> --filter desired-state=running \
     --no-trunc --format '{{.Name}}|{{.Node}}|{{.CurrentState}}|{{.Image}}'
   ```

   Read the **IMAGE**, not the STATE. Swarm replaces tasks one at a time, so
   mid-rollout every replica reads `Running` while some still carry the previous
   image — "nothing is Starting" is true in the gaps as well as at the end. A
   health check read at that moment answers from the old binary and looks
   exactly like a verified deploy.

Then verify by behaviour — a real route, a real log line — rather than by the
pipeline going green.
