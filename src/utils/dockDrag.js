// ── THE WINDOWS DRAG BY THEIR HEAD BAR (2026-10-12) ───────────────────────
//
// (User ask: "let me drag any of the button's windows through the header bar
// (by grabbing the header bar of the window)".)
//
// ONE delegated listener for every dock a footer button opens — post maker,
// schema builder, label maker, chat, capture, uploader, dashboard and the
// identity window. A dock opts in by carrying `data-dock-key="<its windows
// key>"` on its `.dock-window` root and spreading `windows.winDragStyle(key)`
// into its inline style; the offset lands in the store (`winDrag`) and the
// CSS composes `--win-dx` into the window's `translate`
// (_components.scss — the property, never `transform`, which the dock-slide
// enter/leave animation owns).
//
// · The gesture starts on the head bar itself, never on a control in it
//   (traffic lights, tabs, buttons, fields) — and only after 4px of travel,
//   so a click on a parked bar still restores it.
// · Maximized / split windows do not move (their geometry is the desk's), and
//   on a phone every dock runs edge to edge, so nothing drags there.
// · The box may not leave the screen: at least 80px of it stays on either
//   side — the handle is always reachable.
// · A double-click on the head bar puts the window back on its seat.
// · ⭐ THE BUTTON COMES ALONG (2026-10-12, user ask: "if i drag a window
//   across the footer nav bar, its button should be moving along with it!
//   Why are we leaving it behind?"). A window opened by a SLIDER body (the
//   three makers, chat, and the hub's two windows → the hub) spends its
//   HORIZONTAL travel on that body first, through the slider's own session
//   (`beginTrailMove` — the walls, the pass-through re-seating): the button
//   walks the bar and the window, centred on it, rides along. Only what the
//   walls refuse lands in `--win-dx`. The dashboard and identity windows
//   open from the bar's fixed end cells, so they move alone.
// · ⭐ SIDEWAYS ONLY (2026-10-31, user ask: "I can drag them vertically. I
//   should not be able to … make sure they remain attached to the footer nav
//   bar"). The gesture reads the pointer's X alone: every footer window keeps
//   its floor on the bar and only walks along it. The `--win-dy` half of the
//   offset (2026-10-12 → 10-31) is gone from the store and the CSS.
import { useWindowsStore } from 'src/stores/windows'
import { beginTrailMove } from 'src/utils/trailSlider'

// Which slider body each window belongs to.
const BODY_OF = { maker: 'maker', schemaBuilder: 'schemaBuilder', labelMaker: 'labelMaker', chat: 'chat', capture: 'hub', uploader: 'hub' }

const CONTROLS = 'button, a, input, textarea, select, [role="button"], [contenteditable="true"], .q-btn, .q-field, .traffic, .dock-tab'
const PINNED = ['is-max', 'is-split-left', 'is-split-right']
const THRESHOLD = 4
const KEEP = 80

function headOf (e) {
  if (e.button !== 0 || !e.target || !e.target.closest) return null
  const bar = e.target.closest('.dock-window .dock-bar')
  if (!bar || e.target.closest(CONTROLS)) return null
  const win = bar.closest('.dock-window[data-dock-key]')
  if (!win || PINNED.some((c) => win.classList.contains(c))) return null
  return { bar, win, key: win.dataset.dockKey }
}

function onDown (e) {
  const head = headOf(e)
  if (!head) return
  const windows = useWindowsStore()
  if (windows.isMobile) return
  const { bar, win, key } = head
  const sx = e.clientX
  const x0 = (windows.winDrag[key] || { x: 0 }).x
  const rect = win.getBoundingClientRect()
  let live = false
  let session = null
  const move = (ev) => {
    let dx = ev.clientX - sx
    if (!live) {
      if (Math.abs(dx) < THRESHOLD) return
      live = true
      try { bar.setPointerCapture(e.pointerId) } catch (_) { /* listeners still work */ }
      win.classList.add('is-dragging')
      if (BODY_OF[key]) session = beginTrailMove(BODY_OF[key])
    }
    dx = Math.min(Math.max(dx, KEEP - rect.right), window.innerWidth - KEEP - rect.left)
    const carried = session ? session.moveBy(dx) : 0
    windows.setWinDrag(key, x0 + dx - carried)
  }
  const up = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    document.removeEventListener('pointercancel', up)
    win.classList.remove('is-dragging')
    if (session) session.end()
    if (live) {
      // The release must not land as a click on the bar (a parked bar's
      // click restores the window).
      const swallow = (c) => { c.stopPropagation(); c.preventDefault() }
      bar.addEventListener('click', swallow, { capture: true, once: true })
      setTimeout(() => bar.removeEventListener('click', swallow, { capture: true }), 0)
    }
  }
  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
  document.addEventListener('pointercancel', up)
}

function onDouble (e) {
  const head = headOf(e)
  if (!head) return
  useWindowsStore().clearWinDrag(head.key)
}

let installed = false
export function installDockDrag () {
  if (installed) return
  installed = true
  document.addEventListener('pointerdown', onDown)
  document.addEventListener('dblclick', onDouble)
}
