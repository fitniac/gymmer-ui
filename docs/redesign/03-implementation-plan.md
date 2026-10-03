# 03 · Implementation plan

How to get from today's code to the redesign without a big-bang rewrite. The work is split into
**phases** (things that must land in order) and **tracks** (things that can run in parallel within a
phase). Each line is one PR unless marked otherwise. Specs are in `screens/`; "D#" refers to the
decisions in `README.md` §3.

Repos: **ui** = `gymmer-ui` (this layer) · **app** = `gymmer-nuxt` · **api** = `gobackend` ·
**admin** = `gymtracer/admin`.

---

## Phase 0 — Decide (no code, ~1 day)

| # | What | Output |
|---|---|---|
| 0.1 | Sign off D1–D10 one by one (radius, fonts, shadows, photo colour, tab bar, CTAs, guest nav) | `README.md` §3 marked ✅ / ❌ per row |
| 0.2 | Answer open questions O1–O4 (Nova free quota, Pro removes ads, ad provider, trial pricing) | `02-plans-and-monetisation.md` updated |
| 0.3 | Confirm Google Sans Flex subsets for every shipped locale (latin-ext, Cyrillic, Greek) | yes/no + per-locale fallback list |
| 0.4 | Route decision for `/programs` (one page with Mine / Discover, recommended) and `/library` vs `/exercises` naming | short ADR in `docs/redesign/adr/` |

**Exit:** no row in §3 is "pending". Everything after this assumes the answers.

## Phase 1 — Foundations (ui, ~1 week)

| # | Repo | PR | Spec |
|---|---|---|---|
| 1.1 | ui | New tokens: `--gm-radius-card/-ctl/-sheet`, `--gm-scrim`, `--gm-glass`, `--gm-media-badge`, motion tokens. Values behind the current rules until D1/D5 are ✅ | 00 §1, §4, §5 |
| 1.2 | ui | `data-corners` axis: theme registry, cookie + storage keys, SSR plugin, no-flash script, `useTheme()` | 00 §1 |
| 1.3 | ui | Fonts: Google Sans Flex (`global: true`, all subsets), `--gm-font-display` / `--gm-font-ui` split, h1–h3 + `.display` rule | 00 §3 |
| 1.4 | ui | New accent palettes (only those Igor picks) + `pnpm test:contrast` | 00 §2 |
| 1.5 | ui | `GmLogo variant="wordmark-g"`; `gymmer-g` and `barbell` glyph SVGs exported for the app's `icons.ts` | 00 §6 |
| 1.6 | ui | Update `CLAUDE.md` / `README.md` rules to the signed-off decisions; tag `v0.3.0` | — |

**Exit:** `v0.3.0` tagged; app bumps the dependency and **nothing changes visually** unless a token
flag is flipped. Contrast test green.

## Phase 2 — Shared components (app, ~1.5 weeks)

Two tracks in parallel after 2.1.

| # | Track | PR | Spec |
|---|---|---|---|
| 2.1 | — | Bump `@gymmer/ui@v0.3.0`; add `gymmer-g` / `barbell` to `icons.ts`; kitchen-sink page sections | 01 |
| 2.2 | A | `GmSegmented`, `GmChip`, `GmStepper` (+ unit tests) | 01 Controls |
| 2.3 | A | `GmButton` variants, `GmSheet` bottom/right presentation + drag-to-dismiss, scrim, focus trap | 01 |
| 2.4 | A | `TimerRing` extracted from `RestSheet` (no visual change yet) | 01 Data |
| 2.5 | B | `ExerciseThumb` sizes + `expandable` + `live`; `ExerciseCard` restyle + list variant | 01 Media |
| 2.6 | B | `FacetTile`, `GmStat`, `GmBarChart`, `GmBodyMap` restyle (keep engine) | 01 Data |
| 2.7 | B | `NovaCard`, `AdSlot`, `ProNudge`, `ProSheet` (+ `usePrimaryCta()`) | 01 Plans, 02 |

**Exit:** every component in kitchen-sink in light/dark × 3 corner settings; `check:conventions` green.

## Phase 3 — App shell + the workout loop (app, ~2 weeks)

The highest-value, highest-risk part. Behaviour-preserving splits land **before** restyles.

| # | PR | Spec |
|---|---|---|
| 3.1 | Split `tracking.vue` into `TrackingHeader`, `ExerciseHeader`, `SetTable`, `SetEntryBar`, `RestOverlay`, `CardioPanel` — **no visual change**, all tests green | 03 |
| 3.2 | App shell: 5-tab `AppTabBar` (G Today, barbell Train), `AppRail` for tablet, `AppHeader` for desktop; hide coach launcher on phone; e2e selectors | 01-app-shell |
| 3.3 | Exercise sheet: `ExerciseDetailModal` → sheet with tabs; Swap tab absorbs `ProgramSwapSheet` logic; scopes Today only / Today + program | 02 |
| 3.4 | Active workout restyle (phone, tablet, desktop keyboard shortcuts) + first-run hint | 03 |
| 3.5 | Rest overlay/sheet restyle with `TimerRing`, per-measurement steppers, Save to program, `AdSlot` | 04 |
| 3.6 | Start-workout sheet from the Train button | 06 |
| 3.7 | Workout complete: body map, PR card, Nova review card, feel rating (rating hidden until 3.8 api) | 05 |
| 3.8 | **api** — feel rating field on session; Nova review sampling flag for Free | 05, 02 |

**3.2 acceptance — tab bar labels fit, in every shipped locale.**
No label may ellipsise. Checked in the longest locales — **ru, de and pl** — at **390 and 360**
(360 is the narrowest Android still in the store numbers). Where a translation cannot fit, the fix
is **a shorter localised label, never truncation**: a truncated label is a word the reader has to
guess at every single time they look at the bar.

This is a regression to fix, not a standard to maintain. `main` today truncates Russian at 390 —
the bar renders `Програм…`, `Трениро…`, `Библиот…`, which is three of six tabs unreadable. The
5-tab redesign has one fewer slot to spend, so the problem gets easier, but only if the shorter
labels are chosen deliberately rather than left to `text-overflow`.

**Exit:** a full workout (start → sets → rest → swap → finish) on iPhone (Capacitor), Android and
desktop web, offline included; outbox and watch sync unchanged.

Also: the bottom sheet's gestures verified **on iOS Capacitor and Android**, not only with desktop
pointer events — drag-to-dismiss, a cancelled drag, and a downward drag that starts in a scrolled
body (which must scroll, not dismiss). `pointercancel` is the whole risk here: on touch the browser
can claim a vertical pan mid-gesture, and a synthetic cancel in Chrome is not a browser deciding to
scroll. 2.3 built the sheet and could only prove the desktop half, because no screen renders it
until this phase.

## Phase 4 — Signed-in screens (app, ~1.5 weeks, parallel tracks)

| # | Track | PR | Spec |
|---|---|---|---|
| 4.1 | A | Today (phone, tablet, desktop + Nova panel), first-run checklist | 07 |
| 4.2 | A | Progress with body map ⇄ chips, Free range lock | 08 |
| 4.3 | B | Programs list (Mine) + Free meter; Program detail edit-in-place (merge with `edit.vue`) | 09, 10 |
| 4.4 | B | Create program (Template + Blank now; **With Nova behind a flag** until 4.6) | 11 |
| 4.5 | C | Settings split + Appearance (mode, accent, corners); Coach restyle + quota line (hidden until api) | 15, 14 |
| 4.6 | api | Nova program generation flow; Nova weekly quota endpoint; trial state (`trial_ends_at`) | 11, 14, 16 |
| 4.7 | C | `ProSheet` wired to every touchpoint + analytics events; `ProgramLimitUpsell` restyle | 16, 02 |

## Phase 5 — Content model: Goals, public Programs, Articles (api + admin first, ~3 weeks)

Starts in parallel with Phase 3 on the **api/admin** side — it's the longest lead time.

| # | Repo | PR | Spec |
|---|---|---|---|
| 5.1 | api | **Goal** entity (+ i18n, image, order) and `goal_ids` on programs, public exercises, articles; `GET /goals` with counts; `?goal=` filters + facet counts | 18 §1 |
| 5.2 | admin | Goal CRUD + reorder; multi-select goal pickers in program/exercise editors; bulk-assign from library filters | 18 §1 |
| 5.3 | api | Public program model extension: cover/trailer, phases, days with prescriptions + phase overrides, who_for, progression, guide_article_id, trained_count; "start" and "copy" endpoints (respect Free limit) | 18 §2 |
| 5.4 | admin | Public program editor (phases × days × exercises), publish workflow | 18 §2 |
| 5.5 | api | **Article** entity with structured blocks (incl. `program`, `exercise`, `workout`, `takeaways`), topics, goals, author, locale, read time; list + detail endpoints | 18 §3 |
| 5.6 | admin | Block editor with exercise/program pickers, preview, publish | 18 §3 |
| 5.7 | — | Seed content: 7 goals, ≥ 9 programs, ≥ 8 articles (incl. one guide per flagship program) | — |

**Exit:** content can be created and published without a client release.

## Phase 6 — Public site (app, ~2 weeks, after 5.1/5.3/5.5)

| # | PR | Spec |
|---|---|---|
| 6.1 | Guest navigation: phone Home · Library · [Join free] · Learn · Sign in; desktop Library · Learn · Apps + Library sub-strip (Exercises · Programs · Goals) | 01-app-shell, D10 |
| 6.2 | Library hub + facet list restyle, Muscle/Equipment browse with images, Goal filter, two-target rows | 12 |
| 6.3 | Exercise page restyle (PiP video, GOALS chips, "In N programs"), soft gate sheet | 13 |
| 6.4 | Programs library (D6/24) + program detail (D7/25) with phase switch and day cards/accordion | 18 |
| 6.5 | Goal hub `/goals/[slug]` (D8) | 18 |
| 6.6 | Learn: articles list (D9/26) + article page (D10/27) with `ProgramWidget`, `WorkoutWidget`, `ExerciseWidget`, TOC, toasts, replay-after-signup | 18 |
| 6.7 | Home rebuild: hero slideshow, featured 3:4 clips, "A program for every goal", "From the articles", apps, join; remove pricing | 17 |
| 6.8 | SEO pass: JSON-LD (ItemList, HowTo, Article, Breadcrumb, VideoObject), canonicals, hreflang, sitemaps for goals/programs/articles | 12, 13, 18 |

**Exit:** Lighthouse SEO ≥ 95 and CLS < 0.05 on home, library hub, facet, exercise, programs, program,
goal, articles, article.

## Phase 7 — Hardening and launch switch (~1 week)

| # | What |
|---|---|
| 7.1 | Accessibility audit (keyboard, screen reader on sheets/timers, contrast in all palettes × corners) |
| 7.2 | Reduced-motion pass; performance budget (fonts, video posters, no autoplay off-screen) |
| 7.3 | Visual regression screenshots at 390 / 834 / 1440, light + dark |
| 7.4 | Flip `prelaunch` → false path tested: CTAs, store buttons, Join free → signup |
| 7.5 | Ads SDK integration behind `showAds` (after O3) |

---

## Critical path and parallelism

```
Phase 0 ─► Phase 1 (ui) ─► Phase 2 ─► Phase 3 ─► Phase 4 ─┐
     └────────► Phase 5 (api + admin, starts with Phase 3) ─┴─► Phase 6 ─► Phase 7
```

- Critical path: **0 → 1 → 2 → 3 → 6 → 7**. Phase 5 must finish before 6.4–6.6, so start it early.
- Two front-end streams fit after Phase 2: *workout & app* (3, 4) and *public site* (6.1–6.3 and 6.7
  can start before Phase 5 ends; 6.4–6.6 wait for content APIs).
- Rough total with one front-end dev + one backend dev: **9–11 weeks**. With two front-end devs:
  **7–8 weeks**. Estimates exclude store review and content writing.

## Feature flags

| Flag | Guards | Default until |
|---|---|---|
| `redesign.shell` | new tab bar / rail / header | 3.2 shipped and tested on native |
| `redesign.workout` | new tracking UI | Phase 3 exit |
| `nova.programBuilder` | Create program "With Nova" | 4.6 |
| `nova.quota` | Coach quota line | 4.6 |
| `content.public` | Programs library, goals, Learn, new nav items | Phase 5 seed content live |
| `ads` | `AdSlot` rendering | 7.5 |
| `prelaunch` (existing) | waitlist vs signup CTAs | launch |

## Risks

- **`tracking.vue` regression** — the most-used screen and the outbox's main caller. Mitigation: 3.1
  split first with zero visual change; e2e of a full offline workout before and after each PR.
- **Font coverage** — if Google Sans Flex lacks a subset, per-locale fallback is required before 1.3
  ships, or translated UIs fall back to system fonts silently (see `@nuxt/fonts` `global: true` note).
- **Route clash `/programs`** — public SEO page vs authed list; settle in 0.4 or links break later.
- **Content is the bottleneck** for Phase 6: pages without programs/articles look empty. Seed 5.7
  is a real deliverable, not an afterthought.
- **Design ≠ code drift** — when a spec and the canvas disagree, the canvas wins; update the spec in the
  same PR.
