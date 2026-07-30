import api from './api'

// The event spine's REST half (Thread A). The push half is stores/events.js,
// which owns the one EventSource — these calls mint its token, catch up on
// what a closed tab missed, and ack what the user has seen.
export const eventService = {
  // Short-lived token for the SSE stream URL (EventSource can't send
  // Bearer headers, and the login JWT stays out of URLs).
  async token () {
    const { data } = await api.get('/events/token')
    return data
  },
  // { events, unread_count } — newest first; params: { unread: 1, limit }.
  async list (params = {}) {
    const { data } = await api.get('/events', { params })
    return data
  },
  // { ids: [...] } acks specific events, { upTo: id } everything ≤ id,
  // {} everything unread.
  async ack (payload = {}) {
    const { data } = await api.post('/events/ack', payload)
    return data
  }
}
