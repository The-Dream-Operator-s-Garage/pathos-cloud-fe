import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

// The skeleton builder is now a SCHEMA workshop only: every tab either
// defines a brand-new schema (named fields, each declaring which element
// kind — its constraint — the field accepts) or extends one you own
// (append-only new fields). Instances are NOT populated here — instantiating
// a schema mints an empty instance and drops you on its /skeletons/:id
// viewer, where the fields are filled as an editable table.
//
// Drafts survive reloads via localStorage; window flags live here, z-order
// in windows.js.
//
// `populate` is a separate, page-driven channel: while the SkeletonPage is
// filling an owned instance it registers the instance id here so a fresh
// element created in the maker/uploader (Upload / Build buttons) is routed
// back to the page's "just created" tray instead of navigating away.

const LS_KEY = 'pathos_skeleton_builder'

export const builderLabel = (d) => {
  if (!d) return 'untitled'
  if (d.mode === 'start') return 'new'
  const t = (d.name || '').trim()
  return t.length > 24 ? t.slice(0, 23) + '…' : (t || 'untitled')
}

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// One shape for both modes so a 'start' tab can become a 'define' tab
// without migration. mode: 'start' (chooser) | 'define' (naming fields).
const blankDraft = () => ({
  id: newId(),
  mode: 'start',
  name: '',
  // A field IS a label: labelId + its display name (legacy drafts may still
  // carry a bare name, which submits through the SLOT-leaf path).
  fields: [{ labelId: null, name: '', kind: null }],
  // set once the schema exists on the server: 'define' then appends new
  // fields via /skeletons/:id/slots instead of re-creating.
  templateId: null,
  // when extending: { id, name, slots: [{ slotName, kind }] } — the
  // existing (locked) fields shown above the new ones.
  template: null,
  // when forking: { id, name } of the source schema — submit goes through
  // POST /skeletons/templates/:id/fork so the new schema records lineage.
  forkOf: null,
  createdAt: Date.now(),
  updatedAt: Date.now()
})

export const useSkeletonBuilderStore = defineStore('skeletonBuilder', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    drafts: [],
    activeId: null,
    // { skeletonId, fresh: [{ kind, address, primary }] } — an active
    // inline populate session on a SkeletonPage instance viewer.
    populate: null,
    _loaded: false
  }),

  getters: {
    activeDraft: (s) => s.drafts.find(d => d.id === s.activeId) || null,
    draftCount: (s) => s.drafts.length
  },

  actions: {
    load () {
      if (this._loaded) return
      this._loaded = true
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (raw?.drafts?.length) {
          this.drafts = raw.drafts
          this.activeId = raw.drafts.some(d => d.id === raw.activeId)
            ? raw.activeId
            : raw.drafts[0].id
        }
      } catch (_) { /* corrupted store — start clean */ }
    },

    persist () {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          drafts: this.drafts,
          activeId: this.activeId
        }))
      } catch (_) { /* quota — drafts stay in memory */ }
    },

    open () {
      this.load()
      if (!this.drafts.length) this.addDraft()
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('skeletonBuilder')
    },

    close () {
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('skeletonBuilder')
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('skeletonBuilder')
    },
    restore () {
      this.load()
      this.isMinimized = false
      useWindowsStore().focus('skeletonBuilder')
    },
    toggleMaximize () { this.isMaximized = !this.isMaximized },

    addDraft () {
      const d = blankDraft()
      this.drafts.push(d)
      this.activeId = d.id
      this.persist()
      return d
    },

    _show () {
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('skeletonBuilder')
      this.persist()
    },

    // Route a walked skeleton into the dock. Pure state work — callers fetch
    // the walk themselves. Only SCHEMAS (origin + SCHEMA classification)
    // open here; instances are populated on their own viewer. Returns:
    //   'extend' — your schema, opened for append-only new fields
    //   'fork'   — someone else's schema, opened as a new schema prefilled
    //              with its fields (rename + modify, then create your own)
    //   'instance' — not a schema (caller navigates to the viewer instead)
    openFromWalk (walk, viewerEntityId) {
      this.load()
      const sk = walk.skeleton
      const isSchema = !!sk.is_schema
      if (!isSchema) return 'instance'

      const slots = (walk.slots || []).map(s => ({ slotName: s.slotName, labelId: s.slotLabelId || null, kind: s.expectedKind || null }))
      const isMine = sk.owner_id === viewerEntityId

      if (isMine) {
        let d = this.drafts.find(x => x.mode === 'define' && x.templateId === sk.id)
        if (!d) {
          d = (this.activeDraft?.mode === 'start') ? this.activeDraft : this.addDraft()
          d.fields = [{ labelId: null, name: '', kind: null }]
        }
        d.mode = 'define'
        d.templateId = sk.id
        d.name = sk.name
        d.template = { id: sk.id, name: sk.name, slots }
        d.forkOf = null
        this.activeId = d.id
        this._show()
        return 'extend'
      }

      // Fork someone else's schema: prefill a fresh define form with its
      // fields so the user renames + tweaks. Submit goes through the
      // server-side schema fork, so the new schema keeps its lineage.
      this._forkDraftFrom(sk, slots)
      return 'fork'
    },

    // The explicit Fork affordance (viewer button) — ALWAYS opens a fork
    // draft, ownership-independent: forking your own schema is how you
    // branch a variant under a new name. The fork inherits the SCHEMA
    // side (editable keys + constraints), never the source's name.
    openForkDraft (walk) {
      this.load()
      const sk = walk.skeleton
      if (!sk?.is_schema) return 'instance'
      const slots = (walk.slots || []).map(s => ({ slotName: s.slotName, labelId: s.slotLabelId || null, kind: s.expectedKind || null }))
      this._forkDraftFrom(sk, slots)
      return 'fork'
    },

    _forkDraftFrom (sk, slots) {
      const d = (this.activeDraft?.mode === 'start') ? this.activeDraft : this.addDraft()
      d.mode = 'define'
      d.templateId = null
      d.name = ''
      d.template = null
      d.forkOf = { id: sk.id, name: sk.name }
      d.fields = slots.length
        ? slots.map(s => ({ labelId: s.labelId || null, name: s.slotName, kind: s.kind || null }))
        : [{ labelId: null, name: '', kind: null }]
      this.activeId = d.id
      this._show()
    },

    setActive (id) {
      if (this.drafts.some(d => d.id === id)) this.activeId = id
    },

    removeDraft (id) {
      const i = this.drafts.findIndex(d => d.id === id)
      if (i < 0) return
      this.drafts.splice(i, 1)
      if (this.activeId === id) {
        this.activeId = (this.drafts[i] || this.drafts[i - 1])?.id || null
      }
      if (!this.drafts.length) this.close()
      this.persist()
    },

    patchDraft (id, patch) {
      const d = this.drafts.find(x => x.id === id)
      if (!d) return
      Object.assign(d, patch, { updatedAt: Date.now() })
      this.persist()
    },

    // ── Populate channel (SkeletonPage-driven) ────────────────
    beginPopulate (skeletonId) {
      this.populate = { skeletonId, fresh: [] }
    },
    endPopulate () {
      this.populate = null
    },
    // Called by MainLayout when the maker/uploader mints an element. If a
    // populate session is live, the fresh element joins its tray and the
    // caller skips navigation. Returns true when consumed.
    deliverFresh (kind, address, primary) {
      if (!this.populate || !address) return false
      this.populate = {
        ...this.populate,
        fresh: [{ kind, address, primary: primary || '' }, ...this.populate.fresh]
      }
      return true
    }
  }
})
