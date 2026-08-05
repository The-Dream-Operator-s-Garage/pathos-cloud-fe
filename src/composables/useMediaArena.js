// The ARENA — the one function that answers "where may a media window
// be" (docs/plans/floating-media-viewer.md). Desktop: the right half of
// the viewport (the docks' half), below the crown strip, above the nav
// footer, left of the permanent stack/pins column. Mobile portrait: the
// TOP half, over the content by design. Mobile landscape: the whole
// viewport between the fixed bands. Spawn placement, drag clamps, resize
// maxima and the fit math all ask this; nothing else knows about halves.
import { ref, computed } from 'vue'
import { useWindowsStore } from 'src/stores/windows'

// Module-level singleton: every window shares one measurement set and ONE
// resize listener for the app's lifetime (the windows-store viewport-watch
// precedent — idempotent arming, never torn down).
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const friezeH = ref(0)
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
  friezeH.value = document.querySelector('.frieze-header')?.offsetHeight ||
    Math.round(window.innerHeight * 0.021)
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
    const top = friezeH.value + pad
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

  // `measure` is exported for interactions that must re-sample mid-gesture
  // (a drag across an orientation flip); the resize listener covers the
  // normal path.
  return { arena, measure, friezeH, footerH }
}
