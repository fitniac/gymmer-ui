<script setup lang="ts">
/**
 * A small count meter — how much of an allowance is used, as pips.
 *
 * Board `Programs`' Free line: three 16×6 pills, the used ones in ink and the
 * rest raised, before "1 of 3 programs". Pips rather than a bar for the same
 * reason as `GmProgressStrip`: the thing shown is countable, and a bar implies
 * a fraction. Decorative: the words beside it carry the numbers, so the meter
 * is `aria-hidden` and never the only place the count is said.
 *
 * `max` is capped at 10 — past that a meter is a progress bar wearing pips,
 * and the caller should say the number instead.
 */
import { computed } from 'vue'

const props = defineProps<{
  /** How many are used. Clamped to 0…max. */
  value: number
  /** How many there are. */
  max: number
}>()

const pips = computed(() => {
  const max = Math.max(0, Math.min(10, Math.floor(props.max)))
  const used = Math.max(0, Math.min(max, Math.floor(props.value)))
  return Array.from({ length: max }, (_, i) => i < used)
})
</script>

<template>
  <span class="inline-flex gap-[3px]" aria-hidden="true" data-testid="gm-meter">
    <span
      v-for="(on, i) in pips"
      :key="i"
      class="h-1.5 w-4 rounded-pill"
      :class="on ? 'bg-ink' : 'bg-raised'"
      :data-on="on"
      data-testid="gm-meter-pip"
    />
  </span>
</template>
