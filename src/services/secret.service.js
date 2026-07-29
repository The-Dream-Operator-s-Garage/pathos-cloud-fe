import api from './api'

export const secretService = {
  async get (id) {
    const { data } = await api.get(`/secrets/${id}`)
    return data
  },

  async getByHash (hash) {
    const { data } = await api.get(`/secrets/by-hash/${hash}`)
    return data
  },

  async mine () {
    const { data } = await api.get('/secrets/mine')
    return data
  }
}
