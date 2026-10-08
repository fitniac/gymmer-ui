<script setup lang="ts">
/**
 * The progress strip — 4px, accent on track, one segment per unit of work.
 *
 * Measured off the boards: 4px with an accent fill over a track, 25
 * occurrences; 6px and 7px appear a handful of times and are the same strip
 * drawn larger on a desktop board.
 *
 * Segments rather than a single bar, because the thing being shown is
 * countable — exercises, sets — and a continuous bar implies a fraction nobody
 * computed. A SKIPPED segment is neither done nor pending and takes its own
 * neutral token: colouring it as either would misreport the workout.
 */
withDefaults(defineProps<{
  /** One entry per segment, in order. */
  segments: ReadonlyArray<'done' | 'current' | 'pending' | 'skipped'>
  /** How full the CURRENT segment is, 0–1 — a set part-way through. */
  progress?: number
}>(), { progress: 0 })

const fill = {
  done: 'bg-accent-line',
  current: 'bg-track',
  pending: 'bg-track',
  skipped: 'bg-skip',
}
</script>

<template>
  <div class="flex w-full gap-1" data-testid="gm-strip">
    <span
      v-for="(s, i) in segments"
      :key="i"
      class="relative h-1 flex-1 overflow-hidden rounded-pill"
      :class="fill[s]"
      :data-state="s"
      data-testid="gm-strip-segment"
    >
      <!-- The current segment fills from the left as the set runs. `--acc-line`
           rather than `--acc`: this is a stroke on the page ground, and in
           light mode the raw accent is 2.83:1 against it. -->
      <span
        v-if="s === 'current'"
        class="absolute inset-y-0 left-0 bg-accent-line"
        :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }"
      />
    </span>
  </div>
</template>
