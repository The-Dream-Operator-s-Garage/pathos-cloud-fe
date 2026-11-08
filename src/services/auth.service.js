import api from './api'
import { leaveToAuth } from 'src/utils/leaveToAuth'

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

  // A token for another seat of the tree WITHOUT switching the page to it
  // (2026-11-02 — the Keys well's New key mints AS the Chrome alter-ego on
  // one request; the page's localStorage seat never moves).
  async switchToken (entityId) {
    const { data } = await api.post('/identity/switch', { entityId })
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

  // ── Delegated reads (S3, 2026-10-31) ─────────────────────────────────
  // Who may read everything the ACTING seat may read — both directions.
  // → { given: [row], received: [row] }, row = { id, grantor, grantee,
  //   kinds, mandated_by_org, moment, revocable }. Seat-strict: switch into
  //   an alter-ego to list or give its own.
  async delegations () {
    const { data } = await api.get('/identity/delegations')
    return data
  },

  // The acting seat delegates its reads to another entity (201 created /
  // 200 already). `kinds` optional: 'all' | ['nodes', 'skeletons', …].
  async delegate (granteeId, kinds = null) {
    const { data } = await api.post('/identity/delegations', { granteeId, kinds })
    return data
  },

  // Revoke one delegation — the grantor's or the grantee's seat act. A
  // mandated record refuses the mask while a member (403 code 40330).
  async revokeDelegation (id) {
    const { data } = await api.delete(`/identity/delegations/${id}`)
    return data
  },

  // ── Storage + THE GOOGLE LINK (S4, 2026-11-01) ───────────────────────
  // docs/concepts/storage.md § Who stores. The acting seat's storage facts
  // as the identity window's Storage well draws them: { backend, mode,
  // residency, packed, source, inherited_from, google: { linked, own, email,
  // folder_id, state, last_sync_at, quota }, usage, policy, configured,
  // is_root, login: { google_linked, google_email }, can_link, cache }.
  async storage () {
    const { data } = await api.get('/identity/storage')
    return data
  },

  // The LINK dance starts here: { url } is Google's consent page for the
  // acting seat (openid email + drive.file) — the browser is sent there,
  // Google lands on the API's callback, and the API redirects back to
  // /#/feed?gticket=… with a one-shot ticket (no JWT in any URL).
  async googleLinkStart () {
    const { data } = await api.get('/identity/storage/google/start')
    return data
  },

  // Redeem the link ticket once → { linked, result: { email, folder_name,
  // login_enabled, login_conflict }, storage }.
  async googleRedeemLink (ticket) {
    const { data } = await api.post('/identity/storage/google/redeem', { ticket })
    return data
  },

  // Unlink: revoke at Google, back to this server, the login door closed.
  async googleUnlink () {
    const { data } = await api.delete('/identity/storage/google')
    return data
  },

  // One mirror pass now → { uploaded, updated, unchanged, failed, segments }.
  async storageSync () {
    const { data } = await api.post('/identity/storage/sync')
    return data
  },

  // ── Capability keys (2026-11-02 — docs/concepts/auth.md § Capability
  // secrets): the keys of the acting seat and its alter-egos; a mint AS a
  // seat — `token` (the alter-ego's switch token) rides ONE request so the
  // page's own seat never moves; a revoke by the owner or an identity of it.
  async keys () {
    const { data } = await api.get('/identity/keys')
    return data
  },

  async mintCapability (body, token = null) {
    const { data } = await api.post('/identity/secret/capability', body, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    return data
  },

  async revokeKey (id) {
    const { data } = await api.post(`/secrets/${id}/revoke`)
    return data
  },

  // { add?: [], remove?: [] } — the Keys well's Pins toggle (2026-11-02)
  async setKeyScopes (id, body) {
    const { data } = await api.post(`/identity/keys/${id}/scopes`, body)
    return data
  },

  // ── Sign in with Google (decision 1: a linked ROOT's second door) ────
  // A plain navigation, not a fetch: the API answers 302 to Google's consent
  // (openid email only) and its callback returns to /#/auth?ticket=….
  googleLoginUrl () {
    return `${api.defaults.baseURL}/auth/google/start`
  },

  // Redeem the login ticket once → the /login shape { token, entity }.
  async googleLogin (ticket) {
    const { data } = await api.post('/auth/google', { ticket })
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

  // Ends the session AND the page (2026-11-08 — utils/leaveToAuth.js says
  // why): revoke, drop the token, reboot the app on /auth. Callers do not
  // route anywhere after it — the reload is the navigation.
  async logout () {
    // Server-side revoke of THIS session before dropping the token — a
    // sid-less (legacy/driver) token is a server no-op. AWAITED now, since
    // the reload below would abort a request still in flight; capped, so a
    // slow API never holds anyone on a page they asked to leave. The header
    // is explicit because the interceptor reads localStorage at send time.
    const token = localStorage.getItem('pathos_token')
    if (token) {
      await Promise.race([
        api.post('/identity/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ])
    }
    localStorage.removeItem('pathos_token')
    localStorage.removeItem('pathos_user')
    leaveToAuth()
  },

  getUser () {
    const user = localStorage.getItem('pathos_user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated () {
    return !!localStorage.getItem('pathos_token')
  }
}
