/**
 * The panel threshold and its token must agree.
 *
 * `GmSheetShell` decides sheet-versus-panel with `matchMedia`, which needs a
 * NUMBER in JavaScript; the same width is a Tailwind variant (`tab:`) built
 * from a CSS custom property. The two cannot share one literal, so nothing in
 * the build stops them drifting apart — and a threshold that disagrees with
 * its own token does not fail, it switches at the wrong width and looks like a
 * design decision.
 *
 * That is exactly how `adaptive` came to switch at 1200 while the design meant
 * tablets to get the panel: the number was right for a rule nobody had written
 * down. This test is the thing that would have caught it.
 *
 * Every assertion below is paired with a check that the PARSE found something.
 * A regex that stops matching returns undefined on both sides, and `undefined
 * === undefined` passes — so a vacuous pass is the failure mode to design out,
 * not the happy path.
 */
import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import test from 'node:test'

const css = readFileSync(new URL('../app/assets/css/gymmer.css', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../app/components/GmSheetShell.vue', import.meta.url), 'utf8')

/** `--breakpoint-<name>: <n>px` → n, or undefined if the declaration is gone. */
function token(name) {
  const m = css.match(new RegExp(`--breakpoint-${name}:\\s*(\\d+)px`))
  return m ? Number(m[1]) : undefined
}

test('the tab and desk tokens exist and are the widths the design names', () => {
  assert.equal(token('tab'), 768, 'tab is the tablet threshold')
  assert.equal(token('desk'), 1200, 'desk is the desktop threshold')
})

test('md is 900, which is why tab had to exist at all', () => {
  // Not a preference — a warning. Tailwind's default md is 768, so a rule
  // written `md:` for a tablet runs from 900 here and does nothing between.
  // If this ever becomes 768, `tab:` is redundant and this file should say so
  // rather than quietly agreeing with it.
  assert.equal(token('md'), 900)
  assert.notEqual(token('md'), token('tab'))
})

test("the shell's PANEL_FROM equals --breakpoint-tab", () => {
  const m = shell.match(/const PANEL_FROM = (\d+)/)
  // The parse control: if the constant is renamed or reshaped, fail here with
  // a message that says so, rather than comparing two undefineds and passing.
  assert.ok(m, 'PANEL_FROM not found in GmSheetShell.vue — renamed or reshaped?')
  const tab = token('tab')
  assert.ok(tab, '--breakpoint-tab not found in gymmer.css')
  assert.equal(
    Number(m[1]),
    tab,
    `PANEL_FROM is ${m[1]} but --breakpoint-tab is ${tab}; the panel would switch at the wrong width`,
  )
})

test('the shell uses the media query it computed, not a second literal', () => {
  // A stray `min-width: 1200px` back in the shell would reintroduce the split
  // this change removed, and the constant above would still look correct.
  assert.ok(
    shell.includes('`(min-width: ${PANEL_FROM}px)`'),
    'the matchMedia call should interpolate PANEL_FROM',
  )
  const strays = shell.match(/min-width:\s*\d+px/g) ?? []
  assert.deepEqual(strays, [], `hardcoded media widths left in the shell: ${strays.join(', ')}`)
})
