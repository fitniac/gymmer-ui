<script setup lang="ts">
/**
 * The bottom sheet and the dialog — one shell, because they differ by edge.
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
 * floats and rounds all four. Everything else — the scrim, the padding, the
 * grab handle's absence on a dialog — follows from that one fact.
 */
const props = withDefaults(defineProps<{
  open?: boolean
  variant?: 'sheet' | 'dialog'
  /** Spoken name. A sheet with no title needs one anyway. */
  title?: string
}>(), { open: false, variant: 'sheet', title: undefined })

const emit = defineEmits<{ close: [] }>()

const el = ref<HTMLDialogElement | null>(null)

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
}

watch(() => props.open, sync)
onMounted(sync)
</script>

<template>
  <dialog
    ref="el"
    class="m-0 w-full max-w-none bg-transparent p-0 backdrop:bg-scrim"
    :class="variant === 'sheet' ? 'mt-auto' : 'm-auto max-w-[min(92vw,420px)]'"
    :aria-label="title"
    :data-variant="variant"
    data-testid="gm-sheet"
    @close="emit('close')"
    @cancel.prevent="emit('close')"
  >
    <div
      class="bg-raised px-4 pt-3 pb-7 text-ink"
      :class="variant === 'sheet' ? 'rounded-t-sheet' : 'rounded-sheet'"
    >
      <!-- The grab handle says "this drags", and only a sheet does. -->
      <div
        v-if="variant === 'sheet'"
        aria-hidden="true"
        class="mx-auto mb-3 h-1 w-9 rounded-pill bg-track"
        data-testid="gm-sheet-grab"
      />
      <slot />
    </div>
  </dialog>
</template>
