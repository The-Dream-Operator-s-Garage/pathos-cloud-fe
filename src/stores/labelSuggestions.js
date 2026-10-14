import { defineStore } from 'pinia'
import { watch } from 'vue'
import { nodeService } from 'src/services/node.service'
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

export const useLabelSuggestionsStore = defineStore('labelSuggestions', {
  state: () => ({
    // nodeId → { id, path, icon, since, waiting, items: [...] }
    byNode: {},
    order: [], // newest first
    _listening: false,
    _poll: null
  }),

  getters: {
    entriesFor: (state) => (ids) => {
      const want = ids ? new Set(ids.map(Number)) : null
      return state.order
        .filter((id) => !want || want.has(id))
        .map((id) => state.byNode[id])
        .filter((e) => e && (e.waiting || e.items.length))
    }
  },

  actions: {
    listen () {
      if (this._listening) return
      this._listening = true
      const events = useEventsStore()
      watch(() => events.lastEvent, (ev) => {
        if (!ev || ev.kind !== 'labels.suggested') return
        const id = Number(ev.meta?.node_id)
        if (this.byNode[id]) this.refresh(id, { settle: true })
      })
    },

    // nodes: [{ id, path }] fresh from an upload; icon = the door's glyph.
    track (nodes, icon = 'adjust') {
      this.listen()
      for (const n of nodes || []) {
        const id = Number(n?.id)
        if (!id) continue
        this.byNode[id] = { id, path: n.path, icon, since: Date.now(), waiting: true, items: [] }
        this.order = [id, ...this.order.filter((x) => x !== id)].slice(0, 24)
      }
      this._armPoll()
    },

    async refresh (id, { settle = false } = {}) {
      const e = this.byNode[id]
      if (!e) return
      try {
        const r = await nodeService.labelSuggestions(id)
        e.items = (r.suggestions || []).map((s) => ({ ...s, busy: false }))
        if (settle || e.items.length) e.waiting = false
      } catch (_) { /* the poll net tries again */ }
      if (e.waiting && Date.now() - e.since > WAIT_MS) e.waiting = false
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
        if (r?.success !== false) e.items = e.items.filter((s) => s.id !== sid)
      } catch (_) {
        item.busy = false
      }
    }
  }
})
