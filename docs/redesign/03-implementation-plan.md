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
| 3.1 | `tracking.vue` → `TrackingHeader` + confirm dialogs; `CurrentExercisePanel` → `ExerciseHeader`, `SetEntryBar`, `CardioPanel`. `SetTable` and `RestOverlay` already ship as `ExerciseSetStrip` and `RestSheet`/`PausedOverlay` (see 01 §workout screen) — mapped, not built. **No visual change**, all tests green | 03 |
| 3.2 | App shell: 5-tab `AppTabBar` (G Today, barbell Train), `AppRail` for tablet, `AppHeader` for desktop; hide coach launcher on phone; e2e selectors | 01-app-shell |
| 3.2b | Desktop signed-in shell is the `DeskToday` sidebar: `AppRail` expands to 240px at ≥1200, `AppHeader`'s desktop row retires, rail goes to the board's 88px | 01-app-shell |
| 3.3 | Exercise sheet: `ExerciseDetailModal` → sheet with tabs; Swap tab absorbs `ProgramSwapSheet` logic; scopes Today only / Today + program | 02 |
| 3.4 | Active workout restyle (phone, tablet, desktop keyboard shortcuts) + first-run hint | 03 |
| 3.5 | Rest overlay/sheet restyle with `TimerRing`, per-measurement steppers, Save to program, `AdSlot` | 04 |
| 3.6 | Start-workout sheet from the Train button | 06 |
| 3.7 | Workout complete: body map, PR card, Nova review card, feel rating (rating hidden until 3.8 api) | 05 |
| 3.8 | **api** — feel rating field on session; Nova review sampling flag for Free | 05, 02 |

**6.7 — the button classes come home.**

`.pri` and `.gho` are `@gymmer/ui`'s button classes and they carry the
offset-shadow press. Written into a template by hand they look like styling and
behave like a contract: the press comes from the layer, the hover and active
**colours** must come from utilities on the same element, and a call site that
knows the first half and not the second renders a button that never reacts to
the pointer. Nine sites shipped exactly that — the landing hero and the site
nav's primary call to action among them — and only a forced-state dump found
it.

`test/layer-classes.test.ts` ratchets it: no new hand-written use, and every
site still on the grandfathered list must carry its own state colours. 6.7
rebuilds those CTAs anyway, so it is where the list empties.

Two things it needs:

- **`GmButton` gains `to`**, rendering a `NuxtLink`. Eight of the nine are
  links, and the component renders a `<button>` today.
- **`WaitlistForm`'s fused input + pill** (`rounded-r-pill`) becomes a
  `GmButton` size/shape variant or an input-group component — designed, not a
  one-off. Its geometry is the reason it cannot simply move.

**3.2 acceptance — the tab bar, in every shipped locale.**

**Ellipsis is never acceptable, in either mode.** A truncated label is a word the reader has to
guess at, every time they look at the one piece of chrome they look at most.

**Default: every tab shows its label.** The first fix for a long translation is a shorter localised
label — not a smaller font, not a narrower slot, and never `text-overflow`. Labels are chosen per
locale, by someone reading them.

**Bar geometry: a fixed centre, four equal slots.**

The centre Train button is icon-only, so it does not need a slot the width of a label. It is a
**fixed 56px** raised circle (the design boards' own figure, and the smallest comfortable target for
the bar's primary action); the four labelled tabs split what is left, equally, so nothing shifts
when the active tab changes.

| Width | Centre | Each label slot | Usable (−2px padding each side) |
|---|---|---|---|
| 360 | 56 | (360−56)/4 = 76.00 | **72.00** |
| 390 | 56 | (390−56)/4 = 83.50 | **79.50** |

The **rail clears it comfortably** — an 88px column with the item filling it bar 4px a side gives
80px (see 01 §AppRail). A label that fits a phone must not fail on a bigger screen.

That is 4px more at 360 than five equal slots would have given, and it is the 4px that decides the
Russian label.

**Russian, settled: Сегодня · Программы · [centre] · Каталог · Тренер.**

«Каталог», not «Библиотека» (ruled 2026-10-03). «Библиотека» measures 68.2 and *would* fit the
72.00 slot, but it is the book sense: this tab opens the exercise catalogue. German and Polish
carried the same defect and were corrected to «Katalog» on 2026-10-04. The catalogue note on
`nav.library` names all three traps by language, so a re-translation cannot walk any of them back.

Measured in the running bar's own style — **Google Sans Flex 700 at 11px**, the face that ships from
`@gymmer/ui` v0.3.4:

| Label | Width | Against 72.00 at 360 |
|---|---|---|
| Сегодня | 48.4 | fits |
| **Программы** | **69.7** | **fits — 2.32px to spare. Shipped.** |
| Прогр. | 38.9 | the recorded fallback |
| Планы | 38.7 | second fallback; drifts to "plans", so prefer the abbreviation |
| Каталог | 46.1 | fits |
| Тренер | 42.2 | fits |
| Тренировка | 69.4 | would fit — but the centre button carries no label at all |
| Библиотека | 68.2 | a label that truncates today, and would fit in the new bar |

Note the Cyrillic widths are **identical** under Archivo and Google Sans Flex, because neither face
has a Cyrillic subset and both fall through to system-ui (see O5). The font switch did not change
this decision; the geometry did.

**«Программы» ships** — the exact word, at 2.32px of headroom. With five equal slots it missed by
1.68px, and giving the icon-only centre a fixed 56px instead of a full share is what bought the
room. «Прогр.» stays recorded as the fallback if that headroom ever disappears (a wider face, a
narrower device), and it is the right shape for one: Russian abbreviates by cutting to the
consonant cluster and closing with a full stop.

**An intentional abbreviation is not the truncation this criterion forbids**, and the difference is
not pedantry. `Програм…` is the renderer giving up at whatever pixel it ran out — the cut point is
an accident of width, it changes with the font, and the reader cannot tell whether a word was
shortened or a different word was clipped. «Прогр.» is a chosen, stable, conventional short form
that means the same thing at every width. The rule is: **no `text-overflow` ellipsis, ever; a
deliberate localised abbreviation is a legitimate shorter label.**

Latin labels all clear 72.00 comfortably: `Programs` 52.8, `Programme` 64.1, `Programy` 53.1,
`Katalog` 42.1, `Library` 38.6, `Trainer` 38.4, `Trener` 35.1, `Today` 32.0, `Heute` 32.5,
`Dziś` 22.4, `Coach` 34.2.

**The centre Train button carries no label, in any locale.**

Today's bar has no centre button and no active-workout state at all: the middle tab is an ordinary
tab labelled "Train", and it reads "Train" whether or not a session is open. The redesign makes it
a raised barbell, which is the only raised element in the bar — the affordance is the shape, and a
label under it restates what the shape already says.

It also removes the hardest localisation problem in the bar rather than papering over it:
«Тренировка» is 69.4px and does not fit, and the alternatives that do fit («Старт», «Начать») are
each slightly wrong in one direction — «Старт» reads as a race start, «Начать» as a bare verb with
no object.

The name lives in `aria-label`, which changes with state where the visible label never could:

| State | en | ru |
|---|---|---|
| idle | `Train` | `Тренировка` |
| session open | `Resume workout` | `Продолжить тренировку` |

The one cost is discoverability for a first-time user, and 3.4's first-run hint is where that is
answered — not by a label that four of five locales cannot fit.

**The live-session state ships in 3.6, both halves together.** Until then the centre keeps today's
behaviour: `aria-label` "Train" in every state, and a tap goes to `/tracking`. Two conditions on
the version that does land:

- **Offline-safe.** The signal is derived from the same local session state the tracking screen and
  the outbox already read — never a server poll. The bar is drawn on every screen, including the
  ones a user reaches in a basement gym with no signal, and a centre button that forgets there is a
  workout open because a request timed out is worse than one that never claimed to know.
- **Visible, not only announced.** A sighted user gets a dot or ring on the button; the changed
  `aria-label` is the screen-reader half of the same signal, not the whole of it. A state that only
  exists in the accessibility tree is a state most users cannot see.

**Fallback: measured at runtime, never configured per locale.** If any label would overflow its
slot at the current width *and text size*, the bar switches to **label on the active tab only**. A
per-locale list of "locales that need the short bar" would be wrong the moment someone raises their
system text size, which is exactly the reader most likely to need it.

- **All-or-nothing.** Either every tab has a label or only the active one does — never a mix, which
  reads as a layout bug rather than a decision.
- **Equal-width slots**, so nothing shifts when the active tab changes. A bar whose icons move as
  you tab through it is harder to hit than one that does not.
- The active label **fades in under its icon**, and respects `prefers-reduced-motion`.

**`aria-label` always carries the full name**, labels visible or not. The fallback is a visual
economy and must never cost a screen-reader user the name of the tab.

**Acceptance:** ru, de and pl show full labels with no ellipsis at **390 and 360** (360 is the
narrowest Android still in the store numbers); at **320** and at the **largest iOS text size** the
fallback engages cleanly — all labels gone but the active one, nothing reflowing, nothing clipped.

This is a regression to fix, not a standard to maintain, and it is **not only Russian**.

`main` today truncates in **ru and de**:

- **ru at 390** — `Програм…`, `Трениро…`, `Библиот…`: three of six tabs unreadable.
- **de at 390** — `Programme` is 64.1px in 61px usable, clipped by 3px. Found by the font PR's DOM
  audit, which reports it on both faces; it is a geometry problem, not a font one.

Today's bar is six equal slots: 390/6 = 65, minus 4px padding = **61px usable**. The redesign's
fixed-centre layout gives **72.00 at 360** and **79.50 at 390**, so `Programme` (64.1) and
`Библиотека` (68.2) both fit without a shortened label. German needs no special handling.

**3.2 acceptance — edge-to-edge, and the insets that go with it.**

The new `AppHeader` / `AppTabBar` / `AppRail` use `env(safe-area-inset-*)` on every edge they touch,
not only the bottom. Today only the bottom is wired (`--gm-safe-bottom`), which is why the native
shell currently insets the WebView rather than drawing under the system bars — and why the bars
have to be repainted at runtime instead of simply showing the page behind them.

Going edge-to-edge is a 3.2 change rather than a native-shell one because it moves where every
screen meets the top of the display, not just the colour of a band.

**The web proves it costs nothing:** `env(safe-area-inset-*)` is `0` in a browser, so the
screenshot diff across all seven routes must stay at zero. A non-zero diff means a layout was
written against the inset rather than merely padded by it.

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
| 6.7 | Home rebuild: hero slideshow, featured 3:4 clips, "A program for every goal", "From the articles", apps, join; remove pricing. **Also:** `GmButton` gains `to` (renders `NuxtLink`); landing/nav/waitlist/contact/about CTAs built on `GmButton`; the grandfathered list in `layer-classes.test.ts` is emptied and the test then bans raw `.pri`/`.gho` outright | 17 |
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
| 7.6 | **Web auth tokens out of `localStorage`** — access token in memory, refresh token in a server-set HttpOnly cookie, rotated with reuse detection. See [ADR 0002](adr/0002-web-auth-tokens.md). **Launch blocker: must land before `prelaunch` → false.** |

**7.6 is a blocker, not a nice-to-have.** Both tokens are in `localStorage` on
web today, including the refresh token, so one XSS anywhere on the site takes an
account for as long as that token lives — and takes it silently. The access
token's exposure is bounded by its TTL; the refresh token's is not. Making the
existing `gm_at` cookie `HttpOnly` would change nothing while this is true,
which is the trap in the obvious framing.

The backend half (cookie-setting on every login route, rotation, token families,
reuse detection) is routed to the gobackend session. The migration needs no
forced logout: ship the backend first accepting the token from body *or*
cookie, then the client migrates each live session on its next boot and deletes
the readable copy.

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
