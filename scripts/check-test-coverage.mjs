// Every test file on disk is actually in the run.
//
// Why this exists: until 2026-11-04 `package.json`'s `test` script ENUMERATED
// its files —
//
//     node --test test/contrast.test.mjs test/css-layers.test.mjs
//
// — so `test/board-tokens.test.mjs` was added, committed, reviewed and merged
// while no runner ever opened it. CI was green, 73 tests ran, and the number
// 73 was the same before and after the new file existed. The glob that
// replaced the list fixes that case, but a glob has its own blind spots: a
// file in a subdirectory, a file named `foo.mjs` without `.test.`, or a quiet
// return to an enumerated list.
//
// So the claim is checked rather than assumed, in two independent ways, and
// both are COUNTED from the run — never inferred from the fact that it passed:
//
//   1. the set of files the `test` script's own pattern expands to is exactly
//      the set of `*.test.mjs` files that exist, at any depth;
//   2. the aggregate run's test count equals the sum of the files' own counts,
//      measured by running each file alone. A file silently dropped from the
//      aggregate changes that sum; a file that exists but contains no tests is
//      reported too, because it is indistinguishable in a total from a file
//      that never ran.
//
// Exit 0 = both hold. Any other exit = the suite does not cover what is on
// disk, and the message says which file and which check.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const die = (msg) => { console.error(`check-test-coverage: ${msg}`); process.exit(1) }

// --- 1. what is on disk, at any depth
function walk (dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.test.mjs')) out.push(relative(ROOT, p))
  }
  return out
}
const onDisk = walk(join(ROOT, 'test')).sort()
if (onDisk.length === 0) die('no *.test.mjs under test/ — this guard would pass vacuously, which is the one thing it must not do')

// --- 1b. what the test script's pattern covers
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const script = pkg.scripts?.test ?? die('package.json has no scripts.test')
const args = script.trim().split(/\s+/).slice(1)
  .filter(a => !a.startsWith('--'))
  // Quoting is the shell's business, not this guard's: `'test/*.test.mjs'` and
  // `test/*.test.mjs` name the same files, and only check 2 below can tell
  // whether the quotes changed who expands them.
  .map(a => a.replace(/^['"]|['"]$/g, ''))
if (args.length === 0) die(`scripts.test names no files: ${script}`)

// A deliberately small pattern language: `*` within one segment, `**` across
// segments. Anything else is refused rather than half-understood, because a
// pattern this guard misreads is a guard that passes for the wrong reason.
const toRe = (pat) => {
  if (/[?[\]{}]/.test(pat)) die(`pattern ${pat} uses glob syntax this guard does not implement — extend it rather than trusting it`)
  const re = pat.split('/').map(seg =>
    seg === '**' ? '.*' : seg.replace(/[.+^$()|\\]/g, '\\$&').replace(/\*/g, '[^/]*')
  ).join('/')
  return new RegExp(`^${re}$`)
}
const res = args.map(toRe)
const covered = onDisk.filter(f => res.some(r => r.test(f)))
const missed = onDisk.filter(f => !covered.includes(f))
if (missed.length) {
  die(`these test files exist but no pattern in scripts.test matches them, so nothing runs them:\n` +
      missed.map(f => `  ${f}`).join('\n') +
      `\n  scripts.test = ${script}`)
}

// --- 2. the aggregate run covers every one of them
const tapTotal = (out) => {
  const m = out.match(/^# tests (\d+)$/m)
  if (!m) die('a run produced no "# tests" line — its coverage is unknown, which is not a pass')
  return Number(m[1])
}
const run = (files) => {
  try {
    return execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...files],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    // A failing suite still prints its counts; a crash does not.
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (/^# tests \d+$/m.test(out)) return out
    die(`could not run ${files.join(' ')}: ${(e.stderr || e.message).slice(0, 400)}`)
  }
}

let sum = 0
const empty = []
for (const f of onDisk) {
  const n = tapTotal(run([f]))
  if (n === 0) empty.push(f)
  sum += n
}
if (empty.length) die(`these files hold no tests, so their presence in the run proves nothing:\n` + empty.map(f => `  ${f}`).join('\n'))

// The aggregate is THE SCRIPT ITSELF, run through a shell — not a list this
// guard rebuilds from the same pattern it just parsed. Rebuilding it would
// compare the guard against the guard: whoever expands the pattern in CI
// (the shell, or node when the pattern is quoted) is exactly what is under
// test here, and a pattern that expands to nothing reports `# tests 0`.
let aggOut
try {
  aggOut = execFileSync('/bin/sh', ['-c', script], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --test-reporter=tap`.trim() },
  })
} catch (e) {
  const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
  if (/^# tests \d+$/m.test(out)) aggOut = out
  else die(`could not run scripts.test (${script}): ${(e.stderr || e.message).slice(0, 400)}`)
}
const agg = tapTotal(aggOut)
if (agg !== sum) {
  die(`scripts.test runs ${agg} test(s), but the ${onDisk.length} file(s) on disk hold ${sum} between them` +
      ` — ${sum - agg} test(s) exist and are not run.\n  scripts.test = ${script}`)
}
console.log(`✓ test coverage: ${onDisk.length} file(s), ${sum} test(s), all of them in the run (${script})`)
