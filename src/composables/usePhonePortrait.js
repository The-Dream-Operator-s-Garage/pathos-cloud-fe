// ── THE PHONE IN PORTRAIT (2026-10-13) ───────────────────────────────────
// One reactive flag, module-level (useSeamAnchor / useHeaderSlide's
// precedent for a window-wide fact): true while the viewport is a phone
// (≤ 600px wide, the platform's one phone line) AND taller than wide. The
// portrait-only layouts read it where CSS alone cannot answer — FeedPage
// refusing the left rail's resize + the move (the feed is pinned to the
// screen's left edge there), MediaTabsBar ordering and paging the tab wall.
// The stylesheets state the same line as
// `@media (max-width: 600px) and (orientation: portrait)`.
import { ref } from 'vue'

export const PHONE_PORTRAIT_Q = '(max-width: 600px) and (orientation: portrait)'

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PHONE_PORTRAIT_Q) : null

export const phonePortrait = ref(!!mq?.matches)

if (mq) mq.addEventListener('change', (e) => { phonePortrait.value = e.matches })
