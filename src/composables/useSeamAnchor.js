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
// releases it on unmount; `MediaTabsBar` watches it and, while a value
// stands, slides its seam so the hexagon is centred on it (clamped to the
// Back/Forward plates like a drag would be). When
// the value is null the seam is free again and goes back to the fraction it
// remembers (`pathos_header_logo_x`).
//
// A module-level ref rather than a Pinia store: it is a single float with
// no history, no persistence and exactly one writer, and `useAurora`
// beside it already set the precedent for "a composable that owns a
// window-wide fact". Whoever claims it owns it — a second publisher would
// have to arbitrate here, not in the rail.
//
// ⭐ THE GRIP (2026-09-29 PM, user ask: "make sure i can drag them
// together"): the anchor used to be one-way — the badge followed and refused
// its own drag. Now the publisher also hands over a GRIP, `{ down, nudge }`:
// a press on the badge is passed to the rail's own resize gesture (`down`
// takes the pointerdown event and captures on whatever element it came
// from), and the arrow keys nudge the rail by px. The badge never moves
// itself while anchored; the rail moves, publishes, and the badge follows —
// one gesture, one source of truth, so the two cannot drift apart.
//
// ⭐ 2026-09-29 EVE — THE RAIL'S EDGE: the publisher also hands over the
// rail's RIGHT edge (`seamEdge`, a viewport x or null), which is where the
// parked tabs' MEMBRANE starts (MediaTabsBar: the strip runs from it to the
// screen's right end). Released with the anchor.
import { ref } from 'vue'

export const seamAnchor = ref(null)
export const seamEdge = ref(null)
let grip = null

export function anchorSeam (x, handle, edge) {
  const v = Number.isFinite(x) ? Math.round(x * 10) / 10 : null
  const e = Number.isFinite(edge) ? Math.round(edge * 10) / 10 : null
  if (handle) grip = handle
  if (seamAnchor.value !== v) seamAnchor.value = v
  if (seamEdge.value !== e) seamEdge.value = e
}

export function releaseSeam () {
  grip = null
  if (seamAnchor.value !== null) seamAnchor.value = null
  if (seamEdge.value !== null) seamEdge.value = null
}

// true when a publisher took the gesture — the caller must then leave it be.
export function gripSeam (e) {
  if (!grip || seamAnchor.value == null) return false
  grip.down(e)
  return true
}

export function nudgeSeam (dx) {
  if (!grip || seamAnchor.value == null) return false
  grip.nudge(dx)
  return true
}
