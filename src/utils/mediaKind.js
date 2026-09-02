// What a media node IS, for display (docs/plans/floating-media-viewer.md).
// ONE branch decision, shared: the viewer body picks its renderer off
// `faceOf`, and the minimize tabs bar picks its glyph off `iconFor` — the
// same classification, so a parked window's tab wears the icon of the
// face it will restore to. It lived inside MediaViewerBody's setup until
// 2026-08-05, when the tabs bar needed per-kind icons and copying the
// ladder would have made two ladders to keep in step.

// Enriched media needs a url to load, so a media kind without one falls
// to the card; a text file whose body was not inlined (the API stops at
// 1MB — `text` absent, not '') falls there too, since there is nothing to
// render but the bytes.
export function faceOf (node) {
  if (!node) return 'card'
  if (node.embed) return 'embed'
  const f = node.file
  if (!f) return 'text' // plain NOTE — its content IS the body
  if (f.kind === 'image' && f.url) return 'image'
  if (f.kind === 'video' && f.url) return 'video'
  if (f.kind === 'audio' && f.url) return 'audio'
  if (f.kind === 'text' && f.text != null) {
    return f.ext === 'md' ? 'doc' : 'text'
  }
  return 'card'
}

// The download card's glyph, by FILE kind — the fallback face has no
// media to name itself with, so it names its bytes.
export const KIND_ICON = {
  image: 'image',
  video: 'movie',
  audio: 'music_note',
  binary: 'attach_file',
  text: 'notes'
}

// Per-face glyphs for the minimize tabs (2026-08-05, user ask). The embed
// face splits by MODE rather than provider: a `page` embed (Wikipedia) is
// a document you scroll, a player is one you watch, and those are two
// different promises about what restoring the tab gives you — where the
// provider (youtube vs vimeo) changes nothing about it. Everything else
// answers with the material's own glyph, matching the download card's map
// so one file kind is never two icons in one window's lifetime.
const FACE_ICON = {
  embed: 'smart_display',
  image: 'image',
  video: 'movie',
  audio: 'music_note',
  doc: 'article',
  text: 'notes',
  card: 'attach_file'
}

export function iconFor (node) {
  const face = faceOf(node)
  if (face === 'embed') return node?.embed?.mode === 'page' ? 'public' : FACE_ICON.embed
  if (face === 'card') return KIND_ICON[node?.file?.kind] || FACE_ICON.card
  return FACE_ICON[face] || FACE_ICON.card
}

// ── TITLES ──────────────────────────────────────────────────────────────
// What a viewer's header and its parked tab call the thing (2026-08-05,
// user ask). Media off the WEB is named after where it came from AND what
// it is: `PROVIDER :: name`, provider in capitals — "WIKIPEDIA :: Truth".
// Two jobs at once: the caps say which site is talking, so a strip of tabs
// sorts itself by source at a glance, and the name after them is what
// distinguishes two tabs from the same one.

// Path segments that route rather than name — a URL whose tail is one of
// these is telling us how to reach the thing, not what it is called.
const ROUTING_SEGMENTS = new Set(['watch', 'embed', 'video', 'v', 'wiki', 'index', 'index.html'])

// The most human name a web address carries on its own. Wikipedia keeps the
// article right in the path (`/wiki/Talavera_pottery` → "Talavera pottery");
// YouTube keeps nothing but the id, so the id is what we can honestly show —
// it is also the only thing that tells two parked YouTube tabs apart, which
// is more than the rule's generic `embed.title` ("YouTube video player")
// ever could. Fetching real page titles would need a network round trip per
// node; the descriptor is offline data by design (docs/concepts/embeds.md).
function webNameOf (embed) {
  let u
  try { u = new URL(embed.url || embed.src) } catch (e) { return embed.title || '' }
  const segs = u.pathname.split('/').filter(Boolean)
  let seg = null
  for (let i = segs.length - 1; i >= 0; i--) {
    if (!ROUTING_SEGMENTS.has(segs[i].toLowerCase())) { seg = segs[i]; break }
  }
  // `youtube.com/watch?v=…` — the whole path routes, the name is a param.
  if (!seg) seg = u.searchParams.get('v') || u.searchParams.get('id') || ''
  if (!seg) return embed.title || u.hostname.replace(/^www\./, '')
  let name = seg
  try { name = decodeURIComponent(seg) } catch (e) { /* a stray % — take it raw */ }
  return name.replace(/_/g, ' ').replace(/\.(html?|php)$/i, '')
}

// ── TARGETS ─────────────────────────────────────────────────────────────
// A flyout window's target is a node, a post, or a bare ref (skeletons —
// the `?flyout=` door and, since 2026-09-01, the skeleton mini's corner).
// The parked tab needs a glyph and a name BEFORE the window's own header
// has resolved (`store.describe` overwrites both the moment it does), and
// the node-only fallbacks drew a blank paperclip for every other kind —
// the "attach_file + empty name" tab of the skeletons plan audit (A4).
export function iconForTarget (target) {
  if (!target) return FACE_ICON.card
  if (target.kind === 'node') return iconFor(target.node)
  if (target.kind === 'post') return 'sym_o_post'
  if (target.kind === 'ref') return String(target.ref).includes('nodes/') ? FACE_ICON.card : 'schema'
  return FACE_ICON.card
}

export function titleOfTarget (target) {
  if (!target) return ''
  if (target.kind === 'node') return titleOf(target.node)
  if (target.kind === 'post') return target.item?.title || ('post #' + target.item?.skeleton_id)
  if (target.kind === 'ref') {
    const ref = String(target.ref).replace(/^pathos:/, '')
    const hash = ref.split('/').pop() || ''
    return (ref.startsWith('nodes/') ? 'node ' : 'skeleton ') + hash.slice(0, 8)
  }
  return ''
}

export function titleOf (node) {
  if (!node) return ''
  const e = node.embed
  if (e) {
    const provider = (e.provider || '').toUpperCase() ||
      (e.url || e.src || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toUpperCase()
    // A node the user named beats anything derived — that title IS the
    // answer to "what is this", and only the source has to be added to it.
    const name = node.title || webNameOf(e) || e.title || ''
    return name ? provider + ' :: ' + name : (provider || e.title || '')
  }
  return node.file?.name || node.title || ('node #' + node.id)
}
