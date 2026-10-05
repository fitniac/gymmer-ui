# Screen · Active workout (strength + timed cardio)

**Boards:** 15 Active · strength + rest timer (interactive), 16 Active · timed cardio, T4 Active
workout · rest, D5 Active workout · rest panel.

**Route & files:** `pages/tracking.vue` (**993 lines on 2026-10-05**: 652 of script, 340 of
template — the template is wiring and overlays, the workout UI itself lives in
`CurrentExercisePanel.vue`, 532 lines),
`components/tracking/CurrentExercisePanel.vue`, `ExerciseSetStrip.vue`, `SetInputs.vue`,
`OtherExercises.vue`, `WorkoutStatusBar.vue`, `PausedOverlay.vue`, `EditSetModal.vue`,
composables `tracking/useSetLogging.ts`, `useRestTimer.ts`, `useExerciseTimer.ts`,
`useTrackingSession.ts`, `useSessionLifecycle.ts`.

## Purpose
Log a set with one thumb, see what's next, and never lose data.

## Behaviour that must survive
Outbox as the only write path (idempotency keys) · store authoritative while outbox non-empty ·
one-tap prefill from plan/previous · wake lock, haptics, watch sync · paused state · immersive shell ·
`ExerciseSetStrip` neighbours logic (kept on tablet/desktop where there is room; see below).

## Refactor plan for `tracking.vue` — mostly DONE

3.1 (#20) extracted `TrackingHeader.vue` (84), `ExerciseHeader.vue` (114), `SetEntryBar.vue` (79),
`CardioPanel.vue` (78) and `ConfirmDialog.vue` (57). `SetTable` and `RestOverlay` map to the
existing `ExerciseSetStrip.vue` (381), `RestSheet.vue` (321) and `PausedOverlay.vue` (90) rather
than being new files.

What is left is NOT the page: at 993 lines it is 652 of script (orchestration — modal state,
handlers, lifecycle) and 340 of template that is almost entirely wiring and overlays. The workout
UI the boards restyle is inside **`CurrentExercisePanel.vue` (532)**, which is the one file worth
measuring again before anything is moved.

Rule for 3.4: any remaining no-behaviour-change extraction is the **first commit of the 3.4 PR**,
not a PR of its own — so the restyle diff that follows it stays readable.

## Layout — phone (board 15)
1. **Header** (immersive): chevron-down "Minimise" (→ dashboard, session keeps running) · centre
   program name 15/700 + elapsed `12:48` in label style `--acc-deep` · "Finish" text button
   `--acc-deep` (→ complete modal). Under it: segmented progress, one 4px segment per exercise,
   done = `--acc`, current = partial fill (sets done / sets planned), upcoming = `--gm-raised`.
2. **Exercise header:** `ExerciseThumb xl expandable live` (opens exercise sheet) · eyebrow
   "EXERCISE 2 OF 4" · name 21/800.
3. **First-run hint** (once per account, stored in preferences/local): ink bubble with caret
   pointing at the thumb — "**Tap the video** any time for full form, mistakes and same-muscle
   swaps." + "Got it". Delay .6s, rise in.
4. **Chips:** ▶ Form (→ sheet, Steps tab) · ⇄ Swap (→ sheet, Swap tab) · ⏱ Rest 90s (→ rest
   duration picker for this exercise).
5. **Set table:** columns SET · PREVIOUS · KG · REPS (columns adapt to measurement type via
   `useMeasurementFields`). Rows: done = ✓ in accent circle and values in ink; current = row on
   `--acc-soft`; upcoming = muted. Tap a done row → edit (existing `EditSetModal`, restyled as sheet).
   "+ Add set" dashed row.
6. **Next:** "NEXT · Incline Dumbbell Hammer Press · 3×10" row (tap → jump, uses `OtherExercises`
   list in a sheet).
7. **Entry bar** (sticky bottom, glass): two `GmStepper`s (KG ±2.5, REPS ±1) + primary CTA
   "Complete set 2" 56px. After the last set: "Next exercise".
8. **Rest:** completing a set opens the **rest overlay** (spec 04) full-screen over this screen.

## Layout — timed cardio (board 16)
Same header; eyebrow "WARM-UP · EXERCISE 1 OF 4"; centre `TimerRing` 208px with "● RUNNING", big
elapsed, "TARGET 5:00"; guidance line; `AdSlot` (free) under the ring; optional metrics as three
tiles (+ Distance KM · Speed · + Incline %) — dashed when empty; bottom: pause circle + primary
"Done, next exercise".

## Layout — tablet (T4)
Two panes: left = exercise header, set table, up-next list, entry bar; right = rest panel (always
visible during rest, collapsed card otherwise). Rail hidden (immersive).

## Layout — desktop (D5)
Three columns: exercise list (`OtherExercises`, with progress dots) · current exercise (header, set
table, steppers, "Complete set 3 [SPACE]") · rest panel. Header shows "14:02 · 3 of 10 sets",
Pause, Finish. **Keyboard:** ↑/↓ weight, ←/→ reps, Space completes the set, S opens swap, F opens form.
Hint line under the CTA lists the keys.

## Data
Unchanged: session from `useTrackingSession`, writes via `useSetLogging` → outbox. "Previous" column
= last session's matching set (already fetched for prefill). Segment progress from session exercise
set counts.

## States
No session → spec 06 start panel · paused (`PausedOverlay`, restyle: scrim + "Paused · Resume") ·
offline (sync indicator in header, writes queue) · sync conflict (existing alert) · custom exercise
without media (thumb fallback initials) · bodyweight / time / distance measurement types.

## Interactions & motion
Complete set: CTA press → row tick pops (scale .6 → 1.15 → 1, 300ms), haptic `success`, rest
overlay slides up 420ms. Steppers: haptic tick. Live thumb Ken Burns (off under reduced motion).

## Free vs Pro
Ads only inside the rest overlay and cardio. Nothing else gated here.

## A11y
Set table is a real table (`<table>` is fine in Vue) with header cells; current row
`aria-current="step"`; steppers are `spinbutton`s with labels "Weight, kilograms"; CTA announces
"Set 2 completed, rest 90 seconds".

## Acceptance
- [ ] `tracking.vue` split with no behaviour change (existing unit + e2e green) before restyle.
- [ ] One-thumb flow: stepper → complete → rest → next set, all reachable in the bottom 40% of a 390×844 screen.
- [ ] Thumb, Form and Swap open the exercise sheet on the right tab.
- [ ] Hint shows once, never again after "Got it" (also on other devices once synced).
- [ ] Desktop keyboard shortcuts work and do not fire while typing in an input.
