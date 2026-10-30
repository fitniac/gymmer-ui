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
     * unset. `.logo-wg` falls back to 32px.
     *
     * The prop writes `--logo-size`, NOT `font-size`, which the old
     * `wordmark-g` lockup used. Two call sites size this component purely
     * through the variable and pass no prop at all (`login.vue`,
     * `auth/callback/apple.vue`); had the converged lockup kept sizing by
     * `font-size` they would have silently fallen back to whatever font-size
     * they inherited.
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
     * @deprecated Accepted and ignored since v0.7.1 — there is one lockup now.
     *
     * It used to pick between two, and they were not two renderings of one
     * thing: `gradient` set the word GYMMER in live text BESIDE the mark,
     * while `wordmark-g` used the mark AS the letter G with
     * `gymmer-ymmer.svg` — which is YMMER, not GYMMER; its viewBox crops the
     * leading G. So the same component drew the brand two different ways
     * depending on a prop, and the app header and the marketing header picked
     * differently. Igor's ruling, 2026-10-30: converge on the outlined
     * wordmark everywhere.
     *
     * Still declared rather than removed, so no consumer breaks on an unknown
     * prop landing in `$attrs` and rendering as a DOM attribute. Delete the
     * call sites, then this.
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
       in `em` off the lockup's own font-size, which `--logo-size` sets, so it
       survives any scale where a px pair would not. -->
  <component
    :is="root"
    :to="to"
    class="logo-wg"
    :class="{ 'logo-inv': inverse }"
    :style="size == null ? undefined : { '--logo-size': `${size}px` }"
    role="img"
    aria-label="GYMMER"
  >
    <!-- Both halves are outlines, so there is no text to read: the accessible
         name is on the root. Deliberately NOT Tailwind's .sr-only — this layer
         owns no Tailwind (see CLAUDE.md), and a component that depends on a
         utility class from the consumer breaks the moment one of them is
         configured differently.

         The mark alone keeps the GRADIENT one. Inside the word it is a letter
         and must match the letters, so it is the flat `--acc` outline; on its
         own it is the brand mark rather than a glyph, and the gradient is the
         brand mark. The 44px end-of-workout stamp is the surface this serves. -->
    <span class="logo-wg-mark" aria-hidden="true" v-html="wordmark ? gMarkup : markup" />
    <span
      v-if="wordmark"
      class="logo-wg-type"
      :class="{ 'logo-wg-type-sm': responsive }"
      aria-hidden="true"
      v-html="ymmerMarkup"
    />
  </component>
</template>
