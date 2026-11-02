import { defineStore } from 'pinia'
import { useWindowsStore } from './windows'
import { useNavStore } from './navigation'

// ── THE BUG DOCK (2026-11-02, user ask: "a big debug bug button of the
// caliber and style of the creation ones on the footer nav bar. This bug
// thing is nothing but a simple notepad that allows item references and
// screenshot attachments to document failures and bugs. Those are public by
// default when saved, and mailed directly to allegue@pathos.cloud. Make sure
// the interface is enough for a user to report a failure or for me to write
// an idea that I want to feed into a prompt layer to fix something").
//
// ONE window, ONE draft, two KINDS: a failure (DEVELOPMENT > BUG REPORT) or
// an idea (DEVELOPMENT > CHANGE REQUEST — the leaf the resident's prompt
// loop reads). The kind strip switches the placeholder, the outline and the
// word on the save button; the note, its refs and its screenshots stay put
// across a switch (you started describing a failure and it turned into the
// fix — same text). Filing is POST /api/bugs (services/bug.service.js),
// which mints the post, publishes it unless `isPublic` is off, and mails it.
//
// The draft persists on the device (localStorage) so a reload or a closed
// window never eats a half-written report. Screenshots are uploaded the
// moment they are added (POST /nodes/upload, capture=screen — private until
// the report publishes them), so the draft keeps NODE IDS, never bytes.

const LS_KEY = 'pathos_bugs'

export const BUG_KINDS = ['failure', 'idea']

export const KIND_META = {
  failure: {
    label: 'Failure',
    icon: 'report',
    title: 'Something broke — what happened, what you expected, how to get there',
    verb: 'File bug',
    placeholder: 'What happened? What did you expect instead? The steps that got you there…',
    outline: '## What happened\n\n\n## Expected\n\n\n## Steps\n1. \n'
  },
  idea: {
    label: 'Idea',
    icon: 'tips_and_updates',
    title: 'A fix or an idea, written as you would hand it to the prompt layer',
    verb: 'File idea',
    placeholder: 'The change, written as a prompt: what to do, where it lives, how we know it worked…',
    outline: '## Goal\n\n\n## Where\n\n\n## Done when\n- \n'
  }
}

// Minitab label: the title, else the note's first line, else the kind.
export const bugLabel = (store) => {
  const d = store.draft
  const t = (d.title || '').trim() || (d.body || '').split('\n').map(s => s.replace(/^[#>*\-\s]+/, '').trim()).find(Boolean) || ''
  if (t) return t.length > 24 ? t.slice(0, 23) + '…' : t
  return store.kind === 'idea' ? 'idea' : 'bug'
}

const blankDraft = () => ({
  title: '',
  body: '',
  // [{ ref: 'kind/hash', kind, label }]
  refs: [],
  // [{ id, path, url, name }] — uploaded FILE nodes (capture=screen)
  shots: [],
  // the page you were on + viewport + locale ride the report
  withContext: true,
  // ⭐ public by default (the ask); untick to keep the post owner-only —
  // the letter still goes
  isPublic: true
})

export const useBugsStore = defineStore('bugs', {
  state: () => ({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    kind: 'failure',
    draft: blankDraft(),
    // GET /api/bugs — the two labels (for the feed lenses), the mail address
    meta: null,
    // reports filed this session, newest first: { id, path, kind, mailed }
    receipts: [],
    _loaded: false
  }),

  getters: {
    hasWork: (s) => !!((s.draft.title || '').trim() || (s.draft.body || '').trim() || s.draft.shots.length || s.draft.refs.length)
  },

  actions: {
    load () {
      if (this._loaded) return
      this._loaded = true
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
        if (raw?.kind && BUG_KINDS.includes(raw.kind)) this.kind = raw.kind
        if (raw?.draft && typeof raw.draft === 'object') {
          const d = { ...blankDraft(), ...raw.draft }
          d.refs = Array.isArray(d.refs) ? d.refs.filter(r => r && r.ref) : []
          // an upload still in flight when the page went away never finished
          d.shots = Array.isArray(d.shots) ? d.shots.filter(s => s && s.id) : []
          this.draft = d
        }
      } catch (_) { /* corrupted store — start clean */ }
    },

    persist () {
      try {
        const d = { ...this.draft, shots: this.draft.shots.filter(s => s.id).map(({ id, path, url, name }) => ({ id, path, url, name })) }
        localStorage.setItem(LS_KEY, JSON.stringify({ kind: this.kind, draft: d }))
      } catch (_) { /* quota — the draft stays in memory */ }
    },

    open (kind) {
      this.load()
      if (kind && BUG_KINDS.includes(kind)) this.kind = kind
      // THE SUB-STACK: closed→open = "Opened bug dock" in the current stop
      // (see stores/maker.js for the rule).
      const wasClosed = !this.isOpen
      this.isOpen = true
      this.isMinimized = false
      useWindowsStore().focus('bugs')
      if (wasClosed) {
        try { useNavStore().recordDock('bugs', 'open') } catch (_) { /* the window opens whether or not the log does */ }
      }
      this.persist()
    },

    close () {
      const wasOpen = this.isOpen
      this.isOpen = false
      this.isMinimized = false
      this.isMaximized = false
      useWindowsStore().release('bugs')
      if (wasOpen) {
        try { useNavStore().recordDock('bugs', 'close') } catch (_) { /* cosmetic */ }
      }
    },

    // The chip's three-step toggle (the makers' and chat's): shut → open,
    // parked → restore, standing → close.
    toggle () {
      if (!this.isOpen) this.open()
      else if (this.isMinimized) this.restore()
      else this.close()
    },

    minimize () {
      this.isMinimized = true
      useWindowsStore().release('bugs')
    },
    restore () {
      this.isMinimized = false
      useWindowsStore().focus('bugs')
    },
    toggleMaximize () { this.isMaximized = !this.isMaximized },

    setKind (kind) {
      if (!BUG_KINDS.includes(kind)) return
      this.kind = kind
      this.persist()
    },

    patch (p) {
      Object.assign(this.draft, p)
      this.persist()
    },

    addRef (r) {
      if (!r?.ref || this.draft.refs.some(x => x.ref === r.ref)) return false
      this.draft.refs.push({ ref: r.ref, kind: r.kind || r.ref.split('/')[0], label: r.label || '' })
      this.persist()
      return true
    },
    removeRef (ref) {
      this.draft.refs = this.draft.refs.filter(x => x.ref !== ref)
      this.persist()
    },

    // A screenshot row is pushed while it uploads (`key`, a local preview,
    // `busy`) and completed with its node once the upload answers.
    pushShot (s) {
      this.draft.shots.push(s)
    },
    settleShot (key, patch) {
      const s = this.draft.shots.find(x => x.key === key)
      if (s) Object.assign(s, patch)
      this.persist()
    },
    removeShot (key) {
      this.draft.shots = this.draft.shots.filter(x => (x.key || x.id) !== key)
      this.persist()
    },

    resetDraft () {
      const keep = { withContext: this.draft.withContext, isPublic: this.draft.isPublic }
      this.draft = { ...blankDraft(), ...keep }
      this.persist()
    },

    pushReceipt (r) {
      if (!r?.id) return
      this.receipts = [r, ...this.receipts.filter(x => x.id !== r.id)].slice(0, 8)
    }
  }
})
