# Screen · Start a workout (sheet)

**Board:** 14 Start a workout (sheet). Opened by the centre Train button when no session is open.

**Route & files:** `components/tracking/StartWorkoutPanel.vue` (content), presented in `GmSheet` from
`AppTabBar`; `/tracking` still renders the same panel full-page when visited directly.

## Layout
Sheet over the current tab (dimmed). Grabber · title "Start a workout" · **Up next** card: label
"UP NEXT · ~45 MIN", program name 22/800, the exercise list (warm-up first, then "3×10" per exercise)
with `ExerciseThumb xs` · primary "Start Chest Day" · secondary rows: "Choose another program" (→
program picker list in the same sheet) and "Empty workout · Add exercises as you go".

## Data
Up next = the program/session the dashboard already proposes (`useDashboard`). Start = existing
session start; on success route to `/tracking` with the page-push transition.

## States
No programs → card replaced by "Build your first program" (→ create) + "Empty workout" · start
failing offline → start locally if the session lifecycle supports it, else inline error.

## Acceptance
- [ ] Train → sheet → Start reaches the first set in 2 taps.
- [ ] Direct visit to `/tracking` with no session shows the same content full-page.
