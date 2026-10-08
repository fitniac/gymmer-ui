<script setup lang="ts">
/**
 * The chip — two variants of one primitive, per Igor's ruling of 2026-10-08.
 *
 * Counting the boards could not settle a chip height: 34px ×27, 36px ×25,
 * 30px ×24, 38px ×21, 32px ×17. That is a flat spread rather than a majority
 * with noise, and picking the tallest bar of a flat histogram would have
 * looked like evidence. The ruling settles it by splitting on what a chip IS
 * rather than on what it measured:
 *
 *   STATUS  22px  a word about state — RUNNING, PRO, SYNCED. Not tappable,
 *                 so it has no tap target and no pressed state.
 *   TAG     24px  a label on content — a muscle group, a difficulty. Also not
 *                 tappable.
 *   ACTION  36px  a filter, a choice, a selectable. Tappable, so its tap
 *                 target is at least 44px even though it DRAWS 36.
 *
 * ## The 44 is not the height
 *
 * This is the same trap the button table has: 44px outnumbers every real
 * button tier on the boards three to one because it is the floor a tappable
 * thing is padded to, not a size anything is drawn at. So an action chip draws
 * 36 and reaches 44 through a hit-area pseudo-element, which adds no layout —
 * a row of chips keeps its 36px rhythm and every one of them is still a legal
 * target. `::after` with a negative inset is the same technique the tracking
 * screen's help link already uses.
 *
 * ## Why one component and not two
 *
 * They share everything that can drift: the pill radius, the type scale, the
 * surface and line tokens, the truncation rule. Two components would be two
 * places to forget one of them. The variant decides height, interactivity and
 * whether there is a pressed state — nothing else.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /**
   * `status` and `tag` are inert; `action` is a control.
   *
   * The distinction is not decorative: an inert chip renders a `<span>` with
   * no tab stop and no pressed state, and an action chip renders a `<button>`
   * that reports `aria-pressed`. A screen reader should not be offered a
   * control that does nothing.
   */
  variant?: 'status' | 'tag' | 'action'
  /** Only meaningful on `action` — emits `aria-pressed` for assistive tech. */
  selected?: boolean
  disabled?: boolean
}>(), { variant: 'tag', selected: false, disabled: false })

const emit = defineEmits<{ toggle: [selected: boolean] }>()

const interactive = computed(() => props.variant === 'action')

const height = computed(() => ({ status: 'h-[22px]', tag: 'h-6', action: 'h-9' }[props.variant]))

/**
 * Type scales with the chip, and the two inert ones are mono caps.
 *
 * That is the boards' own treatment for a status word — it is a label, not
 * prose — while an action chip carries a real word someone reads and taps, so
 * it stays in the UI face.
 */
const type = computed(() => (
  interactive.value
    ? 'px-3.5 text-[13px] font-semibold'
    : 'px-2.5 font-mono text-[10px] font-medium tracking-[.07em] uppercase'
))
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="relative inline-flex max-w-full shrink-0 items-center justify-center gap-1 truncate rounded-pill"
    :class="[
      height,
      type,
      selected && interactive ? 'bg-accent text-onacc' : 'bg-surface text-body',
      !selected && interactive && 'border border-line',
      disabled && 'pointer-events-none opacity-60',
      // The 44px tap target, added WITHOUT adding layout: the chip still
      // occupies 36px in the row, and the hit area overhangs it.
      interactive && 'after:absolute after:-inset-y-1 after:-inset-x-0.5 after:content-[\'\']',
    ]"
    :aria-pressed="interactive ? selected : undefined"
    :disabled="interactive && disabled ? true : undefined"
    :data-variant="variant"
    data-testid="gm-chip"
    @click="interactive && !disabled && emit('toggle', !selected)"
  >
    <slot />
  </component>
</template>
