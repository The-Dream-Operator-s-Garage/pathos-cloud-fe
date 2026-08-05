// Floating media viewers — N simultaneous dark-grey preview windows over
// the arena (docs/plans/floating-media-viewer.md). Per-viewer flags live
// HERE, the family-store precedent (maker/uploader/chat keep their own
// state and only borrow z-order from the windows store): windows.js stays
// the one z authority, reached through the key-agnostic `media:<id>` keys,
// so viewers interleave with the docks without the store learning a thing.
// Nothing is persisted in v1 — a preview window is session furniture.
import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

let seq = 0

export const useMediaViewersStore = defineStore('mediaViewers', {
  state: () => ({
    // { id, node, rect: {x,y,w,h}|null, natural: {w,h}|null,
    //   minimized, maximized }
    // `node` is the enriched card NodeMini already holds (file/embed
    // descriptors included) — the viewer never re-fetches. `rect` stays
    // null until the fit engine places the window (the shell hides it for
    // that frame so nothing flashes at a wrong size).
    viewers: []
  }),

  getters: {
    parked: (s) => s.viewers.filter(v => v.minimized),
    byId: (s) => (id) => s.viewers.find(v => v.id === id) || null
  },

  actions: {
    // One viewer per node: re-triggering the same node restores + fronts
    // the window it already has instead of stacking a twin.
    spawn (node) {
      if (!node || !node.id) return null
      const existing = this.viewers.find(v => v.node.id === node.id)
      if (existing) {
        existing.minimized = false
        this.focus(existing.id)
        return existing.id
      }
      const id = 'mv' + (++seq) + '-' + node.id
      this.viewers.push({
        id,
        node,
        rect: null,
        natural: null,
        minimized: false,
        maximized: false
      })
      this.focus(id)
      return id
    },

    focus (id) {
      useWindowsStore().focus('media:' + id)
    },

    close (id) {
      const i = this.viewers.findIndex(v => v.id === id)
      if (i >= 0) this.viewers.splice(i, 1)
      useWindowsStore().release('media:' + id)
    },

    minimize (id) {
      const v = this.byId(id)
      if (!v) return
      v.minimized = true
      useWindowsStore().release('media:' + id)
    },

    restore (id) {
      const v = this.byId(id)
      if (!v) return
      v.minimized = false
      this.focus(id)
    },

    toggleMaximize (id) {
      const v = this.byId(id)
      if (v) v.maximized = !v.maximized
    },

    setRect (id, rect) {
      const v = this.byId(id)
      if (v) v.rect = { ...rect }
    },

    setNatural (id, natural) {
      const v = this.byId(id)
      if (v) v.natural = natural ? { ...natural } : null
    }
  }
})
