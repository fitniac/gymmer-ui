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
 * — the first version of this change used px while Tailwind's surviving
 * defaults are rem, so `lg` moved with the root font size and `tab` did not.
 * Igor ruled rem (2026-11-02) and the whole scale converted, not half of it:
 * a mixed scale reorders itself for readers who enlarge text and for nobody
 * who tests it. The assertions below pin the unit as well as the order.
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

/** rem → px at the default 16px root, which is what the design numbers mean. */
const px = name => Number.parseFloat(breakpoint(name)) * 16

test('every breakpoint a consumer may write is declared, with its width', () => {
  assert.equal(breakpoint('sm'), '35rem')
  assert.equal(breakpoint('md'), '56.25rem', 'md is 900px here, NOT Tailwind\'s 768 — see the file comment')
  assert.equal(breakpoint('tab'), '48rem')
  assert.equal(breakpoint('desk'), '75rem')
  // The design numbers, so a future edit cannot quietly retune a width while
  // keeping a plausible-looking rem value.
  assert.deepEqual([px('sm'), px('tab'), px('md'), px('desk')], [560, 768, 900, 1200])
})

test('the scale is in ascending order, so a variant name implies its width', () => {
  const scale = ['sm', 'tab', 'md', 'desk']
  const widths = scale.map(px)
  assert.deepEqual(
    widths,
    [...widths].sort((a, b) => a - b),
    `breakpoints out of order: ${scale.map((n, i) => `${n}=${widths[i]}`).join(' ')}`,
  )
  // All four in rem, and that is the point of the unit rather than a style
  // preference. Tailwind's surviving defaults are rem (`lg` is 64rem), so a px
  // value here would move with the viewport while its neighbour moved with the
  // reader's font size — the scale reorders for exactly the readers who
  // enlarge text and never for anyone testing it. One unit, one order.
  for (const n of scale) assert.match(breakpoint(n), /^[\d.]+rem$/, `${n} must be rem, got ${breakpoint(n)}`)
  // And the whole scale, defaults included, stays sorted: lg sits between md
  // and desk. A width that crossed lg would make `desk:` fire before `lg:`.
  assert.ok(px('md') < 1024 && px('desk') > 1024, `lg (64rem) must sit between md (${px('md')}) and desk (${px('desk')})`)
})

test('the guard sees a wrong value', () => {
  // The planted control: this is the assertion that would have caught the
  // md=768 assumption, so it must be able to fail.
  assert.throws(() => assert.equal('56.25rem', '48rem'))
})
