# 01 · Shared components (`gymmer-nuxt/app/components`)

Build or refactor these before the screens. Per `gymmer-ui/CLAUDE.md`, Vue components live in
`gymmer-nuxt` and get promoted to the layer only once a second consumer needs them (the landing does
not), so everything here is in `gymmer-nuxt` unless marked **layer**.

Legend: **Reuse** = no change beyond tokens · **Refactor** = same component, new look and/or API ·
**New** = does not exist.

## Names — the code wins

The boards were drawn with their own vocabulary, and three of those words already mean something
else in `gymmer-nuxt`. **The code's names are canonical**; this table is the map, and the rest of
these specs use the code's names from here on.

| Board / earlier draft | In the code | Why |
|---|---|---|
| `ghost` (borderless text in `--acc-deep`) | **`variant="text"`** | `ghost` is already a bordered pill with 174 call sites |
| `icon` (44px circle) | **`shape="icon"`** | `chip` is already the square icon button; shape and variant are separate axes |
| `secondary` | `variant="secondary"` | no collision — same word, same thing |
| "remove the offset shadow (D5)" | **`flat`** prop | marketing and app share one build, so it is a per-call-site choice, not a global switch |

Our existing `ghost` (bordered pill), `quiet` (borderless muted) and `danger` are unchanged and keep
their names. When a board says "ghost", it means `text`.

**Component shape — sibling or prop?** *Sibling when the layout changes; prop when only the styling
does.* `ExerciseCard` gets a sibling (`ExerciseCardV2`, deleted and renamed back by the screen phase
that adopts it) because the redesign changes its structure. `GmBodyMap` gets a prop (`scale="ramp"`)
because only the colouring changes and **the engine must not fork**. `ExerciseThumb` stays one
component with additive props — and the one prop that *would* have changed its layout, the
expandable thumb-as-button, moved out into the new `ExerciseRow` instead, which is the same rule
applied one level up.

---

## Text colour inside a link — set it

The layer colours every `<a>` with `--acc-deep` (`tokens.css`), and the redesign's cards and rows
are links wrapping a block of text. So a name inside one is **already the accent at rest**: the
hover state has nowhere to go, and a list of rows reads as a column of red headlines. Nothing fails
— it renders, in the right font, at the right size.

Every new component sets the resting colour explicitly on text inside a link (`text-ink`, or
whatever the design calls for) and leaves the accent to `group-hover:` / `group-focus-within:`.
Found twice while building 2.5, in `ExerciseCardV2` and `ExerciseRow`, both times only by measuring
the computed colour before and after focus rather than by looking at it.

## Navigation

### `AppTabBar.vue` — Refactor
Board: bottom bar on 09, 10, 11, 18 (and every tabbed screen).
- 5 items in a `repeat(5, 1fr)` grid: **Today** (`gymmer-g`, 19px) → `/dashboard` · **Programs**
  (`clipboard-list`) · **Train** (centre) → opens the start-workout sheet, or `/tracking` if a session
  is open · **Library** (`book-open`) → `/exercises` · **Coach** (`sparkles`). Progress tab removed
  (README D8); `/progress` stays reachable from Today and the desktop header.
- Item: 52×30 icon pill + 11px label. Active: pill `--acc-soft`, icon `--acc-deep`, label `--gm-ink`
  700. Inactive: `--gm-muted` 600.
- Train: 56px circle, `--acc` fill, `--gm-on-acc` barbell 30px, raised 14px above the bar
  (`margin-top:-14px`), ring `0 0 0 3px var(--gm-bg), 0 0 0 4px var(--gm-hairline)`. Label is
  `aria-label` only. When a workout is running, show a 6px live dot top-right (pulse, §5).
- Bar: 84px incl. safe area, `--gm-glass` + blur, 1px top hairline (was 2px divider).
- Keep `data-testid`s; update e2e selectors for the removed Progress tab.

### `AppRail.vue` — New (tablet **and desktop**, 768 up)
Boards: T1–T4 left rail (collapsed) · D3–D5 `DeskToday` sidebar (expanded).

**Collapsed, 768–1199 — 88px.** Logo G at top, the 56px Train circle, then Today / Programs /
Library / **Progress / Coach** as 56px icon+label stacks, avatar at the bottom. Active item: the
whole 80px stack fills with `--acc-soft`, icon `--acc-deep`, label `--gm-ink` 700.

**Expanded, ≥1200 — 240px.** The `wordmark-g` lockup at top, the primary **"Start workout"** pill
(48px, `--acc`, G + label), the same five items as 44px rows with the label beside the icon at 15px,
avatar at the foot. Active row: `--acc-soft` ground, icon `--acc-deep`, label `--gm-ink`. Hover:
`--gm-surface`.

**88px, per the board** (ruled 2026-10-04; an earlier 80 was wrong). The item fills the column bar
4px a side, which gives a collapsed label **80px** — more than the phone bar's 72.00 at 360, so a
word that fits a phone cannot fail on a tablet. The measured active-only fallback stays as the
safety net, and applies only to the collapsed form: expanded, the label sits beside its icon in
240px and the question does not arise.

**Progress sits fourth, before Coach.** One order for one set of destinations.

**In the layout's flow, not fixed.** `layouts/app.vue` is a row: rail, then the content column.
A fixed rail would make the page reserve its width with a matching padding — two numbers in two
files that have to agree, and one of them silently wrong the moment the rail's width changes, as it
has twice.

**Left edge:** `env(safe-area-inset-left)` as well as top and bottom — the rail is the one piece of
chrome a landscape notch reaches.

### `AppHeader.vue` — Refactor, now the phone brand row only
44px sticky row, `--gm-glass`: `GmLogo variant="wordmark-g"` left, the 44px avatar right →
`/preferences`. Below 768 only.

**The signed-in desktop shell is the sidebar, not a top bar** (ruled 2026-10-04, closing the
question 3.2 left open). `DeskToday.dc.html` draws a 240px left column, and that also makes a
desktop and a tablet one navigation at two widths rather than two navigations — so it is
`AppRail`'s expanded form, and this component's desktop row is retired. 3.2 shipped a 68px top bar;
3.2b replaces it.

**The public, signed-out site keeps its top header** (D10). That is `SiteNav.vue` and nothing here
touches it.

**Search is deferred to Phase 6** (ruled 2026-10-03). The 280px pill has no backend behind it yet,
and a search field that searches nothing is worse than no field.

**"Start workout"** is the sidebar's primary action and goes to `/tracking` until 3.6 gives it a
start-workout sheet.

---

## Exercise media and cards

### `ExerciseThumb.vue` — Refactor, and it stays **presentational**
- Add sizes: `xs` 48×64 · `sm` 60×80 · `md` 66×88 · `lg` 72×96 · `xl` **80**×107 (keep `width` prop
  as the mechanism; sizes are presets). `xl` is 80 rather than the drafted 78 because 80 is what
  three screens ship today, and nothing in the redesign asks for two pixels less — that makes the
  migration of the existing call sites pixel-exact instead of nearly so.
- Radius `--gm-radius-ctl`, behind a `rounded` prop that is **off by default**. Phase 2 restyles
  land as opt-in, and the current call sites are square; `ExerciseRow` and `ExerciseCardV2` turn it
  on, so a screen picks up the corners when it adopts them.
- The old `sm | md` ramp reused two of these names at other values (48 and 80), so the four existing
  call sites moved to the names that keep their pixels: old `sm` → `xs`, old `md` → `xl`. Leaving
  them alone would have silently shrunk three screens.
- New prop `badge?: 'expand'` → draws the expand badge (foundations §7). **Visual only.** It does
  not make the thumb a button and emits nothing: the thumb is an image with a label on it, and a
  component that is sometimes an image and sometimes a button has two different tab orders
  depending on a prop.
- New prop `live?: boolean` → slow Ken Burns on the picture (active workout only).
- Keep the initials-over-muscle-hue fallback; it is still the common case.

### `ExerciseRow.vue` — New
Board 03 list rows, and the swap/add sheets.

**Two targets per row — thumb opens the exercise sheet, text goes to the exercise page** — and this
component is where that rule lives, because "never nest them" is something one component can
*enforce* and two cooperating ones can only hope for. It owns the thumb `<button>` (emits `open`)
and the title `<a>` (the page link) as siblings, so neither can end up inside the other.

- Slots: `meta` (the muscle · equipment line, counts, level) and `action` (a trailing control —
  chevron, add, swap, overflow).
- Props: `exercise`, `size` (passes through to `ExerciseThumb`), `live`.
- The thumb renders with `badge="expand"` because in a row it *does* open the sheet; the badge is
  the row's statement, not the thumb's.
- No existing call site changes in Phase 2. Screens adopt `ExerciseRow` in their own phase; until
  then every current list keeps its single-link row.

### `ExerciseCard.vue` — Refactor **as a sibling** (`ExerciseCardV2.vue`)
Boards: 02 featured, D2 grid, Home featured.
Built beside the current card, not inside it: the redesign changes the card's structure, and one
component rendering two layouts forever is worse than two that exist for one phase. The screen phase
that adopts it deletes `ExerciseCard.vue` and renames the sibling back in the same commit.
- 3:4 media, `--gm-radius-card`, name 16/700 under it, caption "Muscle · Equipment" 13 muted.
- Level pill top-left on media (`BEGINNER` etc., 10px label on `rgba(0,0,0,.55)`).
- Hover/focus (desktop): media Ken Burns, "▶ PREVIEW" pill bottom-right fades in, name turns
  `--acc-deep`. Keep the existing delayed hover clip and `useCenteredPreview` on touch — the zoom is
  only the poster's behaviour while the clip loads.
- List-view variant (D2 "list" toggle): **that is `ExerciseRow`**, not a variant of this. The row
  layout already has a component that owns the two-target rule, and a card holding a second layout
  behind a `view` prop is the thing the sibling split exists to avoid. The toggle switches which
  component the grid renders.

### `FacetTile.vue` — New (replaces the experimental `FacetCard` in grids)
Boards: 02, T2, D2. 1:1 image (muscle render or equipment photo) + name 14/700 + count in muted
label. Selected = 2px `--acc` border. Used for both "Browse by muscle" and "Browse by equipment".
Keep `FacetHero` for the facet page header.

### `ExerciseDetailModal.vue` → **exercise sheet** — Refactor (big)
See `screens/02-exercise-sheet.md`. Becomes a bottom `GmSheet` on phone/tablet and a right-side
panel on desktop; gains tabs and a Swap tab that absorbs `ProgramSwapSheet`'s variation logic.

---

## The workout screen — names the code already has

3.1 was written against the 3,192-line `tracking.vue`. That file was split before this phase
started, along different seams and with different names, so two of the six components the plan asks
for exist already and need mapping rather than building. A wrapper that renames an existing
component adds a layer and moves no code.

| Plan | Ships as | |
|---|---|---|
| `SetTable` | **`SetTable.vue`** | a real `<table>` of the exercise's sets, outside the card. Replaced `ExerciseSetStrip.vue` (gymmer-nuxt #73) — the strip was a flex row of divs, which cannot carry a column header a screen reader will read |
| `RestOverlay` | **`RestSheet.vue`** + **`PausedOverlay.vue`** | two states the plan treated as one: rest is a sheet you can act in, pause is an overlay that blocks |
| `TrackingHeader` | `TrackingHeader.vue` | extracted in 3.1 |
| `ExerciseHeader`, `SetEntryBar`, `CardioPanel` | split out of `CurrentExercisePanel.vue` in 3.1 | that file is the container and keeps the wiring |

Behaviour is not listed here because none of it lives in these files: `useTrackingSession` and its
five sibling composables own the session, the logging, the timers and the watch sync, and the
components are presentational. A behavioural question about this screen is answered there.

## Controls

### `GmSegmented.vue` — New
Pill track `--gm-surface`, 4px padding, segments 38–42px tall, selected segment `--gm-bg` + soft
shadow, unselected `--gm-muted`. Optional count badge per segment. Used on: library Muscle/Equipment,
program builder mode, progress range, exercise tabs, exercise sheet tabs, swap scope, view toggle.
`role="tablist"` or `radiogroup` by use (prop `semantics`).

### `GmChip.vue` — New (or extend `GmChipSelect`)
36–38px pill, 1px hairline border; `pressed` = `--gm-ink` fill + `--gm-bg` text (filters) or
`--acc` fill (muscle chips on Progress). Removable variant with an `x` (active filters on D2).

### `GmStepper.vue` — New (wraps `GmNumberInput`)
Big value with `−` / `+` round buttons either side (44px). Used for rest ±15s, set weight ±2.5,
reps ±1, time ±5s. Long-press repeats. Haptic tick via `useHaptics` on each step.

### `GmButton.vue` — Refactor
Variants: `primary` (accent pill, 52–56px on mobile CTAs), `secondary` (surface pill + hairline),
**`text`** (borderless, `--acc-deep` — the boards call this "ghost"), and **`shape="icon"`** (44px
circle). The offset shadow comes off app surfaces via the **`flat`** prop (README D5), not globally.
Shipped additively in 2.3: existing variants and defaults are untouched.

---

## Data display

### `TimerRing.vue` — New (extracted)
The ring used by Rest (20), Cardio (16) and the in-workout rest overlay (15). SVG r=54 in a 120
viewBox, 6px stroke, `--gm-raised` track, `--acc` progress, round caps, rotated −90°. Slot for
label/digits/sub-label. Sizes 208 / 240. Extract from `RestSheet.vue` (which already credits
`PhoneFlow.vue`) so all three share one implementation.

### `GmBodyMap.vue` — Refactor via a prop (`scale="ramp"`), one component
**The engine must not fork.** Only the colouring changes, so this is a prop with the current
colouring as the default — not a sibling.
Boards: 12 header, 17 "What you trained", 23 Progress, Programs cards. The canvas `BodyMap` board is
a **stand-in**; keep the real admin-artwork component and its relative-intensity logic. Restyle
only: 4-step accent ramp (light 38%, moderate 68%, heavy 100% of `--acc` mixed into `--gm-raised`),
selected muscle full accent with others at 35% opacity, legend row NONE · LIGHT · MODERATE · HEAVY
under the figure.

**NONE is transparent on the figure, and `--gm-raised` only in the legend.** The draft gave it
`--gm-raised` everywhere; rendered, that paints an opaque near-white polygon over every untrained
muscle, and since these shapes sit on a photograph of a body the result is white patches across the
shoulders and thighs rather than an absence of colour. A legend swatch has no photograph under it,
so there the token is right. Front/back side by side when width ≥ 300px,
otherwise the existing switcher.

**Male and female figures.** The admin body map already holds separate artwork and muscle masks per
sex (`(sex, view)` in `useBodyMap`). Every body map — Today's up-next card, Program header, Programs
cards, Workout complete, Progress, public program pages — renders the figure for the reader's profile
sex (Settings → "Age, height, body-map figure"); signed-out readers and profiles without a value get
the default figure. `ProgramThumb` follows the same rule. The design boards expose this as a `figure`
tweak (male/female) on every board that shows a body map; the stand-in figure on the canvas is only an
approximation of the admin artwork — the real masks win.

### `GmBarChart.vue` — Refactor
Rounded-top bars (4px), current period in `--acc`, previous in **`--gm-track`**, values on tap.
Used on Today (weekly volume), Summary (volume vs last time), Progress.

The comparison series was drafted on `--gm-raised`, which is 1.073:1 against `--gm-bg` in light
mode — measured, not estimated. That is a series nobody can see. `--gm-track` is 1.328:1 and is the
token for this exact job: it is what the timer ring's unfilled arc uses, "the part that is not the
value". `--gm-raised` stays right where it sits on a photograph, as the body map's NONE step.

Note also that the bars cannot be SVG rects. The chart draws into a `preserveAspectRatio="none"`
viewBox, which stretches each axis by a different factor to fill the container, so an `rx` renders
as an ellipse whose shape depends on the chart's width — the 4px radius is not expressible there.
Percent-positioned divs take the same geometry and let CSS round real pixels.

### `GmStat.vue` — Refactor
Tile on `--gm-surface`, value 20/800 with a small unit, label underneath as uppercase muted label.

### `NovaCard.vue` — New
`--acc-soft` panel, "✦ NOVA" label in `--acc-deep`, 15–16px message, optional suggestion chips or
actions. Used on Today, empty Today, Summary review, Program detail, Settings coach note.

---

## Plans and ads (see `02-plans-and-monetisation.md`)

### `AdSlot.vue` — New
Header row: `AD` label left, "Remove ads with Pro" link right (`--acc-deep`) → opens `ProSheet`.
Body: the ad (72px native unit on mobile, `[native ad · 320×72 · no sound]` in mocks). 1px hairline
frame, `--gm-radius-ctl`. Renders only when `usePremium().showAds` is true (never while unknown).

### `ProNudge.vue` — New
One-line, low-key upsell: muted text + accent link, optional 3-dot quota indicator. Examples: Coach
"2 questions left this week · Ask any time with Pro", Programs "1 of 3 programs", Progress locked
ranges. Never a modal.

### `ProSheet.vue` — New
Board 21. Bottom sheet that starts the 7-day trial. Opened by any `ProNudge`, `AdSlot` link or
locked control; carries a `trigger` prop for analytics and the headline.

### `ProgramLimitUpsell.vue` — Refactor
Keep the trigger (`useProgramLimit().handle(e)`) and the "delete one to free a slot" honesty;
restyle into the `ProSheet` look with trigger `program_limit`.

---

## Public content (Goals, Programs, Articles) — see `screens/18-content-model.md`

### `ProgramCard.vue` — New
3:4 cover, primary goal chip(s) top-left, level label + name (22/800 display) over the bottom
gradient, meta "8 weeks · 6×/week · 60 min" and equipment below. Hover: lift 4px + cover zoom, name to
`--acc-deep`. Phone rail variant 210px wide; grid variant fills the column.

### `ArticleCard.vue` — New
3:2 cover with topic pill; accent "Guide · {program}" badge when the article has a `program_id`;
goal label (accent, uppercase), title (19/800, 30 for the featured lead), excerpt, "6 min read · date".
Phone row variant: text left, 108px 3:2 thumb right.

### `GoalTile.vue` / `GoalChip.vue` — New
Tile = `FacetTile` with goal image + "N PROGRAMS" count (used on Programs library). Chip = `GmChip`
linking to `/goals/[slug]`; primary goal uses the `--acc-soft` fill.

### Article widgets — New (rendered from article blocks)
`ProgramWidget`, `WorkoutWidget`, `ExerciseWidget`: start / add actions, "+ Add" → "✓ Added",
toast with Open/Undo, signed-out actions routed through `usePrimaryCta()` and replayed after signup.
Specs in `screens/18-content-model.md`.

### `ArticleToc.vue` — New
Sticky "On this page" list (desktop), active section from `IntersectionObserver`, 2px accent rule.

## Marketing (Home only)

- `StoreButtons.vue` — New. App Store + Google Play pill buttons (official badge artwork if legal
  requires it), shown under the hero CTA; hidden inside the native app.
- `FeaturedExercises.vue` — New. Horizontal snap carousel (mobile) / 5-card grid (desktop) of 3:4
  autoplaying, muted, zoomed clips with name + "MUSCLE · EQUIPMENT" label. Replaces `LibrarySection`
  on Home.
- `PhoneSlideshow.vue` — New (D1 hero). 4 slides (Log a set · Rest · Results · Library) inside a phone
  frame, auto-advance 3.6s, tabs below, pause on hover/focus, `aria-roledescription="carousel"`.
  Extends or replaces `PhoneFlow.vue`.

## Acceptance

- [ ] Each component has a story in `pages/dev/kitchen-sink.vue` in light + dark, all three corner
      settings, and every state listed above.
- [ ] No colour literals; `pnpm check:conventions` passes.
- [ ] Unit tests for `GmStepper` (bounds, long-press), `GmSegmented` (keyboard arrows), `AdSlot`
      (hidden while premium is unknown). They land with 2.2 and 2.7.
