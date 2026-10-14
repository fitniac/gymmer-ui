# @gymmer/ui

Tags are what consumers pin; this file says what each one is for, and which
ones not to.

## v0.6.9

`GmSheetShell` as a bottom sheet (`sheet`, and `adaptive` below 1200px) is
capped 44px short of the top — board 15b's peek — so the BODY scrolls inside a
fixed header and footer. Before, a tall sheet took the `<dialog>`'s user-agent
max-height and scrolled as a whole: the close scrolled away with the content
and the swipe could not tell a scroll from a dismissal. `adaptive` also draws
its edge as the app's sheet did: a 1px `--gm-line` rule on top as a sheet, 2px
on the left as the 1200+ panel. Short sheets are unchanged.

## v0.6.8

`GmSheetShell`'s `inset={false}` covers the `#footer` too: the footer stays
sticky and painted, and its padding, top rule, gap and home-indicator inset are
the consumer's — as the body's already were. Lets the app move a sheet WITH a
footer (`ExerciseSheet`) onto the shell without moving a pixel. `inset` on (the
default) is unchanged.

## v0.6.7

`GmChip`'s action label wraps INSIDE the chip when it is wider than its row,
instead of running past it on one line (v0.6.4's `whitespace-nowrap`). Still
never cut. Short labels stay on one line at 36px; only an over-long one (the
Russian "safety squat bar" in a 320px sheet) wraps, and the chip grows to fit.
Found by the consumer's 320px guard on the New program equipment sheet.

## v0.6.6

For board `Program` (group 4):
- `GmSortableList`: rows reordered by a ≡ handle — dragged, or moved with ↑ / ↓
  on the focused handle, the new position spoken through a polite live region.
  Emits `reorder` with the ids; the caller owns the order. Strings are the
  caller's (`handleLabel`, `hint`, `announce`).
- `GmStatTile`: a value, its unit and a `<dt>` caption — promoted from the
  app's `SummaryStat`, with `size` `lg` (26px, the Summary) and `md` (20px).
- `GmPrimary`: `dashed` on the secondary tier — 1.5px dashed rule, no fill.

## v0.6.5

`GmMeter`: a small count meter — `value` of `max` as 16×6 pips, used in ink and
the rest raised (board `Programs`' Free line, "1 of 3 programs"). Decorative and
`aria-hidden`: the words beside it carry the number.

## v0.6.4

`GmChip`'s action variant no longer truncates its label: a control's text is
always fully visible. Status and tag chips (content, not controls) still
ellipsise. Found by the consumer's 320px guard, which now fails on any button or
link label set to ellipsise.

## v0.6.3

`GmSheetShell` can take every sheet an app has, without moving a pixel:
- `variant="panel"`: the right-hand panel at every width (full height, up to
  420px, the whole screen on a phone), swiped right to dismiss.
- Dismiss on the backdrop (`dismissOnBackdrop`, on by default), with the three
  guards an app's own sheet had learned: the press measured at pointerdown,
  nothing from a dialog opened on top, no click a pointer did not produce.
- `#header`: a slot that does not scroll, for a title bar or a corner close.
- `inset` (off: the consumer pads the body) and `grab` (off: the consumer
  draws its own handle; the gesture is unchanged).

`scripts/release.sh` now links the layer against the consumer's own lockfile
and restores it; `--no-lockfile` had pulled a Playwright whose browser was not
installed.

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
