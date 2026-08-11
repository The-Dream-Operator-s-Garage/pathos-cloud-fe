import api from './api'

// Dashboards (dashboards plan phase 3, 2026-08-10) — personal viewing
// instruments over /api/dashboards*. Every call acts as the ACTING
// entity; dashboards are private by default.
export const dashboardService = {
  // The window's boot read: ensure=1 mints the default USER_HOME first.
  async listMine ({ ensure = false } = {}) {
    const { data } = await api.get('/dashboards', { params: ensure ? { ensure: 1 } : {} })
    return data
  },

  // Mint a dashboard. payload: { name?, templateId? } (templateId = any
  // DASHBOARD-descended schema head; default = the DASHBOARD base).
  async create (payload = {}) {
    const { data } = await api.post('/dashboards', payload)
    return data
  },

  // Card + ordered ITEMS (link_id/kind/ref per row — feed walkBatch with
  // the refs) + parsed LAYOUT JSON (null when unset/unparseable).
  async get (id) {
    const { data } = await api.get(`/dashboards/${id}`)
    return data
  },

  async addItem (id, ref) {
    const { data } = await api.post(`/dashboards/${id}/items`, { ref })
    return data
  },

  async removeItem (id, linkId) {
    const { data } = await api.delete(`/dashboards/${id}/items/${linkId}`)
    return data
  },

  // layout: the grid/split-tree object (stringified server-side into the
  // versioned LAYOUT NOTE — every save is history).
  async saveLayout (id, layout) {
    const { data } = await api.put(`/dashboards/${id}/layout`, { layout })
    return data
  }
}
