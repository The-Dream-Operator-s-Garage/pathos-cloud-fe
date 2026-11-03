// The ARENA — the one function that answers "where is a media window
// BORN" (docs/plans/floating-media-viewer.md). Desktop: the right half of
// the viewport (the docks' half), below the crown strip, above the nav
// footer, left of the permanent stack/pins column. Phone (≤600px): the
// feed's span at 90% of the run between the bars, `fill` — the window
// takes the whole arena (since 2026-11-03; the top half before). A short
// landscape viewport: the whole viewport between the fixed bands. Spawn placement and the fit math ask
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
  // `--nav-footer-h` is a calc() and offsetHeight tracks it through any
  // future token change. The fallbacks restate the current formulas for
  // calls that land before the layout mounts.
  //
  // ⚠ THE CROWN STRIP IS GONE (2026-08-12, user ask): there is no
  // `.frieze-header` element to measure any more, so `friezeH` — which feeds
  // `chromeOf`, i.e. the band drawn INSIDE a viewer, and is still a real
  // `--frieze-h` box — comes from the token's own 2.1vh formula.
  friezeH.value = Math.round(window.innerHeight * 0.021)
  // THE ARENA'S CEILING is the window's top chrome, which is now the media
  // tabs rail alone — the thin silver band the viewers park on. It was the
  // crown strip's BOTTOM edge until the strip left (and the strip itself had
  // stepped down by this same band since 2026-08-05, which is why ceiling and
  // height were already two different numbers).
  const rail = document.querySelector('.media-tabs')
  crownBottom.value = rail?.getBoundingClientRect().bottom ||
    Math.round(window.innerHeight * 0.021 / 5) + 1
  footerH.value = document.querySelector('.nav-footer')?.offsetHeight || 32
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
    // ⭐ THE PHONE WINDOW (2026-11-03, user ask — every window a bar opens on
    // a phone "occupies the same space as the feed container so the tabs on
    // the right do not overlap on top of the window … around 90% of the
    // available space in between the footer and top nav bars"): a phone's
    // arena IS that footprint — x 0 to the feed's right edge (the
    // `--phone-feed-reserve` column is the parked tabs' wall), 90% of the run
    // from the rail's bottom to the footer's top, centred in it. The docks'
    // stylesheet states the same three numbers (_components.scss § THE PHONE
    // WINDOW). (Portrait was the top HALF until this day — 105px tall under
    // a rail slid a third of the way down.)
    if (mobile) {
      const reserve = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone-feed-reserve')) || 33
      const run = Math.max(120, vh.value - footerH.value - crownBottom.value)
      const h = Math.round(run * 0.9)
      return { x: 0, y: crownBottom.value + Math.round((run - h) / 2), w: Math.max(160, vw.value - reserve), h, fill: true }
    }
    const pad = shortViewport ? 8 : 14
    const top = crownBottom.value + pad
    const floor = vh.value - footerH.value - pad
    if (shortViewport) {
      // A short viewport wider than a phone (a phone held sideways):
      // everything between the bands (portrait can't reach here any more).
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
  // hides the thing that matters: ⭐ since 2026-11-03 EVERY bar paints under
  // a flyout (its band is 3140+, over the nav footer's 3110 and the header
  // rail's 3125 — windows.js `Z_TOP`). Until then the footer outranked a
  // window and the rail did too, and a window dragged over the rail hid its
  // own lights ("I cannot close them, minimize them or maximize em"). clampRect keeps the whole rect inside, so no window can
  // be dragged off-screen or lose its bar.
  const roam = computed(() => ({ x: 0, y: 0, w: vw.value, h: vh.value }))

  // `measure` is exported for interactions that must re-sample mid-gesture
  // (a drag across an orientation flip); the resize listener covers the
  // normal path.
  return { arena, roam, measure, friezeH, crownBottom, footerH }
}
