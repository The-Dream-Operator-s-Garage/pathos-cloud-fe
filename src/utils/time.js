// Relative time formatter for any pathchain item.
// Accepts a timestamp + an optional moment object (preferred when present).
//
// Inputs handled defensively:
//   - undefined / null / empty       → ''
//   - unparseable string             → ''
//   - clock skew (timestamp in the
//     future relative to client)     → 'just now' (small skew) or absolute form
//
// The pattern: if `moment` is provided with a `time_utc` (DATETIME from the
// moment table), it wins. Otherwise fall back to the record's own `created_at`.

const parseTs = (input) => {
  if (input == null || input === '') return null
  const ts = input instanceof Date ? input : new Date(input)
  const ms = ts.getTime()
  return Number.isFinite(ms) ? ms : null
}

// Resolve the best timestamp from (moment, createdAt) — moment first.
const resolveMs = (createdAt, moment) => {
  const fromMoment = moment ? parseTs(moment.time_utc) : null
  if (fromMoment != null) return fromMoment
  return parseTs(createdAt)
}

export const timeAgo = (createdAt, moment = null) => {
  const ms = resolveMs(createdAt, moment)
  if (ms == null) return ''

  const diff = Date.now() - ms

  // Clock skew: if the item appears to be slightly in the future, treat as now
  // instead of returning a nonsense negative "ago". Anything more than 60s in
  // the future is suspicious enough to fall through to absolute form.
  if (diff < 0) {
    if (diff > -60_000) return 'just now'
    // Significant future skew — show absolute, suffix to make it obvious.
    return absoluteShort(ms) + ' (future?)'
  }

  const sec = Math.floor(diff / 1000)
  if (sec < 60) return sec <= 1 ? 'just now' : `${sec}s ago`
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return absoluteShort(ms)
}

// Compact absolute form, e.g. "Jun 14, 2026 14:59"
const absoluteShort = (ms) => {
  try {
    return new Date(ms).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (_) { return '' }
}

// Full absolute form for hover tooltips.
export const absoluteTime = (createdAt, moment = null) => {
  const ms = resolveMs(createdAt, moment)
  if (ms == null) return ''
  // Prefer the pathchain library's `time` string when known — that's the
  // moment as it was authored. Falls back to a locale form.
  if (moment?.time) return `${moment.time}  (${new Date(ms).toLocaleString()})`
  return new Date(ms).toLocaleString()
}
