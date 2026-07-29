import api from './api'

// Access doctrine (2026-07): content is private by default; public = the
// pioneer on the element's ACCESS path. See docs/concepts/access.md.
export const accessService = {
  // → { gated, public, canRead, owner_id, canManage, entries[] }
  async status (ref) {
    const { data } = await api.get('/access/status', { params: { ref } })
    return data
  },

  // Owner-only: append `entityId` to the element's ACCESS path.
  async grant (ref, entityId) {
    const { data } = await api.post('/access/grant', { ref, entityId })
    return data
  },

  // Grant-the-pioneer batch → the elements become public.
  async publish (refs) {
    const { data } = await api.post('/access/publish', { refs })
    return data
  },

  // The pre-publish reference tree of a draft body (or an existing ref).
  // → { tree: [{ address, kind, hash, id, summary, owned, public, gated, children[] }] }
  async tree ({ content = null, ref = null } = {}) {
    const { data } = await api.post('/access/tree', content != null ? { content } : { ref })
    return data
  },

  // Ask the element's owner for access (lands as a chat message + poll —
  // the request channel ships with the chat layer).
  async request (ref, message) {
    const { data } = await api.post('/access/request', { ref, message })
    return data
  }
}
