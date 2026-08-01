// Single source of truth for pathchain element kinds.
//
// Keyed by the on-disk prefix (always plural: nodes/, labels/, …). Each entry
// exposes the singular `kind` slug (used as a CSS class), the Material icon,
// an accent color, and a route builder for kinds that have a viewer page.
//
// Both HashLink.vue and AddressChain.vue used to ship their own private map;
// this module replaces both of them so the file tree, Micros, and Minis stay
// in sync without manual upkeep.

export const KINDS = {
  files: { kind: 'entity', icon: 'person', color: '#9b6cb0', route: (id) => `/entities/${id}` },
  entities: { kind: 'entity', icon: 'person', color: '#9b6cb0', route: (id) => `/entities/${id}` },
  nodes: { kind: 'node', icon: 'adjust', color: '#2C3D4E', route: (id) => `/nodes/${id}` },
  posts: { kind: 'post', icon: 'edit_note', color: '#7d8995', route: (id) => `/posts/${id}` },
  paths: { kind: 'path', icon: 'route', color: '#4d8a83', route: (id) => `/paths/${id}` },
  labels: { kind: 'label', icon: 'label_important', color: '#00829c', route: (id) => `/labels/${id}` },
  skeletons: { kind: 'skeleton', icon: 'schema', color: '#5b6c82', route: (id) => `/skeletons/${id}` },
  pioneer: { kind: 'pioneer', icon: 'star', color: '#c79a00', route: null },
  moments: { kind: 'moment', icon: 'schedule', color: '#c79a00', route: (id) => `/moments/${id}` },
  secrets: { kind: 'secret', icon: 'key', color: '#a06070', route: (id) => `/secrets/${id}` },
  links: { kind: 'link', icon: 'link', color: '#7d8995', route: (id) => `/links/${id}` },
  actions: { kind: 'action', icon: 'bolt', color: '#c79a00', route: null },
  unknown: { kind: 'unknown', icon: 'circle', color: '#7d8995', route: null }
}

// Look up by either the on-disk prefix ('nodes') OR the singular slug ('node').
export function kindFor (prefixOrKind) {
  if (!prefixOrKind) return KINDS.unknown
  if (KINDS[prefixOrKind]) return KINDS[prefixOrKind]
  for (const key of Object.keys(KINDS)) {
    if (KINDS[key].kind === prefixOrKind) return KINDS[key]
  }
  return KINDS.unknown
}

// The on-disk plural prefix for a slug or prefix ('entity' → 'entities',
// 'nodes' → 'nodes'). Never naive-pluralize — 'entitys' 400s on the API.
// 'files' is an alias for the entity registry, not an API kind — skip it.
export function prefixFor (prefixOrKind) {
  if (KINDS[prefixOrKind] && prefixOrKind !== 'files') return prefixOrKind
  for (const key of Object.keys(KINDS)) {
    if (key !== 'files' && KINDS[key].kind === prefixOrKind) return key
  }
  return prefixOrKind
}

// Parse a full pathchain address like 'files/<h>/nodes/<h>' into ordered segments.
// Each segment carries the resolved kind metadata for direct rendering.
export function parseAddress (addr) {
  const parts = (addr || '').split('/').filter(Boolean)
  const out = []
  for (let i = 0; i < parts.length; i += 2) {
    const prefix = parts[i]
    const hash = parts[i + 1] || ''
    out.push({ prefix, hash, meta: kindFor(prefix) })
  }
  return out
}

// True when `s` looks like a bare pathchain element hash (sha-256 hex). The
// dev fixtures also mint long lowercase-alnum owner hashes, so we accept any
// 32+ char lowercase hex run rather than pinning to exactly 64.
const HASH_RE = /^[a-f0-9]{32,}$/
export function isHash (s) {
  return typeof s === 'string' && HASH_RE.test(s)
}

// Parse a decoded protobuf field value into a navigable reference, or null.
//
// Decoded pathchain records store their cross-links as *addresses*, in two
// shapes:
//   - global:       'nodes/<hash>'         (kind + hash)
//   - owner-scoped: '<owner>/links/<hash>' (owner + kind + hash)
// Plain-content fields (`text`), empty strings (`chain: ""`), and anything
// that doesn't end in a known-kind + hash pair return null so the caller
// renders them as ordinary values instead of chips.
//
// Returns { prefix, kind, hash, owner, address } where:
//   - prefix  the on-disk plural folder ('nodes', 'links', …)
//   - kind    the singular slug from KINDS ('node', 'link', …)
//   - hash    the bare element hash
//   - owner   the owner hash when the value was owner-scoped, else null
//   - address the value as given (what decode/reveal expect)
export function parseRef (value) {
  if (typeof value !== 'string' || !value) return null
  const parts = value.split('/').filter(Boolean)
  if (parts.length < 2) return null

  const hash = parts[parts.length - 1]
  if (!isHash(hash)) return null

  const prefix = parts[parts.length - 2]
  const meta = KINDS[prefix]
  // The second-to-last segment must name a real on-disk kind folder;
  // otherwise this is content that merely happens to contain a slash.
  if (!meta || prefix === 'unknown') return null

  // Owner-scoped form carries the owner hash as the first segment. The
  // global form (`nodes/<hash>`) has exactly the two segments.
  const owner = parts.length >= 3 && isHash(parts[parts.length - 3])
    ? parts[parts.length - 3]
    : null

  return { prefix, kind: meta.kind, hash, owner, address: value }
}

// Strip the prefix from 'nodes/abc...' → 'abc...'. Returns the input unchanged
// if it has no '/'.
export function hashOf (pathOrHash) {
  if (!pathOrHash) return ''
  return pathOrHash.includes('/') ? pathOrHash.split('/').pop() : pathOrHash
}

// Cosmetic short form used in chips. Returns the full hash if `len` exceeds it.
export function shortHash (pathOrHash, len = 12) {
  const h = hashOf(pathOrHash)
  if (!h) return ''
  return h.length > len ? h.slice(0, len) : h
}
