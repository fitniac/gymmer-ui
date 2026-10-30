/**
 * Who owns a press inside a bottom sheet: the control under the thumb, or the
 * sheet itself.
 *
 * A bottom sheet is dismissed by dragging it down. Until v0.7.2 a press that
 * landed on `button, input, a, select, textarea, label` could never become
 * that drag — the gesture was abandoned at pointerdown to protect a stepper's
 * own press. On a real sheet that is almost the whole surface: the "Start a
 * workout" sheet is a `<button>` card, a `<NuxtLink>` row and a `<button>`
 * row, so the only places a downward drag worked were the 36px grab handle
 * and the gaps between controls. Reported from a device as "bottom drawers are
 * not draggable down to cancel", which is exactly right.
 *
 * iOS is the reference, because that is the expectation people arrive with: a
 * pan that starts on a button DOES move the sheet, and the button simply loses
 * its highlight once the finger has travelled far enough to be a drag. The tap
 * is protected by the slop distance, not by refusing the gesture.
 *
 * So the rule inverts. A press may become a drag ANYWHERE, except on the few
 * elements whose own gesture runs along an axis of their own and would fight
 * it. Those are listed here rather than in the component so the policy is one
 * readable thing with tests on it.
 */

/**
 * Elements that keep a press for themselves.
 *
 * - `[data-no-sheet-drag]` — the explicit opt-out, for a sortable list, a
 *   carousel, a custom slider: anything that pans on its own.
 * - `input[type=range]` — a slider's thumb is dragged; on a right-hand panel
 *   that is the same axis the panel dismisses on.
 * - `textarea`, `select`, `[contenteditable]` — a drag here is a selection or
 *   a native picker, both of which the user means literally.
 *
 * Text-entry `input`s are excluded too, by `isTextEntry` below, because their
 * type has to be read rather than matched: `input` with no type is text, and
 * `input[type=checkbox]` is not.
 */
export const SHEET_DRAG_EXEMPT = [
  '[data-no-sheet-drag]',
  'input[type=range]',
  'textarea',
  'select',
  '[contenteditable]',
].join(', ')

/** Input types whose own drag is a caret or a selection. */
const TEXT_ENTRY = new Set([
  'text', 'search', 'email', 'password', 'tel', 'url', 'number', 'date',
  'datetime-local', 'month', 'week', 'time',
])

/** `<input>` with no type is a text field; `<input type=checkbox>` is not. */
export function isTextEntry(type: string | null | undefined): boolean {
  return type == null || type === '' || TEXT_ENTRY.has(type.toLowerCase())
}

type Hit = Pick<Element, 'closest'> & { getAttribute(name: string): string | null }

/**
 * Whether a press on `target` may begin a drag that dismisses the sheet.
 *
 * `swipeable` is the component's own gate (the `swipe` prop, the variant).
 * Everything else is about what sits under the finger.
 */
export function pressMayDrag(target: Hit | null | undefined, swipeable: boolean): boolean {
  if (!swipeable || !target || typeof target.closest !== 'function') return false
  if (target.closest(SHEET_DRAG_EXEMPT)) return false
  const input = target.closest('input')
  if (input && isTextEntry((input as Hit).getAttribute('type'))) return false
  return true
}
