// Contrast guard for the token system (docs/design/accent-theme.md §8).
//
// This reads app/assets/css/tokens.css directly rather than a copy of the
// values, so retuning a neutral or adding a palette cannot ship a combination
// that fails WCAG. Run: `pnpm test:contrast`.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
// Comments are stripped first: tokens.css annotates most declarations with a
// trailing /* … */, and a naive split on `;` would fold that comment into the
// NEXT declaration's property name.
const css = readFileSync(join(here, '..', 'app', 'assets', 'css', 'tokens.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

/** Pull the declarations out of the first rule whose selector matches exactly. */
function block(selector) {
  // Selectors here are simple and attribute-based; escape the regex metachars.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  assert.ok(match, `tokens.css has no rule for \`${selector}\``)

  const out = {}
  for (const decl of match[1].split(';')) {
    const [prop, ...rest] = decl.split(':')
    if (!prop || !rest.length) continue
    out[prop.trim()] = rest.join(':').trim()
  }
  return out
}

/*
 * sRGB <-> OKLab, so `color-mix(in oklch, …)` can be resolved here instead of
 * being pre-computed into the stylesheet.
 *
 * `--gm-acc-line` is DEFINED as a mix in light mode, and writing the resolved
 * hex into tokens.css would have made this test pass without testing the
 * formula — the next person to change an accent would get a stale constant and
 * a green suite. Resolving it here means the floor is asserted against what the
 * browser will actually paint.
 *
 * Mixing with black in OKLCh is a scale, not an interpolation: black has zero
 * chroma, so its hue is powerless and the result keeps the accent's hue with L
 * and C multiplied by the percentage. That is why this darkens cleanly where an
 * sRGB mix would go muddy.
 */
const s2l = c => (c /= 255, c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const l2s = c => Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)) * 255

function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

function oklabToLin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ]
}

function toRgb(value) {
  const v = value.trim()
  const hex = v.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  const mix = v.match(/^color-mix\(in oklch,\s*(#[0-9a-f]{6})\s*([\d.]+)%,\s*#000(?:000)?\s*\)$/i)
  if (mix) {
    const pct = Number(mix[2]) / 100
    const lin = toRgb(mix[1]).map(s2l)
    const scaled = linToOklab(lin).map(x => x * pct)
    return oklabToLin(scaled).map(c => Math.round(l2s(c)))
  }

  throw new Error(`Not an opaque colour: ${value}`)
}

// WCAG 2.1 relative luminance.
function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * CIE L*a*b*, for the one question a contrast ratio cannot answer.
 *
 * "Is this legible on that" is a luminance question and `ratio` answers it.
 * "Would somebody mistake this colour for that one" is not: red and
 * red-orange sit at nearly the same brightness and look nothing alike. ΔE is
 * the measure for the second, and the two must not be used for each other's
 * job — the first draft of the danger-token test did exactly that and failed
 * a pair that is obviously distinct.
 */
function toLab(value) {
  const [r, g, b] = toRgb(value).map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const [fx, fy, fz] = [f(x), f(y), f(z)]
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** ΔE*ab (CIE76). Below ~2.3 is imperceptible; above ~10 reads as a different colour. */
function deltaE(a, b) {
  const [la, lb] = [toLab(a), toLab(b)]
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2])
}

function ratio(a, b) {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const light = block(':root')
const dark = block('html[data-theme="dark"]')

const THEMES = [
  { name: 'light', neutrals: light, accentSel: a => `html[data-accent="${a}"]` },
  {
    name: 'dark',
    // The dark block only overrides some tokens; the rest cascade from :root.
    neutrals: { ...light, ...dark },
    accentSel: a => `html[data-theme="dark"][data-accent="${a}"]`,
  },
]

const ACCENT_IDS = ['orange', 'green', 'cyan']

/**
 * Known gaps, inherited from the design bundle's light-mode values.
 *
 * These four combinations ship BELOW the ratio accent-theme.md §8 asks for.
 * Closing them means retuning brand colour, which is a design decision, not a
 * code one — so they are recorded here with the ratio measured at the time
 * rather than quietly dropped from the suite.
 *
 * Each is still asserted against its baseline, so the palette cannot drift
 * further; it just cannot fail the build until someone signs off on new hexes.
 * Dark mode passes every rule.
 */
const KNOWN_GAPS = {
  /*
   * EMPTY as of 2026-10-08, and that is the headline.
   *
   * THREE of the four gaps closed, and they were the three that mattered most:
   * a filled primary button is the accent surface a reader looks at every
   * session. The boards pick the label colour from the ACCENT's luminance
   * rather than the page's, which puts near-black ink on every one of these
   * fills instead of near-white:
   *
   *   light/orange/on-acc   3.86 → 5.88
   *   light/green/on-acc    3.03 → 5.63
   *   light/cyan/on-acc     3.39 → 5.04
   *
   * ONE opened, and it is the trade the boards make. Light mode used a
   * darkened orange (#ec3013) so the accent could serve as both a fill and an
   * on-the-ground colour; the boards use #ff563c in both modes and give
   * accent-coloured INK its own token instead. The raw accent on the page
   * ground is therefore brighter and softer than it was, and 0.17 short of
   * the 3:1 this suite asks of large text, icons and chrome.
   *
   * Recorded rather than silenced, per the note above: it is a brand-colour
   * decision. Accent-coloured TEXT is unaffected — it uses --acc-deep, which
   * is 4.5:1 and did not move.
   */
}

function expect(key, name, actual, required) {
  const gap = KNOWN_GAPS[key]

  if (!gap) {
    test(name, () => {
      assert.ok(actual >= required, `is ${actual.toFixed(2)}:1, needs ${required}:1`)
    })
    return
  }

  // Reported as outstanding work, and guarded against getting worse.
  test(`${name} — KNOWN GAP: ${gap.note}`, { todo: `${actual.toFixed(2)}:1, wants ${required}:1` }, () => {
    assert.ok(
      actual >= gap.baseline - 0.01,
      `regressed to ${actual.toFixed(2)}:1, was ${gap.baseline}:1`,
    )
    assert.ok(actual >= required, `still ${actual.toFixed(2)}:1, wants ${required}:1`)
  })
}

for (const theme of THEMES) {
  const bg = theme.neutrals['--gm-bg']

  test(`${theme.name}: body and muted text on the ground`, () => {
    const body = ratio(theme.neutrals['--gm-text-body'], bg)
    const muted = ratio(theme.neutrals['--gm-muted'], bg)
    assert.ok(body >= 4.5, `--gm-text-body on --gm-bg is ${body.toFixed(2)}:1, needs 4.5:1`)
    assert.ok(muted >= 4.5, `--gm-muted on --gm-bg is ${muted.toFixed(2)}:1, needs 4.5:1`)
  })

  // Destructive and warning, which are NOT accents and do not vary with one.
  //
  // 3:1 rather than 4.5: both are used as chip fills, icon strokes and a
  // button background — chrome and large text — and the one place --gm-danger
  // carries body copy is a confirm dialog's title, which is 20px bold and
  // therefore large text by WCAG's own definition. A token that had to clear
  // 4.5 on both grounds would end up a muddy brown in light mode and stop
  // reading as a warning at all, which is the failure that matters.
  test(`${theme.name}: --gm-danger and --gm-warn on the ground reach 3:1`, () => {
    const danger = ratio(theme.neutrals['--gm-danger'], bg)
    const warn = ratio(theme.neutrals['--gm-warn'], bg)
    assert.ok(danger >= 3, `--gm-danger on --gm-bg is ${danger.toFixed(2)}:1, needs 3:1`)
    assert.ok(warn >= 3, `--gm-warn on --gm-bg is ${warn.toFixed(2)}:1, needs 3:1`)
  })

  // They have to be TELLABLE APART from the accent, or the rule "never the
  // accent for destructive" is invisible to the person it protects.
  //
  // ΔE, not a contrast ratio. The first version of this asked for a 1.25:1
  // luminance ratio and failed at 1.14 — which measured the wrong thing
  // entirely: contrast ratio is about reading text on a ground, and two fills
  // can differ obviously in hue while sitting at the same brightness. Red on
  // red-orange is exactly that case. Measured properly, danger against the
  // orange accent is ΔE 22 (dark) and 24 (light), and warn is 57 in both —
  // well past the ~10 at which two colours stop being mistaken for each other.
  test(`${theme.name}: --gm-danger and --gm-warn are tellable apart from the accent`, () => {
    const acc = block(theme.accentSel('orange'))['--acc']
    const d = deltaE(theme.neutrals['--gm-danger'], acc)
    const w = deltaE(theme.neutrals['--gm-warn'], acc)
    assert.ok(d >= 15, `--gm-danger is ΔE ${d.toFixed(1)} from --acc — too close to read as different`)
    assert.ok(w >= 15, `--gm-warn is ΔE ${w.toFixed(1)} from --acc — too close to read as different`)
  })

  for (const id of ACCENT_IDS) {
    const acc = block(theme.accentSel(id))

    /*
     * Strokes and indicators on the page ground — Igor's ruling, 2026-10-08.
     *
     * This used to assert `--acc` itself, because one token did both jobs: the
     * fill under a button AND the arc of a ring drawn straight on the page.
     * The boards separate them, so the assertion follows: `--acc` is a FILL and
     * is judged by the label on it (below), while `--gm-acc-line` is what the
     * TimerRing arc, the progress strip, focus outlines and accent borders use,
     * and it is the one that has to be legible against the page.
     *
     * Light mode derives it by mixing the accent with black in OKLCh at the
     * largest percentage that still clears this floor — 97% orange, 99% green,
     * 100% cyan — so it stays as close to the brand colour as 3:1 allows. The
     * margins are one point wide, which is exactly why this is asserted rather
     * than trusted.
     */
    expect(
      `${theme.name}/${id}/acc-line`,
      `${theme.name}/${id}: --gm-acc-line on the ground reaches 3:1`,
      ratio(acc['--gm-acc-line'], bg),
      3,
    )

    // The token for accent body copy and links.
    expect(
      `${theme.name}/${id}/acc-deep`,
      `${theme.name}/${id}: --acc-deep on the ground reaches 4.5:1`,
      ratio(acc['--acc-deep'], bg),
      4.5,
    )

    // Filled button labels.
    expect(
      `${theme.name}/${id}/on-acc`,
      `${theme.name}/${id}: button labels on an accent fill reach 4.5:1`,
      ratio(theme.neutrals['--gm-on-acc'], acc['--acc']),
      4.5,
    )
  }
}
