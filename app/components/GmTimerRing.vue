<script setup lang="ts">
/**
 * PROMOTED from gymmer-nuxt, 2026-10-09, unchanged except its test ids.
 *
 * It was already the boards' ring — r=54, stroke 6, viewBox 120 on the `board`
 * preset, which is unanimous across the twelve boards that draw one. Moving it
 * here is the 0.2 promotion, not a rebuild: a component that already matches
 * does not get rewritten to prove it moved.
 *
 * The app's copy is deleted in the same change that switches its callers over.
 */
/**
 * A countdown drawn as a ring, with whatever belongs in the middle.
 *
 * Rest (spec 20), Cardio (16) and the in-workout rest overlay (15) all show
 * the same thing — a circle emptying — and until now only Rest had one, drawn
 * inline. Three copies of an SVG whose geometry has to agree is three chances
 * for them to disagree, so the ring moves here and the three screens pass
 * their own content through the slot.
 *
 * The arc takes `--gm-acc-line`, not `--acc`. It is a 6px stroke drawn
 * straight on the page ground, which is the job that token exists for: in
 * light, `--acc` is a FILL colour and misses 3:1 against `--gm-bg`, so a ring
 * painted with it is a bright line nobody can quite see. Dark is unaffected —
 * there `--gm-acc-line` IS the accent. Igor's ruling, 2026-10-09; the progress
 * strip already worked this way. The track and any fill behind it are
 * unchanged.
 *
 * **The default preset is what ships today, exactly.** The redesign's ring is
 * thinner, rounder and sits in a different viewBox (board 20); adopting it
 * here would restyle the rest sheet in a commit whose job is to move code.
 * `preset="board"` is the redesign's geometry, and the screen phase that
 * restyles Rest is what turns it on.
 */
const props = withDefaults(defineProps<{
  /**
   * How much of the rest has ELAPSED, 0 → 1 — so the ring starts full and
   * empties, which is what "time running out" looks like. Clamped at both
   * ends, so a drifting timer neither draws a second lap nor unwinds.
   */
  /**
   * How far through, 0 → 1 — or `null` for "there is nothing to be a fraction
   * of", which draws **no arc at all**.
   *
   * `null` rather than `0`, because those are different claims and they look
   * different. At `0` with round caps the arc still paints a dot at twelve
   * o'clock, which reads as "a little progress" on something that has not
   * started — and on a cardio exercise with no target there is no progress to
   * report, so the track stands alone and the clock counts up (ruling 1).
   */
  progress: number | null
  /**
   * Which way the arc goes.
   *
   * `drain` (the default, and what Rest ships) starts the ring FULL and empties
   * it: `progress` is how much of the allowance is gone, so the ink left is the
   * time left. That is what "running out" looks like.
   *
   * `fill` starts empty and draws toward full: `progress` is how much of the
   * target has been DONE. That is what cardio needs — board 16 draws 64% of
   * the circle at 3:12 of 5:00, ink for work completed.
   *
   * An explicit mode rather than `1 - progress` at the call site. The caller
   * passing an inverted number means the component's `progress` no longer
   * means one thing, and the next reader has to find out which call sites lie.
   */
  mode?: 'drain' | 'fill'
  /** Rendered size in CSS px. The geometry is a viewBox, so this just scales. */
  size?: number
  preset?: 'legacy' | 'board'
  /** Accessible name. Omitted entirely when the ring is decoration beside a
   *  clock that already says the number — which is the case in Rest. */
  label?: string
}>(), { size: 150, preset: 'legacy', mode: 'drain' })

/**
 * The two geometries, side by side, which is the point of having one
 * component: the difference between them is visible in four numbers rather
 * than spread across three templates.
 *
 * `legacy` is lifted verbatim from RestSheet (which credits PhoneFlow for it);
 * `board` is 00-foundations §9 / spec 20.
 */
const PRESETS = {
  legacy: { box: 176, r: 74, stroke: 10, caps: 'butt', track: 'var(--gm-track)' },
  // `--gm-track`, not the board's `--raised`: 15g found that `--raised` is
  // invisible against a light background, and a progress indicator whose
  // UNFILLED portion cannot be seen is not showing progress — it is showing a
  // bare arc floating on the page.
  board: { box: 120, r: 54, stroke: 6, caps: 'round', track: 'var(--gm-track)' },
} as const

const geom = computed(() => PRESETS[props.preset])

/** 2πr — the dash length one full turn costs. */
const circumference = computed(() => 2 * Math.PI * geom.value.r)

/**
 * `progress`, clamped — at BOTH ends, and that is load-bearing.
 *
 * A drifting timer reports more than 1 (the clock passed the target) or less
 * than 0 (a clock corrected backwards). Unclamped, the first draws a second lap
 * — so 110% and 10% look identical, the one thing a ring must never do — and
 * the second unwinds past empty into a negative offset. Ruling 4: at the
 * target the arc is full and STAYS full while the clock keeps counting.
 */
/** Nothing to be a fraction of: the arc is not drawn. */
const noArc = computed(() => props.progress === null)

const fraction = computed(() => {
  if (props.progress === null) return 0
  // A non-finite progress reaches 0, not the attribute.
  //
  // `elapsed / target` with a target of 0 is NaN, and `Math.min`/`Math.max`
  // propagate it — so the SVG would get `stroke-dashoffset="NaN"`, which
  // browsers treat as 0 and render as a FULL arc, with no warning anywhere. A
  // ring claiming the work is done because nobody set a target is worse than a
  // ring claiming nothing. 0 is the honest answer in both modes: an empty arc
  // under `fill`, a full track under `drain`.
  if (!Number.isFinite(props.progress)) return 0
  return Math.max(0, Math.min(1, props.progress))
})

/**
 * How much of the dash to hide.
 *
 * The arc is drawn as one dash of the full circumference, and the offset is how
 * much of it is pushed out of view. So the two modes are the same arithmetic
 * from opposite ends: `drain` hides what has elapsed, `fill` hides what has
 * not.
 */
const dashOffset = computed(() => {
  const hidden = props.mode === 'fill' ? 1 - fraction.value : fraction.value
  return (circumference.value * hidden).toFixed(1)
})
</script>

<template>
  <div class="relative flex-shrink-0" :style="{ height: `${size}px`, width: `${size}px` }">
    <!-- The content sits above the ring and is centred on it; the ring is
         drawn second so it is not what a click lands on. -->
    <div v-if="$slots.default" class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${geom.box} ${geom.box}`"
      class="text-accent-line"
      :role="label ? 'img' : undefined"
      :aria-label="label"
      :aria-hidden="label ? undefined : 'true'"
      data-testid="gm-timer-ring"
    >
      <circle
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.r"
        fill="none"
        :stroke="geom.track"
        :stroke-width="geom.stroke"
      />
      <!-- Rotated so zero is at twelve o'clock rather than three.
           Omitted entirely when there is no fraction to draw: an arc of zero
           length still paints a round cap, and a dot at twelve o'clock reads as
           a little progress on something that has not started. -->
      <circle
        v-if="!noArc"
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.r"
        fill="none"
        stroke="currentColor"
        :stroke-width="geom.stroke"
        :stroke-linecap="geom.caps"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${geom.box / 2} ${geom.box / 2})`"
        class="transition-[stroke-dashoffset] duration-1000 ease-linear"
        data-testid="gm-timer-ring-progress"
      />
    </svg>
  </div>
</template>
