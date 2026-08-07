#!/usr/bin/env node
/**
 * Regenerates every raster in brand/ from app/assets/img/logo.svg.
 *
 *   pnpm brand
 *
 * Nothing here is hand-authored: the path geometry is parsed out of logo.svg and
 * the colours out of tokens.css, so retuning either and re-running is the whole
 * update procedure. If you find yourself editing a PNG, you are working on the
 * wrong file.
 *
 * Rasterising goes through headless Chrome at the exact target size — every icon
 * is rendered from vector rather than downsampled from a master, so the 16px
 * favicon gets its own hinting-free but correctly-weighted render instead of a
 * mush of a 1024px original. Set CHROME= to override the binary.
 *
 * Alpha handling is the fiddly part. Chrome only ever emits 8-bit RGBA, and the
 * App Store rejects a 1024 marketing icon that carries an alpha channel at all —
 * fully opaque is not good enough. stripAlpha() below re-encodes those to
 * truecolour PNG (colour type 2). Everything else keeps its alpha.
 */
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import zlib from 'node:zlib'

const run = promisify(execFile)
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'app/assets/img/logo.svg')
const TOKENS = join(ROOT, 'app/assets/css/tokens.css')
const OUT = join(ROOT, 'brand')
const CHROME =
  process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/* ── source of truth ─────────────────────────────────────────────────────── */

const logoSvg = await readFile(SRC, 'utf8')
const tokensCss = await readFile(TOKENS, 'utf8')

const D = logoSvg.match(/<path[^>]*\sd="([^"]+)"/s)?.[1].replace(/\s+/g, ' ').trim()
if (!D) throw new Error(`no <path d> found in ${SRC}`)

/** Pull a custom property out of a specific tokens.css rule. */
const token = (selector, name) => {
  const block = tokensCss.match(
    new RegExp(`${selector.replace(/[[\]"^$.*+?()|{}\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)
  )?.[1]
  const value = block?.match(new RegExp(`--${name}\\s*:\\s*([^;]+)`))?.[1]
  if (!value) throw new Error(`token --${name} not found in ${selector}`)
  return value.trim()
}

const ACC = token('html[data-accent="orange"]', 'acc')
const ACC_DEEP = token('html[data-accent="orange"]', 'acc-deep')
const INK = token(':root', 'gm-ink')
const PAPER = token(':root', 'gm-bg')

/*
 * Two ways to measure the mark, and picking the wrong one is why a first cut
 * looked lost in space on every tile.
 *
 * The mark's real extent is a square: the outer ring spans 168..856 on both
 * axes, so BBOX is 688 and the chamfered bar tip at (826,168) sits INSIDE that
 * square, near its top-right corner. On a square or superellipse canvas nothing
 * can clip a corner, so the bounding box is what should be fitted to the tile.
 *
 * A circular mask is the exception. There the first thing to get cut is the bar
 * tip on its diagonal, 465.8 from centre — well beyond the ring's own 344. Those
 * canvases have to be sized against that circle instead, which is why watchOS
 * and the maskables carry visibly more air than iOS does. That is the mask, not
 * a margin choice.
 */
const BBOX = 856 - 168
const CIRCUM = 2 * Math.hypot(826 - 512, 168 - 512)

/** Fit the mark's bounding box to `f` of the canvas. */
const byBox = (f) => (f * 1024) / BBOX
/** Fit the mark's circumcircle to `f` of the canvas. */
const byCircle = (f) => (f * 1024) / CIRCUM

/** Scale factor per platform, in source units. */
const K = {
  /** Transparent icons: no mask, no ground, so run it close to the edge. */
  full: byBox(0.94),
  /** iOS / macOS / Android legacy / Play. The superellipse never reaches this. */
  tile: byBox(0.82),
  /** PWA maskable: the spec guarantees only the centre 80% CIRCLE survives. */
  maskable: byCircle(0.8),
  /** Android adaptive: 108dp drawable, 72dp visible, 66dp safe circle. */
  adaptive: byCircle(66 / 108),
  /**
   * Any full-bleed CIRCULAR tile — watchOS, and Android's ic_launcher_round.
   * Must go through byCircle: at the bounding-box scale used for square tiles
   * the bar tip lands at 0.555 of the canvas from centre and the circle cuts it
   * off at 0.5.
   */
  circle: byCircle(0.92),
}

/* ── SVG composition ─────────────────────────────────────────────────────── */

/**
 * The gradient lives inside the scaled <g>, so its userSpaceOnUse endpoints stay
 * pinned to the mark's own bounding box and the 45° holds at every k.
 */
const mark = (s, fill = 'gradient') => {
  const defs =
    fill === 'gradient'
      ? `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="168" y1="168" x2="856" y2="856">` +
        `<stop offset="0" stop-color="${ACC}"/><stop offset="1" stop-color="${ACC_DEEP}"/></linearGradient></defs>`
      : ''
  const paint = fill === 'gradient' ? 'url(#g)' : fill
  return (
    defs +
    `<g transform="translate(512 512) scale(${s.toFixed(6)}) translate(-512 -512)">` +
    `<path fill="${paint}" fill-rule="evenodd" d="${D}"/></g>`
  )
}

/**
 * ground: null | {shape:'square'|'rounded'|'circle', fill, inset?, radius?}
 *
 * Square canvases keep the mark's native 1024 viewBox. A non-square canvas (the
 * OG image) gets its own viewBox and the mark is scaled to the short edge and
 * centred, so `k` keeps meaning the same thing in both.
 */
const compose = ({ k, ground = null, fill = 'gradient', w = 1024, h = 1024 }) => {
  const square = w === h
  const vb = square ? 1024 : Math.min(w, h)
  let bg = ''
  if (ground?.shape === 'square') {
    bg = `<rect width="${square ? 1024 : w}" height="${square ? 1024 : h}" fill="${ground.fill}"/>`
  } else if (ground?.shape === 'circle') {
    bg = `<circle cx="512" cy="512" r="512" fill="${ground.fill}"/>`
  } else if (ground?.shape === 'rounded') {
    const i = (ground.inset ?? 0) * 1024
    const side = 1024 - 2 * i
    bg = `<rect x="${i}" y="${i}" width="${side}" height="${side}" rx="${(ground.radius * side).toFixed(2)}" fill="${ground.fill}"/>`
  }
  const art = square
    ? mark(k, fill)
    : `<g transform="translate(${(w - vb) / 2} ${(h - vb) / 2}) scale(${(vb / 1024).toFixed(6)})">${mark(k, fill)}</g>`
  // Intrinsic size is deliberately 100%, not w/h: one composed SVG is rasterised
  // at a dozen different sizes, and a fixed width would make every capture a
  // top-left CROP of a 1024 render rather than a scaled one.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" ` +
    `viewBox="0 0 ${square ? 1024 : w} ${square ? 1024 : h}">${bg}${art}</svg>`
  )
}

/* ── PNG: alpha strip ────────────────────────────────────────────────────── */

const CRC_TABLE = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})
const crc32 = (buf) => {
  let c = -1
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
const chunk = (type, data) => {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'ascii')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, tail])
}

const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/**
 * RGBA PNG → truecolour (no alpha) PNG, compositing over `bg`.
 *
 * Chrome's encoder already drops the channel when a capture happens to be fully
 * opaque, so most tiles arrive as colour type 2 and pass straight through. That
 * is luck, not a guarantee — a single antialiased edge pixel flips it back to
 * type 6, and then the App Store rejects the upload. Hence the real conversion.
 */
function stripAlpha(png, bg) {
  const [br, bgr, bb] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16))
  let p = 8
  let ihdr = null
  const idat = []
  while (p < png.length) {
    const len = png.readUInt32BE(p)
    const type = png.toString('ascii', p + 4, p + 8)
    const data = png.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') ihdr = data
    if (type === 'IDAT') idat.push(data)
    p += 12 + len
  }
  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const depth = ihdr[8]
  const colour = ihdr[9]
  const interlace = ihdr[12]
  if (colour === 2 && depth === 8 && interlace === 0) return png // already alpha-free
  if (depth !== 8 || colour !== 6 || interlace !== 0)
    throw new Error(`unexpected PNG: depth=${depth} colour=${colour} interlace=${interlace}`)

  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = 4
  const stride = width * bpp
  const cur = Buffer.alloc(stride)
  const prev = Buffer.alloc(stride)
  const out = Buffer.alloc(height * (1 + width * 3))

  for (let y = 0, src = 0, dst = 0; y < height; y++) {
    const filter = raw[src++]
    raw.copy(cur, 0, src, src + stride)
    src += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 0xff
      else if (filter === 2) cur[i] = (cur[i] + b) & 0xff
      else if (filter === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 0xff
      else if (filter === 4) cur[i] = (cur[i] + paeth(a, b, c)) & 0xff
    }
    out[dst++] = 0 // emit every scanline unfiltered; zlib still gets it small
    for (let x = 0; x < width; x++) {
      const o = x * bpp
      const alpha = cur[o + 3] / 255
      out[dst++] = Math.round(cur[o] * alpha + br * (1 - alpha))
      out[dst++] = Math.round(cur[o + 1] * alpha + bgr * (1 - alpha))
      out[dst++] = Math.round(cur[o + 2] * alpha + bb * (1 - alpha))
    }
    cur.copy(prev)
  }

  const newIhdr = Buffer.alloc(13)
  newIhdr.writeUInt32BE(width, 0)
  newIhdr.writeUInt32BE(height, 4)
  newIhdr[8] = 8
  newIhdr[9] = 2 // truecolour, no alpha
  return Buffer.concat([
    png.subarray(0, 8),
    chunk('IHDR', newIhdr),
    chunk('IDAT', zlib.deflateSync(out, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** PNG-in-ICO container (Vista+; every browser we care about reads it). */
function ico(entries) {
  const dir = Buffer.alloc(6 + 16 * entries.length)
  dir.writeUInt16LE(0, 0)
  dir.writeUInt16LE(1, 2)
  dir.writeUInt16LE(entries.length, 4)
  let offset = dir.length
  entries.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i
    dir[e] = size >= 256 ? 0 : size
    dir[e + 1] = size >= 256 ? 0 : size
    dir.writeUInt16LE(1, e + 4)
    dir.writeUInt16LE(32, e + 6)
    dir.writeUInt32LE(png.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += png.length
  })
  return Buffer.concat([dir, ...entries.map((e) => e.png)])
}

/* ── rasteriser ──────────────────────────────────────────────────────────── */

/*
 * One long-lived Chrome driven over the DevTools protocol, NOT `--screenshot`
 * per icon. Spawning a browser per size looks simpler and is what the first cut
 * did, but a fresh --user-data-dir sends Chrome into first-run setup that never
 * returns in headless, so the processes pile up and the run wedges. Reusing one
 * profile is also ~100x faster: the whole set renders in seconds.
 */

const scratch = join(tmpdir(), `gm-brand-${process.pid}`)
await mkdir(scratch, { recursive: true })

const CHROME_FLAGS = [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--remote-debugging-port=0',
  `--user-data-dir=${join(scratch, 'profile')}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--disable-crash-reporter',
  '--metrics-recording-only',
  '--no-pings',
  '--mute-audio',
  '--disable-features=Translate,MediaRouter,OptimizationHints',
]

const chrome = spawn(CHROME, CHROME_FLAGS, { stdio: ['ignore', 'ignore', 'pipe'] })
// Nothing below is allowed to leave a browser behind, including on a throw.
process.on('exit', () => chrome.kill())
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(1))
const wsUrl = await new Promise((resolve, reject) => {
  let buf = ''
  const timer = setTimeout(() => reject(new Error('no DevTools endpoint after 30s')), 30_000)
  chrome.stderr.on('data', (d) => {
    buf += d
    const m = buf.match(/DevTools listening on (ws:\S+)/)
    if (m) {
      clearTimeout(timer)
      resolve(m[1])
    }
  })
  chrome.on('exit', (code) => {
    clearTimeout(timer)
    reject(new Error(`Chrome exited (${code}) before listening:\n${buf}`))
  })
})

/** Minimal CDP client: request/response by id, plus one-shot event waiters. */
const cdp = await new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl)
  const pending = new Map()
  const waiters = []
  let nextId = 0
  ws.onerror = () => reject(new Error('CDP socket error'))
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id != null) {
      const slot = pending.get(msg.id)
      if (!slot) return
      pending.delete(msg.id)
      msg.error ? slot.rej(new Error(`${msg.error.message} (${slot.method})`)) : slot.res(msg.result)
      return
    }
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i]
      if (w.method === msg.method && (!w.sessionId || w.sessionId === msg.sessionId)) {
        waiters.splice(i, 1)
        w.res(msg.params)
      }
    }
  }
  ws.onopen = () =>
    resolve({
      send: (method, params = {}, sessionId) =>
        new Promise((res, rej) => {
          const id = ++nextId
          pending.set(id, { res, rej, method })
          ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
        }),
      once: (method, sessionId) => new Promise((res) => waiters.push({ method, sessionId, res })),
      close: () => ws.close(),
    })
})

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
await cdp.send('Page.enable', {}, sessionId)
await cdp.send('Runtime.enable', {}, sessionId)
// Transparent everywhere; the opaque tiles paint their own ground.
await cdp.send(
  'Emulation.setDefaultBackgroundColorOverride',
  { color: { r: 0, g: 0, b: 0, a: 0 } },
  sessionId
)

async function raster(svg, w, h) {
  const html =
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:0;height:100%;background:transparent}` +
    `svg{display:block;width:100%;height:100%}</style>` +
    `</head><body>${svg}</body></html>`

  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    { width: w, height: h, deviceScaleFactor: 1, mobile: false },
    sessionId
  )
  const loaded = cdp.once('Page.loadEventFired', sessionId)
  await cdp.send(
    'Page.navigate',
    { url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` },
    sessionId
  )
  await loaded
  // Two frames, so the capture can never land on a pre-paint surface.
  await cdp.send(
    'Runtime.evaluate',
    {
      expression:
        'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(1))))',
      awaitPromise: true,
    },
    sessionId
  )

  const { data } = await cdp.send(
    'Page.captureScreenshot',
    { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 }, captureBeyondViewport: false },
    sessionId
  )
  const png = Buffer.from(data, 'base64')
  const gotW = png.readUInt32BE(16)
  const gotH = png.readUInt32BE(20)
  if (gotW !== w || gotH !== h) throw new Error(`asked ${w}x${h}, Chrome gave ${gotW}x${gotH}`)
  return png
}

/** Sequential map — one page, so ordering is the concurrency control. */
const mapSeries = async (items, fn) => {
  const out = []
  for (const item of items) out.push(await fn(item))
  return out
}

const written = []
/**
 * Job paths are written as `web/…`, `ios/…` and so on, but `web/` does not land
 * in brand/ — it lands in the layer's `public/`.
 *
 * Nuxt merges every layer's public directory into the consuming app's served
 * root, so putting the favicons there makes `/favicon.ico`, `/icon-192x192.png`
 * and `/site.webmanifest` resolve in gymmer-landing AND gymmer-nuxt with no
 * config in either and, more importantly, no second copy of the bytes. The
 * platform bundles stay under brand/ — nothing should serve an Android mipmap
 * or an Xcode asset catalog over HTTP.
 */
const outPath = (p) => (p.startsWith('web/') ? join('public', p.slice(4)) : join('brand', p))

async function emit(path, buf) {
  const full = join(ROOT, outPath(path))
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, buf)
  written.push({ path, bytes: buf.length })
}

/* ── the asset table ─────────────────────────────────────────────────────── */

const TILE = { shape: 'square', fill: INK }

/**
 * Every raster job, plus the geometry it is CLAIMING to produce. verify-brand
 * decodes the pixels afterwards and holds each file to its own claim — that is
 * what catches a mis-scaled render or a mark clipped by a mask, neither of which
 * shows up in a file listing.
 *
 * markBox — the mark's bounding box as a fraction of the canvas.
 * maskR   — radius (fraction of canvas) of the circle that will clip this icon,
 *           or null when nothing circular is applied.
 */
const jobs = []
const box = (k) => (k * BBOX) / 1024
const add = (path, size, style, opaque = null) => {
  // Spreading a bare SVG string here silently yields svg:undefined and
  // markBox:undefined, which renders the literal word "undefined" into the icon
  // and then compares NaN in the verifier, where every check passes. Refuse it.
  if (typeof style?.svg !== 'string' || !Number.isFinite(style.markBox))
    throw new TypeError(`${path}: style must be {svg, markBox, maskR}, got ${typeof style}`)
  jobs.push({ path, size, ...style, opaque })
}

const transparent = () => ({ svg: compose({ k: K.full }), markBox: box(K.full), maskR: null })
const inkTile = () => ({ svg: compose({ k: K.tile, ground: TILE }), markBox: box(K.tile), maskR: null })
const maskable = () => ({
  svg: compose({ k: K.maskable, ground: TILE }),
  markBox: box(K.maskable),
  maskR: 0.4, // PWA maskable safe zone: centre 80% circle
})
const foreground = () => ({
  svg: compose({ k: K.adaptive }),
  markBox: box(K.adaptive),
  maskR: 33 / 108, // Android adaptive safe zone: centre 66dp circle
})
const monochrome = () => ({ ...foreground(), svg: compose({ k: K.adaptive, fill: '#ffffff' }) })
const watchTile = () => ({
  svg: compose({ k: K.circle, ground: TILE }),
  markBox: box(K.circle),
  maskR: 0.5, // watchOS masks to the inscribed circle
})
const roundTile = () => ({
  svg: compose({ k: K.circle, ground: { shape: 'circle', fill: INK } }),
  markBox: box(K.circle),
  maskR: 0.5,
})
const legacyTile = () => ({
  svg: compose({ k: K.tile, ground: { shape: 'rounded', fill: INK, inset: 0, radius: 0.2 } }),
  markBox: box(K.tile),
  maskR: null,
})

// ── web ───────────────────────────────────────────────────────────────────
for (const s of [16, 32, 48, 96]) add(`web/favicon-${s}x${s}.png`, s, transparent())
for (const s of [72, 96, 128, 144, 152, 192, 256, 384, 512])
  add(`web/icon-${s}x${s}.png`, s, transparent())
for (const s of [192, 512]) add(`web/icon-maskable-${s}x${s}.png`, s, maskable(), INK)
add('web/apple-touch-icon.png', 180, inkTile(), INK)
for (const s of [152, 167, 180]) add(`web/apple-touch-icon-${s}x${s}.png`, s, inkTile(), INK)
for (const s of [70, 150, 310]) add(`web/mstile-${s}x${s}.png`, s, inkTile(), INK)

// ── iOS ───────────────────────────────────────────────────────────────────
const IOS_PX = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
for (const s of IOS_PX) add(`ios/AppIcon.appiconset/icon-${s}.png`, s, inkTile(), INK)

// ── watchOS ───────────────────────────────────────────────────────────────
const WATCH_PX = [
  44, 48, 55, 58, 66, 80, 87, 88, 92, 100, 102, 108, 172, 196, 216, 234, 258, 1024,
]
for (const s of WATCH_PX) add(`watchos/AppIcon.appiconset/icon-${s}.png`, s, watchTile(), INK)

// ── macOS ─────────────────────────────────────────────────────────────────
// Big Sur grid: the squircle is 824/1024 of the canvas, the rest is breathing
// room the system does NOT add for you (unlike iOS, macOS never masks).
const MAC = [
  ['icon_16x16', 16],
  ['icon_16x16@2x', 32],
  ['icon_32x32', 32],
  ['icon_32x32@2x', 64],
  ['icon_128x128', 128],
  ['icon_128x128@2x', 256],
  ['icon_256x256', 256],
  ['icon_256x256@2x', 512],
  ['icon_512x512', 512],
  ['icon_512x512@2x', 1024],
]
const MAC_K = byBox(0.82 * (824 / 1024))
const macTile = () => ({
  svg: compose({
    k: MAC_K,
    ground: { shape: 'rounded', fill: INK, inset: 100 / 1024, radius: 0.2237 },
  }),
  markBox: box(MAC_K),
  maskR: null,
})
for (const [name, s] of MAC) add(`macos/AppIcon.iconset/${name}.png`, s, macTile())

// ── Android ───────────────────────────────────────────────────────────────
const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
]
for (const [d, legacy, adaptive] of DENSITIES) {
  add(`android/res/mipmap-${d}/ic_launcher.png`, legacy, legacyTile())
  add(`android/res/mipmap-${d}/ic_launcher_round.png`, legacy, roundTile())
  add(`android/res/mipmap-${d}/ic_launcher_foreground.png`, adaptive, foreground())
  add(`android/res/mipmap-${d}/ic_launcher_monochrome.png`, adaptive, monochrome())
}
add('android/play-store-512.png', 512, inkTile(), INK)

// ── social ────────────────────────────────────────────────────────────────
const OG = {
  svg: compose({ k: K.tile, ground: { shape: 'square', fill: INK }, w: 1200, h: 630 }),
  markBox: box(K.tile),
  maskR: null,
}

/* ── go ──────────────────────────────────────────────────────────────────── */

/*
 * Cleanup is file-by-file, from the last run's own record, not `rm -rf` on a
 * directory. brand/ holds a hand-written README.md, and public/ is a directory
 * the layer may later want for something that is not an icon — neither can be
 * wiped wholesale just because the icons live there too.
 */
const previous = await readFile(join(OUT, 'geometry.json'), 'utf8').then(
  (s) => JSON.parse(s).generated ?? [],
  () => []
)
for (const rel of previous) await rm(join(ROOT, rel), { force: true })
for (const dir of ['ios', 'watchos', 'macos', 'android'])
  await rm(join(OUT, dir), { recursive: true, force: true })

const rendered = await mapSeries(jobs, async (j) => {
  const png = await raster(j.svg, j.size, j.size)
  return { ...j, png: j.opaque ? stripAlpha(png, j.opaque) : png }
})
for (const r of rendered) await emit(r.path, r.png)

await emit('web/og-image.png', stripAlpha(await raster(OG.svg, 1200, 630), INK))

// favicon.ico — the three sizes Windows and legacy browsers actually index
const icoPngs = await mapSeries([16, 32, 48], async (s) => ({
  size: s,
  png: await raster(transparent().svg, s, s),
}))
await emit('web/favicon.ico', ico(icoPngs))

// favicon.svg — the token-driven source with the default palette pinned, since a
// favicon is fetched as a standalone document and cannot inherit anything.
await emit(
  'web/favicon.svg',
  Buffer.from(logoSvg.replace('role="img"', 'role="img" data-accent="orange"'), 'utf8')
)

/* ── sidecar manifests ───────────────────────────────────────────────────── */

const manifestIcons = [
  ...[72, 96, 128, 144, 152, 192, 256, 384, 512].map((s) => ({
    src: `/icon-${s}x${s}.png`,
    sizes: `${s}x${s}`,
    type: 'image/png',
    purpose: 'any',
  })),
  ...[192, 512].map((s) => ({
    src: `/icon-maskable-${s}x${s}.png`,
    sizes: `${s}x${s}`,
    type: 'image/png',
    purpose: 'maskable',
  })),
]
await emit(
  'web/site.webmanifest',
  Buffer.from(
    JSON.stringify(
      {
        name: 'GYMMER',
        short_name: 'GYMMER',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: PAPER,
        theme_color: INK,
        icons: manifestIcons,
      },
      null,
      2
    ) + '\n'
  )
)

await emit(
  'web/browserconfig.xml',
  Buffer.from(
    `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/mstile-70x70.png"/>
      <square150x150logo src="/mstile-150x150.png"/>
      <square310x310logo src="/mstile-310x310.png"/>
      <TileColor>${INK}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`
  )
)

const IOS_ENTRIES = [
  ['iphone', '20x20', '2x', 40],
  ['iphone', '20x20', '3x', 60],
  ['iphone', '29x29', '2x', 58],
  ['iphone', '29x29', '3x', 87],
  ['iphone', '40x40', '2x', 80],
  ['iphone', '40x40', '3x', 120],
  ['iphone', '60x60', '2x', 120],
  ['iphone', '60x60', '3x', 180],
  ['ipad', '20x20', '1x', 20],
  ['ipad', '20x20', '2x', 40],
  ['ipad', '29x29', '1x', 29],
  ['ipad', '29x29', '2x', 58],
  ['ipad', '40x40', '1x', 40],
  ['ipad', '40x40', '2x', 80],
  ['ipad', '76x76', '1x', 76],
  ['ipad', '76x76', '2x', 152],
  ['ipad', '83.5x83.5', '2x', 167],
  ['ios-marketing', '1024x1024', '1x', 1024],
]
await emit(
  'ios/AppIcon.appiconset/Contents.json',
  Buffer.from(
    JSON.stringify(
      {
        images: IOS_ENTRIES.map(([idiom, size, scale, px]) => ({
          idiom,
          size,
          scale,
          filename: `icon-${px}.png`,
        })),
        info: { version: 1, author: 'gymmer-ui' },
      },
      null,
      2
    ) + '\n'
  )
)

// Xcode 15+ takes a single 1024 for watchOS and derives the rest. The legacy
// role/subtype matrix is written alongside as Contents.legacy.json — swap it in
// if your target still wants explicit slots.
await emit(
  'watchos/AppIcon.appiconset/Contents.json',
  Buffer.from(
    JSON.stringify(
      {
        images: [{ idiom: 'universal', platform: 'watchos', size: '1024x1024', filename: 'icon-1024.png' }],
        info: { version: 1, author: 'gymmer-ui' },
      },
      null,
      2
    ) + '\n'
  )
)

const WATCH_ENTRIES = [
  ['notificationCenter', '24x24', '2x', '38mm', 48],
  ['notificationCenter', '27.5x27.5', '2x', '42mm', 55],
  ['notificationCenter', '33x33', '2x', '45mm', 66],
  ['companionSettings', '29x29', '2x', null, 58],
  ['companionSettings', '29x29', '3x', null, 87],
  ['appLauncher', '40x40', '2x', '38mm', 80],
  ['appLauncher', '44x44', '2x', '40mm', 88],
  ['appLauncher', '46x46', '2x', '41mm', 92],
  ['appLauncher', '50x50', '2x', '44mm', 100],
  ['appLauncher', '51x51', '2x', '45mm', 102],
  ['appLauncher', '54x54', '2x', '49mm', 108],
  ['quickLook', '86x86', '2x', '38mm', 172],
  ['quickLook', '98x98', '2x', '42mm', 196],
  ['quickLook', '108x108', '2x', '44mm', 216],
  ['quickLook', '117x117', '2x', '45mm', 234],
  ['quickLook', '129x129', '2x', '49mm', 258],
]
await emit(
  'watchos/AppIcon.appiconset/Contents.legacy.json',
  Buffer.from(
    JSON.stringify(
      {
        images: [
          ...WATCH_ENTRIES.map(([role, size, scale, subtype, px]) => ({
            idiom: 'watch',
            role,
            size,
            scale,
            ...(subtype ? { subtype } : {}),
            filename: `icon-${px}.png`,
          })),
          { idiom: 'watch-marketing', size: '1024x1024', scale: '1x', filename: 'icon-1024.png' },
        ],
        info: { version: 1, author: 'gymmer-ui' },
      },
      null,
      2
    ) + '\n'
  )
)

await emit(
  'android/res/mipmap-anydpi-v26/ic_launcher.xml',
  Buffer.from(
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`
  )
)
await emit(
  'android/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  Buffer.from(
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`
  )
)
await emit(
  'android/res/values/ic_launcher_background.xml',
  Buffer.from(
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${INK.toUpperCase()}</color>
</resources>
`
  )
)

/* ── icns ────────────────────────────────────────────────────────────────── */

try {
  await run('iconutil', [
    '-c',
    'icns',
    join(OUT, 'macos/AppIcon.iconset'),
    '-o',
    join(OUT, 'macos/AppIcon.icns'),
  ])
  written.push({ path: 'macos/AppIcon.icns', bytes: (await readFile(join(OUT, 'macos/AppIcon.icns'))).length })
} catch (e) {
  console.warn(`! iconutil failed (macOS only): ${e.message}`)
}

/* ── the claim, for verify-brand to check against ────────────────────────── */

// Written LAST, because `generated` has to list every file this run produced —
// that list is the next run's delete set, and anything missing from it becomes
// an orphan nothing ever cleans up. Paths are relative to the repo root so a
// web asset in public/ and an icon in brand/ are addressed the same way.
await emit(
  'geometry.json',
  Buffer.from(
    JSON.stringify(
      {
        note: 'Written by scripts/generate-brand.mjs; read by scripts/verify-brand.mjs. Not an asset.',
        ink: INK,
        accent: [ACC, ACC_DEEP],
        generated: [...written.map((w) => outPath(w.path)), 'brand/geometry.json'],
        files: Object.fromEntries([
          ...jobs.map((j) => [
            outPath(j.path),
            { w: j.size, h: j.size, alpha: !j.opaque, markBox: j.markBox, maskR: j.maskR },
          ]),
          [
            outPath('web/og-image.png'),
            { w: 1200, h: 630, alpha: false, markBox: OG.markBox, maskR: null },
          ],
        ]),
      },
      null,
      2
    ) + '\n'
  )
)

cdp.close()
chrome.kill()
await rm(scratch, { recursive: true, force: true })

const total = written.reduce((n, w) => n + w.bytes, 0)
console.log(
  `${written.length} files, ${(total / 1024).toFixed(0)} KB\n` +
    `accent ${ACC} → ${ACC_DEEP} on ${INK}\n` +
    written
      .map((w) => `  ${w.path}`)
      .sort()
      .join('\n')
)
