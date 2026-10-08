<script setup lang="ts">
/**
 * The metric tile — board 16's "ADD IF YOU TRACK IT" square, as a primitive.
 *
 * 62px tall, a value slot over a caption slot, and two states that carry real
 * information: EMPTY is a dashed outline, FILLED is a `--surf` fill. That
 * distinction is "nothing recorded" against "recorded", which a muted dash in
 * a filled tile would blur.
 *
 * Three slots rather than three props, because what goes in them differs by
 * screen: a bare `+`, a planned number drawn muted, an entered one. The tile
 * owns the box and the two states; the screen owns the words.
 *
 * ## One line, always
 *
 * Both slots truncate. The cardio screen learned why: at 320px a third of the
 * row is 77px, and `+ Geschwindigkeit` — the board's own empty label — needs
 * 136. Letting it wrap produced `Geschwind/igkeit` broken mid-word at every
 * width. The fix was to put the NAME in the caption and a `+` in the value, so
 * nothing in either slot can overflow; the truncation here is the backstop,
 * not the plan.
 */
const props = withDefaults(defineProps<{
  /** Dashed and inviting, or filled and recorded. */
  empty?: boolean
  /** A planned value is shown muted: it is not a measurement. */
  muted?: boolean
  disabled?: boolean
}>(), { empty: false, muted: false, disabled: false })

const frame = computed(() => {
  if (props.empty) return 'border-[1.5px] border-dashed border-line'
  return 'bg-surface'
})
</script>

<template>
  <div
    class="flex min-h-[62px] flex-col items-center justify-center gap-0.5 rounded-ctl px-1"
    :class="[frame, disabled && 'opacity-60']"
    :data-empty="empty ? '' : undefined"
    data-testid="gm-tile"
  >
    <span
      class="w-full truncate text-center leading-tight"
      :class="[
        empty && !muted ? 'text-[20px] font-bold' : 'text-[17px] font-extrabold tabular-nums',
        muted ? 'text-muted' : 'text-ink',
      ]"
      data-testid="gm-tile-value"
    ><slot /></span>
    <span
      aria-hidden="true"
      class="w-full truncate px-0.5 text-center font-mono text-[10px] leading-none font-medium text-muted uppercase"
      data-testid="gm-tile-caption"
    ><slot name="caption" /></span>
  </div>
</template>
