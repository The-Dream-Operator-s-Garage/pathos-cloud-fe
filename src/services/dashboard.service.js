import api from './api'

// Dashboards (dashboards plan phase 3, 2026-08-10; phase 9, 2026-10-19)
// — boards over /api/dashboards*. Every call acts as the ACTING entity;
// dashboards are private by default, readable by whoever the owner
// grants, written by the owner only.
export const dashboardService = {
  // The window's boot read: ensure=1 mints the default USER_HOME first.
  async listMine ({ ensure = false } = {}) {
    const { data } = await api.get('/dashboards', { params: ensure ? { ensure: 1 } : {} })
    return data
  },

  // Mint a dashboard. A dashboard needs its FIRST element: `ref` (the
  // root slot) or `fills` ({ FIELD: '<kind>/<hash>' } — a template's
  // components, with `templateId` = any DASHBOARD-descended schema head).
  async create ({ name = null, templateId = null, ref = null, fills = null } = {}) {
    const { data } = await api.post('/dashboards', { name, templateId, ref, fills })
    return data
  },

  // Card + ITEMS (the index) + the normalized LAYOUT tree ({ v: 2, root })
  // + the component `slots` ([{ name, kind, ref }]) + `template` +
  // `can_write`. One read per board; the leaves self-resolve.
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

  // layout: { v: 2, root } — stringified server-side into the versioned
  // LAYOUT NOTE (every save is history); ITEMS is synced from the tree.
  async saveLayout (id, layout) {
    const { data } = await api.put(`/dashboards/${id}/layout`, { layout })
    return data
  },

  // ── templates (phase 9) ────────────────────────────────────────────
  // The heads the caller may instantiate, each with its `components`
  // ([{ name, kind }]) and its header `layout` ({slot} leaves).
  async listTemplates () {
    const { data } = await api.get('/dashboards/templates')
    return data
  },

  // Mint a template: { name, slots: [{ name, kind? }], layout? }.
  async createTemplate (payload) {
    const { data } = await api.post('/dashboards/templates', payload)
    return data
  },

  // A board becomes a template (one component per leaf, its tree with
  // {slot} leaves).
  async saveAsTemplate (id, name) {
    const { data } = await api.post(`/dashboards/${id}/template`, { name })
    return data
  }
}
