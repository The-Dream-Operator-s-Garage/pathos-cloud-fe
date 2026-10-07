import api from './api'

// Resolves any pathchain reference into the 1–2 human lines an InfoChip
// renders: { kind, id, hash, primary, secondary, route }.
export const refService = {
  async summary (address) {
    const { data } = await api.get('/refs/summary', { params: { address } })
    return data
  },

  async summaryById (kind, id) {
    const { data } = await api.get('/refs/summary', { params: { kind, id } })
    return data
  },

  // Kind-scoped free-text search for the maker's reference browser.
  // kind ∈ posts|nodes|labels|paths|skeletons. Returns summary rows with
  // an extra `address` field ('<prefix>/<hash>').
  async search (kind, q = '', limit = 8) {
    const { data } = await api.get('/refs/search', { params: { kind, q, limit } })
    return data
  },

  // FULLTEXT over node bodies (GET /search — the node_text shadow, every
  // hit access-filtered) — the side viewer's search board rides it for
  // nodes whose NAME does not match but whose words do.
  async fulltext (q, limit = 6) {
    const { data } = await api.get('/search', { params: { q, limit } })
    return data
  },

  // The ONE surround read every element viewer uses: the element's
  // skeleton walk + render-ready sections (author, createdAt, labels,
  // versions/forks/comments as {total, items, pathRef}, scores as
  // {up, down, mine}; entities add posts/uploads/instantiations).
  async surround (ref, limit = 10) {
    const { data } = await api.get('/refs/surround', { params: { ref, limit } })
    return data
  },

  // THREADS (2026-10-07) — comments + forks of ANY element, read off the
  // one chain path the server's holder rule picks (threadService). Paged:
  // { total, offset, limit, order, supported, items }. Comment items are
  // comment cards (PostCommentItem's `child` shape, `kind: 'skeletons'`);
  // fork items are cards for skeleton forks, ref summaries for node and
  // label forks.
  async comments (ref, { limit = 20, offset = 0 } = {}) {
    const { data } = await api.get('/refs/comments', { params: { ref, limit, offset } })
    return data
  },

  async forks (ref, { limit = 20, offset = 0 } = {}) {
    const { data } = await api.get('/refs/forks', { params: { ref, limit, offset } })
    return data
  },

  // A comment on any element that takes them (posts, comments, nodes,
  // skeletons, paths, labels, links) — 400 40007 for kinds that do not.
  async commentOn (ref, payload) {
    const { data } = await api.post('/refs/comment', { ref, ...payload })
    return data
  }
}
