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
// without the store learning a thing.
//
// ⭐ WINDOWS ARE STATE NOW (2026-09-06, user ask). "Nothing is persisted —
// a viewer window is session furniture" was this store's founding line and
// it is retired: a reload emptied the minimize rail, and the user's ask
// puts the tab bar on the same footing as the navigation trail. Two halves,
// each in the place that suits it:
//   · THE TRAY — which windows are open right now, with their geometry —
//     is a document, persisted whole to the reserved `__windows` nav_state
//     row and rehydrated by `hydrate()` on boot. Windows come back as REFS
//     (`nodes/<hash>` / `skeletons/<hash>`) and resolve themselves exactly
//     as a fresh spawn does, so nothing here has to know how to rebuild an
//     enriched node.
//   · THE STORY — opened / minimized / restored / maximized / closed,
//     forever — is a LOG, and goes to the navigation trail's sub-stacks
//     (navStore.recordWindow) plus the on-chain WINDOWS + WINDOW_TRAY path
//     skeletons the API drives off those same events.
//
// An OPEN is also a trail STOP: a floating window is the second way to be
// on an element, and being on it in a window is being on it.
//
// The GEOMETRY FIELDS (`rect`, `natural`, `minimized`, `maximized`) and
// the `setRect` seam keep their mediaViewers names on purpose: the fit
// engine (utils/mediaFit) and the gesture composable
// (useMediaWindowGestures) are written against exactly that shape, and the
// fusion's whole point was to take those behaviors unchanged.
import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useNavStore } from 'src/stores/navigation'
import { navService } from 'src/services/nav.service'
import { kindFor } from 'src/utils/kinds'

let seq = 0

// ── What a window IS, for the two systems outside this store ──────────
// `refOf`   the persistable address — what hydrate() re-spawns from.
// `placeOf` the trail's view of it: the route/type/id triple that makes a
//           windowed element the same STOP as the page for that element
//           (you were on node 5 either way — the surface is only how).
const refOf = (target) => {
  if (!target) return null
  if (target.kind === 'node') return target.node?.path || null
  if (target.kind === 'post') return target.item?.skeleton_path || null
  if (target.kind === 'ref') return String(target.ref).replace(/^pathos:/, '')
  return null
}

const placeOf = (target, label = '') => {
  if (!target) return null
  if (target.kind === 'node') {
    const n = target.node
    if (!n?.id) return null
    return {
      targetRoute: `/nodes/${n.id}`,
      targetType: 'node',
      targetId: n.id,
      targetLabel: label || `Node #${n.id}`,
      targetPath: n.path || null
    }
  }
  if (target.kind === 'post') {
    const it = target.item
    if (it?.skeleton_id == null) return null
    return {
      targetRoute: `/posts/${it.skeleton_id}`,
      targetType: 'post',
      targetId: it.skeleton_id,
      targetLabel: label || it.title || `Post #${it.skeleton_id}`,
      targetPath: it.skeleton_path || null
    }
  }
  // A bare ref has no id until it resolves — it still deserves a stop, keyed
  // by the address itself, and `retarget` upgrades it the moment it knows.
  if (target.kind === 'ref') {
    const addr = String(target.ref).replace(/^pathos:/, '')
    const prefix = addr.split('/').slice(-2)[0]
    return {
      targetRoute: `/${addr}`,
      targetType: kindFor(prefix).kind,
      targetId: null,
      targetLabel: label || addr.split('/').pop()?.slice(0, 10) || 'Element',
      targetPath: addr
    }
  }
  return null
}

// The tray is written on every open / park / close. Debounced because a
// drag-resize ends in a burst and a window's geometry is never worth
// blocking on.
let _saveTimer = null
const SAVE_DEBOUNCE_MS = 600

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
    spawn (target, opts = {}) {
      const identity = identityOf(target)
      if (!identity) return null
      const existing = this.viewers.find(v => identityOf(v.target) === identity)
      if (existing) {
        // ⚠ A REHYDRATION THAT LANDS HERE IS A DUPLICATE, NOT A RESTORE.
        // The tray can hold two rows for one element — a ref-door window
        // and an element-door window have different identities until the
        // ref one retargets, and after that they are the same element in
        // two windows, which this store's founding rule forbids. Boot is
        // where that collapses: keep the first, drop the second, and
        // record NOTHING (a reload must never mint window events, or the
        // trail becomes a boot log).
        if (opts.rehydrating) return existing.id
        // Re-triggering a PARKED window is a restore, and reads as one in
        // the trail; re-triggering an open one is just a focus and is not
        // an event at all (it would spam the sub-stack with noise).
        const wasParked = existing.minimized
        existing.minimized = false
        this.focus(existing.id)
        if (wasParked) this._record('RESTORE_WINDOW', existing)
        this._persist()
        return existing.id
      }
      const id = 'fv' + (++seq)
      const viewer = {
        id,
        target,
        rect: opts.rect || null,
        natural: null,
        minimized: !!opts.minimized,
        maximized: !!opts.maximized,
        label: opts.label || '',
        icon: opts.icon || ''
      }
      this.viewers.push(viewer)
      if (!viewer.minimized) this.focus(id)
      // A rehydrated window is not a new opening — it is the same window
      // the user left open, so it must not mint a second OPEN_WINDOW on
      // every reload (which would turn the trail into a boot log).
      if (!opts.rehydrating) this._record('OPEN_WINDOW', viewer)
      this._persist()
      return id
    },

    // ── The trail seam ──────────────────────────────────────────
    // One window event onto the navigation trail: OPEN_WINDOW opens (or
    // extends) a stop for the element, the rest land in that stop's
    // sub-stack. Never throws into a click — a window that cannot be
    // logged still opens.
    _record (code, viewer) {
      try {
        const place = placeOf(viewer?.target, viewer?.label)
        if (!place) return
        useNavStore().recordWindow(code, place)
      } catch (_) { /* logging is never the reason a window fails */ }
    },

    // ── The tray seam ───────────────────────────────────────────
    // The open set as a document: address, geometry, posture, and the
    // label/icon the parked tab draws (so a rehydrated tab letters itself
    // before its window has resolved anything). Windows with no resolvable
    // address are skipped — there would be nothing to re-spawn from.
    _persist () {
      if (_saveTimer) clearTimeout(_saveTimer)
      _saveTimer = setTimeout(() => {
        _saveTimer = null
        try {
          // One row per ADDRESS. Two windows can be open on one element
          // (see the rehydration note in `spawn`) and the tray is a set —
          // persisting both would re-create the duplicate on every boot.
          const seen = new Set()
          const rows = []
          for (const v of this.viewers) {
            const ref = refOf(v.target)
            if (!ref || seen.has(ref)) continue
            seen.add(ref)
            rows.push({
              ref,
              rect: v.rect,
              minimized: !!v.minimized,
              maximized: !!v.maximized,
              label: v.label || '',
              icon: v.icon || ''
            })
          }
          navService.saveWindows(rows)
        } catch (_) { /* the tray is an enhancement, never fatal */ }
      }, SAVE_DEBOUNCE_MS)
    },

    // ── Boot ────────────────────────────────────────────────────
    // Put the tab bar back. Every window returns as a REF and resolves
    // itself the way a fresh spawn does — a node window re-enriches, a post
    // window re-fetches its item — which is why nothing here needs to know
    // how to rebuild an enriched payload. Idempotent: a second call while
    // windows already stand is a no-op.
    async hydrate () {
      if (this.viewers.length) return
      try {
        const r = await navService.getWindows()
        if (!r?.success || !Array.isArray(r.windows)) return
        for (const w of r.windows) {
          if (!w?.ref) continue
          this.spawn({ kind: 'ref', ref: String(w.ref) }, {
            rect: w.rect || null,
            minimized: !!w.minimized,
            maximized: !!w.maximized,
            label: w.label || '',
            icon: w.icon || '',
            rehydrating: true
          })
        }
      } catch (_) { /* an empty tab bar is the old behaviour, never fatal */ }
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
      if (!v || !target) return
      const before = placeOf(v.target, v.label)
      v.target = target
      // The stop this window opened was keyed by the REF it opened on —
      // rewrite it to the element that ref turned out to name, in place.
      // Opening a second stop here would double every ref-door window in
      // the trail and leave the first one pointing at an unroutable
      // `/nodes/<hash>`.
      try {
        const after = placeOf(target, v.label)
        if (before?.targetRoute && after?.targetRoute && before.targetRoute !== after.targetRoute) {
          const nav = useNavStore()
          nav.refineStop(before.targetRoute, after)
          // ⚠ AND TELL THE CHAIN. The OPEN_WINDOW this window emitted
          // carried a ref with no element id, so the WINDOWS history path
          // and the WINDOW_TRAY membership got nothing — they link by row
          // id. This is the id arriving. Silent by construction: it must
          // not appear in the trail (see navService.SILENT_CODES).
          if (after.targetId != null) nav.recordSilent('WINDOW_RESOLVED', after)
        }
      } catch (_) { /* the window is fine either way */ }
      // The window now knows what it holds — re-persist so the tray stores
      // the resolved address rather than whatever ref opened it.
      this._persist()
    },

    // The window mirrors its resolved header down for the parked tab.
    describe (id, label, icon) {
      const v = this.byId(id)
      if (!v) return
      if (label) v.label = label
      if (icon) v.icon = icon
      // The header the window resolved is the best name anyone has for
      // this element — give it to the trail stop too, so the strip's wide
      // tile letters it instead of the hash the window opened on.
      if (label) {
        try {
          const place = placeOf(v.target, label)
          if (place?.targetRoute) useNavStore().renameStop(place.targetRoute, label)
        } catch (_) { /* cosmetic */ }
      }
      this._persist()
    },

    focus (id) {
      useWindowsStore().focus('flyout:' + id)
    },

    close (id) {
      const i = this.viewers.findIndex(v => v.id === id)
      if (i >= 0) {
        this._record('CLOSE_WINDOW', this.viewers[i])
        this.viewers.splice(i, 1)
      }
      useWindowsStore().release('flyout:' + id)
      this._persist()
    },

    minimize (id) {
      const v = this.byId(id)
      if (!v) return
      v.minimized = true
      useWindowsStore().release('flyout:' + id)
      this._record('MINIMIZE_WINDOW', v)
      this._persist()
    },

    restore (id) {
      const v = this.byId(id)
      if (!v) return
      v.minimized = false
      this.focus(id)
      this._record('RESTORE_WINDOW', v)
      this._persist()
    },

    toggleMaximize (id) {
      const v = this.byId(id)
      if (!v) return
      v.maximized = !v.maximized
      // Only the growing half is an event — "maximized" is the act; coming
      // back down is the window returning to where it already was.
      if (v.maximized) this._record('MAXIMIZE_WINDOW', v)
      this._persist()
    },

    setRect (id, rect) {
      const v = this.byId(id)
      if (!v) return
      v.rect = { ...rect }
      // Geometry rides the same debounce as everything else, so a drag
      // costs one write on release rather than one per pointermove.
      this._persist()
    },

    setNatural (id, natural) {
      const v = this.byId(id)
      if (v) v.natural = natural ? { ...natural } : null
    }
  }
})
