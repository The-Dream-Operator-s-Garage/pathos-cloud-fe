import api from './api'

// Cuentista's transformation receipts (dashboards phase 7, 2026-08-11).
// Apply runs under the CALLER's JWT — the requester's own hand replays
// the SPEC after their poll said yes (seat-strict: the seat never writes
// user data).
export const transformationService = {
  async apply (id) {
    const { data } = await api.post(`/transformations/${id}/apply`)
    return data
  },
  // The Modify affordance's bookkeeping half (the poll records the NO).
  async decline (id) {
    const { data } = await api.post(`/transformations/${id}/decline`)
    return data
  }
}
