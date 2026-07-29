import api from './api'

export const nodeService = {
  async create (payload) {
    const { data } = await api.post('/nodes', payload)
    return data
  },
  // Batch file upload — formData: files[] + authorEntityId? + labelIds
  // (JSON string, applied to every file). Returns { success, nodes, errors }.
  async upload (formData) {
    const { data } = await api.post('/nodes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },
  async get (id) {
    const { data } = await api.get(`/nodes/${id}`)
    return data
  },
  async list (params = {}) {
    const { data } = await api.get('/nodes', { params })
    return data
  },
  // Uploader dock's file explorer — paginated upload-backed FILE nodes.
  // params: { q?, page?, limit? } → { success, nodes, total, page, limit, hasMore }
  // (each node: file descriptor + name (original filename) + user labels).
  async listUploads (params = {}) {
    const { data } = await api.get('/nodes/uploads', { params })
    return data
  },
  async update (id, payload) {
    const { data } = await api.put(`/nodes/${id}`, payload)
    return data
  },
  async getByPath (path) {
    const { data } = await api.get(`/nodes/by-path/${encodeURIComponent(path)}`)
    return data
  },
  async addLabel (nodeId, labelId) {
    const { data } = await api.post(`/nodes/${nodeId}/labels`, { labelId })
    return data
  },

  // ── Node-side comment / fork / children / versions ─────────
  // A comment or fork on a node creates a POST instance whose PARENT slot
  // points at this specific node version. Listing children walks the
  // action audit (target_type='node'). getVersions walks node.ancestor_id
  // both directions so the UI can flag stale references.
  async commentOnNode (id, payload) {
    // payload: { content, authorEntityId?, labelIds? }
    const { data } = await api.post(`/nodes/${id}/comment`, payload)
    return data
  },
  async forkOfNode (id, payload = {}) {
    // payload: { authorEntityId?, labelIds? }
    // Fork is a snapshot — content is copied from the source automatically.
    // The forker edits content afterward via the draft+promote flow.
    const { data } = await api.post(`/nodes/${id}/fork`, payload)
    return data
  },
  async listChildrenOfNode (id) {
    const { data } = await api.get(`/nodes/${id}/children`)
    return data
  },
  async getVersions (id) {
    const { data } = await api.get(`/nodes/${id}/versions`)
    return data
  },

  // ── Owner-only draft + promote (auto-save + explicit publish) ─
  async getDraft (id) {
    const { data } = await api.get(`/nodes/${id}/draft`)
    return data
  },
  async saveDraft (id, payload) {
    // payload: { content?, typeId? }
    const { data } = await api.put(`/nodes/${id}/draft`, payload)
    return data
  },
  async discardDraft (id) {
    const { data } = await api.delete(`/nodes/${id}/draft`)
    return data
  },
  async promote (id) {
    const { data } = await api.post(`/nodes/${id}/promote`)
    return data
  }
}
