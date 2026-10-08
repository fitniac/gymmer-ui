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
height the row around it wants. Counting cannot answer this one, so it is a
**design question** rather than a measurement: either chips get one height and
every board that used another is wrong, or the primitive takes a size prop and
the screens pick. Raised in the PR; not guessed at here.

## Still to measure

Metric tile · dialog · list row · header (title + mono subline) · TimerRing ·
toast. Each gets a row here as it is built, counted the same way.

## Where they live today

`@gymmer/ui` ships tokens, `GmLogo`, two composables and the CSS utilities —
no controls. All 32 primitives (`GmButton`, `GmSheet`, `GmModal`, `TimerRing`,
`GmNumberInput`, …) live in `gymmer-nuxt/app/components/ui/`. Phase 0.2 is
therefore a PROMOTION as well as a rebuild: each primitive moves into the layer
and is rebuilt to the numbers above on the way.
