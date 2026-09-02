import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

// The post maker's in-progress state. Every unposted draft is a tab in the
// MakerDock; the whole set survives reloads via localStorage so half-written
// posts are never lost. Window state (minimized/maximized) lives here too so
// the dock can stay mounted in MainLayout and be driven from anywhere;
// z-order against the other docked windows lives in stores/windows.js.

const LS_KEY = 'pathos_maker_drafts'

// Tab label shared by the dock's tab strip and the footer minitab: the
// title, else the first non-empty body line, else a placeholder. Comment
// drafts (parent set) fall back to a "comment on …" placeholder so the
// tab reads as a reply even before any text exists.
export const draftLabel = (d) => {
  if (!d) return 'untitled'
  const t = (d.title || '').trim() ||
    (d.content || '').split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean) || ''
  const fallback = d.parent ? `comment on ${d.parent.kind} #${d.parent.id}` : 'untitled'
  return t.length > 24 ? t.slice(0, 23) + '…' : (t || fallback)
}

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const blankDraft = () => ({
  id: newId(),
  title: '',
  content: '',
  authorEntityId: null,
  labelIds: [],
  // Full leaf-label objects so the LabelBox can re-render them on restore
  labels: [],
  // [{ address, primary }] — appended to the CONTENT path after the body
  references: [],
  // Skeletons-to-be (skeletons plan phase 3): [{ id, keys: [{id,name}|null],
  // cells: [''], axis }] — a grid the author is filling that mints the
  // moment every key is set; its placeholder token ⟪skeleton:<id>⟫ sits
  // in the body until then. Persisted with the draft.
  grids: [],
  // Comment drafts: the element this post will belong to on submit.
  // { kind: 'post'|'comment'|'node', id, hash, route, label } — null for
  // ordinary posts. Persisted so a parked comment tab survives reloads.
  parent: null,
  createdAt: Date.now(),
  updatedAt: Date.now()
})

export const useMakerStore = defineStore('maker', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    drafts: [],
    activeId: null,
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
      useWindowsStore().focus('maker')
    },

    // NOTE: closing/minimizing does NOT cancel an armed skeleton-builder
    // capture — posting auto-closes/minimizes the dock in the same tick
    // that delivers the capture. The builder's banner keeps its own cancel.
    close () {
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('maker')
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('maker')
    },
    restore () {
      this.isMinimized = false
      useWindowsStore().focus('maker')
    },
    toggleMaximize () { this.isMaximized = !this.isMaximized },

    addDraft () {
      const d = blankDraft()
      this.drafts.push(d)
      this.activeId = d.id
      this.persist()
      return d
    },

    // Comment drafts — one per parent element. Reuses the existing draft
    // for the same parent so reopening a composer resumes the in-progress
    // comment instead of stacking duplicates. Does NOT open the dock: the
    // embedded composer edits the draft in place; the dock tab is only
    // surfaced when the embed closes with work left (see parkDraft).
    openCommentDraft (parent) {
      this.load()
      let d = this.drafts.find(x =>
        x.parent && x.parent.kind === parent.kind && x.parent.id === parent.id
      )
      if (!d) {
        d = blankDraft()
        d.parent = { ...parent }
        this.drafts.push(d)
      }
      this.activeId = d.id
      this.persist()
      return d
    },

    // Called when an embedded composer closes without posting. Empty
    // drafts are dropped; drafts with work stay as a tab and the dock is
    // parked minimized so its minitab is visible on the footer bar.
    parkDraft (id) {
      const d = this.drafts.find(x => x.id === id)
      if (!d) return
      const hasWork = (d.title || '').trim() || (d.content || '').trim() || d.references.length
      if (!hasWork) { this.removeDraft(id); return }
      if (!this.isOpen) {
        this.isOpen = true
        this.isMinimized = true
      }
      this.persist()
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
    }
  }
})
