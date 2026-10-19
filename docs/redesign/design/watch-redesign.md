# GYMMER watchOS redesign (canvas page "watchOS", boards W1–W8)

Source: native screenshots 2026-10-19 (gymmer-watch 73f570f), redesigned to match the
mobile boards (Active, Rest, ActiveProgress, Summary) and the first-workout rulings.
Device: Apple Watch 46 mm, 208 × 248 pt, drawn at 2×. Always dark, true-black background.

## Structure

Three pages, swiped sideways. The watch opens on the middle page.

| Page | Content |
|---|---|
| 1 Controls (W6) | elapsed, sets done, volume · Pause / Resume · Finish |
| 2 Now (W2–W4) | the current set, or rest when resting (switches automatically) |
| 3 Workout (W5) | exercises; the current one expanded to its sets (same grouping as the Summary ruling) |

Was four pages: set → this exercise's sets → all exercises → progress. "This exercise" and
"all exercises" merge into page 3; "progress" becomes Controls on page 1, the same place as
in Apple's Workout app.

## Rules (all screens)

- No sentences. Labels only. (Idle "Start one on your phone and it will appear here." and
  the Language link are removed.)
- Header: elapsed in accent (left), system clock (right), then the exercise progress strip
  (one segment per exercise, ≤8, as ActiveProgress).
- One primary action per screen, a full-width 42 pt accent pill at the bottom.
- Numbers: Archivo 800, tabular. Values never shrink below 26 pt (a 2-line name clamps
  first). Absurd values keep today's "123k" behaviour.
- Digital Crown edits the tile with the accent ring; tapping a tile moves the ring.
  The separate "adjust" (sliders) button and the ✕ button go.
- Heart rate shows only when the watch has a reading; no "—" placeholders for HR or energy.
- One page indicator only (the system one). The inner per-set dots go; "SET 2 / 4" replaces them.
- Targets ≥ 42 pt; −30/+30 are 42 pt circles.

## Screens

- **W1 Idle**: "UP NEXT · Push A · 6 EXERCISES · 45 MIN" + Start, when the phone has a
  queued programme; otherwise the G mark + "No workout".
- **W2 Set**: name (2 lines max), "SET 2 / 4", optional ♥ 142, KG|LB + REPS tiles, "Log set".
  Bodyweight: one REPS tile.
- **W3 Cardio / timed**: cardio 2×2 (TIME counting in accent, DIST, SPEED, INCLINE) + Done.
  Timed: TIME tile + "TARGET 1:30", Start → counts up in accent → Done; haptic at target,
  keeps counting.
- **W4 Rest**: ring with "REST", time, "OF 1:30"; −30 / +30; "Next · 100 kg × 5" (same
  exercise) or "Next · Romanian Deadlift" (new exercise); the logged set
  "SET 2 · 100 × 5 ✎" is tappable to edit (crown); Skip. Overtime: label stays REST,
  "+0:42" in accent, ring pulses ~10 s then stays lit (ruling 10). "DONE" is removed.
- **W5 Workout**: "WORKOUT · 5/18 SETS"; done exercises with a filled check, current with
  an accent ring, expanded to set rows (done ✓ / current ringed / pending); "+ Add set",
  "+ Add exercise" at the end. Tap a set = edit; tap an exercise = jump to it.
- **W6 Controls**: 14:59 ELAPSED, 5/18 SETS, 2,140 KG; Pause (raised) and Finish
  (accent tint). Paused: clock muted, "PAUSED" label, Resume becomes the accent.
- **W7 Finish**: "Finish workout?", "13 SETS LEFT" when any are unlogged; Finish / Keep going.
- **W8 Summary**: ✓ + name (+ "2 PR" tag), date, TIME / VOLUME / SETS / AVG HR
  (EXERCISES when no HR); Done. The full Summary stays on the phone.

## Needs engineering (not copy)

1. Start from the watch (W1 "Start"): needs the queued programme on the watch and a
   start op from the watch journal.
2. Edit a logged set from the watch (W4 chip, W5 set rows): the set_edit op from #138.
3. Pause / Resume (W6): must match the phone's paused state.
4. Add set / Add exercise on the watch (W5): Add set exists today; Add exercise needs a
   picker (could open a short "recent exercises" list).

## Open questions for Igor

1. Start on the watch (W1): yes for launch, or keep "start on the phone" for v1?
2. Add exercise from the watch (W5): in v1, or phone-only?
3. Language link removed from the watch: the watch follows the phone's language. OK?
