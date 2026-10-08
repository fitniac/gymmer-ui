# Token audit — the boards against `@gymmer/ui`

Phase 0, step 1. Every value below is read out of the files, not transcribed
from a screenshot: the board column comes from the `theme()` function the
`.dc.html` boards share, the layer column from `app/assets/css/tokens.css`.

## Where the board values come from

All 50 boards carry the same `theme()`, and it is a FUNCTION of four props —
`accent` (default `#ff563c`), `mode`, `corner` (default `soft`) and `type`
(default `Archivo + Google Sans Flex`). The table below resolves it at those
defaults, which is what every board's `$preview` renders.

Two things are worth saying before the table, because they are properties of
the boards rather than of any one token:

- **The palette is consistent.** Exactly two literal palettes appear across all
  50 boards — one dark, one light — with no drift.
- **`--track` is NOT.** Nine boards define it; five compute
  `color-mix(in srgb, ink 14%, transparent)` and four
  (`Dashboard`, `DeskToday`, `Summary`, `TabToday`) hardcode
  `#3a3735` / `#d7d3d3`. The layer matches the hardcoded pair — deliberately,
  and it says so in `tokens.css`. See the note at the end; there is nothing to
  decide.

## The table

`=` means the values are identical. Anything else is a gap and carries an
action.

### Surfaces and text

| token | board (dark) | board (light) | `@gymmer/ui` (dark) | `@gymmer/ui` (light) | action |
|---|---|---|---|---|---|
| `bg` | `#141312` | `#f3f2f2` | `#191817` | `#f3f2f2` = | **dark: adopt `#141312`** |
| `surf` | `#1d1b1a` | `#eae9e9` | `#211f1e` | `#eae9e9` = | **dark: adopt `#1d1b1a`** |
| `raised` | `#2a2725` | `#fbfafa` | `#262423` | `#fbfafa` = | **dark: adopt `#2a2725`** |
| `ink` | `#efebe7` | `#201e1d` | `#e4e1de` | `#201e1d` = | **dark: adopt `#efebe7`** |
| `body` | `#c4beb8` | `#3f3c3b` | `#bfbbb6` | `#444141` | **both: adopt the board's** |
| `muted` | `#959089` | `#605d5d` | `#948e89` | `#605d5d` = | **dark: adopt `#959089`** |
| `line` | `rgba(239,235,231,0.12)` | `rgba(32,30,29,0.14)` | — | — | **NAME GAP: no `--gm-line`.** `--gm-hairline` is the nearest (`rgba(240,238,236,.14)` / `rgba(32,30,29,.25)`); the light one is nearly twice the board's. Add `--gm-line` with the board values |
| `track` | `color-mix(ink 14%)` *or* `#3a3735` | `color-mix(ink 14%)` *or* `#d7d3d3` | `#3a3735` | `#d7d3d3` | none — already settled, see below |
| `skip` | `color-mix(muted 55%)` | same | `color-mix(var(--gm-muted) 55%)` = | = | none |

### Accent

The board's accent tokens are **computed from the accent colour**, and two of
them do not vary by mode at all. The layer's are hand-picked per family and per
mode, which is where the gaps are.

| token | board (at `#ff563c`) | `@gymmer/ui` (orange) | action |
|---|---|---|---|
| `acc` | `#ff563c` in **both** modes | dark `#ff563c` =, light `#ec3013` | **light: adopted `#ff563c`** — with a measured cost, below |
| `on-acc` | `#141312` in **both** modes (computed: relative luminance of `#ff563c` is 0.284 > 0.179, so the dark ink wins) | dark `#141312` =, light `#f7f5f3` | **light: adopt `#141312`** |
| `acc-ink` | dark `#ff563c`; light `color-mix(in oklch, #ff563c 62%, #000)` | `--acc-deep` (`#ff9783` / `#ae1800`) | **Not a gap after all.** `--acc-deep` already IS this role — the token for accent-coloured text and links, held to 4.5:1 by `test/contrast.test.mjs`. `--acc-ink` is added as the boards' name for it, computed the boards' way, and `--acc-deep` stays as the one the contrast suite guards |
| `acc-soft` | `color-mix(in srgb, #ff563c 16%, transparent)` in both modes | dark `rgba(255,86,60,.14)`, light `rgba(236,48,19,.1)` | **both: adopt the board's 16% mix** |

### Radii, fonts

| token | board | `@gymmer/ui` | action |
|---|---|---|---|
| `r` | `12px` (`corner: soft`) | `--gm-radius-card: 12px` = | none |
| `rs` | `7px` (`round(r × 0.6)`) | `--gm-radius-ctl: 7px` = | none |
| `display` | `Archivo, system-ui, sans-serif` | `"Archivo", system-ui, sans-serif` = | none |
| `font` | `Google Sans Flex, Archivo, system-ui, sans-serif` | `"Google Sans Flex", "Archivo", system-ui, sans-serif` = | none |
| `mono` | `Google Sans Flex, system-ui, sans-serif` | — | **NAME GAP: no `--gm-font-mono`.** The boards set every mono caption in Google Sans Flex, not a monospace face; the app has been reaching for `font-mono`, which is whatever the browser picks. Add it |

### Tokens the layer has and the boards do not

Not gaps, and not to be deleted: `stripe`/`stripe2`, `band`/`band-fg`, `fill`,
`border`, `on-pro`, `pro-1..3`, the shadow scale, `scrim`, `glass`,
`media-badge`, the easing and duration scales, `radius-sheet`, `radius-pill`.
The boards are screens; these exist for surfaces the boards do not draw. They
stay as they are.

## `--track` — not an open question after all

Five boards compute it from the ink and four hardcode it, and at the default
palette the two are not the same colour:

| | dark | light |
|---|---|---|
| `color-mix(in srgb, ink 14%, transparent)`, composited | **`#333130`** | **`#d5d4d4`** |
| hardcoded on four boards, and what the layer ships | `#3a3735` | `#d7d3d3` |

Two units apart in the light theme, seven in the dark — not visible except side
by side. And `tokens.css` already carries the reasoning, written when the token
was added: the computed form "IS board 15g's ink 14%", it resolves to `#d5d5d5`
over `--gm-bg`, "two levels off the value already here", and a second token for
the same colour is the drift the file exists to prevent.

So this is settled and the layer is right; the four hardcoded boards are the
canonical ones and the five computed ones round to the same thing. No action,
and no ruling needed. It is written down here only because an audit that found
two definitions and said nothing would leave the next reader to re-derive it.

## Summary of actions

| | count |
|---|---|
| values to change | 11 (7 dark surfaces/text, 1 light text, 3 accent) |
| names to add | 3 — `--gm-line`, `--acc-ink`, `--gm-font-mono` |
| contrast gaps closed | 4 — `KNOWN_GAPS` is now empty |
| contrast gaps opened | 0 |
| already identical | 8 |
| needs a ruling | 0 |


## Igor's accent ruling, 2026-10-08 (relayed)

Neither of the two options the audit offered — a third. **The accent plays two
roles on a light page and one colour cannot do both**, so it stops trying:

| role | token | value |
|---|---|---|
| **fills** — primary/secondary buttons, chips, filled tiles, accent backgrounds | `--acc` | the boards' `#ff563c` in both themes, label `--gm-on-acc` (near-black) |
| **strokes and indicators on the page ground** — TimerRing arc, progress strip done/current, focus and selected outlines, accent borders | `--gm-acc-line` *(new)* | the accent in dark; in light, the accent mixed with black in OKLCh by the largest percentage that still clears 3:1 |
| **accent text** | `--acc-deep` | unchanged, 4.5:1 |

### The computed percentages

X is "the largest value that gives ≥3.0:1 on the light page ground", so it is
per accent — each stays as close to the brand colour as the floor allows.
Computed, not chosen, and the margins are one point wide:

| family | accent | X | result | ratio | X+1 would be |
|---|---|---|---|---|---|
| orange | `#ff563c` | **97%** | `#f55239` | **3.06:1** | 2.97 ✗ |
| green | `#16a34a` | **99%** | `#16a149` | **3.02:1** | 2.95 ✗ |
| cyan | `#0891b2` | **100%** | `#0891b2` | **3.30:1** | — the accent already clears it |

Mixing with black in OKLCh is a *scale*, not an interpolation: black has zero
chroma so its hue is powerless, and the result keeps the accent's hue with L
and C multiplied by X. That is why it darkens cleanly where an sRGB mix goes
muddy.

### The test

`KNOWN_GAPS` is now **empty**. The assertion that read `--acc` on the ground is
replaced by one that reads `--gm-acc-line`, because `--acc` no longer appears
on the ground — it is a fill, judged by the label on it. Both of the old
entries went with it (`light/orange/acc` 2.83 and `light/green/acc` 2.95
annotated that one assertion).

The test resolves `color-mix(in oklch, …)` itself rather than reading a
pre-computed hex out of the stylesheet. Writing the resolved value into
`tokens.css` would have made the suite pass without testing the formula: change
an accent later and you would get a stale constant and a green run. The JS
implementation was cross-checked against an independent Python one — identical
to the digit on all three families.

### Three, not four

The ruling asks for the test to cover "all four accent options". The layer
ships **three** families (orange, green, cyan); the boards offer four option
colours (`#ff563c`, `#c8f031`, `#5cc8ff`, `#a08bff`), which are a different set
— only the orange overlaps. All three families are asserted in both themes, so
every accent that can actually be selected is covered. **If the intent was to
add the boards' four as families, say so and they go in** — for the record,
their X values are lime 70% (3.05:1), sky 80% (3.03:1), violet 92% (3.05:1).

## What this replaced — the gap that is now closed

### (the original finding, kept for the record)

The layer enforces its own contrast floors in `test/contrast.test.mjs`, and
matching the accent to the boards moved four of them. Three closed and one
opened:

| | before | after | floor |
|---|---|---|---|
| light/orange — label on a filled button | 3.86 | **5.88** | 4.5 ✓ |
| light/green — label on a filled button | 3.03 | **5.63** | 4.5 ✓ |
| light/cyan — label on a filled button | 3.39 | **5.04** | 4.5 ✓ |
| light/orange — the raw accent on the page ground | 3.74 | **2.83** | 3.0 ✗ |

The three that closed are the ones a reader meets every session: the label on
the primary button. They closed because the boards pick that label from the
ACCENT's luminance rather than the page's, so every fill takes near-black ink
instead of near-white.

The one that opened is the boards' own trade. Light mode used a darkened orange
so a single token could be both a fill and an on-the-ground colour; the boards
use `#ff563c` in both modes and give accent-coloured ink its own token. So the
raw accent against the page is brighter and softer than it was — 0.17 short of
the 3:1 this suite asks of large text, icons and chrome. Accent-coloured TEXT
is unaffected: it uses `--acc-deep`, still 4.5:1.

It is recorded in `KNOWN_GAPS` with the measured ratio, which is that suite's
own way of carrying an accepted shortfall — guarded against getting worse, and
visible in every run. **It is a brand-colour decision, so it is yours:** keep
the boards' accent and accept 2.83:1 on accent chrome, or keep `#ec3013` for
light and accept that light mode does not match the boards.
