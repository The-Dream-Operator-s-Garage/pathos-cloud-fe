// Cached entity display resolver — one refs/summary fetch per entity per
// session, shared by every chip that references that entity (EntityMicro,
// EntityName, …). Feeds render the same handful of authors dozens of times;
// without this each chip would hit GET /api/refs/summary on its own.
//
// Resolves to the summary shape { primary, secondary, route, pioneer, id,
// hash } or null when the entity can't be resolved. Failures are not cached
// so a transient error doesn't stick for the whole session.

import { refService } from 'src/services/ref.service'

const _cache = new Map() // 'id:<n>' | 'hash:<h>' → Promise<summary|null>

export function entitySummary ({ id = null, hash = null } = {}) {
  const key = id != null ? `id:${id}` : (hash ? `hash:${hash}` : null)
  if (!key) return Promise.resolve(null)
  if (_cache.has(key)) return _cache.get(key)

  const p = (id != null
    ? refService.summaryById('entities', id)
    : refService.summary(`entities/${hash}`)
  )
    .then((res) => (res?.success ? res.summary : null))
    .catch(() => null)
    .then((summary) => {
      if (!summary) _cache.delete(key)
      return summary
    })

  _cache.set(key, p)
  return p
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
