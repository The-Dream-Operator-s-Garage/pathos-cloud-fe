// Single source of truth for pathchain element kinds.
//
// Keyed by the on-disk prefix (always plural: nodes/, labels/, …). Each entry
// exposes the singular `kind` slug (used as a CSS class), the Material icon,
// an accent color, and a route builder for kinds that have a viewer page.
//
// Both HashLink.vue and AddressChain.vue used to ship their own private map;
// this module replaces both of them so the file tree, Micros, and Minis stay
// in sync without manual upkeep.
//
// ⭐ THE PALETTE IS THE PLATFORM'S NOW (2026-09-06, user ask: "recolor the
// items on the stack so they're readable and also consistent with the color
// palette. For example, using deep-purple on labels"). Every colour here was
// an ad-hoc hex picked kind by kind — a navy node, a teal label, two greys
// that were the same grey, three kinds sharing one gold — chosen before the
// platform HAD a palette. It has one now: four windows carry four sanctioned
// colorways (`--maker-contrast` cyan, `--uploader-contrast` lime,
// `--labels-contrast` deep-purple, `--skeletons-contrast` deep-orange), and
// THE KIND THAT A WINDOW MAKES NOW WEARS THAT WINDOW'S TONE. A label chip and
// the label maker are the same violet; a post chip and the post maker the same
// cyan. The rest fill in from the same Material families at levels that carry.
//
// ⚠ THESE MUST STAY `#rrggbb` LITERALS, not `var(--token)`: SidePanelItem's
// `softHex()` parses the channel bytes to derive the current row's soft fill,
// and a CSS variable would return null there and silently drop the bubble.
// The token each one MIRRORS is named in its comment — move them together.
//
// Contrast is measured against `--light-cream` (#FCF3E0), which is the tile
// face these are drawn on in the footer strip AND the ink they invert to when
// a tile is the current one, so one number governs both directions.
export const KINDS = {
  // indigo-6 — the chrome/identity family. Frees the violet it used to
  // borrow for labels, which is the family that actually names them.
  files: { kind: 'entity', icon: 'person', color: '#3f51b5', route: (id) => `/entities/${id}` },
  entities: { kind: 'entity', icon: 'person', color: '#3f51b5', route: (id) => `/entities/${id}` },
  // lime-10 = `--uploader-contrast`. The uploader is the window that mints
  // nodes, so a node chip and that window are one tone. (Was #2C3D4E navy —
  // a beautiful 10:1 that belonged to no family on this platform.)
  nodes: { kind: 'node', icon: 'adjust', color: '#827717', route: (id) => `/nodes/${id}` },
  // cyan-9 = `--maker-contrast`. Same argument, one window over. (Was
  // #7d8995, a grey it shared with links and unknown — three kinds, one
  // colour, which is the opposite of what a kind colour is for.)
  posts: { kind: 'post', icon: 'edit_note', color: '#00838f', route: (id) => `/posts/${id}` },
  // teal-8 — a path is a route; teal was already reaching for this at
  // #4d8a83, this is that intent at a level that carries text.
  paths: { kind: 'path', icon: 'route', color: '#00796B', route: (id) => `/paths/${id}` },
  // deep-purple-6 = `--labels-contrast`, the user's own example. The label
  // maker went Quasar purple on 2026-09-04 and the chips stayed teal for two
  // days — this closes that gap.
  labels: { kind: 'label', icon: 'label_important', color: '#673ab7', route: (id) => `/labels/${id}` },
  // deep-orange-8 = `--skeletons-contrast`.
  skeletons: { kind: 'skeleton', icon: 'schema', color: '#e64a19', route: (id) => `/skeletons/${id}` },
  // ⚠ CARVED GOLD IS A TRADITION — the pioneer's mark keeps it, alone. It is
  // the one colour here that is not from a Material family and that is the
  // point: nothing else on the platform is the pioneer.
  pioneer: { kind: 'pioneer', icon: 'star', color: '#c79a00', route: null },
  // orange-10 — the warm end for TIME. It shared the pioneer's gold before,
  // at 2.4:1, which is a decorative contrast and not a legible one.
  moments: { kind: 'moment', icon: 'schedule', color: '#e65100', route: (id) => `/moments/${id}` },
  // brown-8 — the platform's own material, at its sealed end. A secret reads
  // shut rather than coloured.
  secrets: { kind: 'secret', icon: 'key', color: '#4e342e', route: (id) => `/secrets/${id}` },
  // cyan-10 — a post's family one level deeper: a link and the thing it
  // points at are kin, and the depth is what tells them apart.
  links: { kind: 'link', icon: 'link', color: '#006064', route: (id) => `/links/${id}` },
  // grey-8 — the sub-stack's neutral. An action is not an element with a
  // colour of its own; it is a mark left on one.
  actions: { kind: 'action', icon: 'bolt', color: '#616161', route: null },
  unknown: { kind: 'unknown', icon: 'circle', color: '#757575', route: null }
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
