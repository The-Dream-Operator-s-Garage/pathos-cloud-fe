import api from './api'

// Post-centric API client.
// Every Create / Comment / Fork goes through here.
export const postService = {
  // ── canonical CRUD ─────────────────────────────────────────
  async create (payload) {
    const { data } = await api.post('/posts', payload)
    return data
  },
  async list (params = {}) {
    const { data } = await api.get('/posts', { params })
    return data
  },
  async get (id) {
    const { data } = await api.get(`/posts/${id}`)
    return data
  },
  async edit (id, payload) {
    const { data } = await api.put(`/posts/${id}`, payload)
    return data
  },

  // ── post-tree (comments and forks are child posts) ─────────
  async commentOn (parentPostId, payload) {
    // payload: { content, authorEntityId?, labelIds? }
    const { data } = await api.post(`/posts/${parentPostId}/comment`, payload)
    return data
  },
  async forkOf (parentPostId, payload = {}) {
    // payload: { authorEntityId?, labelIds? }
    // Fork is a snapshot — content is copied from the source automatically.
    // The forker edits content afterward via the draft+promote flow.
    const { data } = await api.post(`/posts/${parentPostId}/fork`, payload)
    return data
  },

  // ── Owner-only content draft + promote ─────────────────────
  async getDraft (id) {
    const { data } = await api.get(`/posts/${id}/draft`)
    return data
  },
  async saveDraft (id, payload) {
    // payload: { content }
    const { data } = await api.put(`/posts/${id}/draft`, payload)
    return data
  },
  async discardDraft (id) {
    const { data } = await api.delete(`/posts/${id}/draft`)
    return data
  },
  async promote (id) {
    const { data } = await api.post(`/posts/${id}/promote`)
    return data
  },
  async getComments (id) {
    const { data } = await api.get(`/posts/${id}/comments`)
    return data
  },
  async getForks (id) {
    const { data } = await api.get(`/posts/${id}/forks`)
    return data
  },

  // ── version history ────────────────────────────────────────
  async getVersions (id) {
    const { data } = await api.get(`/posts/${id}/versions`)
    return data
  },

  // ── attachments (polymorphic) ──────────────────────────────
  async getAttachments (id) {
    const { data } = await api.get(`/posts/${id}/attachments`)
    return data
  },
  async addAttachment (id, payload) {
    const { data } = await api.post(`/posts/${id}/attachments`, payload)
    return data
  },

  // ── direct interactions ────────────────────────────────────
  async getVotes (id) {
    const { data } = await api.get(`/posts/${id}/votes`)
    return data
  },
  async vote (id, direction) {
    const { data } = await api.post(`/posts/${id}/vote`, { direction })
    return data
  },
  async unvote (id) {
    const { data } = await api.delete(`/posts/${id}/vote`)
    return data
  }
}
