import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useNavStore } from './navigation'

// ── THE CAPTURE WINDOW (2026-10-11, user ask: "a big round button sticking
// to the center of the bottom nav bar … unravels a circular menu around
// itself where we have 4 buttons: camera, record, note and the already
// existing upload one") — the quick-capture dock's state, sibling of
// stores/uploader.js.
//
// ONE window, three FACES (`mode`): a capture is a modal act — you are
// shooting, recording or writing, not all three — so the faces share one
// footprint, one minitab, one NAV_WINDOW leaf (CAPTURE) and one seat in
// stores/windows.js, and the mode strip under the frieze switches between
// them. The uploader stays its own window; the hub's fourth petal opens it.
//
// Only the NOTEPAD carries state worth keeping across reloads: the note in
// course (head node id, title, body, and what the last VERSION holds). The
// body ALSO autosaves server-side as the node's private draft (PUT
// /nodes/:id/draft), so the device copy is the TITLE's only home until the
// next version mints it with that name — see NotepadFace for the lifecycle.

const LS_KEY = 'pathos_capture'

export const CAPTURE_MODES = ['camera', 'recorder', 'notepad']

export const MODE_META = {
  camera: { label: 'Camera', icon: 'photo_camera', title: 'Take a photo or a video' },
  recorder: { label: 'Record', icon: 'mic', title: 'Record a voice note' },
  notepad: { label: 'Note', icon: 'edit_note', title: 'Write a note' }
}

// Minitab label: the face, or the note's title while the notepad is up.
export const captureLabel = (store) => {
  if (store.mode === 'notepad') {
    const t = (store.note.title || '').trim() || (store.note.body || '').split('\n').map(s => s.trim()).find(Boolean) || ''
    if (t) return t.length > 24 ? t.slice(0, 23) + '…' : t
  }
  return MODE_META[store.mode]?.label.toLowerCase() || 'capture'
}

const blankNote = () => ({
  // head node of the note's version chain — null until the first autosave
  // mints the origin
  nodeId: null,
  title: '',
  body: '',
  // what the last VERSION on the chain holds; dirty = the pair differs
  savedTitle: '',
  savedBody: '',
  updatedAt: 0
})

export const useCaptureStore = defineStore('capture', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    mode: 'camera',
    note: blankNote(),
    // This session's receipts — the captures just saved, newest first; the
    // dock draws them as node chips under the face (session-only).
    receipts: [],
    _loaded: false
  }),

  getters: {
    noteDirty: (s) => s.note.title !== s.note.savedTitle || s.note.body !== s.note.savedBody,
    noteHasWork: (s) => !!((s.note.title || '').trim() || (s.note.body || '').trim())
  },

  actions: {
    load () {
      if (this._loaded) return
      this._loaded = true
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (raw?.mode && CAPTURE_MODES.includes(raw.mode)) this.mode = raw.mode
        if (raw?.note && typeof raw.note === 'object') this.note = { ...blankNote(), ...raw.note }
      } catch (_) { /* corrupted store — start clean */ }
    },

    persist () {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ mode: this.mode, note: this.note }))
      } catch (_) { /* quota — the note stays in memory */ }
    },

    // `mode` picks the face the window opens on (a petal of the hub);
    // omitted, the window comes back on the face it last showed.
    open (mode) {
      this.load()
      if (mode && CAPTURE_MODES.includes(mode)) this.mode = mode
      // THE SUB-STACK: closed→open = "Opened capture" in the current stop
      // (see stores/maker.js for the rule).
      const wasClosed = !this.isOpen
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('capture')
      if (wasClosed) {
        try { useNavStore().recordDock('capture', 'open') } catch (_) { /* the window opens whether or not the log does */ }
      }
      this.persist()
    },

    close () {
      const wasOpen = this.isOpen
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('capture')
      if (wasOpen) {
        try { useNavStore().recordDock('capture', 'close') } catch (_) { /* cosmetic */ }
      }
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('capture')
    },
    restore () {
      this.isMinimized = false
      useWindowsStore().focus('capture')
    },
    toggleMaximize () { this.isMaximized = !this.isMaximized },

    setMode (mode) {
      if (!CAPTURE_MODES.includes(mode)) return
      this.mode = mode
      this.persist()
    },

    patchNote (patch) {
      Object.assign(this.note, patch, { updatedAt: Date.now() })
      this.persist()
    },

    resetNote () {
      this.note = blankNote()
      this.persist()
    },

    pushReceipt (r) {
      if (!r?.id) return
      this.receipts = [r, ...this.receipts.filter(x => x.id !== r.id)].slice(0, 12)
    }
  }
})
