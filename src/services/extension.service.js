import api from './api'

// The Chrome history's read (docs/concepts/extensions.md, 2026-11-02):
// GET /extensions/history pages a CHROME_HISTORY instance's visits newest
// first — the root reads its Chrome alter-ego's through the delegation.
export const extensionService = {
  async history (skeletonId, { before = null, limit = 20 } = {}) {
    const params = { skeleton: skeletonId, limit }
    if (before) params.before = before
    const { data } = await api.get('/extensions/history', { params })
    return data
  }
}
