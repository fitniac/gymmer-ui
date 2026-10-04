# Screen · Exercise sheet (form, video, swap)

**Boards:** 15b Exercise sheet (tweaks: `context` = workout | library, `open` = steps | swap).
Opened from: the thumb on 03 Muscle list, 12 Program rows, 15 Active (thumb, "Form", "Swap"), 18
Coach exercise mentions, T4/D5 equivalents.

**Route & files:** `components/exercises/ExerciseDetailModal.vue` (becomes the sheet),
`components/exercises/ExerciseView.vue` (content source, keep shared with the page),
`components/programs/ProgramSwapSheet.vue` (variation logic moves in),
`components/tracking/AddExerciseSheet.vue` (keeps search + by-hand add), `composables/useExercisePopup.ts`.

## Purpose
From any exercise thumbnail, one tap shows everything needed to do the exercise right, and — in a
workout or program — lets the user swap it for a same-muscle alternative without leaving the flow.

## Behaviour that must survive
- `useExercisePopup`: pushState URL to the exercise page, Back closes, reload lands on the page.
- Lazy load of detail on open; per-id session cache.
- Signed-in athlete preference for demos.
- `actions` / `actionsExcept` props and `action` emit (add | swap) — extend, do not replace.

## Layout (phone / tablet)
Bottom sheet, top edge 44px below the status bar, `--gm-radius-sheet` top corners, grabber.
1. Header: eyebrow label (workout: "EXERCISE 2 OF 4 · SET 2 OF 3"; library: "CHEST · BARBELL"),
   name H1 23/800 Archivo, close button (30px circle in 44px target).
2. Media row: 3:4 looping video 186px wide (`--gm-radius-card`, "● LOOP" pill, full-screen button
   bottom-right → opens `GmLightbox` with sound control) + facts column: TARGET, ALSO WORKS,
   EQUIPMENT, LEVEL, and a tinted box TODAY "3 × 10 @ 62.5 kg" (workout) / TYPICAL "3 × 8–12" (library).
3. Sticky `GmSegmented` tabs: **Steps · Mistakes · Tips · Swap (6)** — four, and
   only four. Swap is absent without a session (above); there is no History tab.
   - Steps: numbered list (26px ink circles).
   - Mistakes: ✕ in `--acc-soft` circles. Tips: ✓ in `--gm-raised` circles.
   - Swap: one-line explainer; equipment filter chips (Any · Dumbbell · Cable · Machine · Bodyweight);
     rows of `ExerciseThumb sm` + match tag (SAME MOVEMENT / SAME MUSCLE / CLOSE MATCH / NO EQUIPMENT)
     + name + "muscle · equipment" + action button; link "Browse all 42 chest exercises" → library facet.
4. Footer (glass): no selection → secondary "Swap exercise" (jumps to Swap tab) + primary "Back to
   sets" (workout) / secondary "See variants" + primary "Add to program" (library).
   With a selection → scope `GmSegmented` + primary action:
   - workout: **Today only** | **Today + program · saved when you finish** → "Swap to {name}".
   - library/program: **Add alongside** | **Replace in program** → "Add {name} to {program}" /
     "Replace with {name}".

## Layout (desktop)
Right-side panel 480px (same content, media 220px wide) over a scrim; the list behind stays
interactive-looking but inert.

## Programme edits during a workout apply at completion

**The rule, for this screen and every other one:** a change a user makes to
their *programme* while a workout is running is recorded as an intent on the
session and written to the programme **when the workout ends** — never
mid-session.

A workout that is abandoned has therefore edited nothing. The alternative, an
immediate write, means someone who swaps an exercise, decides against the whole
session and walks out has silently changed their plan for next week; the change
they would have to undo is one they never knowingly made.

So "Today + program" sets `keep` on the session exercise, exactly as the code
does today (`keepExerciseForNextTime`, applied at completion), and the label
says so: **"Today + program · saved when you finish"**. The same rule governs
3.5's Save to program.

Undo before completion is "swap back": the `replaces` chain resolves a
swap-of-a-swap to the original, so the programme sees one change or none.

## The Swap tab needs a session

Swap exists only where there is something to swap *in*: a live workout, or a
programme being edited. Opened from the library or a public exercise page the
sheet shows **Steps · Mistakes · Tips** and no Swap tab — there is no target,
and a tab that opens onto "pick an alternative for nothing" is a dead end
dressed as a feature.

Browsing alternatives outside a session is **6.3**'s job, on the exercise page,
where it can be a real list with filters and a URL.

## Data
- Detail: existing public detail endpoint via `ExerciseDetailModal`.
- Variants: what `ProgramSwapSheet` already fetches (variations, then similar). Tag mapping:
  variation → SAME MOVEMENT; same primary muscle → SAME MUSCLE; shares secondary → CLOSE MATCH;
  equipment = bodyweight → NO EQUIPMENT. Count shown on the tab = list length.
- Swap in workout: existing session swap (`AddExerciseSheet` `replacing` path) — "Today + program"
  also calls the program update (`replacesInProgramme`). Writes go through the outbox.
- Add/replace in program: existing program endpoints used by `ProgramSwapSheet` (`pick`).

## States
Loading (skeleton facts + grey media) · error (retry inline) · no variants ("No close swaps — browse
the library") · offline (Steps/Mistakes/Tips from cache; Swap disabled with reason) · busy on the
action button (spinner, sheet stays open until success, then closes with a toast).

## Interactions & motion
Sheet 420ms up, drag to dismiss, scrim tap closes. Tabs cross-fade 240ms. Selecting a variant tints
its row `--acc-soft` and slides the scope bar up. Haptic `selection` on pick, `success` on swap.

## Free vs Pro
None. Swapping is free.

## A11y
`role="dialog"`, labelled by the H1; focus to close button on open; Escape closes; tab list with
arrow keys; video has a text alternative via the Steps tab.

## i18n
New keys: `sheet.tab.steps|mistakes|tips|swap`, `sheet.swap.intro`, `sheet.swap.tag.*`,
`sheet.scope.todayOnly|todayAndProgram|addAlongside|replaceInProgram`, `sheet.cta.swapTo`,
`sheet.cta.addTo`, `sheet.cta.replaceWith`. Context for "set" (training set).

## Acceptance
- [ ] Every exercise thumbnail with the expand badge opens this sheet; row text still opens the page.
- [ ] Swap in a live workout with "Today only" changes the session only; "Today + program" changes both.
- [ ] Back button / swipe / Escape all close and restore scroll + focus.
- [ ] Works signed-out on public lists (library context, add actions become "Create free account" /
      waitlist per `usePrimaryCta`).
