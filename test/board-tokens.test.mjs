/* The boards' theme() against the layer's tokens, re-derived every run.
 *
 * `docs/redesign/token-audit.md` compared them once, by hand, on 2026-10-08. It
 * then went stale in both directions without a word: it was written against 50
 * boards (there are now 62) and against a layer that has since adopted eleven of
 * its values and added three of its names. Nothing noticed, because the
 * comparison lived only in prose — `css:audit` checks CSS layering and
 * `test:contrast` checks ratios; neither reads a board.
 *
 * So this is that document's table, executable. Both sides are read out of the
 * files, which is the audit's own stated principle: the board column from the
 * `theme()` every board shares, the layer column from `tokens.css`. Transcribing
 * either would make the test agree with the transcription rather than the files.
 *
 * ONE difference is expected, and it is a ruling rather than a defect — see
 * RULED below. Everything else must agree.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const DESIGN = join(here, '..', 'docs', 'redesign', 'design')
const css = readFileSync(join(here, '..', 'app', 'assets', 'css', 'tokens.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

/** rgba(239,235,231,0.12) and rgba(239, 235, 231, .12) are the same colour. */
const norm = v => v.trim().toLowerCase()
  .replace(/\s+/g, '')
  .replace(/([(,])0\./g, '$1.')
  .replace(/;$/, '')

/** Declarations of the first rule whose selector matches exactly. */
function block(selector) {
  const i = css.indexOf(`${selector} {`)
  assert.notEqual(i, -1, `no rule for ${selector}`)
  const body = css.slice(i + selector.length + 2, css.indexOf('}', i))
  return Object.fromEntries(
    body.split(';').map(d => d.split(':')).filter(p => p.length >= 2)
      .map(([k, ...v]) => [k.trim(), norm(v.join(':'))]),
  )
}

/* ── the board side ─────────────────────────────────────────────────────── */

const PALETTE = /\{\s*bg:\s*'(#[0-9a-f]{6})',\s*surf:\s*'(#[0-9a-f]{6})',\s*raised:\s*'(#[0-9a-f]{6})',\s*ink:\s*'(#[0-9a-f]{6})',\s*body:\s*'(#[0-9a-f]{6})',\s*muted:\s*'(#[0-9a-f]{6})',\s*line:\s*'([^']+)'\s*\}/gi

function boardPalettes() {
  const seen = new Map()
  let files = 0
  for (const f of readdirSync(DESIGN).filter(n => n.endsWith('.dc.html'))) {
    const src = readFileSync(join(DESIGN, f), 'utf8')
    const hits = [...src.matchAll(PALETTE)]
    if (!hits.length) continue
    files++
    for (const m of hits) {
      const [, bg, surf, raised, ink, body, muted, line] = m
      const key = norm([bg, surf, raised, ink, body, muted, line].join('|'))
      seen.set(key, { bg, surf, raised, ink, body, muted, line, n: (seen.get(key)?.n ?? 0) + 1 })
    }
  }
  return { files, palettes: [...seen.values()] }
}

test('the boards still share exactly two palettes', () => {
  const { files, palettes } = boardPalettes()
  // Control: a zero here would make every assertion below vacuously true.
  assert.ok(files >= 40, `only ${files} boards carry a theme() palette`)
  assert.equal(palettes.length, 2, `expected one dark and one light, got ${palettes.length}`)
  // The dark one is the one whose bg is darker.
  const [dark, light] = palettes.sort((a, b) => parseInt(a.bg.slice(1), 16) - parseInt(b.bg.slice(1), 16))
  assert.ok(parseInt(dark.bg.slice(1), 16) < parseInt(light.bg.slice(1), 16))
})

const { palettes } = boardPalettes()
const [DARK, LIGHT] = palettes.sort((a, b) => parseInt(a.bg.slice(1), 16) - parseInt(b.bg.slice(1), 16))

/* ── the layer side ─────────────────────────────────────────────────────── */

const LIGHT_VARS = block(':root')
const DARK_VARS = block('html[data-theme="dark"]')

/** board key -> layer token. The layer spells three of them out in full. */
const NAMES = {
  bg: '--gm-bg',
  surf: '--gm-surface',
  raised: '--gm-raised',
  ink: '--gm-ink',
  body: '--gm-text-body',
  muted: '--gm-muted',
  line: '--gm-line',
}

for (const [mode, boardPalette, vars] of [['dark', DARK, DARK_VARS], ['light', LIGHT, LIGHT_VARS]]) {
  test(`surfaces and text agree in ${mode}`, () => {
    for (const [key, token] of Object.entries(NAMES)) {
      assert.equal(
        vars[token], norm(boardPalette[key]),
        `${token} (${mode}): layer ${vars[token]}, boards ${norm(boardPalette[key])}`,
      )
    }
  })
}

/* ── accent ─────────────────────────────────────────────────────────────── */

/* The accent lives in per-family rules, not in :root. Orange is the default and
 * the only family the boards offer, so it is the one comparable here. */
const ORANGE_LIGHT = block('html[data-accent="orange"]')
const ORANGE_DARK = block('html[data-theme="dark"][data-accent="orange"]')
const BOARD_ACCENT = '#ff563c'

test('the accent fill and its label are the boards’ own, in both modes', () => {
  assert.equal(ORANGE_LIGHT['--acc'], BOARD_ACCENT)
  assert.equal(ORANGE_DARK['--acc'], BOARD_ACCENT)
  // on-acc is computed from the ACCENT's luminance, so it does not flip by mode.
  assert.equal(LIGHT_VARS['--gm-on-acc'], '#141312')
  assert.equal(ORANGE_LIGHT['--gm-on-acc'], '#141312')
  assert.equal(ORANGE_DARK['--gm-on-acc'], '#141312')
})

test('acc-soft is the boards’ 16% mix in both modes', () => {
  const want = norm(`color-mix(in srgb, ${BOARD_ACCENT} 16%, transparent)`)
  assert.equal(ORANGE_LIGHT['--acc-soft'], want)
  assert.equal(ORANGE_DARK['--acc-soft'], want)
})

/* ── the one accepted difference ────────────────────────────────────────── */

/* Igor's ruling of 2026-10-08 (token-audit.md) put accent TEXT on `--acc-deep`,
 * held to 4.5:1, and the layer's `--acc-ink` is that token's value. The boards
 * still compute their own `--acc-ink` at 62%. Both clear 4.5:1 and the boards'
 * is the darker of the two, so this is a naming/authority difference rather than
 * a contrast one -- but it IS a difference, which is why the Theme row reads
 * "live + drift" and not "live + matches".
 *
 * Pinned on both sides so that changing either one fails here and sends the next
 * reader to the ruling, the way contrast.test.mjs's KNOWN_GAPS does. */
const RULED = { board: 62, layer: 76 }

test('acc-ink: the boards’ 62% against the ruled 76%, unchanged on both sides', () => {
  const board = readFileSync(join(DESIGN, 'Theme.dc.html'), 'utf8')
    .match(/--acc-ink:'\s*\+\s*\(dark \? acc : 'color-mix\(in oklch, ' \+ acc \+ ' (\d+)%/)
  assert.ok(board, 'the boards no longer compute --acc-ink the way the audit recorded')
  assert.equal(Number(board[1]), RULED.board)

  const layer = ORANGE_LIGHT['--acc-ink'].match(/(\d+)%/)
  assert.ok(layer, `--acc-ink is no longer an oklch mix: ${ORANGE_LIGHT['--acc-ink']}`)
  assert.equal(Number(layer[1]), RULED.layer)

  // dark mode is not a difference: both sides use the raw accent.
  assert.equal(ORANGE_DARK['--acc-ink'], BOARD_ACCENT)
})

/* ── radii, fonts, and the three names the audit asked for ──────────────── */

test('radii and fonts agree at the boards’ defaults', () => {
  assert.equal(LIGHT_VARS['--gm-radius-card'], '12px')
  assert.equal(LIGHT_VARS['--gm-radius-ctl'], '7px')
  assert.match(LIGHT_VARS['--gm-font-display'] ?? '', /archivo/)
})

test('the three names the audit asked for exist', () => {
  for (const token of ['--gm-line', '--gm-font-mono']) {
    assert.ok(LIGHT_VARS[token], `${token} is missing from :root`)
  }
  assert.ok(ORANGE_LIGHT['--acc-ink'], '--acc-ink is missing from the orange family')
})
