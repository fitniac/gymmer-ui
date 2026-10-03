# Screen · Rest timer (+ edit last set, ad on Free)

**Boards:** 20 Rest timer (interactive; tweak `track` = weight & reps / reps only / time / distance),
rest overlay inside 15 Active, rest panes on T4 and D5.

**Route & files:** `components/tracking/RestSheet.vue` (338 lines), `composables/tracking/useRestTimer.ts`,
new `TimerRing.vue`, new `GmStepper.vue`, new `AdSlot.vue`.

## Purpose
Count the rest clearly at arm's length, let the user fix the set they just did and push it into the
program, and — on Free — show the one ad in the app.

## Behaviour that must survive (already in `RestSheet`)
Sheet, not modal: dismissing does not end the rest; status bar carries the countdown · confirm card
(correct, take back, push to programme) · OS alert/local notification at zero · overrun count-up ·
Nova's line · `showAds` prop.

## Layout — phone
Full-height sheet over the workout (header of the workout stays visible above it).
1. Label "● RESTING" pulse + "Next: set 3 · 62.5 × 10".
2. **Timer row:** round `−15` button (56px, surface) · `TimerRing` 208–240px with remaining time
   58/800 tabular and "OF 1:30" label · round `+15` button. Overrun: ring full accent, digits count
   up with a "+" and the label "OVER".
3. **Last set card:** "Set 2 logged · tap to correct" + "PLAN 62.5 × 10" right-aligned. Steppers for
   every field the measurement type has (weight & reps → KG, REPS; reps only → REPS; time → MIN:SEC;
   distance → KM + TIME). Values that differ from the plan are ink-bold; same as plan muted.
4. **Save to program** switch row with a dynamic note: "Use 62.5 × 9 next time" when values differ,
   "Matches your plan" when not (switch disabled then).
5. `AdSlot` (Free only).
6. Primary "Skip rest" (or "Start set 3" when the timer hit zero).

## Tablet / desktop
Same content as a right-hand panel; ad unit 320×96 (tablet) / 300×120 (desktop).

## Data
Correction = existing set update through the outbox. Save to program = existing "push to programme"
path. Rest duration per exercise from the program/preferences; ±15 changes only this rest unless the
user long-presses "Rest 90s" chip in the workout (sets the default — out of scope here).

## Interactions & motion
Ring drains smoothly (CSS transition on `stroke-dashoffset` per second). At 10s left: light haptic;
at 0: success haptic + notification if backgrounded. ±15 nudges animate the ring (300ms).

## Free vs Pro
`AdSlot` only when `showAds`. "Remove ads with Pro" → `ProSheet(trigger:'rest_ad')`.

## A11y
The digits are `aria-hidden`; a visually-hidden live region announces "1 minute left", "30 seconds",
"Rest over". Buttons labelled "Subtract 15 seconds" / "Add 15 seconds".

## Acceptance
- [ ] Dismiss keeps counting; status bar shows remaining time; tap reopens.
- [ ] Corrections update the logged set (and the program when the switch is on) via the outbox.
- [ ] All four measurement types render the right steppers.
- [ ] No ad while premium status is unknown, and never for Pro.
