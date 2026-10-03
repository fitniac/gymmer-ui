# Screen · Program detail

**Board:** 12 Program · Chest Day.

**Route & files:** `pages/programs/[id]/details.vue` (302), `pages/programs/[id]/edit.vue` (482),
`components/programs/ProgramExerciseRow.vue`, `ProgramSwapSheet.vue`, `ExerciseEditor.vue`,
`ExerciseDetailModal.vue`.

## Layout — phone
1. Back "‹ Programs" · overflow (edit details, duplicate, delete).
2. **Header:** `GmBodyMap` (front+back, ~160px) with the program's muscles; level badge; H1
   "Chest Day"; muscles caption.
3. Stat tiles: EXERCISES 4 · WORK SETS 10 · DURATION ~45 min.
4. **Warm-up** section: row with `ExerciseThumb md expandable` · name · "5 min · easy pace".
5. **Main work** section header + "Hold ≡ to reorder": `ProgramExerciseRow` per exercise — number
   badge on the thumb's top-left corner, thumb `md expandable` (→ exercise sheet, library context
   with Add/Replace), name, folded plan "3 × 10 reps · 62.5 kg", muscles label, reorder handle.
   Swipe left (phone) → Swap / Remove.
6. Dashed "+ Add exercise" → `AddExerciseSheet` / library sheet.
7. Sticky primary "Start workout".

## Merge note
Details vs edit: the design shows one screen that edits in place (reorder, swap, add). Keep `edit.vue`
for name/description/schedule fields only, reached from the overflow; move reorder/swap/add onto
details. Watch the `useAsyncData` key collision note in `gymmer-nuxt/CLAUDE.md`.

## Acceptance
- [ ] Thumb opens the sheet; row text opens the inline editor (sets/reps/load) — two targets.
- [ ] Reorder persists; swap uses the sheet's Replace-in-program path.
