import api from './api'

// DOG Coin (thread C1, 2026-08-01) — the root login's purse. Balance +
// transaction page; transfers are person-to-person (market lands in C3).
export const walletService = {
  async get (page = 1, limit = 20) {
    const { data } = await api.get('/wallet', { params: { page, limit } })
    return data
  },

  async transfer ({ toEntityId, amount, memo, forRef }) {
    const { data } = await api.post('/wallet/transfer', { toEntityId, amount, memo, forRef })
    return data
  }
}
