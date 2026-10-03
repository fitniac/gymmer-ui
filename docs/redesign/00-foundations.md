# 00 · Foundations (`@gymmer/ui`)

Boards: **07 Appearance settings**, **08 Motion & theme tokens**, **22 Header logo variants**,
**Type · Archivo + Plex Mono vs Google Sans Flex**. Every other board consumes these.

Lands in this repo as one minor version (`0.3.0`) so `gymmer-nuxt` and `gymmer-landing` can bump
together. Read README §3 first — rows D1–D9 gate parts of this file.

## 1. Token mapping (mockup var → layer token)

Mockups use short CSS vars set by each board's `theme()`. Map them like this; **never** copy the
mockup hex values — the layer's values are contrast-tested and win.

| Mockup var | Layer token | Use |
|---|---|---|
| `--bg` | `--gm-bg` | page ground |
| `--surf` | `--gm-surface` | cards, segmented-control track, inputs |
| `--raised` | `--gm-raised` | chips, ring tracks, bubbles, selected segment |
| `--ink` | `--gm-ink` | primary text, icons |
| `--body` | `--gm-text-body` | paragraph text |
| `--muted` | `--gm-muted` | captions, labels, inactive tab text |
| `--line` | `--gm-hairline` (1px) | card borders, list rules, sheet top edge |
| `--acc` | `--acc` | primary button fill, progress fills, active ring |
| `--on-acc` | `--gm-on-acc` | text/icons on accent fill |
| `--acc-ink` | `--acc-deep` | accent-coloured **text** at body size (links, "See all", timer label) |
| `--acc-soft` | `--acc-soft` | tinted fills only (active tab pill, Nova card, selected row) — never text |
| `--r` | **new** `--gm-radius-card` | cards, media, sheets' inner panels |
| `--rs` | **new** `--gm-radius-ctl` | inputs, small tiles, thumbnails, set cells |
| `999px` | `--gm-radius-pill` | buttons, chips, segmented controls, tab pill |

### New tokens to add

```css
:root {
  /* radius — D1. Values = "soft". Square = 0/0, Round = 20px/12px. */
  --gm-radius-card: 12px;
  --gm-radius-ctl: 7px;
  --gm-radius-sheet: 22px;          /* top corners of bottom sheets */

  /* type — D2/D3 */
  --gm-font-display: "Archivo", system-ui, sans-serif;     /* headlines, big numbers? see §3 */
  --gm-font-ui: "Google Sans Flex", "Archivo", system-ui, sans-serif;

  /* surfaces */
  --gm-scrim: rgba(0, 0, 0, .55);   /* behind sheets and the rest overlay; dark in both themes */
  --gm-glass: color-mix(in srgb, var(--gm-bg) 86%, transparent); /* sticky headers, tab bar, sheet footers */

  /* motion — §5 */
  --gm-ease-out: cubic-bezier(.2, .8, .2, 1);
  --gm-ease-sheet: cubic-bezier(.32, .72, 0, 1);
  --gm-dur-tap: 120ms;
  --gm-dur-enter: 240ms;
  --gm-dur-page: 320ms;
  --gm-dur-sheet: 420ms;
}
```

A user corner preference ("Corners: Square / Soft / Round" on board 07) is written as
`html[data-corners="square|soft|round"]` by the same no-flash script and `useTheme()` that write
`data-theme` and `data-accent` (new storage key `gymmer.corners`, cookie `gm_corners`, keep both lists
in `theme.ts` and `nuxt.config.ts` in sync — see the comment there).

```css
html[data-corners="square"] { --gm-radius-card: 0; --gm-radius-ctl: 0; --gm-radius-sheet: 0; }
html[data-corners="round"]  { --gm-radius-card: 20px; --gm-radius-ctl: 12px; --gm-radius-sheet: 28px; }
```

`--gm-radius-pill` does **not** change with the preference — pills stay pills.

## 2. Accent

- Keep `ACCENTS` closed (D7). The mockup swatches `#ff563c / #c8f031 / #5cc8ff / #a08bff` map to
  Ember (exists), and three proposed palettes **Lime**, **Sky** (or reuse Current), **Violet**. Each
  new palette = `theme.ts` entry + light & dark blocks + `pnpm test:contrast`.
- `--gm-on-acc` must be chosen per palette by luminance: lime needs dark text in **both** themes.
  The mockups compute this live (WCAG relative luminance > 0.179 → dark text); in the layer it is a
  per-palette constant, checked by the contrast test.
- Accent budget per screen (non-negotiable 7 still applies): one filled primary action, active
  states, progress fills, one tinted panel (Nova or Pro). Everything else is ink.

## 3. Typography

| Role | Face | Size / weight / extras | Example |
|---|---|---|---|
| Display XL (marketing hero) | Archivo | 46 mobile / 64–72 desktop · 800 · `font-stretch:116%` · `-0.03em` · line-height .95 | "Train with a plan, not a guess." |
| Page title (H1) | Archivo | 32–34 · 800 · `font-stretch:112%` · `-0.02em` | "Progress", "Hello, Igor." |
| Section title (H2) | Archivo | 17–22 · 800 · `font-stretch:108–112%` | "Watch it. Lift it.", "Variations" |
| Card title | UI | 16–17 · 700–800 | "Chest Day" |
| Body | UI | 15 · 400 · line-height 1.45–1.5 | Nova messages, steps |
| Caption | UI | 13 · 400 · `--gm-muted` | "4 exercises · 10 sets · ~45 min" |
| Label / eyebrow | UI | 10–11 · 500–600 · uppercase · `letter-spacing:.07–.1em` · `--gm-muted` | "EXERCISE 2 OF 4", "SPEED KM/H" |
| Tab label | UI | 11 · 600 (active 700) | "Programs" |
| Timer / stat numerals | UI (approved B) | 46–58 · 800 · `font-variant-numeric: tabular-nums` · `-0.02em` | "1:30", "3:12" |

Rules:
- Add a utility/rule so `h1, h2, h3` and the `.display` class use `--gm-font-display`; everything
  else inherits `--gm-font-ui` from `body`. Uppercase labels must **not** pick up the display face.
- All numbers that update live (timers, weights, reps, volume) use `tabular-nums`.
- **Fonts config** (`nuxt.config.ts` in this repo): add `{ name: 'Google Sans Flex', provider:
  'google', global: true, weights: [400, 500, 600, 700, 800] }` — **no `subsets`**.
  Remove nothing yet; drop Plex Mono (never added to the layer).
  *Corrected 2026-10-03 after building it:* `subsets: ['latin','latin-ext']` on this family is
  **inert** — the build is byte-identical with and without (15 files, 343 KB, 8 scripts), because
  Google serves it from the variable-font endpoint rather than as per-subset static files and
  @nuxt/fonts cannot slice that. Leaving the option in would read as a restriction that is in force.
  It is not a payload problem: 50 of the 55 emitted `@font-face` blocks carry a `unicode-range`, so a
  browser only fetches the subsets the page's text needs.
  **Measured 2026-10-03 (README §3a): Google Sans Flex serves no Cyrillic and no Greek — and neither
  does Archivo.** So there is nothing to scope with `html:lang(...)` here: `ru`, `uk`, `bg` and `el`
  already fall through `--gm-font-ui` to `system-ui` today and will continue to, unchanged. Do not
  request `cyrillic`/`greek` subsets for either family — @nuxt/fonts cannot fetch what Google does
  not serve, and asking for them makes the config claim a coverage the build does not have. Giving
  those four locales a UI face of their own is open question **O5**, not part of 1.3.
- Cormorant Infant / EB Garamond stay for quotes (Nova's italic line on Home and the rest sheet).

## 4. Colour, surfaces, elevation

- Surfaces separate by tone: `--gm-bg` page → `--gm-surface` card → `--gm-raised` chip/track. Cards
  get a 1px `--gm-hairline` border only when they sit on the same tone as their neighbour.
- Sticky header, tab bar and sheet footers: `--gm-glass` + `backdrop-filter: blur(18–20px)` +
  1px `--gm-hairline` edge. Provide a solid fallback when `backdrop-filter` is unsupported.
- Marketing backgrounds (Home, Desktop Home, Desktop Library): very faint accent radial gradients
  (6–10% accent into transparent, 600–1100px radius) and a masked 135° hairline pattern
  (`--gm-ink` at 5%, 1px every 16px) behind hero/"How it works". Never behind app screens.
- Offset shadows (D5) are removed from app surfaces. The only soft shadow kept is on the selected
  segment of a segmented control (`0 1px 3px` of `--gm-sh`).

## 5. Motion (board 08)

| Motion | Spec | Where |
|---|---|---|
| Tap feedback | 120ms ease-out, scale .95–.97 on `:active` | every tappable surface |
| Page push | 320ms `--gm-ease-out`, cross-document View Transitions | route changes on web; Capacitor uses the same CSS |
| Shared element | exercise thumbnail morphs into the exercise hero video; `view-transition-name: ex-<id>` | list → exercise page, list → exercise sheet |
| Bottom sheet | 420ms `--gm-ease-sheet` up; scrim fade 200ms; drag to dismiss | exercise sheet, start-workout sheet, Pro sheet, rest overlay |
| List enter | 240ms rise 8–14px, 30ms stagger, first 8 items only, once per view | lists, tiles |
| Collapsing title | scroll-driven (`animation-timeline: scroll()`), 34px → 17px into the nav bar, opacity only fallback | Library, Progress, Programs |
| Ken Burns | 6–9s alternate, scale 1.02 → 1.18 | featured exercise cards (Home), active-workout thumb, sheet video |
| Live pulse | 2s opacity 1 → .55 | "● RUNNING", rest "● RESTING" |
| Reduced motion | every motion becomes a 150ms fade; no zoom, no pulse, video does not autoplay | global |

This replaces the 0.7s reveal in `useReveal()` for app screens; marketing sections may keep 0.7s.

## 6. Icons and brand marks

- Lucide stays the icon set (stroke 2–2.25, 16–22px, `currentColor`).
- **Two custom glyphs** (D8), added to `icons.ts` as inline-SVG entries so the "unknown name throws"
  guard still applies:
  - `gymmer-g` — the single-ring G from `merch/svg/gymmer-wordmark-mark-g-single-accent.svg`,
    viewBox `140 140 748 748`, `fill: currentColor`. Used at 19px on the Today tab and 30px nowhere
    else now.
  - `barbell` — viewBox `0 0 32 32`, `fill: currentColor`, bar `x1.5 y14.6 w29 h2.8 rx1.4`, outer
    plates `w4 h15` at x5 and x23 (y8.5, rx1.6), inner plates `w3 h10` at x10 and x19 (y11, rx1.3).
    30px inside the 56px Train button.
- Header logo (board 22, variant A — approved): G mark 20px in `--acc` + "YMMER" letters 97×20 in
  `currentColor`, gap 1px (G viewBox `144.57 144.59 737.94 734.81`).
  **Optical correction (variant A6, chosen):** the G is drawn 2.5% larger than the letters (20.5px at
  a 20px lockup) with its top aligned to the letters, so it drops 0.5px below the YMMER baseline —
  the round letter needs overshoot to look the same height. Implement as `height: 1.025em` on the
  mark + `margin-bottom: -0.025em` inside a lockup sized in `em`, so it scales with the logo. No shadow
  (shadow variants A1–A4 were tried and rejected; see design board 22b). This is a
  **second `GmLogo` variant** (`<GmLogo variant="wordmark-g" />`), still `v-html` from a raw SVG in
  `app/assets/img/`, never `<img>`. Keep the existing gradient mark for app icons.

## 7. Media

- Exercise media is **3:4** everywhere (cards, thumbs, hero, sheet video). Muscle, equipment and
  **goal** tiles are **1:1**. Program thumbs inside the app stay `ProgramThumb` (generated body
  figure); **public program covers are 3:4** (cards, detail hero, program widget).
- Article covers are **3:2** (cards, phone hero); the desktop article hero is **21:9**. Article list
  rows on phone use a 108px-wide 3:2 thumb.
- Text over covers sits on a bottom gradient (transparent → 74% black over the lower ~58%), labels
  on media use the dark translucent pill (`--gm-media-badge`).
- Thumbnail sizes (mobile): list row 72×96, program row 66×88, active workout 78×104, variant row in
  sheet 60×80, desktop list view 48×64. Grid cards fill the column.
- Every tappable exercise thumbnail carries the **expand badge**: 24px circle, `rgba(0,0,0,.6)`
  (add as token `--gm-media-badge`), 1px light ring, Lucide `maximize-2` 11px white, bottom-right
  inset 5px. It means "opens the exercise sheet" and is the same everywhere.
- Video: muted, looping, `playsinline`; never autoplays under reduced motion; poster first.

## 8. Layout and breakpoints

| Name | Width | Shell |
|---|---|---|
| phone | < 768 | bottom tab bar, single column, 16–20px gutters |
| tablet | 768–1199 | left rail (72px) with the G Train button, 2 panes where specified, 28px gutters |
| desktop | ≥ 1200 | sticky top header, 1200–1240px centred column, 32px gutters |

The current app hides the tab bar at `md` and shows the header; the tablet rail is new
(see `screens/01-app-shell.md`).

## 9. Accessibility (unchanged rules, restated for the new pieces)

- Text on `--acc` uses `--gm-on-acc`; accent text uses `--acc-deep`.
- Segmented controls are `role="tablist"`/`tab` with `aria-selected`; filter chips are buttons with
  `aria-pressed`; the corner/accent/mode pickers are radio groups.
- Sheets are `role="dialog" aria-modal="true"`, trap focus, close on Escape, return focus to opener.
- Live timers announce at most once per phase change (`aria-live="polite"` on the label, not on the
  ticking digits).

## Acceptance

- [ ] `tokens.css` has the new tokens; `pnpm test:contrast` passes for every palette, both themes.
- [ ] `data-corners` works SSR + no-flash, and all three values render without layout shift.
- [ ] Google Sans Flex loads in production build (not only on a dev machine) for every shipped locale.
- [ ] `GmLogo variant="wordmark-g"` renders the G and letters on one baseline at 20px.
- [ ] `icons.ts` exposes `gymmer-g` and `barbell`.
- [ ] Version bumped; README of this repo lists the new tokens.
