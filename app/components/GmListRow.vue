<script setup lang="ts">
/**
 * A list row — sized by its content, with a 44px floor.
 *
 * Counting could not give this one a height either, and the reason is visible
 * in the numbers: 44px ×17, then 68 ×8, 56 ×8, 60 ×6, 58 ×1. The 44 is the
 * tap-target floor again — the same figure that tops the button table for the
 * same reason — and the real spread is content-driven, because a row with a
 * thumbnail is taller than one without.
 *
 * So the row does not have a height. It has a FLOOR of 44 and whatever its
 * content needs above that, which is what 22 of the boards are already doing.
 * A fixed row height would contradict them.
 */
const props = withDefaults(defineProps<{
  /** A row that navigates is a link and says so; a row that acts is a button. */
  to?: string
  /** Inert rows exist — a summary line is not a control. */
  interactive?: boolean
  disabled?: boolean
}>(), { to: undefined, interactive: false, disabled: false })

/**
 * Three elements, chosen by what the row DOES.
 *
 * A row that navigates is a link, a row that acts is a button, and a row that
 * only shows something is a div. Rendering every row as a div with a click
 * handler is how a list becomes unreachable by keyboard without anything
 * looking wrong.
 */
const tag = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  return props.interactive ? 'button' : 'div'
})
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :type="interactive && !to ? 'button' : undefined"
    class="flex min-h-11 w-full items-center gap-3 rounded-ctl px-3 py-2 text-left no-underline"
    :class="[
      (interactive || to) && 'hover:bg-surface',
      disabled && 'pointer-events-none opacity-60',
    ]"
    :disabled="interactive && !to && disabled ? true : undefined"
    data-testid="gm-row"
  >
    <slot name="lead" />
    <span class="min-w-0 flex-1"><slot /></span>
    <slot name="trail" />
  </component>
</template>
