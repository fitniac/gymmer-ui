# @gymmer/ui

## 0.3.11

The hover lift is for a real pointer only.

- `.pri:hover` / `.gho:hover` (the 2px lift and its shadow), their
  `:disabled:hover` undo, and `.row:hover` / `.row:hover .arw` now sit behind
  `@media (hover: hover) and (pointer: fine)`.
- Why: a hover transform that MOVES the element it reacts to can move it off
  its own hotspot — hover applies, the element shifts 2px, the pointer is no
  longer over it, hover drops, it returns, hover applies again. One flip per
  animation frame, forever. Measured on an emulated iPhone 13
  (`isMobile: true`), with no CSS animation on the element or any ancestor:
  `transform: none` at y=252 alternating with `translate(-2px,-2px)` at y=250.
  Playwright refused to click the button for 15s with "element is not stable",
  and gymmer-nuxt's `mobile-journey` spec failed on it for days.
- There is no hover on a touch screen, so the lift was only ever reachable
  there by accident. On a real pointer nothing changes.

## 0.3.7

Fixes the regression 0.3.6 shipped.

- Interactive state colours move out of the layer and onto the component:
  `hover:bg-accent-hover`, `active:bg-accent-deep`, `hover:bg-accent-soft`.
  A layered `:hover { background }` loses to a static `bg-*` utility on the
  same element, so 0.3.6 silently removed every button's hover and press.
- The layer keeps only the state effects no utility competes with — the press
  transform and its shadow.
- `test/css-layers.test.mjs` fails on any painting property under a state
  selector in layered CSS, and on any new unlayered rule.

## 0.3.6 — do not use: interactive states lost

Moved component and base CSS into `@layer components` / `@layer base`, which
is correct and is kept. But it also demoted every `:hover` and `:active` rule
below the static utilities on the same elements, so buttons stopped responding
to the pointer. Use 0.3.7.

## 0.3.5

Dark default; Dark or Light only, no System.
