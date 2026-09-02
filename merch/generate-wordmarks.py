#!/usr/bin/env python3
"""
Regenerates merch/svg/ — the print-ready GYMMER wordmarks.

    python3 -m venv .venv && .venv/bin/pip install fonttools uharfbuzz
    .venv/bin/python generate-wordmarks.py

Nothing here is hand-authored. The letterforms come from Google Sans Flex (the
variable font, instanced per layout), the mark's geometry is parsed out of
../app/assets/img/logo.svg, and the accent hex out of ../app/assets/css/tokens.css.
Retune either and re-run; never edit an SVG under svg/.

This script is deliberately NOT wired into `pnpm brand`. Merch artwork is a
one-off deliverable that goes to a printer, not a build artifact the apps
consume, and it needs a Python font toolchain the layer does not otherwise
carry. `pnpm brand` and this script share only their two read-only inputs.

Every letter is an outlined path — no <text>, no font dependency, no live type.
That is the one hard requirement print vendors have; a wordmark that ships as
<text> renders in whatever the RIP falls back to, which is never the right face.

Kerning is real: uharfbuzz shapes the string through the font's own GPOS, so the
Y/M pair sits where the type designer put it. Tracking is added on top, per
layout, in em units.
"""
import io
import re
import sys
import functools
from pathlib import Path

try:
    import uharfbuzz as hb
    import pathops
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.svgLib.path import parse_path
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.misc.transform import Transform
except ImportError:
    sys.exit("needs: pip install fonttools uharfbuzz skia-pathops  (see the docstring)")

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "svg"

# The variable font, not one of the /static cuts: the layouts below want axis
# values (wdth 75, opsz 144) that no static instance ships.
FONT = Path(
    "~/Downloads/DM_Mono,Google_Sans,Google_Sans_Flex,Montserrat,Sono/"
    "Google_Sans_Flex/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf"
).expanduser()

WORD = "GYMMER"

# ── the mark ─────────────────────────────────────────────────────────────────
# In logo.svg's own 1024 viewBox the mark's box is 168…856 on both axes. It is
# measured rather than assumed below, because the bolder variant strokes the
# geometry and grows past it — see brand/README.md, "Sizing: two different
# measurements", for why that box is not obvious in the first place.
MARK_CENTRE = 512  # of logo.svg's viewBox; the scanline height for ring weight


def mark_path(rings="double") -> str:
    """The mark's geometry, lifted out of logo.svg.

    `rings="single"` keeps only the outer ring. The mark is authored as two
    subpaths — outer ring then inner ring, in that order — so dropping
    everything from the second `M` is the whole operation. Each subpath traces
    its band as one closed contour (in along the inner edge, back along the
    outer), so the outer one stands alone without needing the other to punch a
    hole in it, and its bounding box is unchanged: the box is set by the outer
    radius and the bar tip, both of which live on the subpath that stays.
    """
    src = (ROOT / "app/assets/img/logo.svg").read_text()
    m = re.search(r'<path[^>]*\sd="(.*?)"', src, re.S)
    if not m:
        sys.exit("no <path d> in logo.svg — did the mark stop being a single path?")
    d = " ".join(m.group(1).split())
    if rings == "single":
        subpaths = re.findall(r"M[^M]*", d)
        if len(subpaths) != 2:
            sys.exit(f"expected 2 subpaths in the mark, found {len(subpaths)}")
        d = subpaths[0].strip()
    return d


def spans(path, y):
    """Ink runs where a horizontal scanline at `y` crosses `path`, left to right.

    A ruler. Used to read a letter's stem off its outline and the mark's ring
    weight off its geometry, so the two can be matched by measurement instead of
    by eye — see match_ring_to_stem().
    """
    band = pathops.Path()
    pen = band.getPen()
    pen.moveTo((-1e5, y - 0.5))
    pen.lineTo((1e5, y - 0.5))
    pen.lineTo((1e5, y + 0.5))
    pen.lineTo((-1e5, y + 0.5))
    pen.closePath()
    hit = pathops.op(path, band, pathops.PathOp.INTERSECTION)
    out = []
    for contour in hit.contours:
        b = BoundsPen(None)
        contour.draw(b)
        out.append((b.bounds[0], b.bounds[2]))
    return sorted(out)


def bounds(path):
    b = BoundsPen(None)
    path.draw(b)
    return b.bounds


def embolden(path, width):
    """Outset `path` by width/2 all round, as real filled geometry.

    Stroke-and-union rather than a `stroke` attribute on the output: a stroke is
    a rendering instruction that a print vendor has to remember to expand, and
    forgetting is how artwork comes back with hairlines. Mitred, so the mark's
    45° chamfers stay 45° instead of rounding off.
    """
    grown = pathops.Path()
    path.draw(grown.getPen())
    grown.stroke(width, pathops.LineCap.BUTT_CAP, pathops.LineJoin.MITER_JOIN, 10.0)
    return pathops.op(path, grown, pathops.PathOp.UNION)


def match_ring_to_stem(path, target, cap):
    """How much to embolden `path` so its ring reads at `target` once the whole
    mark is scaled to `cap` tall. Returns the outset width, in mark units.

    Solved by bisection rather than algebra. Emboldening moves the bounding box
    as well as the ring — the chamfered bar tip grows diagonally, so the box
    does not simply gain the outset width — and the scale factor depends on that
    box, so the two are coupled. Twelve halvings gets well inside a rounding
    error at any size this will ever print.
    """
    def ring_at(width):
        p = embolden(path, width) if width else path
        x0, y0, x1, y1 = bounds(p)
        left = spans(p, MARK_CENTRE)[0]          # the ring's left side
        return (left[1] - left[0]) * cap / (y1 - y0)

    lo, hi = 0.0, 400.0
    for _ in range(48):
        mid = (lo + hi) / 2
        if ring_at(mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def mark_geometry(rings="double", match_stem=None):
    """(path_d, bbox) for a mark variant, in logo.svg's own 1024 coordinates."""
    path = pathops.Path()
    parse_path(mark_path(rings), path.getPen())
    if match_stem:
        path = embolden(path, match_ring_to_stem(path, *match_stem))
        path = pathops.simplify(path, fix_winding=True, clockwise=False)
    pen = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    path.draw(pen)
    return pen.getCommands(), bounds(path)


def stem_width(**kw):
    """The letters' stroke weight, measured off the G's left side at mid-cap.

    The G specifically, not the E: a ring standing in for a letter has to match
    what the letter it replaces actually weighs, and a round letter's side
    stroke is cut a little lighter than a flat stem to compensate for the
    curve — 216 against the E's 222 at weight 500.
    """
    data = _instance(kw.get("wght", 500), kw.get("wdth", 100), kw.get("opsz", 144))
    f = TTFont(io.BytesIO(data))
    cap = f["OS/2"].sCapHeight
    path = pathops.Path()
    f.getGlyphSet()[f.getBestCmap()[ord("G")]].draw(path.getPen())
    left = spans(path, cap / 2)[0]
    return left[1] - left[0], cap


def accent() -> str:
    """The light-theme accent literal, so merch orange can never drift from UI orange."""
    css = (ROOT / "app/assets/css/tokens.css").read_text()
    m = re.search(r"--acc:\s*(#[0-9a-fA-F]{6})", css)
    return m.group(1).upper() if m else "#EC3013"


# ── type ─────────────────────────────────────────────────────────────────────
@functools.lru_cache(maxsize=None)
def _instance(wght, wdth, opsz):
    f = TTFont(FONT)
    instantiateVariableFont(
        f,
        {"wght": wght, "wdth": wdth, "opsz": opsz, "ROND": 0, "GRAD": 0, "slnt": 0},
        inplace=True,
    )
    buf = io.BytesIO()
    f.save(buf)
    return buf.getvalue()


def typeset(text, wght=800, wdth=100, opsz=144, tracking=0.0):
    """Outline `text` as one overlap-free path. Baseline y=0, y-down (SVG).

    Returns (path_d, (x0, y0, x1, y1), cap_height) in font units (upem 2000).

    The contours go through skia-pathops before they come out. Inside a single
    glyph the font's contours overlap freely — Y's two diagonals cross its stem,
    R's leg crosses its bowl — because nonzero fill hides the seams. That is
    fine on screen and wrong for merch: a vinyl cutter follows every contour it
    is given and would cut the seams as real lines, an outline treatment strokes
    them visibly, and some RIPs resolve them as evenodd and knock white notches
    through the joins. simplify() unions them into the silhouette, so what ships
    is the shape you actually see.
    """
    data = _instance(wght, wdth, opsz)

    face = hb.Face(data)
    hbf = hb.Font(face)
    hbf.scale = (face.upem, face.upem)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": True})

    f = TTFont(io.BytesIO(data))
    glyphs, order = f.getGlyphSet(), f.getGlyphOrder()

    raw = pathops.Path()
    rawpen = raw.getPen()
    x = 0.0
    track = tracking * face.upem
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        # y-flip here, so everything downstream is in SVG coordinates
        glyphs[order[info.codepoint]].draw(
            TransformPen(rawpen, Transform(1, 0, 0, -1, x + pos.x_offset, 0))
        )
        x += pos.x_advance + track

    merged = pathops.simplify(raw, fix_winding=True, clockwise=False)

    pen = SVGPathPen(None, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    bounds = BoundsPen(None)
    merged.draw(pen)
    merged.draw(bounds)
    return pen.getCommands(), bounds.bounds, f["OS/2"].sCapHeight


def place_mark(height, x, y, variant="double"):
    """The mark as a <path> transform, its box scaled to `height` at (x, y).

    fill-rule is per-path and never on the wrapping <g>: the mark needs evenodd
    to keep the ring counters open, and the letters need nonzero — Y's diagonals
    and R's leg overlap their stems, and evenodd knocks a white notch out of
    every one of those joins.
    """
    d, (mx0, my0, mx1, my1) = MARKS[variant]
    s = height / (my1 - my0)
    return (
        f'<path fill-rule="evenodd" d="{d}" '
        f'transform="translate({x:.1f} {y:.1f}) scale({s:.6f}) '
        f'translate({-mx0:.2f} {-my0:.2f})"/>'
    )


def mark_width(height, variant="double"):
    """How wide the mark ends up when set `height` tall."""
    _, (mx0, my0, mx1, my1) = MARKS[variant]
    return (mx1 - mx0) * height / (my1 - my0)


def union(*boxes):
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


# ── layouts ──────────────────────────────────────────────────────────────────
# Each returns (body_svg, bbox, paint). `paint` is a callable taking the colour
# and returning the wrapping <g>'s attributes as a dict — a dict rather than a
# string so an outline layout can replace `fill` instead of emitting a second
# one next to it, which is a hard XML error and renders nothing at all.
def solid(colour):
    return {"fill": colour}


# Where the mark sits when it is standing in for the G: exactly in the cap band,
# top on the letters' cap line, bottom on the baseline.
#
# Flush rather than overshot, which is the deliberate exception to what a round
# letter normally does — an O is drawn past both lines so it does not read small
# between flat-topped neighbours. The mark is not really an O. Its chamfered bar
# tip squares off the top-right, so the eye finds a corner up there and wants
# that corner on the line; overshoot just reads as a logo sitting too high.
#
# MARK_GAP is tighter than the font's own sidebearings, because a circle
# followed by a Y already has a wedge of air between them.
MARK_GAP = 0.045

# Weight 500. The mark is a thin, even-weight double ring, and a heavy wordmark
# next to it looks like two different brands — 500 is the cut whose stems match
# the ring. Tracking stays near zero: Google Sans Flex's own caps spacing is
# already generous, and opening it further makes the double M drift apart.
PRIMARY = dict(wght=500, wdth=100, tracking=0.02)
CONDENSED = dict(wght=500, wdth=75, tracking=0.02)
TRACKED = dict(wght=500, wdth=100, tracking=0.16)


def layout_wordmark(**kw):
    d, box, _ = typeset(WORD, **{**PRIMARY, **kw})
    return f'<path d="{d}"/>', box, solid


def _mark_g(variant, **kw):
    """The mark standing in for the G, set in the cap band. See MARK_GAP above."""
    d, box, cap = typeset(WORD[1:], **{**PRIMARY, **kw})
    mw = mark_width(cap, variant)
    dx = mw + MARK_GAP * cap - box[0]
    body = (place_mark(cap, 0, -cap, variant)
            + f'<path d="{d}" transform="translate({dx:.1f} 0)"/>')
    return body, union((0, -cap, mw, 0),
                       (box[0] + dx, box[1], box[2] + dx, box[3])), solid


def layout_mark_g(**kw):
    return _mark_g("double", **kw)


def layout_mark_g_single(**kw):
    """Outer ring only, emboldened to the weight of the letters it sits among.

    The ring as authored is 64 units against a 688 box — 133 units once the mark
    is set at this cap height, where the letters' own G is cut at 216. That gap
    is invisible in the double-ring mark, where two rings together carry the
    weight, and glaring in a single one: the G goes spindly and detaches from
    the word. So the ring is outset until a scanline across it measures what a
    scanline across the font's G measures.
    """
    return _mark_g("single-bold", **kw)


def layout_lockup_h(**kw):
    """Mark, then the full word. Reads as logo-plus-name, not as a substitution,
    so the mark goes taller than cap height and the gap goes much wider."""
    d, box, cap = typeset(WORD, **{**PRIMARY, **kw})
    mh = 1.30 * cap
    mw = mark_width(mh)
    my = -cap / 2 - mh / 2
    dx = mw + 0.34 * cap - box[0]
    body = place_mark(mh, 0, my) + f'<path d="{d}" transform="translate({dx:.1f} 0)"/>'
    return body, union((0, my, mw, my + mh), (box[0] + dx, box[1], box[2] + dx, box[3])), solid


def layout_lockup_stacked(**kw):
    """Mark centred over the word. The chest-print / tote / cap-crown shape."""
    d, box, cap = typeset(WORD, **{**PRIMARY, **kw})
    w = box[2] - box[0]
    # Sized against the WORD's width, not its cap height. GYMMER is six wide
    # letters, so a mark scaled off cap height alone comes out looking like a
    # bullet point sitting on a long bar. 0.30 puts the mark's diameter at
    # roughly the width of two letters, which holds the stack together.
    mh = 0.30 * w
    mw = mark_width(mh)
    mx = (w - mw) / 2 - box[0]
    gap = 0.26 * cap  # mark's bottom to the letters' cap line
    dy = -box[1]      # word's ink top down to y=0 … then push it below the mark
    off = mh + gap
    body = place_mark(mh, mx, 0) + f'<path d="{d}" transform="translate(0 {off + dy:.1f})"/>'
    return body, union((mx, 0, mx + mw, mh),
                       (box[0], box[1] + off + dy, box[2], box[3] + off + dy)), solid


def layout_condensed(**kw):
    d, box, _ = typeset(WORD, **{**CONDENSED, **kw})
    return f'<path d="{d}"/>', box, solid


def layout_tracked(**kw):
    d, box, _ = typeset(WORD, **{**TRACKED, **kw})
    return f'<path d="{d}"/>', box, solid


def layout_outline(**kw):
    """Hollow letters. Drawn from a heavier cut than the solid wordmark, the
    opposite of what it looks like it should be: the stroke is centred on the
    contour, so a 500-weight stem ends up as two lines almost touching. 700
    gives the counter room to actually read as a counter."""
    d, box, cap = typeset(WORD, wght=700, wdth=100, tracking=0.04, **kw)
    sw = 0.042 * cap
    # the stroke straddles the contour, so half of it lands outside the ink box
    box = (box[0] - sw / 2, box[1] - sw / 2, box[2] + sw / 2, box[3] + sw / 2)

    def paint(colour):
        return {
            "fill": "none",
            "stroke": colour,
            "stroke-width": f"{sw:.1f}",
            "stroke-linejoin": "miter",
            "stroke-miterlimit": "6",
        }

    return f'<path d="{d}"/>', box, paint


LAYOUTS = {
    "wordmark": (layout_wordmark, "GYMMER, Google Sans Flex Medium"),
    "wordmark-mark-g": (layout_mark_g, "GYMMER with the mark standing in for the G"),
    "wordmark-mark-g-single": (
        layout_mark_g_single,
        "As above, outer ring only, emboldened to the letters' stroke",
    ),
    "wordmark-condensed": (layout_condensed, "GYMMER condensed, for tall and narrow placements"),
    "wordmark-tracked": (layout_tracked, "GYMMER letterspaced light, for small placements"),
    "wordmark-outline": (layout_outline, "GYMMER hollow, one-colour outline"),
    "lockup-horizontal": (layout_lockup_h, "Mark beside the GYMMER wordmark"),
    "lockup-stacked": (layout_lockup_stacked, "Mark centred above the GYMMER wordmark"),
}

COLOURS = {"black": "#000000", "white": "#FFFFFF", "accent": accent()}

# ── emit ─────────────────────────────────────────────────────────────────────
STEM = stem_width(**PRIMARY)  # (weight, cap height) of the font's own G
MARKS = {
    "double": mark_geometry("double"),
    "single": mark_geometry("single"),
    "single-bold": mark_geometry("single", match_stem=STEM),
}
PAD = 0  # print artwork is trimmed to its ink; a vendor positions from the box


def write(name, colour_name, colour, body, box, paint):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    # 1000-unit-wide nominal size: an unlabelled SVG lands somewhere sane in
    # Illustrator, and the viewBox is what actually carries the proportions.
    px_w = 1000
    px_h = round(px_w * h / w)
    attrs = " ".join(f'{k}="{v}"' for k, v in paint(colour).items())
    doc = (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<!-- GYMMER {name} / {colour_name}. Generated by merch/generate-wordmarks.py —\n'
        f'     do not edit; change the script, logo.svg or tokens.css and re-run.\n'
        f'     All type is outlined. Single flat colour, no gradient. -->\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" role="img"'
        f' viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}"'
        f' width="{px_w}" height="{px_h}">\n'
        f'  <title>GYMMER</title>\n'
        f'  <g {attrs}>{body}</g>\n'
        f'</svg>\n'
    )
    (OUT / f"gymmer-{name}-{colour_name}.svg").write_text(doc)


def preview(built):
    """A local contact sheet. Each layout on the three grounds it will actually
    be printed on, plus a strip at garment scale — a wordmark that looks
    resolved at 900px can still close up its counters at 40mm on a cap."""
    rows = []
    for name, blurb, box in built:
        w, h = box[2] - box[0], box[3] - box[1]
        cells = "".join(
            f'<div class="cell {g}"><img src="svg/gymmer-{name}-{c}.svg" alt=""></div>'
            for g, c in (("lt", "black"), ("dk", "white"), ("lt", "accent"))
        )
        rows.append(
            f'<section><h2>{name}<em>{blurb}</em>'
            f'<code>{w:.0f} × {h:.0f} — ratio {w / h:.2f} : 1</code></h2>'
            f'<div class="grid">{cells}</div>'
            f'<div class="small"><img src="svg/gymmer-{name}-black.svg" alt="">'
            f'<span>at 40 mm — cap front / sleeve / hem</span></div></section>'
        )
    (HERE / "preview.html").write_text(
        "<!doctype html><meta charset=utf-8><title>GYMMER merch artwork</title>"
        "<style>"
        "body{font:14px/1.5 ui-sans-serif,system-ui;margin:0;padding:40px;"
        "background:#fafafa;color:#111}"
        "h1{font-size:20px;letter-spacing:.02em;margin:0 0 32px}"
        "section{margin:0 0 40px;border-top:2px solid #111;padding-top:12px}"
        "h2{font-size:13px;font-weight:600;margin:0 0 12px;display:flex;gap:16px;"
        "align-items:baseline;flex-wrap:wrap}"
        "h2 em{font-weight:400;font-style:normal;color:#666}"
        "h2 code{margin-left:auto;color:#999;font-size:12px}"
        ".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}"
        ".cell{display:grid;place-items:center;padding:28px;min-height:120px}"
        ".lt{background:#fff}.dk{background:#111}"
        ".cell img{width:100%;max-height:150px;object-fit:contain}"
        ".small{display:flex;align-items:center;gap:16px;background:#fff;"
        "padding:20px 28px;margin-top:2px}"
        ".small img{width:151px}"  # 40mm at 96dpi
        ".small span{color:#999;font-size:12px}"
        "</style><h1>GYMMER — merch artwork</h1>" + "".join(rows)
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("gymmer-*.svg"):
        old.unlink()
    built, n = [], 0
    for name, (fn, blurb) in LAYOUTS.items():
        body, box, paint = fn()
        for cname, colour in COLOURS.items():
            write(name, cname, colour, body, box, paint)
            n += 1
        built.append((name, blurb, box))
    preview(built)
    print(f"wrote {n} files to {OUT}, plus preview.html")


if __name__ == "__main__":
    main()
