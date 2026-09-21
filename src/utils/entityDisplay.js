// Cached entity display resolver — one refs/summary fetch per entity per
// session, shared by every chip that references that entity (EntityMicro,
// EntityName, …). Feeds render the same handful of authors dozens of times;
// without this each chip would hit GET /api/refs/summary on its own.
//
// Resolves to the summary shape { primary, secondary, route, pioneer, id,
// hash } or null when the entity can't be resolved. Failures are not cached
// so a transient error doesn't stick for the whole session.

import { elementSummary } from 'src/utils/elementSummary'

// Since 2026-09-21 the cache is `elementSummary`'s (utils/elementSummary.js),
// shared with every other kind's chip — one fetch per entity for the name,
// the face AND the integrity verdict.
export function entitySummary ({ id = null, hash = null } = {}) {
  return elementSummary({ prefix: 'entities', id, hash })
}

// THE TALAVERO SEAT (2026-09-11) — which entity is the install's feed seat
// (`GET /feed/lens-context` → `seat`, `TALAVERO_ENTITY_ID` on the API).
// Resolved once per session: the entity card names him as the non-human
// he is, and nothing else about the seat changes while the app runs.
// `null` = the install has no seat (a real answer, cached) or the read
// failed (not cached, so a transient error does not stick).
let _seat = null
export function seatEntityId () {
  if (_seat) return _seat
  _seat = import('src/services/feed.service')
    .then(({ feedService }) => feedService.getLensContext())
    .then((r) => {
      if (!r?.success) throw new Error('lens-context refused')
      return r.seat?.id != null ? parseInt(r.seat.id, 10) : null
    })
    .catch(() => {
      _seat = null
      return null
    })
  return _seat
}
