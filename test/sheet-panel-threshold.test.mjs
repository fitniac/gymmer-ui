/**
 * The shell's panel threshold must agree with `--breakpoint-tab`.
 *
 * `test/breakpoints.test.mjs` already asserts the tokens themselves — their
 * rem values, their px equivalents and their order. This file asserts the one
 * thing that file cannot see: that `GmSheetShell`'s JavaScript agrees with
 * them.
 *
 * It has to be a separate assertion because the two cannot share a literal.
 * `matchMedia` needs a NUMBER in JavaScript; `tab:` is a Tailwind variant
 * built from a custom property. Nothing in the build compares them — and a
 * threshold that disagrees with its own token does not fail. It switches at
 * the wrong width and reads as a design decision.
 *
 * That is exactly how `adaptive` came to switch at 1200 while the design meant
 * tablets to get the panel: the number was defensible for a rule nobody had
 * written down, so nothing ever contradicted it.
 *
 * Both assertions are paired with a check that the PARSE found something. A
 * regex that stops matching returns undefined on both sides, and `undefined
 * === undefined` passes — so a vacuous pass is the failure mode to design out.
 * This file's first version parsed `px` and would have silently stopped
 * measuring when the scale moved to rem; it failed loudly instead, which is
 * the only reason it is written this way.
 */
import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import test from 'node:test'

const css = readFileSync(new URL('../app/assets/css/gymmer.css', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../app/components/GmSheetShell.vue', import.meta.url), 'utf8')

/**
 * `--breakpoint-tab` in CSS pixels.
 *
 * Accepts rem or px so a future unit change fails on the VALUE rather than on
 * the regex — the scale is rem today (deliberately, so it does not invert for
 * a reader who enlarges text), and a silent non-match is what this file exists
 * to avoid.
 */
function tabPx() {
  const m = css.match(/--breakpoint-tab:\s*([\d.]+)(rem|px)/)
  if (!m) return undefined
  return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1])
}

test("the shell's PANEL_FROM equals --breakpoint-tab", () => {
  const m = shell.match(/const PANEL_FROM = (\d+)/)
  assert.ok(m, 'PANEL_FROM not found in GmSheetShell.vue — renamed or reshaped?')
  const tab = tabPx()
  assert.ok(tab, '--breakpoint-tab not found in gymmer.css, or not in rem/px')
  assert.equal(
    Number(m[1]),
    tab,
    `PANEL_FROM is ${m[1]} but --breakpoint-tab is ${tab}px; the panel would switch at the wrong width`,
  )
})

test('the shell computes its media query rather than repeating the width', () => {
  assert.ok(
    shell.includes('`(min-width: ${PANEL_FROM}px)`'),
    'the matchMedia call should interpolate PANEL_FROM',
  )
  // A stray `min-width: 1200px` would reintroduce the split this removed, and
  // the assertion above would still read as correct.
  const strays = shell.match(/min-width:\s*\d+px/g) ?? []
  assert.deepEqual(strays, [], `hardcoded media widths left in the shell: ${strays.join(', ')}`)
})
