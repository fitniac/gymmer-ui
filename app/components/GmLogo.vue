<script setup lang="ts">
/**
 * The GYMMER lockup — mark plus wordmark.
 *
 * This is the layer's first Vue component, and it is here rather than in
 * gymmer-nuxt because both consumers need it at once, which is the promotion
 * bar CLAUDE.md sets. Everything else stays CSS.
 *
 * The mark is `v-html`'d from `app/assets/img/logo.svg` via `?raw` rather than
 * pasted in as a template. Two reasons, and both have teeth:
 *
 *  - The SVG has to be INLINE in the document. Its fill is a 45° gradient
 *    between `--acc` and `--acc-deep`, and an <img> is an isolated document
 *    that cannot read `html[data-accent]`, so it would sit on light orange
 *    while the rest of the page retints.
 *  - Pasting the path into a .vue file makes a second copy of the artwork, and
 *    the whole reason this layer exists is that two copies drift. `?raw` keeps
 *    logo.svg the only place the geometry lives, so `pnpm brand` and this
 *    component can never disagree.
 *
 * The XML prolog and comments are stripped because `v-html` inserts into an
 * HTML parser, which does not want a `<?xml ?>` processing instruction.
 */
import rawLogo from '../assets/img/logo.svg?raw'

const props = withDefaults(
  defineProps<{
    /**
     * Drives everything — mark size, gap and wordmark size all derive from it.
     *
     * Omit it to leave `--logo-size` to CSS, which is the only way to make the
     * lockup responsive: an inline style would beat any utility class, so
     * `<GmLogo class="[--logo-size:26px] md:[--logo-size:34px]" />` needs this
     * unset. `.logo` falls back to 32px.
     */
    size?: number
    /** Set false for the mark alone (app icons, tight toolbars, the tab bar). */
    wordmark?: boolean
    /** Drop the wordmark under 560px, where the mark still reads and it doesn't. */
    responsive?: boolean
    /** For the always-dark Pro card and inverted bands. */
    inverse?: boolean
    /** Renders a NuxtLink instead of a span. */
    to?: string
  }>(),
  { size: undefined, wordmark: true, responsive: false, inverse: false, to: undefined },
)

const markup = rawLogo
  .replace(/<\?xml[^>]*\?>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .trim()

const root = computed(() => (props.to ? resolveComponent('NuxtLink') : 'span'))
</script>

<template>
  <component
    :is="root"
    :to="to"
    class="logo"
    :class="{ 'logo-inv': inverse }"
    :style="size == null ? undefined : { '--logo-size': `${size}px` }"
  >
    <!-- aria-hidden whenever the wordmark is present: the SVG carries its own
         <title>GYMMER</title>, and without this a screen reader announces the
         brand name twice in a row. -->
    <span
      class="logo-mark"
      :aria-hidden="wordmark ? 'true' : undefined"
      v-html="markup"
    />
    <span v-if="wordmark" class="logo-type" :class="{ 'logo-type-sm': responsive }">GYMMER</span>
  </component>
</template>
