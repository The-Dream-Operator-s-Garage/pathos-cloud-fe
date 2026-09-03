import { defineStore } from 'pinia'

// Window manager for the bottom-docked windows — post maker, uploader,
// navigation stack and pinned list. Tracks the z-order of the expanded
// windows: opening or restoring one brings it to the front; minimizing or
// closing it reveals whatever was behind it, so windows behave like a small
// desktop rising from the navigation bar. Maker/uploader keep their content
// state in their own stores and only report focus changes here; the stack
// and pins windows carry no content state, so their window flags live here
// (localStorage-persisted, so an open or minimized panel survives reload).
//
// The stack/pins side bars are each ONE element with two presentations
// (2026-07-24, third pass — the separate rail tree is gone): expanded = the
// `--stack-w` panel, parked = the SAME element flattened to a strip, its
// one list scroller persisting through the morph. They bounded the right edge
// together (stack top half, pins bottom half) until 2026-08-30, when the
// STACK MOVED ONTO the footer bar's inner frieze band (three user asks one
// sitting) — a chip row riding the trail's own box beside the bar's left
// end when parked, the panel rising from that seat to the window floor
// expanded — and ⭐ ON 2026-09-02 THE PINS WIDGET FOLLOWED (user ask): it is
// the stack strip's MIRROR at the trail's RIGHT run, beside the full-height
// dashboard block at the bar's right end. THE RIGHT-EDGE COLUMN IS GONE:
// `railKeys` is empty, `railWidth` / `dockRight` / `footerPanelInset` all
// read 0 (kept as getters so their consumers — MainLayout's page padding,
// every dock's `--dock-right`, the minitab strip — need no rewiring), and
// nothing reserves for either strip: parked, each lives inside chrome the
// layout already pays for (the bar — `.nav-right` pads for the pins strip
// by `--stack-w` the way the trail stops at the stack strip's edge), and
// expanded each is a transient overlay like the rest.

// The docks' z floor sits ABOVE the feed page's opaque surfaces and BELOW
// every piece of chrome that must stay reachable (2026-07-27). The feed
// container carries z 3001 (it outranks the crown strip to overlap it) and
// its flyout 3002, and at the old 2400 floor every dock opened UNDER them —
// triggering the maker on /feed drew it behind the feed box, unusable. The
// sandwich, bottom to top: feed container 3001 / flyout 3002 → THESE DOCKS
// 3010+ → minitab strip 3045 → nav bar 3110 → drawer + pins widget 3120 →
// stack widget 3130 (its bottom-left strip contests the drawer's corner
// since 2026-08-30 and must out-paint it; the side widgets stay above every
// dock, parked or expanded, by their own fixed EDGE_Z constants).
const Z_BASE = 3010
// (RAIL_W 46 — the parked right-edge column + its gap — and PANEL_W 300 —
// the expanded pins column — are RETIRED as of 2026-09-02: the pins widget
// rides the footer trail now, sized by `--stack-w` like the stack, and no
// layout reserve is left to compute. The getters below state 0 in their
// place.)

const STORAGE_KEY = 'pathos_windows'

// ── The trail slider (2026-08-30, user ask: "transform the frieze bar …
// into a horizontal sliding bar … I want to grab a button and move it
// horizontally across the footer") ──────────────────────────────────────
// One horizontal offset per trail chip, in px off its flow seat. The bar
// owns the DRAG (NavigationBar measures, clamps against neighbours and the
// two rail flanks, and writes here); the six docks each READ their own
// key so the window a button opens rides along with it (`--trail-shift`
// on the dock root → the `translate` in `.dock-window--creation`). Living
// HERE rather than in a store of their own because every consumer — the
// bar and all six docks — already holds this store, and the offsets are
// window geometry exactly the way `dockRight` is.
const TRAIL_KEY = 'pathos_nav_trail'
// The FIVE draggable chips, keyed by the window each one opens. The bar's
// two end blocks (the identity section, the dashboard block — ⭐ the
// dashboard chip LEFT the trail on 2026-09-02, user ask: "remove the
// draggable properties from the dashboard button and make the button occupy
// the whole height like the identity section") and the two strips (stack at
// the left run, pins at the right) are NOT here — they are the trail's
// fixed flanks, the walls the drag clamps against. A stale persisted
// `dashboard` key is simply not read.
const TRAIL_CHIPS = ['maker', 'skeletonBuilder', 'labelMaker', 'uploader', 'chat']

function loadTrailOffsets () {
  const out = {}
  for (const k of TRAIL_CHIPS) out[k] = 0
  try {
    const saved = JSON.parse(localStorage.getItem(TRAIL_KEY))
    for (const k of TRAIL_CHIPS) {
      const v = saved?.[k]
      if (typeof v === 'number' && isFinite(v)) out[k] = Math.round(v)
    }
  } catch (_) { /* storage unreadable — chips rest on their flow seats */ }
  return out
}

function defaultPanels () {
  return {
    // Neither the stack nor the pins panel has a nav-bar toggle anymore, so
    // both default to their parked strip — always reachable on the footer
    // trail (stack: its left run since 2026-08-30; pins: its right run,
    // beside the dashboard block, since 2026-09-02), expanding on hover
    // (head glyph taps for touch) — instead of starting fully closed
    // (which, with no opener left, would strand them).
    stack: { open: true, minimized: true },
    pins: { open: true, minimized: true }
  }
}

function loadPanels () {
  const out = defaultPanels()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    for (const key of Object.keys(out)) {
      // The stack and pins panels are permanent minimize-only fixtures with no
      // nav-bar toggle — they're ALWAYS at least the parked icon column, never
      // fully closed (a closed state would strand them). So `open` stays true
      // from the default; only the minimized flag persists (missing → keep the
      // parked default). This also self-heals any legacy blob that saved them
      // closed.
      const savedMin = saved?.[key]?.minimized
      if (savedMin !== undefined) out[key].minimized = !!savedMin
    }
  } catch (_) { /* storage unreadable — keep the defaults */ }
  return out
}

// Mobile pass (Thread H item 1, 2026-07-31): under this width the stack/pins
// widgets hide (CSS in _components.scss) and the layout stops reserving
// their column. Keep in sync with the @media blocks that key on it.
const MOBILE_MQ = '(max-width: 600px)'

export const useWindowsStore = defineStore('windows', {
  state: () => ({
    // Expanded windows, back → front (the last entry paints on top).
    order: [],
    panels: loadPanels(),
    // Transient 50/50 tiling: the skeleton builder requests a companion
    // editor (maker/uploader) beside it while capturing a new element into
    // a slot. { left: <window key>, right: <window key> } or null. Not
    // persisted — a reload lands back in normal stacking.
    split: null,
    // Per-chip horizontal offsets along the footer trail (px off each chip's
    // flow seat; persisted). See the TRAIL_KEY note above.
    trailOffsets: loadTrailOffsets(),
    // True under MOBILE_MQ — flips the rail reserves off. Kept live by
    // initViewportWatch() (called once from MainLayout).
    isMobile: typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(MOBILE_MQ).matches
      : false
  }),

  getters: {
    // z-index derived from stack position, so a newly focused window always
    // paints over the ones opened before it.
    zOf: (s) => (key) => {
      const i = s.order.indexOf(key)
      return i < 0 ? Z_BASE : Z_BASE + 1 + i
    },

    // ⭐ NO SIDE PANEL STANDS AT THE RIGHT EDGE SINCE 2026-09-02 — the pins
    // widget rides the footer trail beside the dashboard block, as the stack
    // has since 2026-08-30. The column reserve these four getters drove
    // (page padding, the docks' `--dock-right`, the minitab inset) is
    // therefore ZERO everywhere; they stay as getters so MainLayout, the six
    // docks and NavigationBar keep reading one seam, and so a future
    // right-edge widget has its wiring waiting.
    railKeys: () => [],
    railWidth () { return 0 },
    dockRight () { return 0 },
    footerPanelInset () { return 0 },

    // How far a trail chip stands off its flow seat — and, one binding away,
    // how far the window it opens rides with it. 0 on mobile: the chips
    // lose their grips there and the docks go edge to edge.
    trailShiftOf () {
      return (key) => (this.isMobile ? 0 : this.trailOffsets[key] || 0)
    },

    // Which side of the split a window sits on: 'left' | 'right' | null.
    splitSideOf: (s) => (key) => {
      if (!s.split) return null
      if (s.split.left === key) return 'left'
      if (s.split.right === key) return 'right'
      return null
    }
  },

  actions: {
    persist () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.panels))
      } catch (_) { /* storage blocked — panels just won't survive reload */ }
    },

    // Write one chip's trail offset. Deliberately does NOT persist — a drag
    // writes on every pointermove and the bar calls persistTrail() once on
    // release (and after a reconcile pass).
    setTrailOffset (key, px) {
      if (!(key in this.trailOffsets)) return
      this.trailOffsets[key] = Math.round(px)
    },

    persistTrail () {
      try {
        localStorage.setItem(TRAIL_KEY, JSON.stringify(this.trailOffsets))
      } catch (_) { /* storage blocked — offsets just won't survive reload */ }
    },

    // Keep isMobile live across resizes/orientation flips. Idempotent —
    // MainLayout calls it once on mount; the listener lives for the app.
    initViewportWatch () {
      if (this._mqWatched || typeof window === 'undefined' || !window.matchMedia) return
      this._mqWatched = true
      const mq = window.matchMedia(MOBILE_MQ)
      const apply = () => { this.isMobile = mq.matches }
      apply()
      if (mq.addEventListener) mq.addEventListener('change', apply)
      else mq.addListener(apply)
    },

    focus (key) {
      this.release(key)
      this.order.push(key)
    },

    release (key) {
      const i = this.order.indexOf(key)
      if (i >= 0) this.order.splice(i, 1)
      // The split's right side going away (minimized/closed) ends the
      // 50/50 tiling — the left window returns to its normal footprint.
      // (Any armed capture stays armed; delivery doesn't need the split.)
      if (this.split && this.split.right === key) this.exitSplit()
    },

    openPanel (key) {
      const p = this.panels[key]
      p.open = true
      p.minimized = false
      this.focus(key)
      this.persist()
    },

    closePanel (key) {
      const p = this.panels[key]
      p.open = false
      p.minimized = false
      this.release(key)
      this.persist()
    },

    minimizePanel (key) {
      this.panels[key].minimized = true
      this.release(key)
      this.persist()
    },

    restorePanel (key) {
      this.panels[key].minimized = false
      this.focus(key)
      this.persist()
    },

    enterSplit (left, right) {
      this.split = { left, right }
    },

    exitSplit () {
      this.split = null
    },

    // Footer-button semantics: closed → open, parked → restore,
    // expanded → close.
    togglePanel (key) {
      const p = this.panels[key]
      if (!p.open) this.openPanel(key)
      else if (p.minimized) this.restorePanel(key)
      else this.closePanel(key)
    }
  }
})
