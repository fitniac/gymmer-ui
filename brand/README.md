# GYMMER brand assets

Everything here is **generated**. The source is [`../app/assets/img/logo.svg`](../app/assets/img/logo.svg)
for the geometry and [`../app/assets/css/tokens.css`](../app/assets/css/tokens.css) for the colour;
the build reads both and writes the layer's `../public/` (web) and this directory (native).

```bash
pnpm brand          # regenerate, then verify
pnpm brand:verify   # verify only
```

Editing a PNG here is always the wrong move — the next `pnpm brand` overwrites it. Change the SVG or
the token and re-run.

## The name

The brand name is **GYMMER**, uppercase, always. There is no lowercase or title-case form. The
`.logo-type` class in `gymmer.css` applies `text-transform: uppercase` so a consumer that writes
`Gymmer` in a template still renders correctly, but write it uppercase anyway.

Lowercase `gymmer` survives only as an *identifier*: the package name `@gymmer/ui`, the repos
`gymmer-nuxt` / `gymmer-landing`, the `--gm-*` token prefix, filenames. Those are not the brand.

## The mark

Centre (512,512) in a 1024 viewBox. **One ring**, R 367.43 → 256.59: a stroke 110.84 wide, 0.151 of
the mark's 734.86 diameter. Chamfers a true 45°, curves exact arcs tangent to their straights.

**It was a double ring until 2026-10-30.** The watch app had shipped this single-line one since its
first build, and `app/assets/img/gymmer-g.svg` — which `GmMark` renders in the app's tab bar — has
carried it here all along. Only `logo.svg` was behind, so the same product drew the mark at two
weights on one screen for weeks. `generate-brand.mjs` now refuses to run when those two files
disagree.

The difference is not a restyle: 0.151 against 0.093 is **1.6× the ink**. Thinning or thickening
the ring is the one edit that changes which mark this is.

**The extent is NOT square** — 144.57…882.51 across, 144.59…879.41 down — because the chamfered bar
tip now reaches past the ring's right edge instead of sitting inside it. `BBOX` is the larger of the
two, 737.94, because that is what `verify-brand.mjs` measures. Both it and `CIRCUM` are read off
`gymmer-g.svg`'s viewBox rather than transcribed, and **both must be re-derived when the path
changes**: they feed `byBox()` and `byCircle()`, which set every icon's inset. A path swapped under
stale numbers regenerates all 85 rasters with correct colours and 7% wrong insets, and the generator
reports success — measured, 2026-10-30: 75 of 85 failed verification while `generate` exited 0.

Fill is a 45° gradient from `--acc` (top-left) to `--acc-deep` (bottom-right). Because the box is
not square, the endpoints sit on the corners of the **square** 144.57…882.51, which covers the mark
and keeps dx equal to dy — endpoints on the mark's own corners would be a few degrees off 45, in a
direction nobody would look for.

**Inline the SVG.** Referenced as `<img src>` it becomes an isolated document that cannot read
`html[data-accent]`, and freezes on light orange. Inlined, it retints with the live accent and theme
for free. `../public/favicon.svg` is the exception: a favicon *is* fetched standalone, so that copy
has `data-accent="orange"` pinned and carries its own dark-mode block.

## Sizing: two different measurements

This is the one thing to understand before changing a number in `scripts/generate-brand.mjs`.

The mark's real extent is **737.94 × 734.81**, and `BBOX` is the larger of the two. On a square or
superellipse canvas nothing can clip a corner, so the box is what gets fitted to the tile.

A **circular** mask is different. The first thing it cuts is the chamfered bar tip at (882.51,
144.59), **521.8 out on the diagonal** — well past the ring's own 367.43, and past the canvas's own
half-width of 512, which is why it is the part that goes. Those canvases are fitted to the mark's
*circumcircle* instead. That is why watchOS and the maskables carry visibly more air than iOS does:
it is the mask, not a margin preference. Sizing a circular tile by bounding box shears the bar tip
off — the round Android launcher icon did exactly that before `K.circle` existed.

Under the double ring the tip sat **inside** the bounding box; under this mark it reaches past the
ring's right edge, which is why the box is no longer square and why `CIRCUM` has to come from the
tip rather than from the radius.

| Context | Fitted to | Fraction | Why that number |
|---|---|---|---|
| Transparent web / PWA `any` | bounding box | 0.94 | No mask, no ground — run it close to the edge |
| iOS, macOS, Android legacy, Play, apple-touch, mstile | bounding box | 0.82 | The 22.37% superellipse never reaches this |
| watchOS, Android round | circumcircle | 0.92 | Full-bleed circular mask |
| PWA maskable | circumcircle | 0.80 | Spec guarantees only the centre 80% circle |
| Android adaptive foreground / monochrome | circumcircle | 66/108 | 108dp drawable, 72dp visible, 66dp safe circle |

## Ground

Opaque contexts use an ink tile — `--gm-ink` `#201e1d` — with the accent gradient mark on top. One
tile that reads the same on a light or a dark home screen.

The rasters bake the **orange** palette, since `DEFAULT_ACCENT` is orange and a PNG cannot read CSS.
Green and cyan sets are one command away: change the accent the generator reads (`ACC` / `ACC_DEEP`
near the top of the script) and point `OUT` somewhere else.

## What's here

Web assets are **not** in this directory — they are written to the layer's `../public/`, which Nuxt
merges into the served root of every consuming app. That is what makes `/favicon.ico` resolve in
gymmer-landing and gymmer-nuxt without either repo holding a copy of it.

| Path | For | Notes |
|---|---|---|
| `../public/favicon.svg` | Modern browsers | Vector, dark-aware, orange pinned |
| `../public/favicon.ico` | Legacy + Windows | PNG-in-ICO, 16/32/48 |
| `../public/favicon-{16,32,48,96}.png` | Explicit `<link>` sizes | Transparent |
| `../public/icon-{72…512}.png` | PWA manifest, `purpose: any` | Transparent. `icon-192x192.png` is also the email logo |
| `../public/icon-maskable-{192,512}.png` | PWA manifest, `purpose: maskable` | Full-bleed ink |
| `../public/apple-touch-icon.png` (+152/167/180) | iOS home screen from Safari | Opaque |
| `../public/mstile-{70,150,310}.png`, `browserconfig.xml` | Windows tiles | Opaque |
| `../public/og-image.png` | Social preview | 1200×630, opaque |
| `../public/site.webmanifest` | PWA manifest | gymmer-nuxt uses @vite-pwa's generated one instead |
| `ios/AppIcon.appiconset/` | Xcode | Full legacy matrix + `Contents.json` |
| `watchos/AppIcon.appiconset/` | Xcode | See the caveat below |
| `macos/AppIcon.icns` + `.iconset/` | macOS | Draws its own squircle — macOS never masks |
| `android/res/mipmap-*/` | Android | Legacy, round, adaptive foreground, monochrome |
| `android/res/mipmap-anydpi-v26/` | Android 8+ | Adaptive icon XML |
| `android/res/values/ic_launcher_background.xml` | Android | Ink as a colour resource |
| `android/play-store-512.png` | Play Console | Opaque |
| `geometry.json` | The verifier | Not an asset; see below |

### Wiring it up

**Web** — nothing to do. The layer's `public/` is already merged into each app's served root; just
reference `/favicon.svg`, `/icon-192x192.png` and friends from `useHead`. Do **not** copy them into
a consumer's own `public/`.

**Email** — the Go API defaults `EMAIL_LOGO_URL` to `PUBLIC_URL + /icon-192x192.png`, which resolves
because of the above. Mail clients fetch it over the network, so it has to be an absolute,
publicly reachable URL — a localhost value renders as alt text in a real inbox.

**iOS / macOS** — drag the `.appiconset` / `.icns` into the Xcode asset catalog.

**Android** — copy `android/res/` over `app/src/main/res/`.

## Caveats

- **watchOS `Contents.json` is the modern single-size form** — one 1024 that Xcode 15+ derives the
  rest from. Every legacy size is still rendered, and `Contents.legacy.json` holds the full
  role/subtype matrix, but that file has not been opened by a real Xcode. If you target an older
  asset catalog, swap it in and let Xcode validate before trusting it.
- **No iOS 18 dark or tinted variants.** Only the light appearance is generated, so iOS derives the
  other two itself. Adding them means two more 1024s — dark and a greyscale tinted, both with
  transparent backgrounds — plus `appearances` entries in `Contents.json`.
- **The 16px favicon is soft.** Ring weight is 64/1024, which lands on a single pixel at that size.
  It is rendered from vector rather than downsampled, which is as good as it gets without a
  hand-hinted 16px variant.
- **macOS `.icns` needs `iconutil`**, so that one file only builds on a Mac. The generator warns and
  continues elsewhere; the `.iconset` PNGs are written either way.
- **The squircles are rounded rectangles**, not true superellipses. Visually indistinguishable at
  icon sizes and standard practice, but it is an approximation.

## How this is verified

`scripts/verify-brand.mjs` decodes every PNG and measures it. A wrong icon looks entirely normal in
a file listing, so names, counts and byte sizes prove nothing. Three real bugs got through review
and were caught here:

1. Every SVG was emitted at a fixed `width="1024"`, making each capture a top-left **crop** of a
   1024 render instead of a scaled one.
2. The Android round tile was fitted to the bounding box under a circular mask, shearing off the
   bar tip.
3. A style helper returned a bare string instead of `{svg, markBox, maskR}`, so the word
   **`undefined`** was rendered into all ten macOS icons — and because the claim came out `NaN`,
   every numeric check passed silently.

So the generator now writes `geometry.json` stating what each file should be, and the verifier
independently checks the pixels against it: dimensions, alpha channel present or absent as the
platform requires, the mark's measured span, its centring, and — for circular contexts — that
nothing reaches past the mask radius. `pnpm brand` runs both and fails the build on any mismatch.
