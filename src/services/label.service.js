import api from './api'

export const labelService = {
  async create (payload) {
    const { data } = await api.post('/labels', payload)
    return data
  },
  async update (id, payload) {
    // PUT /labels/:id — owner-only: { name } renames, { ancestorId } re-hangs
    // the label (with its subtree) under another OWNED label; ancestorId:null
    // detaches it into a root. 403 on system labels or foreign trees.
    const { data } = await api.put(`/labels/${id}`, payload)
    return data
  },
  async fork (id, payload = {}) {
    // POST /labels/:id/fork — deep-copy the subtree rooted at :id into
    // labels the caller owns. Optional { ancestorId } hangs the fork under
    // an owned label; default lands it as a new root.
    const { data } = await api.post(`/labels/${id}/fork`, payload)
    return data
  },
  async suggest (id, payload) {
    // POST /labels/:id/suggest { name, message? } — propose a label for a
    // tree you don't own: drops a message + label-suggestion poll into
    // your chat with the owner (yes → the label joins THEIR tree under
    // :id). 409 code 40902 when the name exists or a poll is pending.
    const { data } = await api.post(`/labels/${id}/suggest`, payload)
    return data
  },
  async remove (id) {
    // DELETE /labels/:id — owner-only, non-system BRANCH delete: the
    // label + every descendant + their attachments. 409 code 40903 when
    // the branch keys skeleton fields (schemas would lose their names).
    const { data } = await api.delete(`/labels/${id}`)
    return data
  },
  async get (id) {
    const { data } = await api.get(`/labels/${id}`)
    return data
  },
  async getChain (id) {
    const { data } = await api.get(`/labels/${id}/chain`)
    return data
  },
  async getChildren (id) {
    const { data } = await api.get(`/labels/${id}/children`)
    return data
  },
  async listRoots (params = {}) {
    const { data } = await api.get('/labels/roots', { params })
    return data
  },
  async search (q, limit = 20) {
    const { data } = await api.get('/labels/search', { params: { q, limit } })
    return data
  },
  async getTree (id) {
    // Returns the full ancestor chain + immediate children in one call
    const { data } = await api.get(`/labels/${id}/tree`)
    return data
  },
  async getUsages (id, limit = 12) {
    // Everywhere this label is attached across the primal element kinds:
    // { usages: { entities, nodes, paths, skeletons }, totals, total }
    const { data } = await api.get(`/labels/${id}/usages`, { params: { limit } })
    return data
  },
  async getEntityLabels (entityId) {
    const { data } = await api.get(`/labels/entity/${entityId}`)
    return data
  },
  async listLeaves () {
    // Every leaf label across the tree, with parent info, for the LabelPicker
    const { data } = await api.get('/labels/leaves')
    return data
  }
}
