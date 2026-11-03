import api from './api'

// How many steps a path's FIRST read draws on a card, a mini, a table cell
// (2026-11-02 — a 2,000-step path no longer rides every card that shows it;
// the lane's "+N more" pill reads the next block) and how many make one
// block of the path viewer's ring (docs/concepts/feed-windowing.md).
export const PATH_PREVIEW = 24
export const PATH_BLOCK = 25

// Paths are primal pathchain types (like nodes). Each `/paths/:id` route
// resolves a Path ROW by its DB id; the backend walks the on-disk link
// chain and returns each step's target enriched for the XMini family.
// `{ offset, limit }` (2026-11-02) reads ONE BLOCK of steps — `steps[i].index`
// stays absolute, `path.step_count` is the whole path, `window.next_offset`
// names the next block (null at the end). Omit both for every step.
const _params = (direction, { offset, limit } = {}) => ({
  direction,
  ...(limit ? { limit, offset: offset || 0 } : {})
})

export const pathService = {
  // direction: 'reverse' (newest first, default) or 'forward' (head→tail).
  async byId (id, direction = 'reverse', win = {}) {
    const { data } = await api.get(`/paths/${id}`, { params: _params(direction, win) })
    return data
  },
  // Resolve a Path by its `paths/<hash>` ref. Accepts either the bare
  // hash or the full ref. Used by surfaces that hold the hash but not
  // the DB row id.
  async byHash (hashOrRef, direction = 'reverse', win = {}) {
    const hash = hashOrRef && hashOrRef.includes('/')
      ? hashOrRef.split('/').pop()
      : hashOrRef
    const { data } = await api.get(`/paths/by-hash/${hash}`, { params: _params(direction, win) })
    return data
  }
}
