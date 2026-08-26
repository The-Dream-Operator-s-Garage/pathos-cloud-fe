import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'

// The uploader's in-progress state — sibling of stores/maker.js. Every
// unsubmitted upload is a tab in the UploaderDock; link URLs and note text
// survive reloads via localStorage. Staged File objects can't be
// serialized, so the files themselves are session-only: a reload keeps the
// tab but empties its staging list. z-order against the other docked
// windows lives in stores/windows.js.

const LS_KEY = 'pathos_uploader_drafts'

// Tab label shared by the dock's tab strip and the footer minitab. It was
// keyed off the tab's MODE until 2026-08-26, when the dock's three methods
// (files / link / note) became simultaneous sections and the mode field
// died with the pills — so the label reads the tab's CONTENT in the
// sections' own order: staged files first, then the link's host, then the
// note's first line.
export const uploadLabel = (u) => {
  if (!u) return 'empty'
  let t = ''
  if (u.staged.length) {
    t = u.staged[0]?.name || ''
    if (u.staged.length > 1) t += ` +${u.staged.length - 1}`
  } else if ((u.linkUrl || '').trim()) {
    try { t = new URL(u.linkUrl).hostname } catch (_) { t = (u.linkUrl || '').trim() }
  } else {
    t = (u.noteText || '').split('\n').map(s => s.replace(/^#+\s*/, '').trim()).find(Boolean) || ''
  }
  return t.length > 24 ? t.slice(0, 23) + '…' : (t || 'empty')
}

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const blankUpload = () => ({
  id: newId(),
  authorEntityId: null,
  labelIds: [],
  // Full leaf-label objects so the LabelBox can re-render them on restore
  labels: [],
  linkUrl: '',
  noteText: '',
  // File objects staged for upload — in-memory only (see header comment)
  staged: [],
  // idle | busy | done — busy tabs keep uploading while another tab is
  // active. Since the three methods became simultaneous sections
  // (2026-08-26) `busyKind` says WHICH section's button is in flight
  // ('files' | 'link' | 'note'), so the other two can show as merely
  // disabled rather than as loading. Transient, like status.
  status: 'idle',
  busyKind: null,
  errors: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
})

export const useUploaderStore = defineStore('uploader', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    uploads: [],
    activeId: null,
    _loaded: false
  }),

  getters: {
    activeUpload: (s) => s.uploads.find(u => u.id === s.activeId) || null,
    uploadCount: (s) => s.uploads.length,
    busyCount: (s) => s.uploads.filter(u => u.status === 'busy').length
  },

  actions: {
    load () {
      if (this._loaded) return
      this._loaded = true
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (raw?.uploads?.length) {
          this.uploads = raw.uploads.map(u => ({
            ...blankUpload(),
            ...u,
            staged: [],
            status: 'idle',
            busyKind: null,
            errors: []
          }))
          this.activeId = this.uploads.some(u => u.id === raw.activeId)
            ? raw.activeId
            : this.uploads[0].id
        }
      } catch (_) { /* corrupted store — start clean */ }
    },

    persist () {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          uploads: this.uploads.map(({ staged, status, busyKind, errors, ...rest }) => rest),
          activeId: this.activeId
        }))
      } catch (_) { /* quota — uploads stay in memory */ }
    },

    open () {
      this.load()
      if (!this.uploads.length) this.addUpload()
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('uploader')
    },

    // NOTE: closing/minimizing does NOT cancel an armed skeleton-builder
    // capture — the last upload tab auto-closes the dock in the same tick
    // that delivers the capture. The builder's banner keeps its own cancel.
    close () {
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('uploader')
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('uploader')
    },
    restore () {
      this.isMinimized = false
      useWindowsStore().focus('uploader')
    },
    toggleMaximize () { this.isMaximized = !this.isMaximized },

    addUpload () {
      const u = blankUpload()
      this.uploads.push(u)
      this.activeId = u.id
      this.persist()
      return u
    },

    setActive (id) {
      if (this.uploads.some(u => u.id === id)) this.activeId = id
    },

    removeUpload (id) {
      const i = this.uploads.findIndex(u => u.id === id)
      if (i < 0) return
      this.uploads.splice(i, 1)
      if (this.activeId === id) {
        this.activeId = (this.uploads[i] || this.uploads[i - 1])?.id || null
      }
      if (!this.uploads.length) this.close()
      this.persist()
    },

    patchUpload (id, patch) {
      const u = this.uploads.find(x => x.id === id)
      if (!u) return
      Object.assign(u, patch, { updatedAt: Date.now() })
      this.persist()
    }
  }
})
