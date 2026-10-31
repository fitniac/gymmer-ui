#!/usr/bin/env bash
#
# Tag a layer release only if the consuming app's guards accept it.
#
# v0.6.0 shipped an adaptive panel that reported `data-variant="panel"`,
# rounded the right corners, attached itself to the right edge — and measured
# 1440px wide, because `w-full` sat in the base class and `w-[480px]` in the
# variant one. The geometry guard found it in ten seconds; it just ran AFTER
# the tag, so the fix had to be a second release. This script is that order
# reversed, and nothing else.
#
#   scripts/release.sh v0.6.2
#
# What it does, in order, stopping at the first failure:
#
#   1. refuses a dirty tree (here AND in the consumer — a guard run against
#      uncommitted app changes proves nothing about this layer);
#   2. lint + unit tests here;
#   3. links this checkout into the consumer, installs, builds its e2e stack;
#   4. runs the gallery's geometry guard and the gallery shoot — the two specs
#      that measure the layer's primitives through a real browser — and then
#      checks the shoot's eight frames are on disk, because that spec skips
#      itself (exit 0, nothing measured) against a non-review build;
#   5. restores the consumer (override removed, pinned install back), ALWAYS,
#      including on failure and on Ctrl-C;
#   6. only then: version, commit, tag, push.
#
# `DRY_RUN=1` stops after step 5: everything that can fail still runs, and
# nothing is written or pushed. That is how the guard step itself is
# controlled — plant a defect, run the dry release, watch it exit non-zero.
#
# The consumer is `../gymmer-nuxt` unless $GYMMER_NUXT says otherwise.
set -euo pipefail
cd "$(dirname "$0")/.."
LAYER="$PWD"

version="${1:-}"
if [[ ! "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "usage: scripts/release.sh vX.Y.Z" >&2
  exit 2
fi
APP="${GYMMER_NUXT:-$(cd .. && pwd)/gymmer-nuxt}"

say() { printf '\n\033[1m── %s\033[0m\n' "$1"; }
die() { printf '\033[31m❌ %s\033[0m\n' "$1" >&2; exit 1; }

say "a clean tree, here and in the consumer"
[ -z "$(git status --porcelain)" ] || die "$LAYER has uncommitted changes — commit them first."
[ -d "$APP" ] || die "no consumer at $APP (set GYMMER_NUXT)."
[ -z "$(git -C "$APP" status --porcelain)" ] \
  || die "$APP has uncommitted changes — a guard run against them proves nothing about this layer."

say "lint and unit tests"
pnpm -s lint
pnpm -s test

# ── The consumer is borrowed, and given back ────────────────────────────────
#
# `pnpm-workspace.yaml` is gitignored in the app and may already exist for a
# human's own dev loop; whatever was there comes back.
WS="$APP/pnpm-workspace.yaml"
SAVED="$(mktemp -t gmui-ws)"
HAD_WS=0
[ -f "$WS" ] && { cp "$WS" "$SAVED"; HAD_WS=1; }
# The consumer's lockfile is tracked, and the link below rewrites the layer's
# entry in it; it is put back byte for byte, like the workspace file.
LOCK="$APP/pnpm-lock.yaml"
SAVED_LOCK="$(mktemp -t gmui-lock)"
cp "$LOCK" "$SAVED_LOCK"

restore() {
  say "restoring $APP"
  if [ "$HAD_WS" = 1 ]; then cp "$SAVED" "$WS"; else rm -f "$WS"; fi
  cp "$SAVED_LOCK" "$LOCK"
  rm -f "$SAVED" "$SAVED_LOCK"
  ( cd "$APP" && pnpm install --silent >/dev/null 2>&1 ) || true
  ( cd "$APP" && ./scripts/e2e-local-stack.sh down >/dev/null 2>&1 ) || true
}
trap restore EXIT INT TERM

say "linking this checkout into $APP"
printf 'overrides:\n  "@gymmer/ui": "link:%s"\n' "$LAYER" > "$WS"
# Against the consumer's OWN lockfile, changing only the layer's entry.
# `--no-lockfile` re-resolved every range instead: it pulled a newer
# @playwright/test whose browser is not installed, so the guards could not
# even launch — found preparing v0.6.3.
( cd "$APP" && pnpm install --no-frozen-lockfile --silent )

say "building the app's e2e stack"
# NOT "...against this layer": `up` resolves the prod API image and builds the
# app from source, and either half can fail for reasons the layer has no part
# in — no hel key on a waw runner, a swarm that does not answer.
#
# The specific reason is NOT lost either way: `die` writes to stderr and the
# redirect above is stdout only, so the stack's own message prints first. What
# changes here is only the headline — which stated a cause this step never
# tested. That is the same defect as a test report calling a failure
# "pre-existing": a sentence about a cause, carrying the confidence of a
# measurement.
( cd "$APP" && ./scripts/e2e-local-stack.sh up >/dev/null ) \
  || die "the consumer's stack would not come up — that is a fault in the stack or its API image, NOT a verdict about this layer."

say "the guards that measure this layer"
# The shoot writes into a FRESH directory, so a frame on disk afterwards can
# only have been written by this run. `mktemp -d`, never a fixed /tmp name:
# this machine is shared with other checkouts and other sessions.
FRAMES="$(mktemp -d -t gmui-frames)"
# Chained with `&&`, every step. `set -e` does NOT apply inside a subshell
# whose status is tested with `||`, so with the steps on separate lines the
# subshell's status was the LAST command's: a failing geometry spec was
# swallowed whenever the gallery shoot after it passed. Found 2026-10-13 when a
# dry run printed "1 failed" and then "the consumer's guards accept this
# layer". (The gate's earlier control had planted a defect that broke BOTH
# steps, so it never saw this.)
(
  cd "$APP" \
    && eval "$(./scripts/e2e-local-stack.sh env)" \
    && pnpm exec playwright test e2e/tests/gallery-geometry.spec.ts --project=chromium --reporter=line \
    && SHOOT_THEME=dark SHOOT_OUT="$FRAMES" pnpm exec playwright test --config=e2e/visual/shoot.config.ts e2e/visual/gallery.spec.ts --reporter=line
) || die "the consumer's gallery guards refuse this layer — nothing tagged."

# ── The shoot passes by not running ─────────────────────────────────────────
#
# `gallery.spec.ts` is ONE test, and its line 38 is
#
#   test.skip(probe.status() !== 200, `/dev/gallery answered … not a review build`)
#
# so against a non-review build every one of its assertions is skipped,
# Playwright prints `1 skipped`, and the exit code is 0. The step above would
# then be green having photographed nothing, and this script would tag a
# version whose dark half was never looked at.
#
# What keeps that from happening today is `GYMMER_REVIEW=1` inside the
# consumer's `e2e-local-stack.sh` — one line, in another repo, which another
# lane is editing (it moved from 229 to 247 in B13). An invariant held
# somewhere else is not an invariant this gate knows. So assert the ARTEFACTS:
# eight frames, by name, as the spec's own log promises (ACCENTS + 4).
missing=""
for f in gallery-dark-orange.png gallery-dark-lime.png gallery-dark-sky.png gallery-dark-violet.png \
         gallery-dark-sheet-open.png gallery-dark-dialog-open.png gallery-dark-panel-open.png gallery-dark-footer-open.png; do
  [ -s "$FRAMES/$f" ] || missing="$missing $f"
done
if [ -n "$missing" ]; then
  rm -rf "$FRAMES"
  die "the dark shoot exited 0 but did not write:$missing — it skipped rather than ran (a build without /dev/gallery, i.e. not a review build), so nothing measured this layer. NOT tagged."
fi
echo "   8 frames on disk — the shoot ran, it did not skip"
rm -rf "$FRAMES"

restore
trap - EXIT INT TERM

if [ "${DRY_RUN:-0}" = "1" ]; then
  printf '\n\033[32m✅ dry run: the consumer'"'"'s guards accept this layer; nothing tagged\033[0m\n'
  exit 0
fi

say "tagging $version"
node -e '
  const fs = require("fs")
  const v = process.argv[1].replace(/^v/, "")
  const p = JSON.parse(fs.readFileSync("package.json", "utf8"))
  p.version = v
  fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n")
' "$version"
git add package.json
git commit -q -m "$version" --allow-empty
git tag -a "$version" -m "$version"
git push -q origin main --tags
printf '\n\033[32m✅ %s tagged and pushed, with the consumer'"'"'s guards green against it\033[0m\n' "$version"
