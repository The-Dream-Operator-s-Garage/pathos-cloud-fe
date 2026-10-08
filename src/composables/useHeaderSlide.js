// ── THE RAIL'S SLIDE (2026-10-08, user ask: "for the planet icon
// container-button, if I grab it, I should be able to move the header nav bar
// up and down the screen, vertically (making the feed container shorter and
// freeing up space at the top of the screen). On the desktop mode, we want to
// begin with the header bar as a header bar at the very top, but for the
// mobile version … the header bar starts like 1/3 slid down vertically so
// that in the remaining space we can fit the side viewer there") ───────────
//
// One number for the whole window: how far down the screen the top rail
// stands, in px. It is written INLINE on `<html>` as `--header-y`, and
// `_tokens.scss` folds it into `--top-chrome-h` — the line every top-anchored
// surface steps down from (the page container's padding, the feed's height,
// the docks' tops, the stack panel's seat, the phone's wall). Nothing else
// writes the property; nothing reads this module for layout — CSS does.
//
// The badge on the rail (MediaTabsBar's planet) is the handle: its drag calls
// `slideTo` per frame and `rememberSlide` on release. Arrow keys walk it.
//
// WHAT IS REMEMBERED IS A FRACTION of the viewport's height, not the px — a
// phone turned sideways, a window resized, a URL bar folding away: the rail
// keeps its PROPORTION of the screen and the px are re-derived on every
// `resize`. Two slots, `:phone` and `:desktop` (the 600px query the whole
// dashboard draws its phone face at), because the two starting postures are
// opposite — the desktop rail begins at the very top, the phone's a third of
// the way down with the side viewer standing in the strip above it — and a
// slide chosen on one must not land on the other.
//
// THE CLAMP IS MEASURED, not stated: the rail may never push the feed below
// `MIN_FEED` px — top of screen, rail, feed, footer — so the ceiling reads the
// rail's and the footer's live boxes (their heights are tokens with calc()
// chains CSS resolves and JS cannot).
//
// `engage` / `release` count their callers: the rail is mounted once per
// layout, but AuthLayout mounts a rail too and asks for NO slide (the landing
// page has nothing to stand in the strip) — it simply never engages, and when
// the last engaged rail unmounts the property comes off `<html>` so the next
// layout starts from the resting 0.
import { ref } from 'vue'

export const PHONE_Q = '(max-width: 600px)'
const KEY = 'pathos_header_y'
// THE PHONE'S OPENING PROPORTION: a third, give or take — the side viewer's
// head (40) + divider (~20) + a card's cap and byline (~70) + a few lines of
// body need ~230px, which is a third of a 700px dvh; below it the feed keeps
// ~400px, two cards' worth. The user drags from there.
export const PHONE_DEFAULT = 0.34
export const DESKTOP_DEFAULT = 0
export const MIN_FEED = 160

export const headerY = ref(0)

const isPhone = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(PHONE_Q).matches
const slot = () => KEY + (isPhone() ? ':phone' : ':desktop')
const recallFrac = () => {
  try {
    const v = parseFloat(localStorage.getItem(slot()))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null
  } catch { return null }
}

const heightOf = (sel, fallback) => {
  const el = document.querySelector(sel)
  const h = el ? el.getBoundingClientRect().height : 0
  return h > 0 ? h : fallback
}

// The furthest down the rail may stand: the feed keeps MIN_FEED under it.
export function maxSlide () {
  const railH = heightOf('.media-tabs', 22)
  const footH = heightOf('.nav-bar', 32)
  return Math.max(0, window.innerHeight - railH - footH - MIN_FEED)
}

const clamp = (v) => Math.min(maxSlide(), Math.max(0, Math.round(v)))

const apply = () => {
  document.documentElement.style.setProperty('--header-y', headerY.value + 'px')
}

// Move the rail to `px` (clamped). Does NOT remember — a drag calls this per
// frame and remembers once on release.
export function slideTo (px) {
  const v = clamp(px)
  if (v !== headerY.value) headerY.value = v
  apply()
  return headerY.value
}

export function rememberSlide () {
  try {
    localStorage.setItem(slot(), String(headerY.value / Math.max(1, window.innerHeight)))
  } catch { /* private mode: the rail still slides */ }
}

// Re-derive the px from the remembered proportion (or the posture's default).
const settle = () => {
  const f = recallFrac()
  const frac = f == null ? (isPhone() ? PHONE_DEFAULT : DESKTOP_DEFAULT) : f
  slideTo(frac * window.innerHeight)
}

let engaged = 0
let onResize = null
export function engageHeaderSlide () {
  engaged++
  if (engaged > 1) return
  settle()
  // Once more after the chrome has painted — the clamp reads the rail's and
  // the footer's boxes, which may still be 0 on the first frame.
  setTimeout(settle, 80)
  onResize = settle
  window.addEventListener('resize', onResize)
}

export function releaseHeaderSlide () {
  engaged = Math.max(0, engaged - 1)
  if (engaged) return
  if (onResize) window.removeEventListener('resize', onResize)
  onResize = null
  headerY.value = 0
  document.documentElement.style.removeProperty('--header-y')
}
