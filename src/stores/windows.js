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
// 300px panel at the right edge, parked = the SAME element narrowed to a thin
// icon column, its one list scroller persisting through the morph. The two
// widgets SHARE that right-edge column — the stack hangs from the top half,
// pins rises from the bottom half — so they never overlap and both stay flush
// against the edge. `railWidth` is the parked column's width — kept as a
// PERMANENT reserve (the page content pads right by it, and `dockRight` shifts
// the OTHER bottom docks left beside it) so nothing reflows when a panel
// expands; the expanded panels are transient overlays above everything anyway.

// The docks' z floor sits ABOVE the feed page's opaque surfaces and BELOW
// every piece of chrome that must stay reachable (2026-07-27). The feed
// container carries z 3001 (it outranks the crown strip to overlap it) and
// its flyout 3002, and at the old 2400 floor every dock opened UNDER them —
// triggering the maker on /feed drew it behind the feed box, unusable. The
// sandwich, bottom to top: feed container 3001 / flyout 3002 → THESE DOCKS
// 3010+ → drawer 3050 → stack/pins widgets 3100 (the side bars stay above
// every dock, parked or expanded, by their own fixed EDGE_Z).
const Z_BASE = 3010
// One parked-column slot: 42px column + 4px gap. Keep in sync with
// --dock-rail-w in css/_tokens.scss (the parked panels' width).
const RAIL_W = 46
// Expanded pins/stack panel width — keep in sync with the 300px in
// StackPanel/PinsDrawer. The pins panel/rail sits just above the footer's
// right end, so the minitab strip (which shares that band) insets by this much
// to stay clear of it.
const PANEL_W = 300

const STORAGE_KEY = 'pathos_windows'

function defaultPanels () {
  return {
    // Neither the stack nor the pins panel has a nav-bar toggle anymore, so
    // both default to their parked icon column — always reachable at the
    // right edge, expanding on hover (head glyph taps for touch) — instead of
    // starting fully closed (which, with no opener left, would strand them).
    // The parked pins widget hangs just above the footer, right over the tack.
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

    // Open side panels — drives the permanent right-edge column's presence
    // (both panels are always open; only their presentation flips).
    railKeys: (s) => ['stack', 'pins'].filter((k) => s.panels[k].open),

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
