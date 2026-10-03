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
import { isRootTokenRule, LAYOUT_PROPS, unlayeredRules } from '../scripts/css-layers.mjs'

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
