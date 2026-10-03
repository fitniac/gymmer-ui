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
import rawG from '../assets/img/gymmer-g.svg?raw'
import rawYmmer from '../assets/img/gymmer-ymmer.svg?raw'

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
    /**
     * Which lockup.
     *
     * `gradient` (default) is the original: the gradient mark plus the word
     * GYMMER set in Archivo. It stays the app-icon lockup and nothing about it
     * changes.
     *
     * `wordmark-g` is the header lockup from board 22, variant A6 — an
     * outlined single-ring G in `--acc` beside outlined YMMER letters in
     * currentColor. Outlines, not live text, so the lockup is identical on a
     * machine without Archivo and cannot be restyled by an inherited
     * font-weight.
     */
    variant?: 'gradient' | 'wordmark-g'
  }>(),
  { size: undefined, wordmark: true, responsive: false, inverse: false, to: undefined, variant: 'gradient' },
)

/** `v-html` goes into an HTML parser, which does not want an XML prolog. */
const clean = (svg: string) => svg
  .replace(/<\?xml[^>]*\?>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .trim()

const markup = clean(rawLogo)
const gMarkup = clean(rawG)
const ymmerMarkup = clean(rawYmmer)

const root = computed(() => (props.to ? resolveComponent('NuxtLink') : 'span'))
</script>

<template>
  <!-- A6 (board 22b): the G is drawn 2.5% larger than the letters and dropped
       by the same 2.5%, so its top aligns with them and it overshoots the
       baseline — a round letter needs that to read as the same height. Sized
       in `em` off the lockup's own font-size so it survives any scale, which
       a px pair would not. -->
  <component
    v-if="variant === 'wordmark-g'"
    :is="root"
    :to="to"
    class="logo-wg"
    :style="size == null ? undefined : { fontSize: `${size}px` }"
    role="img"
    aria-label="GYMMER"
  >
    <!-- Both halves are outlines, so there is no text to read: the accessible
         name is on the root. Deliberately NOT Tailwind's .sr-only — this layer
         owns no Tailwind (see CLAUDE.md), and a component that depends on a
         utility class from the consumer breaks the moment one of them is
         configured differently. -->
    <span class="logo-wg-mark" aria-hidden="true" v-html="gMarkup" />
    <span v-if="wordmark" class="logo-wg-type" aria-hidden="true" v-html="ymmerMarkup" />
  </component>

  <component
    v-else
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
