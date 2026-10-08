<script setup lang="ts">
/**
 * The button, in the three tiers the boards actually draw.
 *
 * Counted across all 50 boards, bucketed by what a button IS rather than by
 * height — a 56px accent fill and a 56px round icon control share a number and
 * are different things:
 *
 *   primary    56px  999px pill   17px/700   accent fill, --on-acc label   ×9
 *   compact    52px  999px pill   16px/700   the primary inside a sheet    ×6
 *   secondary  50px  card radius  15px/600   surface or outline            ×16
 *   small      36px  999px pill   13px/600   chips and inline actions      ×26
 *   round      56px  circle                  1px --line, --surf fill       ×7
 *
 * **44px is not a tier.** It outnumbers every one of these three to one on the
 * boards because it is the floor a tappable icon is padded to, not a size
 * anything is drawn at. A "small" primitive built at 44 would be a misreading
 * of its own evidence — so `small` draws 36 and reaches 44 the way the chip
 * does, with a hit area that adds no layout.
 *
 * **No `.pri`.** That class and `.gho` carry the landing's offset-shadow press
 * — `5px 5px 0` — and the boards do not draw it on an app button: board 16's
 * primary is a flat accent pill. The first gallery frame showed every
 * secondary and small button wearing a hard black shadow the boards never had,
 * which is what putting `.pri` on all five tiers bought.
 *
 * Everything that paints is a utility here, because a state rule in
 * `@layer components` loses to one — `test/css-layers.test.mjs` enforces that
 * and the layer's own comment explains why.
 */
const props = withDefaults(defineProps<{
  tier?: 'primary' | 'compact' | 'secondary' | 'small' | 'round'
  /** A secondary can be a filled surface or an outline; the boards use both. */
  outline?: boolean
  disabled?: boolean
  /** Round buttons are a lone glyph, so they must say what they do. */
  label?: string
}>(), { tier: 'primary', outline: false, disabled: false, label: undefined })

const size = computed(() => ({
  primary: 'h-14 rounded-pill px-6 text-[17px] font-bold',
  compact: 'h-[52px] rounded-pill px-5 text-[16px] font-bold',
  secondary: 'h-[50px] rounded-card px-5 text-[15px] font-semibold',
  small: 'h-9 rounded-pill px-3.5 text-[13px] font-semibold',
  round: 'size-14 rounded-full',
}[props.tier]))

const paint = computed(() => {
  if (props.tier === 'round') return 'border border-line bg-surface text-ink'
  if (props.tier === 'primary' || props.tier === 'compact') return 'bg-accent text-onacc'
  return props.outline ? 'border border-line bg-transparent text-ink' : 'bg-surface text-ink'
})

/** The two tiers that draw under 44 earn their target without taking layout. */
const hit = computed(() => (
  props.tier === 'small' ? 'after:absolute after:inset-x-[-2px] after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']' : ''
))
</script>

<template>
  <button
    type="button"
    class="relative inline-flex shrink-0 items-center justify-center gap-2"
    :class="[size, paint, hit, disabled && 'pointer-events-none opacity-60']"
    :aria-label="label"
    :disabled="disabled || undefined"
    :data-tier="tier"
    data-testid="gm-button"
  >
    <slot />
  </button>
</template>
