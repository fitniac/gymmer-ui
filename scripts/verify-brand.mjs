#!/usr/bin/env node
/**
 * Holds brand/ to the geometry generate-brand.mjs claimed to produce.
 *
 *   pnpm brand   (runs generate, then this)
 *
 * The point is that a wrong icon looks completely normal in a file listing. Both
 * bugs this caught during the first build were invisible that way: every SVG was
 * emitted at a fixed width="1024", so each capture was a top-left CROP rather
 * than a scaled render; and the Android round tile was sized to the mark's
 * bounding box under a circular mask, which sheared the bar tip off. Names,
 * counts and file sizes were all plausible in both cases.
 *
 * So this decodes the actual pixels and measures. It never imports the
 * generator's numbers — it reads brand/geometry.json, which is the generator's
 * stated intent, and checks the rendered result against it independently.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'brand')
// Web assets live in the layer's public/ (Nuxt merges it into every consuming
// app's served root); platform bundles live in brand/. geometry.json addresses
// both with repo-relative paths, so everything here resolves against ROOT.
const geometry = JSON.parse(await readFile(join(OUT, 'geometry.json'), 'utf8'))
const INK = [1, 3, 5].map((i) => parseInt(geometry.ink.slice(i, i + 2), 16))

/* ── PNG decode (8-bit, non-interlaced, RGB or RGBA) ─────────────────────── */

const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function decode(png) {
  let p = 8
  let ihdr = null
  const idat = []
  while (p < png.length) {
    const len = png.readUInt32BE(p)
    const type = png.toString('ascii', p + 4, p + 8)
    if (type === 'IHDR') ihdr = png.subarray(p + 8, p + 8 + len)
    if (type === 'IDAT') idat.push(png.subarray(p + 8, p + 8 + len))
    p += 12 + len
  }
  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const depth = ihdr[8]
  const colour = ihdr[9]
  const interlace = ihdr[12]
  const bpp = colour === 6 ? 4 : colour === 2 ? 3 : null
  if (depth !== 8 || !bpp || interlace) return { width, height, colour, px: null }

  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const cur = Buffer.alloc(stride)
  const prev = Buffer.alloc(stride)
  const px = Buffer.alloc(height * stride)
  for (let y = 0, src = 0; y < height; y++) {
    const f = raw[src++]
    raw.copy(cur, 0, src, src + stride)
    src += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      if (f === 1) cur[i] = (cur[i] + a) & 255
      else if (f === 2) cur[i] = (cur[i] + b) & 255
      else if (f === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255
      else if (f === 4) cur[i] = (cur[i] + paeth(a, b, c)) & 255
    }
    cur.copy(px, y * stride)
    cur.copy(prev)
  }
  return { width, height, colour, bpp, stride, px }
}

/**
 * Locate the mark: pixels that are solidly painted AND clearly not the ink
 * ground. One definition covers transparent icons, ink tiles and the white
 * monochrome layer, so every family is measured the same way.
 */
function measure(d) {
  if (!d.px) return null
  const short = Math.min(d.width, d.height)
  const cx = d.width / 2
  const cy = d.height / 2
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -1
  let y1 = -1
  let maxR = 0
  for (let y = 0; y < d.height; y++) {
    for (let x = 0; x < d.width; x++) {
      const o = y * d.stride + x * d.bpp
      if (d.bpp === 4 && d.px[o + 3] < 128) continue
      const dr = d.px[o] - INK[0]
      const dg = d.px[o + 1] - INK[1]
      const db = d.px[o + 2] - INK[2]
      if (dr * dr + dg * dg + db * db < 1600) continue // within 40 of ink → ground
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (r > maxR) maxR = r
    }
  }
  if (x1 < 0) return { empty: true }
  return {
    box: (Math.max(x1 - x0, y1 - y0) + 1) / short,
    maxR: maxR / short,
    offX: ((x0 + x1 + 1) / 2 - cx) / short,
    offY: ((y0 + y1 + 1) / 2 - cy) / short,
  }
}

/* ── checks ──────────────────────────────────────────────────────────────── */

const walk = async (dir) => {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = join(dir, e.name)
    out.push(...(e.isDirectory() ? await walk(f) : [f]))
  }
  return out
}

const problems = []
const files = [...(await walk(OUT)), ...(await walk(join(ROOT, 'public')))]
  .map((f) => relative(ROOT, f))
  .sort()
const pngs = files.filter((f) => f.endsWith('.png'))

for (const rel of pngs) {
  const want = geometry.files[rel]
  if (!want) {
    problems.push(`${rel}: rendered but absent from geometry.json — nothing verified it`)
    continue
  }
  const d = decode(await readFile(join(ROOT, rel)))
  if (d.width !== want.w || d.height !== want.h)
    problems.push(`${rel}: ${d.width}x${d.height}, expected ${want.w}x${want.h}`)

  const hasAlpha = d.colour === 6
  if (!want.alpha && hasAlpha)
    problems.push(`${rel}: carries an alpha channel; this slot forbids one`)
  if (want.alpha && !hasAlpha) problems.push(`${rel}: lost its alpha channel`)

  // A missing or non-finite claim must fail loudly. Comparing against NaN is
  // always false, so an undefined markBox would otherwise pass every check.
  if (!Number.isFinite(want.markBox) || !Number.isFinite(want.w) || !Number.isFinite(want.h)) {
    problems.push(`${rel}: geometry.json claim is incomplete (${JSON.stringify(want)})`)
    continue
  }

  const m = measure(d)
  if (!m) {
    problems.push(`${rel}: undecodable pixel format`)
    continue
  }
  if (m.empty) {
    problems.push(`${rel}: contains no mark at all`)
    continue
  }
  // Small icons quantise hard, so slack is a fixed 3% or three pixels, whichever
  // is looser. A crop or a wrong scale is off by far more than that.
  const slack = Math.max(0.03, 3 / Math.min(d.width, d.height))
  if (Math.abs(m.box - want.markBox) > slack)
    problems.push(
      `${rel}: mark spans ${m.box.toFixed(3)} of the canvas, claimed ${want.markBox.toFixed(3)} (±${slack.toFixed(3)})`
    )
  if (Math.abs(m.offX) > slack || Math.abs(m.offY) > slack)
    problems.push(`${rel}: mark off-centre by (${m.offX.toFixed(3)}, ${m.offY.toFixed(3)})`)
  if (want.maskR != null && m.maxR > want.maskR + slack)
    problems.push(
      `${rel}: mark reaches ${m.maxR.toFixed(3)} from centre but a mask clips at ${want.maskR} — the bar tip will be cut`
    )
}

for (const rel of Object.keys(geometry.files))
  if (!pngs.includes(rel)) problems.push(`${rel}: declared in geometry.json but not rendered`)

/* Referential integrity: every path named by a manifest must exist. */
const manifest = JSON.parse(await readFile(join(ROOT, 'public/site.webmanifest'), 'utf8'))
for (const icon of manifest.icons)
  if (!files.includes(`public${icon.src}`))
    problems.push(`site.webmanifest points at missing ${icon.src}`)

for (const set of ['brand/ios/AppIcon.appiconset', 'brand/watchos/AppIcon.appiconset']) {
  for (const name of ['Contents.json', 'Contents.legacy.json']) {
    const path = join(ROOT, set, name)
    let json
    try {
      json = JSON.parse(await readFile(path, 'utf8'))
    } catch {
      continue // legacy variant is optional
    }
    for (const img of json.images)
      if (img.filename && !files.includes(`${set}/${img.filename}`))
        problems.push(`${set}/${name} points at missing ${img.filename}`)
  }
}

/* favicon.ico must be a real multi-size container. */
const icoBuf = await readFile(join(ROOT, 'public/favicon.ico'))
if (icoBuf.readUInt16LE(0) !== 0 || icoBuf.readUInt16LE(2) !== 1) problems.push('favicon.ico: bad header')
const icoSizes = []
for (let i = 0; i < icoBuf.readUInt16LE(4); i++) {
  const e = 6 + 16 * i
  const size = icoBuf[e] || 256
  const off = icoBuf.readUInt32LE(e + 12)
  const len = icoBuf.readUInt32LE(e + 8)
  if (off + len > icoBuf.length) problems.push(`favicon.ico: entry ${i} runs past end of file`)
  const embedded = icoBuf.subarray(off, off + len)
  if (embedded.readUInt32BE(0) !== 0x89504e47) problems.push(`favicon.ico: entry ${i} is not a PNG`)
  else if (embedded.readUInt32BE(16) !== size)
    problems.push(`favicon.ico: entry ${i} declares ${size} but holds ${embedded.readUInt32BE(16)}`)
  icoSizes.push(size)
}
for (const s of [16, 32, 48])
  if (!icoSizes.includes(s)) problems.push(`favicon.ico: missing the ${s}px entry`)

/* ── report ──────────────────────────────────────────────────────────────── */

if (problems.length) {
  console.error(`✗ brand assets failed ${problems.length} check(s)\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(
  `✓ brand assets verified — ${pngs.length} rasters, ${files.length} files\n` +
    `  sizes, alpha, mark scale, centring and mask clearance all match geometry.json\n` +
    `  favicon.ico holds ${icoSizes.join('/')}px; manifests reference only files that exist`
)
