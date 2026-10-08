// useRenderDepth — THE DEPTH DIAL (2026-10-07, user ask: "considering the high
// degree of nestability of the rendered elements … we want the depth of the
// loaded items to be something we can configure from Talavero's board inside
// the feed container. By default, we want to render just 2 layers").
//
// A rendered element can contain references to other elements, which can
// contain references of their own, without end. Every surface that shows
// elements picks ONE of two faces for each reference it meets:
//
//   the MINI family   — the element's most enriched preview (NodeMini,
//                       PostMini, SkeletonMini, PathMini, … on MiniPanel)
//   the NANO pill     — the abstract reference (MicroChip via RefMicro)
//
// The dial says how many LAYERS of minis a surface draws below its own
// cards before every deeper reference falls back to a nano pill:
//
//   depth 2 (default)  card → its embedded elements as MINIS (layer 1)
//                           → their embedded elements as MINIS (layer 2)
//                           → anything deeper as NANO pills
//   depth 1            card → embedded elements as MINIS → their embedded
//                           elements as NANO pills
//   depth 0            card → every embedded element as a NANO pill
//
// It is a BUDGET passed down the component tree by provide/inject:
//   · the SURFACE (FeedStream) provides its dial as the budget at its root;
//   · every rich face that mounts a Mini (ElementMini) CONSUMES one layer —
//     it provides `budget − 1` to everything inside it;
//   · every renderer that chooses a face for a reference (MarkdownBody's
//     tiers, PathLane's enriched members, SkeletonTable's inline nests)
//     reads the budget it inherited: exhausted (≤ 0) means nano, whatever
//     the author's sigil asked for. The dial CAPS enrichment; it never
//     promotes a bare `[[…]]` (an inline chip in a sentence) into a panel —
//     the author's grammar still says "point at it" vs "show it".
//
// A surface that provides nothing (the post viewer page, a flyout's board,
// the file tree) injects `null` = NO DIAL: every renderer keeps the
// behaviour it had before this dial existed (the author's sigil, the
// surface tier, SkeletonTable's own two-level nest budget).
//
// The dial is a reader's VIEW preference, remembered per browser under
// `pathos_feed_depth` (like the skeleton layout toggle's own key) — not a
// lens (it never changes WHICH posts load), so it rides no URL and no
// nav_state. docs/concepts/feed-windowing.md § The depth dial.

import { inject, provide, computed } from 'vue'

export const RENDER_DEPTH = Symbol('pathos.renderDepth')

export const DEPTH_DEFAULT = 2
export const DEPTH_MIN = 0
export const DEPTH_MAX = 4
export const DEPTH_STORE_KEY = 'pathos_feed_depth'

export const clampDepth = (n) => {
  const v = parseInt(n, 10)
  if (!Number.isFinite(v)) return DEPTH_DEFAULT
  return Math.min(DEPTH_MAX, Math.max(DEPTH_MIN, v))
}

export function readStoredDepth () {
  try {
    const raw = localStorage.getItem(DEPTH_STORE_KEY)
    return raw == null ? DEPTH_DEFAULT : clampDepth(raw)
  } catch (_) { return DEPTH_DEFAULT }
}

export function storeDepth (n) {
  try { localStorage.setItem(DEPTH_STORE_KEY, String(clampDepth(n))) } catch (_) { /* private mode */ }
}

// The SURFACE's call: hand the dial (a ref/computed of a number) to
// everything rendered inside it.
export function provideRenderDepth (depthRef) {
  provide(RENDER_DEPTH, depthRef)
}

// Any renderer's call: the budget it inherited — a ref whose `.value` is
// the layers still allowed below this point — or `null` when no surface
// above set a dial.
export function useRenderBudget () {
  return inject(RENDER_DEPTH, null)
}

// True when a dial is in force and nothing richer than a nano pill may be
// drawn here.
export function budgetExhausted (budget) {
  return budget != null && budget.value != null && budget.value <= 0
}

// A rich face's call (ElementMini): everything inside it stands one layer
// deeper, so it provides `budget − 1` to its subtree. With no dial above,
// nothing is provided and the subtree keeps injecting `null`.
export function consumeRenderLayer () {
  const budget = useRenderBudget()
  if (budget == null) return { budget: null, below: null }
  const below = computed(() => {
    const v = budget.value
    return v == null ? null : Math.max(0, v - 1)
  })
  provide(RENDER_DEPTH, below)
  return { budget, below }
}
