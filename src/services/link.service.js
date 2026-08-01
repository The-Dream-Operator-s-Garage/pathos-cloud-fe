import api from './api'

export const linkService = {
  async get (id) {
    const { data } = await api.get(`/links/${id}`)
    return data
  },

  async getByHash (hash) {
    const { data } = await api.get(`/links/by-hash/${hash}`)
    return data
  }
}
