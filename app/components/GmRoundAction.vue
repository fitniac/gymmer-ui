<script setup lang="ts">
/**
 * A round control with its one word underneath — Pause / Resume / Stop.
 *
 * **`BottomZone` draws this now** (canvas v76): Skip in the strength footer,
 * Resume and Stop in the paused cardio one. It was built the day before from
 * two things other boards drew — board 16's 56px round control, and the mono
 * eyebrow caption — and the real board disagrees about the caption:
 *
 *   the 56px round control   board 16's footer        unchanged
 *   the caption              11px / 600, app font,    was mono, uppercase,
 *                            `--body`, sentence case  `.07em`, `--muted`
 *
 * The words are Skip, Resume, Stop. Set out as SKIP · RESUME · STOP they read
 * as the eyebrow labels above a section rather than as what the button under
 * your thumb does, which is what the mono caption made of them.
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
      class="text-[11px] leading-none font-semibold text-body"
      data-testid="gm-round-action-label"
    >{{ label }}</span>
  </span>
</template>
