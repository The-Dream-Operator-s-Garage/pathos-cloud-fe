// Cached element summary resolver — ONE `GET /refs/summary` per element
// per session, shared by every chip that references that element.
//
// Born 2026-09-21 as the seam under the traffic light's reach: MicroChip
// self-resolves its integrity verdict off the summary when no verdict is
// handed in, and a feed draws the same post / label / moment chip dozens of
// times, so without this each chip would pay its own read. `entityDisplay`'s
// `entitySummary` (July 2026, the same idea for entities alone) delegates
// here now, so an entity chip's name lookup and its verdict are one fetch.
//
// Resolves to the summary shape { kind, id, hash, primary, secondary, route,
// integrity?, pioneer?, … } or null when the element can't be resolved.
// Failures are not cached so a transient error doesn't stick for the session.
import { refService } from 'src/services/ref.service'

const _cache = new Map() // '<prefix>#<id>' | '<prefix>/<hash>' → Promise<summary|null>

export function elementSummary ({ prefix = '', id = null, hash = null } = {}) {
  if (!prefix) return Promise.resolve(null)
  const key = id != null ? `${prefix}#${id}` : (hash ? `${prefix}/${hash}` : null)
  if (!key) return Promise.resolve(null)
  if (_cache.has(key)) return _cache.get(key)

  const p = (id != null
    ? refService.summaryById(prefix, id)
    : refService.summary(`${prefix}/${hash}`)
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
