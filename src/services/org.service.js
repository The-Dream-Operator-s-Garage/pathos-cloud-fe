import api from './api'

// Organizations (orgs feature, 2026-07): orgs are pathchain entities;
// joining mints a MASK (org alter-ego) you switch into. See
// docs/concepts/organizations.md.
export const orgService = {
  // → { organizations: [{ id, entity_id, name, role, role_title, mask, parent }] }
  async mine () {
    const { data } = await api.get('/organizations')
    return data
  },

  async create ({ name, bio, ceoTitle, maskDisplayName } = {}) {
    const { data } = await api.post('/organizations', { name, bio, ceoTitle, maskDisplayName })
    return data
  },

  // → { organization, access: 'member'|'locked', my_membership? }
  async get (id) {
    const { data } = await api.get(`/organizations/${id}`)
    return data
  },

  // → { tree: [nested members], total } (member-only)
  async members (id) {
    const { data } = await api.get(`/organizations/${id}/members`)
    return data
  },

  // → { rules: [refs], resources: [refs], sub_organizations } (member-only)
  async structure (id) {
    const { data } = await api.get(`/organizations/${id}/structure`)
    return data
  },

  // Targeted (entityId) → chat invite card; untargeted → { secret: { hash } }.
  async invite (id, { entityId, role, roleTitle, reportsToMaskId, message } = {}) {
    const { data } = await api.post(`/organizations/${id}/invites`, {
      entityId, role, roleTitle, reportsToMaskId, message
    })
    return data
  },

  async myInvites () {
    const { data } = await api.get('/organizations/invites/mine')
    return data
  },

  async acceptInvite (inviteId, { maskDisplayName } = {}) {
    const { data } = await api.post(`/organizations/invites/${inviteId}/accept`, { maskDisplayName })
    return data
  },

  async declineInvite (inviteId) {
    const { data } = await api.post(`/organizations/invites/${inviteId}/decline`)
    return data
  },

  // Redeem an org join secret by hash (the manual form).
  async join ({ secret, maskDisplayName } = {}) {
    const { data } = await api.post('/organizations/join', { secret, maskDisplayName })
    return data
  },

  async createSubOrganization (id, { name, leadMaskId, bio } = {}) {
    const { data } = await api.post(`/organizations/${id}/sub-organizations`, { name, leadMaskId, bio })
    return data
  },

  async attachMember (id, { maskId, role, roleTitle, reportsToMemberId } = {}) {
    const { data } = await api.post(`/organizations/${id}/members`, { maskId, role, roleTitle, reportsToMemberId })
    return data
  },

  // Share an element you own to the org (grants + RESOURCES tree).
  async share (id, ref) {
    const { data } = await api.post(`/organizations/${id}/share`, { ref })
    return data
  },

  async addRule (id, ref) {
    const { data } = await api.post(`/organizations/${id}/rules`, { ref })
    return data
  }
}
