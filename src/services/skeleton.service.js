import api from './api'

export const skeletonService = {
  async list (params = {}) {
    const { data } = await api.get('/skeletons', { params })
    return data
  },
  // Direct instances of a skeleton (children whose ancestor_id points at
  // this skeleton's id and isn't self-referencing). Enriched with title,
  // author, labels, excerpt for the Usages panel.
  async listInstances (id, params = {}) {
    const { data } = await api.get(`/skeletons/${id}/instances`, { params })
    return data
  },
  async get (id) {
    const { data } = await api.get(`/skeletons/${id}`)
    return data
  },
  // Paired (key, val) items by index-aligning the skeleton's two paths.
  // Used by SkeletonPage for directory-shaped skeletons (PATHOS_DOCS) where
  // both keys and vals carry meaningful content (file path / body, etc.).
  async items (id) {
    const { data } = await api.get(`/skeletons/${id}/items`)
    return data
  },

  // Generic slot walker. Returns { skeleton, slots: [{slotName, ref, refKind, refHash, pointerNodeId}] }.
  // The slot dispatcher uses this to render any template instance.
  async walk (id) {
    const { data } = await api.get(`/skeletons/${id}/walk`)
    return data
  },

  // Batch walk (dashboards, 2026-08-10): one request per grid, never one
  // walk per cell. payload: { ids?: [], refs?: [] } (≤24 combined) →
  // { walks: { <requested key>: walkResult | error envelope } }.
  async walkBatch (payload) {
    const { data } = await api.post('/skeletons/walk-batch', payload)
    return data
  },

  // Deep export (2026-08-01, data-ownership thread A): the skeleton
  // unraveled `depth` layers with chain evidence (format 'bundle'), or the
  // tabular projection of its instances (format 'rows').
  async exportDeep (id, { depth = 3, format = 'bundle', limit } = {}) {
    const { data } = await api.get(`/skeletons/${id}/export`, { params: { depth, format, limit } })
    return data
  },

  async templateHead (name) {
    const { data } = await api.get(`/skeletons/templates/${name}`)
    return data
  },

  // All schema heads (templates) with field inventories + constraints —
  // the schema builder's picker. `q` filters by schema name.
  async listTemplates (q = '') {
    const { data } = await api.get('/skeletons/templates', { params: q ? { q } : {} })
    return data
  },

  // Plant a user schema. slots: [{ name, kind? }], kind (constraint) ∈
  // entities|posts|nodes|labels|paths|skeletons (null = unconstrained).
  async createTemplate (name, slots) {
    const { data } = await api.post('/skeletons/templates', { name, slots })
    return data
  },

  // Fork a schema head into a new schema under a new name. Lineage is
  // recorded server-side (forked_from + spine ancestry). payload:
  // { name, slots?: [{ labelId|name, kind? }], dropSlots?: [names] } —
  // explicit slots replace the copy; dropSlots trims it; neither copies
  // the source's fields verbatim.
  async forkTemplate (id, payload) {
    const { data } = await api.post(`/skeletons/templates/${id}/fork`, payload)
    return data
  },

  // Append-only template edit: add slots to an owned template head.
  async addSlots (id, slots) {
    const { data } = await api.post(`/skeletons/${id}/slots`, { slots })
    return data
  },

  async instantiate (templateName, initialValues = {}) {
    const { data } = await api.post(`/skeletons/templates/${templateName}/instantiate`, { initialValues })
    return data
  },

  // Instantiate a template by skeleton id (the builder path).
  async instantiateById (templateId, initialValues = {}) {
    const { data } = await api.post(`/skeletons/${templateId}/instantiate`, { initialValues })
    return data
  },

  // Instance history: fork lineage + per-slot binding versions (each with
  // actor + NOTE textValue). params: { slot } narrows to one field's chain.
  async history (id, params = {}) {
    const { data } = await api.get(`/skeletons/${id}/history`, { params })
    return data
  },

  // Bind a slot on an instance. `value` is either a '<kind>/<hash>' ref
  // string or { text: '…' } — literal text mints a real NOTE node.
  // slotName is a label name (fields ARE labels) — encode it: user labels
  // aren't restricted to URL-safe tokens.
  async setSlot (id, slotName, value) {
    const body = (value && typeof value === 'object' && typeof value.text === 'string')
      ? { text: value.text }
      : { ref: value }
    const { data } = await api.put(`/skeletons/${id}/slot/${encodeURIComponent(slotName)}`, body)
    return data
  },

  // ── Resource machinery (dashboards phase 6, 2026-08-10) ─────────
  // Lock flips are versioned NOTEs on the element header (receipts);
  // a locked skeleton refuses every field write (403 40303).
  async lock (id) {
    const { data } = await api.post(`/skeletons/${id}/lock`)
    return data
  },
  async unlock (id) {
    const { data } = await api.post(`/skeletons/${id}/unlock`)
    return data
  },
  // Derived sums over paths-bound unit slots:
  // { slots: [{ slotName, derived: { op:'sum', unit, members, total } }] }.
  async resourceView (id) {
    const { data } = await api.get(`/skeletons/${id}/resource-view`)
    return data
  },

  // Resolve a "<kind>/<hash>" reference string to its primitive row.
  async resolveRef (ref) {
    const { data } = await api.get('/skeletons/resolve', { params: { ref } })
    return data
  },

  // Attached labels (via skeleton_label) with their ancestry chain.
  async labels (id) {
    const { data } = await api.get(`/skeletons/${id}/labels`)
    return data
  },

  // Find skeletons by a 3-tuple system label leaf (generic label lookup).
  async byLabel ({ rootName, parentName, leafName }) {
    const { data } = await api.get('/skeletons/by-label', {
      params: { rootName, parentName, leafName }
    })
    return data
  },

  // Resolve a CONTENT source name (line 2 of a doc's CONTENT node, e.g.
  // `architecture/overview.md`) to its skeleton — markdown cross-link
  // resolution. Returns { success, skeleton } (404 → success:false).
  async byContentName (name) {
    const { data } = await api.get('/skeletons/by-content-name', { params: { name } })
    return data
  },

  // Post-equivalent convenience surface
  async createPost (title, content) {
    const { data } = await api.post('/skeletons/posts', { title, content })
    return data
  },
  async commentOn (parentId, payload) {
    // Back-compat: callers used to pass a bare content string.
    const body = typeof payload === 'string'
      ? { content: payload }
      : (payload || {})
    const { data } = await api.post(`/skeletons/${parentId}/comment`, body)
    return data
  },
  async forkOf (parentId, payload = {}) {
    // payload: { authorEntityId?, labelIds? }
    // Fork is a snapshot — content is copied from the source automatically;
    // any `content` field on the payload is ignored by the API.
    const body = (payload && typeof payload === 'object') ? payload : {}
    const { data } = await api.post(`/skeletons/${parentId}/fork`, body)
    return data
  },
  async editContent (id, content) {
    const { data } = await api.put(`/skeletons/${id}/content`, { content })
    return data
  },
  async listChildren (id) {
    const { data } = await api.get(`/skeletons/${id}/children`)
    return data
  },
  // Thread ancestry of a comment: root-first chain of { kind, id, hash }
  // ending at the requested skeleton (root = first non-comment ancestor).
  async thread (id) {
    const { data } = await api.get(`/skeletons/${id}/thread`)
    return data
  },
  // Direct forks (top-level skeletons whose forked_from_id points at this one).
  // Forks are NOT INTERACTION_TREE children — they live as independent skeletons.
  async listForks (id) {
    const { data } = await api.get(`/skeletons/${id}/forks`)
    return data
  },
  async listVersions (id) {
    const { data } = await api.get(`/skeletons/${id}/versions`)
    return data
  },
  async listAttachments (id) {
    const { data } = await api.get(`/skeletons/${id}/attachments`)
    return data
  },
  async addAttachment (id, { targetType, targetId, label }) {
    const { data } = await api.post(`/skeletons/${id}/attachments`, { targetType, targetId, label })
    return data
  },

  // ── Voting on skeleton instances (post-equivalent) ──────────
  async getVotes (id) {
    const { data } = await api.get(`/skeletons/${id}/votes`)
    return data
  },
  async vote (id, direction) {
    const { data } = await api.post(`/skeletons/${id}/vote`, { direction })
    return data
  },
  async unvote (id) {
    const { data } = await api.delete(`/skeletons/${id}/vote`)
    return data
  }
}
