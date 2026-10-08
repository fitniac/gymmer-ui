<script setup lang="ts">
/**
 * The toast — read off `Article.dc.html`, which is the only board that draws
 * one properly, so this is a reading rather than a count.
 *
 *     position: absolute; left: 50%; bottom: 100px; z-index: 9;
 *     width: max-content; max-width: 340px;
 *     padding: 11px 16px; border-radius: 999px;
 *     background: var(--ink); color: var(--bg);
 *     font: 600 13px var(--font);
 *     box-shadow: 0 8px 30px rgba(0,0,0,.35);
 *     animation: toast 2.6s ease both      (in at 12%, out after 85%)
 *
 * Two things worth naming, because both are easy to "improve" wrongly.
 *
 * **It is INVERTED, not accented.** Ink on ground, reversed — `background:
 * var(--ink); color: var(--bg)`. A toast is not an accent surface: it is the
 * one thing on screen that is deliberately not part of the page, and painting
 * it with the brand colour would make it compete with the primary button it
 * usually appears next to.
 *
 * **`width: max-content` with a 340px cap.** A toast is as wide as its
 * sentence and no wider — a full-width bar reads as a banner, which is a
 * different and heavier thing.
 *
 * `bottom: 100px` is the board's number for a screen with a tab bar. Here it
 * is the default of a prop, because the app's bottom zone varies — the layer
 * publishes `--gm-tabbar-h` for exactly this and the consumer can pass it.
 *
 * ## Live region, not just a box
 *
 * `role="status"` with `aria-live="polite"`: a toast that is only visual is a
 * message a screen-reader user never receives. `polite` rather than `assertive`
 * because it never carries anything that must interrupt — an error that must
 * interrupt is a dialog, not a toast.
 */
withDefaults(defineProps<{
  /** Distance from the bottom. The board's 100px assumes a tab bar. */
  offset?: string
}>(), { offset: '100px' })
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none absolute left-1/2 z-10 w-max max-w-[340px] -translate-x-1/2 rounded-pill bg-ink px-4 py-[11px] text-[13px] font-semibold text-ground shadow-[0_8px_30px_rgba(0,0,0,.35)]"
    :style="{ bottom: offset }"
    data-testid="gm-toast"
  >
    <slot />
  </div>
</template>
