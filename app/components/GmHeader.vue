<script setup lang="ts">
/**
 * A screen or card header — a title with an optional mono subline.
 *
 * The WEIGHT is unanimous across the boards: 800, every time, at every size.
 * The SIZE is not — 20px ×18, 22px ×13, 28px ×10, 30px ×9, 26px ×9 — because a
 * card title and a page title are different things wearing the same type. So
 * the weight is fixed here and the size is a prop with the two the boards reach
 * for most.
 *
 * The subline is the mono treatment measured in `primitives-spec.md`:
 * 11px/600/.07em, uppercase, muted. That was a DECISION rather than a reading —
 * two axes varied independently and nothing cleared a third of the field — so a
 * board setting .08em is a difference to list, not a bug to fix.
 */
withDefaults(defineProps<{
  /** `card` is the 20px title; `page` is the 28px one. */
  size?: 'card' | 'page'
}>(), { size: 'card' })
</script>

<template>
  <header class="grid gap-1" data-testid="gm-header">
    <h2
      class="font-display font-extrabold text-ink"
      :class="size === 'page' ? 'text-[28px] leading-tight' : 'text-[20px] leading-snug'"
      data-testid="gm-header-title"
    >
      <slot />
    </h2>
    <p
      v-if="$slots.sub"
      class="font-mono text-[11px] leading-none font-semibold tracking-[.07em] text-muted uppercase"
      data-testid="gm-header-sub"
    >
      <slot name="sub" />
    </p>
  </header>
</template>
