<script setup lang="ts">
/**
 * The bottom sheet, the dialog and the side panel — one shell, because they
 * differ by edge.
 *
 * Measured off the boards: a 22px top radius on a sheet, a scrim of
 * `rgba(0,0,0,.55)` (30 of 44 — `.62` ×8 and `.45` ×6 are the minority), and
 * 28px of bottom padding so the last control clears a home indicator. Both
 * numbers are already the layer's `--gm-radius-sheet` and `--gm-scrim`, which
 * is the happy case: nothing to change, only to use.
 *
 * `<dialog>` rather than a div with a z-index. It gets the top layer, focus
 * trapping and Escape from the platform, and none of those three is worth
 * reimplementing badly — the app's own sheet learned this already.
 *
 * The variant decides which edge it is attached to and therefore which corners
 * are round: a SHEET rises from the bottom and rounds its top two; a DIALOG
 * floats and rounds all four; ADAPTIVE is a sheet on a phone and a 480px right
 * panel from 1200px, where there is room beside the page instead of over it.
 *
 * The width lives in the PER-VARIANT class, not in the base one. `w-full` and
 * `w-[480px]` are both width utilities, so which wins is the stylesheet's
 * order rather than the attribute's: v0.6.0 shipped a panel that reported
 * `data-variant="panel"`, rounded the right corners and measured 1440px wide,
 * which the geometry guard caught on the first run against it.
 *
 * ## The three things v0.6.0 added, and why they are here rather than in an app
 *
 * `adaptive`, the sticky footer and swipe-to-dismiss were the reasons the
 * consuming app could not move its sheets onto this shell — it had all three
 * and the layer had none, so "migrating" would have traded behaviour for a
 * primitive. They are behaviour, not styling, which is exactly what a shell is
 * for: every sheet in every app wants the same answers.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open?: boolean
  /**
   * `panel` (v0.6.3) is the right-hand panel at EVERY width: full height, up to
   * 420px, the whole screen on a phone — the app's rest screen and exercise
   * picker, which cover the workout rather than sitting over a visible page.
   * `adaptive` becomes a (480px) panel only from 1200px.
   */
  variant?: 'sheet' | 'dialog' | 'adaptive' | 'panel'
  /** Spoken name. A sheet with no title needs one anyway. */
  title?: string
  /** Travel, in px, that counts as "put it away". */
  swipeThreshold?: number
  /** Off for a sheet whose content must not be dismissed by a stray drag. */
  swipe?: boolean
  /** A press that starts and ends outside the sheet closes it (v0.6.3). */
  dismissOnBackdrop?: boolean
  /**
   * The body's own padding (v0.6.3). On by default: the boards' 16px sides.
   * Off for a consumer that brings its own — an app moving existing sheets
   * onto the shell without moving a pixel. Since v0.6.8 it covers the footer
   * too: off, the footer is sticky and painted, and its padding, rule and gap
   * are the consumer's.
   */
  inset?: boolean
  /**
   * Draw the grab handle (v0.6.3). Off for a consumer that draws its own in
   * the `#header` slot — the gesture is unchanged, only who draws the bar.
   */
  grab?: boolean
}>(), { open: false, variant: 'sheet', title: undefined, swipeThreshold: 70, swipe: true, dismissOnBackdrop: true, inset: true, grab: true })

const emit = defineEmits<{ close: [] }>()

const el = ref<HTMLDialogElement | null>(null)

/** From this width up, `adaptive` is a panel beside the page. */
const PANEL_FROM = 1200
const wide = ref(false)
let mq: MediaQueryList | null = null
const onWide = (e: MediaQueryListEvent | MediaQueryList) => { wide.value = e.matches }

/** A sheet by edge: the bottom one, or the right-hand panel. */
const isPanel = computed(() => props.variant === 'panel' || (props.variant === 'adaptive' && wide.value))
const isBottom = computed(() => props.variant === 'sheet' || (props.variant === 'adaptive' && !wide.value))

/**
 * `showModal` is what puts it in the top layer and traps focus; `open=true` as
 * an attribute does neither, which is the quiet way to ship a sheet the page
 * behind can still be tabbed into.
 *
 * Called from a watcher AND on mount. The watcher alone, even `immediate`,
 * runs during setup while the template ref is still null — so a sheet created
 * already-open silently stayed shut. Found on the gallery, where both the
 * sheet and the dialog render open and neither appeared; `open=false`,
 * `display: none`, a 0×0 box.
 */
function sync() {
  const d = el.value
  if (!d) return
  if (props.open && !d.open) {
    // Only one element can be modal at a time. A second `showModal` throws
    // InvalidStateError and would take the page's JS with it, so a non-modal
    // fallback is better than a blank screen: it loses focus trapping, which
    // a specimen does not need and a real screen never hits, because a real
    // screen does not open two sheets at once.
    try {
      d.showModal()
    }
    catch {
      d.show()
    }
  }
  if (!props.open && d.open) d.close()
  if (!props.open) drag.value = 0
}

watch(() => props.open, sync)
onMounted(() => {
  sync()
  if (typeof window.matchMedia === 'function') {
    mq = window.matchMedia(`(min-width: ${PANEL_FROM}px)`)
    onWide(mq)
    mq.addEventListener('change', onWide)
  }
})
onBeforeUnmount(() => mq?.removeEventListener('change', onWide))

/* ── Dismiss on the backdrop ─────────────────────────────────────────────
 *
 * Ported from the app's own sheet (v0.6.3), with the three rules it learned
 * the hard way, because a shell the app's sheets move onto must not lose them:
 *
 *  - Decided where the PRESS started, measured at pointerdown. By the time the
 *    click arrives the sheet may have changed size (content collapsing while
 *    something loads), and the click's coordinates then fall "outside" a tap
 *    that was plainly inside.
 *  - Not from a dialog opened ON TOP of this one: a viewer or a confirm in the
 *    sheet's content is a DOM descendant that paints above it, and its own
 *    close button sits where this sheet is not.
 *  - Not a click no pointer produced (`detail === 0`): Enter or Space on a
 *    button reports (0, 0), outside every rectangle.
 *
 * A click whose press and release land on different descendants is dispatched
 * to the dialog, which is also how the backdrop reports — so `@click.self`
 * would close the sheet at the end of any drag that crossed an element.
 */
let pressWasOutside = false

function fromNestedDialog(e: Event): boolean {
  const owner = (e.target as HTMLElement | null)?.closest?.('dialog')
  return !!owner && owner !== el.value
}

function onPressAnywhere(e: PointerEvent) {
  const d = el.value
  if (!d || fromNestedDialog(e)) {
    pressWasOutside = false
    return
  }
  const r = d.getBoundingClientRect()
  pressWasOutside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
}

function onBackdropClick(e: MouseEvent) {
  if (!props.dismissOnBackdrop || e.detail === 0 || fromNestedDialog(e)) return
  if (pressWasOutside && !dragging.value) {
    pressWasOutside = false
    emit('close')
  }
}

/* ── Swipe to dismiss ────────────────────────────────────────────────────
 *
 * Away from the screen only: down for a bottom sheet, right for a panel.
 * Dragging it further ON than it already is has no meaning and makes the
 * gesture feel loose.
 */
const drag = ref(0)
const dragging = ref(false)
let start = 0
let pending: number | null = null

/** 8px, which is a tap's wobble: below it a press is a press. */
const SLOP = 8

/**
 * Reduced motion turns the gesture OFF rather than making it instant.
 *
 * A sheet that leaves under the finger is motion the reader asked not to
 * have, and an instant one would dismiss on an 8px wobble. The close
 * controls are untouched, so nothing becomes unreachable.
 */
const reduced = ref(false)
onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
})
const swipeable = computed(() => props.swipe && !reduced.value && !props.variant.startsWith('dialog'))

const axis = (e: PointerEvent) => (isBottom.value ? e.clientY : e.clientX)

function onPointerDown(e: PointerEvent) {
  if (!swipeable.value) return
  // A stepper's own press is not a swipe.
  if ((e.target as HTMLElement).closest('button, input, a, select, textarea, label')) return
  start = axis(e)
  pending = e.pointerId
}

function onPointerMove(e: PointerEvent) {
  if (!swipeable.value) return
  if (pending !== null && !dragging.value && e.pointerId === pending && axis(e) - start > SLOP) {
    dragging.value = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  if (!dragging.value) return

  /*
   * A SCROLLED body wins. A downward drag that starts inside a list the
   * reader has scrolled is a scroll, not a dismiss — mark `[data-sheet-scroll]`
   * on the scroller to say so.
   *
   * `pending = null` as well, so the gesture is over rather than paused:
   * without it the next move re-reads the distance from the original press,
   * now well past the slop, and starts the drag again — and by then the
   * pointer is captured, so `e.target` is the dialog, this rule no longer
   * matches, and the sheet is thrown away on a gesture meant as a scroll.
   */
  if (isBottom.value) {
    const scroller = (e.target as HTMLElement).closest('[data-sheet-scroll]')
    if (scroller && scroller.scrollTop > 0) {
      pending = null
      dragging.value = false
      drag.value = 0
      return
    }
  }
  drag.value = Math.max(0, axis(e) - start)
}

function onPointerUp() {
  pending = null
  if (!dragging.value) return
  dragging.value = false
  if (drag.value > props.swipeThreshold) emit('close')
  else drag.value = 0
}

/**
 * A cancelled gesture snaps back; it never dismisses.
 *
 * Not the same as pointerup and it must not share the handler: on touch the
 * browser can claim a pan at any moment — that is what `pointercancel` IS —
 * and routing it through pointerup would read a 90px drag as a dismissal the
 * reader never completed.
 */
function onPointerCancel() {
  pending = null
  dragging.value = false
  drag.value = 0
}
</script>

<template>
  <dialog
    ref="el"
    class="m-0 bg-transparent p-0 backdrop:bg-scrim"
    :class="variant === 'panel'
      ? 'ml-auto h-full max-h-none w-full max-w-[420px] sm:w-[92vw]'
      : isPanel
        ? 'ml-auto h-full max-h-none w-[480px]'
        : (isBottom ? 'mt-auto w-full max-w-none' : 'm-auto w-full max-w-[min(92vw,420px)]')"
    :aria-label="title"
    :data-variant="isPanel ? 'panel' : variant"
    data-testid="gm-sheet"
    :style="drag ? { transform: isBottom ? `translateY(${drag}px)` : `translateX(${drag}px)` } : undefined"
    @close="emit('close')"
    @cancel.prevent="emit('close')"
    @pointerdown="onPointerDown"
    @pointerdown.capture="onPressAnywhere"
    @click="onBackdropClick"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <!-- A bottom sheet is capped 44px short of the top (board 15b's peek,
         v0.6.9): the dimmed page shows above it, and the BODY scrolls inside
         a fixed header and footer. Without the cap a tall sheet took the
         dialog's user-agent max-height (100% − 2em − 6px) and scrolled as a
         whole — the close went with the content, and the swipe, which reads
         the body's scroll, could not tell a scroll from a dismissal.
         `adaptive` also draws its edge, as the app's sheet always did: a 1px
         rule on top as a sheet, 2px on the left as the 1200+ panel.
         A panel is full height, so on a phone its top IS the status bar: it
         pads by the safe-area inset (v0.6.10), or its title sits under the
         clock and the Dynamic Island and its close on the battery. Zero on the
         web and on a desktop panel. -->
    <div
      class="flex flex-col bg-raised text-ink"
      :class="[
        isPanel ? 'h-full rounded-none pt-[env(safe-area-inset-top,0px)]' : (isBottom ? 'max-h-[calc(100dvh-44px-env(safe-area-inset-top,0px))] rounded-t-sheet' : 'rounded-sheet'),
        variant === 'adaptive' && (isPanel ? 'border-l-2 border-[var(--gm-line)]' : 'border-t border-[var(--gm-line)]'),
        dragging ? '' : 'transition-transform duration-200 motion-reduce:transition-none',
      ]"
    >
      <!-- The grab handle says "this drags", and only a draggable sheet has
           one: a panel is dismissed from its edge, and a dialog is not
           dismissed by a gesture at all. -->
      <div
        v-if="grab && isBottom && swipeable"
        aria-hidden="true"
        class="mx-auto mt-3 mb-3 h-1 w-9 shrink-0 rounded-pill bg-track"
        data-testid="gm-sheet-grab"
      />

      <!-- A header that does not scroll (v0.6.3): a title bar, or a close
           button pinned to the corner. `relative` so a corner control can be
           placed against it. -->
      <div v-if="$slots.header" class="relative shrink-0" data-testid="gm-sheet-header">
        <slot name="header" />
      </div>

      <!-- The body scrolls; the footer does not. `data-sheet-scroll` is the
           seam the swipe reads to tell a scroll from a dismissal. -->
      <div
        class="min-h-0 flex-1 overflow-y-auto"
        :class="inset ? ['px-4', $slots.footer ? 'pb-3' : 'pb-7', isBottom && !swipeable ? 'pt-4' : 'pt-1'] : ''"
        data-sheet-scroll
      >
        <slot />
      </div>

      <!-- The footer reserves the home indicator itself: a sheet's last
           control sitting on the gesture bar is the one place 28px of padding
           is not a style choice. `sticky`, not `fixed`: it belongs to the
           sheet, and a fixed element inside a dialog in the top layer is
           positioned against the viewport, which is how a footer ends up
           behind a keyboard. -->
      <!-- `inset` covers the footer too (v0.6.8): a consumer that brings the
           body's padding brings the footer's — its rule, gap and home-indicator
           inset — so moving an app sheet with a footer onto the shell moves no
           pixel. With `inset` on, nothing changes. -->
      <div
        v-if="$slots.footer"
        class="sticky bottom-0 z-10 flex shrink-0 flex-col bg-raised"
        :class="inset && 'gap-2 border-t border-line px-4 pt-3'"
        :style="inset ? { paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' } : undefined"
        data-testid="gm-sheet-footer"
      >
        <slot name="footer" />
      </div>
    </div>
  </dialog>
</template>
