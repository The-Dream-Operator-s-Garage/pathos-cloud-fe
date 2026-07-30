import { defineStore } from 'pinia'
import api from 'src/services/api'
import { eventService } from 'src/services/event.service'

// The push spine's client end (Thread A, 2026-07-29): ONE EventSource for
// the whole app, owned here. MainLayout connects it after login; surfaces
// react by watching `lastEvent` (ChatDock live-appends its open
// conversation) and `unreadCount` (the NavigationBar badge).
//
// Reconnection is OURS, not EventSource's: the stream URL carries a
// short-lived token, so the browser's automatic retry would replay an
// expired credential forever. On error we close, wait, mint a fresh token
// and reconnect — passing the last seen event id so the server replays
// what the gap missed (same contract as the browser's Last-Event-ID).
const RECONNECT_MS = 4000

export const useEventsStore = defineStore('events', {
  state: () => ({
    connected: false,
    unreadCount: 0,
    // The most recent PUSHED event — a signal surface, not a log: every
    // arrival replaces it, and watchers react to the change.
    lastEvent: null,
    lastEventId: null,
    _source: null,
    _retryTimer: null
  }),

  actions: {
    async connect () {
      if (this._source || !localStorage.getItem('pathos_token')) return
      let token = null
      try {
        const r = await eventService.token()
        token = r.token
      } catch (_) {
        this._scheduleReconnect()
        return
      }

      const base = api.defaults.baseURL.replace(/\/$/, '')
      let url = `${base}/events/stream?t=${encodeURIComponent(token)}`
      if (this.lastEventId != null) url += `&lastEventId=${this.lastEventId}`

      const source = new EventSource(url)
      this._source = source
      source.onopen = () => { this.connected = true }
      source.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          this.lastEventId = payload.id
          if (!payload.read_at) this.unreadCount += 1
          this.lastEvent = payload
        } catch (_) { /* heartbeats and comments never reach onmessage */ }
      }
      source.onerror = () => {
        this.disconnect({ keepCursor: true })
        this._scheduleReconnect()
      }

      this.refreshUnread()
    },

    _scheduleReconnect () {
      clearTimeout(this._retryTimer)
      this._retryTimer = setTimeout(() => this.connect(), RECONNECT_MS)
    },

    disconnect ({ keepCursor = false } = {}) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
      if (this._source) this._source.close()
      this._source = null
      this.connected = false
      if (!keepCursor) this.lastEventId = null
    },

    async refreshUnread () {
      try {
        const r = await eventService.list({ unread: 1, limit: 1 })
        if (r.success) this.unreadCount = r.unread_count
      } catch (_) { /* badge keeps its last count */ }
    },

    // Ack specific events (the targeted form ChatDock uses for the open
    // conversation's arrivals).
    async ack (ids) {
      if (!ids?.length) return
      try {
        const r = await eventService.ack({ ids })
        if (r.success) await this.refreshUnread()
      } catch (_) { /* stays unread */ }
    },

    // Ack EVERYTHING unread — the badge's coarse v1 semantics: opening the
    // chat dock marks the queue seen (every current kind lands in a chat
    // surface or a poll band the dock shows).
    async ackAll () {
      try {
        const r = await eventService.ack({})
        if (r.success) this.unreadCount = 0
      } catch (_) { /* stays unread */ }
    }
  }
})
