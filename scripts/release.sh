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
#      that measure the layer's primitives through a real browser;
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

restore() {
  say "restoring $APP"
  if [ "$HAD_WS" = 1 ]; then cp "$SAVED" "$WS"; else rm -f "$WS"; fi
  rm -f "$SAVED"
  ( cd "$APP" && pnpm install --silent >/dev/null 2>&1 ) || true
  ( cd "$APP" && ./scripts/e2e-local-stack.sh down >/dev/null 2>&1 ) || true
}
trap restore EXIT INT TERM

say "linking this checkout into $APP"
printf 'overrides:\n  "@gymmer/ui": "link:%s"\n' "$LAYER" > "$WS"
( cd "$APP" && pnpm install --no-lockfile --silent )

say "building the app's e2e stack"
( cd "$APP" && ./scripts/e2e-local-stack.sh up >/dev/null ) || die "the consumer's stack would not build against this layer."

say "the guards that measure this layer"
(
  cd "$APP"
  # shellcheck disable=SC1090
  eval "$(./scripts/e2e-local-stack.sh env)"
  pnpm exec playwright test e2e/tests/gallery-geometry.spec.ts --project=chromium --reporter=line
  SHOOT_THEME=dark pnpm exec playwright test --config=e2e/visual/shoot.config.ts e2e/visual/gallery.spec.ts --reporter=line
) || die "the consumer's gallery guards refuse this layer — nothing tagged."

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
