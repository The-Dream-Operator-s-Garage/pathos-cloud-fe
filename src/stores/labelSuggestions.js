import { defineStore } from 'pinia'
import { watch, effectScope } from 'vue'
import { nodeService } from 'src/services/node.service'
import { refreshLabels } from 'src/utils/elementLabels'
import { useEventsStore } from 'src/stores/events'

// TALAVERO'S LABEL SUGGESTIONS (2026-10-14) — the client end of the
// labeling loop (api/services/labelSuggestionService.js). Every upload
// site TRACKS its fresh nodes here; the server already asked the seat.
// A node waits until `labels.suggested` arrives on the push spine (or the
// poll net sees rows, or WAIT_MS runs out), then its pending suggestions
// sit in the tray until the uploader accepts or × discards each one.
// Session memory only: a tray shows what was uploaded in this sitting.
const WAIT_MS = 3 * 60 * 1000
const POLL_MS = 10 * 1000
const EMPTY_SHOW_MS = 8 * 1000 // "nothing to suggest" lingers, then the row leaves

// ⚠ The push watcher lives in its OWN detached scope: a `watch` made while
// a component's setup is running is owned by THAT component and dies when
// it unmounts (a dock closing) — while `_listening` stayed true, so it was
// never re-armed and every later answer was missed (2026-10-14 fix).
const pushScope = effectScope(true)

export const useLabelSuggestionsStore = defineStore('labelSuggestions', {
  state: () => ({
    // nodeId → { id, path, icon, since, waiting, items: [...] }
    byNode: {},
    order: [], // newest first
    now: Date.now(), // ticks while an "empty" notice is up, so it can leave
    _listening: false,
    _poll: null
  }),

  getters: {
    entriesFor: (state) => (ids) => {
      const want = ids ? new Set(ids.map(Number)) : null
      return state.order
        .filter((id) => !want || want.has(id))
        .map((id) => state.byNode[id])
        .filter((e) => e && (e.waiting || e.items.length || e.failed || e.emptyUntil > state.now))
    }
  },

  actions: {
    listen () {
      if (this._listening) return
      this._listening = true
      const events = useEventsStore()
      pushScope.run(() => watch(() => events.lastEvent, (ev) => {
        if (!ev || ev.kind !== 'labels.suggested') return
        const id = Number(ev.meta?.node_id)
        if (this.byNode[id]) this.refresh(id)
      }))
    },

    // nodes: [{ id, path }] fresh from an upload; icon = the door's glyph.
    track (nodes, icon = 'adjust') {
      this.listen()
      for (const n of nodes || []) {
        const id = Number(n?.id)
        if (!id) continue
        this.byNode[id] = { id, path: n.path, icon, since: Date.now(), waiting: true, failed: null, emptyUntil: 0, items: [] }
        this.order = [id, ...this.order.filter((x) => x !== id)].slice(0, 24)
      }
      this._armPoll()
    },

    // `answer` (server) = the seat's last word since the newest ask:
    // { count, failed } — so a missed push still settles the row.
    async refresh (id) {
      const e = this.byNode[id]
      if (!e) return
      try {
        const r = await nodeService.labelSuggestions(id)
        e.items = (r.suggestions || []).map((s) => ({ ...s, busy: false }))
        if (r.answer || e.items.length) {
          const wasWaiting = e.waiting
          e.waiting = false
          e.failed = r.answer?.failed || null
          if (wasWaiting && !e.items.length && !e.failed) this._showEmpty(e)
        }
      } catch (_) { /* the poll net tries again */ }
      if (e.waiting && Date.now() - e.since > WAIT_MS) {
        e.waiting = false
        e.failed = 'timeout'
      }
    },

    _showEmpty (e) {
      e.emptyUntil = Date.now() + EMPTY_SHOW_MS
      this.now = Date.now()
      setTimeout(() => { this.now = Date.now() }, EMPTY_SHOW_MS + 50)
    },

    // "couldn't look · retry" — ask the seat again for one node.
    async retry (id) {
      const e = this.byNode[id]
      if (!e || e.waiting) return
      e.failed = null
      e.waiting = true
      e.since = Date.now()
      try {
        const r = await nodeService.requestLabelSuggestions(id)
        if (!r?.success) throw new Error('not requested')
      } catch (_) {
        e.waiting = false
        e.failed = 'request'
        return
      }
      this._armPoll()
    },

    _armPoll () {
      if (this._poll) return
      this._poll = setInterval(() => {
        const waiting = this.order.filter((id) => this.byNode[id]?.waiting)
        if (!waiting.length) { clearInterval(this._poll); this._poll = null; return }
        for (const id of waiting) this.refresh(id)
      }, POLL_MS)
    },

    async decide (nodeId, sid, accept) {
      const e = this.byNode[nodeId]
      const item = e?.items.find((s) => s.id === sid)
      if (!item || item.busy) return
      item.busy = true
      try {
        const r = accept
          ? await nodeService.acceptLabelSuggestion(nodeId, sid)
          : await nodeService.discardLabelSuggestion(nodeId, sid)
        if (r?.success !== false) {
          e.items = e.items.filter((s) => s.id !== sid)
          item.busy = false
          // An accepted label lands on a node that may already be on screen
          // as a Mini — its label strip re-reads (2026-10-18).
          if (accept && e.path) refreshLabels(e.path)
        }
      } catch (_) {
        item.busy = false
      }
    }
  }
})
