// FLYOUT VIEWERS — N simultaneous floating element-viewer windows over the
// arena. Born 2026-08-04 as `mediaViewers.js` (docs/plans/
// floating-media-viewer.md, node previews only); **FUSED 2026-08-17 (user
// ask)** with the feed's element flyout into ONE window family: a viewer's
// TARGET is now any element — an enriched NODE (the media faces), a feed
// POST item (the embedded postcard), or a bare REF still to resolve — and
// every window carries the media family's whole posture (fit-engine spawn,
// drag/resize, park tabs, foot actions) plus the element/skeleton view
// switch. The single-instance skeleton flyout and its `flyouts.js` window
// store died in the fusion: opening a second element pops a SECOND window.
//
// Per-viewer flags live HERE, the family-store precedent (maker/uploader/
// chat keep their own state and only borrow z-order from the windows
// store): windows.js stays the one z authority, reached through the
// key-agnostic `flyout:<id>` keys, so viewers interleave with the docks
// without the store learning a thing. Nothing is persisted — a viewer
// window is session furniture.
//
// The GEOMETRY FIELDS (`rect`, `natural`, `minimized`, `maximized`) and
// the `setRect` seam keep their mediaViewers names on purpose: the fit
// engine (utils/mediaFit) and the gesture composable
// (useMediaWindowGestures) are written against exactly that shape, and the
// fusion's whole point was to take those behaviors unchanged.
import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

let seq = 0

// One identity per element, whatever the door: re-triggering the same
// element restores + fronts the window it already has instead of stacking
// a twin — N windows for N elements, never two for one.
const identityOf = (target) => {
  if (!target) return null
  if (target.kind === 'node') return 'node:' + target.node?.id
  if (target.kind === 'post') return 'post:' + target.item?.skeleton_id
  if (target.kind === 'ref') return 'ref:' + String(target.ref)
  return null
}

export const useFlyoutViewersStore = defineStore('flyoutViewers', {
  state: () => ({
    // { id, target: {kind:'node',node} | {kind:'post',item} | {kind:'ref',ref},
    //   rect: {x,y,w,h}|null, natural: {w,h}|null, minimized, maximized,
    //   label, icon }
    // `node`/`item` arrive ENRICHED from their triggers (NodeMini's card,
    // the feed's item) — the viewer never re-fetches what it was handed.
    // `rect` stays null until the fit engine places the window (the shell
    // hides it for that frame so nothing flashes at a wrong size).
    // `label`/`icon` are what the parked tab draws — written back by the
    // window as its header resolves, so a tab and the window it restores
    // are never two different names.
    viewers: []
  }),

  getters: {
    parked: (s) => s.viewers.filter(v => v.minimized),
    byId: (s) => (id) => s.viewers.find(v => v.id === id) || null,
    // The feed cards light their triggers off this: which POST elements
    // hold an OPEN (not parked) window right now.
    openPostIds: (s) => s.viewers
      .filter(v => !v.minimized && v.target.kind === 'post')
      .map(v => String(v.target.item.skeleton_id))
  },

  actions: {
    spawn (target) {
      const identity = identityOf(target)
      if (!identity) return null
      const existing = this.viewers.find(v => identityOf(v.target) === identity)
      if (existing) {
        existing.minimized = false
        this.focus(existing.id)
        return existing.id
      }
      const id = 'fv' + (++seq)
      this.viewers.push({
        id,
        target,
        rect: null,
        natural: null,
        minimized: false,
        maximized: false,
        label: '',
        icon: ''
      })
      this.focus(id)
      return id
    },

    // The three doors, one per element shape the platform hands over.
    spawnNode (node) {
      if (!node || !node.id) return null
      return this.spawn({ kind: 'node', node })
    },
    spawnPost (item) {
      if (!item || item.skeleton_id == null) return null
      return this.spawn({ kind: 'post', item })
    },
    spawnRef (ref) {
      if (ref == null || ref === '') return null
      return this.spawn({ kind: 'ref', ref: String(ref) })
    },

    // A REF window that resolved into a real element becomes that element
    // — same window, same rect, new target — so its title, tab, faces and
    // foot all speak for what it actually holds. The window drives this
    // as its resolution lands.
    retarget (id, target) {
      const v = this.byId(id)
      if (v && target) v.target = target
    },

    // The window mirrors its resolved header down for the parked tab.
    describe (id, label, icon) {
      const v = this.byId(id)
      if (!v) return
      if (label) v.label = label
      if (icon) v.icon = icon
    },

    focus (id) {
      useWindowsStore().focus('flyout:' + id)
    },

    close (id) {
      const i = this.viewers.findIndex(v => v.id === id)
      if (i >= 0) this.viewers.splice(i, 1)
      useWindowsStore().release('flyout:' + id)
    },

    minimize (id) {
      const v = this.byId(id)
      if (!v) return
      v.minimized = true
      useWindowsStore().release('flyout:' + id)
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
