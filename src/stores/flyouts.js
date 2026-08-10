import { defineStore } from 'pinia'

// THE FLYOUT FAMILY'S WINDOW FLAGS (2026-08-10).
//
// Only one member left after the dashboard panel became a dock: the SKELETON
// flyout, the box FeedPage floats beside its column. Its CONTENT stays on that
// page — `selected` (a feed item) and `flyoutRef` (an address) are the feed's
// own state and could not live anywhere else — and what lives here is the
// window state alone, because it is the one part TWO surfaces have to see:
// FeedPage draws the box, and `MediaTabsBar` (the thin band at the top of the
// screen) draws the TAB it parks into. Props and emits cannot cross that gap;
// the two components are on opposite sides of the layout.
//
// Nothing is persisted. A parked flyout is session furniture, and a tab whose
// box died with its page would be a handle that opens nothing — which is why
// FeedPage RESETS this store when it unmounts (see `resetSkeleton`).
export const useFlyoutsStore = defineStore('flyouts', {
  state: () => ({
    skeleton: {
      // `minimized: true` IMPLIES the box is open — there is no way to close
      // a parked flyout (its red light is off-screen with it), so the only
      // exits are restoring it, selecting another card, or leaving the page,
      // and all three clear this flag. That is what lets the tab bar simply
      // ask "is it minimized?" without a second `open` flag to keep in step.
      minimized: false,
      maximized: false,
      // What the parked tab CALLS it — written by the flyout itself, so a tab
      // and the box it restores are never two different names. The glyph
      // rides along for the same reason.
      label: 'Skeleton',
      icon: 'schema'
    }
  }),

  actions: {
    minimizeSkeleton () { this.skeleton.minimized = true },
    restoreSkeleton () { this.skeleton.minimized = false },
    toggleSkeletonMax () { this.skeleton.maximized = !this.skeleton.maximized },

    // Called by the box as its title resolves (a post's skeleton, a named
    // schema, a bare id) — the tab is only ever as good as this.
    describeSkeleton (label, icon) {
      if (label) this.skeleton.label = label
      if (icon) this.skeleton.icon = icon
    },

    // The page is going away, so the tab must too. The SIZE survives on
    // purpose, the way every dock's does: reopening a box you left maximized
    // at its small size reads as the control doing something different the
    // second time.
    resetSkeleton () { this.skeleton.minimized = false }
  }
})
