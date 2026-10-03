# Screen · Exercise page (public, SEO) + soft gate

**Boards:** 04 Exercise · top, 05 Exercise · scrolled, 06 Soft gate, T3 Exercise, D3 Exercise page.

**Route & files:** `pages/exercises/[id].vue` (398), `components/exercises/ExerciseView.vue` (shared
with the sheet), `ExerciseVariationStrip.vue`, `RatingWidget.vue`, `marketing/BrowseGate.vue`,
`WaitlistForm.vue`, `useBrowseGate.ts`, `useTryExercise.ts`.

## Phone — top (04)
Full-bleed **3:4 hero video** (autoplay muted loop; collapses as you scroll), floating back + share
buttons; breadcrumb Library / Back / Barbell; H1 name 30/800; one-line summary; facts grid 2×2
(LEVEL, EQUIPMENT, MOVEMENT, TRACKS); "WORKS" muscle chips (primary = `--acc-soft` fill, secondary =
outline); **GOALS** chips (primary goal tinted) → `/goals/[slug]`; `GmSegmented` sections How to · Mistakes · Tips · Details; numbered steps. Sticky footer:
"+" (add to a workout/program) + primary "Log a set of this" (signed-out → `usePrimaryCta`).

## Phone — scrolled (05)
Glass header with the name (collapsed title) and the section `GmSegmented` pinned under it; the video
becomes a **picture-in-picture** 84×112 floating card bottom-right (tap = expand back); sections
Common mistakes (✕ list), Safety (surface box), Variations (horizontal 3:4 cards, "All 12").

## Soft gate (06)
Replaces the old modal. A bottom sheet over the readable page: "FREE PREVIEW · 5 OF 5 READ", "The
full library opens at launch", copy, email field, primary "Unlock the library", secondary "Finish
reading this exercise", privacy line. Content stays in the DOM (existing `BrowseGate` contract — not
cloaking). Post-launch copy switches via `usePrimaryCta`.

## Tablet (T3) / Desktop (D3)
Two columns: sticky media column (3:4 video 440px + 3 view thumbnails: video / front / side) and
article column (H1 52/800, summary 20px, facts, WORKS chips, GOALS chips, an "IN 6 PROGRAMS" row
linking the public programs that use this exercise, How to do it, Common mistakes, Tips,
Safety, "Train this in GYMMER" CTA card, Variations strip). Breadcrumb above. Desktop header nav.

## SEO (keep and extend)
`ExerciseView` content server-rendered; `HowTo` JSON-LD (steps) + `VideoObject` for the demo +
breadcrumb; canonical with the English slug (popup URL logic already settles it); OG image = share
card.

## Acceptance
- [ ] Shared element: card/thumb → hero video transition (View Transitions, `ex-<id>`).
- [ ] PiP video only on phone, dismissible, never covers the CTA bar.
- [ ] Gate behaviour unchanged except presentation; crawler still sees the full article.
