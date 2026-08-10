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
// Flag-only, the `labelMaker` precedent: there is nothing to draft here yet
// and so nothing to persist — the panel is empty by design and its contents
// are the next piece of work. z-order lives in windows.js under the
// 'dashboard' key, which is also what puts this window in the same stack as
// the other five (open one and it covers the last; close it and that one
// comes back).
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false
  }),

  actions: {
    open () {
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('dashboard')
    },

    close () {
      this.isOpen = false
      this.isMinimized = false
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

    toggleMaximize () { this.isMaximized = !this.isMaximized }
  }
})
