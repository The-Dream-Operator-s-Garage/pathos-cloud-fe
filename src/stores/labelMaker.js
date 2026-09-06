import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useNavStore } from './navigation'

// The label maker dock — the end-to-end vocabulary workshop: browse/search
// the label forest, create roots, grow owned trees (children/siblings),
// rename, re-hang, and fork foreign trees into owned copies.
//
// Unlike the maker/uploader/builder there are no drafts to persist — a label
// mutation is a single round-trip — so this store carries only the window
// flags plus the currently selected label (session-only). z-order lives in
// windows.js under the 'labelMaker' key.

export const useLabelMakerStore = defineStore('labelMaker', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    // Label row the maker's action panel is focused on (not persisted).
    selected: null
  }),

  actions: {
    open () {
      // THE SUB-STACK (2026-09-06 PM): closed→open = "Opened label maker"
      // in the current stop (see stores/maker.js for the rule).
      const wasClosed = !this.isOpen
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('labelMaker')
      if (wasClosed) {
        try { useNavStore().recordDock('labelMaker', 'open') } catch (_) { /* the window opens whether or not the log does */ }
      }
    },

    // Open focused on a specific label (e.g. from a viewer page).
    openAt (label) {
      this.selected = label || null
      this.open()
    },

    close () {
      const wasOpen = this.isOpen
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('labelMaker')
      if (wasOpen) {
        try { useNavStore().recordDock('labelMaker', 'close') } catch (_) { /* the window opens whether or not the log does */ }
      }
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('labelMaker')
    },

    restore () {
      this.isMinimized = false
      useWindowsStore().focus('labelMaker')
    },

    toggleMaximize () { this.isMaximized = !this.isMaximized },

    select (label) { this.selected = label || null }
  }
})
