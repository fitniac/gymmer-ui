# GYMMER redesign — refactoring handoff

Status: **design approved; D1, D2, D3, D5, D6–D10 signed off 2026-10-03 — only D4 (photo colour) still open** (see §3).
Date: 2026-10-03. Design source: the "GYMMER redesign" Design canvas on claude.ai
(owner: Igor) — the `.dc.html` files in [`design/`](design/) are a snapshot of it.

This folder tells a developer (or a coding agent) **what to change, where, and how to know it is
done**, one screen at a time. It does not replace the rules in the repo `CLAUDE.md` files — where
the redesign contradicts one of them, §3 says so explicitly and nothing should change until that row
is signed off.

## 1. How to use this folder

1. Read [`00-foundations.md`](00-foundations.md) — tokens, type, radius, colour, icons, motion.
   Foundations land **first, in this repo (`@gymmer/ui`)**, behind a version bump, before any screen.
2. Read [`01-components.md`](01-components.md) — shared components to refactor in `gymmer-nuxt`.
   Most screens are recompositions of these; build them second.
3. Read [`03-implementation-plan.md`](03-implementation-plan.md) — phases, parallel tracks, flags and risks.
4. Read [`02-plans-and-monetisation.md`](02-plans-and-monetisation.md) — Free vs Pro, ads, trial,
   pre-launch. Every screen spec refers back to it.
5. Then one screen spec per PR, in the order of §4.

Each screen spec has the same sections: **Boards · Route & files · Purpose · Layout (mobile /
tablet / desktop) · Components · Data · States · Interactions & motion · Free vs Pro · A11y · SEO ·
i18n · Acceptance · Open questions.** "Reuse", "Refactor" and "New" mark what happens to each part.

## 2. Viewing the design

- Live canvas (interactive, all tweaks): the Design artifact on claude.ai — ask Igor for access.
- [`design/`](design/) holds every artboard as a `.dc.html` file plus `canvas.json` (board
  positions, titles, pages). They need the canvas runtime (`support.js`) to render, so they will not
  open standalone in a browser; read them as markup reference — exact spacing, sizes, copy, states
  and the `renderVals()` logic for interactive boards.
- Every board has tweaks: `accent`, `mode` (dark/light), `corner` (square/soft/round), `type`
  (font pairing) and, on Pro touchpoints, `plan` (free/pro). The **default** of each tweak is the
  approved state.

## 3. Decisions that change the current system

Signed off by Igor on **2026-10-03**: D1, D2, D3, **D5**, D6, D7, D8, D9, D10. **Only D4 (colour vs
black-and-white photography) remains open** — build that one with the **current** rule (`.photo`
stays grayscale) and leave the redesign value behind a token so flipping it is one line.

The redesign was drawn on a fresh token set. These rows collide with current non-negotiables in
`gymmer-ui/CLAUDE.md` or `gymmer-nuxt/CLAUDE.md`.

| # | Redesign | Current rule | Recommendation |
|---|---|---|---|
| D1 | Soft corners: cards 12px, controls ~7px, pills 999px; user-selectable square/soft/round | Two radii only: `0` and `999px` (non-negotiable 2) | ✅ **Approved** 2026-10-03. Add `--gm-radius-card` / `--gm-radius-ctl` / `--gm-radius-sheet` defaulting to the redesign values; `0` stays reachable as the "square" option. Replaces non-negotiable 2. |
| D2 | Body/UI text in **Google Sans Flex**; headlines stay **Archivo** (wide, 800) | Archivo for everything (non-negotiable 8) | ✅ **Approved** 2026-10-03 — with a measured caveat, see §3a. Google Sans Flex ships **no Cyrillic and no Greek**, and neither does Archivo, so the fallback this row proposed is a no-op. Four locales are unaffected by the change because they already render UI in the system face. |
| D3 | Small uppercase labels (section eyebrows, units, set numbers) were IBM Plex Mono; now Google Sans Flex with letter-spacing | No mono face | ✅ **Approved** 2026-10-03. Drop Plex Mono entirely (it was never added to the layer). Small uppercase labels use the UI face with letter-spacing. |
| D4 | Exercise media in **colour**, 3:4, slow Ken Burns zoom on featured cards | Photography prints black-and-white (non-negotiable 6) | Undecided — the mockups use placeholders. Keep `.photo` grayscale until Igor decides; the zoom works either way. |
| D5 | Cards separated by surface tone + 1px line, no offset shadows | "Rules, not shadows" + offset shadows `5px 5px 0` on buttons (non-negotiables 3, 5) | ✅ **Approved** 2026-10-03. Offset shadows are removed from **app** surfaces; they stay on **marketing CTAs** as the brand echo. Replaces non-negotiable 5 for app components — `--gm-sh*` tokens remain, and the marketing site keeps using them. The one soft shadow kept in the app is on the selected segment of a segmented control. |
| D6 | Dark theme is the default look in mockups | `system` default | ✅ **Revised** 2026-10-03: **Dark default; the user picks Dark or Light; no System option.** The product has one intended look, the screens are drawn for it, and a workout happens where the phone is the brightest thing in reach. **Effect: a visitor with no stored choice on a light-mode OS sees dark after this release** — deliberate, not a side effect. A stored `system` is read without error and means "no preference", so it resolves to dark; it is never written again. Light surface tokens are unchanged. |
| D7 | Accent picker in mockups accepts any colour | Closed accent list, contrast-tested (`useAppearance`) | ✅ **Approved** 2026-10-03. Accent list stays closed; new palettes only via `theme.ts` + `tokens.css` + `pnpm test:contrast`. |
| D8 | 5 tabs: Today (small G mark) · Programs · **Train (centre, barbell)** · Library · Coach. Progress moves into Today ("See all") | 6 tabs incl. Progress, Lucide icons only | ✅ **Approved** 2026-10-03. 5 tabs; `gymmer-g` and `barbell` are the two custom glyphs allowed outside Lucide. |
| D10 | Guest nav groups content: phone Home · Library (Exercises \| Programs) · [Join free] · Learn · Sign in; desktop Library (Exercises · Programs · Goals sub-strip) · Learn · Apps | Current public nav | ✅ **Approved** 2026-10-03. Routes for the Library group are settled in [`adr/0001-programs-route.md`](adr/0001-programs-route.md). |
| D9 | Marketing CTA "Create free account" + store buttons | `prelaunch` flag → waitlist is the primary action | ✅ **Approved** 2026-10-03. Keep the `prelaunch` flag; copy/CTA switch on `config.public.prelaunch`. |

### 3a. Font coverage — measured, 2026-10-03

Phase 0.3. Queried the Google Fonts CSS API directly (`css2?family=…`), which lists every subset
Google serves for a family:

| Family | Subsets served | Cyrillic | Greek |
|---|---|---|---|
| **Google Sans Flex** | latin, latin-ext, vietnamese, math, symbols, canadian-aboriginal, cherokee, nushu, syriac, tifinagh | ❌ | ❌ |
| **Archivo** (today's UI face) | latin, latin-ext, vietnamese | ❌ | ❌ |
| EB Garamond (quote face for ru/uk/bg/el) | …, cyrillic, cyrillic-ext, greek, greek-ext | ✅ | ✅ |

**The row's proposed mitigation does not work**: "fall back per-locale to Archivo" cannot help,
because Archivo has no Cyrillic or Greek either. In the four affected locales — `ru`, `ua` (→`uk`),
`bg`, `gr` (→`el`) — every Cyrillic or Greek **character** already falls through to the
`system-ui, sans-serif` tail of `--gm-font-ui` today. Font fallback is per character, not per
element, so a mixed line ("GYMMER · Жим лёжа") renders in two faces right now. Pre-existing and
unreported.

Consequence for 1.3: adopting Google Sans Flex is **not a regression** for those four locales —
they fall back exactly as they already do, and the other 21 gain the new face. Whether they should
instead get a Cyrillic+Greek UI face of their own (the way EB Garamond was chosen for quotes) is a
**separate, pre-existing decision** that the redesign neither creates nor fixes. It is tracked as
O5 in `02-plans-and-monetisation.md` rather than blocking 1.3.

## 4. Screen index and build order

The phased plan — decisions, foundations, components, workout loop, signed-in screens, content
model (api + admin), public site, hardening — with tracks, flags, estimates and risks is in
[`03-implementation-plan.md`](03-implementation-plan.md). The table below is the spec index in
dependency order. Boards are named as on the canvas.

| # | Spec | Boards | Route / owner file(s) in `gymmer-nuxt` |
|---|---|---|---|
| 0 | [`00-foundations.md`](00-foundations.md) | 07 Appearance, 08 Motion & tokens, 22 Logo, Type | `@gymmer/ui` tokens, fonts, theme |
| 1 | [`01-components.md`](01-components.md) | all | `app/components/**` |
| 2 | [`screens/01-app-shell.md`](screens/01-app-shell.md) | tab bar on 09–19, tablet rail, desktop header | `layouts/app.vue`, `AppTabBar.vue`, `AppHeader.vue` |
| 3 | [`screens/02-exercise-sheet.md`](screens/02-exercise-sheet.md) | 15b | `ExerciseDetailModal.vue`, `ProgramSwapSheet.vue`, `AddExerciseSheet.vue` |
| 4 | [`screens/03-active-workout.md`](screens/03-active-workout.md) | 15, **15c**, **15d**, **15e**, 16, T4, D5 | `pages/tracking.vue` + `components/tracking/*` |
| 5 | [`screens/04-rest.md`](screens/04-rest.md) | 20 (+ overlay in 15) | `RestSheet.vue` |
| 6 | [`screens/05-workout-complete.md`](screens/05-workout-complete.md) | 17 | `SessionCompleteSummary.vue`, `CompleteWorkoutModal.vue` |
| 7 | [`screens/06-start-workout.md`](screens/06-start-workout.md) | 14 | `StartWorkoutPanel.vue` |
| 8 | [`screens/07-today.md`](screens/07-today.md) | 09, 10, T1, D4 | `pages/dashboard.vue` |
| 9 | [`screens/08-progress.md`](screens/08-progress.md) | 23, Body map | `pages/progress.vue`, `GmBodyMap.vue` |
| 10 | [`screens/09-programs.md`](screens/09-programs.md) | 11 | `pages/programs/index.vue` |
| 11 | [`screens/10-program-detail.md`](screens/10-program-detail.md) | 12 | `pages/programs/[id]/details.vue`, `edit.vue` |
| 12 | [`screens/11-create-program.md`](screens/11-create-program.md) | 13 | `pages/programs/create.vue` |
| 13 | [`screens/12-library.md`](screens/12-library.md) | 02, 03, T2, D2 | `pages/library/index.vue`, `pages/library/[facet]/[slug].vue`, `pages/exercises/index.vue` |
| 14 | [`screens/13-exercise-page.md`](screens/13-exercise-page.md) | 04, 05, 06, T3, D3 | `pages/exercises/[id].vue`, `ExerciseView.vue`, `BrowseGate.vue` |
| 15 | [`screens/14-coach.md`](screens/14-coach.md) | 18 | `pages/coach.vue`, `components/coach/*` |
| 16 | [`screens/15-settings.md`](screens/15-settings.md) | 19, 07 | `pages/preferences.vue` |
| 17 | [`screens/16-pro.md`](screens/16-pro.md) | 21 + Pro touchpoints | `ProgramLimitUpsell.vue`, `pages/pricing.vue`, new `ProSheet.vue` |
| 18 | [`screens/17-home.md`](screens/17-home.md) | 01, D1 | `pages/index.vue` + `components/marketing/*` |
| 19 | [`screens/18-content-model.md`](screens/18-content-model.md) | D6–D10, 24–27 (+ Home, Library, Exercise, nav touches) | new: Goal, public Program, Article entities; `pages/programs/*`, new `pages/goals/[slug].vue`, `pages/articles/*`, widgets |

## 5. Ground rules for every refactor PR

- **Behaviour first, pixels second.** The current components carry hard-won behaviour (outbox
  writes, popup URL history, centred-card video preview, rest-sheet confirm card, 403-as-upsell).
  Each spec lists what must survive. A PR that restyles and loses one of these is a regression.
- Tokens only, no colour literals (CI greps). Every new value in the mockups maps to a token in
  `00-foundations.md`; if one is missing, add the token in `@gymmer/ui` first.
- Icons through `app/components/ui/icons.ts`. Size media with the `width` prop, never a `w-*` utility.
- New copy goes through `$t(key, default)` and `pnpm i18n:extract`; short keys get a `context`.
- Hit targets ≥ 44px. Focus ring stays `2px solid currentColor`. `prefers-reduced-motion` turns
  every zoom, slide and pulse off.
- Each PR attaches before/after screenshots at 390, 834 and 1440 wide, light and dark.
- Mockup copy is final unless a spec says "placeholder". Numbers in mockups are sample data.

## 6. Out of scope / not in the design

Goals page, login, legal pages, public program pages, `try/[id]`, watch app. Keep them working on the
new tokens; no layout change is specified.
