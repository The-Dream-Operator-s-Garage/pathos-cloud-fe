// ELEMENT LABELS — any element's labels, batched and cached (2026-10-18, the
// mini family's label strip: "a new section under the mini viewer header
// where the item labels are displayed").
//
// Every Mini asks for its element's labels by ADDRESS. A Mini is mounted
// from whatever row its host had (a path walk's node, a body ref's post, a
// lane's entity) and most rows carry none, so the read is lazy — and a feed
// or a path lane mounts dozens of panels in one frame, so the asks made in
// one tick ride ONE `GET /refs/labels` (≤60 addresses a call; the server
// answers each kind's junction in one query).
//
// The cache is REACTIVE and session-wide: `labelsOf(address)` is read in a
// computed, so a panel re-draws when its rows land, and every panel showing
// the same element draws the same rows. `seedLabels` lets a Mini whose row
// already carries attributed labels (a node read, a feed row) draw them at
// once — first word wins, so a stale seed never overwrites a fresh read.
// `refreshLabels` re-asks (Talavero's accepted suggestion lands on a node
// that is already on screen).
//
// Values: undefined = not asked yet / in flight · null = unreadable or
// unresolvable (the server's gate) · [] = no labels · rows.
import { reactive } from 'vue'
import { refService } from 'src/services/ref.service'

const MAX_PER_CALL = 60
const ALIAS = { posts: 'skeletons', files: 'entities' }

const cache = reactive(new Map()) // address → rows | null
const inflight = new Set()
let queue = new Set()
let timer = null

// '<kind>/<hash>' off any spelling (pathos:-prefixed, owner-scoped,
// `posts/` and `files/` aliases) — the cache key and what the server reads.
export function labelAddress (addr) {
  const parts = String(addr || '').trim().replace(/^pathos:/, '').split('/').filter(Boolean)
  if (parts.length < 2) return ''
  const kind = parts[parts.length - 2]
  return `${ALIAS[kind] || kind}/${parts[parts.length - 1]}`
}

const flush = async () => {
  timer = null
  const all = [...queue]
  queue = new Set()
  for (let i = 0; i < all.length; i += MAX_PER_CALL) {
    const batch = all.slice(i, i + MAX_PER_CALL)
    try {
      const r = await refService.labels(batch)
      for (const a of batch) cache.set(a, r?.success ? (r.labels?.[a] ?? null) : null)
    } catch (_) {
      // A failed read is not cached — the next mount asks again.
    }
    for (const a of batch) inflight.delete(a)
  }
}

export function requestLabels (addr) {
  const a = labelAddress(addr)
  if (!a || cache.has(a) || inflight.has(a)) return
  inflight.add(a)
  queue.add(a)
  if (!timer) timer = setTimeout(flush, 0)
}

// Reactive read — call inside a computed / render.
export function labelsOf (addr) {
  const a = labelAddress(addr)
  return a ? cache.get(a) : undefined
}

export function seedLabels (addr, rows) {
  const a = labelAddress(addr)
  if (a && Array.isArray(rows) && !cache.has(a)) cache.set(a, rows)
}

export function refreshLabels (addr) {
  const a = labelAddress(addr)
  if (!a) return
  inflight.delete(a)
  cache.delete(a)
  requestLabels(a)
}

// ── THE STRIP'S HIDE SWITCH ("as this occupies space, add a button … that
// serves to hide the new label scroll section"): remembered PER ELEMENT and
// per browser, so an element hidden once stays hidden wherever it is shown
// again (the feed's ring re-mounts its blocks; the same element can stand
// on the feed and in a window at once). The newest `HIDDEN_MAX` choices are
// kept — the list never grows without bound.
const HIDDEN_KEY = 'pathos_mini_labels_hidden'
const HIDDEN_MAX = 400
const readHidden = () => {
  try {
    const v = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch (_) { return [] }
}
const hidden = reactive(new Set(readHidden()))

export function labelsHidden (addr) {
  const a = labelAddress(addr)
  return !!a && hidden.has(a)
}

export function setLabelsHidden (addr, on) {
  const a = labelAddress(addr)
  if (!a) return
  hidden.delete(a)
  if (on) hidden.add(a)
  const keep = [...hidden].slice(-HIDDEN_MAX)
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(keep)) } catch (_) { /* preference only */ }
}
