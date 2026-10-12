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
//   · a gesture is clamped against the two walls only; ⭐ since 2026-10-12
//     bodies PASS THROUGH each other — the others re-seat around the dragged
//     one (see `startTrailDrag`), so the order is the user's to change;
//   · the WALLS are the bar's two end cells — the identity section's closing
//     hairline and the dashboard block's opening one — the only things on
//     the bar that never move (the strips were walls too until this day);
//   · a body already overlapping another (a stale persisted state) is no
//     wall: the drag is exactly how the user frees it, and `reconcileTrail`
//     shoves the rest back to legality after mount / resize / a strip
//     changing size.
import { useWindowsStore, TRAIL_CHIPS } from 'src/stores/windows'

// The chips (and, since 2026-10-12, the nav hub — key `hub`) register their elements (NavigationBar's `:ref`); the two
// strips are found by selector — each is ONE element with two faces, and
// only the PARKED face is a body on the bar (the hover-expanded panel is a
// transient overlay that is neither dragged nor allowed to shove anything).
// (The STACK strip was one until 2026-09-30, when it moved up into the
// header rail beside Back — no grip, no slider there.)
const STRIP_SELECTORS = { pins: '.pins-window.is-parked' }
const chipEls = {}

// Every body the slider knows, in the bar's own left-to-right order.
export const TRAIL_MOVABLES = [...TRAIL_CHIPS, 'pins']

// The daylight a body keeps from its neighbour when the drag re-seats it —
// `.nav-right`'s own flex gap, so a re-seated row reads like the flow one.
const TRAIL_GAP = 6

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

// ⭐ A DRAG SESSION (2026-10-12) — the slider's move, separated from the
// pointer that drives it, so a chip's grip AND its window's head bar can walk
// the same body (user ask: "if i drag a window across the footer nav bar,
// its button should be moving along with it"). `beginTrailMove(key)`
// snapshots the bar; `moveBy(dx)` lays the row out for the dragged body `dx`
// px off its pointer-down seat and returns the dx it could actually take
// (the walls hold it); `end()` persists. Null on a phone / unmounted body.
export function beginTrailMove (key) {
  const windows = useWindowsStore()
  if (windows.isMobile) return null
  const el = trailEl(key)
  if (!el) return null
  const startOffset = windows.trailShiftOf(key)
  const rect = el.getBoundingClientRect()
  if (!rect.width) return null
  const bounds = trailBounds()
  // ⭐ BODIES PASS THROUGH EACH OTHER (2026-10-12, user ask: "make sure i can
  // drag the draggable items behind each other so they should not stop when
  // i drag one across another. they just re-accommodate on the other
  // side"). Only the dragged body is held by the walls; on every move the
  // OTHERS are laid out around it from their pointer-down seats: a body
  // whose centre the dragged one's centre has crossed re-seats on the far
  // side, one touched without being crossed is nudged aside — or, on a row
  // packed wall to wall, slides BEHIND the dragged one until it is crossed —
  // and every body returns to its own seat when the drag moves away again.
  // Each layout is computed from the snapshot, never from the last frame, so
  // a fast pointer cannot tunnel or strand a body mid-shove.
  const others = TRAIL_MOVABLES
    .filter((k) => k !== key)
    .map((k) => {
      const r = rectOf(k)
      return r ? { k, left: r.left, width: r.width, off: windows.trailShiftOf(k) } : null
    })
    .filter(Boolean)
  const w = rect.width
  const layout = (x) => {
    const mid = x + w / 2
    const lefts = others.filter((o) => o.left + o.width / 2 < mid).sort((a, b) => b.left - a.left)
    const rights = others.filter((o) => o.left + o.width / 2 >= mid).sort((a, b) => a.left - b.left)
    return { lefts, rights }
  }
  const moveBy = (dx) => {
    const x = Math.min(Math.max(rect.left + dx, bounds.left), bounds.right - w)
    const { lefts, rights } = layout(x)
    const seat = {}
    let edge = x - TRAIL_GAP
    for (const o of lefts) {
      seat[o.k] = Math.min(o.left + o.width, edge) - o.width
      edge = seat[o.k] - TRAIL_GAP
    }
    edge = bounds.left
    for (const o of [...lefts].reverse()) {
      seat[o.k] = Math.max(seat[o.k], edge)
      edge = seat[o.k] + o.width + TRAIL_GAP
    }
    edge = x + w + TRAIL_GAP
    for (const o of rights) {
      seat[o.k] = Math.max(o.left, edge)
      edge = seat[o.k] + o.width + TRAIL_GAP
    }
    edge = bounds.right
    for (const o of [...rights].reverse()) {
      seat[o.k] = Math.min(seat[o.k], edge - o.width)
      edge = seat[o.k] - TRAIL_GAP
    }
    for (const o of others) windows.setTrailOffset(o.k, o.off + (seat[o.k] - o.left))
    windows.setTrailOffset(key, startOffset + (x - rect.left))
    return x - rect.left
  }
  return { moveBy, end: () => windows.persistTrail() }
}

// Start dragging one body by its grip. `e` is the grip's pointerdown; the
// grip is `e.currentTarget`. Returns false when there is nothing to drag (a
// phone, an unmounted body).
export function startTrailDrag (key, e) {
  const session = beginTrailMove(key)
  if (!session) return false
  e.preventDefault()
  e.stopPropagation()
  const grip = e.currentTarget
  // Capture retargets every later pointer event — and the trailing click —
  // onto the grip, whose @click.stop swallows it: releasing a drag over the
  // body must not toggle its window, and while captured the body under the
  // pointer is the grip, so a strip's hover-expand never fires mid-drag.
  try { grip.setPointerCapture(e.pointerId) } catch (_) { /* older engines — the listeners below still work */ }
  const startX = e.clientX
  const move = (ev) => { session.moveBy(ev.clientX - startX) }
  const up = () => {
    grip.removeEventListener('pointermove', move)
    grip.removeEventListener('pointerup', up)
    grip.removeEventListener('pointercancel', up)
    session.end()
  }
  grip.addEventListener('pointermove', move)
  grip.addEventListener('pointerup', up)
  grip.addEventListener('pointercancel', up)
  return true
}

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
