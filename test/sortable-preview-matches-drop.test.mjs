/**
 * The drag preview and the drop read ONE number.
 *
 * `GmSortableList` resolves where a row lands by counting how many of the
 * other rows' midpoints lie above the dragged row's centre. That arithmetic
 * was always right, and until 2026-11-23 it ran only on release — so nothing
 * moved under the finger, the commit threshold sat half a row away, and a drag
 * shorter than that left the list unchanged. Filed against TestFlight build 14
 * as "Drag position for exercise not working", and measured: two drags ending
 * ~10 px short of the next midpoint each moved one place, exactly as the
 * formula says they should. A correct answer, invisible, read as a dead
 * control.
 *
 * The fix shows the gap live. The hazard the fix introduces is a SECOND copy
 * of the formula: a preview computed one way and a drop computed another drift
 * apart, and the row lands somewhere the gap never showed. That failure is
 * invisible in review — both copies look right — and it is the thing this test
 * exists to prevent.
 *
 * Source-level on purpose. This package has no component-test harness, and a
 * guard that reads the file is worth more than no guard at all; it is honest
 * about being structural rather than behavioural. The behavioural proof is a
 * paired-simulator run, recorded in gymmer-nuxt's device pass.
 */
import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import test from 'node:test'

const src = readFileSync(new URL('../app/components/GmSortableList.vue', import.meta.url), 'utf8')

/** The counting itself, wherever it appears. */
const FORMULA = /\.filter\(\(m, i\) => i !== d\.index && m < centre\)\.length/g

test('the drop formula is written exactly once', () => {
  const hits = src.match(FORMULA) ?? []
  assert.equal(
    hits.length,
    1,
    `found ${hits.length} copies of the drop formula; the preview and the drop must read one \`dropIndex\``,
  )
})

test('onPointerUp reads dropIndex rather than recomputing', () => {
  const body = src.slice(src.indexOf('function onPointerUp'))
  const upFn = body.slice(0, body.indexOf('\n}'))
  assert.match(upFn, /dropIndex\.value/, 'onPointerUp must take the drop position from `dropIndex`')
  assert.doesNotMatch(upFn, /\.filter\(/, 'onPointerUp must not count midpoints itself')
})

test('the rows that are not being dragged are offered a shift', () => {
  // The preview is the point. Without this the formula could be shared and
  // still never reach the screen — which is the state this change fixes, and
  // the state a careless revert would restore while leaving both tests above
  // green.
  assert.match(src, /function shiftFor/, 'a per-row shift must exist')
  assert.match(src, /shiftFor\(i\)/, 'and the template must use it')
})

test('the shift animates, and respects reduced motion', () => {
  assert.match(src, /transition-transform/, 'a jump is not a preview')
  assert.match(src, /motion-reduce:transition-none/, 'reduced motion must opt out')
})
