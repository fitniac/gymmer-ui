<script setup lang="ts">
/**
 * A round control with its one word underneath — Pause / Resume / Stop.
 *
 * **The boards do not draw this.** Asked for on 2026-10-09; the closest things
 * they have are board 16's 56px round footer control, whose label is an
 * `aria-label` and is not drawn, and `DeskActive`'s Pause, which is a 44px
 * OUTLINED PILL with a 14px/600 label inside it. So this is a composition of
 * two things the boards do draw rather than a reading of one they do:
 *
 *   the 56px round control   board 16's footer
 *   the mono caption         11px / 600 / .07em, uppercase, muted
 *
 * Recorded because a primitive with no board behind it is the kind of thing
 * that later gets defended as "matching the design" by whoever finds it.
 *
 * The label is drawn AND spoken — it is the button's accessible name, so the
 * round control does not need an `aria-label` of its own, and a reader is not
 * told the word twice.
 */
const props = withDefaults(defineProps<{
  /** The word under the control. Also its accessible name. */
  label: string
  /** `primary` fills with the accent; `ghost` is the surface + line. */
  tone?: 'primary' | 'ghost'
  disabled?: boolean
}>(), { tone: 'ghost', disabled: false })

defineEmits<{ press: [] }>()

const paint = computed(() => (
  props.tone === 'primary' ? 'bg-accent text-onacc' : 'border border-line bg-surface text-ink'
))
</script>

<template>
  <span class="inline-flex flex-col items-center gap-1.5" data-testid="gm-round-action">
    <button
      type="button"
      class="flex size-14 items-center justify-center rounded-full"
      :class="[paint, disabled && 'pointer-events-none opacity-60']"
      :disabled="disabled || undefined"
      data-testid="gm-round-action-button"
      @click="$emit('press')"
    >
      <slot />
    </button>
    <span
      class="font-mono text-[11px] leading-none font-semibold tracking-[.07em] text-muted uppercase"
      data-testid="gm-round-action-label"
    >{{ label }}</span>
  </span>
</template>
