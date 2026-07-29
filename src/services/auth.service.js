import api from './api'

export const authService = {
  async login (username, password) {
    const { data } = await api.post('/identity/login', { username, password })
    if (data.success) {
      localStorage.setItem('pathos_token', data.token)
      localStorage.setItem('pathos_user', JSON.stringify(data.entity))
    }
    return data
  },

  async register (secret, username, password) {
    const { data } = await api.post('/identity/register', { secret, username, password })
    if (data.success) {
      localStorage.setItem('pathos_token', data.token)
      localStorage.setItem('pathos_user', JSON.stringify(data.entity))
    }
    return data
  },

  async checkSecret (secret) {
    const { data } = await api.post('/identity/check-secret', { secret })
    return data
  },

  async verify () {
    const { data } = await api.get('/identity/verify')
    return data
  },

  async generateSecret () {
    const { data } = await api.post('/identity/secret/generate')
    return data
  },

  async getStatus () {
    const { data } = await api.get('/identity/status')
    return data
  },

  // Returns entities the user can author as: their full identity tree
  // (self + alter-egos, flattened depth-first with depth/parent_id) + orgs.
  // `acting` marks the identity the current JWT acts as.
  async getAuthorables () {
    const { data } = await api.get('/identity/authorables')
    return data
  },

  // Internal log-in: re-issue the JWT acting as another identity in the
  // user's own subtree (root identity or any alter-ego of it).
  async switchIdentity (entityId) {
    const { data } = await api.post('/identity/switch', { entityId })
    if (data.success) {
      localStorage.setItem('pathos_token', data.token)
      localStorage.setItem('pathos_user', JSON.stringify(data.entity))
    }
    return data
  },

  logout () {
    localStorage.removeItem('pathos_token')
    localStorage.removeItem('pathos_user')
  },

  getUser () {
    const user = localStorage.getItem('pathos_user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated () {
    return !!localStorage.getItem('pathos_token')
  }
}
