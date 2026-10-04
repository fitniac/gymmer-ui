# @gymmer/ui

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
