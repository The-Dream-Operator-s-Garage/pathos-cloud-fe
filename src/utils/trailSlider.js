// ── THE FOOTER TRAIL AS A SLIDER — its geometry, in ONE place ─────────────
//
// (2026-08-30, user ask: "transform the frieze bar … into a horizontal
// sliding bar … grab a button and move it horizontally across the footer.
// When I'm blocked by another button, then I shouldn't be able to move
// forward"; ⭐ 2026-09-26, user ask: the stack and pins strips too — "on
// desktop mode, add them the '::' icon and make them draggable across the
// footer bar, like the creation buttons there".)
//
// Until 2026-09-26 all of this lived in NavigationBar.vue, which owns the
// five chips and clamped them against two FIXED flanks: the parked stack
// strip at the left run, the parked pins strip at the right. The strips are
// MOVABLE BODIES of the same slider now. They are mounted by MainLayout, not
// by the bar, and their grips stand in their own templates, so the
// measuring, the clamping and the reconciling moved out here where all three
// components that carry a grip can reach them. The STATE — one px offset per
// movable — stays in the windows store (`trailOffsets`, `trailShiftOf`,
// `setTrailOffset`, `persistTrail`), where every dock already reads its own
// key into `--trail-shift` so the window a chip opens rides along.
//
// THE MODEL, unchanged from the slider pass:
//   · a movable is `translate`d off its FLOW SEAT — the grid never reflows,
//     the neighbours never move;
//   · a gesture is clamped ONCE at pointer-down against every other movable
//     and the two walls, so it blocks at contact and a fast pointer cannot
//     tunnel through a body between two move events; nothing pushes, nothing
//     reorders;
//   · the WALLS are the bar's two end cells — the identity section's closing
//     hairline and the dashboard block's opening one — the only things on
//     the bar that never move (the strips were walls too until this day);
//   · a body already overlapping another (a stale persisted state) is no
//     wall: the drag is exactly how the user frees it, and `reconcileTrail`
//     shoves the rest back to legality after mount / resize / a strip
//     changing size.
import { useWindowsStore, TRAIL_CHIPS } from 'src/stores/windows'

// The five chips register their elements (NavigationBar's `:ref`); the two
// strips are found by selector — each is ONE element with two faces, and
// only the PARKED face is a body on the bar (the hover-expanded panel is a
// transient overlay that is neither dragged nor allowed to shove anything).
// (The STACK strip was one until 2026-09-30, when it moved up into the
// header rail beside Back — no grip, no slider there.)
const STRIP_SELECTORS = { pins: '.pins-window.is-parked' }
const chipEls = {}

// Every body the slider knows, in the bar's own left-to-right order.
export const TRAIL_MOVABLES = [...TRAIL_CHIPS, 'pins']

export function setTrailChip (key, el) { chipEls[key] = el || null }

export function trailEl (key) {
  if (key in STRIP_SELECTORS) return document.querySelector(STRIP_SELECTORS[key])
  return chipEls[key] || null
}

// A movable's PAINTED box (translate included), or null when it is not a
// body right now — an unmounted chip, an expanded strip, a zero-width cell.
function rectOf (key) {
  const el = trailEl(key)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return r.width > 0 ? r : null
}

// The slider's two walls, measured live rather than read off `--nav-id-w` /
// `--nav-dash-w` so the media overrides follow for free. LEFT: the identity
// section's closing hairline (its box's right edge — 2026-08-31, when it
// replaced the burger's 42px rail slot). RIGHT: the dashboard block's opening
// hairline (`.nav-end`'s left edge — 2026-09-02, when the dashboard chip
// became the bar's full-height end block); else the tack's divider on a
// phone, else the cluster's content edge.
export function trailBounds () {
  let left = 42
  const idSection = document.querySelector('.nav-bar .nav-left')
  if (idSection) {
    const r = idSection.getBoundingClientRect()
    if (r.width > 0) left = Math.max(left, r.right)
  }
  let right = window.innerWidth
  const end = document.querySelector('.nav-bar .nav-end')
  const divider = document.querySelector('.nav-bar .nav-divider')
  if (end && end.getBoundingClientRect().width > 0) {
    right = end.getBoundingClientRect().left
  } else if (divider) {
    right = divider.getBoundingClientRect().left
  } else {
    const nr = document.querySelector('.nav-bar .nav-right')
    if (nr) right = nr.getBoundingClientRect().right - parseFloat(getComputedStyle(nr).paddingRight || '0')
  }
  return { left, right }
}

// Start dragging one body by its grip. `e` is the grip's pointerdown; the
// grip is `e.currentTarget`. Returns false when there is nothing to drag (a
// phone, an unmounted body).
export function startTrailDrag (key, e) {
  const windows = useWindowsStore()
  if (windows.isMobile) return false
  const el = trailEl(key)
  if (!el) return false
  e.preventDefault()
  e.stopPropagation()
  const grip = e.currentTarget
  // Capture retargets every later pointer event — and the trailing click —
  // onto the grip, whose @click.stop swallows it: releasing a drag over the
  // body must not toggle its window, and while captured the body under the
  // pointer is the grip, so a strip's hover-expand never fires mid-drag.
  try { grip.setPointerCapture(e.pointerId) } catch (_) { /* older engines — the listeners below still work */ }
  const startX = e.clientX
  const startOffset = windows.trailShiftOf(key)
  const rect = el.getBoundingClientRect()
  const bounds = trailBounds()
  // Clamp the WHOLE GESTURE once, at pointer-down: the other bodies and the
  // two walls do not move during this drag, so a min/max pair per direction
  // blocks at contact and a fast pointer cannot tunnel.
  let minD = bounds.left - rect.left
  let maxD = bounds.right - rect.right
  for (const k of TRAIL_MOVABLES) {
    if (k === key) continue
    const o = rectOf(k)
    if (!o) continue
    if (o.left >= rect.right) maxD = Math.min(maxD, o.left - rect.right)
    else if (o.right <= rect.left) minD = Math.max(minD, o.right - rect.left)
    // A body already overlapping (a stale persisted state) is no wall — the
    // drag is exactly how the user frees it.
  }
  const move = (ev) => {
    const d = Math.min(Math.max(ev.clientX - startX, minD), maxD)
    windows.setTrailOffset(key, startOffset + d)
  }
  const up = () => {
    grip.removeEventListener('pointermove', move)
    grip.removeEventListener('pointerup', up)
    grip.removeEventListener('pointercancel', up)
    windows.persistTrail()
  }
  grip.addEventListener('pointermove', move)
  grip.addEventListener('pointerup', up)
  grip.addEventListener('pointercancel', up)
  return true
}

// Persisted offsets were measured against SOME OTHER layout — another
// viewport width, another word gate, another strip width. Reconcile walks
// the bodies in visual order and shoves any that landed out of bounds or
// into each other back to legality: one left-to-right pass off the left
// wall, one right-to-left pass off the right. Returns whether anything
// moved (it persists when so). NavigationBar calls it after mount, on
// resize and whenever a parked strip changes size; on a phone there is no
// slider and nothing to reconcile.
export function reconcileTrail () {
  const windows = useWindowsStore()
  if (windows.isMobile) return false
  const bounds = trailBounds()
  const entries = TRAIL_MOVABLES
    .map((k) => {
      const r = rectOf(k)
      return r ? { k, left: r.left, right: r.right } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.left - b.left)
  let moved = false
  let edge = bounds.left
  for (const it of entries) {
    if (it.left < edge - 0.5) {
      const d = edge - it.left
      windows.setTrailOffset(it.k, windows.trailShiftOf(it.k) + d)
      it.left += d
      it.right += d
      moved = true
    }
    edge = it.right
  }
  edge = bounds.right
  for (let i = entries.length - 1; i >= 0; i--) {
    const it = entries[i]
    if (it.right > edge + 0.5) {
      const d = it.right - edge
      windows.setTrailOffset(it.k, windows.trailShiftOf(it.k) - d)
      it.left -= d
      it.right -= d
      moved = true
    }
    edge = it.left
  }
  if (moved) windows.persistTrail()
  return moved
}
