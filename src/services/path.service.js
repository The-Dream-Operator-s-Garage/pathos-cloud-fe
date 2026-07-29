import api from './api';

// Paths are primal pathchain types (like nodes). Each `/paths/:id` route
// resolves a Path ROW by its DB id; the backend walks the on-disk link
// chain and returns each step's target enriched for the XMini family.
export const pathService = {
  // direction: 'reverse' (newest first, default) or 'forward' (head→tail).
  async byId (id, direction = 'reverse') {
    const { data } = await api.get(`/paths/${id}`, { params: { direction } });
    return data;
  },
  // Resolve a Path by its `paths/<hash>` ref. Accepts either the bare
  // hash or the full ref. Used by surfaces that hold the hash but not
  // the DB row id.
  async byHash (hashOrRef, direction = 'reverse') {
    const hash = hashOrRef && hashOrRef.includes('/')
      ? hashOrRef.split('/').pop()
      : hashOrRef;
    const { data } = await api.get(`/paths/by-hash/${hash}`, { params: { direction } });
    return data;
  }
};
