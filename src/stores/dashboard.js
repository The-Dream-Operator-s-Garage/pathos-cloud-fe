import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

// The dashboard dock — the 6th window RISING FROM THE NAV BAR (2026-08-10,
// second ask: "make it rise from the bottom, like the other creative expanded
// versions to create stuff that are attached to the footer nav bar"). It was
// a floating flyout in the feed's right-hand slot for the length of one pass;
// what it keeps from that pass is the flyout family's COAT (see
// `.dock-window--dashboard` in css/_components.scss — the grey dials), and
// what it takes from the docks is everything else: the shared footprint, the
// weld to the bar, maximize, and a minitab to park on.
//
// TABS since phase 4 (2026-08-10, the maker.js shape): one tab per OPEN
// dashboard — `{ id, skeletonId, name }` — persisted under
// `pathos_dashboard_tabs`. windows.js persists only panels; per-dock CONTENT
// persists in the dock's own store, and this is this dock's content: which
// boards are open, which is front, nothing else (the boards themselves are
// server data). `isEditing` is session-only on purpose — edit mode is a
// posture, not content, and a reload should land you reading, not editing.
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    isEditing: false,
    tabs: [],
    activeId: null,
    _loaded: false
  }),

  getters: {
    activeTab: (s) => s.tabs.find(t => t.id === s.activeId) || null
  },

  actions: {
    load () {
      if (this._loaded) return
      this._loaded = true
      try {
        const raw = JSON.parse(localStorage.getItem('pathos_dashboard_tabs') || 'null')
        if (raw?.tabs?.length) {
          this.tabs = raw.tabs.filter(t => t && t.skeletonId != null)
          this.activeId = this.tabs.some(t => t.id === raw.activeId)
            ? raw.activeId
            : (this.tabs[0]?.id || null)
        }
      } catch (_) { /* corrupted store — start clean */ }
    },

    persist () {
      try {
        localStorage.setItem('pathos_dashboard_tabs', JSON.stringify({
          tabs: this.tabs,
          activeId: this.activeId
        }))
      } catch (_) { /* quota — tabs stay in memory */ }
    },

    open () {
      this.load()
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('dashboard')
    },

    close () {
      this.isOpen = false
      this.isMinimized = false
      this.isEditing = false
      // The SIZE survives a close, the way every other dock's does: a window
      // you left maximized should come back the way you left it.
      useWindowsStore().release('dashboard')
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('dashboard')
    },

    restore () {
      this.isMinimized = false
      useWindowsStore().focus('dashboard')
    },

    toggleMaximize () { this.isMaximized = !this.isMaximized },

    // One tab per dashboard: opening an already-open board fronts its tab
    // (the id is derived from the skeleton id, so the dedupe is free).
    // `path` (the 'skeletons/<hash>' address) rides along when the caller
    // has it — it is what a tab dragged into a canvas slot speaks.
    openTab ({ skeletonId, name = null, path = null }) {
      const id = 'db' + skeletonId
      const existing = this.tabs.find(t => t.id === id)
      if (!existing) {
        this.tabs.push({ id, skeletonId, name, path })
      } else if (path && !existing.path) {
        existing.path = path
      }
      this.activeId = id
      this.persist()
      return id
    },

    closeTab (id) {
      const i = this.tabs.findIndex(t => t.id === id)
      if (i === -1) return
      this.tabs.splice(i, 1)
      if (this.activeId === id) {
        this.activeId = (this.tabs[i] || this.tabs[i - 1])?.id || null
        this.isEditing = false
      }
      this.persist()
    },

    select (id) {
      if (this.tabs.some(t => t.id === id)) {
        this.activeId = id
        this.persist()
      }
    },

    // The grid reports the resolved board back so a tab never keeps a
    // stale '(untitled)' after a rename lands server-side — and learns
    // its address (the drag payload) the first time the board resolves.
    nameTab (id, name, path = null) {
      const t = this.tabs.find(t => t.id === id)
      if (!t) return
      let dirty = false
      if (t.name !== name) { t.name = name; dirty = true }
      if (path && t.path !== path) { t.path = path; dirty = true }
      if (dirty) this.persist()
    },

    setEditing (v) { this.isEditing = !!v }
  }
})
