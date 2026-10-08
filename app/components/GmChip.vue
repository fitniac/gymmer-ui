<script setup lang="ts">
/**
 * The chip — one primitive, three variants, per Igor's rulings of 2026-10-08.
 *
 * Counting the boards could not settle a height: 34px ×27, 36px ×25, 30px ×24,
 * 38px ×21, 32px ×17. That is a flat spread rather than a majority with noise,
 * so the ruling split on what a chip IS instead:
 *
 *   STATUS  22px  a word about state — RUNNING, PRO, SYNCED. Inert.
 *   TAG     24px  a label on content — a muscle group, a difficulty. Inert.
 *   ACTION  36px  a filter, a choice, a selectable. Tappable.
 *
 * ## 44 is not the height
 *
 * The same trap the button table has: 44px outnumbers every real button tier on
 * the boards three to one because it is the floor a tappable thing is padded
 * to, not a size anything is drawn at. An action chip therefore DRAWS 36 and
 * reaches 44 through an `::after` hit area — no layout added, so a row of chips
 * keeps its 36px rhythm and every one is still a legal target.
 *
 * The hit area is given an explicit **height** and centred, NOT a negative
 * inset. A negative inset is laid out against the PADDING box, and with
 * `box-sizing: border-box` an unselected chip's 1px border eats 2px of the 36 —
 * so `-inset-y-1` produced 42px on bordered chips and 44px on the one without a
 * border. Measured, by the geometry guard, on a row where the three chips
 * looked identical: the selected one passed and the other two did not.
 *
 * ## Merged with the app's chip, not forked from it
 *
 * The app's `GmChip` grew `icon`, `count`, `to`, `removable` and `tone` in use,
 * and the second ruling keeps all five rather than dropping them — with the
 * shapes corrected where they had drifted:
 *
 *  - `icon` and `count` are SLOTS on every variant. A count is mono and
 *    tabular, because a row of chips whose numbers jitter as they change is a
 *    row that looks broken.
 *  - `to` renders a NuxtLink with identical styling and reports
 *    **`aria-current`**, not `aria-pressed`. A link that matches the route is
 *    current; it is not a toggle someone pressed, and a reader should not be
 *    told it is.
 *  - `removable` has **no nested ×**. The whole chip is the remove control,
 *    labelled "Remove {label}", with the × as a glyph rather than a button.
 *    A button inside a button is invalid HTML and gives a 36px row two
 *    overlapping targets, neither reliably 44.
 *  - `tone` belongs to `status` ALONE. An action chip says what it is through
 *    `pressed`; giving it a colour as well invents a second state axis that
 *    nothing reads back.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'status' | 'tag' | 'action'
  /**
   * Only on `status`. Deliberately absent from `action`: a pressed chip is
   * already saying something, and a tone on top is a second state axis.
   */
  tone?: 'neutral' | 'accent' | 'warn' | 'danger'
  /** Only meaningful on `action` — reported as `aria-pressed`. */
  selected?: boolean
  /**
   * Turns the chip into a remove control. The WHOLE chip removes; there is no
   * nested button. Needs `label` so it can say what it removes.
   */
  removable?: boolean
  /** Spoken name — "Remove Barbell". Required in practice when `removable`. */
  label?: string
  /** A route makes it a link: `aria-current` when it matches, never pressed. */
  to?: string
  disabled?: boolean
}>(), { variant: 'tag', tone: 'neutral', selected: false, removable: false, disabled: false, label: undefined, to: undefined })

const emit = defineEmits<{ toggle: [selected: boolean], remove: [] }>()

const interactive = computed(() => props.variant === 'action')
const isLink = computed(() => interactive.value && !!props.to)

const tag = computed(() => {
  if (isLink.value) return resolveComponent('NuxtLink')
  return interactive.value ? 'button' : 'span'
})

const height = computed(() => ({ status: 'h-[22px]', tag: 'h-6', action: 'h-9' }[props.variant]))

/** Inert chips are mono caps — a label, not prose. Action chips carry a word. */
const type = computed(() => (
  interactive.value
    ? 'px-3.5 text-[13px] font-semibold'
    : 'px-2.5 font-mono text-[10px] font-medium tracking-[.07em] uppercase'
))

/** `tone` paints only the inert `status` chip; everything else uses the surface. */
const toneClass = computed(() => {
  if (props.variant !== 'status') return 'bg-surface text-body'
  return {
    neutral: 'bg-surface text-body',
    accent: 'bg-accent-soft text-accent-deep',
    warn: 'bg-surface text-warn',
    danger: 'bg-surface text-danger',
  }[props.tone]
})

function onActivate() {
  if (!interactive.value || props.disabled) return
  if (props.removable) emit('remove')
  else if (!isLink.value) emit('toggle', !props.selected)
}
</script>

<template>
  <component
    :is="tag"
    :to="isLink ? to : undefined"
    :type="interactive && !isLink ? 'button' : undefined"
    class="relative inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-pill no-underline"
    :class="[
      height,
      type,
      selected && interactive && !isLink ? 'bg-accent text-onacc' : toneClass,
      interactive && !selected && 'border border-line',
      disabled && 'pointer-events-none opacity-60',
      // 44px of target without 44px of layout.
      interactive && 'after:absolute after:inset-x-[-2px] after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']',
    ]"
    :aria-pressed="interactive && !isLink && !removable ? selected : undefined"
    :aria-current="isLink && selected ? 'page' : undefined"
    :aria-label="removable && label ? `Remove ${label}` : undefined"
    :disabled="interactive && !isLink && disabled ? true : undefined"
    :data-variant="variant"
    data-testid="gm-chip"
    @click="onActivate"
  >
    <!-- Leading icon, trailing count: slots on every variant, so a status chip
         can carry a dot and a filter can carry its result count. -->
    <slot name="icon" />
    <span class="truncate"><slot /></span>
    <span
      v-if="$slots.count"
      class="font-mono text-[11px] tabular-nums opacity-70"
      data-testid="gm-chip-count"
    ><slot name="count" /></span>
    <!-- A glyph, NOT a button. The chip itself is the remove control. -->
    <span v-if="removable" aria-hidden="true" class="text-[15px] leading-none opacity-70">&times;</span>
  </component>
</template>
