// The ARENA — the one function that answers "where is a media window
// BORN" (docs/plans/floating-media-viewer.md). Desktop: the right half of
// the viewport (the docks' half), below the crown strip, above the nav
// footer, left of the permanent stack/pins column. Mobile portrait: the
// TOP half, over the content by design. Mobile landscape: the whole
// viewport between the fixed bands. Spawn placement and the fit math ask
// this; nothing else knows about halves.
//
// TWO REGIONS since 2026-08-05 (user ask): the arena above is where a
// window APPEARS, `roam` below is where it may GO. They were one region
// until then, which meant the right half was also a fence — a viewer
// could not be pulled over the page it came from, and any viewport
// change dragged an escaped window back. Birth stays composed (a new
// window lands in the docks' half, clear of the feed, cascaded); once
// the pointer is on the bar the whole screen is fair game. Keeping the
// pair separate is what buys both: one region can be opinionated
// precisely because the other is not.
import { ref, computed } from 'vue'
import { useWindowsStore } from 'src/stores/windows'

// Module-level singleton: every window shares one measurement set and ONE
// resize listener for the app's lifetime (the windows-store viewport-watch
// precedent — idempotent arming, never torn down).
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const friezeH = ref(0)
const crownBottom = ref(0)
const footerH = ref(0)
let armed = false

const measure = () => {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  // Measure the real fixed bands rather than restating their token math —
  // `--frieze-h` is vh-based and `--nav-footer-h` is a calc(), and
  // offsetHeight tracks both through any future token change. The
  // fallbacks restate the current formulas (2.1vh crown, 32px bar + crown)
  // for calls that land before the layout mounts.
  const crown = document.querySelector('.frieze-header')
  friezeH.value = crown?.offsetHeight || Math.round(window.innerHeight * 0.021)
  // Where the crown strip ENDS, which is not its height any more: while a
  // media viewer is parked the strip has stepped down by the tabs band
  // (`--media-tabs-h`), and the arena's ceiling is the strip's BOTTOM edge
  // (2026-08-05). Height and bottom are separate numbers now — friezeH
  // still feeds `chromeOf`, which is about the band drawn INSIDE a viewer.
  crownBottom.value = crown?.getBoundingClientRect().bottom || friezeH.value
  footerH.value = document.querySelector('.nav-footer')?.offsetHeight ||
    (32 + friezeH.value)
}

export function useMediaArena () {
  const windows = useWindowsStore()
  if (!armed && typeof window !== 'undefined') {
    armed = true
    measure()
    window.addEventListener('resize', measure)
  }

  const arena = computed(() => {
    // `isMobile` is the store's WIDTH gate (600px) — a phone held sideways
    // is 800+ wide and would read as desktop. The height gate catches it:
    // a viewport ≤ 500px tall is never a desktop, it is a landscape phone
    // (and a letterboxed window that squat is better served full-width
    // than by a right-half sliver anyway).
    const mobile = windows.isMobile
    const shortViewport = vh.value <= 500
    const pad = (mobile || shortViewport) ? 8 : 14
    const top = crownBottom.value + pad
    const floor = vh.value - footerH.value - pad
    if (mobile || shortViewport) {
      // Portrait: the top half (blocking the content's top is accepted).
      // Landscape: everything between the bands.
      const portrait = vh.value >= vw.value
      const bottom = portrait ? Math.min(Math.round(vh.value / 2), floor) : floor
      return { x: pad, y: top, w: Math.max(160, vw.value - pad * 2), h: Math.max(120, bottom - top) }
    }
    // Desktop: the right half, minus the stack/pins column the other docks
    // also clear (windows.railWidth is 0 on mobile, permanent otherwise).
    const x = Math.round(vw.value / 2) + pad
    const right = vw.value - windows.railWidth - pad
    return { x, y: top, w: Math.max(200, right - x), h: Math.max(160, floor - top) }
  })

  // ROAM — the whole viewport, and deliberately the WHOLE one: no inset,
  // no band subtraction. Drag clamps, resize maxima and the stale-rect
  // re-clamp all ask this, so a window may be parked anywhere on screen,
  // edge included. The two fixed bands are not carved out because neither
  // hides the thing that matters: the crown strip is z 3000 and PAINTS
  // UNDER a media window (3010+), and the nav footer, which outranks it,
  // can only ever cover the window's BOTTOM — the header stays visible
  // and grabbable, which is the property that has to survive. clampRect
  // keeps the whole rect inside, so no window can be dragged off-screen
  // or lose its bar.
  const roam = computed(() => ({ x: 0, y: 0, w: vw.value, h: vh.value }))

  // `measure` is exported for interactions that must re-sample mid-gesture
  // (a drag across an orientation flip); the resize listener covers the
  // normal path.
  return { arena, roam, measure, friezeH, crownBottom, footerH }
}
