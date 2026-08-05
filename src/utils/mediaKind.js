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
