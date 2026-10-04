/**
 * Find every rule in this layer's stylesheets that sits OUTSIDE a cascade layer.
 *
 * Unlayered CSS beats every layered rule regardless of specificity, and
 * Tailwind generates its utilities into a layer. So an unlayered rule here is
 * not a local style — it is a rule that no consuming app can override with a
 * utility, in any of its components, forever. That is almost never what a
 * component rule means, and it cost gymmer-nuxt four bugs in one branch before
 * the pattern was named.
 *
 * Exported as a function because two callers want it: `test/css-layers.test.mjs`
 * asserts against an allowlist, and `node scripts/css-layers.mjs <file>` prints
 * the audit for a human.
 */
import fs from 'node:fs'

/** Properties whose unlayered form is most likely to fight a utility. */
export const LAYOUT_PROPS
  = /^(display|position|width|height|min-|max-|margin|padding|flex|grid|inset|top|right|bottom|left|float|gap|order|z-index)/

/** A declaration block's property names, ignoring nested blocks. */
function propsOf(decls) {
  return [...new Set(
    decls.replace(/\{[^}]*\}/g, '')
      .split(';')
      .map(d => d.split(':')[0]?.trim())
      .filter(p => p && !p.startsWith('@') && !p.startsWith('/')),
  )]
}

/** Walk to the brace matching the one at `open`. */
function matchBrace(src, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') { depth--; if (depth === 0) return i }
  }
  return src.length
}

export function unlayeredRules(file) {
  const src = fs.readFileSync(file, 'utf8')
  // Blank out comments so braces inside them cannot confuse the scan, while
  // keeping every offset — line numbers have to stay true.
  const css = src.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
  const lineAt = pos => css.slice(0, pos).split('\n').length

  const found = []
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open === -1) break
    const prelude = css.slice(i, open).trim().replace(/\s+/g, ' ')
    const close = matchBrace(css, open)
    const body = css.slice(open + 1, close)

    if (!/^@layer\b/.test(prelude)) {
      if (/^@(media|supports|container)\b/.test(prelude) && !/^\s*@layer\b/.test(body.trim())) {
        // A conditional group whose children are themselves unlayered.
        let k = 0
        while (k < body.length) {
          const o = body.indexOf('{', k)
          if (o === -1) break
          const c = matchBrace(body, o)
          const sel = body.slice(k, o).trim().replace(/\s+/g, ' ')
          if (sel && !sel.startsWith('@')) {
            found.push({ file, line: lineAt(open), condition: prelude, selector: sel, props: propsOf(body.slice(o + 1, c)) })
          }
          k = c + 1
        }
      }
      else if (prelude && !prelude.startsWith('@')) {
        found.push({ file, line: lineAt(open), condition: '', selector: prelude, props: propsOf(body) })
      }
      else if (prelude.startsWith('@')) {
        // `@theme` / `@utility` / `@keyframes`: Tailwind directives and
        // animation definitions, which do not take part in the cascade.
        found.push({ file, line: lineAt(open), condition: '', selector: prelude, props: [], directive: true })
      }
    }
    i = close + 1
  }
  return found
}

/**
 * A rule that only declares custom properties on the document root is a TOKEN
 * definition, not a style. It has to stay unlayered: `html[data-theme="dark"]`
 * must keep winning over `:root`, and custom properties do not participate in
 * the cascade the way declarations do.
 */
export function isRootTokenRule(rule) {
  const rootOnly = rule.selector.split(',').every(s => /^(:root|html[[:.\s]|html$)/.test(s.trim()))
  if (!rootOnly) return false
  return rule.props.every(p => p.startsWith('--') || p === 'color-scheme')
}

/**
 * Every rule in a file, layered or not, with the layer it sits in.
 *
 * `unlayeredRules` answers "what escapes a layer"; this answers "what does
 * each rule do", which is the question the state-paint guard asks.
 */
export function readRules(file) {
  const src = fs.readFileSync(file, 'utf8')
  const css = src.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
  const lineAt = pos => css.slice(0, pos).split('\n').length
  const out = []

  const walk = (text, base, layered) => {
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open === -1) break
      const close = matchBrace(text, open)
      const selector = text.slice(i, open).trim().replace(/\s+/g, ' ')
      const body = text.slice(open + 1, close)
      if (/^@layer\b/.test(selector)) walk(body, base + open + 1, true)
      else if (/^@(media|supports|container)\b/.test(selector)) walk(body, base + open + 1, layered)
      else if (selector && !selector.startsWith('@')) {
        out.push({ selector, layered, line: lineAt(base + open), props: propsOf(body) })
      }
      i = close + 1
    }
  }
  walk(css, 0, false)
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const file of process.argv.slice(2)) {
    const rules = unlayeredRules(file)
    console.log(`\n${file}: ${rules.length} unlayered rule(s)`)
    for (const r of rules) {
      const risky = r.props.filter(p => LAYOUT_PROPS.test(p))
      const kind = r.directive ? 'directive' : isRootTokenRule(r) ? 'tokens' : 'STYLE'
      console.log(`  L${String(r.line).padStart(3)}  [${kind}] ${r.condition ? r.condition + ' › ' : ''}${r.selector.slice(0, 64)}${risky.length ? `  ⚠ ${risky.join(', ')}` : ''}`)
    }
  }
}
