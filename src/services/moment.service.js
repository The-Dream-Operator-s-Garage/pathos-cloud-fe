import api from './api'

export const momentService = {
  async get (id) {
    const { data } = await api.get(`/moments/${id}`)
    return data
  },

  async getByHash (hash) {
    const { data } = await api.get(`/moments/by-hash/${hash}`)
    return data
  },

  // Everything minted at this moment, across all tables.
  async items (id) {
    const { data } = await api.get(`/moments/${id}/items`)
    return data
  },

  // Mint (or reuse) a moment for an explicit date — the date-picker seam
  // behind moments-constrained fields (BIRTHDAY et al.). `when` is
  // "YYYY-MM-DD" (read as UTC midnight) or an ISO datetime.
  async ensure (when) {
    const { data } = await api.post('/moments/ensure', { when })
    return data
  }
}
