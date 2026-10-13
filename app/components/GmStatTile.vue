<script setup lang="ts">
/**
 * One number in a description list — a stat tile.
 *
 * Promoted from the app's `SummaryStat` (board `Summary`'s stat grid, which
 * called itself "the layer's first draft") when board `Program` drew the same
 * object smaller: a value, its unit smaller and muted beside it, and a mono
 * caption under it that is a real `<dt>` a screen reader reads.
 *
 *   size lg   26px value, 15px unit — the Summary
 *   size md   20px value, 13px unit — the Program's "4 EXERCISES · 10 SETS"
 *
 * Not `GmTile`: that is board 16's centred cardio tile, a control with its
 * caption `aria-hidden`. Different object, different component.
 *
 * Must sit inside a `<dl>` — the caller's grid. One line each, value and
 * caption: a stat that breaks onto two lines reads as two stats, so both
 * truncate (they are content, not a control's label).
 */
withDefaults(defineProps<{
  value: string
  unit?: string | null
  caption: string
  size?: 'lg' | 'md'
}>(), { unit: null, size: 'lg' })
</script>

<template>
  <!-- `dt` first, as a description list requires; drawn under the value. -->
  <div class="flex min-w-0 flex-col-reverse justify-end rounded-ctl bg-surface p-3.5" :data-size="size" data-testid="gm-stat">
    <dt class="mt-0.5 truncate font-mono text-[10px] font-medium tracking-[.06em] text-muted uppercase" data-testid="gm-stat-caption">
      {{ caption }}
    </dt>
    <dd
      class="m-0 truncate leading-tight font-extrabold tabular-nums"
      :class="size === 'lg' ? 'text-[26px]' : 'text-xl'"
      data-testid="gm-stat-value"
    >
      {{ value }}<span v-if="unit" class="font-extrabold text-muted" :class="size === 'lg' ? 'text-[15px]' : 'text-[13px]'"> {{ unit }}</span>
    </dd>
  </div>
</template>
