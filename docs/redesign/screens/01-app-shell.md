# Screen · App shell (tab bar, tablet rail, desktop header)

**Boards:** bottom bar on 09, 10, 11, 18 · rail on T1–T4 · header on D3–D5 · public bottom bar on
01, 02, 03 · 22 Header logo variants (variant A).

**Route & files:** `app/layouts/app.vue`, `app/components/AppTabBar.vue`, new `AppRail.vue`,
`app/components/AppHeader.vue`, `app/components/AppDock.vue`, `app/components/marketing/SiteNav.vue`.

## Purpose
One reachable, thumb-first navigation per device class, with Train always one tap away.

## Layout
- **Phone (<768):** top: 44px row with `GmLogo variant="wordmark-g"` left and the avatar button
  (initials, 44px circle, `--gm-surface` + hairline) right → `/preferences`. Bottom: `AppTabBar`
  (see components). Screens scroll under the glass bar; `main` keeps `padding-bottom` = bar + safe area.
- **Tablet (768–1199):** `AppRail` 72px on the left, content to the right. No bottom bar, no header.
- **Desktop (≥1200):** `AppHeader` sticky top; content column 1200px; optional right Nova panel on
  Today (D4).
- **Immersive (live workout):** shell hidden exactly as today (`useImmersive`) — the active-workout
  screen has its own header with minimise / title+timer / Finish.

## Components
Refactor `AppTabBar`, `AppHeader`, `GmLogo` (new variant). New `AppRail`. Reuse `AppDock` — the
coach launcher stays in the dock on tablet/desktop but is **hidden on phone** now that Coach is a tab
and Train sits centre (two floating accents would compete). Reuse `ProgramLimitUpsell` mount.

## Public (signed-out) bottom bar — boards 01–03
**Home · Library · [Join free] · Learn · Sign in** (README D10; boards 01–03, 24, 26, 27).
- **Library** groups the two things you train with: an underline tab strip at the top switches
  **Exercises (412) | Programs (31)**; muscle/equipment and goal browsing live inside each.
  Targets (ADR 0001): `/library` · `/library/programs` · `/library/goals/[slug]`.
- **Learn** is reading: articles and program guides. Different mode, different tab.
- **Join free** is the centre accent circle with the G mark — the same slot and shape as the signed-in
  Train button, so after signup the centre button simply becomes Train (barbell). Pre-launch it opens
  the waitlist sheet (`usePrimaryCta`).
- **Sign in** replaces the old top-right "Sign up" pill on public pages.

Desktop public header: **Library · Learn · Apps** · EN · Sign in · primary CTA. Library pages carry a
second strip under the header: LIBRARY · **Exercises 412 · Programs 31 · Goals 7** (D2, D3, D6, D7, D8)
→ `/library`, `/library/programs`, `/library/goals/[slug]` (ADR 0001).
The signed-in **Programs** tab points at `/programs` (Mine) and is a different destination from the
Library strip's Programs — see ADR 0001 and spec 09.
Learn pages (D9, D10) show "LEARN · ARTICLES & GUIDES".

## Interactions & motion
- Tab change: no page-push animation between top-level tabs (instant + list-enter on content).
- Train button: tap scale .95. If no session: opens the start-workout sheet (spec 06). If a session
  is open: navigates to `/tracking`. Live dot when a session is running.
- Long-press Train (native only, optional): quick-start "Up next" program.

## A11y
`nav aria-label="Primary"`; `aria-current="page"` on the active item; Train has
`aria-label="Train"` (or "Resume workout"); the tab bar is not hidden from screen readers when a sheet
is closed, and is `inert` while a sheet is open.

## Acceptance
- [ ] 5 tabs on phone; Progress reachable from Today "See all" and the desktop header.
- [ ] G mark on Today tab tints with the active state; barbell icon in the Train button.
- [ ] Tablet shows the rail, not the tab bar or header; desktop shows the header only.
- [ ] Safe-area padding correct on iPhone (Capacitor) and in PWA standalone.
- [ ] e2e: `tab-progress` selector removed/updated; new `tab-train` behaviour covered.
