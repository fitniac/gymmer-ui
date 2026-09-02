# GYMMER — merch artwork

Print-ready wordmarks for garments, caps, bottles, stickers and anything else a
vendor asks for vector art for. Open [`preview.html`](preview.html) to see all of
them on white, black and orange, with a strip at real 40 mm garment scale.

Everything in [`svg/`](svg/) is **generated** by
[`generate-wordmarks.py`](generate-wordmarks.py) from two read-only inputs:
[`../app/assets/img/logo.svg`](../app/assets/img/logo.svg) for the mark and
[`../app/assets/css/tokens.css`](../app/assets/css/tokens.css) for the orange.
Neither input is touched. Editing an SVG under `svg/` is always the wrong move —
change the script and re-run:

```bash
python3 -m venv .venv
.venv/bin/pip install fonttools uharfbuzz skia-pathops
.venv/bin/python generate-wordmarks.py
```

This is deliberately **not** wired into `pnpm brand`. That pipeline builds app
icons the two consumers actually ship; this builds artwork that leaves the repo
in an email to a printer, and it needs a Python font toolchain the layer does
not otherwise carry.

## The type

Google Sans Flex, **weight 500 (Medium), `opsz` 144, tracking 0.02 em.**

The mark is a thin double ring of even weight. A heavy wordmark beside it reads
as two unrelated brands, which is why the wordmark is Medium and not the Bold
you would normally reach for on a t-shirt — the stems match the ring. Tracking
stays near zero because Google Sans Flex's caps are already generously spaced;
opening them further pulls the double M apart.

`opsz` 144 is the display end of the optical-size axis: tighter spacing, finer
joins, thinner hairlines than the text cuts in the font's `static/` folder. None
of the static instances ship that combination, which is why the script uses the
variable font and instances it itself.

**All type is outlined.** No `<text>`, no font file to send, nothing for a RIP to
substitute. Contours are also boolean-unioned through skia-pathops, so the seams
where Y's diagonals cross its stem — and R's leg its bowl — are gone rather than
merely hidden by nonzero fill. A vinyl cutter would otherwise cut those seams as
real lines.

## The mark as a G

In both `wordmark-mark-g` layouts the mark sits **exactly in the cap band** —
top on the letters' cap line, bottom on the baseline. Flush, not overshot, which
is the deliberate exception to what a round letter normally does. An O is drawn
past both lines so it does not read small between flat-topped neighbours; the
mark is not an O. Its chamfered bar tip squares off the top-right, so the eye
finds a corner up there and wants it on the line.

`wordmark-mark-g-single` also **matches the letters' stroke weight by
measurement, not by eye.** The ring as authored is 64 units against a 688 box —
133 units once the mark is set at this cap height, where the font's own G is cut
at 216. Two rings together carry that lightness fine; one on its own goes
spindly and detaches from the word. So the script scanlines the font's G, then
bisects an outset width until a scanline across the ring reads the same number.
Re-tune `PRIMARY`'s weight and the ring follows on the next run.

The outset is stroke-and-union'd into real filled geometry, not left as a
`stroke` attribute — a stroke is a rendering instruction a vendor has to
remember to expand, and forgetting is how artwork comes back with hairlines.
Note this makes the bolder mark's box slightly non-square (738 × 735): the
chamfer grows on the diagonal. The script measures the box rather than assuming
it, which is why nothing downstream needs to care.

## The files

Eight layouts × three colours = 24 files, named
`gymmer-<layout>-<black|white|accent>.svg`.

| Layout | What it is | Reach for it on |
|---|---|---|
| `wordmark` | GYMMER, type only | The default. Chest, back, anything horizontal |
| `wordmark-mark-g` | The mark standing in for the G | Front of tee, tote, sticker — the one with personality |
| `wordmark-mark-g-single` | Same, outer ring only, emboldened to match the letters | Small print, embroidery, anywhere the double ring fills in |
| `lockup-horizontal` | Mark, gap, full word | Banners, water bottles, wide narrow spaces |
| `lockup-stacked` | Mark centred over the word | Left chest, cap crown, tote, anything squarish |
| `wordmark-condensed` | `wdth` 75 | Sleeves, side seams, tall narrow panels |
| `wordmark-tracked` | Letterspaced 0.16 em | Small sizes — cap front, hem tag, sock cuff |
| `wordmark-outline` | Hollow, 0.042-cap stroke | Big back prints, dark garments, embroidery outline |

Colours are flat and single, never gradient. `accent` is `#EC3013`, read out of
`tokens.css` at build time so merch orange cannot drift from UI orange. For
screen printing that is roughly **Pantone 1795 C**; ask the vendor to match to
the hex, and get a strike-off before a full run.

`viewBox` is trimmed to the ink with zero padding, so a vendor positions from the
artwork's real edges. The `width`/`height` of 1000px is nominal — the ratio in
`preview.html` is what matters when you scale.

**`svg/` is generated output and the script empties it on every run.** Anything
you hand-save in there under a `gymmer-*.svg` name is gone the next time you
regenerate. Add a layout to the script instead — that is what
`wordmark-mark-g-single` is.

## Before you send a file to a printer

- **Pick by garment colour, not by habit.** `-black` on light, `-white` on dark,
  `-accent` on either but never on a red or orange garment.
- **`wordmark-mark-g` has a floor of about 30 mm wide.** Below that the mark's
  inner ring gap (54 units against a 64-unit ring, so thinner than the ring
  itself) starts filling in on a screen print and closes completely in
  embroidery. `wordmark-mark-g-single` has no inner ring and therefore no floor
  — it is the one to use small, and the one to hand a digitiser. Under 30 mm on
  a single line, `wordmark-tracked` also works.
- **Embroidery wants `wordmark-outline` or `wordmark-tracked`.** A digitiser will
  ask for the simplest silhouette you have; hand them the outline file and let
  them decide on satin vs. fill.
- **DTG and screen print both take these as-is.** If a vendor asks for
  `.ai`/`.eps`, open the SVG in Illustrator and save-as — the paths are already
  outlined, so nothing changes in the round trip.
- **Never rebuild a wordmark by typing GYMMER in a design tool.** Without the
  font instanced at `opsz` 144 and shaped through its own kerning it will not
  match these files, and the difference shows when both end up on the same table.

## Related

- The mark on its own, and every app-icon raster: [`../brand/README.md`](../brand/README.md)
- Why the name is always uppercase, and the token rules: [`../CLAUDE.md`](../CLAUDE.md)
