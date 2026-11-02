import api from './api'

// The bug dock's door (2026-11-02) — api/services/bugReportService.js.
export const bugService = {
  // { labels: { failure, idea }, mail_to, transport, limits }
  async meta () {
    const { data } = await api.get('/bugs')
    return data
  },
  // payload: { kind, title, body, screenshots: [nodeId], refs: [{ ref, label }],
  //   context, public } → { success, skeleton: { id, path, ref }, label, public, mail }
  async file (payload) {
    const { data } = await api.post('/bugs', payload)
    return data
  }
}
