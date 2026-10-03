# Screen · Progress (body map)

**Boards:** 23 Progress · body map (interactive), Component · Body map.

**Route & files:** `pages/progress.vue` (436 lines), `components/charts/GmBodyMap.vue`,
`composables/useBodyMap.ts`, `useProgress.ts`, charts.

## Layout — phone
1. Back "‹ Today"; H1 "Progress" 34/800 (collapses into the nav bar on scroll).
2. Range `GmSegmented`: **30 days** · Year `PRO` · All `PRO` (Free: locked segments open `ProSheet`).
3. **What you trained** card: `GmBodyMap` front + back (300px tall), "tap a muscle" hint, legend
   NONE · LIGHT · MODERATE · HEAVY.
4. Muscle chips (horizontal scroll), each with its set count; selecting one highlights it on the map
   (others dim to 35%) and vice-versa (map tap selects the chip).
5. Detail card for the selected muscle: name 20/800, "42 SETS · 30D", "Last trained Tuesday", top
   exercises with `ExerciseThumb xs` and set counts (thumb opens the exercise sheet).
6. No selection → a sentence naming untrained muscles ("Hamstrings and calves haven't been trained in
   30 days…").
7. Below (existing content, restyled): volume over time, per-exercise best-set charts.

## Data
Existing `useBodyMap` (sessions per muscle → relative intensity) and progress endpoints. Range
param already supported? — verify; if not, Year/All are Pro-only server-side anyway.

## Acceptance
- [ ] Map ⇄ chips selection stays in sync; keyboard can select muscles on the map.
- [ ] Unmapped views behave as today (image + "not mapped yet").
- [ ] Free cannot see beyond 30 days; locked segments open the Pro sheet.
