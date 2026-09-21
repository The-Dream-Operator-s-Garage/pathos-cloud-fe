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
// palette"). Every colour here was an ad-hoc hex picked kind by kind — a navy
// node, a teal label, two greys that were the same grey, three kinds sharing
// one gold — chosen before the platform HAD a palette.
//
// ⭐⭐ ONE SOURCE, THE FOOTER BAR'S (2026-09-21, user ask: "make the colors for
// posts, labels, skeletons, and uploads (nodes) match the colors used on their
// respective buttons on the footer bar. Leave moments yellow as they are and
// change entities to cyan instead of purple (just like on the posts)"). Until
// this day THREE palettes disagreed: this file (the 09-06 set, read by the
// stack strip), MicroChip's and InfoChip's own scoped `.kind-*` blocks (the
// pre-palette ad-hoc set — a purple entity, a grey post, a teal label) and
// HashLink's. Now this map is THE ONLY ONE: every chip reads `color` through
// the `--kind-accent` custom property its root sets inline, and the scoped
// per-kind blocks are gone. The four kinds a window makes wear that window's
// CONTRAST dial exactly as the footer bar's four buttons do (`.create-btn--*`
// in NavigationBar: `--chip-rim` = the contrast):
//   posts     `--maker-contrast`     = indigo-6   (was cyan-9 here, grey on chips)
//   nodes     `--uploader-contrast`  = teal-7     (was lime-10 here, ink on chips)
//   labels    `--labels-contrast`    = red-7      (was deep-purple-6 here, #00829c on chips)
//   skeletons `--skeletons-contrast` = yellow-10  (was deep-orange-8 here, slate on chips)
// Entities take the POST CARD BYLINE's cyan — `--cyan-9`, the author name's
// resting tone since 2026-08-09 — because that is where the user already
// reads an entity in cyan. Moments keep the chips' gold. Links and paths had
// to move too: links stood one step deeper than posts (cyan-10 beside cyan-9)
// and follow posts into indigo; paths stood in teal beside the nodes' new
// teal and go to blue-grey (a route is a road, drawn in slate).
//
// ⚠ THESE MUST STAY `#rrggbb` LITERALS, not `var(--token)`: SidePanelItem's
// `softHex()` parses the channel bytes to derive the current row's soft fill,
// and a CSS variable would return null there and silently drop the bubble.
// The token each one MIRRORS is named in its comment — move them together.
//
// Contrast is measured against `--light-cream` (#FCF3E0), which is the tile
// face these are drawn on in the footer strip AND the ink they invert to when
// a tile is the current one, so one number governs both directions.
//
// ⭐ `ink` (2026-09-21 PM, user ask: "make the font color on all the pills be
// the same color as the icon, but in its darkest quasar tone"): the chip's
// TEXT — type word, separators, hash — in the icon family's deepest step,
// Material 900 = Quasar `-10` (the same rung the footer buttons letter their
// WORD in, `--chip-word`). Yellow cannot carry ink at its 900 (the glyph IS
// yellow-10), so the skeleton's ink is the family's hand-mixed deep step
// `--yellow-deep`; gold has no Quasar family, so the moment's and the
// pioneer's ink is the carved gold's own (`.pioneer-gold`'s text). Read by
// MicroChip / InfoChip through the inline `--kind-ink` custom property.
export const KINDS = {
  // cyan-9 = the post card byline's author name (`.post-square__author`,
  // `--cyan-9` since 2026-08-09). An entity is cyan wherever it is named.
  // (Was indigo-6 here 09-06 → 09-21, #9b6cb0 purple on the chips.)
  // ink cyan-10.
  files: { kind: 'entity', icon: 'person', color: '#00838f', ink: '#006064', route: (id) => `/entities/${id}` },
  entities: { kind: 'entity', icon: 'person', color: '#00838f', ink: '#006064', route: (id) => `/entities/${id}` },
  // teal-7 = `--uploader-contrast`, the UPLOADS button's rim. The uploader
  // is the window that mints nodes, so a node chip and that button are one
  // tone. (Was lime-10 here — the uploader's 09-05 lime, before its 09-07
  // teal walk.)
  // ink teal-10.
  nodes: { kind: 'node', icon: 'adjust', color: '#00897b', ink: '#004d40', route: (id) => `/nodes/${id}` },
  // indigo-6 = `--maker-contrast`, the POST button's rim. (Was cyan-9 — the
  // maker's 09-05 cyan, before "posts -> indigo" on 09-07.)
  // ink indigo-10. ⭐ 2026-09-21 PM3 (user ask: "the official post icon is the
  // one used on the post cards title … make sure we use that same icon on the
  // post nano pills"): the glyph is `sym_o_post` — the feed card cap's mark
  // (`capIcons` in FeedStream, the flyout's post tab) — not `edit_note`, the
  // post-as-document drawing the chips wore since July. Every chip reads it
  // here, so the card's cap and its foot pill are one drawing.
  posts: { kind: 'post', icon: 'sym_o_post', color: '#3f51b5', ink: '#1a237e', route: (id) => `/posts/${id}` },
  // blue-grey-7 (Material 700) — a path is a ROUTE, drawn in slate. Teal-8
  // stood here until the nodes took teal; two teals a step apart read as one.
  paths: { kind: 'path', icon: 'route', color: '#455a64', ink: '#263238', route: (id) => `/paths/${id}` },
  // red-7 = `--labels-contrast`, the LABELS button's rim (the label maker
  // went red on 09-07; the chips stayed violet-in-this-file / teal-on-the-
  // chip for two weeks — this closes that gap).
  // ink red-10.
  labels: { kind: 'label', icon: 'label_important', color: '#e53935', ink: '#b71c1c', route: (id) => `/labels/${id}` },
  // yellow-10 = `--skeletons-contrast`, the SKELETONS button's rim and word.
  // ink `--yellow-deep` (#c46008) — the family's hand-mixed deep step; yellow-10 is the glyph.
  skeletons: { kind: 'skeleton', icon: 'schema', color: '#f57f17', ink: '#c46008', route: (id) => `/skeletons/${id}` },
  // ⚠ CARVED GOLD IS A TRADITION — the pioneer's mark keeps it, alone as a
  // TREATMENT (`.pioneer-gold`, the star, the carved face). The moment shares
  // the hex below by the user's word, not by kinship: nothing else on the
  // platform is the pioneer.
  pioneer: { kind: 'pioneer', icon: 'star', color: '#c79a00', ink: '#5f4700', route: null },
  // The chips' gold, kept — "leave moments yellow as they are" (2026-09-21).
  // This file said orange-10 for two weeks while every moment chip on every
  // surface drew this gold from its own scoped rule; the chips were what the
  // user saw, so the chips' tone is the one that stays and the stack strip
  // follows it. Not a Material stop; 2.4:1 on cream as TEXT (the strip
  // draws it at 0.14 as a fill and as a glyph, where it carries).
  moments: { kind: 'moment', icon: 'schedule', color: '#c79a00', ink: '#5f4700', route: (id) => `/moments/${id}` },
  // brown-8 — the platform's own material, at its sealed end. A secret reads
  // shut rather than coloured.
  secrets: { kind: 'secret', icon: 'key', color: '#4e342e', ink: '#3e2723', route: (id) => `/secrets/${id}` },
  // indigo-8 — a post's family one level deeper: a link and the thing it
  // points at are kin, and the depth is what tells them apart. (Followed the
  // posts out of cyan on 09-21 — it was cyan-10 beside their cyan-9.)
  links: { kind: 'link', icon: 'link', color: '#283593', ink: '#1a237e', route: (id) => `/links/${id}` },
  // grey-8 — the sub-stack's neutral. An action is not an element with a
  // colour of its own; it is a mark left on one.
  actions: { kind: 'action', icon: 'bolt', color: '#616161', ink: '#212121', route: null },
  unknown: { kind: 'unknown', icon: 'circle', color: '#757575', ink: '#424242', route: null }
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
