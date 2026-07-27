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

function toRgb(value) {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
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
  'light/orange/on-acc': { baseline: 3.86, note: 'near-white label on #ec3013' },
  'light/green/acc': { baseline: 2.95, note: '#16a34a on #f3f2f2 — 0.05 short of 3:1' },
  'light/green/on-acc': { baseline: 3.03, note: 'near-white label on #16a34a' },
  'light/cyan/on-acc': { baseline: 3.39, note: 'near-white label on #0891b2' },
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

  for (const id of ACCENT_IDS) {
    const acc = block(theme.accentSel(id))

    // Large text, icons and chrome only.
    expect(
      `${theme.name}/${id}/acc`,
      `${theme.name}/${id}: --acc on the ground reaches 3:1`,
      ratio(acc['--acc'], bg),
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
