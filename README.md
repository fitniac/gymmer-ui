# @gymmer/ui

The GYMMER design system, packaged as a **Nuxt 4 layer**. Tokens, light/dark + three accents,
the Tailwind v4 theme mapping, the shared component classes, the logo and its generated icon set,
and the contrast guard.

Consumed by `gymmer-landing` (interim marketing site) and `gymmer-nuxt` (the app). It exists so
those two cannot fork the tokens — the first time someone retunes a colour in one repo and not the
other, the brand is two brands.

The brand name is **GYMMER**, uppercase, always. Lowercase `gymmer` appears only as an identifier
(`@gymmer/ui`, repo names, the `--gm-*` prefix), never as the brand.

## What's in it

| Path | Contents |
|---|---|
| `app/assets/css/tokens.css` | The tokens. `:root`, `html[data-theme="dark"]`, three accent palettes × light/dark, and the `body`/`a`/`::selection`/`:focus-visible` base. |
| `app/assets/css/gymmer.css` | Tailwind v4 `@theme` mapping of every token, the type scale, two radii, offset shadows, breakpoints, keyframes, the `wash-stripe*` / `photo` utilities, and the component classes `.pri` `.gho` `.bul` `.rv` `.row/.arw` `.logo/.logo-type`. |
| `app/assets/img/logo.svg` | The mark. Token-driven: its fill is a 45° gradient from `--acc` to `--acc-deep`, so it retints with the live accent and theme. The only hand-authored artwork in the repo. |
| `brand/` | 85 generated rasters + manifests for web, PWA, iOS, watchOS, macOS and Android. Built by `pnpm brand`; never edited by hand. [brand/README.md](brand/README.md). |
| `scripts/generate-brand.mjs` | Rasterises `brand/` from the SVG and the tokens, via headless Chrome over CDP. |
| `scripts/verify-brand.mjs` | Decodes every generated PNG and holds it to the geometry the generator declared. |
| `app/utils/theme.ts` | The accent + theme registry, cookie/storage key names. |
| `app/composables/useTheme.ts` | Live theme + accent state, persisted to cookie and localStorage, follows the OS while the preference is `system`. |
| `app/composables/useReveal.ts` | Scroll reveals — any element with class `rv` settles once as it enters the viewport. Honours `prefers-reduced-motion`. |
| `app/plugins/theme.ts` | Server-only. Seeds `data-theme` / `data-accent` into the SSR response. |
| `nuxt.config.ts` | `@nuxt/fonts` (Archivo + Cormorant Infant, self-hosted), `<meta name="color-scheme">`, and the blocking no-flash script. |
| `test/contrast.test.mjs` | WCAG guard: parses `tokens.css` directly and asserts every accent × theme combination. |

## Consuming it

`package.json`:

```json
{ "dependencies": { "@gymmer/ui": "github:fitniac/gymmer-ui#v0.1.0" } }
```

`nuxt.config.ts` — resolve by **real** path, never the bare specifier:

```ts
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

const uiLayer = realpathSync(resolve(__dirname, 'node_modules/@gymmer/ui'))

export default defineNuxtConfig({
  extends: [uiLayer],
  css: [resolve(__dirname, './app/assets/css/main.css')],
  vite: { resolve: { dedupe: ['vue', 'vue-router', 'pinia'] } },
})
```

Your `app/assets/css/main.css` owns the single Tailwind import:

```css
@import 'tailwindcss';
@import '@gymmer/ui/app/assets/css/tokens.css';
@import '@gymmer/ui/app/assets/css/gymmer.css';
@source "../../../node_modules/@gymmer/ui/app/**/*.{vue,ts}";
/* app-specific CSS below */
```

Add `shamefully-hoist=true` to `.npmrc`, then call `useTheme()` once (a layout or your index page)
and both axes are live.

### Local development against a checkout

Gitignored `pnpm-workspace.yaml` in the consumer, seeded from a committed `.example` by
`make workspace`:

```yaml
overrides:
  "@gymmer/ui": "link:../gymmer-ui"
```

pnpm applies the override before git resolution, so the container never needs GitHub credentials.
This is the same **Mode B** arrangement `gymtracer/admin` uses for `@redelay/js-admin` — the
canonical writeup is `redelay/spec/docs/7.admin/07.consuming-the-base-layer.md`.

### Six ways this goes wrong

Every one of these was hit while wiring up the first consumer.

1. **`extends: ['@gymmer/ui']`** — a bare specifier fails. The package has no `exports`/`main`;
   Nuxt errors with `Cannot extend config from @gymmer/ui`. Resolve the real path instead.
2. **Skipping `realpathSync`** — Nuxt registers `~`/`@` against the pnpm symlink while Vite loads
   real paths, and the layer's own relative imports break.
3. **`@source` pointing at the sibling checkout** instead of `node_modules/@gymmer/ui` — works in
   dev with the link override, renders unstyled in CI where only the tag is fetched.
4. **Importing Tailwind here** — two `@import 'tailwindcss'` in one build means two instances of the
   framework. That is why this layer sets no `css:` and the consumer owns the entry point.
5. **Forgetting the layer's own module deps.** This layer lists `@nuxt/fonts` in `modules`, but a
   linked or tarball-fetched layer's `node_modules` is *not* on the consumer's resolution path, so
   the consumer must install `@nuxt/fonts` too. Symptom:
   `The module @nuxt/fonts could not be loaded`. Same reason `gymtracer/admin` duplicates
   `@nuxt/ui` and `pinia`.
6. **Committing a lockfile written on a machine with a git `insteadOf` rule.** This org's Go setup
   sets `url.git@github.com:.insteadOf https://github.com/`, which rewrites pnpm's HTTPS URL to SSH
   *as the lockfile is written*. That SSH URL is then baked in, and every machine without those keys
   — the Docker image, CI — dies with `error: cannot run ssh: No such file or directory` from deep
   inside pnpm. Regenerate with `GIT_CONFIG_GLOBAL=/dev/null` (the consumer's
   `pnpm lockfile:refresh` does this) so the lockfile pins the public codeload tarball over plain
   HTTPS — no git, no ssh, no credentials.

Likewise: **never commit a lockfile written with the `link:` override active.** It records
`link:../gymmer-ui`, and the image build fails with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Install
with `--no-lockfile` whenever the override is in place.

To verify the whole set: build with the `link:` override **deleted**, then build the container
image, and check the emitted CSS contains `.pri{` and the same byte count both times.

## Design rules

Non-negotiable, because they are what makes the accent swap and dark mode work at all. Full
rationale in `CLAUDE.md`.

1. **Tokens only.** Never a hex, `rgba()` or named colour in a component. If you reach for a `dark:`
   utility, a token is missing.
2. **Two radii.** `0` for everything structural, `999px` for primary actions and switches. Nothing
   between.
3. **Rules, not shadows, organise the page.** 2px `--gm-divider` between sections, 1px
   `--gm-hairline` inside lists.
4. **Offset shadows only** — `5px 5px 0` on buttons, `12px 12px 0` on framed cards,
   `-8px 8px 0` on corner badges. `--shadow-bubble` is the single exception.
5. **Type**: Archivo everywhere, Cormorant Infant italic for quotes and section leads. Both must
   keep `latin-ext`.
6. **Icons**: Lucide, stroke `2.25`, 14–20px, `currentColor`.
7. **GYMMER is uppercase, always.** No lowercase or title-case form of the brand name exists.
8. **The mark is inlined SVG**, never `<img src>` — an external image cannot read the accent tokens.

## The logo

Inline the SVG — do not reference it with `<img src>`. Its fill is a 45° gradient between `--acc`
and `--acc-deep`, and an external image is an isolated document that cannot read
`html[data-accent]`, so it would sit on light orange while the rest of the page retints.

```html
<a class="logo" href="/" style="--logo-size: 40px">
  <!-- contents of app/assets/img/logo.svg -->
  <span class="logo-type">GYMMER</span>
</a>
```

Everything scales off `--logo-size`. Add `logo-inv` on the always-dark Pro card, and `logo-type-sm`
on the wordmark to drop it below 560px, where the mark still reads and the wordmark does not.

## Icons

```bash
pnpm brand          # regenerate brand/ from the SVG + tokens, then verify
pnpm brand:verify   # verify only
```

85 rasters covering web and PWA, iOS, watchOS, macOS and Android, plus `site.webmanifest`,
`browserconfig.xml`, both `.appiconset` catalogs, the Android adaptive-icon XML and an `.icns`.
Nothing under `brand/` is hand-edited — the colours come from `tokens.css` and the geometry from the
SVG, so retuning either and re-running is the entire update procedure.

The generator declares the geometry it intends to produce in `brand/geometry.json`, and the verifier
decodes the actual pixels to check span, centring, alpha channel and mask clearance against it. That
is not belt-and-braces: a wrong icon looks perfectly normal in a file listing, and three separate
bugs got through review that way — a crop mistaken for a scale, a mark sheared by a circular mask,
and the literal word `undefined` rendered into all ten macOS icons. `pnpm brand` fails on mismatch.

Details, per-platform wiring, and the known caveats (no iOS 18 dark/tinted variants; the watchOS
legacy `Contents.json` is unvalidated against Xcode) are in [brand/README.md](brand/README.md).

## Adding an accent

One entry in `app/utils/theme.ts`, light and dark blocks in `tokens.css`, then `pnpm test:contrast`.
The tuning recipe (how to derive `deep`/`hover`/`soft`/`tint` from a base) is in the comment at the
bottom of the accent section in `tokens.css`.

## Contrast

```bash
pnpm test:contrast
```

Reads `tokens.css` directly, so a retuned neutral cannot ship broken. Four light-mode combinations
inherited from the original design bundle sit below the ratios the spec asks for; they are recorded
as **known gaps** with their measured values and ratcheted against regression rather than hidden.
Closing them means retuning brand colour — a design decision, not a code one. Dark mode passes
every rule.
