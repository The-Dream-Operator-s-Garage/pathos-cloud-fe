import api from './api'

// Claims — statements that carry their evidence (Thread D,
// docs/concepts/claims.md). The reader surface consumes get/vote/retract;
// STATUS derives server-side from the live votes (disputed > supported >
// open; retracted is terminal, author-only).
export const claimService = {
  // { claim: { statement, confidence, status, evidence: [refs],
  //   votes: { endorse, dispute, mine }, author, path } }
  async get (claimId) {
    const { data } = await api.get(`/claims/${claimId}`)
    return data
  },

  // Viewer-readable claims, newest first.
  async list (params = {}) {
    const { data } = await api.get('/claims', { params })
    return data
  },

  // stance ∈ 'endorse' | 'dispute'. A dispute MUST carry a resolvable
  // ref (422 code 40004 otherwise) — no evidence-free objections; the
  // ref + note land as a comment on the claim.
  async vote (claimId, { stance, ref = null, note = '' }) {
    const { data } = await api.post(`/claims/${claimId}/vote`, { stance, ref, note })
    return data
  },

  // Author-only, terminal.
  async retract (claimId) {
    const { data } = await api.post(`/claims/${claimId}/retract`)
    return data
  },

  async create ({ statement, evidence = [], confidence = null, publish = false }) {
    const { data } = await api.post('/claims', { statement, evidence, confidence, publish })
    return data
  }
}
