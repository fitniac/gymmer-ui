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

## Sheet and dialog

| | board | `@gymmer/ui` |
|---|---|---|
| top radius (sheet) | `22px` | `--gm-radius-sheet: 22px` — **match** |
| scrim | `rgba(0,0,0,.55)` ×30 (`.62` ×8, `.45` ×6) | `--gm-scrim` — **match** |
| bottom padding | `28px` | — |

Both numbers the layer already had. One shell serves both: they differ by which
EDGE they are attached to, and therefore which corners are round — a sheet
rises from the bottom and rounds its top two, a dialog floats and rounds four.
The grab handle follows from the same fact, since only a sheet drags.

Built on `<dialog>` rather than a positioned div: the top layer, focus trapping
and Escape come from the platform, and none of the three is worth
reimplementing badly.

## Header

| | count |
|---|---|
| weight `800` | unanimous, every size |
| 20px | 18 |
| 22px | 13 |
| 28px | 10 |
| 30px | 9 |
| 26px | 9 |

The weight is settled and the size is not — a card title and a page title are
different things wearing the same type. So the weight is fixed in the primitive
and the size is a prop with the two the boards reach for most (20 and 28).

## Toast — `Article.dc.html`

The only board that draws one properly, so this is a reading rather than a
count:

```
position: absolute; left: 50%; bottom: 100px; z-index: 9
width: max-content; max-width: 340px
padding: 11px 16px; border-radius: 999px
background: var(--ink); color: var(--bg)
font: 600 13px var(--font)
box-shadow: 0 8px 30px rgba(0,0,0,.35)
animation: toast 2.6s ease both      (in at 12%, out after 85%)
```

Two things that are easy to "improve" wrongly. It is **inverted, not
accented** — a toast is the one thing on screen deliberately not part of the
page, and the brand colour would make it compete with the primary button it
usually appears beside. And `width: max-content` with a 340px cap means it is
as wide as its sentence and no wider; full width reads as a banner, which is a
heavier thing.

`bottom: 100px` is the board's number for a screen with a tab bar, so it is the
default of a prop rather than a constant — the layer already publishes
`--gm-tabbar-h` for this.

**All eight 0.2 primitives are built.** Nothing below is reviewed: the gallery
and its geometry guard are blocked until the pin moves.

| | |
|---|---|
| `GmPrimary` | 56 / 52 / 50 / 36 / 56-round |
| `GmChip` | status 22, tag 24, action 36 drawn / ≥44 target |
| `GmTile` | 62 |
| `GmSheetShell` | sheet + dialog, 22px radius, `.55` scrim |
| `GmHeader` | weight 800 fixed, size a prop |
| `GmListRow` | 44 floor, content-sized |
| `GmProgressStrip` | 4px, accent-line on track |
| `GmToast` | above |

## Where they live today

`@gymmer/ui` ships tokens, `GmLogo`, two composables and the CSS utilities —
no controls. All 32 primitives (`GmButton`, `GmSheet`, `GmModal`, `TimerRing`,
`GmNumberInput`, …) live in `gymmer-nuxt/app/components/ui/`. Phase 0.2 is
therefore a PROMOTION as well as a rebuild: each primitive moves into the layer
and is rebuilt to the numbers above on the way.


## The promotion hazard, found while building the chip

`GmChip` now exists in **both** repos, and the app's wins. Verified rather than
assumed: a fresh `nuxi prepare` resolves

    export const GmChip: typeof import("../app/components/ui/GmChip.vue")

so the layer's copy is shadowed and inert. No regression — but two things
follow for 0.3, and both are easy to walk into.

**1. A layer primitive cannot be reviewed from the app.** The app shadows it,
so the gallery has to render the layer's component explicitly rather than
relying on auto-import, or it will photograph the old one and pass.

**2. The APIs are not the same shape.** The app's chip is richer than the
boards' ruling describes:

| app `GmChip` | in the ruling? |
|---|---|
| `pressed` | yes — `selected` |
| `disabled` | yes |
| `tone: 'ink' \| 'accent'` | no |
| `removable` + `remove` event | no |
| `count` | no |
| `icon` | no |
| `to` (renders a link) | no |

The ruling covers height, interactivity and the pressed state. It does not say
what happens to a removable chip with a count, or to a chip that is a link —
all of which the app uses today (Progress' muscle chips, the filter rail, goal
chips). **The swap has to either carry them across or drop them, and that is a
decision rather than a merge.** Raised before the swap rather than discovered
during it.


## The gallery is blocked on the pin, and I had the reason backwards

I reported twice that the layer's token changes were "already live in local
builds via the symlink". **They were not.** `node_modules/@gymmer/ui` is a pnpm
symlink into the STORE, and the store holds the pinned tarball:

    node_modules/.pnpm/@gymmer+ui@…gymmer-ui+tar.gz+f572053…/node_modules/@gymmer/ui

`f572053` is this layer's `main` before any of this work. Checked directly, that
copy has `--gm-bg: #191817` (not the board's `#141312`), no `--gm-acc-line`, and
one component — `GmLogo.vue`. I had read `ls -ld` output showing a symlink and
concluded "sibling checkout"; it was the store.

Two consequences, one good and one that reorders the plan.

**Good: nothing was contaminated.** The cardio PR never depended on the layer
changes, and it was building against the same pinned tag CI uses. Had the dev
link been real, local and CI would have diverged silently — which is the trap
`CLAUDE.md` already warns about under "A layer change is not done until the pin
moves".

**The gallery cannot be built in 0.2 as planned.** It renders the LAYER's
primitives, and the app cannot see them: not by auto-import (the app's copies
shadow them), and not by path (the pinned tarball does not contain them). The
same is true of the geometry guard, which measures the gallery.

So one of these has to happen first, and it is a sequencing decision:

1. **Merge and tag `@gymmer/ui` now, bump the pin, then build the gallery.**
   The gallery and its guard then work in dev and in CI identically. It splits
   Phase 0 across two PRs rather than one.
2. **Wire the documented dev override** (`pnpm-workspace.yaml` overrides, the
   `make workspace` pattern) so local builds resolve the sibling. One PR — and
   local stops matching CI, which is exactly the divergence that made this
   worth finding.

Option 1 is the one this repo's own rule already prescribes. Not chosen here.
