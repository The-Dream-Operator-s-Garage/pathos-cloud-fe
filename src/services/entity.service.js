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
  // 2026-07-30: `inherit {photo, bio}` copies from the root profile;
  // `discloseOrigin` publishes the ORIGIN node at birth (default private —
  // the operator stands behind the identity only by choice).
  async createAlterEgo (id, { name, bio, inherit, discloseOrigin } = {}) {
    const { data } = await api.post(`/entities/${id}/alter-egos`, { name, bio, inherit, discloseOrigin })
    return data
  },

  // The lineage chain (2026-07-30): alter-ego ancestry up to the root
  // (disclosure-gated per edge for non-owners) then the invite chain to
  // the pioneer. `concealed: true` terminates an undisclosed walk.
  async origin (id) {
    const { data } = await api.get(`/entities/${id}/origin`)
    return data
  },

  // Owner-only disclosure switch — flips the ORIGIN node's publish state.
  async setOriginDisclosure (id, disclose) {
    const { data } = await api.post(`/entities/${id}/origin-disclosure`, { disclose })
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
