// ── THE TOP DOCK (2026-11-03, user ask: "drag flyout windows around the
// screen, but when i'm holding one while hovering the header on top of the
// top header nav bar, it gets attached to the top bar … by default, the
// attached flyout window is expanded in height to match the bottom edge of
// the side viewer. On its top, it is sticking underneath the top header nav
// bar's bottom lip, with no rounded edges") ─────────────────────────────────
//
// A flyout window can be DOCKED to the top rail (`.media-tabs`). A docked
// window keeps only its horizontal geometry from the store (`rect.x`,
// `rect.w` — the same fields a free window moves); its vertical geometry is
// DERIVED here: its top is the rail's bottom lip, wherever the planet has
// slid the rail (`--header-y`), and its foot is the side viewer's bottom
// edge — or the dock floor the arena uses where no side viewer is mounted —
// unless the user pulled the south rim, which writes `dockH`. `rect.y` /
// `rect.h` keep the window's FREE posture, untouched while it is docked, so
// pulling it off the rail gives back the window that went up.
//
// Measured, never restated: the rail's box (its height is a calc() chain of
// tokens and it slides), the side viewer's box (a flex child of the feed
// page), the footer's height. One module-level measurement set and ONE
// resize listener for the app's lifetime, `useMediaArena`'s precedent.
import { ref, watch } from 'vue'
import { headerY } from 'src/composables/useHeaderSlide'

// The shortest a docked window may stand — a bar, its frieze, a sliver of
// face. A side viewer shorter than this (a squat viewport) gives way to it.
export const DOCK_MIN_H = 160
// How far a docked window's bar must be pulled DOWN, from where the gesture
// stood on the rail, before the window lets go of it. Hysteresis on purpose:
// a horizontal slide along the bar wobbles vertically and must not detach.
export const UNDOCK_PX = 32
// (The parked tabs it hangs over stay put BEHIND it — the window paints over
// the rail's row. `DOCK_TAB_PAD`, the daylight a docked window kept from the
// tabs it displaced, went with THE PARTING the same day: MediaTabsBar.)

export const railTop = ref(0)
export const railBottom = ref(22)
export const dockFloor = ref(typeof window !== 'undefined' ? window.innerHeight - 46 : 754)
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 800)

let armed = false
let ro = null
let observed = null

export function measureDock () {
  if (typeof window === 'undefined') return
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  const rail = document.querySelector('.media-tabs')
  const r = rail ? rail.getBoundingClientRect() : null
  railTop.value = r ? Math.round(r.top) : 0
  railBottom.value = r ? Math.round(r.bottom) : 22
  // The arena's floor (useMediaArena: the footer's top less the 14px
  // daylight) is the fallback — a page with no side viewer still gives a
  // docked window a foot that clears the nav footer.
  const footer = document.querySelector('.nav-footer')?.offsetHeight || 32
  const floor = vh.value - footer - 14
  const side = document.querySelector('.side-viewer')
  const s = side ? side.getBoundingClientRect() : null
  dockFloor.value = s && s.height > 0 && s.bottom > railBottom.value + DOCK_MIN_H
    ? Math.round(s.bottom)
    : floor
  // The side viewer mounts and unmounts with the feed page — follow
  // whichever one stands now, so its own resizes re-measure the foot.
  if (ro && side !== observed) {
    if (observed) ro.unobserve(observed)
    if (side) ro.observe(side)
    observed = side
  }
}

// Idempotent: the host arms it once; every caller after that is a no-op.
export function armTopDock () {
  if (armed || typeof window === 'undefined') return
  armed = true
  window.addEventListener('resize', measureDock)
  if (typeof ResizeObserver !== 'undefined') ro = new ResizeObserver(() => measureDock())
  // The planet slides the rail — the lip moves, and every docked window
  // hangs from the lip.
  watch(headerY, () => requestAnimationFrame(measureDock))
  measureDock()
}

// True while the pointer is ON the rail — the dock gesture's trigger.
export const overRail = (clientY) => clientY >= railTop.value - 2 && clientY <= railBottom.value + 2

// The box a docked window stands in. Reactive (reads the refs above), so a
// style computed off it follows the rail, the side viewer and the viewport.
export function dockedRectOf (v) {
  const rect = v?.rect || { x: 0, w: 480 }
  const w = Math.min(Math.round(rect.w), vw.value)
  const x = Math.min(Math.max(0, Math.round(rect.x)), Math.max(0, vw.value - w))
  const y = railBottom.value
  const room = Math.max(DOCK_MIN_H, vh.value - y)
  const want = v?.dockH != null ? v.dockH : dockFloor.value - y
  const h = Math.min(room, Math.max(DOCK_MIN_H, Math.round(want)))
  return { x, y, w, h }
}

// The legal x for a docked window of width `w` — the whole viewport width.
export const clampDockX = (x, w) => Math.min(Math.max(0, Math.round(x)), Math.max(0, vw.value - w))
