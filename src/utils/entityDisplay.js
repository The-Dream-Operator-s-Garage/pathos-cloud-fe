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
