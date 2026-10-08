// ── THE SEAM'S ANCHOR (2026-09-29, user ask: "for the hexagonal logo
// container on the top header bar, help me aligning it horizontally to the
// right frieze bar on the feed container … the logo frame should be sticking
// to the frieze bar below, both aligned and centered horizontally") ────────
//
// One number, shared by two components that never see each other: the
// viewport x where something below the rail wants the top rail's badge
// centred. `FeedPage` publishes the centre of its RIGHT rail
// (`.feed-container__rail--r`) while it is mounted — on every resize of the
// container, every drag of its rails, every scroll of the track — and
// releases it on unmount.
//
// A module-level ref rather than a Pinia store: it is a single float with
// no history, no persistence and exactly one writer, and `useAurora`
// beside it already set the precedent for "a composable that owns a
// window-wide fact". Whoever claims it owns it — a second publisher would
// have to arbitrate here, not in the rail.
//
// ⭐ 2026-09-29 EVE — THE RAIL'S EDGE: the publisher also hands over the
// rail's RIGHT edge (`seamEdge`, a viewport x or null), which is where the
// parked tabs' MEMBRANE starts (MediaTabsBar: the strip runs from it to the
// screen's right end). Released with the anchor.
//
// ⭐⭐ 2026-10-08 — BOTH RAILS, PAINTED ON `<html>`, AND THE MOVE (user ask:
// "attach [<< and >>] at the very same width of the left and right frieze
// bars of the feed container … extend the nav stack glass section end-to-end
// so it covers the inner space of the feed width … if I grab those new
// sections with holes around the holes (not the holes), I should be able to
// drag the feed container so I can move it horizontally across the screen").
// The publisher now hands over BOTH rails' viewport edges — `seamRails`
// `{ ll, lr, rl, rr }` (left rail's left/right, right rail's left/right) —
// and this module PAINTS them as custom properties on `<html>`
// (`--feed-rail-ll` … `--feed-rail-rr`) under the class `is-feed-railed`,
// so that the top rail's row (MediaTabsBar: Back, Forward, the grips, the
// planet) and the stack's glass (StackPanel — a sibling, not a descendant,
// which is why the properties stand on the root and not on the rail) lay
// themselves out in CSS alone, off the same four numbers, with no second
// measurer. Released = class off, properties off.
//
// THE GRIP, turned: it used to hand the badge's press to the right rail's
// resize (09-29 PM — the badge rode the seam and sat on that rail). The badge
// is the rail's VERTICAL handle now (useHeaderSlide) and the horizontal
// gesture the publisher lends is the MOVE: `shiftSeam(e)` passes a pointerdown
// to FeedPage's move gesture, captured on whatever element it came from (the
// perforated plates), and the whole container slides along the track at its
// width. `gripSeam` / `nudgeSeam` are gone with the seam's travel.
import { ref } from 'vue'

export const seamAnchor = ref(null)
export const seamEdge = ref(null)
export const seamRails = ref(null)
let grip = null

const RAIL_PROPS = ['ll', 'lr', 'rl', 'rr']
const sameRails = (a, b) => (a == null && b == null) ||
  (a != null && b != null && RAIL_PROPS.every((k) => a[k] === b[k]))

const paintRails = (r) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!r) {
    root.classList.remove('is-feed-railed')
    RAIL_PROPS.forEach((k) => root.style.removeProperty('--feed-rail-' + k))
    return
  }
  RAIL_PROPS.forEach((k) => root.style.setProperty('--feed-rail-' + k, r[k] + 'px'))
  root.classList.add('is-feed-railed')
}

export function anchorSeam (x, handle, edge, rails) {
  const v = Number.isFinite(x) ? Math.round(x * 10) / 10 : null
  const e = Number.isFinite(edge) ? Math.round(edge * 10) / 10 : null
  const r = rails && RAIL_PROPS.every((k) => Number.isFinite(rails[k]))
    ? Object.fromEntries(RAIL_PROPS.map((k) => [k, Math.round(rails[k] * 10) / 10]))
    : null
  if (handle) grip = handle
  if (seamAnchor.value !== v) seamAnchor.value = v
  if (seamEdge.value !== e) seamEdge.value = e
  if (!sameRails(seamRails.value, r)) {
    seamRails.value = r
    paintRails(r)
  }
}

export function releaseSeam () {
  grip = null
  if (seamAnchor.value !== null) seamAnchor.value = null
  if (seamEdge.value !== null) seamEdge.value = null
  if (seamRails.value !== null) {
    seamRails.value = null
    paintRails(null)
  }
}

// true when a publisher took the gesture — the caller must then leave it be.
export function shiftSeam (e) {
  if (!grip || !grip.shift || seamRails.value == null) return false
  grip.shift(e)
  return true
}
