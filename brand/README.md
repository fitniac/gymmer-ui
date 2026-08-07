# GYMMER brand assets

Everything here is **generated**. The source is [`../app/assets/img/logo.svg`](../app/assets/img/logo.svg)
for the geometry and [`../app/assets/css/tokens.css`](../app/assets/css/tokens.css) for the colour;
the build reads both and writes this directory.

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

Centre (512,512) in a 1024 viewBox. Outer ring R 344 → 280, gap 54, inner ring R 226 → 162; ring
weight 64 throughout, chamfers a true 45°, curves exact arcs tangent to their straights.

Fill is a 45° gradient from `--acc` (top-left) to `--acc-deep` (bottom-right). The mark's bounding
box is square — 168…856 on both axes — so gradient endpoints on the box corners hold 45° at any
size.

**Inline the SVG.** Referenced as `<img src>` it becomes an isolated document that cannot read
`html[data-accent]`, and freezes on light orange. Inlined, it retints with the live accent and theme
for free. `brand/web/favicon.svg` is the exception: a favicon *is* fetched standalone, so that copy
has `data-accent="orange"` pinned and carries its own dark-mode block.

## Sizing: two different measurements

This is the one thing to understand before changing a number in `scripts/generate-brand.mjs`.

The mark's real extent is the **688×688 bounding box**. The chamfered bar tip at (826,168) sits
inside that box, near its top-right corner — so on a square or superellipse canvas nothing can clip
and the box is what gets fitted to the tile.

A **circular** mask is different. The first thing it cuts is that bar tip, 465.8 out on the
diagonal, well past the ring's own 344. Those canvases are fitted to the mark's *circumcircle*
instead. That is why watchOS and the maskables carry visibly more air than iOS does: it is the mask,
not a margin preference. Sizing a circular tile by bounding box shears the bar tip off — the round
Android launcher icon did exactly that before `K.circle` existed.

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

| Path | For | Notes |
|---|---|---|
| `web/favicon.svg` | Modern browsers | Vector, dark-aware, orange pinned |
| `web/favicon.ico` | Legacy + Windows | PNG-in-ICO, 16/32/48 |
| `web/favicon-{16,32,48,96}.png` | Explicit `<link>` sizes | Transparent |
| `web/icon-{72…512}.png` | PWA manifest, `purpose: any` | Transparent |
| `web/icon-maskable-{192,512}.png` | PWA manifest, `purpose: maskable` | Full-bleed ink |
| `web/apple-touch-icon.png` (+152/167/180) | iOS home screen from Safari | Opaque |
| `web/mstile-{70,150,310}.png`, `browserconfig.xml` | Windows tiles | Opaque |
| `web/og-image.png` | Social preview | 1200×630, opaque |
| `web/site.webmanifest` | PWA manifest | Paths assume assets sit at the web root |
| `ios/AppIcon.appiconset/` | Xcode | Full legacy matrix + `Contents.json` |
| `watchos/AppIcon.appiconset/` | Xcode | See the caveat below |
| `macos/AppIcon.icns` + `.iconset/` | macOS | Draws its own squircle — macOS never masks |
| `android/res/mipmap-*/` | Android | Legacy, round, adaptive foreground, monochrome |
| `android/res/mipmap-anydpi-v26/` | Android 8+ | Adaptive icon XML |
| `android/res/values/ic_launcher_background.xml` | Android | Ink as a colour resource |
| `android/play-store-512.png` | Play Console | Opaque |
| `geometry.json` | The verifier | Not an asset; see below |

### Wiring it up

**Web** — copy `web/*` into the consuming app's `public/`. The manifest uses root-absolute paths.

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
