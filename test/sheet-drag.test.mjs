/**
 * A press on a control may still drag the sheet away.
 *
 * The defect this guards: until v0.7.2 `onPointerDown` abandoned the gesture
 * whenever the press landed on `button, input, a, select, textarea, label`.
 * On the "Start a workout" sheet that is a button card, a link row and a
 * button row — nearly the entire surface — so a downward drag worked only on
 * the grab handle and in the gaps, and the sheet read as undismissable by
 * drag. Reported from a device, 2026-10-30.
 *
 * These assert the POLICY, which is the part that was wrong. The selector
 * matcher below is a stub: it understands the handful of selector shapes this
 * module uses and nothing else, so it can catch a typo in the exempt list but
 * it is not a browser. The gesture end to end is a device check.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isTextEntry, pressMayDrag, SHEET_DRAG_EXEMPT } from '../app/utils/sheetDrag.ts'

/**
 * A stand-in for an element with ancestors.
 *
 * `chain` is innermost-first. `closest` walks it and matches `tag`,
 * `[attr]`, `[attr=value]` and `tag[attr=value]` — enough for this module's
 * selectors, deliberately no more.
 */
function hit(...chain) {
  const matchOne = (node, sel) => {
    const s = sel.trim()
    const m = s.match(/^([a-z]*)(?:\[([a-z-]+)(?:=([^\]]+))?\])?$/i)
    if (!m) throw new Error(`stub matcher cannot parse selector: ${s}`)
    const [, tag, attr, value] = m
    if (tag && node.tag !== tag) return false
    if (attr) {
      const got = node.attrs?.[attr]
      if (got === undefined) return false
      if (value !== undefined && got !== value) return false
    }
    return true
  }
  const self = {
    tag: chain[0].tag,
    attrs: chain[0].attrs ?? {},
    getAttribute: name => chain[0].attrs?.[name] ?? null,
    closest(selector) {
      const parts = selector.split(',')
      for (const node of chain) {
        for (const part of parts) {
          if (matchOne(node, part)) {
            return { ...node, getAttribute: n => node.attrs?.[n] ?? null }
          }
        }
      }
      return null
    },
  }
  return self
}

const el = (tag, attrs) => ({ tag, attrs })

describe('a press that may become a dismiss drag', () => {
  // The regression itself. Each of these was refused before v0.7.2, and each
  // is most of the surface of a real sheet.
  it('allows the controls a sheet is actually made of', () => {
    for (const node of [el('button'), el('a', { href: '/x' }), el('label'), el('div')]) {
      assert.equal(pressMayDrag(hit(node), true), true, `${node.tag} should be draggable`)
    }
  })

  it('allows a press on a button nested inside the sheet body', () => {
    assert.equal(pressMayDrag(hit(el('span'), el('button'), el('div')), true), true)
  })

  it('leaves the press to elements that pan on their own', () => {
    assert.equal(pressMayDrag(hit(el('input', { type: 'range' })), true), false)
    assert.equal(pressMayDrag(hit(el('textarea')), true), false)
    assert.equal(pressMayDrag(hit(el('select')), true), false)
  })

  it('honours the explicit opt-out, from a descendant too', () => {
    assert.equal(pressMayDrag(hit(el('div', { 'data-no-sheet-drag': '' })), true), false)
    assert.equal(
      pressMayDrag(hit(el('span'), el('div', { 'data-no-sheet-drag': '' })), true),
      false,
      'a child of an opted-out container is opted out',
    )
  })

  it('leaves text entry alone but not the box-shaped inputs', () => {
    assert.equal(pressMayDrag(hit(el('input', { type: 'text' })), true), false)
    assert.equal(pressMayDrag(hit(el('input', {})), true), false, 'no type is a text field')
    assert.equal(pressMayDrag(hit(el('input', { type: 'checkbox' })), true), true)
    assert.equal(pressMayDrag(hit(el('input', { type: 'submit' })), true), true)
  })

  it('refuses everything when the sheet is not swipeable', () => {
    assert.equal(pressMayDrag(hit(el('div')), false), false)
  })

  it('refuses a target that cannot be asked', () => {
    assert.equal(pressMayDrag(null, true), false)
    assert.equal(pressMayDrag({}, true), false)
  })
})

describe('isTextEntry', () => {
  it('treats a missing type as text, because the browser does', () => {
    assert.equal(isTextEntry(null), true)
    assert.equal(isTextEntry(''), true)
    assert.equal(isTextEntry('TEXT'), true)
  })
  it('does not claim the box-shaped inputs', () => {
    for (const t of ['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'color']) {
      assert.equal(isTextEntry(t), false, t)
    }
  })
})

describe('the exempt list', () => {
  it('names the opt-out hook the components document', () => {
    assert.match(SHEET_DRAG_EXEMPT, /\[data-no-sheet-drag\]/)
  })
  it('does not exempt button, a or label — that was the defect', () => {
    for (const bad of ['button', 'a', 'label']) {
      assert.doesNotMatch(SHEET_DRAG_EXEMPT, new RegExp(`(^|[\\s,])${bad}([\\s,[]|$)`), bad)
    }
  })
})
