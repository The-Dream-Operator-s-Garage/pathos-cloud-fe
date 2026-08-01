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

  // Where the caller stands on the doubling-wait invitation curve:
  // { invite: { invitation_number, wait_s, next_allowed_at, can_invite_now,
  //   retry_after_s, inherited_handicap, minted, curve } }
  async inviteStatus () {
    const { data } = await api.get('/identity/invite-status')
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

  // ── Password recovery via the invite chain (Thread H) ────────────────
  // Inviter-only: mint a one-time reset secret bound to an invitee's entity.
  async mintRecoverySecret (entityId) {
    const { data } = await api.post('/identity/recovery/mint', { entityId })
    return data
  },

  // Unauthenticated redeem — a success logs this device in.
  async resetPassword (secret, username, newPassword) {
    const { data } = await api.post('/identity/recovery/reset', { secret, username, newPassword })
    if (data.success) {
      localStorage.setItem('pathos_token', data.token)
      localStorage.setItem('pathos_user', JSON.stringify(data.entity))
    }
    return data
  },

  // ── Device sessions (Thread H) ───────────────────────────────────────
  async sessions () {
    const { data } = await api.get('/identity/sessions')
    return data
  },

  async revokeSession (id) {
    const { data } = await api.post(`/identity/sessions/${id}/revoke`)
    return data
  },

  logout () {
    // Best-effort server-side revoke of THIS session before dropping the
    // token — a sid-less (legacy/driver) token is a server no-op. The
    // header is explicit because the interceptor may read localStorage
    // AFTER the removes below have run.
    const token = localStorage.getItem('pathos_token')
    if (token) {
      api.post('/identity/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    }
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
