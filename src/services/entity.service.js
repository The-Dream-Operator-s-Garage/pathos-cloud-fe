import api from './api'

export const entityService = {
  async get (id) {
    const { data } = await api.get(`/entities/${id}`)
    return data
  },

  // Identity subtree of :id (nested alter-ego tree) + whether it belongs
  // to the caller's own identity tree.
  async alterEgos (id) {
    const { data } = await api.get(`/entities/${id}/alter-egos`)
    return data
  },

  // Mint a new alter-ego under entity :id (must be in the caller's tree).
  async createAlterEgo (id, { name, bio } = {}) {
    const { data } = await api.post(`/entities/${id}/alter-egos`, { name, bio })
    return data
  },

  // Template instances the entity owns (its "instantiations" section).
  // params: { page, limit, plumbing } — plumbing: '0' hides the system
  // schemas (ELEMENT, PATH, PIN, NAVIGATION).
  async listSkeletons (id, params = {}) {
    const { data } = await api.get(`/entities/${id}/skeletons`, { params })
    return data
  }
}
