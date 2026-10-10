# @gymmer/ui

Tags are what consumers pin; this file says what each one is for, and which
ones not to.

## v0.6.2

`GmPrimary`'s 52px `compact` tier takes `outline`: a 1px `--line` rule on no
fill, ink label — the outlined Finish under Resume on `ActiveHeader`'s paused
state. Before this, `outline` on a compact was ignored without a word and the
button came back accent-filled. Released through `scripts/release.sh`: the
consumer's gallery guard asks the outlined compact for its paint.

## v0.6.1

`GmSheetShell` can take an app's sheets: the adaptive 480px panel from 1200px,
a sticky footer that reserves the home indicator, and swipe-to-dismiss that is
off under `prefers-reduced-motion` and never fires while an inner
`[data-sheet-scroll]` element is scrolled.

## v0.6.0 — BROKEN, do not pin

The adaptive panel reported `data-variant="panel"`, rounded the right corners
and attached itself to the right edge, and was **1440px wide**: `w-full` in the
base class and `w-[480px]` in the variant one are two width utilities of equal
specificity, so the stylesheet's order decided rather than the attribute's.

Use **v0.6.1**. The tag stays where it is — deleting a tag a lockfile may
already point at trades one broken install for a missing one — and
`scripts/release.sh` exists so the next release cannot repeat the mistake: it
runs the consuming app's gallery and geometry guards and refuses to tag when
they fail.

## v0.5.3

`GmRoundAction`'s caption is a word, not an eyebrow: 11px/600 in the app font,
`--body`, sentence case, because `BottomZone` is the first board to draw it.

## v0.5.2

`GmTimerRing`'s arc takes `--gm-acc-line`, the stroke accent, instead of the
fill one — in light mode a 6px arc of the fill accent misses 3:1 against the
page.

## v0.5.1

The sheet shell actually opens: `showModal()` is called from a watcher AND on
mount, because the watcher alone runs while the template ref is still null.
