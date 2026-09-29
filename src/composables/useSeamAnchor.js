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
// Back/Forward plates like a drag would be) and refuses its own drag. When
// the value is null the seam is free again and goes back to the fraction it
// remembers (`pathos_header_logo_x`).
//
// A module-level ref rather than a Pinia store: it is a single float with
// no history, no persistence and exactly one writer, and `useAurora`
// beside it already set the precedent for "a composable that owns a
// window-wide fact". Whoever claims it owns it — a second publisher would
// have to arbitrate here, not in the rail.
import { ref } from 'vue'

export const seamAnchor = ref(null)

export function anchorSeam (x) {
  const v = Number.isFinite(x) ? Math.round(x * 10) / 10 : null
  if (seamAnchor.value !== v) seamAnchor.value = v
}

export function releaseSeam () {
  if (seamAnchor.value !== null) seamAnchor.value = null
}
