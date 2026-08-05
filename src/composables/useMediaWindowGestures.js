// Drag + proportional resize for one floating media viewer
// (docs/plans/floating-media-viewer.md). ONE Pointer-Events listener set
// covers mouse and touch: pointerdown on the bar (move) or on a rim
// handle (resize) captures the pointer, every move writes the clamped
// rect straight through the store — a single reactive object per frame,
// so the geometry keeps one source of truth and Vue stays comfortably
// ahead of the pointer — and release / cancel / unmount all funnel into
// one teardown. The hygiene is BottomSplitter's, restated for Pointer
// Events: body userSelect + cursor parked for the gesture and restored
// after, listeners removed on release AND onBeforeUnmount, and the
// gesture-state classes the shell wears kill its CSS transitions so the
// window tracks the pointer 1:1 instead of rubber-banding after it.
import { ref, onBeforeUnmount } from 'vue'
import { clampRect, minSize, chromeOf } from 'src/utils/mediaFit'

// The eight rim handles — edges first, then corners. The letters are
// compass directions: they double as the shell's class suffixes, and the
// anchor arithmetic below reads them for which edges move.
export const HANDLES = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']

// Directional cursors per handle — the hover affordance (CSS mirrors
// these) and the body cursor held for the whole gesture, so the arrow
// survives the pointer outrunning the thin strip mid-drag.
const CURSORS = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize'
}

// The region every gesture is clamped to is `roam` — the WHOLE viewport
// (useMediaArena), not the spawn arena. A window is composed into the
// docks' half when it is born and free to be dragged anywhere after,
// which is why this composable never sees the arena at all.
export function useMediaWindowGestures ({ viewer, store, roam, measure, friezeH }) {
  const dragging = ref(false) // bar drag in progress
  const resizing = ref(null) // the active handle letter while a resize runs

  // Gesture scratch — plain locals, not refs: nothing renders off these,
  // they only carry state from pointerdown to pointerup.
  let pid = null // the captured pointerId
  let capEl = null // the capturing element (bar or handle)
  let origin = null // pointer position at gesture start
  let base = null // window rect at gesture start, pre-clamped
  let mode = null // 'move' | a HANDLES letter
  let mins = null // proportional shrink floor for this gesture
  let ratio = 16 / 9

  // The proportional law: window HEIGHT is an affine function of window
  // WIDTH — the media keeps `ratio` while the chrome adds constants on
  // both axes. Derived from the one point mediaFit exports (minSize)
  // plus the slope, instead of restating its chrome arithmetic here: a
  // rewrite of the fit engine's internals moves the point and these two
  // maps follow for free.
  const hOf = (w) => Math.round(mins.h + (w - mins.w) / ratio)
  const wOf = (h) => Math.round(mins.w + (h - mins.h) * ratio)

  const begin = (e, m) => {
    if (pid != null) return false // one gesture at a time (second touch)
    const v = viewer.value
    if (!v || !v.rect || v.maximized) return false
    if (e.button != null && e.button !== 0) return false // primary only
    // Re-measure the bands and pull a stale rect back inside BEFORE any
    // anchor is read off it — the viewport may have shrunk since the last
    // gesture (orientation flip, a plain window resize).
    measure()
    base = clampRect(v.rect, roam.value)
    if (base.x !== v.rect.x || base.y !== v.rect.y ||
      base.w !== v.rect.w || base.h !== v.rect.h) store.setRect(v.id, base)
    ratio = (v.natural?.w > 0 && v.natural?.h > 0)
      ? v.natural.w / v.natural.h
      : 16 / 9
    mins = minSize(v.natural, chromeOf(friezeH.value))
    mode = m
    origin = { x: e.clientX, y: e.clientY }
    pid = e.pointerId
    capEl = e.currentTarget
    try { capEl.setPointerCapture(pid) } catch (err) { /* capture is best-effort */ }
    capEl.addEventListener('pointermove', onMove)
    capEl.addEventListener('pointerup', end)
    capEl.addEventListener('pointercancel', end)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = m === 'move' ? 'grabbing' : CURSORS[m]
    e.preventDefault()
    return true
  }

  // Proportional resize: the handle's opposite edge/corner is the ANCHOR
  // (it stays put), the pointer drives one axis — the edge's own axis,
  // or whichever delta dominates on a corner — and the other axis
  // follows the media ratio. Ceilings are anchor-relative: each axis may
  // only grow until its moving edge meets the region, so a drag past the
  // boundary pins at the farthest legal size; the floor is minSize (the
  // header-shrink limit). clampRect stays the final gate for the ±1px
  // the rounding can leak. The region is `roam` for the same reason drag
  // uses it — and not only for symmetry: an arena-clamped resize of a
  // window parked OUTSIDE the arena would compute a negative ceiling and
  // clampRect would then teleport the window back into the right half.
  const resized = (dx, dy, a) => {
    const north = mode.includes('n')
    const south = mode.includes('s')
    const east = mode.includes('e')
    const west = mode.includes('w')
    const right = base.x + base.w
    const bottom = base.y + base.h
    const wCand = east ? base.w + dx : west ? base.w - dx : null
    const hCand = south ? base.h + dy : north ? base.h - dy : null
    let w
    if (wCand != null && hCand != null) {
      w = Math.abs(dx) >= Math.abs(dy) ? wCand : wOf(hCand)
    } else {
      w = wCand != null ? wCand : wOf(hCand)
    }
    const maxW = west ? right - a.x : a.x + a.w - base.x
    const maxH = north ? bottom - a.y : a.y + a.h - base.y
    w = Math.max(mins.w, Math.min(w, maxW, wOf(maxH)))
    const h = hOf(w)
    return clampRect({
      x: west ? right - w : base.x,
      y: north ? bottom - h : base.y,
      w,
      h
    }, a)
  }

  const onMove = (e) => {
    if (e.pointerId !== pid) return
    const v = viewer.value
    // The green light can flip mid-gesture (a second pointer): a
    // maximized window has no rect to drag, so the gesture aborts.
    if (!v || v.maximized) { end(e); return }
    const a = roam.value
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    if (mode === 'move') {
      store.setRect(v.id, clampRect(
        { x: base.x + dx, y: base.y + dy, w: base.w, h: base.h }, a))
    } else {
      store.setRect(v.id, resized(dx, dy, a))
    }
  }

  const end = (e) => {
    if (e && pid != null && e.pointerId !== pid) return
    teardown()
  }

  // Release AND unmount funnel here — a window can die mid-gesture (the
  // red light takes a second pointer, a route change unmounts the host)
  // and the document must come back exactly as found. Idempotent.
  const teardown = () => {
    if (capEl) {
      capEl.removeEventListener('pointermove', onMove)
      capEl.removeEventListener('pointerup', end)
      capEl.removeEventListener('pointercancel', end)
      try { capEl.releasePointerCapture(pid) } catch (err) { /* pointer already gone */ }
    }
    capEl = null
    pid = null
    mode = null
    dragging.value = false
    resizing.value = null
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  onBeforeUnmount(teardown)

  // The bar: its free areas move the window; the lights and the share
  // button own their taps (closest(), so a press landing on the q-icon
  // inside a button counts as the button).
  const onBarPointerDown = (e) => {
    if (e.target.closest('button')) return
    if (begin(e, 'move')) dragging.value = true
  }

  const onHandlePointerDown = (e, h) => {
    if (begin(e, h)) resizing.value = h
  }

  return { HANDLES, dragging, resizing, onBarPointerDown, onHandlePointerDown }
}
