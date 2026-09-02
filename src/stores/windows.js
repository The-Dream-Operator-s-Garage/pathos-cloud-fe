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
// 300px panel, parked = the SAME element flattened to a thin icon rail, its
// one list scroller persisting through the morph. They bounded the right edge
// together (stack top half, pins bottom half) until 2026-08-30, when the
// STACK MOVED ONTO the footer bar's inner frieze band (three user asks one
// sitting) — a dense chip row riding the trail's own box beside the
// burger's rail slot when parked, the panel rising from that seat to the
// window floor expanded — so the right-edge column is the PINS widget's
// alone now.
// `railWidth` is that parked column's width — kept as a PERMANENT reserve
// (the page content pads right by it, and `dockRight` shifts the OTHER
// bottom docks left beside it) so nothing reflows when a panel expands; the
// expanded panels are transient overlays above everything anyway. Nothing
// reserves for the stack: parked it lives inside chrome the layout already
// pays for (the bar), and expanded it is a transient overlay like the rest.

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
// One parked-column slot: 42px column + 4px gap. Keep in sync with
// --dock-rail-w in css/_tokens.scss (the parked panels' width).
const RAIL_W = 46
// Expanded PINS panel width — keep in sync with the 300px in PinsDrawer.
// (The stack's panel read this number too until 2026-09-02; it has its own
// dial now — `--stack-w` in css/_tokens.scss, 240px, shared by BOTH its
// faces — and nothing in this store reserves for it.) The pins panel/rail
// sits just above the footer's right end, so the minitab strip (which shares
// that band) insets by this much to stay clear of it.
const PANEL_W = 300

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
// The six draggable chips, keyed by the window each one opens. The two
// rail-slot chips (burger, tack) and the stack strip are NOT here — they
// are the trail's fixed flanks, the walls the drag clamps against.
const TRAIL_CHIPS = ['maker', 'skeletonBuilder', 'labelMaker', 'uploader', 'chat', 'dashboard']

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
    // both default to their parked rail — always reachable at their edge
    // (pins: the right column over the tack; stack: the chip row riding the
    // footer trail's left run since 2026-08-30), expanding on hover (head
    // glyph taps for touch) — instead of starting fully closed (which, with
    // no opener left, would strand them).
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

    // Open side panels at the RIGHT edge — drives the permanent column's
    // presence. Pins only since the stack moved to the bottom-left corner
    // (2026-08-30); the panel is always open, only its presentation flips.
    railKeys: (s) => ['pins'].filter((k) => s.panels[k].open),

    // One permanent column reserve — kept even while a panel is expanded (the
    // expanded panel is a transient overlay; a constant pad avoids page
    // reflow on every expand/collapse).
    railWidth () { return (!this.isMobile && this.railKeys.length) ? RAIL_W : 0 },
    dockRight () { return this.railWidth },

    // The minitab strip shares the band just above the bar where the pins
    // widget sits, so it clears the widget's current footprint: the parked
    // icon column, or the full panel width when expanded. On mobile the
    // widgets are hidden, so nothing insets.
    footerPanelInset () {
      if (this.isMobile) return 0
      const p = this.panels.pins
      if (!p.open) return 0
      return p.minimized ? RAIL_W : PANEL_W
    },

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
