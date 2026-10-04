/**
 * No new unlayered CSS.
 *
 * Unlayered rules beat every layered rule regardless of specificity, and
 * Tailwind generates utilities into a layer. So an unlayered rule in this
 * package is not a local style — it is one that no consuming app can override
 * with a utility, in any component, forever.
 *
 * That is not theoretical. Before this test, `a { color: var(--acc-deep) }`
 * and `.logo-wg { display: inline-flex }` sat outside a layer, and gymmer-nuxt
 * paid for them four times in a single branch: three labels rendered in the
 * link colour on an accent fill — legible enough to pass a glance and not
 * enough to read — and a header that drew both lockups at once, the mark
 * stacked above the wordmark, which reads as a logo that wraps. Each was
 * diagnosed from a screenshot and worked around with a scoped rule in the
 * consumer, which is the wrong place for every one of them.
 *
 * Two kinds of unlayered rule are legitimate and the test knows both:
 *
 *   - **Token definitions.** `:root` and `html[data-theme=…]` declare custom
 *     properties. They have to stay unlayered — the theme attribute must keep
 *     winning over `:root` — and custom properties do not take part in the
 *     cascade the way declarations do. Recognised structurally, not listed, so
 *     a new palette needs no change here. A rule that *looks* like a token
 *     block but declares a real property is not one, and fails.
 *   - **Tailwind directives.** `@theme` and `@utility` are not rules; Tailwind
 *     layers what it generates from them.
 *
 * Anything else needs a line in EXCEPTIONS saying why it must outrank a
 * consumer's utilities. The list is meant to stay short.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isRootTokenRule, LAYOUT_PROPS, readRules, unlayeredRules } from '../scripts/css-layers.mjs'

const FILES = [
  'app/assets/css/tokens.css',
  'app/assets/css/gymmer.css',
]

/** selector → why it must beat a consumer's utilities. */
const EXCEPTIONS = {
  'html[data-theme="dark"] .grayscale, html[data-theme="dark"] .photo':
    'The dark-mode photo treatment has to override the `photo` utility it '
    + 'modifies, which Tailwind puts in a layer. Layering this rule would make '
    + 'the utility win and every photograph would punch a hole in a dark page.',
}

test('every rule is in a cascade layer, or says why not', () => {
  const offenders = []
  for (const file of FILES) {
    for (const rule of unlayeredRules(file)) {
      if (rule.directive) continue
      if (isRootTokenRule(rule)) continue
      if (EXCEPTIONS[rule.selector]) continue
      offenders.push(`${file}:${rule.line}  ${rule.selector}  {${rule.props.join('; ')}}`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'Unlayered CSS beats every utility in every consuming app.\n'
    + 'Move these into `@layer components` (or `@layer base` for element\n'
    + 'defaults), or add them to EXCEPTIONS in this file with a reason:\n\n'
    + offenders.map(o => `  ${o}`).join('\n'),
  )
})

test('the exceptions list has not gone stale', () => {
  // An exception for a rule that no longer exists is a comment pretending to
  // be a guard, and the next person reads it as current.
  const selectors = new Set(
    FILES.flatMap(f => unlayeredRules(f)).map(r => r.selector),
  )
  for (const selector of Object.keys(EXCEPTIONS)) {
    assert.ok(
      selectors.has(selector),
      `EXCEPTIONS lists "${selector}", which is no longer an unlayered rule. Remove it.`,
    )
  }
})

/**
 * No paint under a state selector in layered CSS.
 *
 * The guard that v0.3.6 needed and did not have. Two designs were possible:
 *
 *   (a) fail when a layered state rule sets a property that a CONSUMING app
 *       also sets with a static utility on the same element;
 *   (b) fail when a layered state rule sets a painting property at all.
 *
 * This is (b), because (a) cannot be written here honestly: the package cannot
 * see its consumers, so it could only approximate the conflict and would pass
 * for an app it had never been built against. (b) is a property the layer can
 * hold itself to with no outside knowledge, and it is the right rule anyway —
 * a layered `:hover { background }` loses to ANY static `bg-*` on the element,
 * whatever specificity it carries, so it is a promise this package cannot
 * keep for anybody.
 *
 * Painting states belong on the component as `hover:` / `active:` /
 * `focus-visible:` / `disabled:` utilities, where they sit in the same layer
 * as the static ones and the later rule wins as everyone expects.
 */
const PAINT = /^(background|background-color|color|border(-\w+)?-color|outline|outline-color|box-shadow|fill|stroke)$/
const STATE = /(:hover|:active|:focus|:focus-visible|:disabled|:checked|\[aria-|\[data-state|\[open\])/

/** selector → why this one may paint under a state. */
const STATE_EXCEPTIONS = {
  '.pri:hover, .gho:hover':
    'The offset-shadow press. `box-shadow` here is the motion, not decoration, '
    + 'and 174 call sites share it. A consumer must not put a static `shadow-*` '
    + 'utility on a `.pri`/`.gho` button — one did, and that button was the only '
    + 'one on the app that did not lift when pointed at.',
  '.pri:active, .gho:active':
    'Same press, sunk rather than lifted.',
  '.pri:disabled:hover, .gho:disabled:hover':
    'Undoes the press on a disabled button. Shadow only; the colours this rule '
    + 'used to restore are the component\'s business now.',
  'a:hover':
    'An ELEMENT default, not a component rule: a bare link has to change colour '
    + 'on hover and there is no component to hang a `hover:` utility on. The '
    + 'consequence is real and intended — a link that states its own colour with '
    + 'a utility keeps it on hover unless it also states `hover:text-*`.',
  ':focus-visible':
    'The global focus ring. It must reach every focusable element, including '
    + 'ones no component styles, so it cannot be a per-component utility. An app '
    + 'that sets a static `outline-*` utility would lose its ring — which is why '
    + 'the release checked every focusable element under a forced Tab focus.',
  '.row:hover':
    '`.row` is a bare marker class with no utilities on it. If a consumer ever '
    + 'gives a row a static background utility this rule stops applying, and '
    + 'this package cannot see that happen — the entry is the record of the risk.',
}

test('no layered state rule paints what a utility could', () => {
  const offenders = []
  for (const file of FILES) {
    const src = readRules(file)
    for (const rule of src) {
      if (!rule.layered) continue
      if (!STATE.test(rule.selector)) continue
      if (STATE_EXCEPTIONS[rule.selector]) continue
      const paint = rule.props.filter(p => PAINT.test(p))
      if (paint.length) offenders.push(`${file}:${rule.line}  ${rule.selector}  → ${paint.join(', ')}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'A layered `:hover` loses to any static utility for the same property.\n'
    + 'Move these onto the component as `hover:` / `active:` / `focus-visible:`\n'
    + '/ `disabled:` utilities, or add an entry to STATE_EXCEPTIONS saying why\n'
    + 'no utility can compete with it:\n\n'
    + offenders.map(o => `  ${o}`).join('\n'),
  )
})

test('the state exceptions have not gone stale', () => {
  const selectors = new Set(FILES.flatMap(f => readRules(f)).map(r => r.selector))
  for (const selector of Object.keys(STATE_EXCEPTIONS)) {
    assert.ok(
      selectors.has(selector),
      `STATE_EXCEPTIONS lists "${selector}", which no longer exists. Remove it.`,
    )
  }
})

test('no unlayered rule sets a layout property', () => {
  // The sharpest edge of the same problem: a consumer cannot hide, move or
  // resize one of this layer's components without an unlayered rule of its own.
  // `display` is the one that bit — twice.
  const offenders = []
  for (const file of FILES) {
    for (const rule of unlayeredRules(file)) {
      if (rule.directive || isRootTokenRule(rule)) continue
      const risky = rule.props.filter(p => LAYOUT_PROPS.test(p))
      if (risky.length) offenders.push(`${file}:${rule.line}  ${rule.selector}  → ${risky.join(', ')}`)
    }
  }
  assert.deepEqual(offenders, [], `Unlayered layout properties:\n${offenders.join('\n')}`)
})
