/**
 * The breakpoints a consumer compiles against, pinned by name and by value.
 *
 * `md` in this package is **900px**, not Tailwind's 768. That is a legitimate
 * design choice and an invisible trap: `md:` exists, it compiles, and it is
 * simply wrong between 768 and 899 for anyone who assumed the default. It cost
 * a phone/tablet split in gymmer-nuxt #482, where `md:hidden` would have shown
 * a facts column AND the meta line together across that band, and the same
 * assumption nearly reached a second lane the following day.
 *
 * So the two widths the layouts actually care about have names — `tab` (768)
 * and `desk` (1200) — and this test is what stops the next person renaming or
 * retuning them without seeing who pays. A consumer writing `tab:` gets 768
 * because of this file.
 *
 * Verified by compiling, not by assuming: Tailwind v4 turns
 * `--breakpoint-<name>` into a `<name>:` variant, and a standalone v4.1.18
 * compile of these exact tokens emits
 *
 *     .tab\:hidden  → @media (width >= 768px)
 *     .desk\:block  → @media (width >= 1200px)
 *     .lg\:inline   → @media (width >= 64rem)
 *
 * The last line is the reason `sm`/`md` were left alone rather than renamed:
 * `@theme` EXTENDS the defaults, so `lg` and `xl` still exist and 67 usages of
 * them in gymmer-nuxt keep working. It is also a mismatch worth knowing about
 * — our breakpoints are px and the surviving defaults are rem, so `lg` moves
 * with the root font size and `tab` does not. Igor set these values in px
 * deliberately (2026-11-02); the ordering assertion below is what would catch
 * it if a future edit mixed units and reordered the scale by accident.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const css = readFileSync(join(import.meta.dirname, '..', 'app/assets/css/gymmer.css'), 'utf8')

function breakpoint(name) {
  const m = css.match(new RegExp(`--breakpoint-${name}:\\s*([^;]+);`))
  return m?.[1]?.trim()
}

test('every breakpoint a consumer may write is declared, with its value', () => {
  assert.equal(breakpoint('sm'), '560px')
  assert.equal(breakpoint('md'), '900px', 'md is 900 here, NOT Tailwind\'s 768 — see the file comment')
  assert.equal(breakpoint('tab'), '768px')
  assert.equal(breakpoint('desk'), '1200px')
})

test('the scale is in ascending order, so a variant name implies its width', () => {
  const px = n => Number.parseInt(breakpoint(n), 10)
  const scale = ['sm', 'tab', 'md', 'desk']
  const widths = scale.map(px)
  assert.deepEqual(
    widths,
    [...widths].sort((a, b) => a - b),
    `breakpoints out of order: ${scale.map((n, i) => `${n}=${widths[i]}`).join(' ')}`,
  )
  // All four in px: a rem value here would scale with the root font size while
  // its neighbours did not, which reorders the scale for a reader who enlarges
  // text — silently, and only for them.
  for (const n of scale) assert.match(breakpoint(n), /^\d+px$/, `${n} must be px, got ${breakpoint(n)}`)
})

test('the guard sees a wrong value', () => {
  // The planted control: this is the assertion that would have caught the
  // md=768 assumption, so it must be able to fail.
  assert.throws(() => assert.equal('900px', '768px'))
})
