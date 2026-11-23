<script setup lang="ts" generic="T extends { id: string }">
/**
 * A list whose rows can be put in a different order — board `Program`'s
 * exercises, each row ending in a ≡ handle.
 *
 * Two ways to move a row, and the second is not optional:
 *
 *   drag      press the handle and move — mouse, pen or finger. Only the
 *             handle starts a drag, so the rest of the row stays free for its
 *             own taps (the exercise sheet, the set editor)
 *   keyboard  focus the handle; ↑ / ↓ move the row one place. The new
 *             position is spoken through a polite live region, and focus
 *             stays on the moved row's handle so the next arrow continues
 *
 * The program editor chose up/down buttons over drag precisely because a
 * drag-only list cannot be used without a pointer; this keeps the board's
 * handle and that guarantee (ruled 2026-10-13: drag + arrow keys).
 *
 * The list does not reorder itself. It emits `reorder` with the ids in their
 * new order and renders whatever `items` it is given — the caller owns the
 * data, and a save that fails puts the old order back by not changing it.
 *
 * Every string is the caller's, because the layer has no translations:
 * `handleLabel(item)` names each handle ("Reorder Bench Press"), `hint`
 * says how to use it, `announce(item, position, total)` is what is spoken.
 */
import { computed, nextTick, ref, useId } from 'vue'

const props = defineProps<{
  items: readonly T[]
  handleLabel: (item: T) => string
  announce: (item: T, position: number, total: number) => string
  /** "Press the arrow keys to move" — read with each handle. */
  hint: string
  disabled?: boolean
}>()

const emit = defineEmits<{ reorder: [ids: string[]] }>()

defineSlots<{ default: (p: { item: T, index: number }) => unknown }>()

const list = ref<HTMLElement | null>(null)
const spoken = ref('')
const hintId = useId()

function move(from: number, to: number) {
  if (to < 0 || to >= props.items.length || from === to) return
  const ids = props.items.map(i => i.id)
  const [id] = ids.splice(from, 1)
  ids.splice(to, 0, id!)
  emit('reorder', ids)
  spoken.value = props.announce(props.items[from]!, to + 1, ids.length)
  void nextTick(() => list.value?.querySelector<HTMLElement>(`[data-handle="${CSS.escape(id!)}"]`)?.focus())
}

function onKeydown(e: KeyboardEvent, index: number) {
  if (props.disabled) return
  if (e.key === 'ArrowUp') { e.preventDefault(); move(index, index - 1) }
  else if (e.key === 'ArrowDown') { e.preventDefault(); move(index, index + 1) }
}

/**
 * The drag. Rows are measured once, at the press; the dragged row follows
 * the pointer by `transform` (no layout during the move), and the drop
 * position is how many of the OTHER rows' midpoints lie above the dragged
 * row's own — the order a reader would see if the rows closed up behind it.
 */
const drag = ref<{ index: number, startY: number, dy: number, mids: number[], ownMid: number, ownH: number } | null>(null)

function onPointerDown(e: PointerEvent, index: number) {
  if (props.disabled || e.button > 0 || !list.value) return
  const rows = Array.from(list.value.querySelectorAll<HTMLElement>(':scope > [data-sortable-row]'))
  const mids = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top + b.height / 2 })
  // How far the rows behind this one close up when it leaves: its own height
  // plus the list's gap. Taken from the row rather than from the pitch between
  // midpoints, because a list whose rows differ in height has no single pitch.
  const gap = Number.parseFloat(getComputedStyle(list.value).rowGap) || 0
  const ownH = rows[index]!.getBoundingClientRect().height + gap
  drag.value = { index, startY: e.clientY, dy: 0, mids, ownMid: mids[index]!, ownH }
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (drag.value) drag.value.dy = e.clientY - drag.value.startY
}

/**
 * Where the row would land if released now.
 *
 * ONE definition, read by the preview below and by the drop. It used to be
 * computed only on release, and that is the whole of what was wrong here: the
 * arithmetic was correct and invisible. Nothing moved under the finger, the
 * commit threshold is half a row away, and a drag shorter than that left the
 * list unchanged — so a lifter dragging an exercise saw a correct answer and
 * read it as a dead control. Filed against build 14 as "Drag position for
 * exercise not working"; measured on 2026-11-23, where two drags ending ~10 px
 * short of the next midpoint each moved one place, exactly as this formula
 * says they should.
 *
 * Computing it twice is how a preview begins to lie: the two copies drift and
 * the row lands somewhere the gap never showed.
 */
const dropIndex = computed(() => {
  const d = drag.value
  if (!d) return null
  const centre = d.ownMid + d.dy
  return d.mids.filter((m, i) => i !== d.index && m < centre).length
})

/**
 * How far row `i` steps aside to open the gap, in px.
 *
 * The rows between the row's origin and its destination move by exactly the
 * dragged row's footprint — the same distance they will really move when the
 * list closes up — so the preview is the outcome rather than a hint at it.
 */
function shiftFor(i: number): number {
  const d = drag.value
  const to = dropIndex.value
  if (!d || to === null || i === d.index) return 0
  if (to > d.index && i > d.index && i <= to) return -d.ownH
  if (to < d.index && i >= to && i < d.index) return d.ownH
  return 0
}

function onPointerUp() {
  const d = drag.value
  const to = dropIndex.value
  drag.value = null
  if (!d || to === null || Math.abs(d.dy) < 4) return
  move(d.index, to)
}
</script>

<template>
  <ol ref="list" class="m-0 grid list-none gap-2 p-0" data-testid="gm-sortable">
    <li
      v-for="(item, i) in items"
      :key="item.id"
      data-sortable-row
      class="relative flex items-center gap-2"
      :class="drag && drag.index !== i ? 'transition-transform duration-150 motion-reduce:transition-none' : undefined"
      :style="drag?.index === i
        ? { transform: `translateY(${drag.dy}px)`, zIndex: 1 }
        : (shiftFor(i) ? { transform: `translateY(${shiftFor(i)}px)` } : undefined)"
      :data-dragging="drag?.index === i || undefined"
    >
      <div class="min-w-0 flex-1">
        <slot :item="item" :index="i" />
      </div>
      <button
        type="button"
        class="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-ctl bg-transparent text-muted disabled:cursor-not-allowed disabled:opacity-40"
        :aria-label="handleLabel(item)"
        :aria-describedby="hintId"
        :disabled="disabled || undefined"
        :data-handle="item.id"
        data-testid="gm-sortable-handle"
        @keydown="onKeydown($event, i)"
        @pointerdown="onPointerDown($event, i)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="drag = null"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M4 8h16M4 12h16M4 16h16" />
        </svg>
      </button>
    </li>
  </ol>
  <!-- Visually hidden by inline style, not a utility class: this layer owns no
       Tailwind (see GmLogo). -->
  <span :id="hintId" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">{{ hint }}</span>
  <span aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap" data-testid="gm-sortable-live">{{ spoken }}</span>
</template>
