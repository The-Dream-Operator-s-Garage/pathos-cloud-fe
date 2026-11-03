import api from './api'

export const feedService = {
  // Public global feed — every POST instance platform-wide, newest first.
  // Lens params (the Talavero seat, 2026-08-07) ride the same call:
  // from/to, authors/excludeAuthors, labels=id:w[s], order, q, kinds,
  // embedRule, place, receipt, request — see specs/api.md.
  async getPublic (params = {}) {
    const { data } = await api.get('/feed', { params })
    return data
  },

  // THE ELEMENT STREAM (2026-11-02) — every kind in one feed: `of` =
  // kinds.js prefixes (default posts,nodes,labels,skeletons,dashboards,
  // entities,paths), `page`/`limit`, `order`, and the lenses that mean the
  // same on any element (`authors`, `maxHops`, `label`, `from`/`to`,
  // `ownerId`). Post rows are whole GET /feed rows; the rest `{ kind, id,
  // address, owner_id, created_at, name }`.
  async getElements (params = {}) {
    const { data } = await api.get('/feed/elements', { params })
    return data
  },

  // The seat's research surface: { seat, labels (the digest), digest_rev,
  // today }. `seat: null` = the install has no Talavero — the head box
  // keeps its field disabled on that answer.
  async getLensContext () {
    const { data } = await api.get('/feed/lens-context')
    return data
  },
  // Legacy per-entity feed kept around for callers that still want their
  // own activity stream.
  async getMyFeed (params = {}) {
    const { data } = await api.get('/feed/me', { params })
    return data
  }
}
