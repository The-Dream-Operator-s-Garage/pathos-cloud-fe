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

  // The ONE surround read every element viewer uses: the element's
  // skeleton walk + render-ready sections (author, createdAt, labels,
  // versions/forks/comments as {total, items, pathRef}, scores as
  // {up, down, mine}; entities add posts/uploads/instantiations).
  async surround (ref, limit = 10) {
    const { data } = await api.get('/refs/surround', { params: { ref, limit } })
    return data
  }
}
