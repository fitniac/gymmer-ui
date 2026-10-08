# Primitives, measured off the boards

Phase 0, step 2. Every number here is counted out of the 50 `.dc.html` boards
rather than read off one of them, so a value that appears once does not become
the spec. The counts are in the right-hand column; where two values compete,
both are listed and the decision is stated.

## Buttons

Bucketed by what they ARE rather than by height — a 56px accent fill and a 56px
round icon control are different primitives that happen to share a number.

| tier | height | radius | type | count | notes |
|---|---|---|---|---|---|
| **primary** | 56 | `999px` | 17px / 700 | 9 | accent fill, `--on-acc` label |
| primary (compact) | 52 | `999px` | 16px / 700 | 6 | the same thing inside a sheet |
| **secondary** | 48–50 | `var(--rs)` or none | 15px / 600 | 16 | surface or outline, never accent |
| **small** | 36–38 | `999px` | 13–14px / 600 | 26 | chips and inline actions |
| round icon | 56 | `50%` | — | 7 | 1px `--line`, `--surf` fill |
| tap target | 44 | — | — | 105 | not a button tier: the minimum box an icon gets |

Three things this table settles:

- **The pill is the primary's shape** (`999px`, 9 of 9), and the secondary's is
  the card radius. They are not the same control at two sizes.
- **44px is not a button size.** It is the floor every tappable icon is padded
  to, which is why it outnumbers everything else three to one. A primitive
  called "small" at 44 would be a misreading of the count.
- The user's three tiers (56 / 50 / 36) are the boards' three tiers. The 52px
  variant is the primary inside a sheet and is the same primitive with a
  compact flag, not a fourth.

## Sheet, scrim, progress strip

| thing | board | count | `@gymmer/ui` today |
|---|---|---|---|
| scrim | `rgba(0,0,0,.55)` | 30 | `--gm-scrim: rgba(0,0,0,.55)` — **match** |
| bottom-sheet top radius | `22px` | 5 | `--gm-radius-sheet: 22px` — **match** |
| progress strip | `4px`, accent on track | 25 | — |

Two competing scrims appear (`.62` ×8, `.45` ×6) against `.55` ×30. The
majority is also what the layer already ships, so there is nothing to change
and nothing to rule on.

## Chip — the one primitive the boards do not settle

| height | count |
|---|---|
| 34px | 27 |
| 36px | 25 |
| 30px | 24 |
| 38px | 21 |
| 32px | 17 |

No majority, and the spread is flat — a chip on these boards takes whatever
height the row around it wants. Counting cannot answer this one, so it was
raised as a design question rather than settled by picking the tallest bar of a
flat histogram.

**Ruled 2026-10-08 (Igor).** Split on what a chip *is*, not on what it
measured — two variants of **one** primitive, `GmChip`:

| variant | height | tappable | state |
|---|---|---|---|
| `status` | **22px** | no | — |
| `tag` | **24px** | no | — |
| `action` | **36px** drawn, **≥44px** target | yes | `aria-pressed` |

The 44 is the same trap as the button table: it is the floor a tappable thing
is padded to, not a height anything is drawn at. So an action chip draws 36 and
reaches 44 through an `::after` hit area with a negative inset — no layout
added, so a row of chips keeps its 36px rhythm and every chip in it is still a
legal target.

One component because they share everything that can drift: the pill radius,
the surface and line tokens, the truncation rule. The variant decides height,
interactivity and whether there is a pressed state, and nothing else. An inert
chip renders a `<span>` with no tab stop; an action chip renders a `<button>` —
a reader should not be offered a control that does nothing.

## TimerRing

| | board | count |
|---|---|---|
| geometry | `r=54`, `stroke-width=6`, `viewBox 0 0 120 120` | 12 |

Unanimous — every ring on every board is the same circle, and it is already
what `TimerRing`'s `board` preset draws. (`viewBox 24` ×230 is the icon set,
not rings.) Nothing to change; it moves into the layer as it stands.

## The mono subline

| | count |
|---|---|
| 11px / 600, tracking `.08em` | 38 |
| 11px / 600, tracking `.07em` | 32 |
| 10px / 500, tracking `.07em` | 27 |
| 11px / 500, tracking `.07em` | 25 |

Two axes vary independently — size/weight and tracking — and no combination
clears a third of the field. What IS unanimous is the shape: small, mono,
semibold-ish, positively tracked, uppercase. The primitive takes the modal
**11px / 600 / .07em** (32, and within one notch of the top three on every
axis), and that is a decision rather than a reading: it is stated here so a
board that uses `.08em` is a difference to list, not a bug to fix.

## List row

| | count |
|---|---|
| `min-height: 44px` | 17 |
| 68px | 8 |
| 52px | 8 |
| 60px | 6 |

The 44 is the tap-target floor again, not a row height — the same figure that
dominates the button table for the same reason. The real spread is 52/60/68,
which is content-driven: a row with a thumbnail is taller than one without.
**The list row takes a min-height of 44 and is otherwise sized by content**,
which is what the boards are doing; a fixed row height would contradict 22 of
them.

## Still to measure

Metric tile · dialog · toast. These three are drawn on few enough boards that
counting adds nothing — they get read off their own board and recorded with
its name.

## Where they live today

`@gymmer/ui` ships tokens, `GmLogo`, two composables and the CSS utilities —
no controls. All 32 primitives (`GmButton`, `GmSheet`, `GmModal`, `TimerRing`,
`GmNumberInput`, …) live in `gymmer-nuxt/app/components/ui/`. Phase 0.2 is
therefore a PROMOTION as well as a rebuild: each primitive moves into the layer
and is rebuilt to the numbers above on the way.
