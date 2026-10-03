# Screen · Workout complete

**Board:** 17 Workout complete (tweak `plan`).

**Route & files:** `components/tracking/SessionCompleteSummary.vue`, `CompleteWorkoutModal.vue`,
`GmBodyMap.vue`, `GmBarChart.vue`, new `NovaCard.vue`.

## Purpose
Show what the workout was worth in the seconds after the last set, and turn it into next time's plan.

## Layout — phone (top to bottom)
1. Eyebrow "WORKOUT COMPLETE · FRI 2 OCT"; H1 "Chest Day,\ndone." 36/800 Archivo.
2. Stat row (3 tiles): DURATION 47:12 · VOLUME 4.0 t · SETS 10/10. Under it a delta chip "+8% vs last
   Chest Day" (accent when positive, muted when negative — never red).
3. **What you trained:** `GmBodyMap` (front + back, this session's muscles, 240px tall) with the
   muscle list caption "Chest · Triceps · Front delts".
4. **New PR card** (if any): "NEW PR" accent label, exercise, "65 kg × 10", "Previous best 62.5 kg × 10";
   mini bar chart of best set over the last 6 sessions, today highlighted.
5. **Volume by exercise:** horizontal bars, today vs last time per exercise, kg.
6. **Nova's review** (`NovaCard`): message + actions "Ask a follow-up" (→ coach with context) and
   "Apply to program" (applies the suggested loads). Free: shown only when this workout was sampled;
   otherwise the footnote + "Try 7 days free" link (see plans doc).
7. **How did it feel?** 4-option `GmSegmented`: Easy · Solid · Hard · Too much (RPE proxy).
8. Sticky primary "Save workout".

## Data
Existing summary data (`entries`, completed sets, volume). New: muscle breakdown for the body map
(from session exercises' muscle groups — `useBodyMap`), PR detection (existing records or computed
client-side from history), Nova review (coach flow; may be async — show a skeleton "Nova is looking
at your workout…" and fill in), feel rating (new field on session — backend).

## States
No PR → card hidden · first ever workout → no deltas, copy "Your first Chest Day — this is the bar
to beat" · Nova pending/failed → card collapses to nothing (no error shown) · offline → save queues.

## Motion
Stats count up 600ms on first view; PR card pops once; reduced motion → no count-up.

## Acceptance
- [ ] Body map reflects only this session.
- [ ] "Apply to program" updates the program and shows a toast with Undo.
- [ ] Free shows at most one Pro line on this screen.
